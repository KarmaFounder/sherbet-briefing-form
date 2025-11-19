import { action } from "./_generated/server";
import { v } from "convex/values";
// IMPORT the full-featured functions from your helper file
import { 
  extractJobIdFromEmail, 
  buildBriefSummary, 
  createMondayUpdate, 
  createOutOfScopeNotification 
} from "./mondayHelpers";

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
      
      // 1. Store PDF in Convex storage (Optional backup)
      let pdfUrl = null;
      if (args.pdfBase64) {
        pdfUrl = await storePdfAndGetUrl(ctx, args.pdfBase64);
        console.log(`[Monday Action] PDF stored at: ${pdfUrl}`);
      }
      
      // 2. Create brief summary text
      // We pass the pdfUrl so it can be included in the text body if you wish
      const briefSummary = buildBriefSummary(args.briefData, pdfUrl);
      
      // 3. Create Update AND Attach PDF
      // This uses the helper from mondayHelpers.ts which handles the file attachment logic
      const updateId = await createMondayUpdate(
        mondayApiKey, 
        jobId, 
        briefSummary, 
        args.pdfBase64
      );
      
      console.log(`[Monday Action] Successfully created update ${updateId}`);
      
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

// Store PDF in Convex storage and return URL
async function storePdfAndGetUrl(
  ctx: any,
  pdfBase64: string
): Promise<string> {
  // Convert base64 to blob
  const byteCharacters = atob(pdfBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  
  // Upload to Convex storage
  const storageId = await ctx.storage.store(blob);
  
  // Get public URL
  const url = await ctx.storage.getUrl(storageId);
  
  return url;
}
