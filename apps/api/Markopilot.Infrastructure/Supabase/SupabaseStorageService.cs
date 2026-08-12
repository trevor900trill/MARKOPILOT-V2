using System.Net.Http.Headers;
using Markopilot.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Supabase;

/// <summary>
/// Uploads files to Supabase Storage via the REST API.
/// Bucket 'social-media' must be created and set to public via Supabase dashboard.
/// </summary>
public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(HttpClient httpClient, IConfiguration config, ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _supabaseUrl = config["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url is not configured.");
        _serviceRoleKey = config["Supabase:ServiceRoleKey"] ?? throw new InvalidOperationException("Supabase:ServiceRoleKey is not configured.");
    }

    public async Task<string> UploadFileAsync(string bucket, string fileName, byte[] content, string contentType)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/{bucket}/{fileName}";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("x-upsert", "true"); // Overwrite if exists

        request.Content = new ByteArrayContent(content);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Supabase Storage upload failed: {Error}", error);
            throw new Exception($"Failed to upload to Supabase Storage: {response.StatusCode} - {error}");
        }

        // Return the public URL
        var publicUrl = $"{_supabaseUrl}/storage/v1/object/public/{bucket}/{fileName}";
        _logger.LogInformation("Uploaded file to Supabase Storage: {Url}", publicUrl);
        return publicUrl;
    }
}
