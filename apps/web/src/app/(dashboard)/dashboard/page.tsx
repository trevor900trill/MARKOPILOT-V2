"use client";

import { useSession } from "next-auth/react";
import { Zap, Play, Pause, TrendingUp, Users, Send, Calendar, Activity, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPut } from "@/lib/api-client";

type OverviewData = {
  postsPublished: number;
  leadsDiscovered: number;
  emailsSent: number;
  upcomingPosts: { id: string; platform: string; content: string; scheduledFor: string }[];
  recentLeads: { id: string; name: string; company: string; score: number; status: string }[];
  recentActivity: { id: string; type: string; description: string; createdAt: string }[];
};

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const { activeBrand, refreshBrands } = useBrand();
  const [engineState, setEngineState] = useState<"RUNNING" | "PAUSED">("RUNNING");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeBrand) {
      setEngineState(activeBrand.automationPostsEnabled ? "RUNNING" : "PAUSED");
    }
  }, [activeBrand]);

  const fetchOverview = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const data = await apiGet<OverviewData>(`/brands/${activeBrand.id}/overview`);
      setOverview(data);
    } catch (err) {
      console.error("Failed to fetch overview:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleToggleEngine = async () => {
    if (!activeBrand) return;
    const newState = engineState === "RUNNING" ? "PAUSED" : "RUNNING";
    setEngineState(newState);
    try {
      await apiPut(`/brands/${activeBrand.id}`, {
        ...activeBrand,
        automationPostsEnabled: newState === "RUNNING",
        automationLeadsEnabled: newState === "RUNNING",
        automationOutreachEnabled: newState === "RUNNING",
      });
      await refreshBrands();
    } catch (err) {
      console.error("Failed to toggle engine:", err);
      setEngineState(engineState); // revert
    }
  };

  const stats = overview || { postsPublished: 0, leadsDiscovered: 0, emailsSent: 0 };
  const upcomingPosts = overview?.upcomingPosts || [];
  const recentLeads = overview?.recentLeads || [];

  // Skeleton block
  const Skeleton = () => (
    <div className="animate-pulse space-y-3 p-6">
      <div className="h-4 bg-[var(--bg-surface)] rounded w-1/3"></div>
      <div className="h-8 bg-[var(--bg-surface)] rounded w-1/2"></div>
    </div>
  );

  return (
     <div className="space-y-8 animate-in fade-in max-w-6xl pb-12">
       {/* HEADER & GLOBAL ENGINE STATUS */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
               <h1 className="text-3xl font-serif text-white">Hub Overview</h1>
               <p className="text-[var(--text-secondary)] mt-2">Welcome back, {session?.user?.name || "Pilot"}. Here is your automation telemetry.</p>
           </div>
           <div className="flex items-center gap-4 bg-[var(--bg-elevated)] border border-[var(--border)] p-2 pr-4 rounded-2xl shadow-xl">
               <div className={`w-12 h-12 flex justify-center items-center rounded-xl text-white ${engineState === 'RUNNING' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                   <Zap size={24} />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] p-0 m-0 leading-none mb-1">Global Engine Status</p>
                  <p className={`font-mono font-bold leading-none ${engineState === 'RUNNING' ? 'text-green-400' : 'text-red-400'}`}>{engineState}</p>
               </div>
               <div className="h-8 w-px bg-[var(--border)] mx-2"></div>
               <button 
                  onClick={handleToggleEngine}
                  className="p-2 border border-[var(--border)] hover:bg-[var(--bg-surface)] hover:text-white rounded-lg transition text-[var(--text-secondary)]">
                   {engineState === 'RUNNING' ? <Pause size={18}/> : <Play size={18}/>}
               </button>
           </div>
       </div>

       {/* HIGH LEVEL STATS */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Link href="/dashboard/social" className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent-primary)] transition">
               <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4"><TrendingUp size={20}/></div>
                   <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-white transition" />
               </div>
               <p className="text-[12px] uppercase font-bold tracking-wider text-[var(--text-secondary)] mb-1">Posts Published</p>
               {isLoading ? <div className="h-8 w-16 bg-[var(--bg-surface)] rounded animate-pulse"></div> :
               <h3 className="text-3xl font-serif text-white">{stats.postsPublished.toLocaleString()}</h3>}
           </Link>

           <Link href="/dashboard/leads" className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent-primary)] transition">
               <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center mb-4"><Users size={20}/></div>
                   <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-white transition" />
               </div>
               <p className="text-[12px] uppercase font-bold tracking-wider text-[var(--text-secondary)] mb-1">Leads Extracted</p>
               {isLoading ? <div className="h-8 w-16 bg-[var(--bg-surface)] rounded animate-pulse"></div> :
               <h3 className="text-3xl font-serif text-white">{stats.leadsDiscovered.toLocaleString()}</h3>}
           </Link>

           <Link href="/dashboard/outreach" className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent-primary)] transition">
               <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4"><Send size={20}/></div>
                   <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-white transition" />
               </div>
               <p className="text-[12px] uppercase font-bold tracking-wider text-[var(--text-secondary)] mb-1">Emails Dispatched</p>
               {isLoading ? <div className="h-8 w-16 bg-[var(--bg-surface)] rounded animate-pulse"></div> :
               <h3 className="text-3xl font-serif text-white">{stats.emailsSent.toLocaleString()}</h3>}
           </Link>
       </div>

       {/* DISCOVERY & QUOTA WIDGETS */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Sub-Widget: Social Overview */}
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[#111114]">
                 <h3 className="font-serif text-white flex items-center gap-2"><Calendar size={18} className="text-[var(--text-muted)]" /> Broadcast Queue</h3>
                 <Link href="/dashboard/social" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline">View All</Link>
              </div>
              <div className="divide-y divide-[var(--border)] flex-1 p-2">
                 {isLoading ? <Skeleton /> : upcomingPosts.length === 0 ? (
                   <div className="p-8 text-center text-[var(--text-muted)] text-sm">No posts in the queue yet. Automation will populate this.</div>
                 ) : upcomingPosts.map(post => (
                    <div key={post.id} className="p-4 flex gap-4 items-center">
                       <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></div>
                       <div className="flex-1">
                          <p className="text-sm text-white line-clamp-1">{post.content}</p>
                          <div className="flex gap-3 text-xs text-[var(--text-muted)] mt-1 font-mono">
                             <span>Via {post.platform}</span>
                             <span>{new Date(post.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Sub-Widget: Lean CRM */}
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[#111114]">
                 <h3 className="font-serif text-white flex items-center gap-2"><Activity size={18} className="text-[var(--text-muted)]" /> Recent Captures</h3>
                 <Link href="/dashboard/leads" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline">Full Pipeline</Link>
              </div>
              <div className="divide-y divide-[var(--border)] flex-1 p-2">
                 {isLoading ? <Skeleton /> : recentLeads.length === 0 ? (
                   <div className="p-8 text-center text-[var(--text-muted)] text-sm">No leads discovered yet. Run lead discovery to populate this.</div>
                 ) : recentLeads.map(lead => (
                    <div key={lead.id} className="p-4 flex justify-between items-center">
                       <div>
                          <p className="text-sm font-medium text-white">{lead.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{lead.company}</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${lead.score >= 90 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                             {lead.score} SCR
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

       </div>
     </div>
  );
}
