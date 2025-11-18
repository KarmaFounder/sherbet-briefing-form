import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitBrief = mutation({
  args: {
    user_name: v.string(),
    user_email: v.optional(v.string()),
    user_phone: v.optional(v.string()),

    client_name: v.string(),
    brand_name: v.string(),
    campaign_name: v.string(),
    requested_by: v.string(),
    job_bag_email: v.string(),

    start_date: v.string(),
    end_date: v.string(),

    priority: v.string(),
    budget: v.number(),

    categories: v.array(v.string()),

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

    social_requirements: v.optional(v.string()),
    generic_category_requirements: v.optional(v.string()),

    has_assets: v.boolean(),
    asset_link: v.optional(v.string()),

    references: v.string(),

    kickstart_date: v.string(),
    first_review_date: v.string(),
    sign_off_date: v.string(),

    billing_type: v.string(), // "Retainer" | "OutOfScope"
  },
  handler: async (ctx, args) => {
    // TODO: Additional cross-field validation can be added here if needed.

    if (args.billing_type === "OutOfScope") {
      // TODO: Trigger SendGrid email to management (Inge, Raff, Lara, Nalize)
      console.log("OutOfScope brief submitted, notify management");
    }

    const id = await ctx.db.insert("briefs", args);
    return id;
  },
});
