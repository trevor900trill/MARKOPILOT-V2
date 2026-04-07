"use client";

import { BrandSummary } from "@/lib/brand-context";
import { Send, Globe, Mail, Link as LinkIcon, BarChart } from "lucide-react";

type BrandCardProps = {
  brand: BrandSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
};

export function BrandCard({ brand, isActive, onSelect }: BrandCardProps) {
  const platforms = [
    { name: "Twitter", connected: brand.twitterConnected, icon: Globe },
    { name: "LinkedIn", connected: brand.linkedinConnected, icon: LinkIcon },
    { name: "TikTok", connected: brand.tiktokConnected, icon: Send },
    { name: "Gmail", connected: brand.gmailConnected, icon: Mail },
  ];

  const formattedDate = new Date(brand.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div 
      className={`group relative bg-[var(--bg-elevated)] border rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--accent-glow)]/10 hover:border-[var(--accent-primary)]/40 ${isActive ? "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20" : "border-[var(--border)]"}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${isActive ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]/30" : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]"}`}>
            {brand.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-serif text-xl text-white group-hover:text-[var(--accent-primary)] transition-colors">
              {brand.name}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Added on {formattedDate}
            </p>
          </div>
        </div>
        
        {isActive && (
          <span className="flex items-center gap-1 text-[10px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-1 rounded-full border border-[var(--accent-primary)]/20 font-bold uppercase tracking-tighter">
            Active
          </span>
        )}
      </div>

      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 h-10 italic">
        "{brand.description || "No description provided."}"
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--bg-surface)]/50 rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Discovery Status</p>
            <BarChart size={12} className="text-[var(--text-secondary)]" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${brand.automationLeadsEnabled ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs text-white font-medium">
              {brand.automationLeadsEnabled ? "Leads Tracking" : "Discovery Paused"}
            </span>
          </div>
        </div>
        <div className="bg-[var(--bg-surface)]/50 rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Content Post</p>
            <Send size={12} className="text-[var(--text-secondary)]" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${brand.automationPostsEnabled ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs text-white font-medium">
              {brand.automationPostsEnabled ? "Autonomous" : "Manual Mode"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          {platforms.map(p => (
            <div 
              key={p.name}
              title={p.name + (p.connected ? " Connected" : " Disconnected")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${p.connected ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20" : "bg-white/5 text-[var(--text-muted)] border border-white/5 opacity-40 grayscale"}`}
            >
              <p.icon size={14} />
            </div>
          ))}
        </div>
        
        <button
          onClick={() => onSelect(brand.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-[var(--bg-surface)] text-[var(--text-secondary)] cursor-default" : "bg-[var(--accent-primary)] text-white hover:shadow-lg hover:shadow-[var(--accent-glow)]/40 hover:scale-[1.02]"}`}
        >
          {isActive ? "Viewing" : "Switch to Brand"}
        </button>
      </div>
    </div>
  );
}
