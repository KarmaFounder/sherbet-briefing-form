// Comprehensive options for all campaign categories

export const STRATEGY_OPTIONS = [
  "Campaign strategy",
  "Content strategy",
  "Digital strategy",
  "Social media strategy",
  "Influencer strategy",
  "Brand positioning",
  "Audience segmentation",
  "Messaging framework",
  "Competitor analysis",
  "Research & insights",
] as const;

export const BRAND_DEV_OPTIONS = [
  "CI development",
  "Logo refresh",
  "CI application",
  "Tone of voice",
  "Brand toolkit",
  "Packaging design",
  "Naming/renaming",
  "Brand guidelines update",
  "Template creation",
] as const;

export const TV_DURATIONS = ["10s", "15s", "20s", "30s", "45s", "60s"] as const;

export const TV_DELIVERABLES = [
  "TVC concept",
  "Scriptwriting",
  "Storyboard",
  "Animatic",
  "Final mix",
  "Supers & legal lines",
  "Adaptations / cutdowns",
  "Location",
  "Concept",
  "Pitch",
  "Talent",
  "Media Buying",
  "Research",
] as const;

export const RADIO_DURATIONS = ["10s", "15s", "20s", "30s", "45s", "60s"] as const;

export const RADIO_DELIVERABLES = [
  "Script",
  "Voice casting",
  "Studio recording",
  "SFX/Music",
  "Final mix",
  "Adaptations",
] as const;

export const BILLBOARD_SIZES = [
  "6m x 3m",
  "3m x 6m digital",
  "12m x 3m",
  "Portrait Digital",
  "Mega board",
  "Street pole ad",
  "Bus shelter",
  "Mall digital screen",
  "Taxi rank digital",
] as const;

export const BILLBOARD_DELIVERABLES = [
  "Static artwork",
  "Digital animated artwork",
  "Multiple language versions",
] as const;

export const PRINT_SIZES = [
  "A5",
  "A4",
  "A3",
  "A2",
  "A1",
  "A0",
  "Magazine full page",
  "Magazine half page",
  "Brochure (bi-fold/tri-fold)",
] as const;

export const PRINT_DELIVERABLES = [
  "Print-ready artwork",
  "Bleed/no bleed options",
  "Multiple language versions",
] as const;

export const BRAND_VIDEO_DURATIONS = [
  "6s",
  "10s",
  "15s",
  "20s",
  "30s",
  "45s",
  "60s",
  "90s+",
] as const;

export const BRAND_VIDEO_DELIVERABLES = [
  "Brand film",
  "Corporate video",
  "Product video",
  "Animation",
  "Motion graphics",
  "Cutdowns",
  "Subtitled versions",
  "Aspect ratios: 16:9 / 9:16 / 1:1",
] as const;

export const PHOTOGRAPHY_TYPES = [
  "Product shoot",
  "Lifestyle shoot",
  "Studio shoot",
  "Event shoot",
  "Flatlays",
  "Social content shoot",
] as const;

export const PHOTOGRAPHY_DELIVERABLES = [
  "Edited stills",
  "RAW files",
  "Cut-outs",
  "High-res / Web-res",
  "Retouching",
] as const;

export const PR_OPTIONS = [
  "Press release",
  "Media alert",
  "Media list build",
  "Media drops",
  "Influencer seeding",
  "Event PR",
  "Thought leadership",
  "Reputation management",
  "Reactive PR",
] as const;

export const INFLUENCER_OPTIONS = [
  "Influencer strategy",
  "Talent sourcing",
  "Talent vetting",
  "Contracting",
  "Brief development",
  "Content approvals",
  "Campaign management",
  "Reporting",
  "Usage rights management",
] as const;

export const ACTIVATION_OPTIONS = [
  "In-store",
  "Mall",
  "Roadshow",
  "Sampling",
  "Pop-up installation",
  "Event design",
  "Event staffing",
  "Logistics & production",
  "Permits",
] as const;

export const DIGITAL_OPTIONS = [
  "Display banners",
  "HTML5 animations",
  "Rich media",
  "Google ads (PPC)",
  "Emailers",
  "CRM journeys",
  "SEO",
  "SEM",
  "Remarketing creatives",
] as const;

export const DIGITAL_BANNER_SIZES = [
  "300x250",
  "728x90",
  "300x600",
  "160x600",
  "970x250",
  "1080x1920 (mobile)",
] as const;

export const APP_BUILD_OPTIONS = [
  "Web app",
  "Mobile app",
  "API integration",
  "Wireframes",
  "UI/UX",
  "User testing",
  "QA & bug fixes",
  "Launch support",
] as const;

