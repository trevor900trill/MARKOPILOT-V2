using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Core.Utilities;
using Markopilot.Infrastructure.Email;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Hangfire recurring job that enriches leads missing email addresses via a three-stage pipeline:
///   Stage 1: Pattern cache check (free, instant)
///   Stage 2: Permutation + SMTP verification (free, uses existing LeadDiscoveryService)
///   Stage 3: Hunter.io API fallback (paid, quota-protected)
///
/// Runs every hour as a global job (not per-brand).
/// The pattern cache learns over time — the more leads processed, the fewer API calls needed.
/// </summary>
public class EmailEnrichmentWorker : IEmailEnrichmentWorker
{
    private readonly ILeadRepository _leadRepo;
    private readonly IEmailPatternRepository _patternRepo;
    private readonly ILeadDiscoveryService _discoveryService;
    private readonly HunterIoClient _hunterClient;
    private readonly IBrandRepository _brandRepo;
    private readonly ILogger<EmailEnrichmentWorker> _logger;

    /// <summary>
    /// All known email permutation patterns and their template format.
    /// Used to detect which pattern a verified email matches so we can cache it.
    /// </summary>
    private static readonly List<(string Name, Func<string, string, string, string> Generate)> PatternTemplates = EmailUtils.PatternTemplates;

    public EmailEnrichmentWorker(
        ILeadRepository leadRepo,
        IEmailPatternRepository patternRepo,
        ILeadDiscoveryService discoveryService,
        HunterIoClient hunterClient,
        IBrandRepository brandRepo,
        ILogger<EmailEnrichmentWorker> logger)
    {
        _leadRepo = leadRepo;
        _patternRepo = patternRepo;
        _discoveryService = discoveryService;
        _hunterClient = hunterClient;
        _brandRepo = brandRepo;
        _logger = logger;
    }    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting Hunter-Level Email Enrichment run.");

        var leads = await _leadRepo.GetLeadsNeedingEmailEnrichmentAsync(15); // Smaller batches for stealth
        if (leads.Count == 0) return;

        foreach (var lead in leads)
        {
            try
            {
                // ── STEALTH: Random jitter between leads ──────────
                await Task.Delay(Random.Shared.Next(2000, 5000));

                var (first, last) = ParseName(lead.Name!);
                if (string.IsNullOrEmpty(first)) continue;

                var domain = await DiscoverDomainForLead(lead);
                if (string.IsNullOrEmpty(domain))
                {
                    await _leadRepo.UpdateLeadEmailAsync(lead.Id, null, "unfindable", 0, null, false);
                    continue;
                }

                _logger.LogInformation("Enriching {Name} @ {Domain}...", lead.Name, domain);

                // ══ STAGE 1: Probabilistic Pattern Inference ══════
                var patternCache = await _patternRepo.GetPatternByDomainAsync(domain);
                
                // 1. Calculate historical confidence and staleness
                float patternConfidence = 0;
                bool isStale = true;
                if (patternCache != null)
                {
                    var bestWeights = patternCache.Weights.Values.OrderByDescending(v => v.Confidence).FirstOrDefault();
                    patternConfidence = bestWeights?.Confidence ?? 0;
                    isStale = patternCache.LastConfirmedAt < DateTimeOffset.UtcNow.AddDays(-30);
                }

                // 2. Select pattern (with exploration)
                var bestPattern = EmailUtils.PickBestPattern(patternCache?.Weights);
                
                // ══ STAGE 2: Discovery Strategy Selection ═════════
                EmailVerificationResult? discoveryResult = null;
                
                // HIGH INTELLIGENCE: If we have a very high confidence pattern and it's not stale,
                // SKIP SMTP to maximize stealth and performance.
                if (patternConfidence > 0.9f && !isStale && patternCache != null)
                {
                    _logger.LogInformation("Intelligence-Gate: High confidence ({Conf:P1}) for {Domain}. Skipping SMTP.", patternConfidence, domain);
                    var email = EmailUtils.GenerateEmailFromPattern(bestPattern, first, last, domain);
                    if (email != null)
                    {
                        discoveryResult = new EmailVerificationResult 
                        { 
                            Email = email, 
                            Status = EmailVerificationStatus.Valid, 
                            Source = "identity_inference",
                            Provider = patternCache.MailProvider
                        };
                    }
                }
                // STEALTH: If we already know it's a catch-all, SKIP SMTP probes
                else if (patternCache?.IsCatchAll == true)
                {
                    _logger.LogInformation("Domain {Domain} is a known Catch-All. Using pattern inference.", domain);
                    var email = EmailUtils.GenerateEmailFromPattern(bestPattern, first, last, domain);
                    if (email != null)
                    {
                        discoveryResult = new EmailVerificationResult 
                        { 
                            Email = email, 
                            Status = EmailVerificationStatus.Risky, 
                            Source = "pattern_cache",
                            IsCatchAll = true,
                            Provider = patternCache.MailProvider
                        };
                    }
                }
                else
                {
                    // NORMAL: Perform SMTP discovery
                    discoveryResult = await _discoveryService.DiscoverEmailAsync(lead.Name!, lead.Company!, domain);
                }
                
                if (discoveryResult != null)
                {
                    // Calculate final confidence
                    double confidence = CalculateConfidence(discoveryResult, patternCache, first, last, domain);
                    
                    // ARCHITECTURE ENFORCEMENT: Catch-all leads can NEVER be 'verified'
                    string status = (confidence >= 0.8 && !discoveryResult.IsCatchAll) ? "verified" : (discoveryResult.IsCatchAll ? "risky" : "enriched");

                    _logger.LogInformation("Discovery Success: {Email} | Confidence: {Conf:P1} | Source: {Src}", 
                        discoveryResult.Email, confidence, discoveryResult.Source);

                    await _leadRepo.UpdateLeadEmailAsync(lead.Id, discoveryResult.Email, status, confidence, discoveryResult.Source, discoveryResult.IsCatchAll, discoveryResult.Status.ToString());
                    
                    // Update global pattern intelligence
                    await UpdatePatternIntelligence(domain, discoveryResult, first, last);
                    
                    await _brandRepo.InsertActivityAsync(lead.BrandId, "lead_enrichment", 
                        $"Found {discoveryResult.Email} ({discoveryResult.Source}) with {confidence:P0} confidence.");
                    continue;
                }

                // ══ STAGE 3: Hunter.io Fallback ═══════════════════
                if (_hunterClient.IsConfigured)
                {
                    var hunterEmail = await _hunterClient.EmailFinderAsync(domain, first, last);
                    if (!string.IsNullOrWhiteSpace(hunterEmail))
                    {
                        var status = "enriched";
                        var confidence = 0.7; // Hunter default without SMTP verify here
                        await _leadRepo.UpdateLeadEmailAsync(lead.Id, hunterEmail, status, confidence, "hunter", false);
                        continue;
                    }
                }

                // Failed all stages
                await _leadRepo.UpdateLeadEmailAsync(lead.Id, null, "unfindable", 0, "exhausted", false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed enrichment for lead {LeadId}", lead.Id);
            }
        }
    }

