"use client";

import { BarChart3, TrendingUp, Target, Sparkles, Info } from "lucide-react";

export type QueryPerformance = {
  id: string;
  queryText: string;
  leadsGenerated: number;
  highQualityCount: number;
  averageLeadScore: number;
  lastRunAt: string;
};

interface DiscoveryInsightsProps {
  performance: QueryPerformance[];
  isLoading: boolean;
}

export function DiscoveryInsights({ performance, isLoading }: DiscoveryInsightsProps) {
  if (isLoading) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-48 bg-white/5 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (performance.length === 0) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 text-center bg-gradient-to-b from-[#1a1a1e] to-[var(--bg-elevated)]">
        <div className="w-12 h-12 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-[var(--accent-primary)]" size={24} />
        </div>
        <h3 className="text-white font-serif text-xl mb-2">Algorithm Warming Up</h3>
        <p className="text-[var(--text-muted)] max-w-md mx-auto text-sm leading-relaxed">
          Discovery intelligence populates as the AI observes which patterns yield the highest lead scores for your brand. Run a few discovery cycles to see insights.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 55) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreText = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 55) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
      <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[#111114]">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="text-[var(--accent-primary)]" size={20} />
          <h2 className="text-white font-medium tracking-tight">Discovery Intelligence</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <TrendingUp size={12} />
          AI Feedback Loop Active
        </div>
      </div>

      <div className="p-4 space-y-3">
        {performance.map((q) => {
          const hitRate = q.leadsGenerated > 0 ? (q.highQualityCount / q.leadsGenerated) * 100 : 0;
          return (
            <div key={q.id} className="group relative bg-[#111114] border border-white/5 hover:border-[var(--accent-primary)]/30 p-4 rounded-xl transition duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Query Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20">Intent</div>
                    <code className="text-white text-sm font-mono truncate block group-hover:text-[var(--accent-primary)] transition">{q.queryText}</code>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5">
                        <Target size={12} className="text-[var(--text-muted)]" />
                        <span className="text-[var(--text-secondary)] text-xs font-medium">{q.leadsGenerated} <span className="text-[var(--text-muted)] font-normal">Found</span></span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-green-400" />
                        <span className="text-[var(--text-secondary)] text-xs font-medium">{hitRate.toFixed(0)}% <span className="text-[var(--text-muted)] font-normal">Hit Rate</span></span>
                     </div>
                  </div>
                </div>

                {/* Score Visualization */}
                <div className="w-full md:w-32">
                   <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Avg Score</span>
                      <span className={`text-xs font-bold ${getScoreText(q.averageLeadScore)}`}>{q.averageLeadScore.toFixed(0)}</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${getScoreColor(q.averageLeadScore)}`} 
                        style={{ width: `${q.averageLeadScore}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-3 bg-blue-500/5 border-t border-[var(--border)] flex items-center gap-2">
        <Info size={12} className="text-blue-400 shrink-0" />
        <p className="text-[10px] text-blue-400/80 leading-tight">
          Markopilot biases discovery toward query patterns with high scores and hit rates to improve your yield over time.
        </p>
      </div>
    </div>
  );
}
