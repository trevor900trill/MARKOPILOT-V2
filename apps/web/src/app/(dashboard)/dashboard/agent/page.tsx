"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Settings2,
  RefreshCw,
  ExternalLink,
  Target,
  ArrowRight,
  Shield,
  Layers,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Eye,
  Radio,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";

type Signal = {
  id: string;
  sourceType: string;
  sourceName?: string;
  sourceUrl?: string;
  title: string;
  content: string;
  author?: string;
  relevanceScore?: number;
  isProcessed?: boolean;
  publishedAt?: string;
  ingestedAt: string;
  opportunityId?: string;
  opportunityTitle?: string;
  opportunityReasoning?: string;
  opportunityStatus?: string;
};

type SignalsResponse = {
  items: Signal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Opportunity = {
  id: string;
  category: string;
  title: string;
  reasoning: string;
  relevanceScore: number;
  urgency: string;
  status: string;
  createdAt: string;
};

type ActionQueueItem = {
  id: string;
  actionType: string;
  priority: number;
  reasoning: string;
  draftContentJson: string;
  targetEntityJson: string;
  approvalRequired: boolean;
  status: string;
  scheduledFor?: string;
  createdAt: string;
  opportunity?: Opportunity;
};

type AgentDashboardMetrics = {
  signalsScannedCount: number;
  opportunitiesFoundCount: number;
  actionsExecutedCount: number;
  actionsPendingApprovalCount: number;
  averageRelevanceScore: number;
  recentOpportunities: Opportunity[];
  pendingActions: ActionQueueItem[];
  recentActions: ActionQueueItem[];
  recentSignals: Signal[];
};

export default function AgentCommandCenterPage() {
  const { activeBrand, refreshBrands, user } = useBrand();
  const [metrics, setMetrics] = useState<AgentDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCycling, setIsCycling] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "opportunities" | "signals" | "history" | "settings">("queue");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Pagination for Signals Stream
  const [signalsPage, setSignalsPage] = useState(1);
  const [paginatedSignals, setPaginatedSignals] = useState<Signal[]>([]);
  const [signalsTotal, setSignalsTotal] = useState(0);
  const [signalsTotalPages, setSignalsTotalPages] = useState(1);
  const [signalsLoading, setSignalsLoading] = useState(false);

  // Settings State
  const [growthGoal, setGrowthGoal] = useState("");
  const [targetContext, setTargetContext] = useState("");
  const [autonomyLevel, setAutonomyLevel] = useState("ApproveOutreach");
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [competitors, setCompetitors] = useState("");
  const [keywords, setKeywords] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const planName = (user?.planName || "starter").toLowerCase();
  const planDisplayName = planName.charAt(0).toUpperCase() + planName.slice(1);
  const scanFrequency =
    planName === "scale" ? "Every 30 minutes" :
    planName === "growth" ? "Every 4 hours" :
    "Once daily (08:00 UTC)";

  const fetchSignals = useCallback(async (page: number) => {
    if (!activeBrand) return;
    try {
      setSignalsLoading(true);
      const res = await apiGet<SignalsResponse>(`/brands/${activeBrand.id}/agent/signals?page=${page}&pageSize=10`);
      setPaginatedSignals(res.items || []);
      setSignalsTotal(res.total || 0);
      setSignalsPage(res.page || 1);
      setSignalsTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch signals:", err);
    } finally {
      setSignalsLoading(false);
    }
  }, [activeBrand]);

  const fetchDashboard = useCallback(async () => {
    if (!activeBrand) return;
    try {
      setLoading(true);
      const data = await apiGet<AgentDashboardMetrics>(`/brands/${activeBrand.id}/agent/dashboard`);
      setMetrics(data);

      // Initialize settings from brand if available
      setGrowthGoal((activeBrand as any).growthGoal || "");
      setTargetContext((activeBrand as any).targetMarketContext || "");
      setAutonomyLevel((activeBrand as any).agentAutonomyLevel || "ApproveOutreach");
      setAgentEnabled((activeBrand as any).agentEnabled ?? true);
      setCompetitors(((activeBrand as any).competitorUrls || []).join(", "));
      setKeywords(((activeBrand as any).watchKeywords || []).join(", "));

      // Default tab to opportunities if no pending approvals
      if ((data.pendingActions?.length || 0) === 0 && (data.recentOpportunities?.length || 0) > 0) {
        setActiveTab("opportunities");
      }
    } catch (err) {
      console.error("Failed to fetch agent dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [activeBrand]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (activeTab === "signals") {
      fetchSignals(signalsPage);
    }
  }, [activeTab, signalsPage, fetchSignals]);

  const handleTriggerCycle = async () => {
    if (!activeBrand) return;
    setIsCycling(true);
    try {
      const res = await apiPost(`/brands/${activeBrand.id}/agent/trigger-cycle`);
      toast.success(
        `Agent loop complete! Found ${res.signalsCollected ?? 0} signals and evaluated ${res.opportunitiesEvaluated ?? 0} opportunities.`
      );
      await fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger agent cycle.");
    } finally {
      setIsCycling(false);
    }
  };

  const handleApprove = async (actionId: string) => {
    if (!activeBrand) return;
    setActioningId(actionId);
    try {
      await apiPost(`/brands/${activeBrand.id}/agent/actions/${actionId}/approve`);
      toast.success("Action approved and executed!");
      await fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve action.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (actionId: string) => {
    if (!activeBrand) return;
    setActioningId(actionId);
    try {
      await apiPost(`/brands/${activeBrand.id}/agent/actions/${actionId}/reject`, { reason: "Dismissed from dashboard" });
      toast.success("Action dismissed.");
      await fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to dismiss action.");
    } finally {
      setActioningId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!activeBrand) return;
    setSavingSettings(true);
    try {
      const compList = competitors.split(",").map(s => s.trim()).filter(Boolean);
      const keyList = keywords.split(",").map(s => s.trim()).filter(Boolean);

      await apiPut(`/brands/${activeBrand.id}/agent/config`, {
        growthGoal,
        targetMarketContext: targetContext,
        agentAutonomyLevel: autonomyLevel,
        agentEnabled,
        competitorUrls: compList,
        watchKeywords: keyList
      });

      toast.success("Agent configuration saved.");
      await refreshBrands();
      await fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (!activeBrand) {
    return (
      <div className="p-8 text-center text-white/60">
        <Bot className="w-12 h-12 mx-auto mb-3 text-white/30" />
        <h2 className="text-xl font-medium text-white mb-1">No Brand Selected</h2>
        <p className="text-sm">Please select a brand from the switcher to access the Growth Agent.</p>
      </div>
    );
  }

  const parseJson = (str?: string) => {
    if (!str || str === "{}") return {};
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-white tracking-tight">Autonomous Growth Agent</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-violet-400" />
              Scan Frequency: <strong className="text-white font-semibold">{scanFrequency}</strong> ({planDisplayName})
            </span>
          </div>
          <p className="text-sm text-white/60 flex items-center gap-2 flex-wrap">
            <span>Operating for <strong className="text-white">{activeBrand.name}</strong></span>
            <span className="text-white/30">•</span>
            <span className="text-white/80 italic">
              Goal: &ldquo;{growthGoal || "Accelerate growth and customer acquisition"}&rdquo;
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerCycle}
            disabled={isCycling}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isCycling ? "animate-spin" : ""}`} />
            {isCycling ? "Agent Working..." : "Trigger Agent Cycle"}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium">
            <span>Signals Scanned</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {metrics?.signalsScannedCount ?? 0}
          </div>
          <div className="text-[11px] text-white/40 mt-1">Multi-source feeds</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium">
            <span>Opportunities</span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {metrics?.opportunitiesFoundCount ?? 0}
          </div>
          <div className="text-[11px] text-white/40 mt-1">AI reasoned potential</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium">
            <span>Pending Approvals</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-400">
            {metrics?.actionsPendingApprovalCount ?? 0}
          </div>
          <div className="text-[11px] text-white/40 mt-1">Awaiting your okay</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium">
            <span>Actions Executed</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {metrics?.actionsExecutedCount ?? 0}
          </div>
          <div className="text-[11px] text-white/40 mt-1">Posts, emails, alerts</div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4.5 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-white/50 text-xs font-medium">
            <span>Avg Relevance</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {metrics?.averageRelevanceScore ?? 0}%
          </div>
          <div className="text-[11px] text-white/40 mt-1">Goal alignment score</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "queue"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          Approval Queue
          {(metrics?.actionsPendingApprovalCount ?? 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
              {metrics?.actionsPendingApprovalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("opportunities")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "opportunities"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          Opportunities ({metrics?.recentOpportunities?.length ?? 0})
        </button>

        <button
          onClick={() => setActiveTab("signals")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "signals"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          Signals Stream ({metrics?.signalsScannedCount ?? 0})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "history"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          Action History
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ml-auto ${
            activeTab === "settings"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-400" />
          Agent Settings & Goal
        </button>
      </div>

      {/* Tab 1: Approval Queue */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-white/50 animate-pulse">Loading actions queue...</div>
          ) : (metrics?.pendingActions?.length || 0) === 0 ? (
            <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-surface)]">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400/80" />
              <h3 className="text-lg font-medium text-white mb-1">Queue is Clear</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto">
                No growth actions currently waiting for approval. The agent runs automatically in the background or you can trigger a cycle now.
              </p>
              <button
                onClick={handleTriggerCycle}
                disabled={isCycling}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium inline-flex items-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4" /> Trigger New Cycle
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {metrics?.pendingActions?.map((action) => {
                const draft = parseJson(action.draftContentJson);
                const target = parseJson(action.targetEntityJson);

                return (
                  <div
                    key={action.id}
                    className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-violet-500/40 rounded-2xl transition-all shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-5"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          {action.actionType}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          action.priority === 1
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          Priority {action.priority}
                        </span>
                        {action.opportunity && (
                          <span className="text-xs text-white/40">
                            Context: <strong className="text-white/80">{action.opportunity.title}</strong>
                          </span>
                        )}
                      </div>

                      {/* Strategic Reasoning */}
                      <p className="text-sm text-white/80 font-medium leading-relaxed">
                        {action.reasoning}
                      </p>

                      {/* Content Draft Preview */}
                      {(draft.copy || draft.headline) && (
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                          {draft.headline && (
                            <div className="text-xs font-semibold text-white/90">{draft.headline}</div>
                          )}
                          {draft.copy && (
                            <div className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                              {draft.copy}
                            </div>
                          )}
                          {draft.platform && (
                            <div className="text-[10px] text-white/40 uppercase tracking-wider pt-1">
                              Platform: {draft.platform}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Target Info */}
                      {(target.name || target.handle || target.url) && (
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span>Target:</span>
                          {target.name && <span className="text-white font-medium">{target.name}</span>}
                          {target.handle && <span className="text-violet-400">{target.handle}</span>}
                          {target.url && (
                            <a href={target.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                              Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex md:flex-col items-center gap-2 flex-shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => handleApprove(action.id)}
                        disabled={actioningId === action.id}
                        className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Execute
                      </button>
                      <button
                        onClick={() => handleReject(action.id)}
                        disabled={actioningId === action.id}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Opportunities */}
      {activeTab === "opportunities" && (
        <div className="space-y-4">
          {(metrics?.recentOpportunities?.length || 0) === 0 ? (
            <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-surface)] text-white/50">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-white/30" />
              <p>No opportunities evaluated yet. Trigger a cycle to scan for market openings.</p>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {metrics?.recentOpportunities?.map((opp) => (
                <div key={opp.id} className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {opp.category}
                      </span>
                      <span className="text-xs text-white/40">
                        Urgency: <strong className="text-amber-300">{opp.urgency}</strong>
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {opp.relevanceScore}/100 Match
                    </div>
                  </div>
                  <h4 className="text-base font-medium text-white">{opp.title}</h4>
                  <p className="text-sm text-white/70">{opp.reasoning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Signals Stream (with Pagination & Decision Logic) */}
      {activeTab === "signals" && (
        <div className="space-y-4">
          {/* Frequency & Decision Logic Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border border-violet-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 mt-0.5 flex-shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">Radar Frequency:</span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono font-medium">
                    {scanFrequency} ({planDisplayName} Plan)
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/70">
                    Total Scanned: <strong className="text-white font-mono">{signalsTotal || metrics?.signalsScannedCount || 0}</strong>
                  </span>
                </div>
                <p className="text-white/50 leading-relaxed">
                  The AI scans Reddit, RSS, Search, and Competitor feeds. Signals with a relevance score ≥ 45 or high urgency are promoted to <strong>Opportunities</strong> &amp; <strong>Approval Queue</strong>. Background noise is filtered out.
                </p>
              </div>
            </div>
            <button
              onClick={handleTriggerCycle}
              disabled={isCycling}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer self-start md:self-center"
            >
              <RefreshCw className={`w-3 h-3 ${isCycling ? "animate-spin" : ""}`} />
              Scan Now
            </button>
          </div>

          {signalsLoading ? (
            <div className="p-12 text-center text-white/50 animate-pulse">Loading signals stream...</div>
          ) : (paginatedSignals.length === 0 && (metrics?.recentSignals?.length || 0) === 0) ? (
            <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-surface)] text-white/50">
              <Radio className="w-10 h-10 mx-auto mb-2 text-white/30" />
              <p>No signals captured yet. Signals from Reddit, RSS, Search, and Competitors will appear here.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {(paginatedSignals.length > 0 ? paginatedSignals : (metrics?.recentSignals || [])).map((sig) => {
                  const hasOpp = Boolean(sig.opportunityTitle);
                  const isScored = sig.relevanceScore !== undefined && sig.relevanceScore !== null;
                  const isHighRelevance = (sig.relevanceScore ?? 0) >= 45;

                  return (
                    <div key={sig.id} className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-white/15 rounded-2xl space-y-2.5 transition">
                      <div className="flex items-center justify-between text-xs text-white/40 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                            {sig.sourceName || sig.sourceType}
                          </span>
                          {sig.author && <span className="text-white/50">by @{sig.author}</span>}
                        </div>
                        <span className="font-mono">{new Date(sig.ingestedAt).toLocaleString()}</span>
                      </div>

                      <h5 className="text-sm font-medium text-white">
                        {sig.sourceUrl ? (
                          <a href={sig.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1.5 group">
                            <span>{sig.title}</span>
                            <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white transition" />
                          </a>
                        ) : (
                          sig.title
                        )}
                      </h5>

                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">{sig.content}</p>

                      {/* AI Decision & Action Explanation */}
                      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        {hasOpp ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Action Taken: Opportunity Created
                            </span>
                            <span className="text-white/80 font-medium">{sig.opportunityTitle}</span>
                          </div>
                        ) : isScored && !isHighRelevance ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-zinc-400" />
                              No Action: Relevance Below Threshold ({sig.relevanceScore}/100)
                            </span>
                            <span className="text-white/40 italic">Filtered as general market noise with no immediate commercial intent.</span>
                          </div>
                        ) : isScored && isHighRelevance ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Relevance {sig.relevanceScore}/100
                            </span>
                            <span className="text-white/60">Evaluated in strategic cycle; verified for commercial potential.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Queued for Evaluation
                            </span>
                            <span className="text-white/40">Will be analyzed during the next autonomous cycle.</span>
                          </div>
                        )}

                        {hasOpp && sig.opportunityReasoning && (
                          <span className="text-white/40 text-[11px] line-clamp-1 italic max-w-sm">
                            &ldquo;{sig.opportunityReasoning}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {signalsTotalPages > 1 && (
                <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-white/50">
                    Showing <strong className="text-white font-mono">{(signalsPage - 1) * 10 + 1}</strong> to{" "}
                    <strong className="text-white font-mono">{Math.min(signalsPage * 10, signalsTotal)}</strong> of{" "}
                    <strong className="text-white font-mono">{signalsTotal}</strong> signals
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSignalsPage((p) => Math.max(1, p - 1))}
                      disabled={signalsPage <= 1 || signalsLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, signalsTotalPages) }, (_, idx) => {
                        let pageNum = idx + 1;
                        if (signalsTotalPages > 5 && signalsPage > 3) {
                          pageNum = Math.min(signalsTotalPages - 4 + idx, signalsPage - 2 + idx);
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setSignalsPage(pageNum)}
                            disabled={signalsLoading}
                            className={`w-7 h-7 rounded-lg font-mono text-xs transition cursor-pointer ${
                              signalsPage === pageNum
                                ? "bg-white text-black font-semibold"
                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setSignalsPage((p) => Math.min(signalsTotalPages, p + 1))}
                      disabled={signalsPage >= signalsTotalPages || signalsLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 4: Action History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {(metrics?.recentActions?.length || 0) === 0 ? (
            <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-surface)] text-white/50">
              <Layers className="w-10 h-10 mx-auto mb-2 text-white/30" />
              <p>No actions logged yet.</p>
            </div>
          ) : (
            metrics?.recentActions?.map((act) => (
              <div key={act.id} className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-white">{act.actionType}</div>
                  <div className="text-xs text-white/50">{act.reasoning}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    act.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" :
                    act.status === "Rejected" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-white/70"
                  }`}>
                    {act.status}
                  </span>
                  <div className="text-[11px] text-white/30 mt-1">
                    {new Date(act.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Agent Settings & Goal */}
      {activeTab === "settings" && (
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-serif text-white">Agent Mission & Autonomy</h3>
            <p className="text-xs text-white/50 mt-1">
              Configure what the agent watches, its primary goal, and how much autonomous power it holds.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Primary Growth Goal (North Star)
              </label>
              <input
                type="text"
                value={growthGoal}
                onChange={(e) => setGrowthGoal(e.target.value)}
                placeholder="e.g. Grow MarkoPilot in Kenya, reach 500 SaaS founders"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-[var(--border)] text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <p className="text-[11px] text-white/40 mt-1.5">
                The agent shapes every search query, signal scoring, and action planning around this statement.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Autonomy Level
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: "ApproveAll", title: "Approve Everything", desc: "Agent proposes every post & email; you must click approve." },
                  { id: "ApproveOutreach", title: "Approve Outreach", desc: "Auto-posts allowed; cold outreach emails require your approval." },
                  { id: "FullAuto", title: "Full Autonomous", desc: "Agent operates the growth function end-to-end automatically." }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setAutonomyLevel(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      autonomyLevel === opt.id
                        ? "bg-violet-600/10 border-violet-500 text-white"
                        : "bg-black/20 border-[var(--border)] text-white/60 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-semibold text-white mb-1">{opt.title}</div>
                    <div className="text-xs text-white/50 leading-relaxed">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Competitor URLs to Watch
              </label>
              <input
                type="text"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="e.g. competitorA.com, competitorB.io"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-[var(--border)] text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <p className="text-[11px] text-white/40 mt-1">Comma-separated URLs. Agent scans for changes and product updates.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                Watch Keywords & Industry Hashtags
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. social scheduling, SaaS marketing, AI agent"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-[var(--border)] text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <p className="text-[11px] text-white/40 mt-1">Comma-separated terms tracked across Reddit, Twitter, and Web Search.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? "Saving..." : "Save Agent Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
