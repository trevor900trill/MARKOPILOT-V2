"use client";

import { useState, useEffect, useCallback } from "react";
import { Radar, AlertTriangle, ShieldCheck, Zap, ExternalLink, RefreshCw, Sparkles, CheckCircle2, XCircle, ArrowRight, Clock, ShieldAlert } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost } from "@/lib/api-client";
import { useRouter } from "next/navigation";

type BrandImpactEvent = {
  id: string;
  brandId: string;
  articleId?: string;
  impactLevel: "critical" | "high" | "moderate" | "low" | "info";
  title: string;
  summary: string;
  whyItMatters: string;
  recommendedAction: string;
  autoDraftHook?: string;
  sourceUrl?: string;
  sourceName?: string;
  status: "unread" | "read" | "actioned" | "dismissed";
  actionedPostId?: string;
  createdAt: string;
};

type BrandImpactSummary = {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  unreadEvents: number;
  scanFrequency: string;
  lastScannedAt?: string;
};

export default function BrandImpactPage() {
  const { activeBrand } = useBrand();
  const router = useRouter();
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [events, setEvents] = useState<BrandImpactEvent[]>([]);
  const [summary, setSummary] = useState<BrandImpactSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const fetchImpactData = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const levelParam = filterLevel !== "all" ? `&impactLevel=${filterLevel}` : "";
      const res = await apiGet<{ summary: BrandImpactSummary; events: BrandImpactEvent[] }>(
        `/brands/${activeBrand.id}/impact?limit=50${levelParam}`
      );
      setEvents(res.events || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error("Failed to fetch brand impact data:", err);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand, filterLevel]);

  useEffect(() => {
    fetchImpactData();
  }, [fetchImpactData]);

  const handleTriggerScan = async () => {
    if (!activeBrand || isScanning) return;
    setIsScanning(true);
    try {
      const res = await apiPost<{ message: string; summary: BrandImpactSummary }>(
        `/brands/${activeBrand.id}/impact/scan`,
        {}
      );
      setNotificationMessage("Scan completed! Latest market intelligence fetched.");
      await fetchImpactData();
    } catch (err) {
      console.error("Failed to trigger scan:", err);
    } finally {
      setIsScanning(false);
      setTimeout(() => setNotificationMessage(null), 4000);
    }
  };

  const handleConvertPost = async (eventId: string) => {
    if (!activeBrand || actioningId) return;
    setActioningId(eventId);
    try {
      await apiPost(`/brands/${activeBrand.id}/impact/${eventId}/convert-post`, {});
      setNotificationMessage("Post drafted successfully! Redirecting to Social Posts...");
      setTimeout(() => {
        router.push("/dashboard/social");
      }, 1200);
    } catch (err) {
      console.error("Failed to convert impact to post:", err);
      setActioningId(null);
    }
  };

  const handleDismiss = async (eventId: string) => {
    if (!activeBrand) return;
    try {
      await apiPost(`/brands/${activeBrand.id}/impact/${eventId}/dismiss`, {});
      setEvents(prev => prev.filter(e => e.id !== eventId));
      if (summary) {
        setSummary({
          ...summary,
          totalEvents: Math.max(0, summary.totalEvents - 1),
          unreadEvents: Math.max(0, summary.unreadEvents - 1)
        });
      }
    } catch (err) {
      console.error("Failed to dismiss event:", err);
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20"><ShieldAlert size={13} /> Critical Impact</span>;
      case "high":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertTriangle size={13} /> High Priority</span>;
      case "moderate":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Zap size={13} /> Moderate</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20"><ShieldCheck size={13} /> Info / Update</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 border border-emerald-400/30 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{notificationMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div data-tour="page-impact-head" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center border border-[var(--accent-primary)]/20">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Brand Impact Intelligence</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Autonomous market sweeps, tech policy updates, and regulatory shifts evaluated for your business.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
            <Clock size={13} className="text-[var(--accent-primary)]" />
            <span>Scan Frequency: <strong className="text-white">{summary?.scanFrequency || "Daily"}</strong></span>
          </div>

          <button
            data-tour="impact-scan-btn"
            onClick={handleTriggerScan}
            disabled={isScanning || !activeBrand}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
            {isScanning ? "Scanning Sources..." : "Scan Now"}
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div data-tour="impact-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-5 rounded-2xl">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Scanned Events</span>
          <div className="text-2xl font-bold text-white mt-1">{summary?.totalEvents ?? 0}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Ingested from verified market sources</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-red-500/20 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={14} /> Critical Alerts
          </span>
          <div className="text-2xl font-bold text-red-400 mt-1">{summary?.criticalEvents ?? 0}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Requires founder attention or compliance fix</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-amber-500/20 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={14} /> High Priority
          </span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary?.highEvents ?? 0}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Market shifts & platform API changes</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-5 rounded-2xl">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Unread Intelligence</span>
          <div className="text-2xl font-bold text-white mt-1">{summary?.unreadEvents ?? 0}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">New updates since your last session</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 overflow-x-auto">
        {["all", "critical", "high", "moderate", "info"].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition whitespace-nowrap ${
              filterLevel === lvl
                ? "bg-[var(--accent-primary)] text-white font-semibold"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"
            }`}
          >
            {lvl === "all" ? "All Updates" : lvl}
          </button>
        ))}
      </div>

      {/* Events Stream */}
      <div data-tour="impact-stream">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8">
          <ShieldCheck className="mx-auto w-12 h-12 text-emerald-400 mb-3 opacity-80" />
          <h3 className="text-lg font-semibold text-white">All Clear &amp; Up to Date</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mt-1">
            No disruptive market, policy, or platform updates detected for your brand right now.
          </p>
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-white transition"
          >
            <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} /> Run On-Demand Check
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`bg-[var(--bg-surface)] border rounded-2xl p-6 transition-all duration-200 hover:border-[var(--accent-primary)]/40 ${
                evt.impactLevel === "critical"
                  ? "border-red-500/30 shadow-lg shadow-red-500/5"
                  : evt.impactLevel === "high"
                  ? "border-amber-500/30 shadow-lg shadow-amber-500/5"
                  : "border-[var(--border)]"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  {getSeverityBadge(evt.impactLevel)}
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border)]">
                    {evt.sourceName || "Market Sweep"}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(evt.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {evt.sourceUrl && (
                    <a
                      href={evt.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--text-muted)] hover:text-white flex items-center gap-1 transition"
                    >
                      Source <ExternalLink size={12} />
                    </a>
                  )}
                  {evt.status !== "actioned" && (
                    <button
                      onClick={() => handleDismiss(evt.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-red-400 transition ml-2"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Summary */}
              <h3 className="text-base font-semibold text-white mb-2">{evt.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{evt.summary}</p>

              {/* Callouts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Why It Matters To Your Brand
                  </span>
                  <p className="text-xs text-amber-100/90 leading-normal">{evt.whyItMatters}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Recommended Strategic Action
                  </span>
                  <p className="text-xs text-emerald-100/90 leading-normal">{evt.recommendedAction}</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
                {evt.autoDraftHook ? (
                  <div className="text-xs text-[var(--text-muted)] italic truncate max-w-md">
                    Hook: &ldquo;{evt.autoDraftHook}&rdquo;
                  </div>
                ) : <div />}

                <div>
                  {evt.status === "actioned" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 size={14} /> Reactive Post Drafted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertPost(evt.id)}
                      disabled={actioningId === evt.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 transition shadow-md shadow-[var(--accent-primary)]/20 disabled:opacity-50"
                    >
                      <Sparkles size={13} />
                      {actioningId === evt.id ? "Drafting Post..." : "1-Click Draft Reactive Post"}
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