    private double CalculateConfidence(EmailVerificationResult result, DomainEmailPattern? pattern, string first, string last, string domain)
    {
        double score = 0;
        
        // 1. SMTP/Signal Reliability (40%)
        if (result.Status == EmailVerificationStatus.Valid)
        {
            // Google/Microsoft are top-tier signals
            if (result.Provider == "google" || result.Provider == "outlook") score += 0.45;
            else score += 0.4;
        }
        else if (result.Status == EmailVerificationStatus.Risky) score += 0.15;

        // 2. Pattern Match (40%)
        var foundPattern = IdentifyPattern(result.Email, first, last, domain);
        if (pattern != null && foundPattern != null)
        {
            // If it's a known pattern, use its historical reliability score
            if (pattern.Weights.TryGetValue(foundPattern, out var w))
            {
                // We weight the historical confidence by 0.4
                score += w.Confidence * 0.4;
            }
            else 
            {
                // New pattern for this domain, provide a baseline if it's the primary one
                if (foundPattern == pattern.Pattern) score += 0.25;
                else score += 0.15;
            }
        }
        else if (result.Source == "pattern" || result.Source == "identity_inference") 
        {
            score += 0.3;
        }

        // 3. Historical Domain Reliability (20%)
        if (pattern != null && pattern.VerificationCount > 0)
        {
            double successRate = (double)pattern.SuccessCount / pattern.VerificationCount;
            score += successRate * 0.2;
        }

        // 4. Catch-All Penalty (Dynamic adjustment)
        if (result.IsCatchAll || (pattern?.IsCatchAll == true))
        {
            score *= 0.75; // Even harsher penalty for catch-alls (25% reduction)
        }

        return Math.Clamp(score, 0.0, 1.0);
    }

    private async Task UpdatePatternIntelligence(string domain, EmailVerificationResult result, string first, string last)
    {
        var matchedPattern = IdentifyPattern(result.Email, first, last, domain);
        if (matchedPattern == null) return;

        var existing = await _patternRepo.GetPatternByDomainAsync(domain);
        var patternObj = existing ?? new DomainEmailPattern { Domain = domain, Pattern = matchedPattern };
        
        // Update basic intelligence from this observation
        patternObj.Pattern = matchedPattern;
        patternObj.IsCatchAll = result.IsCatchAll;
        patternObj.MailProvider = result.Provider;
        patternObj.VerificationCount++; // Record that we attempted this domain

        // Ensure this specific pattern exists in the dynamic weights map
        var weights = patternObj.Weights;
        if (!weights.ContainsKey(matchedPattern))
        {
            weights[matchedPattern] = new PatternWeight();
            patternObj.Weights = weights;
        }

        await _patternRepo.UpsertPatternAsync(patternObj);
    }

    /// <summary>
    /// Resolves a company domain for a lead — first tries parsing the source URL,
    /// then falls back to the Serper-based domain discovery.
    /// </summary>
    private async Task<string?> DiscoverDomainForLead(Lead lead)
    {
        // If the lead has a source URL that looks like a company website, extract domain from it
        if (!string.IsNullOrWhiteSpace(lead.SourceUrl))
        {
            try
            {
                var uri = new Uri(lead.SourceUrl);
                var host = uri.Host;
                if (host.StartsWith("www.")) host = host[4..];

                // Don't use social media domains
                if (!host.Contains("linkedin.com") && !host.Contains("twitter.com")
                    && !host.Contains("facebook.com") && !host.Contains("instagram.com"))
                {
                    return host;
                }
            }
            catch { /* Ignore invalid URLs */ }
        }

        // Fallback to Serper-based domain discovery
        return await _discoveryService.DiscoverDomainAsync(lead.Company!);
    }

    private static (string First, string Last) ParseName(string fullName) => EmailUtils.ParseName(fullName);
    private static string? IdentifyPattern(string email, string first, string last, string domain) => EmailUtils.IdentifyPattern(email, first, last, domain);
    private static string? GenerateEmailFromPattern(string pattern, string first, string last, string domain) => EmailUtils.GenerateEmailFromPattern(pattern, first, last, domain);
}
