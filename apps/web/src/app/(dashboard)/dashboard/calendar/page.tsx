"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  Zap,
  Users,
  Send,
  Mail,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Share2,
  Briefcase,
  Layers,
  Filter,
  Eye,
  X,
  ExternalLink,
  RefreshCw,
  Lock
} from "lucide-react";
import { XIcon, LinkedInIcon, InstagramIcon, TikTokIcon } from "@/components/icons/SocialIcons";

type TelemetryItem = {
  enabled: boolean;
  nextRunAt: string | null;
  dailyQuota?: number;
  dailyLimit?: number;
  postingDays?: string[];
  postingTimeUtc?: string;
  postsPerWeek?: number;
  delayHours?: number;
  scheduleSummary: string;
};

type ActualPost = {
  id: string;
  platform: string;
  copy: string;
  hashtags: string[];
  mediaUrl?: string | null;
  status: string;
  scheduledFor: string;
  publishedAt?: string | null;
};

type ProjectedEvent = {
  type: "leads" | "social" | "outreach";
  title: string;
  scheduledFor: string;
  status: "projected";
};

type CalendarData = {
  telemetry: {
    leads: TelemetryItem;
    social: TelemetryItem;
    outreach: TelemetryItem;
  };
  actualPosts: ActualPost[];
  projectedEvents: ProjectedEvent[];
};