export const WEBSITE_OPTIONS = [
  "Landing page",
  "Multi-page website",
  "Website refresh",
  "Wireframes",
  "UI/UX",
  "Development",
  "SEO setup",
  "Copywriting",
  "CMS build",
] as const;

export const OTHER_OPTIONS = [
  "Internal comms",
  "Presentations",
  "Pitch decks",
  "Training materials",
  "Templates",
  "Merchandise",
  "Packaging",
  "POS",
] as const;

// Social Media hierarchical data: Platform → Formats → Sizes
export const SOCIAL_MEDIA_PLATFORMS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Twitter / X",
  "LinkedIn",
  "Pinterest",
  "Snapchat",
  "Threads",
  "WhatsApp (Business)",
] as const;

export const SOCIAL_MEDIA_FORMATS: Record<string, readonly string[]> = {
  Instagram: ["Static Posts", "Carousels", "Reels", "Stories"],
  Facebook: ["Static", "Carousels", "Video", "Facebook Stories"],
  TikTok: ["Videos", "Thumbnails"],
  YouTube: ["Thumbnails", "YouTube Shorts", "Standard Video"],
  "Twitter / X": ["Static", "Header", "Card Ads"],
  LinkedIn: ["Static", "Carousel Ads", "Video", "Cover photo"],
  Pinterest: ["Pins", "Video Pins"],
  Snapchat: ["Snap Ads / Organic"],
  Threads: ["Static", "Video"],
  "WhatsApp (Business)": ["Status", "Catalogue Images"],
};

export const SOCIAL_MEDIA_SIZES: Record<string, Record<string, readonly string[]>> = {
  Instagram: {
    "Static Posts": [
      "1080 × 1080 (Square)",
      "1080 × 1350 (Portrait)",
      "1080 × 608 (Landscape)",
      "1242 × 1242 (High-res Square)",
      "1350 × 1080 (Portrait alt)",
      "2048 × 2048 (Max-quality Square)",
    ],
    Carousels: ["1080 × 1080", "1080 × 1350", "1080 × 608"],
    Reels: ["1080 × 1920", "Thumbnail: 1080 × 1080"],
    Stories: ["1080 × 1920", "Safe zone: 1080 × 1420", "Story Ads: 1080 × 1920"],
  },
  Facebook: {
    Static: [
      "1080 × 1080",
      "1200 × 630 (Link post)",
      "1200 × 1200",
      "1200 × 1500 (Portrait)",
    ],
    Carousels: ["1080 × 1080", "1200 × 1200"],
    Video: [
      "1080 × 1350",
      "1080 × 1080",
      "1920 × 1080",
      "1080 × 1920",
      "Thumbnail: 1200 × 675",
    ],
    "Facebook Stories": ["1080 × 1920"],
  },
  TikTok: {
    Videos: ["1080 × 1920", "Safe zone: Top 150px, Bottom 250px"],
    Thumbnails: ["1080 × 1920", "Cover crop: 1080 × 720 (Top third)"],
  },
  YouTube: {
    Thumbnails: ["1280 × 720"],
    "YouTube Shorts": ["1080 × 1920", "Safe zone: 1080 × 1420"],
    "Standard Video": ["1920 × 1080", "3840 × 2160 (4K)"],
  },
  "Twitter / X": {
    Static: ["1200 × 675", "1600 × 900", "1080 × 1080"],
    Header: ["1500 × 500"],
    "Card Ads": ["800 × 418", "800 × 800"],
  },
  LinkedIn: {
    Static: ["1200 × 1200", "1200 × 627", "1080 × 1080"],
    "Carousel Ads": ["1080 × 1080"],
    Video: ["1920 × 1080", "1080 × 1080"],
    "Cover photo": ["1584 × 396"],
  },
  Pinterest: {
    Pins: ["1000 × 1500 (2:3)", "1000 × 2100 (Long Pin)"],
    "Video Pins": ["1080 × 1920"],
  },
  Snapchat: {
    "Snap Ads / Organic": ["1080 × 1920", "Safe zone: top & bottom 150px"],
  },
  Threads: {
    Static: ["1080 × 1080", "1080 × 1350", "1080 × 608"],
    Video: ["1080 × 1350", "1080 × 1080", "1920 × 1080"],
  },
  "WhatsApp (Business)": {
    Status: ["1080 × 1920"],
    "Catalogue Images": ["1080 × 1080"],
  },
};
