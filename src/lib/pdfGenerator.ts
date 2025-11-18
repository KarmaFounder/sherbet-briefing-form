import jsPDF from "jspdf";

interface BriefData {
  user_name: string;
  user_email?: string;
  user_phone?: string;
  client_name: string;
  brand_name: string;
  campaign_name: string;
  campaign_summary: string;
  requested_by: string;
  job_bag_email: string;
  start_date: string;
  end_date: string;
  priority: string;
  budget?: string;
  categories: string[];
  strategy_options?: string[];
  strategy_details?: string;
  brand_dev_options?: string[];
  brand_dev_details?: string;
  tv_durations?: string[];
  tv_deliverables?: string[];
  tv_details?: string;
  radio_durations?: string[];
  radio_deliverables?: string[];
  radio_details?: string;
  billboard_sizes?: string[];
  billboard_deliverables?: string[];
  billboard_details?: string;
  print_sizes?: string[];
  print_deliverables?: string[];
  print_details?: string;
  brand_video_durations?: string[];
  brand_video_deliverables?: string[];
  brand_video_details?: string;
  photography_types?: string[];
  photography_deliverables?: string[];
  photography_details?: string;
  pr_options?: string[];
  pr_details?: string;
  influencer_options?: string[];
  influencer_details?: string;
  activation_options?: string[];
  activation_details?: string;
  digital_options?: string[];
  digital_sizes?: string[];
  digital_details?: string;
  app_build_options?: string[];
  app_build_details?: string;
  website_options?: string[];
  website_details?: string;
  other_options?: string[];
  other_details?: string;
  social_media_items?: Array<{
    platform: string;
    format: string;
    size: string;
    quantity: number;
    descriptions: string[];
  }>;
  has_assets: boolean;
  asset_link?: string;
  other_requirements?: string;
  references: string;
  kickstart_date: string;
  first_review_date: string;
  sign_off_date: string;
  billing_type: string;
}

