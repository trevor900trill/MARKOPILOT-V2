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
    body: "Switch between your businesses with one click. Each brand keeps its own AI writing voice, social accounts, and lead lists completely separate.",
    emoji: "🏢",
    position: "right",
  },
  {
    target: "engine-status",
    title: "The Autopilot Master Switch",
    body: "When this is green, Markopilot runs autonomously in the background—writing posts, finding leads, and sending emails. Turn it off anytime with one tap to pause all activity.",
    emoji: "⚡",
    position: "bottom",
  },
  {
    target: "stats-cards",
    title: "Your Growth Scoreboard",
    body: "Track published posts, discovered customer leads, and sent emails in real time. Click any card to dive directly into that tool.",
    emoji: "📊",
    position: "bottom",
  },
  {
    target: "upcoming-schedule",
    title: "Upcoming Content",
    body: "See posts waiting in line to go live. You can review and edit them in your morning approval queue, or let autopilot publish them automatically.",
    emoji: "📅",
    position: "top",
  },
  {
    target: "recent-captures",
    title: "Latest Customer Leads",
    body: "Fresh prospects discovered for your business. Each lead gets a fit score from 0 to 100 so you immediately know who is the best match.",
    emoji: "🎯",
    position: "top",
  },
  {
    target: "quota-widget",
    title: "Monthly Usage & Plan",
    body: "Check your remaining posts, leads, and brand capacity for the current billing cycle. Upgrade anytime if your business is expanding.",
    emoji: "📈",
    position: "right",
  },
  {
    target: "nav-links",
    title: "Main Navigation",
    body: "Jump into any tool from here: Social Media, Brand Impact news, Lead Discovery, Email Outreach, and Brand Settings.",
    emoji: "🧭",
    position: "right",
  },
].map((s) => ({ ...s, route: "/dashboard" } as TourStep));

// ── 2. Brands ───────────────────────────────────────────────────────
const BRANDS_STEPS: TourStep[] = [
  {
    target: "page-brands-head",
    title: "Your Business Hub",
    emoji: "🏢",
    position: "top",
    body: "Every business or client project you manage lives here. Whether you have 1 startup or 5 different brands, each one operates with its own dedicated growth engine.",
  },
  {
    target: "brands-add-btn",
    title: "Add & Launch New Brands",
    emoji: "✨",
    position: "bottom",
    body: "Click 'Add New Brand' anytime you launch a new product or take on a client. The AI will walk you through a 2-minute setup to learn their industry and audience.",
  },
  {
    target: "brands-card-grid",
    title: "Live Engine Status & Switcher",
    emoji: "⚡",
    position: "top",
    body: "Check at a glance whether Lead Tracking and Content Posting are actively running. Click any card to switch into that brand's workspace immediately.",
  },
  {
    target: "page-brands-body",
    title: "Connected Social Channels",
    emoji: "🔗",
    position: "top",
    body: "See which social platforms (X, LinkedIn, Instagram, TikTok) and Gmail inboxes are connected to each business for seamless automated publishing.",
  },
].map((s) => ({ ...s, route: "/dashboard/brands" } as TourStep));

// ── 3. Calendar & Schedule ──────────────────────────────────────────
const CALENDAR_STEPS: TourStep[] = [
  {
    target: "page-calendar-head",
    title: "Your Marketing Schedule",
    emoji: "🗓️",
    position: "top",
    body: "A comprehensive calendar laying out every automated task—social media posts, lead discovery sweeps, and outreach email batches.",
  },
  {
    target: "calendar-telemetry",
    title: "Live Countdown Engines",
    emoji: "⏱️",
    position: "bottom",
    body: "Real-time countdown clocks showing exactly when the next Lead Discovery search, Social Post release, and Email Outreach batch will execute.",
  },
  {
    target: "calendar-controls",
    title: "Timeline & Channel Filters",
    emoji: "🎛️",
    position: "bottom",
    body: "Filter by channel (Social Posts, Leads, or Outreach) and easily toggle between a full Monthly Calendar grid and a chronological Upcoming List.",
  },
  {
    target: "calendar-grid",
    title: "Inspect & Manage Scheduled Content",
    emoji: "📅",
    position: "top",
    body: "Click on any day to see planned topics, review drafted captions, or verify what was already published. You always maintain 100% visibility.",
  },
].map((s) => ({ ...s, route: "/dashboard/calendar" } as TourStep));

