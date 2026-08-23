namespace Markopilot.Core.Models;

/// <summary>
/// Single source of truth for all plan definitions and their quota limits.
/// Referenced by: QuotaService, WebhooksController, and any future plan-related logic.
/// 
/// IMPORTANT: When changing plans, update ONLY this file on the backend.
/// The frontend equivalent is: apps/web/src/lib/plans.ts
/// </summary>
public static class PlanCatalog
{
    public static readonly PlanDefinition Starter = new()
    {
        Name = "Starter",
        PriceKes = 3800,
        PriceUsd = 29,
        LeadsPerMonth = 150,
        PostsPerMonth = 45,
        BrandsAllowed = 1,
        HangfireQueue = "starter"
    };

    public static readonly PlanDefinition Growth = new()
    {
        Name = "Growth",
        PriceKes = 10200,
        PriceUsd = 79,
        LeadsPerMonth = 750,
        PostsPerMonth = 180,
        BrandsAllowed = 3,
        HangfireQueue = "growth"
    };

    public static readonly PlanDefinition Scale = new()
    {
        Name = "Scale",
        PriceKes = 25800,
        PriceUsd = 199,
        LeadsPerMonth = 2500,
        PostsPerMonth = 600,
        BrandsAllowed = 10,
        HangfireQueue = "scale"
    };

    /// <summary>
    /// All available plans indexed by lowercase name.
    /// </summary>
    public static readonly Dictionary<string, PlanDefinition> All = new(StringComparer.OrdinalIgnoreCase)
    {
        { "starter", Starter },
        { "growth", Growth },
        { "scale", Scale }
    };

    /// <summary>
    /// Resolves a plan by name, falling back to Starter if not found.
    /// </summary>
    public static PlanDefinition GetByName(string? planName) =>
        planName != null && All.TryGetValue(planName, out var plan) ? plan : Starter;
}

public class PlanDefinition
{
    public required string Name { get; init; }
    public required decimal PriceKes { get; init; }
    public required decimal PriceUsd { get; init; }
    public required int LeadsPerMonth { get; init; }
    public required int PostsPerMonth { get; init; }
    public required int BrandsAllowed { get; init; }
    public required string HangfireQueue { get; init; }
}
