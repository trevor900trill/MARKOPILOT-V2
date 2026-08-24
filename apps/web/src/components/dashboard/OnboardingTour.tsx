"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X, ChevronRight, ChevronLeft, Sparkles, Rocket, PartyPopper, RotateCcw, Loader2,
  LayoutDashboard, Briefcase, Calendar, Send, Users, Mail, Activity, Settings, CreditCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

// ── Tour Step Definitions ─────────────────────────────────────────

type TourStep = {
  target: string;        // data-tour attribute value
  title: string;
  body: string;
  emoji: string;
  position: "bottom" | "top" | "left" | "right";
  route?: string;         // which dashboard route this step lives on (enables cross-page navigation)
};

type TourMeta = {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  steps: TourStep[];
};

// ── Overview (app shell) steps ────────────────────────────────────
const OVERVIEW_STEPS: TourStep[] = [
  {
    target: "brand-switcher",
    title: "Your Brand Hub",
    body: "Switch between brands instantly. Each brand has its own AI voice, social accounts, and lead pipeline — like separate copilots for each business.",
    emoji: "🏢",
    position: "right",
  },
  {
    target: "engine-status",
    title: "The Autopilot Switch",
    body: "Green means Markopilot is actively generating posts, discovering leads, and sending outreach for you. Pause it anytime with one click.",
    emoji: "⚡",
    position: "bottom",
  },
  {
    target: "stats-cards",
    title: "Your Live Scoreboard",
    body: "Track posts published, leads discovered, and emails sent in real time. Click any card to dive deeper into that module.",
    emoji: "📊",
    position: "bottom",
  },
  {
    target: "upcoming-schedule",
    title: "Content Pipeline",
    body: "AI-generated posts queued for publishing appear here. Review them before they go live, or let automation handle everything.",
    emoji: "📅",
    position: "top",
  },
  {
    target: "recent-captures",
    title: "Discovered Leads",
    body: "These are prospects AI found for your brand. Each lead gets a relevance score from 0 to 100 — higher means a stronger match for your business.",
    emoji: "🎯",
    position: "top",
  },
  {
    target: "quota-widget",
    title: "Usage & Limits",
    body: "See how many posts, leads, and brands you've used this month. Upgrade your plan anytime to unlock more capacity.",
    emoji: "📈",
    position: "right",
  },
  {
    target: "nav-links",
    title: "Your Command Center",
    body: "Social Posting, Lead Generation, Email Outreach, Calendar — everything lives here. Keep going, the tour steps you through each one next.",
    emoji: "🧭",
    position: "right",
  },
].map((s) => ({ ...s, route: "/dashboard" } as TourStep));
// ── Per-page tours ────────────────────────────────────────────────
const BRANDS_STEPS: TourStep[] = [
  {
    target: "page-brands-head", title: "Your Brands", emoji: "🗂️", position: "top",
    body: "Every business you run appears here. Each brand keeps its own AI voice, posts, leads, and outreach pipeline separate.",
  },
  {
    target: "page-brands-body", title: "One Workspace, Many Brands", emoji: "🏢", position: "bottom",
    body: "Add a new brand with the Add New Brand button, then switch between them. Each one is a fully independent autopilot.",
  },
].map((s) => ({ ...s, route: "/dashboard/brands" } as TourStep));

const CALENDAR_STEPS: TourStep[] = [
  {
    target: "page-calendar-head", title: "Execution Calendar & Schedule", emoji: "🗓️", position: "top",
    body: "See exactly when Markopilot plans to publish content, run discovery, and send outreach — all on one timeline.",
  },
  {
    target: "page-calendar-body", title: "Your Automation Timeline", emoji: "📅", position: "bottom",
    body: "Jump between months, filter by type, and review every scheduled run. Nothing goes out without you seeing it first.",
  },
].map((s) => ({ ...s, route: "/dashboard/calendar" } as TourStep));

const SOCIAL_STEPS: TourStep[] = [
  {
    target: "page-social-head", title: "Social Posting & Automation", emoji: "✍️", position: "top",
    body: "Connect your social accounts so Markopilot can craft and publish posts for your brand.",
  },
  {
    target: "page-social-body", title: "Post, Queue & Publish", emoji: "📢", position: "bottom",
    body: "Draft a post, review AI-generated copy, and pick an account. Automation can post on autopilot once you're comfortable.",
  },
].map((s) => ({ ...s, route: "/dashboard/social" } as TourStep));