// ── 4. Social Posting ───────────────────────────────────────────────
const SOCIAL_STEPS: TourStep[] = [
  {
    target: "page-social-head",
    title: "Automated Social Studio",
    emoji: "✍️",
    position: "top",
    body: "Let AI generate on-brand copy, 4K graphics, and vertical video ideas tailored for X (Twitter), LinkedIn, Instagram, and TikTok.",
  },
  {
    target: "social-workflow",
    title: "Review Queue vs. Autonomous Mode",
    emoji: "🛡️",
    position: "bottom",
    body: "Choose your comfort level: 'Manual Review Queue' holds posts in draft for your morning approval, while 'Autonomous Posting' publishes directly on schedule.",
  },
  {
    target: "social-create-btn",
    title: "Create Manual or Instant Posts",
    emoji: "🚀",
    position: "bottom",
    body: "Have a spontaneous company update? Click 'Create Manual Post' to draft custom content or have AI rewrite one idea across all 4 platforms instantly.",
  },
  {
    target: "social-tabs",
    title: "Connected Accounts & Pending Queue",
    emoji: "📑",
    position: "bottom",
    body: "Switch between connecting your social profiles, reviewing pending drafts waiting for your thumbs up, and viewing your complete publishing history.",
  },
].map((s) => ({ ...s, route: "/dashboard/social" } as TourStep));

// ── 5. Brand Impact Intelligence ────────────────────────────────────
const IMPACT_STEPS: TourStep[] = [
  {
    target: "page-impact-head",
    title: "Your 24/7 Market Radar",
    emoji: "📡",
    position: "top",
    body: "Autonomous market scanner that continuously tracks news, policy updates, and platform changes (like Meta, OpenAI, or Google) affecting your business.",
  },
  {
    target: "impact-kpis",
    title: "Severity & Urgent Alerts",
    emoji: "🚨",
    position: "bottom",
    body: "Critical alerts (like broken API connections or major compliance rules) automatically trigger an urgent email to your inbox so you're never caught off guard.",
  },
  {
    target: "impact-scan-btn",
    title: "On-Demand Market Check",
    emoji: "🔄",
    position: "bottom",
    body: "Click 'Scan Now' anytime to immediately sweep verified publications, tech blogs, and regulatory feeds for breaking updates matching your brand.",
  },
  {
    target: "impact-stream",
    title: "Action Briefs & 1-Click Posts",
    emoji: "⚡",
    position: "top",
    body: "Read 'Why It Matters' in plain English, follow the recommended action, or click '1-Click Draft Reactive Post' to turn industry news into viral thought leadership.",
  },
].map((s) => ({ ...s, route: "/dashboard/impact" } as TourStep));

// ── 6. Lead Generation ──────────────────────────────────────────────
const LEADS_STEPS: TourStep[] = [
  {
    target: "page-leads-head",
    title: "24/7 Customer Prospecting",
    emoji: "🎯",
    position: "top",
    body: "AI automatically searches public websites, directories, and professional profiles to find decision-makers who genuinely need your product.",
  },
  {
    target: "leads-run-btn",
    title: "Run Discovery On Demand",
    emoji: "🚀",
    position: "bottom",
    body: "While the engine runs on automated cron schedules, you can tap 'Run Discovery Now' anytime to launch an immediate live search sweep for fresh prospects.",
  },
  {
    target: "leads-analytics",
    title: "Prospect Pipeline & Quota",
    emoji: "📊",
    position: "bottom",
    body: "Track total mined leads, how many have verified work emails, high-fit prospects (scored 80%+), and your remaining monthly quota capacity.",
  },
  {
    target: "leads-insights",
    title: "Search Intelligence & Queries",
    emoji: "💡",
    position: "bottom",
    body: "See the exact search angles, keywords, and industry queries the AI is using to mine prospects, along with their live conversion and email find rates.",
  },
  {
    target: "leads-filters",
    title: "Smart Filters & Search",
    emoji: "🔍",
    position: "bottom",
    body: "Quickly filter your pipeline by 'Enriched with Email' (ready to contact), 'High Quality ≥80' (best matches), or search by job title, company, and name.",
  },
  {
    target: "leads-table",
    title: "Fit Scores & 1-Click Outreach",
    emoji: "✉️",
    position: "top",
    body: "Review match scores, verified email confidence, and company summaries. Click 'Queue Outreach' on any lead to push them straight into personalized emailing.",
  },
].map((s) => ({ ...s, route: "/dashboard/leads" } as TourStep));

// ── 7. Email Outreach ───────────────────────────────────────────────
const OUTREACH_STEPS: TourStep[] = [
  {
    target: "page-outreach-head",
    title: "Personalized Cold Emailing",
    emoji: "📧",
    position: "top",
    body: "Send tailored 1-on-1 emails to verified leads directly through your own Gmail/Google Workspace account for maximum inbox deliverability.",
  },
  {
    target: "outreach-toggle",
    title: "Outreach Safety Switch",
    emoji: "⏸️",
    position: "bottom",
    body: "Pause or resume automated email sending with one click. When active, emails are sent with natural delays to protect your sender reputation.",
  },
  {
    target: "outreach-connection",
    title: "Secure Gmail Integration",
    emoji: "🔒",
    position: "bottom",
    body: "Connect your Gmail or Google Workspace using official Google OAuth. Emails are sent from your real address so they land in primary inboxes—never spam.",
  },
  {
    target: "outreach-status",
    title: "Queue Status & Daily Safety Limits",
    emoji: "📈",
    position: "bottom",
    body: "Track queued drafts, sent emails, and daily sending caps (e.g. 20/day) designed to keep your email domain safe and prevent spam flags.",
  },
  {
    target: "outreach-tabs",
    title: "Review Queue & Dispatch Logs",
    emoji: "📝",
    position: "bottom",
    body: "Preview personalized email drafts in the Review Queue before they send, or inspect the Dispatch Logs to see open rates and delivery confirmations.",
  },
].map((s) => ({ ...s, route: "/dashboard/outreach" } as TourStep));

