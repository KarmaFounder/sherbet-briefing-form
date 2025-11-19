// Extract job ID from Monday email
// Handles formats:
// - job-123456@sherbetagency.monday.com
// - zo-adv_pulse_5086908443_d98c14f7a796d4aafb52__73877240@euc1.mx.monday.com
export function extractJobIdFromEmail(email: string): string | null {
  // Try standard format: job-123456@
  let match = email.match(/job-(\d+)@/);
  if (match) return match[1];
  
  // Try Monday.com pulse format: pulse_5086908443_
  match = email.match(/pulse_(\d+)_/);
  if (match) return match[1];
  
  return null;
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
  try {
    // 1. Convert base64 to Blob
    const binaryString = atob(pdfBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pdfBlob = new Blob([bytes], { type: "application/pdf" });

    // 2. Construct FormData for GraphQL Multipart Request
    // Endpoint for files is /v2/file
    const query = `mutation ($updateId: ID!, $file: File!) { add_file_to_update (update_id: $updateId, file: $file) { id } }`;
    const variables = { updateId: parseInt(updateId) }; 
    const map = { "0": ["variables.file"] };

    const formData = new FormData();
    formData.append("query", query);
    formData.append("variables", JSON.stringify(variables));
    formData.append("map", JSON.stringify(map));
    formData.append("0", pdfBlob, "campaign_brief.pdf");

    const response = await fetch("https://api.monday.com/v2/file", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        // Content-Type header is automatically set by fetch for FormData
      },
      body: formData,
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error("Failed to attach PDF to Monday update:", JSON.stringify(data.errors));
    } else {
      console.log("PDF attached successfully:", data.data?.add_file_to_update?.id);
    }
  } catch (error) {
    console.error("Error in attachFileToUpdate:", error);
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
export function buildBriefSummary(briefData: any, pdfUrl?: string | null): string {
  const lines = [
    `NEW CAMPAIGN BRIEF SUBMITTED`,
    ``,
    `Campaign: ${briefData.campaign_name}`,
    `Client: ${briefData.client_name}`,
    `Brand: ${briefData.brand_name}`,
    `Priority: ${briefData.priority}`,
    `Submitted by: ${briefData.user_name}`,
    ``,
    `Summary: ${briefData.campaign_summary.substring(0, 150)}...`,
    ``,
    `Start: ${briefData.kickstart_date}`,
    `Billing: ${briefData.billing_type}`,
  ];

  if (pdfUrl) {
    lines.push(``);
    lines.push(`View full brief PDF at: ${pdfUrl}`);
  }

  return lines.join("\n");
}
