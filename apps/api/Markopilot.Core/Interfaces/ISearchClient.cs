using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Low-level search interface for Serper.dev and Exa.ai clients.
/// Returns raw search results — the higher-level LeadDiscoveryService
/// (Step 19) orchestrates scraping, extraction, scoring, and dedup.
/// </summary>
public interface ISearchClient
{
    /// <summary>
    /// The provider name for this client (e.g. "serper", "exa").
    /// </summary>
    string Provider { get; }

    /// <summary>
    /// Execute a search query and return raw results.
    /// </summary>
    Task<List<SearchResult>> SearchAsync(string query, int maxResults = 10);
}
