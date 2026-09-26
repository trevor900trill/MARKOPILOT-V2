using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Markopilot.Tests;

public class SignalCollectorServiceTests
{
    private readonly Mock<IAgentRepository> _agentRepoMock;
    private readonly Mock<ILogger<SignalCollectorService>> _loggerMock;
    private readonly Guid _brandId = Guid.NewGuid();

    public SignalCollectorServiceTests()
    {
        _agentRepoMock = new Mock<IAgentRepository>();
        _loggerMock = new Mock<ILogger<SignalCollectorService>>();
    }

    [Fact]
    public async Task CollectSignalsAsync_DeduplicatesSignalsBySourceUrl()
    {
        // Arrange
        var brand = new Brand { Id = _brandId, Name = "Test Brand" };

        var collector1Mock = new Mock<ISignalCollector>();
        collector1Mock.Setup(c => c.SourceType).Returns(SignalSourceType.Rss);
        collector1Mock.Setup(c => c.CollectAsync(brand, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new RawSignal { Id = Guid.NewGuid(), BrandId = _brandId, SourceUrl = "https://techcrunch.com/article-1", Title = "Article 1" },
                new RawSignal { Id = Guid.NewGuid(), BrandId = _brandId, SourceUrl = "https://techcrunch.com/article-2", Title = "Article 2" }
            ]);

        var collector2Mock = new Mock<ISignalCollector>();
        collector2Mock.Setup(c => c.SourceType).Returns(SignalSourceType.WebSearch);
        collector2Mock.Setup(c => c.CollectAsync(brand, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                // Duplicate of Article 1
                new RawSignal { Id = Guid.NewGuid(), BrandId = _brandId, SourceUrl = "https://techcrunch.com/article-1", Title = "Article 1 Duplicate" },
                new RawSignal { Id = Guid.NewGuid(), BrandId = _brandId, SourceUrl = "https://reddit.com/post-3", Title = "Post 3" }
            ]);

        var service = new SignalCollectorService(
            [collector1Mock.Object, collector2Mock.Object],
            _agentRepoMock.Object,
            _loggerMock.Object);

        // Act
        var result = await service.CollectSignalsAsync(brand);

        // Assert
        Assert.Equal(3, result.Count); // Deduplicated from 4 to 3
        _agentRepoMock.Verify(r => r.SaveSignalsAsync(It.Is<List<RawSignal>>(list => list.Count == 3)), Times.Once);
    }

    [Fact]
    public async Task CollectSignalsAsync_WhenOneCollectorThrows_ContinuesWithOtherCollectors()
    {
        // Arrange
        var brand = new Brand { Id = _brandId, Name = "Test Brand" };

        var failingCollectorMock = new Mock<ISignalCollector>();
        failingCollectorMock.Setup(c => c.SourceType).Returns(SignalSourceType.TwitterMention);
        failingCollectorMock.Setup(c => c.CollectAsync(brand, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Twitter API Rate Limit Exceeded"));

        var healthyCollectorMock = new Mock<ISignalCollector>();
        healthyCollectorMock.Setup(c => c.SourceType).Returns(SignalSourceType.Reddit);
        healthyCollectorMock.Setup(c => c.CollectAsync(brand, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new RawSignal { Id = Guid.NewGuid(), BrandId = _brandId, SourceUrl = "https://reddit.com/r/saas/1", Title = "Reddit Lead" }
            ]);

        var service = new SignalCollectorService(
            [failingCollectorMock.Object, healthyCollectorMock.Object],
            _agentRepoMock.Object,
            _loggerMock.Object);

        // Act
        var result = await service.CollectSignalsAsync(brand);

        // Assert
        Assert.Single(result);
        Assert.Equal("Reddit Lead", result[0].Title);
        _agentRepoMock.Verify(r => r.SaveSignalsAsync(It.Is<List<RawSignal>>(list => list.Count == 1)), Times.Once);
    }
}
