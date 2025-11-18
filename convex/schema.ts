import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  briefs: defineTable({
    user_name: v.string(),
    user_email: v.optional(v.string()),
    user_phone: v.optional(v.string()),

    client_name: v.string(),
    brand_name: v.string(),
    campaign_name: v.string(),
    campaign_summary: v.string(),
    requested_by: v.string(),
    job_bag_email: v.string(),

    start_date: v.string(),
    end_date: v.string(),

    priority: v.string(),
    budget: v.optional(v.number()),

    categories: v.array(v.string()),

    // Category-specific structures
    strategy_options: v.optional(v.array(v.string())),
    strategy_details: v.optional(v.string()),
    brand_dev_options: v.optional(v.array(v.string())),
    brand_dev_details: v.optional(v.string()),

    tv_durations: v.optional(v.array(v.string())),
    tv_deliverables: v.optional(v.array(v.string())),
    tv_details: v.optional(v.string()),

    radio_durations: v.optional(v.array(v.string())),
    radio_deliverables: v.optional(v.array(v.string())),
    radio_details: v.optional(v.string()),

    billboard_sizes: v.optional(v.array(v.string())),
    billboard_deliverables: v.optional(v.array(v.string())),
    billboard_details: v.optional(v.string()),

    print_sizes: v.optional(v.array(v.string())),
    print_deliverables: v.optional(v.array(v.string())),
    print_details: v.optional(v.string()),

    brand_video_durations: v.optional(v.array(v.string())),
    brand_video_deliverables: v.optional(v.array(v.string())),
    brand_video_details: v.optional(v.string()),

    photography_types: v.optional(v.array(v.string())),
    photography_deliverables: v.optional(v.array(v.string())),
    photography_details: v.optional(v.string()),

    pr_options: v.optional(v.array(v.string())),
    pr_details: v.optional(v.string()),

    influencer_options: v.optional(v.array(v.string())),
    influencer_details: v.optional(v.string()),

    activation_options: v.optional(v.array(v.string())),
    activation_details: v.optional(v.string()),

    digital_options: v.optional(v.array(v.string())),
    digital_sizes: v.optional(v.array(v.string())),
    digital_details: v.optional(v.string()),

    app_build_options: v.optional(v.array(v.string())),
    app_build_details: v.optional(v.string()),

    website_options: v.optional(v.array(v.string())),
    website_details: v.optional(v.string()),

    other_options: v.optional(v.array(v.string())),
    other_details: v.optional(v.string()),

    // Social Media: array of items (platform/format/size/quantity/descriptions)
    social_media_items: v.optional(
      v.array(
        v.object({
          platform: v.string(),
          format: v.string(),
          size: v.string(),
          quantity: v.number(),
          descriptions: v.array(v.string()),
        }),
      ),
    ),

    has_assets: v.boolean(),
    asset_link: v.optional(v.string()),

    other_requirements: v.optional(v.string()),
    references: v.string(),

    kickstart_date: v.string(),
    first_review_date: v.string(),
    sign_off_date: v.string(),

    billing_type: v.string(),
  }),
});