const LEADS_STEPS: TourStep[] = [
  {
    target: "page-leads-head", title: "Lead Intelligence", emoji: "🎯", position: "top",
    body: "AI scans the web for prospects matching your ideal customer profile and scores each from 0 to 100.",
  },
  {
    target: "page-leads-body", title: "Filter, Score & Send", emoji: "🔍", position: "bottom",
    body: "Search your pipeline, dig into a lead's profile, and push high-scored matches straight into Email Outreach.",
  },
].map((s) => ({ ...s, route: "/dashboard/leads" } as TourStep));

const OUTREACH_STEPS: TourStep[] = [
  {
    target: "page-outreach-head", title: "Email Outreach", emoji: "📧", position: "top",
    body: "Follow up with discovered leads automatically. Connect Gmail, then let AI craft personalized, on-brand emails.",
  },
  {
    target: "page-outreach-body", title: "Send With Approval", emoji: "🕹️", position: "bottom",
    body: "Set daily limits, pacing, and approval gates. You stay in control of everything that actually leaves your inbox.",
  },
].map((s) => ({ ...s, route: "/dashboard/outreach" } as TourStep));

const ACTIVITY_STEPS: TourStep[] = [
  {
    target: "page-activity-head", title: "Activity Log", emoji: "📊", position: "top",
    body: "A full audit trail of every action Markopilot took on your behalf — posts, leads, emails, and automation runs.",
  },
  {
    target: "page-activity-body", title: "Your Automation Ledger", emoji: "🧾", position: "bottom",
    body: "Filter by type and expand any entry to inspect exactly what happened and when.",
  },
].map((s) => ({ ...s, route: "/dashboard/activity" } as TourStep));

const SETTINGS_STEPS: TourStep[] = [
  {
    target: "page-settings-head", title: "Brand Settings", emoji: "⚙️", position: "top",
    body: "Define your brand's voice — name, description, ideal customer, and target rules that shape what the AI creates.",
  },
  {
    target: "page-settings-body", title: "Tune Every Engine", emoji: "🎛️", position: "bottom",
    body: "Flip posting, discovery, and outreach automation on or off, set approval gates, and save your changes here.",
  },
].map((s) => ({ ...s, route: "/dashboard/settings" } as TourStep));

const ACCOUNT_STEPS: TourStep[] = [
  {
    target: "page-account-head", title: "Account & Subscription", emoji: "💳", position: "top",
    body: "Manage your plan, subscription status, and billing details all in one place.",
  },
  {
    target: "page-account-body", title: "Plan & Quota", emoji: "📈", position: "bottom",
    body: "Review your current plan's limits and upgrade any time to unlock more posts, leads, and brands.",
  },
].map((s) => ({ ...s, route: "/dashboard/account" } as TourStep));

// Registry of every available tour (used by the sidebar Tours menu)
export const PAGE_TOURS: TourMeta[] = [
  { id: "overview", label: "Overview", route: "/dashboard", icon: LayoutDashboard, steps: OVERVIEW_STEPS },
  { id: "brands", label: "Brands", route: "/dashboard/brands", icon: Briefcase, steps: BRANDS_STEPS },
  { id: "calendar", label: "Calendar & Schedule", route: "/dashboard/calendar", icon: Calendar, steps: CALENDAR_STEPS },
  { id: "social", label: "Social Posting", route: "/dashboard/social", icon: Send, steps: SOCIAL_STEPS },
  { id: "leads", label: "Lead Generation", route: "/dashboard/leads", icon: Users, steps: LEADS_STEPS },
  { id: "outreach", label: "Email Outreach", route: "/dashboard/outreach", icon: Mail, steps: OUTREACH_STEPS },
  { id: "activity", label: "Activity Log", route: "/dashboard/activity", icon: Activity, steps: ACTIVITY_STEPS },
  { id: "settings", label: "Brand Settings", route: "/dashboard/settings", icon: Settings, steps: SETTINGS_STEPS },
  { id: "account", label: "Account & Subscription", route: "/dashboard/account", icon: CreditCard, steps: ACCOUNT_STEPS },
];

// The guided first-run walk across every module, in order
const FULL_STEPS: TourStep[] = PAGE_TOURS.flatMap((t) => t.steps);

const STORAGE_KEY = "markopilot_tour_completed";

