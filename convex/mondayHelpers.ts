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

// Build full brief text for Monday update (no PDF links)
export function buildBriefSummary(briefData: any): string {
  const lines: string[] = [];

  const pushIfValue = (label: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    lines.push(`${label}: ${String(value)}`);
  };

  const pushList = (label: string, values?: string[]) => {
    if (!values || values.length === 0) return;
    lines.push(`${label}: ${values.join(", ")}`);
  };

  lines.push("NEW CAMPAIGN BRIEF SUBMITTED");
  lines.push("");

  // Overview
  lines.push("=== Overview ===");
  pushIfValue("Campaign", briefData.campaign_name);
  pushIfValue("Client", briefData.client_name);
  pushIfValue("Brand", briefData.brand_name);
  pushIfValue("Requested by", briefData.requested_by);
  pushIfValue("Submitted by", briefData.user_name);
  pushIfValue("Submitter email", briefData.user_email);
  pushIfValue("Submitter phone", briefData.user_phone);
  pushIfValue("Job bag email", briefData.job_bag_email);
  lines.push("");

  // Helper to format ISO date strings to YYYY-MM-DD
  const formatDate = (isoString: any) => {
    if (!isoString || typeof isoString !== "string") return isoString;
    // Take the first 10 characters (YYYY-MM-DD)
    return isoString.slice(0, 10);
  };

  // Timing & priority
  lines.push("=== Timing & Priority ===");
  pushIfValue("Campaign start", formatDate(briefData.start_date));
  pushIfValue("Campaign end", formatDate(briefData.end_date));
  pushIfValue("Kickstart", formatDate(briefData.kickstart_date));
  pushIfValue("First review", formatDate(briefData.first_review_date));
  pushIfValue("Sign-off deadline", formatDate(briefData.sign_off_date));
  pushIfValue("Priority", briefData.priority);
  pushIfValue("Budget", briefData.budget);
  pushIfValue("Billing type", briefData.billing_type);
  lines.push("");

  // Summary
  lines.push("=== Campaign Summary ===");
  if (briefData.campaign_summary) {
    lines.push(String(briefData.campaign_summary));
  }
  lines.push("");

  // Categories
  lines.push("=== Categories Required ===");
  pushList("Categories", briefData.categories);
  lines.push("");

  // Per-category details
  const section = (title: string, builder: () => void) => {
    const before = lines.length;
    builder();
    if (lines.length > before) {
      lines.splice(before, 0, `--- ${title} ---`);
      lines.push("");
    }
  };

  section("Strategy", () => {
    pushList("Options", briefData.strategy_options);
    pushIfValue("Details", briefData.strategy_details);
  });

  section("Brand Development", () => {
    pushList("Options", briefData.brand_dev_options);
    pushIfValue("Details", briefData.brand_dev_details);
  });

  section("TV", () => {
    pushList("Durations", briefData.tv_durations);
    pushList("Deliverables", briefData.tv_deliverables);
    pushIfValue("Details", briefData.tv_details);
  });

  section("Radio", () => {
    pushList("Durations", briefData.radio_durations);
    pushList("Deliverables", briefData.radio_deliverables);
    pushIfValue("Details", briefData.radio_details);
  });

  section("Billboard", () => {
    pushList("Sizes", briefData.billboard_sizes);
    pushList("Deliverables", briefData.billboard_deliverables);
    pushIfValue("Details", briefData.billboard_details);
  });

  section("Print", () => {
    pushList("Sizes", briefData.print_sizes);
    pushList("Deliverables", briefData.print_deliverables);
    pushIfValue("Details", briefData.print_details);
  });

  section("Brand Video", () => {
    pushList("Durations", briefData.brand_video_durations);
    pushList("Deliverables", briefData.brand_video_deliverables);
    pushIfValue("Details", briefData.brand_video_details);
  });

  section("Photography", () => {
    pushList("Types", briefData.photography_types);
    pushList("Deliverables", briefData.photography_deliverables);
    pushIfValue("Details", briefData.photography_details);
  });

  section("PR", () => {
    pushList("Options", briefData.pr_options);
    pushIfValue("Details", briefData.pr_details);
  });

  section("Influencer", () => {
    pushList("Options", briefData.influencer_options);
    pushIfValue("Details", briefData.influencer_details);
  });

  section("Activation", () => {
    pushList("Options", briefData.activation_options);
    pushIfValue("Details", briefData.activation_details);
  });

  section("Digital", () => {
    pushList("Options", briefData.digital_options);
    pushList("Banner sizes", briefData.digital_sizes);
    pushIfValue("Details", briefData.digital_details);
  });

  section("Application Build", () => {
    pushList("Options", briefData.app_build_options);
    pushIfValue("Details", briefData.app_build_details);
  });

  section("Website", () => {
    pushList("Options", briefData.website_options);
    pushIfValue("Details", briefData.website_details);
  });

  section("Other", () => {
    pushList("Options", briefData.other_options);
    pushIfValue("Details", briefData.other_details);
  });

  // Social media items
  if (briefData.social_media_items && briefData.social_media_items.length > 0) {
    lines.push("=== Social Media Items ===");
    briefData.social_media_items.forEach((item: any, index: number) => {
      lines.push(`Item ${index + 1}: ${item.platform} - ${item.format} - ${item.size} (Qty: ${item.quantity})`);
      if (item.descriptions && item.descriptions.length > 0) {
        item.descriptions.forEach((desc: string, idx: number) => {
          if (desc) {
            lines.push(`  - Variant ${idx + 1}: ${desc}`);
          }
        });
      }
    });
    lines.push("");
  }

  // Additional information
  lines.push("=== Additional Information ===");
  if (briefData.has_assets !== undefined) {
    lines.push(`Assets from client: ${briefData.has_assets ? "Yes" : "No"}`);
  }
  pushIfValue("Asset link", briefData.asset_link);
  pushIfValue("Other requirements", briefData.other_requirements);
  pushIfValue("References", briefData.references);

  return lines.join("\n");
}
