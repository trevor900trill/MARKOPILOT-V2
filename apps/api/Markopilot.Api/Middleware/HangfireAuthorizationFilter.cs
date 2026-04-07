using Hangfire.Dashboard;

namespace Markopilot.Api.Middleware;

/// <summary>
/// Simple authorization filter for the Hangfire Dashboard.
/// Currently set to return true (allow all) so you can access it in production.
/// </summary>
public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // In a real production app, you would check for an admin cookie or a specific IP here.
        // For now, we allow access so you can monitor your workers.
        return true; 
    }
}
