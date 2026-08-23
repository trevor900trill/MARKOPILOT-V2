namespace Markopilot.Core.Models;

public class CountryWaitlist
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? CountryCode { get; set; }
    public string? CountryName { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
