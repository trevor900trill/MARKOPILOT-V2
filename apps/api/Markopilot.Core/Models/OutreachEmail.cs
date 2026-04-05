namespace Markopilot.Core.Models;

public class OutreachEmail
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public Guid? LeadId { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string? RecipientName { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string BodyText { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;
    public string Status { get; set; } = "queued";
    public string? GmailMessageId { get; set; }
    public DateTimeOffset? SentAt { get; set; }
    public DateTimeOffset? ScheduledSendAt { get; set; }
    public bool FollowUpScheduled { get; set; }
    public bool FollowUpSent { get; set; }
    public DateTimeOffset? FollowUpSentAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
}