export function generateBriefPDF(data: BriefData) {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 7;

  // Load logo image
  const logoImg = new Image();
  logoImg.src = '/Sherbet Blue Logo.png';
  
  // Helper function to add logo to current page
  const addLogo = () => {
    try {
      // Add logo at top right with correct aspect ratio
      // Sherbet logo is approximately 3:1 aspect ratio (width:height)
      const logoWidth = 35;
      const logoHeight = logoWidth / 3; // Maintain aspect ratio
      const logoX = pageWidth - margin - logoWidth;
      const logoY = 10;
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  };

  // Helper functions
  const checkPageBreak = () => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      addLogo(); // Add logo to new page
    }
  };

  const addTitle = (title: string) => {
    checkPageBreak();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 10;
  };

  const addSectionHeader = (header: string) => {
    checkPageBreak();
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(header, margin, yPos);
    yPos += 8;
  };

  const addField = (label: string, value: string | undefined, indent = 0) => {
    if (!value) return;
    checkPageBreak();
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin + indent, yPos);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, contentWidth - indent - 40);
    doc.text(lines, margin + indent + 40, yPos);
    yPos += lines.length * lineHeight;
  };

  const addList = (label: string, items: string[] | undefined, indent = 0) => {
    if (!items || items.length === 0) return;
    checkPageBreak();
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin + indent, yPos);
    yPos += lineHeight;
    doc.setFont("helvetica", "normal");
    items.forEach((item) => {
      checkPageBreak();
      doc.text("• " + item, margin + indent + 5, yPos);
      yPos += lineHeight;
    });
  };

  // Add logo to first page
  addLogo();
  
  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CAMPAIGN BRIEF", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Campaign Overview
  addTitle("Campaign Overview");
  addField("Campaign Name", data.campaign_name);
  addField("Client", data.client_name);
  addField("Brand", data.brand_name);
  addField("Requested By", data.requested_by);
  addField("Submitted By", data.user_name);
  if (data.user_email) addField("Email", data.user_email);
  if (data.user_phone) addField("Phone", data.user_phone);
  addField("Job Bag Email", data.job_bag_email);
  yPos += 5;

  addField("Campaign Summary", data.campaign_summary);
  yPos += 5;

  addField("Start Date", data.start_date);
  addField("End Date", data.end_date);
  addField("Priority", data.priority);
  addField("Budget", data.budget);
  addField("Billing", data.billing_type);
  yPos += 10;

  // Categories
  addSectionHeader("Categories Required");
  addList("", data.categories);
  yPos += 5;

  // Category Details
  if (data.strategy_options && data.strategy_options.length > 0) {
    addSectionHeader("Strategy");
    addList("Options", data.strategy_options);
    addField("Details", data.strategy_details);
  }

  if (data.brand_dev_options && data.brand_dev_options.length > 0) {
    addSectionHeader("Brand Development");
    addList("Options", data.brand_dev_options);
    addField("Details", data.brand_dev_details);
  }

  if (data.tv_durations && data.tv_durations.length > 0) {
    addSectionHeader("TV");
    addList("Durations", data.tv_durations);
    addList("Deliverables", data.tv_deliverables);
    addField("Details", data.tv_details);
  }

  if (data.radio_durations && data.radio_durations.length > 0) {
    addSectionHeader("Radio");
    addList("Durations", data.radio_durations);
    addList("Deliverables", data.radio_deliverables);
    addField("Details", data.radio_details);
  }

  if (data.billboard_sizes && data.billboard_sizes.length > 0) {
    addSectionHeader("Billboard");
    addList("Sizes", data.billboard_sizes);
    addList("Deliverables", data.billboard_deliverables);
    addField("Details", data.billboard_details);
  }

  if (data.print_sizes && data.print_sizes.length > 0) {
    addSectionHeader("Print");
    addList("Sizes", data.print_sizes);
    addList("Deliverables", data.print_deliverables);
    addField("Details", data.print_details);
  }

  if (data.brand_video_durations && data.brand_video_durations.length > 0) {
    addSectionHeader("Brand Video");
    addList("Durations", data.brand_video_durations);
    addList("Deliverables", data.brand_video_deliverables);
    addField("Details", data.brand_video_details);
  }

  if (data.photography_types && data.photography_types.length > 0) {
    addSectionHeader("Photography");
    addList("Types", data.photography_types);
    addList("Deliverables", data.photography_deliverables);
    addField("Details", data.photography_details);
  }

  if (data.pr_options && data.pr_options.length > 0) {
    addSectionHeader("PR");
    addList("Options", data.pr_options);
    addField("Details", data.pr_details);
  }

  if (data.influencer_options && data.influencer_options.length > 0) {
    addSectionHeader("Influencer");
    addList("Options", data.influencer_options);
    addField("Details", data.influencer_details);
  }

  if (data.activation_options && data.activation_options.length > 0) {
    addSectionHeader("Activation");
    addList("Options", data.activation_options);
    addField("Details", data.activation_details);
  }

  if (data.digital_options && data.digital_options.length > 0) {
    addSectionHeader("Digital");
    addList("Options", data.digital_options);
    addList("Banner Sizes", data.digital_sizes);
    addField("Details", data.digital_details);
  }

  if (data.app_build_options && data.app_build_options.length > 0) {
    addSectionHeader("Application Build");
    addList("Options", data.app_build_options);
    addField("Details", data.app_build_details);
  }

  if (data.website_options && data.website_options.length > 0) {
    addSectionHeader("Website");
    addList("Options", data.website_options);
    addField("Details", data.website_details);
  }

  if (data.other_options && data.other_options.length > 0) {
    addSectionHeader("Other");
    addList("Options", data.other_options);
    addField("Details", data.other_details);
  }

  if (data.social_media_items && data.social_media_items.length > 0) {
    addSectionHeader("Social Media");
    data.social_media_items.forEach((item) => {
      checkPageBreak();
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${item.platform} - ${item.format} - ${item.size} (Qty: ${item.quantity})`,
        margin + 5,
        yPos
      );
      yPos += lineHeight;
      
      // Parse dimensions and draw a visual rectangle
      const sizeMatch = item.size.match(/(\d+)\s*[x×]\s*(\d+)/);
      if (sizeMatch) {
        const width = parseInt(sizeMatch[1]);
        const height = parseInt(sizeMatch[2]);
        // Scale to fit on page (max 40mm width)
        const maxWidth = 40;
        const scale = Math.min(maxWidth / width, 1);
        const rectWidth = width * scale * 0.1; // Convert px to mm approximately
        const rectHeight = height * scale * 0.1;
        
        // Draw rectangle to visualize size
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin + 10, yPos, rectWidth, rectHeight, 'FD');
        
        // Add dimensions label
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`${width}×${height}px`, margin + 10 + rectWidth / 2, yPos + rectHeight / 2, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        
        yPos += Math.max(rectHeight + 5, lineHeight);
      }
      
      doc.setFont("helvetica", "normal");
      item.descriptions.forEach((desc, descIdx) => {
        if (desc) {
          checkPageBreak();
          doc.text(`Item ${descIdx + 1}: ${desc}`, margin + 10, yPos);
          yPos += lineHeight;
        }
      });
      yPos += 3;
    });
  }

  // Additional Information
  yPos += 5;
  addSectionHeader("Additional Information");
  addField("Assets Available", data.has_assets ? "Yes" : "No");
  if (data.has_assets && data.asset_link) {
    addField("Asset Link", data.asset_link);
  }
  addField("Other Requirements", data.other_requirements);
  addField("References", data.references);
  yPos += 5;

  // Timeline
  addSectionHeader("Timeline");
  addField("Kickstart Date", data.kickstart_date);
  addField("First Review Date", data.first_review_date);
  addField("Sign-off Deadline", data.sign_off_date);

  // Footer
  checkPageBreak();
  yPos = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    pageWidth / 2,
    yPos,
    { align: "center" }
  );

  // Save
  const filename = `Campaign_Brief_${data.campaign_name.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
  
  // Return base64 for backend upload
  return doc.output('datauristring').split(',')[1]; // Returns base64 string without data:application/pdf;base64, prefix
}
