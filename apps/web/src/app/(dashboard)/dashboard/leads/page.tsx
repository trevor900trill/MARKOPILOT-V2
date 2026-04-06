"use client";

import { Users, Search, Play, Filter, Download, Plus, MailPlus, Trash2, ShieldBan, ExternalLink, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

// Mock Lead type mirroring backend Lead.cs model
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeads = async () => {
    setIsLoading(true);
    // Stubbing the fetch request for frontend demo presentation
    setTimeout(() => {
      setLeads([
        {
          id: "1", name: "Sarah Jenkins", jobTitle: "VP of Marketing", company: "TechFlow Solutions",
          email: "sarah.j@techflow.io", linkedinUrl: "https://linkedin.com/in/sjenkins",
          leadScore: 92, status: "new", discoveredAt: new Date().toISOString(), sourceUrl: "https://techflow.io/about",
          aiSummary: "Perfect match! VP-level decision maker actively steering B2B SaaS marketing. Target pain point aligns with her recent initiatives."
        },
        {
          id: "2", name: "Michael Chang", jobTitle: "Director of Product", company: "Nexus Dynamics",
          email: null, linkedinUrl: "https://linkedin.com/in/mchang54",
          leadScore: 78, status: "new", discoveredAt: new Date(Date.now() - 86400000).toISOString(), sourceUrl: "https://nexusdynamics.com",
          aiSummary: "Strong fit based on product synergy, though typically a co-decision maker rather than primary budget holder."
        },
        {
          id: "3", name: "Elena Rodriguez", jobTitle: "Founder & CEO", company: "Horizon AI",
          email: "elena@horizonai.co", linkedinUrl: null,
          leadScore: 85, status: "outreach_queued", discoveredAt: new Date(Date.now() - 172800000).toISOString(), sourceUrl: "https://news.ycombinator.com",
          aiSummary: "Excellent match for startup tier plans. High authority, looking to rapidly scale internal ops."
        }
      ]);
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    try {
      // Stub: fetch POST /api/leads/00000000-0000-0000-0000-000000000000/run-now
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("Discovery job has been queued in the background! Results will populate shortly.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleQueueOutreach = (id: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: "outreach_queued" } : l));
  };
  
  const handleDisqualify = (id: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: "disqualified" } : l));
  };

  const handleDelete = (id: string) => {
    setLeads(leads.filter(l => l.id !== id));
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
      case 'disqualified': return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 tracking-wider">Disqualified</span>;
      default: return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 tracking-wider">{status}</span>;
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition font-medium text-sm">
            <Download size={16} /> Export CSV
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
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Total Leades Mined</h3>
            <p className="text-2xl font-serif text-white">48</p>
         </div>
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">High Quality (&gt;80)</h3>
            <p className="text-2xl font-serif text-white">12</p>
         </div>
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Awaiting Outreach</h3>
            <p className="text-2xl font-serif text-white">6</p>
         </div>
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-5 rounded-2xl">
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">Discovery Limits</h3>
            <div className="flex items-end gap-2">
               <p className="text-2xl font-serif text-white">48<span className="text-[var(--text-muted)] text-base">/150</span></p>
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
           <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition rounded-lg hover:bg-white/5">
              <Filter size={16} /> Filters
           </button>
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
                      No prospects match this criteria.
                   </td>
                </tr>
              ) : filteredLeads.map(lead => (
                <tr key={lead.id} className={`hover:bg-white/5 transition group ${lead.status === 'disqualified' ? 'opacity-50' : ''}`}>
                   
                   {/* Prospect Details */}
                   <td className="px-6 py-4 min-w-[250px]">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center font-serif text-[var(--accent-primary)] font-bold text-lg">
                            {lead.name.charAt(0)}
                         </div>
                         <div>
                            <div className="font-medium text-white flex items-center gap-2">
                               {lead.name}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">
                               {lead.jobTitle} <span className="text-[var(--text-muted)]">at</span> <span className="font-medium">{lead.company}</span>
                            </div>
                         </div>
                      </div>
                      <div className="mt-3 text-xs text-[var(--text-muted)] whitespace-normal line-clamp-2 max-w-[350px]">
                        "{lead.aiSummary}"
                      </div>
                   </td>
                   
                   {/* Match Score */}
                   <td className="px-6 py-4 align-top pt-6">
                      <span className={`px-2.5 py-1 rounded font-bold text-xs border ${getScoreColor(lead.leadScore)}`}>
                         {lead.leadScore} / 100
                      </span>
                   </td>
                   
                   {/* Contact Vector */}
                   <td className="px-6 py-4 align-top pt-6 space-y-1.5">
                      {lead.email ? (
                        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                           {lead.email}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>
                           No Email Cached
                        </div>
                      )}
                      
                      {lead.linkedinUrl ? (
                         <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs transition">
                            <ExternalLink size={12} /> LinkedIn Profile
                         </a>
                      ) : (
                         <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
                             LinkedIn Mising
                         </div>
                      )}
                   </td>
                   
                   {/* Status */}
                   <td className="px-6 py-4 align-top pt-6">
                      {getStatusBadge(lead.status)}
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                         <Search size={10} />
                         {new Date(lead.discoveredAt).toLocaleDateString()}
                      </div>
                   </td>
                   
                   {/* Actions */}
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
      </div>
    </div>
  );
}
