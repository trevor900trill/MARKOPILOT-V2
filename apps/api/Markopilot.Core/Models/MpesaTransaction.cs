namespace Markopilot.Core.Models;

public class MpesaTransaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string PlanName { get; set; } = "Starter";
    public decimal Amount { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? CheckoutRequestId { get; set; }
    public string? MerchantRequestId { get; set; }
    public string? MpesaReceiptNumber { get; set; }
    public string Status { get; set; } = "pending"; // pending, completed, failed, cancelled
    public int? ResultCode { get; set; }
    public string? ResultDesc { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
}
