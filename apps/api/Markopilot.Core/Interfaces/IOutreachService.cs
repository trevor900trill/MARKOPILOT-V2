using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

public interface IOutreachService
{
    Task<string> RefreshTokenAsync(Brand brand);
    bool ValidateSpamScore(string emailBody, out string reason);
    Task<bool> DispatchRFC2822EmailAsync(Brand brand, string toEmail, string subject, string bodyText, string bodyHtml);
    Task<bool> HasRecipientRepliedAsync(Brand brand, string recipientEmail, DateTimeOffset since);
}
