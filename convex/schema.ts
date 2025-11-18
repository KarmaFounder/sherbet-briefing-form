import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  briefs: defineTable({
    user_name: v.string(),
    // Optional extra fields to support spec (not required by initial brief)
    user_email: v.optional(v.string()),
    user_phone: v.optional(v.string()),

    client_name: v.string(),
    brand_name: v.string(),
    campaign_name: v.string(),
    requested_by: v.string(),
    job_bag_email: v.string(),

    start_date: v.string(), // ISO date
    end_date: v.string(), // ISO date

    priority: v.string(), // High, Medium, Low
    budget: v.number(),

    // Section B categories selected
    categories: v.array(v.string()),

    // TV-specific requirements (only present if "TV" category selected)
    tv_requirements: v.optional(
      v.object({
        script: v.boolean(),
        production: v.boolean(),
        storyboard: v.boolean(),
        location: v.boolean(),
        concept: v.boolean(),
        pitch: v.boolean(),
        talent: v.boolean(),
        media_buying: v.boolean(),
        research: v.boolean(),
        details: v.string(),
      }),
    ),

    // Social media specific requirements text
    social_requirements: v.optional(v.string()),

    // Generic requirements for all other categories, concatenated text
    generic_category_requirements: v.optional(v.string()),

    // Whether there are client assets and optional link
    has_assets: v.boolean(),
    asset_link: v.optional(v.string()),

    // Additional notes / references
    references: v.string(),

    // Timeline dates (ISO)
    kickstart_date: v.string(),
    first_review_date: v.string(),
    sign_off_date: v.string(),

    billing_type: v.string(), // Retainer or OutOfScope
  }),
});
