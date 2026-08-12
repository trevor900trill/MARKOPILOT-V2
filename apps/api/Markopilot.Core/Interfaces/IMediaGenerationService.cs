using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Generates visual media (images and videos) for social posts.
/// Used by: SocialPostingWorker — generates media before queuing posts for Instagram/TikTok.
/// </summary>
public interface IMediaGenerationService
{
    /// <summary>
    /// Generate an image for a social post (used by Instagram).
    /// Returns the public URL of the uploaded image (Supabase Storage).
    /// </summary>
    Task<string?> GenerateImageAsync(Brand brand, string postCopy, string contentPillar);

    /// <summary>
    /// Generate a short video for a social post (used by TikTok).
    /// Returns the public URL of the uploaded video (Supabase Storage).
    /// </summary>
    Task<string?> GenerateVideoAsync(Brand brand, string postCopy, string contentPillar);
}
