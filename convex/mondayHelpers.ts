// Extract job ID from Monday email (format: job-123456@sherbetagency.monday.com)
export function extractJobIdFromEmail(email: string): string | null {
  const match = email.match(/job-(\d+)@/);
  return match ? match[1] : null;
}

// User IDs for @mentions
export const MONDAY_USER_IDS = {
  RAFFAELE: "54174400",
  INGE: "73877160",
  NAKAI: "73877240",
  ELTON: "79772203",
} as const;

// Create update with PDF on Monday.com item
export async function createMondayUpdate(
  apiKey: string,
  itemId: string,
  briefText: string,
  pdfBase64?: string
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

  const updateId = data.data.create_update.id;

  // If PDF provided, attach it to the update
  if (pdfBase64) {
    await attachFileToUpdate(apiKey, updateId, pdfBase64);
  }

  return updateId;
}

// Attach PDF file to Monday.com update
export async function attachFileToUpdate(
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

  // Convert base64 to file format Monday expects
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
    // Don't throw - let the update succeed even if file attachment fails
  }
}

// Create Out of Scope notification update mentioning specific users
export async function createOutOfScopeNotification(
  apiKey: string,
  itemId: string,
  campaignName: string,
  submitterName: string
): Promise<void> {
  // Build @mentions for Raff, Inge, Nakai, and Elton
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

// Build brief summary text for Monday update
export function buildBriefSummary(briefData: any): string {
  const lines = [
    `📋 NEW CAMPAIGN BRIEF`,
    ``,
    `Campaign: ${briefData.campaign_name}`,
    `Client: ${briefData.client_name}`,
    `Brand: ${briefData.brand_name}`,
    `Submitted by: ${briefData.user_name}`,
    ``,
    `Priority: ${briefData.priority}`,
    briefData.budget ? `Budget: R${briefData.budget.toLocaleString()}` : `Budget: TBD`,
    ``,
    `Categories: ${briefData.categories.join(", ")}`,
    ``,
    `Campaign Summary:`,
    briefData.campaign_summary,
    ``,
    `Timeline:`,
    `• Kickstart: ${briefData.kickstart_date}`,
    `• First Review: ${briefData.first_review_date}`,
    `• Sign-off: ${briefData.sign_off_date}`,
    ``,
    `Billing: ${briefData.billing_type}`,
  ];

  return lines.join("\n");
}
