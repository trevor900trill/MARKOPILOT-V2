"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X, ChevronRight, ChevronLeft, Sparkles, Rocket, PartyPopper, RotateCcw, Loader2,
  LayoutDashboard, Briefcase, Calendar, Send, Users, Mail, Activity, Settings, CreditCard, Radar,
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
  route?: string;        // dashboard route for cross-page tours
};

type TourMeta = {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  steps: TourStep[];
};

// ── 1. Overview (Dashboard Shell) ───────────────────────────────────
const OVERVIEW_STEPS: TourStep[] = [
  {
    target: "brand-switcher",
    title: "Your Brand Switcher",
    body: "Switch between your businesses with one click. Each brand keeps its own AI writing voice, social accounts, and lead list completely separate.",
    emoji: "🏢",
    position: "right",
  },
  {
    target: "engine-status",
    title: "The Autopilot Switch",
    body: "When this is green, Markopilot runs in the background—writing posts, finding leads, and sending emails. Turn it off anytime with one tap to pause everything.",
    emoji: "⚡",
    position: "bottom",
  },
  {
    target: "stats-cards",
    title: "Your Growth Scoreboard",
    body: "Track published posts, discovered leads, and sent emails in real time. Click any card to dive right into that tool.",
    emoji: "📊",
    position: "bottom",
  },
  {
    target: "upcoming-schedule",
    title: "Upcoming Content",
    body: "See posts waiting in line to go live. You can review them in your morning approval queue, or let autopilot publish them automatically.",
    emoji: "📅",
    position: "top",
  },
  {
    target: "recent-captures",
    title: "Latest Customer Leads",
    body: "New prospects discovered for your business. Each lead gets a fit score from 0 to 100 so you know who is the best match.",
    emoji: "🎯",
    position: "top",
  },
  {
    target: "quota-widget",
    title: "Monthly Usage & Plan",
    body: "Check your remaining posts, leads, and brand capacity for the month. Upgrade anytime if your business is expanding.",
    emoji: "📈",
    position: "right",
  },
  {
    target: "nav-links",
    title: "Main Navigation",
    body: "Jump into any tool from here: Social Media, Brand Impact news, Lead Discovery, Email Outreach, and Settings.",
    emoji: "🧭",
    position: "right",
  },
].map((s) => ({ ...s, route: "/dashboard" } as TourStep));

// ── 2. Brands ───────────────────────────────────────────────────────
const BRANDS_STEPS: TourStep[] = [
  {
    target: "page-brands-head",
    title: "All Your Businesses in One Place",
    emoji: "🏢",
    position: "top",
    body: "Every brand you manage appears here. Whether you have 1 startup or 5 different client products, each one has its own dedicated growth engine.",
  },
  {
    target: "page-brands-body",
    title: "Add & Connect Accounts",
    emoji: "✨",
    position: "bottom",
    body: "Click 'Add Brand' to launch a new product, or switch your active workspace. You can link separate X, LinkedIn, and TikTok profiles to each business.",
  },
].map((s) => ({ ...s, route: "/dashboard/brands" } as TourStep));

// ── 3. Calendar & Schedule ──────────────────────────────────────────
const CALENDAR_STEPS: TourStep[] = [
  {
    target: "page-calendar-head",
    title: "Visual Marketing Calendar",
    emoji: "🗓️",
    position: "top",
    body: "See every scheduled social post, lead discovery sweep, and email outreach event laid out on an interactive monthly calendar.",
  },
  {
    target: "page-calendar-body",
    title: "Daily Timeline & Execution",
    emoji: "📅",
    position: "bottom",
    body: "Click any day to see exactly what ran or what is queued to go live next. Nothing is published without you knowing about it.",
  },
].map((s) => ({ ...s, route: "/dashboard/calendar" } as TourStep));

// ── 4. Social Posting ───────────────────────────────────────────────
const SOCIAL_STEPS: TourStep[] = [
  {
    target: "page-social-head",
    title: "Social Media Posting",
    emoji: "✍️",
    position: "top",
    body: "Manage your social channels (X, LinkedIn, Instagram, and TikTok) and let AI generate on-brand copy, 4K images, and vertical video clips.",
  },
  {
    target: "page-social-body",
    title: "Drafting & Queue Approval",
    emoji: "📢",
    position: "bottom",
    body: "Create new posts manually or let AI generate fresh themes from your content pillars. Approve queued posts with one tap before they publish.",
  },
].map((s) => ({ ...s, route: "/dashboard/social" } as TourStep));

