using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.AI;

/// <summary>
/// Generates images via Replicate (Flux model) and videos via Creatomate.
/// Images are used for Instagram posts, videos for TikTok.
/// Generated media is uploaded to Supabase Storage and the public URL is returned.
/// </summary>
public class MediaGenerationService : IMediaGenerationService
{
    private readonly HttpClient _httpClient;
    private readonly IAiRoutingService _aiService;
    private readonly ISupabaseStorageService _storageService;
    private readonly string? _replicateApiKey;
    private readonly string? _creatomateApiKey;
    private readonly ILogger<MediaGenerationService> _logger;

    public MediaGenerationService(
        HttpClient httpClient,
        IAiRoutingService aiService,
        ISupabaseStorageService storageService,
        IConfiguration config,
        ILogger<MediaGenerationService> logger)
    {
        _httpClient = httpClient;
        _aiService = aiService;
        _storageService = storageService;
        _replicateApiKey = config["Replicate:ApiKey"];
        _creatomateApiKey = config["Creatomate:ApiKey"];
        _logger = logger;
    }

    public async Task<string?> GenerateImageAsync(Brand brand, string postCopy, string contentPillar)
    {
        if (string.IsNullOrEmpty(_replicateApiKey))
        {
            _logger.LogWarning("Replicate API key not configured. Skipping image generation.");
            return null;
        }

        try
        {
            // Step 1: Generate a creative image prompt from the post copy + brand context
            var imagePrompt = await GenerateImagePromptAsync(brand, postCopy, contentPillar);
            if (string.IsNullOrEmpty(imagePrompt))
            {
                _logger.LogWarning("Failed to generate image prompt. Skipping image generation.");
                return null;
            }

            _logger.LogInformation("Generated image prompt: {Prompt}", imagePrompt[..Math.Min(100, imagePrompt.Length)]);

            // Step 2: Call Replicate API (Flux 1.1 Pro)
            var imageBytes = await GenerateImageViaReplicateAsync(imagePrompt);
            if (imageBytes == null || imageBytes.Length == 0)
            {
                _logger.LogWarning("Replicate returned empty image.");
                return null;
            }

            // Step 3: Upload to Supabase Storage
            var fileName = $"ig_{brand.Id}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}.png";
            var publicUrl = await _storageService.UploadFileAsync("social-media", fileName, imageBytes, "image/png");

            _logger.LogInformation("Image generated and uploaded: {Url}", publicUrl);
            return publicUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image generation failed for brand {BrandId}", brand.Id);
            return null;
        }
    }

    public async Task<string?> GenerateVideoAsync(Brand brand, string postCopy, string contentPillar)
    {
        if (string.IsNullOrEmpty(_creatomateApiKey))
        {
            _logger.LogWarning("Creatomate API key not configured. Skipping video generation.");
            return null;
        }

        try
        {
            // Step 1: Generate a background image first
            var backgroundUrl = await GenerateImageAsync(brand, postCopy, contentPillar);

            // Step 2: Call Creatomate to create an animated video with text overlay
            var videoBytes = await GenerateVideoViaCreatomateAsync(postCopy, backgroundUrl, brand.Name);
            if (videoBytes == null || videoBytes.Length == 0)
            {
                _logger.LogWarning("Creatomate returned empty video.");
                return null;
            }

            // Step 3: Upload to Supabase Storage
            var fileName = $"tt_{brand.Id}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}.mp4";
            var publicUrl = await _storageService.UploadFileAsync("social-media", fileName, videoBytes, "video/mp4");

            _logger.LogInformation("Video generated and uploaded: {Url}", publicUrl);
            return publicUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Video generation failed for brand {BrandId}", brand.Id);
            return null;
        }
    }

    private async Task<string?> GenerateImagePromptAsync(Brand brand, string postCopy, string contentPillar)
    {
        var systemPrompt = @"You are an expert at writing prompts for AI image generators. Given a social media post and brand context, write a detailed image generation prompt.

Rules:
- Describe a visually striking, professional image that complements the post content
- Use specific visual language: lighting, composition, color palette, style
- Do NOT include any text/words in the image description — text overlays will be added separately
- Keep the prompt under 200 words
- Match the brand's industry aesthetic
- Return ONLY the prompt text, no preamble or explanation";

        var userPrompt = $@"Brand: {brand.Name}
Industry: {brand.Industry}
Content Pillar: {contentPillar}
Post Copy: {postCopy}

Generate an image prompt:";

        var request = new AiCompletionRequest
        {
            Task = AiTask.ImagePromptGeneration,
            SystemPrompt = systemPrompt,
            UserPrompt = userPrompt,
            Temperature = 0.8,
            MaxTokens = 300
        };

        var response = await _aiService.CompleteAsync(request);
        return response.Content?.Trim();
    }

