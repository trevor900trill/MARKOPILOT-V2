using System.Collections.Generic;
using System.Text.Json;
using Markopilot.Core.Utilities;

namespace Markopilot.Core.Models;

/// <summary>
/// Represents a learned email pattern for a specific company domain.
/// As more leads from the same domain are confirmed, confirmed_count increases
/// and future leads get their emails generated instantly from the pattern.
/// </summary>
public class DomainEmailPattern
{
    public Guid Id { get; set; }
    public string Domain { get; set; } = string.Empty;

    /// <summary>
    /// The email pattern template, e.g. "{first}.{last}", "{f}{last}", "{first}_{last}".
    /// </summary>
    public string Pattern { get; set; } = string.Empty;

    /// <summary>
    /// Number of confirmed valid emails that use this pattern for this domain.
    /// Higher counts mean higher confidence.
    /// </summary>
    public int ConfirmedCount { get; set; } = 1;
    
    public bool IsCatchAll { get; set; }
    public string? MailProvider { get; set; }
    public string? MxRecords { get; set; }
    
    

    /// <summary>
    /// JSON storage for multiple patterns and their individual success/failure counts.
    /// Used for dynamic weighting.
    /// </summary>
    public string? PatternWeightsJson { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public Dictionary<string, PatternWeight> Weights
    {
        get => string.IsNullOrEmpty(PatternWeightsJson) 
            ? new Dictionary<string, PatternWeight>() 
            : JsonSerializer.Deserialize<Dictionary<string, PatternWeight>>(PatternWeightsJson) ?? new Dictionary<string, PatternWeight>();
        set => PatternWeightsJson = JsonSerializer.Serialize(value);
    }

    public int VerificationCount { get; set; }
    public int BounceCount { get; set; }
    public int SuccessCount { get; set; }

    public DateTimeOffset LastConfirmedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
