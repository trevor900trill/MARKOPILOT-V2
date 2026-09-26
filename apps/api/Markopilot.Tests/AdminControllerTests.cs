using Markopilot.Api.Controllers;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Markopilot.Tests;

public class AdminControllerTests
{
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<IBrandRepository> _brandRepoMock;
    private readonly Mock<INotificationRepository> _notificationRepoMock;
    private readonly Mock<ILogger<AdminController>> _loggerMock;
    private readonly AdminController _controller;

    private readonly Guid _adminUserId = Guid.NewGuid();
    private readonly Guid _regularUserId = Guid.NewGuid();

    public AdminControllerTests()
    {
        _userRepoMock = new Mock<IUserRepository>();
        _brandRepoMock = new Mock<IBrandRepository>();
        _notificationRepoMock = new Mock<INotificationRepository>();
        _loggerMock = new Mock<ILogger<AdminController>>();

        _controller = new AdminController(
            _userRepoMock.Object,
            _brandRepoMock.Object,
            _notificationRepoMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetManualPayments_WhenUserNotSuperAdmin_ReturnsForbidden()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Items["UserId"] = _regularUserId;
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _userRepoMock
            .Setup(r => r.GetUserByIdAsync(_regularUserId))
            .ReturnsAsync(new User { Id = _regularUserId, Email = "regular@example.com" });

        // Act
        var result = await _controller.GetManualPayments();

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetManualPayments_WhenSuperAdmin_ReturnsPaymentsList()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Items["UserId"] = _adminUserId;
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _userRepoMock
            .Setup(r => r.GetUserByIdAsync(_adminUserId))
            .ReturnsAsync(new User { Id = _adminUserId, Email = "trevormugolawrence@gmail.com" });

        var expectedPayments = new List<ManualPaymentSubmission>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                UserEmail = "buyer@example.com",
                PlanName = "Growth",
                Amount = 10200,
                PhoneNumber = "+254712345678",
                Status = "pending",
                MpesaMessage = "Confirmed KES 10,200 sent to Till"
            }
        };

        _userRepoMock
            .Setup(r => r.GetManualPaymentsAsync(null))
            .ReturnsAsync(expectedPayments);

        // Act
        var result = await _controller.GetManualPayments(status: null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var payments = Assert.IsType<List<ManualPaymentSubmission>>(okResult.Value);
        Assert.Single(payments);
        Assert.Equal("buyer@example.com", payments[0].UserEmail);
    }

    [Fact]
    public async Task GetManualPayments_WithStatusFilter_PassesStatusToRepository()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Items["UserId"] = _adminUserId;
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _userRepoMock
            .Setup(r => r.GetUserByIdAsync(_adminUserId))
            .ReturnsAsync(new User { Id = _adminUserId, Email = "trevormugolawrence@gmail.com" });

        _userRepoMock
            .Setup(r => r.GetManualPaymentsAsync("approved"))
            .ReturnsAsync(new List<ManualPaymentSubmission>());

        // Act
        var result = await _controller.GetManualPayments(status: "approved");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        _userRepoMock.Verify(r => r.GetManualPaymentsAsync("approved"), Times.Once);
    }
}
