namespace Markopilot.Core.Interfaces;

/// <summary>
/// Uploads files to Supabase Storage and returns public URLs.
/// Used by: MediaGenerationService — to persist generated images/videos.
/// </summary>
public interface ISupabaseStorageService
{
    /// <summary>
    /// Upload a file to a Supabase Storage bucket.
    /// Returns the public URL of the uploaded file.
    /// </summary>
    Task<string> UploadFileAsync(string bucket, string fileName, byte[] content, string contentType);
}
