import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminDashboard({ onClose }: { onClose: () => void }) {
  const userStats = useQuery(api.admin.getUserStats);
  const metrics = useQuery(api.admin.getBriefMetrics);
  const allBriefs = useQuery(api.admin.getAllBriefs);

  if (!userStats || !metrics || !allBriefs) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-auto">
          <div className="text-center">Loading admin data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Close
          </button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-semibold">Total Briefs</div>
            <div className="text-3xl font-bold text-blue-900">{metrics.totalBriefs}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-semibold">Retainer</div>
            <div className="text-3xl font-bold text-green-900">{metrics.retainerBriefs}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-600 font-semibold">Out of Scope</div>
            <div className="text-3xl font-bold text-orange-900">{metrics.outOfScopeBriefs}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 font-semibold">Avg Budget</div>
            <div className="text-2xl font-bold text-purple-900">
              R{metrics.averageBudget.toLocaleString()}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {metrics.briefsWithBudget} of {metrics.totalBriefs} with budget
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Stats */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Briefs by User</h2>
            <div className="space-y-2 max-h-80 overflow-auto">
              {userStats.map((user: { name: string; count: number }, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="font-medium">{user.name}</span>
                  <span className="bg-gray-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {user.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Stats */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Popular Categories</h2>
            <div className="space-y-2 max-h-80 overflow-auto">
              {Object.entries(metrics.categoryCounts)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, count], idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">{category}</span>
                    <span className="bg-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                      {count as number}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="border rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">Priority Distribution</h2>
          <div className="flex gap-4">
            {Object.entries(metrics.priorityCounts).map(([priority, count], idx) => (
              <div key={idx} className="flex-1 text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{count as number}</div>
                <div className="text-sm text-gray-600">{priority}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Briefs Table */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">All Briefs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-2">Campaign</th>
                  <th className="text-left p-2">Client</th>
                  <th className="text-left p-2">Submitted By</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Billing</th>
                  <th className="text-left p-2">Categories</th>
                  <th className="text-right p-2">Budget</th>
                </tr>
              </thead>
              <tbody>
                {allBriefs
                  .slice()
                  .reverse()
                  .map((brief: any) => (
                    <tr key={brief._id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{brief.campaign_name}</td>
                      <td className="p-2">{brief.client_name}</td>
                      <td className="p-2">{brief.user_name}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            brief.priority === "High"
                              ? "bg-red-100 text-red-800"
                              : brief.priority === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {brief.priority}
                        </span>
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            brief.billing_type === "OutOfScope"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {brief.billing_type}
                        </span>
                      </td>
                      <td className="p-2 text-xs">{brief.categories.slice(0, 3).join(", ")}</td>
                      <td className="p-2 text-right font-medium">
                        {brief.budget ? `R${brief.budget.toLocaleString()}` : "TBD"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
