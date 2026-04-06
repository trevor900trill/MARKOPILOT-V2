"use client";

import { Users, Search, Play, Filter, Download, MailPlus, Trash2, ShieldBan, ExternalLink, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

type Lead = {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  email: string | null;
  linkedinUrl: string | null;
  leadScore: number;
  aiSummary: string;
  status: string;
  discoveredAt: string;
  sourceUrl: string;
};

export default function LeadsPage() {
  const { activeBrand, user } = useBrand();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeads = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const res = await apiGet<{ data: Lead[]; total: number; totalPages: number }>(
        `/leads/${activeBrand.id}?page=${page}&pageSize=20`
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
  }, [activeBrand, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleRunDiscovery = async () => {
    if (!activeBrand) return;
    setIsDiscovering(true);
    try {
      await apiPost(`/leads/${activeBrand.id}/run-now`);
      alert("Discovery job has been queued in the background! Results will populate shortly.");
    } catch (err) {
      console.error("Failed to trigger discovery:", err);
      alert("Failed to trigger discovery. Please try again.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleQueueOutreach = async (leadId: string) => {
    if (!activeBrand) return;
    try {
      await apiPost(`/leads/${activeBrand.id}/${leadId}/queue-outreach`);
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: "outreach_queued" } : l));
    } catch (err) {
      console.error("Failed to queue outreach:", err);
    }
  };

  const handleDisqualify = async (leadId: string) => {
    if (!activeBrand) return;
    try {
      await apiPost(`/leads/${activeBrand.id}/${leadId}/disqualify`);
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: "disqualified" } : l));
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
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 tracking-wider">New</span>;
      case 'outreach_queued': return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider">Queued</span>;
      case 'contacted': return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/20 tracking-wider">Contacted</span>;
      case 'disqualified': return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 tracking-wider">Disqualified</span>;
      default: return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 tracking-wider">{status}</span>;
    }
  };

  const filteredLeads = leads.filter(l =>
    (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highQualityCount = leads.filter(l => l.leadScore >= 80).length;
  const awaitingOutreach = leads.filter(l => l.status === 'new' && l.email).length;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white flex items-center gap-3">
            <Users className="text-[var(--accent-primary)]" size={32} /> Lead Intelligence
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Autonomous mining pipeline sourcing and validating prospects 24/7.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            className="p-2 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition"
            title="Refresh List"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleRunDiscovery}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white hover:bg-opacity-90 rounded-xl transition font-medium text-sm disabled:opacity-50"
          >
            <Play size={16} className={isDiscovering ? "animate-pulse" : ""} />
            {isDiscovering ? "Dispatching Agents..." : "Run Discovery Now"}
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
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">High Quality (&gt;80)</h3>
          <p className="text-2xl font-serif text-white">{highQualityCount}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Awaiting Outreach</h3>
          <p className="text-2xl font-serif text-white">{awaitingOutreach}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Discovery Limits</h3>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-serif text-white">{user?.quotaLeadsUsed ?? 0}<span className="text-[var(--text-muted)] text-base">/{user?.quotaLeadsPerMonth ?? 100}</span></p>
            <span className="text-xs text-[var(--text-muted)] mb-1">this month</span>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111114]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              type="text"
              placeholder="Search leads by name, title, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent-primary)] text-sm text-white transition placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Table structure */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-muted)]">
              <tr>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Prospect Details</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-40">Match Score</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Contact Vector</th>
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
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    {leads.length === 0 ? "No leads discovered yet. Click \"Run Discovery Now\" to get started." : "No prospects match this criteria."}
                  </td>
                </tr>
              ) : filteredLeads.map(lead => (
                <tr key={lead.id} className={`hover:bg-white/5 transition group ${lead.status === 'disqualified' ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 min-w-[250px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center font-serif text-[var(--accent-primary)] font-bold text-lg">
                        {(lead.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">{lead.name || 'Unknown'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {lead.jobTitle || 'N/A'} <span className="text-[var(--text-muted)]">at</span> <span className="font-medium">{lead.company || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {lead.aiSummary && (
                      <div className="mt-3 text-xs text-[var(--text-muted)] whitespace-normal line-clamp-2 max-w-[350px]">
                        &quot;{lead.aiSummary}&quot;
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top pt-6">
                    <span className={`px-2.5 py-1 rounded font-bold text-xs border ${getScoreColor(lead.leadScore)}`}>
                      {lead.leadScore} / 100
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top pt-6 space-y-1.5">
                    {lead.email ? (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {lead.email}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>
                        No Email
                      </div>
                    )}
                    {lead.sourceUrl ? (
                      <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs transition">
                        <ExternalLink size={12} /> LinkedIn Profile
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">LinkedIn Missing</div>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top pt-6">
                    {getStatusBadge(lead.status)}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Search size={10} />
                      {new Date(lead.discoveredAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right align-top pt-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                      {lead.status === 'new' && (
                        <>
                          <button onClick={() => handleQueueOutreach(lead.id)} title="Queue for Email Campaign" className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--accent-primary)] hover:text-white border border-[var(--border)] rounded text-[var(--text-secondary)] transition">
                            <MailPlus size={16} />
                          </button>
                          <button onClick={() => handleDisqualify(lead.id)} title="Disqualify Match" className="p-2 bg-[var(--bg-surface)] hover:bg-neutral-700 hover:text-white border border-[var(--border)] rounded text-[var(--text-secondary)] transition">
                            <ShieldBan size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(lead.id)} title="Delete Lead Permanently" className="p-2 bg-[var(--bg-surface)] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-[var(--border)] rounded text-[var(--text-muted)] transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border)] bg-[#111114] flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">Page {page} of {totalPages} ({totalLeads} total)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-white disabled:opacity-30 transition">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-white disabled:opacity-30 transition">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
