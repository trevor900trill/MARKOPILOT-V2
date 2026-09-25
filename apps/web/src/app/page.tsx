"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Bot,
  Globe,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Radar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Brain,
  Target,
  Activity,
  Shield,
  LineChart,
  Terminal,
  Cpu,
  Mail,
  Send,
  Lock,
  Compass,
  Layers,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [activePlaybook, setActivePlaybook] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [autonomyLevel, setAutonomyLevel] = useState<number>(2);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const GoogleLogo = () => (
    <svg className="w-4 h-4 bg-white rounded-full p-[2px] shadow-sm flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const playbooks = [
    {
      id: "competitor-diff",
      title: "Competitor Diff Arbitrage",
      badge: "Real-time Intercept",
      description: "When competitors change pricing, discontinue features, or face outages, the agent detects the shift within minutes, formulates counter-arguments, and reaches out to dissatisfied users.",
      metric: "< 8 min latency",
      tag: "Competitive Defense",
      example: {
        trigger: "Competitor raised prices +35% & removed free tier",
        action: "Published technical migration guide and engaged 42 frustrated users on Reddit & X with 1-click import offer",
        outcome: "19 qualified demo requests booked"
      }
    },
    {
      id: "prospect-extraction",
      title: "High-Intent B2B Prospecting",
      badge: "Targeted Outreach",
      description: "Continuously identifies companies and decision-makers actively searching for your solution. Enriches verified work emails, synthesizes personalized context, and initiates calibrated dialogue.",
      metric: "99.2% Deliverability",
      tag: "Outbound Pipeline",
      example: {
        trigger: "Identified 65 FinTech founders actively hiring marketing roles in Kenya & Nigeria",
        action: "Drafted hyper-personalized value proposition referencing their recent product announcements",
        outcome: "34% open rate, 11 introductory calls scheduled"
      }
    },
    {
      id: "geo-optimization",
      title: "Generative Engine Optimization (GEO)",
      badge: "AI Search Dominance",
      description: "Positions your product as the authoritative answer when prospective customers ask ChatGPT, Perplexity, Claude, or Google AI Overviews for vendor recommendations in your space.",
      metric: "#1 Recommended",
      tag: "AEO / GEO Engine",
      example: {
        trigger: "Perplexity citation gap detected on 'Best AI Growth Tools for B2B'",
        action: "Injected structured factual proof points and verified comparison benchmarks across open web authorities",
        outcome: "Top citation on ChatGPT Search & Perplexity within 72 hours"
      }
    },
    {
      id: "reactive-authority",
      title: "Reactive Narrative Velocity",
      badge: "Thought Leadership",
      description: "Monitors regulatory updates, platform API changes, and breaking industry trends. Translates breaking market news into authoritative editorial commentary before anyone else publishes.",
      metric: "Zero Hallucination",
      tag: "Market Authority",
      example: {
        trigger: "Meta deprecated legacy API tokens affecting marketing automations",
        action: "Drafted an emergency mitigation breakdown and shared strategic advisory note across LinkedIn and X",
        outcome: "28k impressions and 180 newsletter subscriptions"
      }
    }
  ];

  const faqs = [
    {
      q: "How is an AI Growth Agent different from a social media scheduler?",
      a: "Social media schedulers like Buffer or Hootsuite are passive calendars: you write the post, set a timer, and hope people see it. Markopilot is an active, autonomous growth engine. It monitors competitor moves, ingests trending market discussions, finds verified buyers looking for your solution, crafts strategic messaging, and initiates targeted outreach — 24 hours a day, 7 days a week."
    },
    {
      q: "How does the agent know what is relevant to my product?",
      a: "During onboarding, you define your Growth Objective (e.g. 'Acquire B2B customers in East Africa' or 'Grow developer tool adoption'). The agent continuously measures every internet signal — competitor changes, Reddit threads, tech news, and customer pain points — against your specific Ideal Customer Profile (ICP), filtering out 99% of noise and acting only on high-yield opportunities."
    },
    {
      q: "Can I review the agent's actions before they go live?",
      a: "Yes. You have complete control through the Autonomy Dial. In Level 1 (Copilot), the agent proposes every post and outreach email for manual approval. In Level 2 (Calibrated Autonomy), safe brand actions publish autonomously while outbound cold outreach pauses for 1-click confirmation. In Level 3 (Full Autopilot), the agent executes independently within strict safety and budget guardrails."
    },
    {
      q: "How does Generative Engine Optimization (GEO) help my business get recommended by ChatGPT?",
      a: "Modern buyers search for recommendations directly inside AI engines like ChatGPT, Claude, and Perplexity. These AI models synthesize live web proof to formulate answers. Markopilot strategically seeds verified product facts, technical comparisons, and customer outcomes so AI engines cite your brand as the premier recommendation."
    },
    {
      q: "Will my outreach emails end up in spam?",
      a: "No. Markopilot implements enterprise deliverability standards: human-mimicking send intervals, strict daily sending limits, direct sender authentication (via your connected Gmail or Google Workspace), and zero purchased lists. We only engage verified business contacts with verifiable pain points, complete with one-click unsubscribe links."
    },
    {
      q: "How do payments work in Kenya and across Africa?",
      a: "Markopilot supports instant Safaricom M-PESA STK push and Buy Goods Till numbers for frictionless checkout in Kenyan Shillings (KES). All plans start with a 7-day free trial. If you are outside Kenya, you can join our International Priority Waitlist for immediate card billing rollout."
    }
  ];

  return (
    <div className="min-h-screen bg-[#07070a] text-white selection:bg-[#7c6eff] selection:text-white relative overflow-x-hidden">

      {/* Ambient Radial Lights */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(124,110,255,0.18),transparent_65%)]" />
        <div className="absolute top-[800px] left-1/3 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)]" />
        <div className="absolute bottom-0 right-1/4 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_bottom,rgba(124,110,255,0.12),transparent_70%)]" />
      </div>

      {/* Dynamic Cursor Glow */}
      {mounted && mousePos.x !== 0 && (
        <div
          className="fixed z-0 pointer-events-none rounded-full blur-[140px] opacity-20 transition-opacity duration-300"
          style={{
            width: "550px",
            height: "550px",
            background: "radial-gradient(circle, #7c6eff 0%, rgba(59,130,246,0.3) 50%, transparent 70%)",
            transform: `translate(${mousePos.x - 275}px, ${mousePos.y - 275}px)`,
          }}
        />
      )}

      {/* ── Top Navigation ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#07070a]/80 backdrop-blur-2xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white via-gray-200 to-gray-400 flex items-center justify-center text-black shadow-lg shadow-white/10">
              <Bot size={20} className="stroke-[2.2]" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-medium tracking-tight text-white font-serif">Markopilot</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                v2.4 Agent Runtime
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#mission-control" className="hover:text-white transition-colors">Mission Control</Link>
            <Link href="#architecture" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="#playbooks" className="hover:text-white transition-colors">Playbooks</Link>
            <Link href="#governance" className="hover:text-white transition-colors">Governance</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignIn}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-white text-black hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <GoogleLogo />
              <span>Deploy Agent</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────────────────────── */}
      <header className="relative z-10 pt-36 pb-20 max-w-6xl mx-auto px-6 text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md mb-8 hover:border-white/20 transition-all">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7c6eff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7c6eff]"></span>
          </span>
          <span className="text-xs font-mono text-gray-300">Autonomous Market Ingestion &amp; Execution</span>
          <span className="text-gray-600">•</span>
          <span className="text-xs font-mono text-[#a89eff] font-medium">Zero Human Gruntwork</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white font-normal leading-[1.08] mb-8">
          The Autonomous <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-300">
            AI Growth Engine
          </span>
        </h1>

        {/* Plain-English High-Impact Value Proposition */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-sans font-light leading-relaxed mb-10">
          Markopilot operates your company&apos;s growth function 24/7. It continuously scans your market, intercepts competitor shifts, extracts high-intent buyers, and executes high-converting interventions — while you build.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={handleSignIn}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:bg-gray-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(255,255,255,0.25)] active:scale-95 cursor-pointer"
          >
            <GoogleLogo />
            <span>Deploy Your Growth Agent</span>
            <ArrowRight size={17} />
          </button>
          <a
            href="#mission-control"
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/5 border border-white/10 text-gray-200 font-medium text-base hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <Terminal size={17} className="text-[#a89eff]" />
            <span>Inspect Live Telemetry</span>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
            <span>10,000+ Signals Ingested Daily</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
            <span>Zero Hallucination Guardrails</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
            <span>Supervised L1–L3 Autonomy</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
            <span>M-PESA &amp; Global Billing</span>
          </div>
        </div>
      </header>

      {/* ── Mission Control Terminal Mockup ────────────────────────────────────── */}
      <section id="mission-control" className="max-w-7xl mx-auto px-6 py-12 relative z-10 scroll-mt-24">
        <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#111116] via-[#0c0c10] to-[#07070a] shadow-[0_0_80px_rgba(124,110,255,0.12)] overflow-hidden">

          {/* Console Header Bar */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="text-xs font-mono text-gray-400 border-l border-white/10 pl-3">
                AGENT CORE: <strong className="text-white">MARKOPILOT-ALPHA</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>STATE: AUTONOMOUS LOOP ACTIVE</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-gray-400">
                <span>INGESTION:</span>
                <span className="text-[#a89eff] font-semibold">48 SIGNALS / MIN</span>
              </div>
            </div>
          </div>

          {/* Console Content: 3-Column Agent Cockpit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">

            {/* Column 1: Multi-Source Sensory Stream (Perceive) */}
            <div className="lg:col-span-4 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Radar size={14} className="text-[#a89eff] animate-pulse" />
                  Sensory Stream (Perceive)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Live</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition">
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1.5">
                    <span className="text-amber-400">COMPETITOR DIFF</span>
                    <span>2 mins ago</span>
                  </div>
                  <p className="text-xs text-gray-200 font-medium leading-relaxed">
                    Supabase alternative raised entry pricing +40% &amp; deprecated free tier limits.
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>Relevance: 98%</span>
                    <span className="text-emerald-400">High Urgency</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition">
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1.5">
                    <span className="text-blue-400">BUYER INTENT SIGNAL</span>
                    <span>7 mins ago</span>
                  </div>
                  <p className="text-xs text-gray-200 font-medium leading-relaxed">
                    r/SaaS: "Frustrated with manual cold email setup for our B2B agency. Any agentic tools that work?"
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>Target Fit: 95%</span>
                    <span className="text-blue-400">ICP Match</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition">
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1.5">
                    <span className="text-purple-400">SEARCH ALGORITHM SHIFT</span>
                    <span>14 mins ago</span>
                  </div>
                  <p className="text-xs text-gray-200 font-medium leading-relaxed">
                    Perplexity ranking query shift detected on: "Best autonomous marketing infrastructure 2026".
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>GEO Opportunity</span>
                    <span className="text-purple-300">Actionable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Cognitive Reasoning Engine (Decide) */}
            <div className="lg:col-span-4 p-6 space-y-4 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain size={14} className="text-emerald-400" />
                  Reasoning Core (Decide)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">96.4% Confidence</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 font-mono text-xs">
                <div className="text-gray-400 text-[11px]">ACTIVE REASONING HYPOTHESIS:</div>
                <p className="text-gray-200 leading-relaxed font-sans text-xs">
                  "Target accounts are experiencing severe pricing friction from legacy competitor. Probability of conversion via migration messaging is 3.4x baseline."
                </p>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Selected Playbook:</span>
                    <span className="text-white font-medium">Competitor Churn Intercept</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Enriched Accounts:</span>
                    <span className="text-emerald-400 font-semibold">28 Verified Founders</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Safety Verification:</span>
                    <span className="text-emerald-400">Passed (0 spam indicators)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Human Approval:</span>
                    <span className="text-amber-400">Auto-Bypassed (L2 Policy)</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center gap-2 text-xs font-mono text-[#a89eff] mb-1">
                  <Cpu size={14} /> Multi-Model Synthesis
                </div>
                <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                  Synthesizing ICP profile data, competitor diffs, and verified business registries into tailored multi-channel actions.
                </p>
              </div>
            </div>

            {/* Column 3: Executed Autonomous Interventions (Act) */}
            <div className="lg:col-span-4 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Send size={14} className="text-blue-400" />
                  Growth Interventions (Act)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Autonomous</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-400 font-semibold">OUTREACH DISPATCHED</span>
                    <span className="text-gray-500">#ACT-1082</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    Sent 28 context-aware migration proposals to verified B2B engineering heads via authenticated company inbox.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 pt-1">
                    <span className="text-emerald-400">✓ 100% Delivered</span>
                    <span>•</span>
                    <span>0 Bounces</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-purple-400 font-semibold">GEO KNOWLEDGE SEEDED</span>
                    <span className="text-gray-500">#ACT-1083</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    Indexed comprehensive comparison matrix on developer portals to capture Perplexity &amp; ChatGPT recommendations.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 pt-1">
                    <span className="text-purple-300">✓ AI Citation Verified</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-blue-400 font-semibold">NARRATIVE PUBLISHED</span>
                    <span className="text-gray-500">#ACT-1084</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    Published counter-positioning teardown to LinkedIn and X addressing the competitor shift.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 pt-1">
                    <span className="text-blue-300">✓ +4.8k Reach in 30m</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Console Bottom Status Row */}
          <div className="px-6 py-3.5 bg-black/60 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-gray-400">
            <div className="flex items-center gap-4">
              <span className="text-gray-500">GOAL:</span>
              <span className="text-white">"Acquire 100 Active SaaS Accounts in East Africa &amp; Global Dev Hubs"</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-400">CYCLE LATENCY: 340ms</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400">UPTIME: 99.98%</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Architectural Loop Section ────────────────────────────────────────── */}
      <section id="architecture" className="py-24 max-w-7xl mx-auto px-6 relative z-10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7c6eff]/10 border border-[#7c6eff]/20 text-[#a89eff] text-xs font-mono uppercase tracking-wider">
            <Zap size={13} /> The Autonomous Loop
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-normal">
            Perceive. Reason. Synthesize. Execute.
          </h2>
          <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
            Unlike human teams that context-switch and drop the ball, Markopilot runs a deterministic 4-stage growth loop around the clock.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Phase 1 */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-7 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">PHASE 01</span>
                <Eye size={20} className="text-purple-300 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-serif text-2xl text-white">Universal Sensory Radar</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Continuous ingestion of competitor software changelogs, industry news, customer complaints, Reddit discussions, and keyword velocity.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="text-xs font-mono text-gray-400">Ingests: <span className="text-white">Competitor Diffs, RSS, X, Reddit</span></div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-7 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">PHASE 02</span>
                <Brain size={20} className="text-emerald-300 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-serif text-2xl text-white">Cognitive Intent Filter</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Multi-model AI rejects 99% of vanity noise. Scores signals purely on revenue relevance, urgency, and alignment with your target ICP.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="text-xs font-mono text-gray-400">Relevance: <span className="text-white">Strict ICP &amp; Budget Matching</span></div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-7 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">PHASE 03</span>
                <Target size={20} className="text-blue-300 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-serif text-2xl text-white">Strategic Synthesis</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Formulates the highest-leverage growth playbook: competitor hijack, personalized email outreach, GEO knowledge injection, or editorial authority.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="text-xs font-mono text-gray-400">Precision: <span className="text-white">Contextual Argument Generation</span></div>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-7 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">PHASE 04</span>
                <Activity size={20} className="text-amber-300 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-serif text-2xl text-white">Calibrated Execution</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Executes via verified authenticated inboxes, authoritative web surfaces, and professional channels within strict rate limits and reputation safety bounds.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="text-xs font-mono text-gray-400">Outcome: <span className="text-white">Telemetry &amp; Continuous Learning</span></div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Playbooks Section ────────────────────────────────────────────────── */}
      <section id="playbooks" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-wider">
            <Layers size={13} /> Autonomous Playbooks
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-normal">
            Growth Strategies Executed Automatically.
          </h2>
          <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
            Forget manual posting calendars. Markopilot activates battle-tested growth mechanics triggered by live internet events.
          </p>
        </div>

        {/* Playbook Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {playbooks.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActivePlaybook(idx)}
              className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                activePlaybook === idx
                  ? "bg-white/[0.08] border-[#7c6eff] shadow-[0_0_30px_rgba(124,110,255,0.15)]"
                  : "bg-white/[0.02] border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase text-[#a89eff]">{p.tag}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">{p.metric}</span>
              </div>
              <h4 className="font-medium text-white text-base">{p.title}</h4>
            </button>
          ))}
        </div>

        {/* Selected Playbook Showcase Display */}
        <div className="rounded-3xl bg-gradient-to-b from-[#111116] to-[#07070a] border border-white/15 p-8 lg:p-12 shadow-2xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
                {playbooks[activePlaybook].badge}
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl text-white leading-tight">
                {playbooks[activePlaybook].title}
              </h3>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-light">
                {playbooks[activePlaybook].description}
              </p>

              <div className="pt-2">
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 transition shadow active:scale-95 cursor-pointer"
                >
                  <span>Activate This Playbook</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-mono text-gray-400">TELEMETRY CASE STUDY</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Verified Output</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] font-mono text-amber-400 block mb-1">01 • TRIGGER DETECTED</span>
                    <p className="text-gray-300 bg-white/[0.02] p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                      "{playbooks[activePlaybook].example.trigger}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-[#a89eff] block mb-1">02 • AGENT INTERVENTION</span>
                    <p className="text-gray-300 bg-white/[0.02] p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                      {playbooks[activePlaybook].example.action}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 block mb-1">03 • MEASURED RESULT</span>
                    <p className="text-emerald-300 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 font-medium font-sans leading-relaxed">
                      ✓ {playbooks[activePlaybook].example.outcome}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Governance & Autonomy Dial Section ─────────────────────────────────── */}
      <section id="governance" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider">
              <ShieldCheck size={14} /> Safety &amp; Governance
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl text-white font-normal leading-tight">
              Calibrated Autonomy. <br />
              You Hold the Steering Wheel.
            </h2>
            <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
              We reject black-box hallucination. You decide how much autonomy your growth agent gets — from strict 1-click approvals to full-throttle autopilot within parameterized safety guardrails.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">Domain Health Protection</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Natural sending cadences, strict daily limits, and verified DKIM/SPF alignment keep your inbox reputation pristine.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">Anti-Hallucination Fact Verification</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Every generated claim is verified against your brand knowledge base before publication or outreach.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">Instant Emergency Kill-Switch</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Pause all autonomous actions, drafts, and campaigns in a single click whenever you need.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Autonomy Dial Visualizer */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-gradient-to-b from-[#13131a] to-[#09090d] border border-white/15 p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-[#a89eff]" />
                  Autonomy Selector
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  Level {autonomyLevel} Active
                </span>
              </div>

              {/* 3 Level Buttons */}
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10">
                <button
                  onClick={() => setAutonomyLevel(1)}
                  className={`py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    autonomyLevel === 1 ? "bg-white text-black font-semibold shadow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  L1: Co-Pilot
                </button>
                <button
                  onClick={() => setAutonomyLevel(2)}
                  className={`py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    autonomyLevel === 2 ? "bg-[#7c6eff] text-white font-semibold shadow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  L2: Supervised
                </button>
                <button
                  onClick={() => setAutonomyLevel(3)}
                  className={`py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    autonomyLevel === 3 ? "bg-emerald-500 text-black font-semibold shadow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  L3: Autonomous
                </button>
              </div>

              {/* Mode Breakdown Box */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                {autonomyLevel === 1 && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <Lock size={15} className="text-amber-400" />
                      Level 1: Human-in-the-Loop Co-Pilot
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-light">
                      The agent functions as an elite research analyst. It continuously monitors the market, flags opportunities, and drafts complete actions, but requires your explicit approval before sending or publishing anything.
                    </p>
                    <div className="text-[11px] font-mono text-gray-400 pt-1">
                      Best for: Early-stage founders validating positioning or sensitive B2B domains.
                    </div>
                  </div>
                )}

                {autonomyLevel === 2 && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <SlidersHorizontal size={15} className="text-[#a89eff]" />
                      Level 2: Calibrated Supervised Autonomy (Recommended)
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-light">
                      Low-risk actions (reactive social teardowns, GEO knowledge seeding, market monitoring) execute autonomously. High-impact outbound email sequences wait in a morning review queue for your 1-click authorization.
                    </p>
                    <div className="text-[11px] font-mono text-emerald-400 pt-1">
                      Best for: Growing companies balancing high velocity with brand safety.
                    </div>
                  </div>
                )}

                {autonomyLevel === 3 && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <Zap size={15} className="text-emerald-400" />
                      Level 3: Full-Throttle Autonomous Flight
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-light">
                      The agent operates as your complete growth engineer. It perceives opportunities, enriches decision-maker contacts, writes context-rich copy, and executes across all channels within predetermined budget and volume caps.
                    </p>
                    <div className="text-[11px] font-mono text-purple-300 pt-1">
                      Best for: Aggressive scale, programmatic lead acquisition, and solo operators.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
                <span>Guardrails: <strong className="text-white">Strict RFC 5322 &amp; CAN-SPAM Compliant</strong></span>
                <span className="text-emerald-400">100% Opt-out Guarantee</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Comparison Section: The Old Way vs Markopilot ──────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono uppercase tracking-wider">
            <Flame size={13} /> The Paradigm Shift
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-normal">
            Why Modern Builders Deploy Agents.
          </h2>
          <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
            Hiring a fragmented human marketing team vs deploying a tireless AI growth co-worker.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* Legacy Marketing */}
          <div className="rounded-3xl bg-red-950/[0.08] border border-red-500/20 p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
              <div>
                <h3 className="text-xl font-medium text-red-200">The Fragmented Human Agency</h3>
                <p className="text-xs text-red-400/80 font-mono mt-0.5">Agencies, Contractors &amp; Manual Schedulers</p>
              </div>
              <span className="text-xs font-mono text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                $4,000–$8,000 / mo
              </span>
            </div>

            <ul className="space-y-4 text-sm text-gray-300 font-light">
              <li className="flex items-start gap-3">
                <XCircle size={17} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span><strong>Slow reaction time:</strong> Takes 3 to 5 business days to draft, approve, and post about breaking news or competitor shifts.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={17} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span><strong>Context-switching chaos:</strong> 5 disconnected tools for lead scraping, scheduling, email warmup, and analytics.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={17} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span><strong>Passive broadcasting:</strong> Blindly schedules generic social calendars without knowing what buyers are actually searching for.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={17} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span><strong>Zero GEO strategy:</strong> No concept of how to optimize your brand so ChatGPT and Perplexity recommend your product.</span>
              </li>
            </ul>
          </div>

          {/* Markopilot AI Agent */}
          <div className="rounded-3xl bg-gradient-to-b from-[#13121d] to-[#09080f] border border-[#7c6eff]/40 p-8 space-y-6 shadow-[0_0_60px_rgba(124,110,255,0.15)] relative">
            <div className="absolute -top-3 right-6 bg-[#7c6eff] text-white text-[10px] font-bold font-mono uppercase tracking-widest px-3.5 py-1 rounded-full shadow-lg">
              Category Defining
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-medium text-white">The Markopilot Growth Agent</h3>
                <p className="text-xs text-[#a89eff] font-mono mt-0.5">24/7 Autonomous Perception &amp; Execution</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                From KES 3,800 / mo
              </span>
            </div>

            <ul className="space-y-4 text-sm text-gray-200 font-light">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Sub-10 minute latency:</strong> Automatically detects competitor pricing shifts and intercepts prospects before rivals notice.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Full-stack agent engine:</strong> Signal surveillance, contact discovery, verified enrichment, copy generation, and execution in one system.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Generative Engine Optimization (GEO):</strong> Ensures your product is cited as the top recommendation in ChatGPT, Perplexity, and Claude.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Continuous reinforcement learning:</strong> Refines tone, messaging, and outbound targeting based on real pipeline attribution.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── Pricing Section ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono uppercase tracking-wider">
            <ShieldCheck size={14} className="text-emerald-400" /> Transparent Pricing
          </div>
          <h2 className="font-serif text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-normal">
            Deploy Your Agent in Minutes.
          </h2>
          <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
            All plans include a 7-day risk-free trial. Instant activation via Safaricom M-PESA STK Push or Buy Goods Till.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan) => {
            const isFeatured = plan.featured;
            const descriptions: Record<string, string> = {
              starter: "Perfect for solo builders launching their first autonomous market presence.",
              growth: "Designed for scaling startups that require daily autonomous outbound and competitor intercept.",
              scale: "For high-velocity agencies and multi-brand enterprises running a fleet of growth agents.",
            };

            return (
              <div
                key={plan.id}
                className={
                  isFeatured
                    ? "relative rounded-3xl bg-gradient-to-b from-[#181628] via-[#0f0e1a] to-[#07070a] border-2 border-[#7c6eff] p-8 md:p-10 flex flex-col justify-between shadow-[0_0_60px_rgba(124,110,255,0.25)] lg:-translate-y-2 z-10"
                    : "rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all p-8 md:p-10 flex flex-col justify-between"
                }
              >
                {isFeatured && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <span className="bg-[#7c6eff] text-white text-[10px] font-bold font-mono uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <Sparkles size={12} /> Recommended
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-medium text-white">{plan.name}</h3>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white/5 text-gray-300">
                      {plan.brands}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-8 min-h-[36px] font-light leading-relaxed">
                    {descriptions[plan.id] || "Autonomous growth operations for your brand."}
                  </p>

                  <div className="mb-8 font-serif text-white">
                    <span className="text-5xl font-normal">{plan.price}</span>
                    <span className="text-sm font-sans font-light text-gray-400 ml-2">/ month</span>
                  </div>

                  <ul className="space-y-3.5 mb-10 text-xs text-gray-300 font-light">
                    <li className="flex items-center gap-3">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span><strong>{plan.posts}</strong> Autonomous Interventions / mo</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span><strong>{plan.leads}</strong> Verified Decision-Makers Enriched</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span><strong>{plan.impactAlerts}</strong> (Competitor Diffs &amp; Trends)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span>Generative Engine Optimization (GEO/AEO)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span>Verified Mailbox Outreach &amp; Deliverability Engine</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      <span>Full Autonomy Control Dial (L1 – L3)</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleSignIn}
                  className={
                    isFeatured
                      ? "w-full py-4 rounded-full bg-[#7c6eff] text-white font-semibold text-sm hover:bg-[#6e5ff0] transition-all shadow-[0_0_30px_rgba(124,110,255,0.4)] cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      : "w-full py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                  }
                >
                  <GoogleLogo />
                  <span>Start 7-Day Free Trial</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* International Priority Waitlist Banner */}
        <div className="mt-16 text-center text-xs text-gray-400">
          <span>Operating outside M-PESA supported countries? </span>
          <Link href="/coming-soon-country" className="text-emerald-400 hover:text-emerald-300 font-medium underline inline-flex items-center gap-1">
            Join the International Priority Waitlist <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── FAQ Section ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono uppercase tracking-wider">
            <Sparkles size={14} className="text-[#a89eff]" /> Clear Answers
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-normal">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-base sm:text-lg font-light">
            Everything you need to know about deploying your autonomous growth co-pilot.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden transition-colors hover:border-white/20"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-medium text-white text-base md:text-lg cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#a89eff]" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-gray-300 font-light leading-relaxed border-t border-white/5 pt-4 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final Call to Action ──────────────────────────────────────────────── */}
      <section className="py-28 text-center px-6 relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent via-[#7c6eff]/5 to-transparent">
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Growth Engine v2.4 Active &amp; Operational
          </div>

          <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-normal tracking-tight">
            Deploy your growth agent today.
          </h2>

          <p className="text-gray-300 text-lg md:text-xl font-light max-w-xl leading-relaxed">
            Stop losing hours on manual marketing gruntwork. Set your objective and let MarkoPilot handle the rest.
          </p>

          <button
            onClick={handleSignIn}
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-full bg-white text-black font-semibold text-lg hover:scale-[1.03] transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] active:scale-95 cursor-pointer"
          >
            <GoogleLogo />
            <span>Deploy Growth Agent</span>
            <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 bg-[#07070a] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <span className="text-xl font-serif tracking-tight font-medium text-white">Markopilot</span>
              </div>
              <p className="text-gray-400 text-sm max-w-sm font-light leading-relaxed">
                Autonomous AI growth co-pilot for founders, creators, and modern engineering companies.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>System Operational • 99.98% Telemetry</span>
              </div>
            </div>

            <div className="md:col-span-4 md:col-start-7 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-300 font-semibold font-mono">Platform Architecture</div>
              <ul className="space-y-2.5 text-sm text-gray-400 font-light">
                <li><Link href="#mission-control" className="hover:text-white transition-colors">Mission Control</Link></li>
                <li><Link href="#architecture" className="hover:text-white transition-colors">The 4-Stage Loop</Link></li>
                <li><Link href="#playbooks" className="hover:text-white transition-colors">Autonomous Playbooks</Link></li>
                <li><Link href="#governance" className="hover:text-white transition-colors">Safety &amp; Governance</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing &amp; Plans</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-300 font-semibold font-mono">Legal &amp; Support</div>
              <ul className="space-y-2.5 text-sm text-gray-400 font-light">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:hello@markopilot.com" className="hover:text-white transition-colors">Contact Engineering</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-sans">
            <p>© {new Date().getFullYear()} Markopilot Ltd. Mirage Tower, Chiromo Rd, Nairobi, Kenya.</p>
            <p className="text-gray-500 font-mono">Autonomous AI Growth Engine.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
