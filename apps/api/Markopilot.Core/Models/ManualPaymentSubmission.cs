namespace Markopilot.Core.Models;

public class ManualPaymentSubmission
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string? UserDisplayName { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? TransactionCode { get; set; }
    public string MpesaMessage { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, approved, rejected
    public string? AdminNotes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
}
