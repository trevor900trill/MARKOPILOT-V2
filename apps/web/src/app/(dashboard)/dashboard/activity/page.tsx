"use client";

import { useState } from "react";
import { Activity, Search, ShieldAlert, Award, Send, Filter, Code2, Play, Lock, UserPlus, FileText } from "lucide-react";

type ActivityLog = {
  id: string;
  type: string;
  description: string;
  created_at: string;
  metadata?: any;
};

export default function ActivityPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Mock data representing chronological logs
  const logs: ActivityLog[] = [
    {
      id: "1",
      type: "lead_discovered",
      description: "Discovered and qualified 50 new leads.",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      metadata: { count: 50, sources: ["linkedin.com", "ycombinator.com"], avg_score: 84 }
    },
    {
      id: "2",
      type: "email_sent",
      description: "Sent outreach email to 12 recipients.",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "3",
      type: "quota_warning",
      description: "Automated lead discovery paused because lead quota is exhausted.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      metadata: { limits: { current: 500, max: 500, cycle_resets_in: '12d' } }
    },
    {
        id: "4",
        type: "error",
        description: "Failed to dispatch post to Twitter: Rate limit exceeded.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        metadata: { error_code: 429, retry_after: 900, message: "Too many requests to /2/tweets" }
    },
    {
      id: "5",
      type: "system_event",
      description: "Engine runtime started successfully.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    }
  ];

  const filteredLogs = logs.filter(log => filterType === "all" || log.type === filterType);

  const getIcon = (type: string) => {
    switch(type) {
      case 'lead_discovered': return <Award className="text-blue-400" size={18}/>;
      case 'email_sent': return <Send className="text-green-400" size={18}/>;
      case 'quota_warning': return <ShieldAlert className="text-amber-400" size={18}/>;
      case 'error': return <ShieldAlert className="text-red-400" size={18}/>;
      case 'system_event': return <Code2 className="text-[var(--text-secondary)]" size={18}/>;
      default: return <Activity className="text-[var(--text-muted)]" size={18}/>;
    }
  };

  const getBadgeColor = (type: string) => {
    switch(type) {
        case 'lead_discovered': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
        case 'email_sent': return "bg-green-500/10 text-green-400 border-green-500/20";
        case 'quota_warning': return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        case 'error': return "bg-red-500/10 text-red-400 border-red-500/20";
        default: return "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    if (hours > 24) return new Date(dateStr).toLocaleDateString();
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl">
       <div className="flex items-center justify-between">
           <h1 className="text-3xl font-serif text-white flex items-center gap-3">
              <Activity className="text-[var(--accent-primary)]" size={32} />
              Activity Log
           </h1>
           <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1 gap-1">
              <button 
                 onClick={() => setFilterType("all")} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filterType === 'all' ? 'bg-[var(--bg-surface)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
              >
                 All Activity
              </button>
              <button 
                 onClick={() => setFilterType("error")} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filterType === 'error' ? 'bg-red-500/10 text-red-400' : 'text-[var(--text-muted)] hover:text-red-400'}`}
              >
                 Errors
              </button>
           </div>
       </div>

       <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-500">
           
           <div className="p-4 border-b border-[var(--border)] bg-[#111114] flex gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                 <input type="text" placeholder="Search activity logs..." className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent-primary)] transition" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-white transition">
                 <Filter size={16} /> Filter Dates
              </button>
           </div>

           <div className="divide-y divide-[var(--border)]">
              {filteredLogs.map((log) => (
                 <div key={log.id} className="group hover:bg-white/5 transition duration-200">
                     <div 
                        className={`p-5 flex items-start gap-4 cursor-pointer ${expandedLogId === log.id ? 'bg-white/[0.02]' : ''}`} 
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                     >
                        <div className="mt-1 flex-shrink-0">
                           {getIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getBadgeColor(log.type)}`}>
                                 {log.type.replace('_', ' ')}
                              </span>
                              <span className="text-[12px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition">
                                 {formatTimeAgo(log.created_at)}
                              </span>
                           </div>
                           <p className="text-sm text-white font-medium">{log.description}</p>
                           {log.metadata && (
                              <p className="text-[12px] text-[var(--text-muted)] mt-1 font-mono hover:text-[var(--accent-primary)] transition inline-flex items-center gap-1">
                                 <Code2 size={12}/> View execution payload
                              </p>
                           )}
                        </div>
                     </div>
                     
                     {/* Metadata Drawer Expansion */}
                     {expandedLogId === log.id && log.metadata && (
                        <div className="p-4 bg-[#111114] border-t border-[var(--border)] overflow-x-auto text-[13px]">
                           <pre className="font-mono text-[var(--text-secondary)] w-full">
                              {JSON.stringify(log.metadata, null, 2)}
                           </pre>
                        </div>
                     )}
                 </div>
              ))}

              {filteredLogs.length === 0 && (
                 <div className="p-16 text-center text-[var(--text-secondary)]">
                    No activity found matching the current filters.
                 </div>
              )}
           </div>
           
           <div className="p-4 border-t border-[var(--border)] bg-[#111114] flex justify-between items-center">
              <span className="text-xs text-[var(--text-muted)]">Showing {filteredLogs.length} recent events</span>
              <button disabled className="text-xs font-medium text-[var(--text-muted)] px-3 py-1 bg-[var(--bg-surface)] rounded border border-[var(--border)] opacity-50 cursor-not-allowed">Load Older Events</button>
           </div>
       </div>
    </div>
  );
}