export default function CalendarPage() {
  const { activeBrand } = useBrand();
  const [data, setData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "timeline">("month");
  const [filterType, setFilterType] = useState<"all" | "social" | "leads" | "outreach">("all");
  const [selectedPost, setSelectedPost] = useState<ActualPost | null>(null);
  const [triggeringWorker, setTriggeringWorker] = useState<string | null>(null);
  const [triggerToast, setTriggerToast] = useState<string | null>(null);

  // Live countdown ticker state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCalendar = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const res = await apiGet<CalendarData>(`/brands/${activeBrand.id}/calendar`);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handleTriggerWorker = async (workerType: "leads" | "posts" | "outreach") => {
    if (!activeBrand) return;
    const engineEnabled =
      workerType === "leads" ? data?.telemetry?.leads?.enabled
      : workerType === "posts" ? data?.telemetry?.social?.enabled
      : data?.telemetry?.outreach?.enabled;

    if (!engineEnabled) {
      toast.error("This automation engine is disabled for this brand. Enable it in Settings to run it manually.");
      return;
    }

    setTriggeringWorker(workerType);
    try {
      await apiPost(`/brands/${activeBrand.id}/trigger/${workerType}`, {});
      setTriggerToast(`Manual ${workerType} job triggered! Results will update shortly.`);
      setTimeout(() => setTriggerToast(null), 4000);
      fetchCalendar();
    } catch (err) {
      console.error("Failed to trigger worker:", err);
      alert("Failed to enqueue job. Please try again.");
    } finally {
      setTriggeringWorker(null);
    }
  };

  const formatCountdown = (targetDateStr: string | null | undefined) => {
    if (isLoading && !data) return "loading";
    if (!targetDateStr) return "Disabled";
    const target = new Date(targetDateStr).getTime();
    const diff = target - now.getTime();
    if (diff <= 0) return "Running soon...";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days}d ${hours % 24}h ${minutes}m`;
    }
    return `in ${hours}h ${minutes}m ${seconds}s`;
  };

  // Calendar matrix calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const daysInMonth = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Combined timeline of all events
  const allTimelineEvents = useMemo(() => {
    if (!data) return [];
    const items: {
      id: string;
      title: string;
      type: "social" | "leads" | "outreach";
      platform?: string;
      time: Date;
      status: string;
      rawPost?: ActualPost;
    }[] = [];

    // Actual posts
    (data.actualPosts || []).forEach((p) => {
      items.push({
        id: p.id,
        title: `${p.platform.toUpperCase()}: ${p.copy ? p.copy.slice(0, 45) + "..." : "Queued Post"}`,
        type: "social",
        platform: p.platform,
        time: new Date(p.scheduledFor || p.publishedAt || Date.now()),
        status: p.status,
        rawPost: p,
      });
    });

    // Projected items
    (data.projectedEvents || []).forEach((proj, idx) => {
      items.push({
        id: `proj-${idx}`,
        title: proj.title,
        type: proj.type,
        time: new Date(proj.scheduledFor),
        status: "projected",
      });
    });

    return items.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [data]);

  const getEventsForDay = (date: Date) => {
    return allTimelineEvents.filter((e) => {
      if (filterType !== "all" && e.type !== filterType) return false;
      return (
        e.time.getFullYear() === date.getFullYear() &&
        e.time.getMonth() === date.getMonth() &&
        e.time.getDate() === date.getDate()
      );
    });
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case "x":
      case "twitter":
        return <span className="bg-white/15 text-white border border-white/30 px-2 py-0.5 rounded-full text-xs font-mono inline-flex items-center gap-1.5"><XIcon size={12} /> X</span>;
      case "linkedin":
        return <span className="bg-[#0A66C2]/30 text-sky-300 border border-sky-400/40 px-2 py-0.5 rounded-full text-xs font-mono inline-flex items-center gap-1.5"><LinkedInIcon size={12} /> LinkedIn</span>;
      case "instagram":
        return <span className="bg-pink-500/25 text-pink-200 border border-pink-400/40 px-2 py-0.5 rounded-full text-xs font-mono inline-flex items-center gap-1.5"><InstagramIcon size={12} /> IG</span>;
      case "tiktok":
        return <span className="bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 px-2 py-0.5 rounded-full text-xs font-mono inline-flex items-center gap-1.5"><TikTokIcon size={12} /> TikTok</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl pb-16">
      {/* Toast Alert */}
      {triggerToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 border border-emerald-400/30">
          <CheckCircle2 size={20} />
          <span className="text-sm font-medium">{triggerToast}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider font-bold">Automation Telemetry</span>
          </div>
          <h1 className="text-3xl font-serif text-white flex items-center gap-3">
            <CalendarIcon className="text-[var(--accent-primary)]" size={32} />
            Execution Calendar & Schedule
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Real-time schedule of autonomous worker runs, content publishing slots, and lead discovery pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCalendar}
            className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-white transition"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* 3 LIVE COUNTDOWN TELEMETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. LEAD DISCOVERY */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--accent-primary)]/50 transition-all duration-300 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${data?.telemetry?.leads?.enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {data?.telemetry?.leads?.enabled ? "Active Engine" : "Paused"}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">Next Lead Discovery</p>
          <div className="text-2xl font-serif font-bold text-white mt-1">
            {formatCountdown(data?.telemetry?.leads?.nextRunAt) === "loading" ? (
              <div className="h-7 w-40 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              formatCountdown(data?.telemetry?.leads?.nextRunAt)
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1.5">
            <Clock size={12} className="text-amber-400" />
            {data?.telemetry?.leads?.scheduleSummary || "Configuring cron..."}
          </p>

          <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Batch: {data?.telemetry?.leads?.dailyQuota ?? 10} leads/day</span>
            <button
              onClick={() => handleTriggerWorker("leads")}
              disabled={triggeringWorker === "leads" || !data?.telemetry?.leads?.enabled}
              title={!data?.telemetry?.leads?.enabled ? "Lead discovery automation is disabled for this brand" : "Run lead discovery now"}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {triggeringWorker === "leads" ? <RefreshCw size={12} className="animate-spin" /> : !data?.telemetry?.leads?.enabled ? <Lock size={12} /> : <Play size={12} />}
              {!data?.telemetry?.leads?.enabled ? "Disabled" : "Run Now"}
            </button>
          </div>
        </div>

        {/* 2. SOCIAL POSTING */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--accent-primary)]/50 transition-all duration-300 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center">
              <Send size={20} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${data?.telemetry?.social?.enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {data?.telemetry?.social?.enabled ? "Active Engine" : "Paused"}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">Next Social Post Generation</p>
          <div className="text-2xl font-serif font-bold text-white mt-1">
            {formatCountdown(data?.telemetry?.social?.nextRunAt) === "loading" ? (
              <div className="h-7 w-40 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              formatCountdown(data?.telemetry?.social?.nextRunAt)
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1.5">
            <Clock size={12} className="text-[var(--accent-primary)]" />
            {data?.telemetry?.social?.scheduleSummary || "Configuring cron..."}
          </p>

          <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">{data?.telemetry?.social?.postsPerWeek ?? 5} posts / week</span>
            <button
              onClick={() => handleTriggerWorker("posts")}
              disabled={triggeringWorker === "posts" || !data?.telemetry?.social?.enabled}
              title={!data?.telemetry?.social?.enabled ? "Social posting automation is disabled for this brand" : "Generate social posts now"}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {triggeringWorker === "posts" ? <RefreshCw size={12} className="animate-spin" /> : !data?.telemetry?.social?.enabled ? <Lock size={12} /> : <Play size={12} />}
              {!data?.telemetry?.social?.enabled ? "Disabled" : "Generate Now"}
            </button>
          </div>
        </div>

        {/* 3. EMAIL OUTREACH */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--accent-primary)]/50 transition-all duration-300 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${data?.telemetry?.outreach?.enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {data?.telemetry?.outreach?.enabled ? "Active Engine" : "Paused"}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">Next Outreach Dispatch</p>
          <div className="text-2xl font-serif font-bold text-white mt-1">
            {formatCountdown(data?.telemetry?.outreach?.nextRunAt) === "loading" ? (
              <div className="h-7 w-40 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              formatCountdown(data?.telemetry?.outreach?.nextRunAt)
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1.5">
            <Clock size={12} className="text-purple-400" />
            {data?.telemetry?.outreach?.scheduleSummary || "Configuring cron..."}
          </p>

          <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Max {data?.telemetry?.outreach?.dailyLimit ?? 20}/day</span>
            <button
              onClick={() => handleTriggerWorker("outreach")}
              disabled={triggeringWorker === "outreach" || !data?.telemetry?.outreach?.enabled}
              title={!data?.telemetry?.outreach?.enabled ? "Email outreach automation is disabled for this brand" : "Send outreach batch now"}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {triggeringWorker === "outreach" ? <RefreshCw size={12} className="animate-spin" /> : !data?.telemetry?.outreach?.enabled ? <Lock size={12} /> : <Play size={12} />}
              {!data?.telemetry?.outreach?.enabled ? "Disabled" : "Send Batch"}
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: Filters, Month Nav, View Mode */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-serif text-white min-w-44">
            {monthName} {year}
          </h2>
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border)]">
            <button onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition">
              <ChevronLeft size={16} />
            </button>
            <button onClick={today} className="px-2.5 py-1 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5 font-medium transition">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filterType === "all" ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"}`}
          >
            All Channels
          </button>
          <button
            onClick={() => setFilterType("social")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${filterType === "social" ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"}`}
          >
            <Send size={12} /> Social Posts
          </button>
          <button
            onClick={() => setFilterType("leads")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${filterType === "leads" ? "bg-amber-500 text-white" : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"}`}
          >
            <Users size={12} /> Leads
          </button>
          <button
            onClick={() => setFilterType("outreach")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${filterType === "outreach" ? "bg-purple-600 text-white" : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"}`}
          >
            <Mail size={12} /> Outreach
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border)]">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === "month" ? "bg-[var(--bg-elevated)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            Month Grid
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === "timeline" ? "bg-[var(--bg-elevated)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            Upcoming List
          </button>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {viewMode === "month" && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-white/[0.02]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-3 text-center text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border)]">
            {daysInMonth.map((dayObj, index) => {
              const isToday =
                dayObj.date.getDate() === now.getDate() &&
                dayObj.date.getMonth() === now.getMonth() &&
                dayObj.date.getFullYear() === now.getFullYear();

              const dayEvents = getEventsForDay(dayObj.date);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 flex flex-col transition-colors ${dayObj.isCurrentMonth ? "bg-transparent" : "bg-black/30 opacity-40"} ${isToday ? "ring-1 ring-inset ring-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/[0.03]" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center ${isToday ? "bg-[var(--accent-primary)] text-white font-bold shadow-md shadow-[var(--accent-primary)]/30" : "text-gray-400"}`}
                    >
                      {dayObj.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {dayEvents.length} {dayEvents.length === 1 ? "task" : "tasks"}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 overflow-y-auto max-h-[100px] flex-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const isSocial = event.type === "social";
                      const isLeads = event.type === "leads";
                      const isOutreach = event.type === "outreach";

                      let badgeStyle = "bg-white/5 border-white/10 text-gray-300";
                      if (event.status === "published") badgeStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
                      else if (isSocial) badgeStyle = "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]";
                      else if (isLeads) badgeStyle = "bg-amber-500/10 border-amber-500/30 text-amber-300";
                      else if (isOutreach) badgeStyle = "bg-purple-500/10 border-purple-500/30 text-purple-300";

                      return (
                        <div
                          key={event.id}
                          onClick={() => event.rawPost && setSelectedPost(event.rawPost)}
                          className={`text-[11px] p-1.5 rounded-lg border flex items-center gap-1.5 truncate cursor-pointer hover:scale-[1.02] transition ${badgeStyle}`}
                          title={`${event.title} (${event.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`}
                        >
                          {event.platform && getPlatformBadge(event.platform)}
                          {isLeads && <Users size={10} className="text-amber-400 flex-shrink-0" />}
                          {isOutreach && <Mail size={10} className="text-purple-400 flex-shrink-0" />}
                          <span className="truncate">{event.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-mono text-[var(--text-muted)] text-center pt-0.5">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TIMELINE VIEW */}
      {viewMode === "timeline" && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-lg font-serif text-white mb-4">Upcoming Schedule Queue (Next 30 Days)</h3>
          {allTimelineEvents.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)]">
              No upcoming automation events scheduled. Make sure automation is enabled in Settings.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {allTimelineEvents
                .filter((e) => filterType === "all" || e.type === filterType)
                .map((event) => (
                  <div
                    key={event.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] px-3 rounded-2xl transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${event.type === 'social' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20' : event.type === 'leads' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                        {event.type === 'social' && <Send size={16} />}
                        {event.type === 'leads' && <Users size={16} />}
                        {event.type === 'outreach' && <Mail size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{event.title}</span>
                          {event.platform && getPlatformBadge(event.platform)}
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${event.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : event.status === 'queued' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2 font-mono">
                          <Clock size={12} />
                          {event.time.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at {event.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
                        </p>
                      </div>
                    </div>

                    {event.rawPost && (
                      <button
                        onClick={() => setSelectedPost(event.rawPost!)}
                        className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-white/10 border border-[var(--border)] rounded-xl text-xs text-white flex items-center gap-1.5 self-start md:self-auto transition"
                      >
                        <Eye size={12} /> View Copy & Preview
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* POST PREVIEW MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#18181c] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {getPlatformBadge(selectedPost.platform)}
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  selectedPost.status === 'published' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : selectedPost.status === 'failed'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {selectedPost.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-serif font-semibold text-white mb-1">Scheduled Social Post</h3>
                <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  <Clock size={13} className="text-[var(--accent-primary)]" />
                  {new Date(selectedPost.scheduledFor).toLocaleString()}
                </p>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-gray-100 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">
                {selectedPost.copy}
              </div>

              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPost.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 px-2 py-0.5 rounded-lg">
                      #{tag.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              )}

              {selectedPost.mediaUrl && (
                <div className="rounded-xl overflow-hidden border border-white/10 max-h-52 bg-black">
                  <img src={selectedPost.mediaUrl} alt="Post media" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
