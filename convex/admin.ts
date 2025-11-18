import { query } from "./_generated/server";

export const getAllBriefs = query({
  args: {},
  handler: async (ctx) => {
    const briefs = await ctx.db.query("briefs").collect();
    return briefs;
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const briefs = await ctx.db.query("briefs").collect();
    
    // Count briefs per user
    const userCounts: Record<string, number> = {};
    briefs.forEach((brief) => {
      userCounts[brief.user_name] = (userCounts[brief.user_name] || 0) + 1;
    });
    
    // Convert to array and sort
    const userStats = Object.entries(userCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return userStats;
  },
});

export const getBriefMetrics = query({
  args: {},
  handler: async (ctx) => {
    const briefs = await ctx.db.query("briefs").collect();
    
    const totalBriefs = briefs.length;
    const retainerBriefs = briefs.filter(b => b.billing_type === "Retainer").length;
    const outOfScopeBriefs = briefs.filter(b => b.billing_type === "OutOfScope").length;
    
    // Category counts
    const categoryCounts: Record<string, number> = {};
    briefs.forEach((brief) => {
      brief.categories.forEach((cat) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });
    
    // Priority counts
    const priorityCounts: Record<string, number> = {};
    briefs.forEach((brief) => {
      priorityCounts[brief.priority] = (priorityCounts[brief.priority] || 0) + 1;
    });
    
    // Total budget (only count briefs with budget)
    const totalBudget = briefs.reduce((sum, brief) => {
      return sum + (brief.budget || 0);
    }, 0);
    
    const briefsWithBudget = briefs.filter(b => b.budget && b.budget > 0).length;
    
    return {
      totalBriefs,
      retainerBriefs,
      outOfScopeBriefs,
      categoryCounts,
      priorityCounts,
      totalBudget,
      briefsWithBudget,
      averageBudget: briefsWithBudget > 0 ? Math.round(totalBudget / briefsWithBudget) : 0,
    };
  },
});