// ── 5. Brand Impact Intelligence ────────────────────────────────────
const IMPACT_STEPS: TourStep[] = [
  {
    target: "page-impact-head",
    title: "Brand Impact Intelligence",
    emoji: "📡",
    position: "top",
    body: "Autonomous market scanner that checks news, platform rule updates (like Meta, OpenAI, or Google), and government policies affecting your business.",
  },
  {
    target: "impact-kpis",
    title: "Severity & Critical Alerts",
    emoji: "🚨",
    position: "bottom",
    body: "Critical alerts (like broken API tokens or major compliance changes) send an instant email to your inbox so you are never caught off guard.",
  },
  {
    target: "impact-scan-btn",
    title: "On-Demand Market Scan",
    emoji: "🔄",
    position: "bottom",
    body: "Click 'Scan Now' anytime to immediately sweep verified tech blogs and regulatory feeds for fresh updates matching your brand.",
  },
  {
    target: "impact-stream",
    title: "Action Briefs & 1-Click Posts",
    emoji: "⚡",
    position: "top",
    body: "Read 'Why It Matters' to your business, follow the recommended action, or click '1-Click Draft Reactive Post' to turn news into thought-leadership content.",
  },
].map((s) => ({ ...s, route: "/dashboard/impact" } as TourStep));

// ── 6. Lead Generation ──────────────────────────────────────────────
const LEADS_STEPS: TourStep[] = [
  {
    target: "page-leads-head",
    title: "Finding New Customers",
    emoji: "🎯",
    position: "top",
    body: "AI searches public business websites and profiles to find decision-makers who actually need your product—no stale email lists.",
  },
  {
    target: "page-leads-body",
    title: "Verified Leads & Fit Scores",
    emoji: "🔍",
    position: "bottom",
    body: "See verified emails, company details, and a fit score from 0 to 100. Push top-scoring prospects straight into Email Outreach with one click.",
  },
].map((s) => ({ ...s, route: "/dashboard/leads" } as TourStep));

// ── 7. Email Outreach ───────────────────────────────────────────────
const OUTREACH_STEPS: TourStep[] = [
  {
    target: "page-outreach-head",
    title: "Cold Email Outreach",
    emoji: "📧",
    position: "top",
    body: "Reach out to verified leads with personalized emails sent directly through your Gmail account, with built-in anti-spam safety limits.",
  },
  {
    target: "page-outreach-body",
    title: "Review Queue & Daily Limits",
    emoji: "🛡️",
    position: "bottom",
    body: "Read over drafts in Review Mode before they send, or switch on Autopilot. Emails are spaced out naturally to protect your sender reputation.",
  },
].map((s) => ({ ...s, route: "/dashboard/outreach" } as TourStep));

// ── 8. Activity Log ─────────────────────────────────────────────────
const ACTIVITY_STEPS: TourStep[] = [
  {
    target: "page-activity-head",
    title: "Complete Activity History",
    emoji: "📊",
    position: "top",
    body: "A live audit trail of everything Markopilot does for you—posts published, leads extracted, emails delivered, and market alerts evaluated.",
  },
  {
    target: "page-activity-body",
    title: "Filter & Inspect Actions",
    emoji: "🧾",
    position: "bottom",
    body: "Filter by type or date to verify timestamps, check delivery results, and inspect any warnings or alerts.",
  },
].map((s) => ({ ...s, route: "/dashboard/activity" } as TourStep));

// ── 9. Brand Settings ───────────────────────────────────────────────
const SETTINGS_STEPS: TourStep[] = [
  {
    target: "page-settings-head",
    title: "Brand Voice & Rules",
    emoji: "⚙️",
    position: "top",
    body: "Define how the AI writes for you so every single post and email sounds authentic and fits your exact tone.",
  },
  {
    target: "page-settings-body",
    title: "Sliders & Safety Limits",
    emoji: "🎛️",
    position: "bottom",
    body: "Adjust voice sliders (formal vs playful, gentle vs assertive), pick your core content pillars, and set daily outreach limits.",
  },
].map((s) => ({ ...s, route: "/dashboard/settings" } as TourStep));

// ── 10. Account & Billing ───────────────────────────────────────────
const ACCOUNT_STEPS: TourStep[] = [
  {
    target: "page-account-head",
    title: "Account & Subscription",
    emoji: "💳",
    position: "top",
    body: "Manage your subscription, check plan limits, and download payment receipts all in one convenient place.",
  },
  {
    target: "page-account-body",
    title: "Plan Quotas & M-PESA Payments",
    emoji: "📈",
    position: "bottom",
    body: "Check your remaining monthly limits for posts and leads. Upgrade anytime using instant M-PESA STK push.",
  },
].map((s) => ({ ...s, route: "/dashboard/account" } as TourStep));

