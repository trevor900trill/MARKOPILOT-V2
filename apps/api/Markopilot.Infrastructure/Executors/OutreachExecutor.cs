using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Executors;

public class OutreachExecutor : IActionExecutor
{
    private readonly ILeadRepository _leadRepo;
    private readonly IOutreachRepository _outreachRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly ILogger<OutreachExecutor> _logger;

    public ActionType ActionType => ActionType.SendOutreachEmail;

    public OutreachExecutor(
        ILeadRepository leadRepo,
        IOutreachRepository outreachRepo,
        IBrandRepository brandRepo,
        ILogger<OutreachExecutor> logger)
    {
        _leadRepo = leadRepo;
        _outreachRepo = outreachRepo;
        _brandRepo = brandRepo;
        _logger = logger;
    }

    public async Task<AgentActionResult> ExecuteAsync(ActionQueueItem action, CancellationToken ct = default)
    {
        try
        {
            var brand = await _brandRepo.GetBrandByIdSystemAsync(action.BrandId);
            if (brand == null) return new AgentActionResult { Success = false, Message = "Brand not found." };

            var subject = "Exciting opportunity";
            var body = string.Empty;
            var targetEmail = string.Empty;
            var targetName = "Partner";

            if (!string.IsNullOrWhiteSpace(action.DraftContentJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(action.DraftContentJson);
                    if (doc.RootElement.TryGetProperty("headline", out var h)) subject = h.GetString() ?? subject;
                    if (doc.RootElement.TryGetProperty("copy", out var c)) body = c.GetString() ?? string.Empty;
                }
                catch { }
            }

            if (!string.IsNullOrWhiteSpace(action.TargetEntityJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(action.TargetEntityJson);
                    if (doc.RootElement.TryGetProperty("name", out var n)) targetName = n.GetString() ?? targetName;
                    if (doc.RootElement.TryGetProperty("email", out var e)) targetEmail = e.GetString() ?? string.Empty;
                }
                catch { }
            }

            // Create lead if target has info
            Lead? lead = null;
            if (!string.IsNullOrWhiteSpace(targetEmail))
            {
                lead = new Lead
                {
                    Id = Guid.NewGuid(),
                    BrandId = brand.Id,
                    Name = targetName,
                    Email = targetEmail,
                    LeadScore = 85,
                    AiSummary = action.Reasoning,
                    Status = "qualified",
                    DiscoveredVia = "Agent Growth Opportunity"
                };
                await _leadRepo.BulkInsertLeadsAsync([lead]);

                // Queue outreach email
                var email = new OutreachEmail
                {
                    Id = Guid.NewGuid(),
                    BrandId = brand.Id,
                    LeadId = lead.Id,
                    RecipientEmail = targetEmail,
                    RecipientName = targetName,
                    Subject = subject,
                    BodyHtml = $"<p>{body.Replace("\n", "<br/>")}</p>",
                    BodyText = body,
                    Status = brand.RequireEmailApproval ? "pending_approval" : "queued",
                    ScheduledSendAt = DateTimeOffset.UtcNow.AddHours(brand.AutomationOutreachDelayHours),
                    GeneratedAt = DateTimeOffset.UtcNow
                };
                await _outreachRepo.CreateOutreachEmailAsync(email);
            }

            _logger.LogInformation("Agent scheduled outreach for {TargetName} (brand {BrandName})", targetName, brand.Name);

            return new AgentActionResult
            {
                Success = true,
                Message = $"Outreach prepared for {targetName}.",
                ExternalId = lead?.Id.ToString(),
                Details = new Dictionary<string, object>
                {
                    ["targetName"] = targetName,
                    ["email"] = targetEmail,
                    ["subject"] = subject
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed in OutreachExecutor for action {ActionId}", action.Id);
            return new AgentActionResult { Success = false, Message = ex.Message };
        }
    }
}
