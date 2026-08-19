"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Rocket, PartyPopper, RotateCcw } from "lucide-react";

// ── Tour Step Definitions ─────────────────────────────────────────

type TourStep = {
  target: string;        // data-tour attribute value
  title: string;
  body: string;
  emoji: string;
  position: "bottom" | "top" | "left" | "right";
};

const TOUR_STEPS: TourStep[] = [
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
    body: "Social Posting, Lead Generation, Email Outreach, Calendar — everything lives here. Explore each module to set up your automation workflow.",
    emoji: "🧭",
    position: "right",
  },
];

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
  const [phase, setPhase] = useState<TourPhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tooltipReady, setTooltipReady] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour should auto-start
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

  // Listen for manual replay trigger
  useEffect(() => {
    const handler = () => {
      setStepIndex(0);
      setPhase("welcome");
    };
    window.addEventListener("markopilot:replay-tour", handler);
    return () => window.removeEventListener("markopilot:replay-tour", handler);
  }, []);

  // Locate target element for current step
  const locateTarget = useCallback(() => {
    if (phase !== "stepping") return;
    const step = TOUR_STEPS[stepIndex];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Scroll into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      // Small delay for tooltip positioning after scroll
      setTooltipReady(false);
      setTimeout(() => setTooltipReady(true), 150);
    } else {
      setTargetRect(null);
      setTooltipReady(true);
    }
  }, [phase, stepIndex]);

  useEffect(() => {
    locateTarget();
    // Recalculate on resize/scroll
    window.addEventListener("resize", locateTarget);
    window.addEventListener("scroll", locateTarget, true);
    return () => {
      window.removeEventListener("resize", locateTarget);
      window.removeEventListener("scroll", locateTarget, true);
    };
  }, [locateTarget]);

  const handleStart = () => {
    setStepIndex(0);
    setPhase("stepping");
  };

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
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
    setPhase("complete");
    setShowConfetti(true);
    localStorage.setItem(STORAGE_KEY, "true");
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleDismiss = () => {
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
  }, [phase, stepIndex]);

  // ── Compute tooltip position ──
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const step = TOUR_STEPS[stepIndex];
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
              {"Let's take a "}
              <span className="text-white font-medium">90-second tour</span>
              {" of your dashboard. We'll show you where everything lives so you can hit the ground running."}
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
              Only {TOUR_STEPS.length} quick stops • You can replay anytime from the sidebar
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
                {"You now know the lay of the land. Start by setting up your brand's social accounts, or let the AI engine discover leads while you grab coffee."}
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
  const currentStep = TOUR_STEPS[stepIndex];
  const progress = ((stepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9980] pointer-events-none">
        {/* Semi-transparent backdrop */}
        <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={handleDismiss} />

        {/* Spotlight cutout */}
        {targetRect && (
          <div
            className="absolute rounded-2xl pointer-events-none transition-all duration-300 ease-out"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px 4px rgba(139, 92, 246, 0.15)",
              background: "transparent",
              zIndex: 9981,
              border: "2px solid rgba(139, 92, 246, 0.3)",
            }}
          />
        )}
      </div>

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
                {TOUR_STEPS.map((_, i) => (
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
                  {stepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
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

// ── Replay trigger (for sidebar button) ──────────────────────────

export function replayTour() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("markopilot:replay-tour"));
  }
}
