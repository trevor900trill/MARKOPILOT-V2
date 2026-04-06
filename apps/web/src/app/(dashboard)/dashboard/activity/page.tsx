"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Search, ShieldAlert, Award, Send, Filter, Code2 } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { apiGet } from "@/lib/api-client";

type ActivityLog = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};

export default function ActivityPage() {
  const { activeBrand } = useBrand();
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const typeParam = filterType !== "all" ? `&type=${filterType}` : "";
      const res = await apiGet<{ data: ActivityLog[]; total: number; totalPages: number }>(
        `/brands/${activeBrand.id}/activity?page=${page}&pageSize=50${typeParam}`
      );
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand, page, filterType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
                 onClick={() => { setFilterType("all"); setPage(1); }} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filterType === 'all' ? 'bg-[var(--bg-surface)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
              >
                 All Activity
              </button>
              <button 
                 onClick={() => { setFilterType("error"); setPage(1); }} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filterType === 'error' ? 'bg-red-500/10 text-red-400' : 'text-[var(--text-muted)] hover:text-red-400'}`}
              >
                 Errors
              </button>
           </div>
       </div>

       <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-500">
           <div className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <div className="p-16 text-center text-[var(--text-muted)] animate-pulse">Loading activity logs...</div>
              ) : logs.length === 0 ? (
                <div className="p-16 text-center text-[var(--text-secondary)]">
                   {filterType === "all" ? "No activity recorded yet. Actions by the automation engine will appear here." : "No errors found."}
                </div>
              ) : logs.map((log) => (
                 <div key={log.id} className="group hover:bg-white/5 transition duration-200">
                     <div className="p-5 flex items-start gap-4">
                        <div className="mt-1 flex-shrink-0">{getIcon(log.type)}</div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getBadgeColor(log.type)}`}>
                                 {log.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[12px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition">
                                 {formatTimeAgo(log.createdAt)}
                              </span>
                           </div>
                           <p className="text-sm text-white font-medium">{log.description}</p>
                        </div>
                     </div>
                 </div>
              ))}
           </div>
           
           <div className="p-4 border-t border-[var(--border)] bg-[#111114] flex justify-between items-center">
              <span className="text-xs text-[var(--text-muted)]">Showing {logs.length} of {total} events</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <button onClick={() => setPage(p => p - 1)} className="text-xs font-medium text-[var(--text-secondary)] px-3 py-1 bg-[var(--bg-surface)] rounded border border-[var(--border)] hover:text-white transition">Previous</button>
                )}
                {page < totalPages && (
                  <button onClick={() => setPage(p => p + 1)} className="text-xs font-medium text-[var(--text-secondary)] px-3 py-1 bg-[var(--bg-surface)] rounded border border-[var(--border)] hover:text-white transition">Load Older Events</button>
                )}
              </div>
           </div>
       </div>
    </div>
  );
}