    private async Task<byte[]?> GenerateImageViaReplicateAsync(string prompt)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.replicate.com/v1/predictions");
        request.Headers.Add("Authorization", $"Bearer {_replicateApiKey}");
        request.Headers.Add("Prefer", "wait"); // Synchronous mode — wait for result

        var payload = new
        {
            model = "black-forest-labs/flux-1.1-pro",
            input = new
            {
                prompt = prompt,
                aspect_ratio = "1:1", // Instagram square format
                output_format = "png",
                output_quality = 90,
                safety_tolerance = 2
            }
        };

        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Replicate API error: {Error}", error);
            return null;
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();

        // Extract the output URL — Replicate returns it in the "output" field
        string? imageUrl = null;

        if (result.TryGetProperty("output", out var output))
        {
            if (output.ValueKind == JsonValueKind.String)
            {
                imageUrl = output.GetString();
            }
            else if (output.ValueKind == JsonValueKind.Array && output.GetArrayLength() > 0)
            {
                imageUrl = output[0].GetString();
            }
        }

        if (string.IsNullOrEmpty(imageUrl))
        {
            _logger.LogWarning("Replicate did not return an image URL.");
            return null;
        }

        // Download the generated image
        return await _httpClient.GetByteArrayAsync(imageUrl);
    }

    private async Task<byte[]?> GenerateVideoViaCreatomateAsync(string postCopy, string? backgroundImageUrl, string brandName)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.creatomate.com/v1/renders");
        request.Headers.Add("Authorization", $"Bearer {_creatomateApiKey}");

        // Truncate post copy for video overlay
        var overlayText = postCopy.Length > 100 ? postCopy[..97] + "..." : postCopy;

        var payload = new[]
        {
            new
            {
                output_format = "mp4",
                width = 1080,
                height = 1920, // TikTok 9:16 portrait format
                duration = 8,
                elements = new object[]
                {
                    // Background image or solid color
                    backgroundImageUrl != null
                        ? new { type = "image", source = backgroundImageUrl, fit = "cover", animations = new[] { new { type = "scale", duration = 8, start_scale = "100%", end_scale = "110%" } } }
                        : (object)new { type = "shape", shape_type = "rectangle", fill_color = "#1a1a2e" },
                    // Dark overlay for text readability
                    new { type = "shape", shape_type = "rectangle", fill_color = "rgba(0,0,0,0.4)" },
                    // Main text overlay
                    new { type = "text", text = overlayText, font_family = "Inter", font_weight = "700", font_size = "48", fill_color = "#ffffff", x = "50%", y = "45%", width = "80%", x_alignment = "50%", y_alignment = "50%", animations = new[] { new { type = "text-appear", duration = 2 } } },
                    // Brand watermark
                    new { type = "text", text = brandName, font_family = "Inter", font_weight = "400", font_size = "24", fill_color = "rgba(255,255,255,0.6)", x = "50%", y = "90%", x_alignment = "50%", y_alignment = "50%" }
                }
            }
        };

        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Creatomate API error: {Error}", error);
            return null;
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();

        // Creatomate returns an array of render results
        if (result.ValueKind == JsonValueKind.Array && result.GetArrayLength() > 0)
        {
            var render = result[0];

            // Poll for completion if status is not finished
            if (render.TryGetProperty("status", out var status) && status.GetString() == "planned")
            {
                var renderId = render.GetProperty("id").GetString()!;
                return await PollCreatomateRenderAsync(renderId);
            }

            if (render.TryGetProperty("url", out var url))
            {
                return await _httpClient.GetByteArrayAsync(url.GetString());
            }
        }

        return null;
    }

    private async Task<byte[]?> PollCreatomateRenderAsync(string renderId)
    {
        for (var i = 0; i < 30; i++) // Max 2.5 minutes
        {
            await Task.Delay(5000);

            var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.creatomate.com/v1/renders/{renderId}");
            request.Headers.Add("Authorization", $"Bearer {_creatomateApiKey}");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) continue;

            var result = await response.Content.ReadFromJsonAsync<JsonElement>();

            if (result.TryGetProperty("status", out var status))
            {
                switch (status.GetString())
                {
                    case "succeeded":
                        if (result.TryGetProperty("url", out var url))
                            return await _httpClient.GetByteArrayAsync(url.GetString());
                        return null;
                    case "failed":
                        _logger.LogError("Creatomate render {Id} failed.", renderId);
                        return null;
                }
            }
        }

        _logger.LogError("Creatomate render {Id} timed out.", renderId);
        return null;
    }
}