// ── Tour Registry ───────────────────────────────────────────────────
export const PAGE_TOURS: TourMeta[] = [
  { id: "overview", label: "Overview", route: "/dashboard", icon: LayoutDashboard, steps: OVERVIEW_STEPS },
  { id: "brands", label: "Brands", route: "/dashboard/brands", icon: Briefcase, steps: BRANDS_STEPS },
  { id: "calendar", label: "Calendar & Schedule", route: "/dashboard/calendar", icon: Calendar, steps: CALENDAR_STEPS },
  { id: "social", label: "Social Posting", route: "/dashboard/social", icon: Send, steps: SOCIAL_STEPS },
  { id: "impact", label: "Brand Impact", route: "/dashboard/impact", icon: Radar, steps: IMPACT_STEPS },
  { id: "leads", label: "Lead Generation", route: "/dashboard/leads", icon: Users, steps: LEADS_STEPS },
  { id: "outreach", label: "Email Outreach", route: "/dashboard/outreach", icon: Mail, steps: OUTREACH_STEPS },
  { id: "activity", label: "Activity Log", route: "/dashboard/activity", icon: Activity, steps: ACTIVITY_STEPS },
  { id: "settings", label: "Brand Settings", route: "/dashboard/settings", icon: Settings, steps: SETTINGS_STEPS },
  { id: "account", label: "Account & Billing", route: "/dashboard/account", icon: CreditCard, steps: ACCOUNT_STEPS },
];

// The full guided walk across every module in order
const FULL_STEPS: TourStep[] = PAGE_TOURS.flatMap((t) => t.steps);

const STORAGE_KEY = "markopilot_tour_completed";

// ── Confetti Particle Canvas ────────────────────────────────────────

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

  // Auto-start on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === "undefined") return;
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setPhase("welcome");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for sidebar-launched tours
  useEffect(() => {
    const handler = (e: CustomEvent) => startTour(e.detail || "full");
    window.addEventListener("markopilot:tour", handler as EventListener);
    return () => window.removeEventListener("markopilot:tour", handler as EventListener);
  }, []);

  // Clear elevation
  const clearElevation = useCallback(() => {
    document.querySelectorAll("[data-tour-elevated]").forEach((el) => {
      (el as HTMLElement).style.position = "";
      (el as HTMLElement).style.zIndex = "";
      (el as HTMLElement).style.borderRadius = "";
      (el as HTMLElement).style.boxShadow = "";
      el.removeAttribute("data-tour-elevated");
    });
  }, []);

  // Navigate across pages when needed
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

  // Find & highlight current step target
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

  // Recompute position on resize/scroll
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

  // Keyboard controls
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

    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

    return { top, left, width: tooltipW };
  };

  if (phase === "idle") return null;

  // ── WELCOME MODAL ──
  if (phase === "welcome") {
    return (
      <div className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-[#13131a] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-400 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--accent-primary)] opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500 opacity-10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-[var(--accent-primary)]/20">
              <Rocket size={32} className="text-white" />
            </div>

            <h2 className="text-2xl font-serif text-white mb-2">
              Welcome to your cockpit! ✨
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              {"Let's take a quick "}
              <span className="text-white font-medium">guided tour</span>
              {" of every tool so you can see exactly how Markopilot automates your marketing."}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-2">
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2">{"What you'll see:"}</p>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">⚡</span> The Autopilot Switch &amp; Scoreboard
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">✍️</span> Automated Social Posts &amp; Videos
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">📡</span> Brand Impact market &amp; policy alerts
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">🎯</span> Lead Discovery &amp; Fit Scoring
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-base">📧</span> Safe Email Outreach &amp; Review Queue
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-[var(--accent-primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles size={18} />
                Start Tour
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 text-sm text-[var(--text-muted)] hover:text-white transition rounded-xl hover:bg-white/5"
              >
                Skip
              </button>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] text-center mt-4 font-mono">
              Replay any individual page tour anytime from the sidebar
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
            <div className="absolute -top-20 right-10 w-60 h-60 bg-emerald-500 opacity-10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 left-10 w-48 h-48 bg-[var(--accent-primary)] opacity-10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 animate-bounce">
                <PartyPopper size={36} className="text-white" />
              </div>

              <h2 className="text-2xl font-serif text-white mb-2">
                {"You're ready to grow! 🚀"}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                {"You've seen all the tools. Jump into any module from the sidebar, or replay a specific section tour anytime you need a quick refresher."}
              </p>

              <button
                onClick={handleDismissComplete}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {"Let's Get Started!"}
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
      <div className="fixed inset-0 z-[9980] bg-black/60" onClick={handleDismiss} />

      {loading && !tooltipReady && (
        <div className="fixed z-[9990] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-[#18181f] border border-white/15 rounded-2xl px-6 py-4 shadow-2xl ring-1 ring-white/5">
          <Loader2 size={24} className="text-[var(--accent-primary)] animate-spin" />
          <p className="text-sm text-gray-300">Opening {routeLabel(currentStep?.route)}…</p>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Loading module</p>
        </div>
      )}

      {tooltipReady && (
        <div
          ref={tooltipRef}
          className="fixed z-[9990] animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={getTooltipStyle()}
        >
          <div className="bg-[#18181f] border border-white/15 rounded-2xl p-5 shadow-2xl ring-1 ring-white/5 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{currentStep.emoji}</span>
              <h3 className="text-base font-semibold text-white">{currentStep.title}</h3>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-4 pr-4">
              {currentStep.body}
            </p>

            <div className="flex items-center justify-between">
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

export function launchTour(id: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new CustomEvent("markopilot:tour", { detail: id }));
  }
}

export function replayTour() {
  launchTour("full");
}
