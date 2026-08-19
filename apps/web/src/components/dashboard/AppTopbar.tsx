"use client";

import { Bell, Menu, User, Power, Activity, Award, Send, ShieldAlert, Code2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useBrand } from "@/lib/brand-context";
import { apiGet } from "@/lib/api-client";

type ActivityLog = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};

export function AppTopbar() {
  const { data: session } = useSession();
  const { activeBrand, isLoading } = useBrand();
  const [bellOpen, setBellOpen] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const brandName = activeBrand?.name || "No Brand Selected";
  const brandStatus = activeBrand?.status || "active";
  const userEmail = session?.user?.email || "";

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch recent activity when bell is opened
  const fetchActivity = useCallback(async () => {
    if (!activeBrand) return;
    setLogsLoading(true);
    try {
      const res = await apiGet<{ data: ActivityLog[]; total: number; totalPages: number }>(
        `/brands/${activeBrand.id}/activity?page=1&pageSize=8`
      );
      setLogs(res.data || []);
      setHasNewActivity(false);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [activeBrand]);

  // Check for new activity on mount / brand change
  useEffect(() => {
    if (!activeBrand) return;
    const checkNew = async () => {
      try {
        const res = await apiGet<{ data: ActivityLog[]; total: number }>( 
          `/brands/${activeBrand.id}/activity?page=1&pageSize=1`
        );
        if (res.data && res.data.length > 0) {
          const lastSeen = localStorage.getItem(`markopilot_last_activity_${activeBrand.id}`);
          if (!lastSeen || new Date(res.data[0].createdAt) > new Date(lastSeen)) {
            setHasNewActivity(true);
          }
        }
      } catch {}
    };
    checkNew();
  }, [activeBrand]);

  const handleBellClick = () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (opening) {
      fetchActivity();
      // Mark as seen
      if (activeBrand) {
        localStorage.setItem(`markopilot_last_activity_${activeBrand.id}`, new Date().toISOString());
        setHasNewActivity(false);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "lead_discovered": return <Award className="text-blue-400 flex-shrink-0" size={14} />;
      case "email_sent": return <Send className="text-green-400 flex-shrink-0" size={14} />;
      case "quota_warning": return <ShieldAlert className="text-amber-400 flex-shrink-0" size={14} />;
      case "error": return <ShieldAlert className="text-red-400 flex-shrink-0" size={14} />;
      case "system_event": return <Code2 className="text-[var(--text-secondary)] flex-shrink-0" size={14} />;
      default: return <Activity className="text-[var(--text-muted)] flex-shrink-0" size={14} />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    if (hours > 24) return new Date(dateStr).toLocaleDateString();
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <header className="h-16 bg-[var(--bg-primary)] border-b border-[var(--border)] flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu */}
        <button className="md:hidden text-[var(--text-secondary)]"><Menu /></button>
        
        {/* Brand Context */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="h-5 w-32 bg-white/10 rounded-md" />
              <div className="h-4 w-12 bg-white/5 rounded-full" />
            </div>
          ) : activeBrand ? (
            <>
              <h2 className="text-lg font-medium text-white">{activeBrand.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                brandStatus === "active"
                  ? "bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]"
                  : brandStatus === "paused"
                  ? "bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)]"
                  : "bg-[var(--text-muted)]/10 border border-[var(--border)] text-[var(--text-muted)]"
              }`}>{brandStatus}</span>
            </>
          ) : (
            <h2 className="text-sm font-medium text-[var(--text-muted)]">No Brand Selected</h2>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Notifications Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={handleBellClick}
            className="relative text-[var(--text-muted)] hover:text-white transition p-1"
          >
            <Bell size={20} />
            {hasNewActivity && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--accent-primary)] rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
            )}
          </button>

          {/* Dropdown */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[#111114]">
                <span className="text-sm font-medium text-white">Recent Activity</span>
                <Link
                  href="/dashboard/activity"
                  onClick={() => setBellOpen(false)}
                  className="text-[10px] font-semibold text-[var(--accent-primary)] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border)]">
                {logsLoading ? (
                  <div className="p-6 text-center">
                    <div className="w-5 h-5 border-2 border-white/10 border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                    No activity yet. Events will appear here as the engine runs.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-white/5 transition flex gap-3 items-start">
                      <div className="mt-0.5">{getIcon(log.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white line-clamp-2 leading-relaxed">{log.description}</p>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 block">
                          {formatTimeAgo(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative group cursor-pointer">
           <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent-primary)] transition">
             {session?.user?.image ? (
               <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <User size={16} className="text-[var(--text-muted)]" />
             )}
           </div>
           
           {/* Simple Hover Menu */}
           <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
             <div className="p-3 border-b border-[var(--border)]">
                <p className="text-sm font-medium text-white truncate">{userEmail}</p>
             </div>
             <div className="p-2 space-y-1">
                <Link href="/account" className="block px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface)] rounded-md transition">Account Settings</Link>
             </div>
             <div className="p-2 border-t border-[var(--border)]">
               <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 rounded-md transition">
                 <Power size={14} /> Sign Out
               </button>
             </div>
           </div>
        </div>
      </div>
    </header>
  );
}

