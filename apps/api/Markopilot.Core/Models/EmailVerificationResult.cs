namespace Markopilot.Core.Models;

public enum EmailVerificationStatus
{
    Valid,
    Risky,
    Invalid,
    Unknown
}

/// <summary>
/// Expressive result of an email verification or discovery attempt.
/// Used to pass deep intelligence (provider, catch-all status) across the system.
/// </summary>
public class EmailVerificationResult
{
    public string Email { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public bool IsCatchAll { get; set; }
    
    /// <summary>
    /// Source of discovery: "smtp", "pattern", "cache", "hunter", etc.
    /// </summary>
    public string Source { get; set; } = "unknown";
    
    /// <summary>
    /// Detected mail provider: "google", "outlook", "custom", etc.
    /// </summary>
    public string Provider { get; set; } = "unknown";
    
    public EmailVerificationStatus Status { get; set; } = EmailVerificationStatus.Unknown;
}
