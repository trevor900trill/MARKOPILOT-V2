"use client";

import { 
  Users, Search, Play, Filter, Download, MailPlus, Trash2, ShieldBan, 
  ExternalLink, RefreshCw, Sparkles, ChevronDown, ChevronUp, Mail, 
  HelpCircle, CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, X, Ban,
  ChevronLeft, ChevronRight, AlertCircle, Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import { DiscoveryInsights, QueryPerformance } from "@/components/discovery-insights";
import { MpesaCheckoutModal } from "@/components/dashboard/MpesaCheckoutModal";

type Lead = {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  email: string | null;
  emailStatus?: string;
  emailConfidence?: number;
  emailSource?: string | null;
  isCatchAll?: boolean;
  isSuppressed?: boolean;
  verificationStatus?: string | null;
  linkedinUrl: string | null;
  leadScore: number;
  aiSummary: string;
  status: string;
  discoveredAt: string;
  sourceUrl: string;
};

type FilterType = "all" | "enriched" | "high_value" | "suppressed";

export default function LeadsPage() {
  const { activeBrand, user, refreshUser, refreshBrands } = useBrand();

  // Gate actions on the real automation switches — not the subscription record.
  const leadsAutomationEnabled = activeBrand?.automationLeadsEnabled ?? false;
  const outreachAutomationEnabled = activeBrand?.automationOutreachEnabled ?? false;
  const isSubscriptionActive = user?.isSubscriptionActive ?? true;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterType>("all");
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [performance, setPerformance] = useState<QueryPerformance[]>([]);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const fetchLeads = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (filterMode && filterMode !== "all") {
        params.set("filterMode", filterMode);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      const res = await apiGet<{ data: Lead[]; total: number; totalPages: number }>(
        `/leads/${activeBrand.id}?${params.toString()}`
      );
      setLeads(res.data || []);
      setTotalLeads(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand, page, filterMode, searchQuery]);

  const fetchPerformance = useCallback(async () => {
    if (!activeBrand) return;
    setIsPerformanceLoading(true);
    try {
      const res = await apiGet<QueryPerformance[]>(`/brands/${activeBrand.id}/discovery/performance`);
      setPerformance(res || []);
    } catch (err) {
      console.error("Failed to fetch discovery performance:", err);
      setPerformance([]);
    } finally {
      setIsPerformanceLoading(false);
    }
  }, [activeBrand]);

  useEffect(() => {
    fetchLeads();
    fetchPerformance();
  }, [fetchLeads, fetchPerformance]);

  const handleRunDiscovery = async () => {
    if (!activeBrand) return;
    if (!isSubscriptionActive) {
      toast.error("Cannot run discovery: your trial or subscription has expired. Please pay via M-PESA.");
      setShowMpesaModal(true);
      return;
    }
    if (!leadsAutomationEnabled) {
      toast.error("Lead discovery automation is disabled for this brand. Enable it in Settings to run it manually.");
      return;
    }
    setIsDiscovering(true);
    try {
      await apiPost(`/leads/${activeBrand.id}/run-now`);
      toast.success("Discovery job has been queued in the background! Results will populate shortly.");
    } catch (err: any) {
      console.error("Failed to trigger discovery:", err);
      if (err?.code === "ENGINE_PAUSED") {
        toast.error("Engine paused: trial or subscription is expired. Please pay via M-PESA.");
        setShowMpesaModal(true);
      } else {
        toast.error(err?.message || "Failed to trigger discovery. Please try again.");
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleQueueOutreach = async (leadId: string) => {
    if (!activeBrand) return;
    if (!isSubscriptionActive) {
      toast.error("Cannot queue outreach: your trial or subscription has expired. Please pay via M-PESA.");
      setShowMpesaModal(true);
      return;
    }
    if (!outreachAutomationEnabled) {
      toast.error("Email outreach automation is disabled for this brand. Enable it in Settings to queue leads.");
      return;
    }
    try {
      await apiPost(`/leads/${activeBrand.id}/${leadId}/queue-outreach`);
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: "outreach_queued" } : l));
      toast.success("Lead queued for autonomous email outreach!");
    } catch (err: any) {
      console.error("Failed to queue outreach:", err);
      if (err?.code === "ENGINE_PAUSED") {
        toast.error("Engine paused: trial or subscription is expired. Please pay via M-PESA.");
        setShowMpesaModal(true);
      } else {
        toast.error(err?.message || "Could not queue outreach for this lead.");
      }
    }
  };

  const handleDisqualify = async (leadId: string) => {
    if (!activeBrand) return;
    try {
      await apiPost(`/leads/${activeBrand.id}/${leadId}/disqualify`);
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: "disqualified" } : l));
      toast.info("Lead marked as disqualified.");
    } catch (err) {
      console.error("Failed to disqualify:", err);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!activeBrand) return;
    try {
      await apiDelete(`/leads/${activeBrand.id}/${leadId}`);
      setLeads(leads.filter(l => l.id !== leadId));
      setTotalLeads(prev => prev - 1);
      toast.success("Lead removed.");
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (score >= 60) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  const getStatusBadge = (status: string, isSuppressed?: boolean) => {
    if (isSuppressed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20 tracking-wider">
          <Ban size={10} /> Unsubscribed
        </span>
      );
    }
    switch (status) {
      case 'new': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 tracking-wider">New</span>;
      case 'outreach_queued': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider">Queued</span>;
      case 'contacted': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">Contacted</span>;
      case 'disqualified': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 tracking-wider">Disqualified</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 tracking-wider">{status}</span>;
    }
  };

  const getEmailBadge = (lead: Lead) => {
    if (lead.isSuppressed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <Ban size={10} /> Opted-Out
        </span>
      );
    }

    if (lead.email) {
      const status = lead.emailStatus?.toLowerCase() || "verified";
      if (status === "verified") {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Verified {lead.emailConfidence && lead.emailConfidence > 0 ? `${Math.round(lead.emailConfidence * 100)}%` : ""}
          </span>
        );
      }
      if (status === "risky" || lead.isCatchAll) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Catch-All / Risky
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          {lead.emailSource ? lead.emailSource.replace("_", " ") : "Pattern Derived"}
        </span>
      );
    }

    // When lead does NOT have an email:
    const status = lead.emailStatus?.toLowerCase();
    if (status === "unfindable" || status === "exhausted") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
          Unfindable
        </span>
      );
    }

    // Default: Enrichment pending / queued
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        Pending Enrichment
      </span>
    );
  };

  const highQualityCount = leads.filter(l => l.leadScore >= 80).length;
  const enrichedCount = leads.filter(l => !!l.email).length;
  const suppressedCount = leads.filter(l => !!l.isSuppressed).length;

  return (
    <div data-tour="page-leads-body" className="space-y-8 animate-in fade-in max-w-7xl pb-16">
      {/* EXPIRED SUBSCRIPTION BANNER */}
      {!isSubscriptionActive && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-white">Lead Discovery Engine Paused</h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Your trial or subscription has ended. Automated lead mining and queuing outreach are paused. Pay via M-PESA to resume.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMpesaModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition whitespace-nowrap shadow-lg shadow-emerald-500/20"
          >
            <Smartphone size={14} /> Pay via M-PESA
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 data-tour="page-leads-head" className="text-3xl font-serif text-white flex items-center gap-3">
            <Users className="text-[var(--accent-primary)]" size={32} /> Lead Intelligence
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Autonomous mining pipeline sourcing and validating prospects 24/7.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--border)] rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-[var(--bg-elevated)] transition"
          >
            <HelpCircle size={14} className="text-emerald-400" /> Status Guide
          </button>
          <button
            onClick={fetchLeads}
            className="p-2 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition"
            title="Refresh List"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleRunDiscovery}
            disabled={isDiscovering || !leadsAutomationEnabled}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white hover:bg-opacity-90 rounded-xl transition font-medium text-xs disabled:opacity-50"
            title={!leadsAutomationEnabled ? "Lead discovery automation is disabled for this brand" : "Run discovery now"}
          >
            <Play size={14} className={isDiscovering ? "animate-pulse" : ""} />
            {!leadsAutomationEnabled ? "Discovery Disabled" : (isDiscovering ? "Dispatching Agents..." : "Run Discovery Now")}
          </button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Total Leads Mined</h3>
          <p className="text-2xl font-serif text-white">{totalLeads}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Enriched Contacts</h3>
          <p className="text-2xl font-serif text-white">{enrichedCount}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">High Quality (&ge;80)</h3>
          <p className="text-2xl font-serif text-white">{highQualityCount}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Monthly Capacity</h3>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-serif text-white">{user?.quotaLeadsUsed ?? 0}<span className="text-[var(--text-muted)] text-sm">/{user?.quotaLeadsPerMonth ?? 150}</span></p>
            <span className="text-xs text-[var(--text-muted)] mb-1">this cycle</span>
          </div>
        </div>
      </div>

      <DiscoveryInsights performance={performance} isLoading={isPerformanceLoading} />

      {/* Engine Paused Banner (lead + outreach switches off) */}
      {!leadsAutomationEnabled && !outreachAutomationEnabled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 mb-6">
          <AlertCircle className="text-amber-400 flex-shrink-0" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Autonomous Engine Paused</h3>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Lead discovery and email outreach are currently paused. This usually happens when your trial or subscription ends — renew via M-PESA to resume.
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/dashboard/account"}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition"
          >
            Renew Subscription
          </button>
        </div>
      )}

      {/* Main Table Area */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111114]">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              placeholder="Search by name, title, company, or email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent-primary)] text-xs text-white transition placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => { setFilterMode("all"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterMode === "all"
                  ? "bg-white text-black font-semibold shadow"
                  : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              All Leads ({leads.length})
            </button>
            <button
              onClick={() => { setFilterMode("enriched"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterMode === "enriched"
                  ? "bg-emerald-500 text-black font-semibold shadow"
                  : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              Enriched with Email ({enrichedCount})
            </button>
            <button
              onClick={() => { setFilterMode("high_value"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterMode === "high_value"
                  ? "bg-[var(--accent-primary)] text-white font-semibold shadow"
                  : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              High Quality &ge;80 ({highQualityCount})
            </button>
            <button
              onClick={() => { setFilterMode("suppressed"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterMode === "suppressed"
                  ? "bg-red-500 text-white font-semibold shadow"
                  : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              Suppressed ({suppressedCount})
            </button>
          </div>
        </div>

        {/* Table structure */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-muted)]">
              <tr>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Prospect Details</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-36">Match Score</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Contact &amp; Enrichment</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    <RefreshCw className="animate-spin inline-block mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    {searchQuery || filterMode !== "all"
                      ? "No prospects match your active filter."
                      : "No leads discovered yet. Click \"Run Discovery Now\" to start mining prospects."}
                  </td>
                </tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className={`hover:bg-white/5 transition group ${lead.status === 'disqualified' || lead.isSuppressed ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center font-serif text-[var(--accent-primary)] font-bold text-sm">
                        {(lead.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2 text-xs">
                          {lead.name || 'Unknown Prospect'}
                          {lead.isSuppressed && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-mono">Opted Out</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {lead.jobTitle || 'N/A'} <span className="text-[var(--text-muted)]">at</span> <span className="font-medium text-gray-300">{lead.company || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {lead.aiSummary && (
                      <div className="mt-2.5 max-w-[340px]">
                        <p className={`text-[11px] text-[var(--text-muted)] whitespace-normal ${expandedLeads.has(lead.id) ? '' : 'line-clamp-2'}`}>
                          &quot;{lead.aiSummary}&quot;
                        </p>
                        {lead.aiSummary.length > 90 && (
                          <button
                            onClick={() => toggleExpand(lead.id)}
                            className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] hover:text-white mt-1 transition font-medium"
                          >
                            {expandedLeads.has(lead.id) ? <><ChevronUp size={10} /> Show less</> : <><ChevronDown size={10} /> Read full analysis</>}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top pt-5">
                    <span className={`px-2.5 py-1 rounded font-bold text-xs border ${getScoreColor(lead.leadScore)}`}>
                      {lead.leadScore} / 100
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top pt-5 space-y-1.5">
                    <div className="flex flex-col gap-1">
                      {lead.email ? (
                        <div className="flex items-center gap-1.5 text-white font-medium text-xs">
                          <Mail size={12} className="text-[var(--accent-primary)] flex-shrink-0" />
                          <span className="truncate max-w-[180px]" title={lead.email}>{lead.email}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2">
                        {getEmailBadge(lead)}
                      </div>
                    </div>
                    {lead.sourceUrl ? (
                      <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-[11px] transition">
                        <ExternalLink size={11} /> Profile Link
                      </a>
                    ) : (
                      <div className="text-[11px] text-[var(--text-muted)]">Source N/A</div>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top pt-5">
                    {getStatusBadge(lead.status, lead.isSuppressed)}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Clock size={10} />
                      {new Date(lead.discoveredAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right align-top pt-5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition">
                      {lead.status === 'new' && !lead.isSuppressed && lead.email && (
                        <button 
                          onClick={() => handleQueueOutreach(lead.id)} 
                          title="Queue for Email Campaign" 
                          className="p-1.5 bg-[var(--bg-surface)] hover:bg-[var(--accent-primary)] hover:text-white border border-[var(--border)] rounded-lg text-[var(--text-secondary)] transition"
                        >
                          <MailPlus size={14} />
                        </button>
                      )}
                      {lead.status === 'new' && !lead.isSuppressed && (
                        <button 
                          onClick={() => handleDisqualify(lead.id)} 
                          title="Disqualify Match" 
                          className="p-1.5 bg-[var(--bg-surface)] hover:bg-neutral-700 hover:text-white border border-[var(--border)] rounded-lg text-[var(--text-secondary)] transition"
                        >
                          <ShieldBan size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(lead.id)} 
                        title="Delete Lead Permanently" 
                        className="p-1.5 bg-[var(--bg-surface)] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-[var(--border)] rounded-lg text-[var(--text-muted)] transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[#111114]">
            <div className="text-xs text-[var(--text-muted)]">
              Showing page {page} of {totalPages} ({totalLeads} total leads)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                        page === pageNum
                          ? "bg-[var(--accent-primary)] text-white"
                          : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ENRICHMENT & STATUS GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Lead Intelligence &amp; Status Guide</h2>
                <p className="text-xs text-gray-400">How Markopilot evaluates, enriches, and respects opt-out requests</p>
              </div>
            </div>

            <div className="space-y-6 text-xs text-gray-300">
              {/* SECTION 1: Email Enrichment Statuses */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white border-b border-white/5 pb-2">
                  Email Verification Badges
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified (90%+)
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Confirmed via live SMTP handshake / MX probe. High inbox delivery rate and lowest bounce probability.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Catch-All / Risky
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      The recipient company mail server accepts all incoming mail. Handled with throttled dispatch to maintain sender reputation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Pattern Derived
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Derived from historical pattern intelligence (e.g. <code>first.last@company.com</code>) matching known team formats.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span> Unfindable
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      No public footprint or MX pattern available. Held for a 30-day cooldown before any retry.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Suppression & Opt-Out */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white border-b border-white/5 pb-2">
                  Suppression &amp; Unsubscribe Enforcement
                </h3>
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    <Ban size={12} /> Suppressed (Brand-Scoped Opt-Out)
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    When a recipient clicks the unsubscribe link or triggers an RFC header opt-out in their email client:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-gray-400">
                    <li>They are added to this brand's suppression list table immediately.</li>
                    <li>All queued outreach and automated follow-ups for this contact are cancelled.</li>
                    <li>The system prevents any future emails from ever being dispatched to them from this brand.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 3: Match Scoring Heuristic */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white border-b border-white/5 pb-2">
                  100-Point Match Score Heuristic
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">85 – 100 (Tier 1)</span>
                    <span className="text-[11px] text-gray-400">Decision maker matching target job title, pain point, and industry perfectly.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
                    <span className="text-xs font-bold text-amber-400 block mb-1">60 – 84 (Tier 2)</span>
                    <span className="text-[11px] text-gray-400">Good profile fit within target industry with adjacent operational title.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20">
                    <span className="text-xs font-bold text-red-400 block mb-1">&lt; 60 (Low)</span>
                    <span className="text-[11px] text-gray-400">Weak match; recommended to review before dispatching custom copy.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* M-PESA CHECKOUT MODAL */}
      <MpesaCheckoutModal
        isOpen={showMpesaModal}
        onClose={() => setShowMpesaModal(false)}
        initialPlanId={user?.planName || "starter"}
        onSuccess={async () => {
          await refreshUser();
          await refreshBrands();
          fetchLeads();
        }}
      />
    </div>
  );
}
