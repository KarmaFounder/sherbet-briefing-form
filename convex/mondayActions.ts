import { action } from "./_generated/server";
import { v } from "convex/values";
import {
  extractJobIdFromEmail,
  buildBriefSummary,
  createMondayUpdate,
  createOutOfScopeNotification,
  createMondaySubitem,
  updateMondayColumnValue,
} from "./mondayHelpers";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Type declaration for process.env in Convex runtime
declare const process: { env: Record<string, string | undefined> };

// Action to post brief to Monday.com
export const postBriefToMonday = action({
  args: {
    briefData: v.any(), // The full brief data
  },
  handler: async (_ctx, args) => {
    const mondayApiKey = process.env.MONDAY_API_TOKEN;
    const googleWebhookUrl = process.env.GOOGLE_WEBHOOK_URL; // Optional: Google Apps Script webhook

    if (!mondayApiKey || !args.briefData.job_bag_email) {
      console.log("[Monday Action] API key or job bag email not provided");
      return { success: false, message: "API key or job bag email not provided" };
    }

    // Extract job ID from email
    const jobId = extractJobIdFromEmail(args.briefData.job_bag_email);

    if (!jobId) {
      console.log(`[Monday Action] Could not extract job ID from email: ${args.briefData.job_bag_email}`);
      return { success: false, message: "Could not extract job ID from email" };
    }

    try {
      console.log(`[Monday Action] Posting update to job ${jobId}`);

      // Create Monday update containing the full brief (no PDF attachment)
      const briefSummary = buildBriefSummary(args.briefData);
      const updateId = await createMondayUpdate(mondayApiKey, jobId, briefSummary);

      console.log(`[Monday Action] Successfully created update ${updateId}`);

      // Generate structured subitems using Gemini and create them as Monday subitems
      try {
        await generateSubitemsForBrief({
          mondayApiKey,
          jobId,
          briefData: args.briefData,
        });
      } catch (error) {
        console.error("[Monday Action] Failed to generate or create subitems:", error);
      }

      // Optionally notify Google Apps Script webhook so it can email the user
      if (googleWebhookUrl && args.briefData.user_email) {
        try {
          await sendGoogleWebhook(googleWebhookUrl, {
            jobId,
            jobBagEmail: args.briefData.job_bag_email,
            campaignName: args.briefData.campaign_name,
            clientName: args.briefData.client_name,
            brandName: args.briefData.brand_name,
            userName: args.briefData.user_name,
            userEmail: args.briefData.user_email,
            submittedAt: new Date().toISOString(),
          });
          console.log("[Monday Action] Notified Google webhook about submitted brief");
        } catch (error) {
          console.error("[Monday Action] Failed to notify Google webhook:", error);
        }
      }

      // If Out of Scope, create second update with @mentions
      if (args.briefData.billing_type === "OutOfScope") {
        console.log(`[Monday Action] Creating Out of Scope notification for job ${jobId}`);
        await createOutOfScopeNotification(
          mondayApiKey,
          jobId,
          args.briefData.campaign_name,
          args.briefData.user_name,
        );
      }

      return { success: true, jobId, updateId };
    } catch (error) {
      console.error("[Monday Action] Error posting update:", error);
      return { success: false, message: String(error) };
    }
  },
});

// Action to log the time when a task enters Internal Review stage
// This is intended to be called from a Monday.com automation/webhook that
// triggers specifically when the task stage column is set to "Internal Review".
export const logInternalReviewTime = action({
  args: {
    itemId: v.string(),
  },
  handler: async (_ctx, args) => {
    const mondayApiKey = process.env.MONDAY_API_TOKEN;
    // Hard-coded column ID for the "Internal Review Log" column on the subitems board
    const logColumnId = "date_mky114j6";

    if (!mondayApiKey) {
      console.log("[Monday Action] Missing MONDAY_API_TOKEN");
      return { success: false, message: "Missing Monday API configuration" };
    }

    const timestamp = new Date().toISOString();

    try {
      await updateMondayColumnValue(mondayApiKey, args.itemId, logColumnId, timestamp);
      console.log(
        `[Monday Action] Logged Internal Review timestamp ${timestamp} to column ${logColumnId} for item ${args.itemId}`,
      );
      return { success: true, itemId: args.itemId, timestamp };
    } catch (error) {
      console.error("[Monday Action] Failed to update Internal Review Log column:", error);
      return { success: false, message: String(error) };
    }
  },
});

