import { action } from "./_generated/server";
import { v } from "convex/values";
import { extractJobIdFromEmail, buildBriefSummary, MONDAY_USER_IDS } from "./mondayHelpers";

// Type declaration for process.env in Convex runtime
declare const process: { env: Record<string, string | undefined> };

// Action to post brief to Monday.com
export const postBriefToMonday = action({
  args: {
    briefData: v.any(), // The full brief data
    pdfBase64: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const mondayApiKey = process.env.MONDAY_API_TOKEN;
    
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
      
      // Create brief summary update
      const briefSummary = buildBriefSummary(args.briefData);
      const updateId = await createMondayUpdate(mondayApiKey, jobId, briefSummary);
      
      // Attach PDF if provided
      if (args.pdfBase64 && updateId) {
        await attachFileToUpdate(mondayApiKey, updateId, args.pdfBase64);
      }
      
      // If Out of Scope, create second update with @mentions
      if (args.briefData.billing_type === "OutOfScope") {
        console.log(`[Monday Action] Creating Out of Scope notification for job ${jobId}`);
        await createOutOfScopeNotification(
          mondayApiKey,
          jobId,
          args.briefData.campaign_name,
          args.briefData.user_name
        );
      }
      
      return { success: true, jobId, updateId };
    } catch (error) {
      console.error("[Monday Action] Error posting update:", error);
      return { success: false, message: String(error) };
    }
  },
});

// Helper function to create Monday update (now inside action)
async function createMondayUpdate(
  apiKey: string,
  itemId: string,
  briefText: string
): Promise<string> {
  const mutation = `
    mutation ($itemId: ID!, $body: String!) {
      create_update (item_id: $itemId, body: $body) {
        id
      }
    }
  `;

  const variables = {
    itemId,
    body: briefText,
  };

  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Monday API Error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.create_update.id;
}

// Helper function to attach PDF file to Monday.com update
async function attachFileToUpdate(
  apiKey: string,
  updateId: string,
  pdfBase64: string
): Promise<void> {
  const mutation = `
    mutation ($updateId: ID!, $file: File!) {
      add_file_to_update (update_id: $updateId, file: $file) {
        id
      }
    }
  `;

  const variables = {
    updateId,
    file: pdfBase64,
  };

  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  const data = await response.json();
  
  if (data.errors) {
    console.error("Failed to attach PDF to Monday update:", data.errors);
  }
}

// Helper function to create Out of Scope notification
async function createOutOfScopeNotification(
  apiKey: string,
  itemId: string,
  campaignName: string,
  submitterName: string
): Promise<void> {
  const mentions = [
    MONDAY_USER_IDS.RAFFAELE,
    MONDAY_USER_IDS.INGE,
    MONDAY_USER_IDS.NAKAI,
    MONDAY_USER_IDS.ELTON,
  ];

  const mentionsText = mentions.map(id => `@[${id}]`).join(" ");
  
  const body = `🚨 OUT OF SCOPE BRIEF\n\n${mentionsText}\n\nCampaign: ${campaignName}\nSubmitted by: ${submitterName}\n\nThis brief has been marked as Out of Scope and requires your attention.`;

  await createMondayUpdate(apiKey, itemId, body);
}
