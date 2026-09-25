using Hangfire;
using Markopilot.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

public class ActionDispatcherWorker
{
    private readonly IActionDispatcherService _dispatcherService;
    private readonly ILogger<ActionDispatcherWorker> _logger;

    public ActionDispatcherWorker(
        IActionDispatcherService dispatcherService,
        ILogger<ActionDispatcherWorker> logger)
    {
        _dispatcherService = dispatcherService;
        _logger = logger;
    }

    [Queue("default")]
    public async Task ProcessPendingActionsAsync()
    {
        _logger.LogInformation("ActionDispatcherWorker running pending actions pass...");
        await _dispatcherService.ProcessPendingActionsAsync();
    }
}
