using System;
using System.Collections.Generic;
using System.Linq;

namespace Markopilot.Core.Utilities;

public static class EmailUtils
{
    public static readonly List<(string Name, Func<string, string, string, string> Generate)> PatternTemplates = new()
    {
        ("{first}.{last}",    (f, l, d) => $"{f}.{l}@{d}"),
        ("{first}{last}",     (f, l, d) => $"{f}{l}@{d}"),
        ("{f}{last}",         (f, l, d) => $"{f[0]}{l}@{d}"),
        ("{first}_{last}",    (f, l, d) => $"{f}_{l}@{d}"),
        ("{first}",           (f, l, d) => $"{f}@{d}"),
        ("{last}",            (f, l, d) => $"{l}@{d}"),
        ("{f}.{last}",        (f, l, d) => $"{f[0]}.{l}@{d}"),
        ("{first}.{f_last}",  (f, l, d) => $"{f}.{l[0]}@{d}"),
        ("{first}{f_last}",   (f, l, d) => $"{f}{l[0]}@{d}"),
        ("{last}.{first}",    (f, l, d) => $"{l}.{f}@{d}"),
        ("{f}{f_last}",       (f, l, d) => $"{f[0]}{l[0]}@{d}"),
        ("{last}{f}",         (f, l, d) => $"{l}{f[0]}@{d}"),
    };

    public static (string First, string Last) ParseName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return (string.Empty, string.Empty);
        var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return (string.Empty, string.Empty);
        if (parts.Length == 1) return (parts[0].ToLowerInvariant(), string.Empty);

        return (parts[0].ToLowerInvariant(), parts[^1].ToLowerInvariant());
    }

    public static string? IdentifyPattern(string email, string first, string last, string domain)
    {
        foreach (var (name, generate) in PatternTemplates)
        {
            try
            {
                var candidate = generate(first, last, domain);
                if (string.Equals(candidate, email, StringComparison.OrdinalIgnoreCase))
                {
                    return name;
                }
            }
            catch
            {
                continue; 
            }
        }
        return null;
    }

    public static string? GenerateEmailFromPattern(string pattern, string first, string last, string domain)
    {
        var template = PatternTemplates.FirstOrDefault(p => p.Name == pattern);
        if (template.Generate == null) return null;

        try
        {
            return template.Generate(first, last, domain);
        }
        catch
        {
            return null;
        }
    }

    public static string PickBestPattern(Dictionary<string, PatternWeight>? weights, float epsilon = 0.1f)
    {
        // 1. Default to most common pattern if no weights
        if (weights == null || weights.Count == 0) return "{first}.{last}";

        // 2. Epsilon-Greedy Exploration
        if (new Random().NextDouble() < epsilon)
        {
            // Explore: Pick a random pattern from the templates
            return PatternTemplates[new Random().Next(0, PatternTemplates.Count)].Name;
        }

        // 3. Exploit: Pick the one with highest confidence and at least some usage
        var best = weights
            .OrderByDescending(w => w.Value.Confidence)
            .ThenByDescending(w => w.Value.Successes)
            .FirstOrDefault();
            
        return best.Key ?? "{first}.{last}";
    }
}

public class PatternWeight
{
    public int Successes { get; set; }
    public int Bounces { get; set; }
    public float Confidence => (Successes + Bounces) == 0 ? 0.5f : (float)Successes / (Successes + Bounces);
}
