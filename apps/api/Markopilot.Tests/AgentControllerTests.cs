using Markopilot.Api.Controllers;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Markopilot.Tests;

public class AgentControllerTests
{
    private readonly Mock<IAgentRepository> _agentRepoMock;
    private readonly Mock<ISignalCollectorService> _collectorServiceMock;
    private readonly Mock<ISignalProcessorService> _processorServiceMock;
    private readonly Mock<IOpportunityEngineService> _opportunityEngineMock;
    private readonly Mock<IActionDispatcherService> _dispatcherServiceMock;
    private readonly Mock<IBrandRepository> _brandRepoMock;
    private readonly Mock<ILogger<AgentController>> _loggerMock;
    private readonly AgentController _controller;

    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly Guid _testBrandId = Guid.NewGuid();

    public AgentControllerTests()
    {
        _agentRepoMock = new Mock<IAgentRepository>();
        _collectorServiceMock = new Mock<ISignalCollectorService>();
        _processorServiceMock = new Mock<ISignalProcessorService>();
        _opportunityEngineMock = new Mock<IOpportunityEngineService>();
        _dispatcherServiceMock = new Mock<IActionDispatcherService>();
        _brandRepoMock = new Mock<IBrandRepository>();
        _loggerMock = new Mock<ILogger<AgentController>>();

        _controller = new AgentController(
            _agentRepoMock.Object,
            _collectorServiceMock.Object,
            _processorServiceMock.Object,
            _opportunityEngineMock.Object,
            _dispatcherServiceMock.Object,
            _brandRepoMock.Object,
            _loggerMock.Object);

        var httpContext = new DefaultHttpContext();
        httpContext.Items["UserId"] = _testUserId;
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task TriggerCycle_WhenBrandNotFoundOrUnauthorized_ReturnsNotFound()
    {
        // Arrange
        _brandRepoMock
            .Setup(r => r.GetBrandByIdAsync(_testBrandId, _testUserId))
            .ReturnsAsync((Brand?)null);

        // Act
        var result = await _controller.TriggerCycle(_testBrandId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Brand not found or access denied.", notFoundResult.Value);
    }

    [Fact]
    public async Task TriggerCycle_WhenBrandAuthorized_RunsAutonomousPipelineAndReturnsMetrics()
    {
        // Arrange
        var testBrand = new Brand
        {
            Id = _testBrandId,
            OwnerId = _testUserId,
            Name = "Test Brand",
            GrowthGoal = "Acquire 50 SaaS accounts",
            TargetMarketContext = "DevTools in Africa"
        };

        _brandRepoMock
            .Setup(r => r.GetBrandByIdAsync(_testBrandId, _testUserId))
            .ReturnsAsync(testBrand);

        var rawSignals = new List<RawSignal>
        {
            new() { Id = Guid.NewGuid(), BrandId = _testBrandId, Title = "Competitor diff", Content = "Price increase" },
            new() { Id = Guid.NewGuid(), BrandId = _testBrandId, Title = "Reddit discussion", Content = "Looking for tool" }
        };

        var processedSignals = new List<ProcessedSignal>
        {
            new()
            {
                Signal = rawSignals[0],
                Category = SignalCategory.CompetitorMove,
                RelevanceScore = 85,
                Reasoning = "Competitor raised pricing"
            }
        };

        var opportunities = new List<Opportunity>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BrandId = _testBrandId,
                Category = SignalCategory.CompetitorMove,
                Title = "Target competitor churn",
                RelevanceScore = 90
            }
        };

        var plannedActions = new List<ActionQueueItem>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BrandId = _testBrandId,
                ActionType = ActionType.CreateOutreachCampaign,
                Reasoning = "Outreach to affected users"
            }
        };

        _collectorServiceMock
            .Setup(s => s.CollectSignalsAsync(testBrand, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rawSignals);

        _processorServiceMock
            .Setup(s => s.ProcessSignalsAsync(testBrand, rawSignals, It.IsAny<CancellationToken>()))
            .ReturnsAsync(processedSignals);

        _opportunityEngineMock
            .Setup(s => s.EvaluateOpportunitiesAsync(testBrand, processedSignals, It.IsAny<CancellationToken>()))
            .ReturnsAsync(opportunities);

        _opportunityEngineMock
            .Setup(s => s.PlanActionsAsync(testBrand, opportunities, It.IsAny<CancellationToken>()))
            .ReturnsAsync(plannedActions);

        _dispatcherServiceMock
            .Setup(s => s.ProcessPendingActionsAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.TriggerCycle(_testBrandId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        // Verify the entire autonomous pipeline was invoked
        _collectorServiceMock.Verify(s => s.CollectSignalsAsync(testBrand, It.IsAny<CancellationToken>()), Times.Once);
        _processorServiceMock.Verify(s => s.ProcessSignalsAsync(testBrand, rawSignals, It.IsAny<CancellationToken>()), Times.Once);
        _opportunityEngineMock.Verify(s => s.EvaluateOpportunitiesAsync(testBrand, processedSignals, It.IsAny<CancellationToken>()), Times.Once);
        _opportunityEngineMock.Verify(s => s.PlanActionsAsync(testBrand, opportunities, It.IsAny<CancellationToken>()), Times.Once);
        _dispatcherServiceMock.Verify(s => s.ProcessPendingActionsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDashboardMetrics_WhenBrandAuthorized_ReturnsMetrics()
    {
        // Arrange
        var testBrand = new Brand { Id = _testBrandId, OwnerId = _testUserId, Name = "Test Brand" };
        _brandRepoMock
            .Setup(r => r.GetBrandByIdAsync(_testBrandId, _testUserId))
            .ReturnsAsync(testBrand);

        var expectedMetrics = new AgentDashboardMetrics
        {
            SignalsScannedCount = 42,
            OpportunitiesFoundCount = 5,
            ActionsPendingApprovalCount = 2,
            ActionsExecutedCount = 18
        };

        _agentRepoMock
            .Setup(r => r.GetAgentDashboardMetricsAsync(_testBrandId))
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _controller.GetDashboardMetrics(_testBrandId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var metrics = Assert.IsType<AgentDashboardMetrics>(okResult.Value);
        Assert.Equal(42, metrics.SignalsScannedCount);
        Assert.Equal(18, metrics.ActionsExecutedCount);
    }

    [Fact]
    public async Task ApproveAction_WhenValid_DispatchesApproval()
    {
        // Arrange
        var testBrand = new Brand { Id = _testBrandId, OwnerId = _testUserId, Name = "Test Brand" };
        _brandRepoMock
            .Setup(r => r.GetBrandByIdAsync(_testBrandId, _testUserId))
            .ReturnsAsync(testBrand);

        var actionId = Guid.NewGuid();
        var action = new ActionQueueItem { Id = actionId, BrandId = _testBrandId };
        _agentRepoMock
            .Setup(r => r.GetActionByIdAsync(actionId))
            .ReturnsAsync(action);

        _dispatcherServiceMock
            .Setup(d => d.ApproveActionAsync(actionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ApproveAction(_testBrandId, actionId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _dispatcherServiceMock.Verify(d => d.ApproveActionAsync(actionId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
