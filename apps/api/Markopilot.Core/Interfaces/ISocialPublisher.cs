using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

public interface ISocialPublisher
{
    string Platform { get; }
    
    /// <summary>
    /// Publishes a post to the specific social media platform.
    /// Returns the external platform post ID if successful.
    /// </summary>
    Task<string> PublishAsync(SocialPost post, string decryptedAccessToken);
}