// ── 8. Activity Log ─────────────────────────────────────────────────
const ACTIVITY_STEPS: TourStep[] = [
  {
    target: "page-activity-head",
    title: "Live Audit Trail",
    emoji: "📜",
    position: "top",
    body: "A complete, real-time log of every single action Markopilot takes for your business—posts published, leads mined, emails sent, and market news scanned.",
  },
  {
    target: "activity-filters",
    title: "Filter by Activity & Errors",
    emoji: "🔍",
    position: "bottom",
    body: "Switch between 'All Activity' to see the full timeline, or click 'Errors' to immediately troubleshoot any failed social connections or email delivery issues.",
  },
  {
    target: "activity-feed",
    title: "Detailed Event Timeline",
    emoji: "⏱️",
    position: "top",
    body: "Each entry shows exact timestamps, status badges, and plain-English summaries so you always know what your autonomous assistant did and when.",
  },
  {
    target: "page-activity-body",
    title: "Inspect Full Event Details",
    emoji: "🔎",
    position: "top",
    body: "Click 'Show more' on any event to see detailed reasonings, lead match criteria, or generated social copy associated with that action.",
  },
].map((s) => ({ ...s, route: "/dashboard/activity" } as TourStep));

// ── 9. Brand Settings ───────────────────────────────────────────────
const SETTINGS_STEPS: TourStep[] = [
  {
    target: "page-settings-head",
    title: "Brand Voice & AI Personality",
    emoji: "⚙️",
    position: "top",
    body: "Train the AI on how to speak for your business so every social post and cold email sounds authentic and fits your exact company culture.",
  },
  {
    target: "settings-approval",
    title: "Approval Workflow Switches",
    emoji: "🛡️",
    position: "bottom",
    body: "Toggle whether Social Posts and Outreach Emails require your manual review first, or whether the AI can publish and send automatically on schedule.",
  },
  {
    target: "settings-general",
    title: "Brand Bio & Content Pillars",
    emoji: "🎯",
    position: "top",
    body: "Define your company description, industry niche, and core topics (content pillars). The AI uses these to brainstorm fresh post themes and search angles.",
  },
  {
    target: "settings-audience",
    title: "Target Audience & Customer Pain Points",
    emoji: "👥",
    position: "top",
    body: "Specify target job titles (e.g. CEO, Marketing Director) and customer pain points. This guides the Lead Discovery engine to find the highest-converting buyers.",
  },
  {
    target: "settings-voice",
    title: "Tone & Formality Sliders",
    emoji: "🎛️",
    position: "top",
    body: "Adjust voice attributes (Formality, Humor, Assertiveness, and Empathy) to match your brand style—from casual and playful to executive and professional.",
  },
].map((s) => ({ ...s, route: "/dashboard/settings" } as TourStep));

// ── 10. Account & Billing ───────────────────────────────────────────
const ACCOUNT_STEPS: TourStep[] = [
  {
    target: "page-account-head",
    title: "Account & Subscription Hub",
    emoji: "💳",
    position: "top",
    body: "Manage your user profile, active subscription plan, monthly quota allowances, and Safaricom M-PESA payment receipts.",
  },
  {
    target: "account-profile",
    title: "Profile & Trial Status",
    emoji: "👤",
    position: "bottom",
    body: "See your verified Google account details and check whether you are on the 7-day free trial or an active paid subscription.",
  },
  {
    target: "account-plan",
    title: "Current Plan & Allowances",
    emoji: "📦",
    position: "bottom",
    body: "Review your active plan tier (Starter, Growth, or Scale), monthly pricing, and the number of monthly posts, leads, and brand workspaces included.",
  },
  {
    target: "account-quota",
    title: "Live Monthly Usage Bars",
    emoji: "📊",
    position: "bottom",
    body: "Visual progress bars showing exactly how many leads you've mined and posts you've published in your current monthly cycle.",
  },
  {
    target: "account-mpesa",
    title: "Instant M-PESA Upgrades",
    emoji: "📱",
    position: "top",
    body: "Upgrade or renew your plan anytime with instant Safaricom M-PESA STK push directly to your mobile phone—no credit cards required.",
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
