import { action } from "./_generated/server";
import { v } from "convex/values";
import {
  extractJobIdFromEmail,
  buildBriefSummary,
  createMondayUpdate,
  createOutOfScopeNotification,
} from "./mondayHelpers";

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
