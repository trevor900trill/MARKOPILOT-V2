using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Markopilot.Api.Middleware;

/// <summary>
/// Global error handler returning consistent error envelope per spec Section 16.1.
/// </summary>
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException)
        {
            context.Response.StatusCode = 401;
            await WriteErrorAsync(context, "UNAUTHORIZED", "Authentication required.");
        }
        catch (ArgumentException ex)
        {
            context.Response.StatusCode = 400;
            await WriteErrorAsync(context, "VALIDATION_ERROR", ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await WriteErrorAsync(context, "NOT_FOUND", ex.Message);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("quota", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = 429;
            await WriteErrorAsync(context, "QUOTA_EXCEEDED", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = 500;
            await WriteErrorAsync(context, "INTERNAL_ERROR", "An unexpected error occurred.");
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, string code, string message)
    {
        context.Response.ContentType = "application/json";
        var error = new { error = new { code, message, details = new { } } };
        await context.Response.WriteAsJsonAsync(error);
    }
}