// ── Confetti Particle ────────────────────────────────────────────

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#6366f1", "#fbbf24"];
    const particles: {
      x: number; y: number; w: number; h: number;
      color: string; vx: number; vy: number;
      rotation: number; rotSpeed: number; opacity: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * -1.2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    const animate = () => {
      frame++;
      if (frame > maxFrames) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;

        if (frame > maxFrames - 60) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

// ── Main Tour Component ──────────────────────────────────────────

type TourPhase = "idle" | "welcome" | "stepping" | "complete";

export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<TourPhase>("idle");
  const [steps, setSteps] = useState<TourStep[]>(FULL_STEPS);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const navLockRef = useRef("");
  const currentStep = steps[stepIndex];

  const routeLabel = (route?: string) =>
    PAGE_TOURS.find((t) => t.route === route)?.label ?? "the next module";

  const startTour = (id: string) => {
    setSteps(id === "full" ? FULL_STEPS : (PAGE_TOURS.find((t) => t.id === id)?.steps ?? FULL_STEPS));
    setStepIndex(0);
    setLoading(true);
    setTargetRect(null);
    setTooltipReady(false);
    setPhase("stepping");
  };

  // Check if tour should auto-start on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === "undefined") return;
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setPhase("welcome");
      }
    }, 1500); // Slight delay so dashboard loads first
    return () => clearTimeout(timer);
  }, []);

  // Listen for sidebar-launched tours (re-run the full tour, or a specific page tour)
  useEffect(() => {
    const handler = (e: CustomEvent) => startTour(e.detail || "full");
    window.addEventListener("markopilot:tour", handler as EventListener);
    return () => window.removeEventListener("markopilot:tour", handler as EventListener);
  }, []);

  // Clear elevation from any previously-highlighted element
  const clearElevation = useCallback(() => {
    document.querySelectorAll("[data-tour-elevated]").forEach((el) => {
      (el as HTMLElement).style.position = "";
      (el as HTMLElement).style.zIndex = "";
      (el as HTMLElement).style.borderRadius = "";
      (el as HTMLElement).style.boxShadow = "";
      el.removeAttribute("data-tour-elevated");
    });
  }, []);

  // Navigate to the page a step lives on, when we're not there yet
  useEffect(() => {
    if (phase !== "stepping") return;
    const step = steps[stepIndex];
    if (!step?.route || step.route === pathname) return;
    const key = `${stepIndex}:${step.route}`;
    if (navLockRef.current === key) return;
    navLockRef.current = key;
    setLoading(true);
    setTooltipReady(false);
    router.push(step.route);
  }, [phase, stepIndex, steps, pathname, router]);

  // Actively find & elevate the current step's target (waits across page loads)
  useEffect(() => {
    if (phase !== "stepping") return;
    const step = steps[stepIndex];
    if (!step) return;

    const applyElevate = (el: HTMLElement) => {
      clearElevation();
      el.style.position = "relative";
      el.style.zIndex = "9985";
      el.style.borderRadius = "16px";
      el.style.boxShadow = "0 0 0 4px rgba(139, 92, 246, 0.2), 0 0 30px 4px rgba(139, 92, 246, 0.08)";
      el.setAttribute("data-tour-elevated", "true");
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setLoading(false);
      setTooltipReady(false);
      setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
        setTooltipReady(true);
      }, 250);
      return true;
    };

    const earlyEl = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (earlyEl && applyElevate(earlyEl)) return;

    setLoading(true);
    const iv = setInterval(() => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (el) {
        clearInterval(iv);
        applyElevate(el);
      }
    }, 450);
    const timeout = setTimeout(() => {
      clearInterval(iv);
      setLoading(false);
      setTargetRect(null);
      setTooltipReady(true);
    }, 7000);
    return () => {
      clearInterval(iv);
      clearTimeout(timeout);
    };
  }, [phase, stepIndex, steps, clearElevation]);

  // Reposition the tooltip when the page scrolls or the window resizes
  useEffect(() => {
    if (phase !== "stepping" || loading) return;
    const step = steps[stepIndex];
    if (!step) return;
    const recompute = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [phase, loading, stepIndex, steps]);

  const handleStart = () => startTour("full");

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  };

  const handleComplete = () => {
    clearElevation();
    setPhase("complete");
    setShowConfetti(true);
    localStorage.setItem(STORAGE_KEY, "true");
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleDismiss = () => {
    clearElevation();
    setPhase("idle");
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleDismissComplete = () => {
    setPhase("idle");
  };

  // ── Keyboard navigation ──
  useEffect(() => {
    if (phase !== "stepping") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, stepIndex, steps]);

  // ── Compute tooltip position ──
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const step = steps[stepIndex];
    const pad = 16;
    const tooltipW = 360;
    const tooltipH = 200;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case "bottom":
        top = targetRect.bottom + pad;
        left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
        break;
      case "top":
        top = targetRect.top - tooltipH - pad;
        left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
        left = targetRect.right + pad;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
        left = targetRect.left - tooltipW - pad;
        break;
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

    return { top, left, width: tooltipW };
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────

  if (phase === "idle") return null;

  // ── WELCOME MODAL ──
  if (phase === "welcome") {
    return (
      <div className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-[#13131a] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-400 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--accent-primary)] opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500 opacity-10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo / Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-[var(--accent-primary)]/20">
              <Rocket size={32} className="text-white" />
            </div>

            <h2 className="text-2xl font-serif text-white mb-2">
              Welcome to your cockpit! ✨
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              {"Let's take a quick "}
              <span className="text-white font-medium">guided tour</span>
              {" of every module — we'll walk you through each tab so you can see exactly where everything lives."}
            </p>

            {/* What you'll learn */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-2">
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2">{"What you'll discover:"}</p>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">⚡</span> How your autopilot engine works
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">🎯</span> Where AI-discovered leads appear
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">📅</span> Your content pipeline at a glance
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">📧</span> Email outreach & review flow
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">🏢</span> Brands, activity log & settings
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-[var(--accent-primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles size={18} />
                Start the Tour
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 text-sm text-[var(--text-muted)] hover:text-white transition rounded-xl hover:bg-white/5"
              >
                Skip
              </button>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] text-center mt-4 font-mono">
              Only {FULL_STEPS.length} quick stops • Replay any section anytime from the sidebar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPLETION MODAL ──
  if (phase === "complete") {
    return (
      <>
        {showConfetti && <ConfettiCanvas />}
        <div className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#13131a] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-400 relative overflow-hidden text-center">
            {/* Decorative glow */}
            <div className="absolute -top-20 right-10 w-60 h-60 bg-emerald-500 opacity-10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 left-10 w-48 h-48 bg-[var(--accent-primary)] opacity-10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 animate-bounce">
                <PartyPopper size={36} className="text-white" />
              </div>

              <h2 className="text-2xl font-serif text-white mb-2">
                {"You're all set! 🚀"}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                {"You've now seen every tab — posting, leads, outreach, calendar, and the rest. Jump into any module from the sidebar, or replay a tour for a section any time."}
              </p>

              <button
                onClick={handleDismissComplete}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {"Let's Go!"}
              </button>

              <p className="text-[10px] text-[var(--text-muted)] mt-4 font-mono flex items-center justify-center gap-1">
                <RotateCcw size={10} /> Replay anytime from the sidebar
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── STEPPING PHASE ──
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay — target element is elevated above this via z-index:9985 */}
      <div className="fixed inset-0 z-[9980] bg-black/60" onClick={handleDismiss} />

      {/* Heading-to-next-page indicator */}
      {loading && !tooltipReady && (
        <div className="fixed z-[9990] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-[#18181f] border border-white/15 rounded-2xl px-6 py-4 shadow-2xl ring-1 ring-white/5">
          <Loader2 size={24} className="text-[var(--accent-primary)] animate-spin" />
          <p className="text-sm text-gray-300">Heading to {routeLabel(currentStep?.route)}…</p>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Loading that module</p>
        </div>
      )}

      {/* Tooltip Card */}
      {tooltipReady && (
        <div
          ref={tooltipRef}
          className="fixed z-[9990] animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={getTooltipStyle()}
        >
          <div className="bg-[#18181f] border border-white/15 rounded-2xl p-5 shadow-2xl ring-1 ring-white/5 relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X size={14} />
            </button>

            {/* Step Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{currentStep.emoji}</span>
              <h3 className="text-base font-semibold text-white">{currentStep.title}</h3>
            </div>

            {/* Step Body */}
            <p className="text-sm text-gray-300 leading-relaxed mb-4 pr-4">
              {currentStep.body}
            </p>

            {/* Footer: Progress + Navigation */}
            <div className="flex items-center justify-between">
              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === stepIndex
                        ? "w-6 bg-[var(--accent-primary)]"
                        : i < stepIndex
                        ? "w-1.5 bg-[var(--accent-primary)]/50"
                        : "w-1.5 bg-white/15"
                    }`}
                  />
                ))}
              </div>

              {/* Nav Buttons */}
              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white text-sm font-medium rounded-lg transition shadow-md shadow-[var(--accent-primary)]/20"
                >
                  {stepIndex === steps.length - 1 ? "Finish" : "Next"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Launch trigger (sidebar Tours menu + welcome screen) ──────

export function launchTour(id: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new CustomEvent("markopilot:tour", { detail: id }));
  }
}

// Backwards-compatible alias for the old single replay button
export function replayTour() {
  launchTour("full");
}