// Helper to POST payload to Google Apps Script webhook
async function sendGoogleWebhook(url: string, payload: unknown): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

// --- Gemini-powered subitem generation ---

type GeneratedSubitem = {
  title: string;
  description?: string;
};

async function generateSubitemsForBrief(params: {
  mondayApiKey: string;
  jobId: string;
  briefData: any;
}): Promise<void> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.log("[Monday Action] GEMINI_API_KEY not set; skipping subitem generation.");
    return;
  }

  console.log("[Monday Action] Starting Gemini subitem generation for job", params.jobId);

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  console.log("[Monday Action] Using Gemini model", modelName);

  const client = new GoogleGenerativeAI(geminiApiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const briefSummary = buildBriefSummary(params.briefData);

  const systemInstruction =
    "You are a project management assistant for a creative agency using Monday.com. " +
    "Given a detailed campaign brief, break it down into a concise list of execution tasks " +
    "that should be created as subitems under the parent Monday item. " +
    "Focus on concrete executional work (e.g. writing, design, production, rollout steps). " +
    "Do NOT create subitems for generic workflow stages such as internal review, internal QA, or final client sign-off, " +
    "as these are already handled via the board's status/labels. " +
    "Each task must have a short, action-oriented title and an optional longer description. " +
    "Return ONLY valid JSON matching this TypeScript type: { subitems: { title: string; description?: string }[] }.";

  const prompt = [
    systemInstruction,
    "",
    "Brief:",
    "" + briefSummary,
  ].join("\n");

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();

  let parsed: { subitems: GeneratedSubitem[] } | null = null;
  try {
    parsed = JSON.parse(text) as { subitems: GeneratedSubitem[] };
  } catch (error) {
    console.error("[Monday Action] Failed to parse Gemini JSON for subitems:", error, text);
    return;
  }

  if (!parsed.subitems || parsed.subitems.length === 0) {
    console.log("[Monday Action] Gemini returned no subitems; skipping creation.");
    return;
  }

  // Filter out redundant workflow-stage tasks like internal review / final sign-off
  const bannedPatterns = [
    /internal review/i,
    /internal (qa|q\.a\.)/i,
    /internal sign[- ]?off/i,
    /final (project )?sign[- ]?off/i,
    /client sign[- ]?off/i,
  ];

  const filtered = parsed.subitems.filter((sub) => {
    if (!sub.title) return false;
    return !bannedPatterns.some((re) => re.test(sub.title));
  });

  if (filtered.length === 0) {
    console.log("[Monday Action] All Gemini subitems were filtered out as workflow-stage tasks; skipping creation.");
    return;
  }

  // Cap the number of subitems we create in Monday to avoid overloading the board.
  const subitems = filtered.slice(0, 10);
  if (filtered.length > subitems.length) {
    console.log(
      `[Monday Action] Capping Gemini subitems from ${filtered.length} to ${subitems.length} for job ${params.jobId}`,
    );
  }

  for (const sub of subitems) {
    if (!sub.title) continue;
    try {
      const subitemId = await createMondaySubitem(
        params.mondayApiKey,
        params.jobId,
        sub.title,
        sub.description,
      );
      console.log(`[Monday Action] Created subitem ${subitemId} for job ${params.jobId}`);
    } catch (error) {
      console.error("[Monday Action] Error creating Monday subitem:", error);
    }
  }
}
