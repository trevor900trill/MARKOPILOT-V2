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
  Radar,
  CheckCircle2,
  Clock,
  Brain,
  Target,
  Send,
  Lock,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Mail,
  Share2,
  FileCheck
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useState } from "react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [autonomyLevel, setAutonomyLevel] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<"radar" | "impact" | "outreach" | "social">("impact");

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

  const faqs = [
    {
      q: "What actually is Brand Impact Intelligence?",
      a: "Brand Impact Intelligence is your executive early-warning radar. It continuously monitors breaking industry news, competitor price hikes, regulatory shifts, and public sentiment affecting your brand. For every detected event, it calculates an impact severity (Critical, High, Moderate, Low), explains Why It Matters, recommends a strategic response, and with one click generates an authoritative PR or counter-positioning post directly into your social queue."
    },
    {
      q: "How does the AI choose which signals to act on?",
      a: "The agent uses a 4-stage funnel: Ingest -> AI Relevance Scoring (0 to 100) -> Opportunity Evaluation -> Action Planning. Signals scoring below 45 or classified as passive news are filtered out as background noise. Only high-urgency or commercially relevant signals generate opportunities (like engaging a creator struggling with a competitor's pricing or reaching out to an active buyer)."
    },
    {
      q: "How often does the agent scan the internet for my brand?",
      a: "Scanning frequency is determined by your plan: Scale plans scan every 30 minutes, Growth plans scan every 4 hours, and Starter plans scan once daily. You can also trigger an instant live cycle on demand at any time directly from the dashboard."
    },
    {
      q: "Can I approve actions before they go out?",
      a: "Yes. In Level 1 (Copilot), every single social post and outreach email requires your manual approval in the queue. In Level 2 (Supervised Autonomy, the default), brand social posts publish automatically while outbound email sequences pause for your 1-click authorization. In Level 3 (Full Autopilot), the agent runs autonomously within strict daily volume caps and safety bounds."
    },
    {
      q: "Will cold emails hurt my domain reputation?",
      a: "No. Markopilot uses enterprise-grade deliverability: natural human sending intervals (e.g. 4-hour staggered delays), strict daily volume caps (default 50/day), direct sender authentication through your own connected Gmail / Google Workspace, verified B2B contacts only, and zero purchased lists."
    },
    {
      q: "How does billing work with Safaricom M-PESA?",
      a: "For founders in Kenya and East Africa, Markopilot integrates directly with Safaricom M-PESA via instant STK push and Buy Goods Till numbers. All plans include a 7-day free trial. If you are an international user, you can register for instant priority card billing rollout."
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-violet-600 selection:text-white relative font-sans antialiased">

      {/* ── Subtle Architectural Grid Background ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ── Top Navigation ────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-neutral-400 flex items-center justify-center text-black font-semibold shadow-sm">
              <Bot size={18} className="stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-serif tracking-tight text-white font-medium">Markopilot</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Autonomous Engine
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-400">
            <Link href="#features" className="hover:text-white transition-colors">Platform</Link>
            <Link href="#impact-radar" className="hover:text-white transition-colors">Brand Impact</Link>
            <Link href="#autonomy" className="hover:text-white transition-colors">Autonomy Dial</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignIn}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <GoogleLogo />
              <span>Deploy Agent</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <header className="relative z-10 pt-32 pb-20 max-w-5xl mx-auto px-6 text-center">
        {/* Release Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
          <span>Continuous Market Ingestion &amp; Calibrated Execution</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-tight text-white font-normal leading-[1.1] mb-6">
          The autonomous growth co-worker <br />
          <span className="italic font-serif text-neutral-300">for ambitious brands.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Markopilot watches the internet 24/7 for market shifts, assesses commercial threats, flags high-intent buyers, and executes calibrated outreach and social narratives — while you build.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <button
            onClick={handleSignIn}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
          >
            <GoogleLogo />
            <span>Deploy Free 7-Day Trial</span>
            <ArrowRight size={15} />
          </button>
          <a
            href="#impact-radar"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 font-medium text-sm hover:bg-white/[0.08] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Radar size={15} className="text-violet-400" />
            <span>Inspect Brand Impact Radar</span>
          </a>
        </div>

        {/* Proof Row */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Multi-Source Signals (Reddit, RSS, News, Search)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Calibrated L1–L3 Autonomy</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Safaricom M-PESA &amp; Global Card Billing</span>
          </div>
        </div>
      </header>

      {/* ── Interactive Core Platform Showcase ────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-12 relative z-10 scroll-mt-20">
        <div className="rounded-3xl border border-white/10 bg-[#111115] shadow-2xl overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="p-2 border-b border-white/10 bg-[#0c0c0f] flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("impact")}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "impact"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <ShieldAlert size={14} className="text-rose-400" />
              <span>Brand Impact Intelligence</span>
            </button>
            <button
              onClick={() => setActiveTab("radar")}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "radar"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Radar size={14} className="text-violet-400" />
              <span>Signals &amp; Opportunity Funnel</span>
            </button>
            <button
              onClick={() => setActiveTab("outreach")}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "outreach"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Mail size={14} className="text-blue-400" />
              <span>Precision B2B Outreach</span>
            </button>
            <button
              onClick={() => setActiveTab("social")}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === "social"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Share2 size={14} className="text-emerald-400" />
              <span>Social Narrative Engine</span>
            </button>
          </div>

          {/* Module 1: Brand Impact Intelligence */}
          {activeTab === "impact" && (
            <div className="p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-mono uppercase tracking-wider mb-1">
                    <ShieldAlert size={14} /> Executive Crisis &amp; Market Radar
                  </div>
                  <h3 className="text-2xl font-serif text-white">Brand Impact Intelligence</h3>
                  <p className="text-sm text-neutral-400 mt-1 max-w-2xl font-light">
                    Continuously scans industry news, competitor price adjustments, and market disruptions. Categorizes events by severity, explains the commercial risk, and generates one-click counter-measures.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs">
                    Live Threat Evaluation
                  </span>
                </div>
              </div>

              {/* Realistic Impact Alert Cards */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-[#16161b] border border-rose-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      CRITICAL IMPACT
                    </span>
                    <span className="text-xs font-mono text-neutral-400">18 mins ago • TechCrunch</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    Primary Competitor Hikes Enterprise Tier by 40% &amp; Removes Free Plan
                  </h4>
                  <div className="text-xs space-y-1.5 text-neutral-300 font-light">
                    <div>
                      <strong className="text-white font-medium">Why It Matters:</strong> Severe pricing friction creates an immediate window to capture dissatisfied customers actively looking for migrations.
                    </div>
                    <div>
                      <strong className="text-rose-300 font-medium">Recommended Action:</strong> Publish a transparent pricing comparison and offer a 1-click data migration discount.
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400">✓ One-Click Hook Drafted</span>
                    <span className="text-xs text-neutral-400">Auto-routed to Social &amp; Outreach</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#16161b] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      HIGH IMPACT
                    </span>
                    <span className="text-xs font-mono text-neutral-400">1 hour ago • Regulatory Wire</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    New Data Protection Compliance Directive Enacted in East Africa
                  </h4>
                  <div className="text-xs space-y-1.5 text-neutral-300 font-light">
                    <div>
                      <strong className="text-white font-medium">Why It Matters:</strong> B2B buyers require immediate clarity on compliance and local data sovereignty guarantees.
                    </div>
                    <div>
                      <strong className="text-amber-300 font-medium">Recommended Action:</strong> Broadcast an advisory summary establishing Markopilot&apos;s verified compliance framework.
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400">✓ Advisory Note Ready</span>
                    <span className="text-xs text-neutral-400">Review Queue Level 2</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module 2: Signals & Opportunity Funnel */}
          {activeTab === "radar" && (
            <div className="p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-mono uppercase tracking-wider mb-1">
                    <Radar size={14} /> Multi-Source Radar &amp; Decision Funnel
                  </div>
                  <h3 className="text-2xl font-serif text-white">From Raw Signals to Commercial Action</h3>
                  <p className="text-sm text-neutral-400 mt-1 max-w-2xl font-light">
                    The agent scans dozens of sources per day. It rates relevance against your brand goals and filters out noise — only opportunities scoring ≥ 45 get promoted.
                  </p>
                </div>
                <div className="text-xs font-mono text-neutral-400">
                  Cadence: <strong className="text-white">Every 30m / 4h / Daily</strong>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#16161b] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-violet-400">
                    <span>REDDIT SIGNAL</span>
                    <span className="text-emerald-400">Score 94/100</span>
                  </div>
                  <h5 className="text-xs font-medium text-white">
                    &ldquo;Looking for an automated marketing co-worker that integrates with Gmail and WhatsApp...&rdquo;
                  </h5>
                  <div className="pt-2 border-t border-white/5 text-[11px] text-emerald-400">
                    🎯 Promoted to Opportunity: Direct Buyer Engagement
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#16161b] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-blue-400">
                    <span>COMPETITOR CHANGELOG</span>
                    <span className="text-emerald-400">Score 88/100</span>
                  </div>
                  <h5 className="text-xs font-medium text-white">
                    Competitor deprecated their Zapier webhooks integration.
                  </h5>
                  <div className="pt-2 border-t border-white/5 text-[11px] text-emerald-400">
                    🎯 Promoted to Action: Draft Counter-Positioning Post
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#16161b] border border-white/10 space-y-2 opacity-60">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>GENERAL INDUSTRY NEWS</span>
                    <span className="text-neutral-500">Score 22/100</span>
                  </div>
                  <h5 className="text-xs font-medium text-white">
                    &ldquo;Quarterly venture capital investments in European enterprise software rise by 3%...&rdquo;
                  </h5>
                  <div className="pt-2 border-t border-white/5 text-[11px] text-neutral-400">
                    💤 Filtered Out: Below commercial threshold (45)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module 3: Precision B2B Outreach */}
          {activeTab === "outreach" && (
            <div className="p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-mono uppercase tracking-wider mb-1">
                    <Mail size={14} /> Deliverability-Guaranteed Outbound
                  </div>
                  <h3 className="text-2xl font-serif text-white">Contextual Buyer Ingestion &amp; Cold Email</h3>
                  <p className="text-sm text-neutral-400 mt-1 max-w-2xl font-light">
                    Identifies companies actively hiring or searching for your category, synthesizes bespoke email sequences via your authenticated Gmail, and respects daily caps.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Zero Spam Bounces
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#16161b] border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-neutral-400 border-b border-white/5 pb-2">
                  <span>TO: <strong className="text-white">david.m@apexfintech.ke</strong></span>
                  <span className="text-emerald-400">Verified B2B Lead</span>
                </div>
                <div className="text-neutral-300 font-sans text-xs leading-relaxed space-y-2">
                  <p><strong>Subject:</strong> Quick question regarding ApexFintech&apos;s recent B2B expansion</p>
                  <p className="text-neutral-400 font-light">
                    &ldquo;Hi David — noticed ApexFintech just expanded its merchant payment infrastructure in Nairobi. Most teams scaling this fast hit a wall coordinating manual lead outreach and reactive social commentary...&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-neutral-500">Delivered via connected Google Workspace</span>
                  <span className="text-blue-400">Calibrated Delay: 4 hours</span>
                </div>
              </div>
            </div>
          )}

          {/* Module 4: Social Narrative */}
          {activeTab === "social" && (
            <div className="p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">
                    <Share2 size={14} /> Reactive Thought Leadership
                  </div>
                  <h3 className="text-2xl font-serif text-white">Cross-Platform Social Publishing</h3>
                  <p className="text-sm text-neutral-400 mt-1 max-w-2xl font-light">
                    Translates breaking events and product achievements into compelling commentary on LinkedIn, X, and Instagram. Autonomously or queued for review.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#16161b] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span className="text-blue-400">LINKEDIN &amp; X / TWITTER</span>
                  <span>Scheduled for Peak Audience Velocity</span>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                  &ldquo;Most founders think automated marketing means scheduling 30 generic tweets in advance. In 2026, growth happens reactively: intercepting competitor price hikes within 15 minutes and responding with structured proof.&rdquo;
                </p>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span className="text-emerald-400">✓ In Tone of Voice: Professional, Assertive</span>
                  <span>Brand Persona Calibrated</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── Brand Impact Intelligence Dedicated Section ───────────────── */}
      <section id="impact-radar" className="py-20 max-w-6xl mx-auto px-6 relative z-10 border-t border-white/[0.08] scroll-mt-20">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono uppercase tracking-wider mb-3">
            <ShieldAlert size={13} /> The Executive Safeguard
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal leading-tight mb-4">
            Brand Impact Intelligence: <br />
            <span className="italic text-neutral-400">Never get caught off-guard by a competitor or crisis again.</span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
            Standard marketing tools blindly push scheduled posts. Markopilot evaluates external news, social sentiment, and competitor actions to protect and grow your brand equity in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#111115] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-semibold text-white">Severity Classification</h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Every event is graded (Critical, High, Moderate, Low, Info) so your team immediately knows what demands attention versus what is background chatter.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111115] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-semibold text-white">Commercial Impact Analysis</h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              The AI breaks down *Why It Matters* and outlines the exact commercial risks or conversion opportunities for your target market.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111115] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-semibold text-white">One-Click Counter-Action</h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Generates an authoritative PR statement, counter-argument, or positioning guide ready to approve or dispatch to social channels with zero hesitation.
            </p>
          </div>
        </div>
      </section>

      {/* ── Autonomy Dial Section ──────────────────────────────────────── */}
      <section id="autonomy" className="py-20 max-w-6xl mx-auto px-6 relative z-10 border-t border-white/[0.08] scroll-mt-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-mono uppercase tracking-wider">
              <SlidersHorizontal size={13} /> Calibrated Autonomy
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal leading-tight">
              You set the level of control. <br />
              <span className="italic text-neutral-400">No black-box surprises.</span>
            </h2>
            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              Whether you require 100% human-in-the-loop review or wish to run fully autonomous outbound campaigns, Markopilot adapts to your comfort level.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Synchronized across Brand Settings, Social, and Outreach</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Instant emergency kill-switch available anytime</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Strict RFC 5322 &amp; CAN-SPAM compliant delivery</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-7 rounded-3xl bg-[#111115] border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono text-neutral-400 uppercase">Select Mode:</span>
                <span className="text-xs font-mono text-violet-300 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                  Level {autonomyLevel} Selected
                </span>
              </div>

              {/* 3 Dial Selector Buttons */}
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#0c0c0f] border border-white/5">
                <button
                  onClick={() => setAutonomyLevel(1)}
                  className={`py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                    autonomyLevel === 1 ? "bg-white text-black font-semibold shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  L1: Co-Pilot
                </button>
                <button
                  onClick={() => setAutonomyLevel(2)}
                  className={`py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                    autonomyLevel === 2 ? "bg-violet-600 text-white font-semibold shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  L2: Supervised
                </button>
                <button
                  onClick={() => setAutonomyLevel(3)}
                  className={`py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                    autonomyLevel === 3 ? "bg-emerald-500 text-black font-semibold shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  L3: Autopilot
                </button>
              </div>

              {/* Detail Card */}
              <div className="p-5 rounded-2xl bg-[#16161b] border border-white/10 space-y-2">
                {autonomyLevel === 1 && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Lock size={14} className="text-amber-400" /> Level 1: Human-in-the-Loop Co-Pilot
                    </h4>
                    <p className="text-xs text-neutral-300 font-light leading-relaxed">
                      The agent monitors feeds, flags market shifts, and prepares full copy drafts, but halts all publishing and email dispatches until you manually approve them in the Approval Queue.
                    </p>
                    <div className="text-[11px] font-mono text-neutral-500 pt-1">
                      Ideal for: Regulated industries or validating initial messaging.
                    </div>
                  </div>
                )}
                {autonomyLevel === 2 && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <SlidersHorizontal size={14} className="text-violet-400" /> Level 2: Supervised Autonomy (Recommended)
                    </h4>
                    <p className="text-xs text-neutral-300 font-light leading-relaxed">
                      Low-risk social thought leadership posts automatically on schedule. Outbound sales emails to prospective buyers wait in your morning queue for quick 1-click confirmation.
                    </p>
                    <div className="text-[11px] font-mono text-emerald-400 pt-1">
                      Ideal for: Growing companies balancing high velocity with brand safety.
                    </div>
                  </div>
                )}
                {autonomyLevel === 3 && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Zap size={14} className="text-emerald-400" /> Level 3: Full Autonomous Flight
                    </h4>
                    <p className="text-xs text-neutral-300 font-light leading-relaxed">
                      The agent operates independently across all configured channels within your strict daily volume caps, delay windows, and reputation thresholds.
                    </p>
                    <div className="text-[11px] font-mono text-violet-300 pt-1">
                      Ideal for: Aggressive scale, solo founders, and established ICP playbooks.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Transparent Pricing Section ───────────────────────────────── */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6 relative z-10 border-t border-white/[0.08] scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <Smartphone size={13} /> Transparent Pricing
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal">
            Pay via Safaricom M-PESA or Card.
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 font-light">
            Every plan includes full access to the Autonomous Growth Agent and a 7-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isGrowth = plan.id === "growth";
            const scanFreq =
              plan.id === "scale" ? "Every 30 Minutes" :
              plan.id === "growth" ? "Every 4 Hours" :
              "Daily (08:00 UTC)";

            return (
              <div
                key={plan.id}
                className={`p-7 rounded-3xl flex flex-col justify-between transition-all relative ${
                  isGrowth
                    ? "bg-[#14141a] border-2 border-violet-500 shadow-2xl shadow-violet-500/10"
                    : "bg-[#111115] border border-white/10"
                }`}
              >
                {isGrowth && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-600 text-white text-[11px] font-mono font-semibold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium text-white">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-semibold text-white font-mono">{plan.price}</span>
                      <span className="text-xs text-neutral-400">/ month</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-1">Instant M-PESA STK Push or Till</div>
                  </div>

                  <div className="h-px bg-white/10" />

                  <ul className="space-y-3 text-xs text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span><strong>{plan.brands}</strong> Managed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span><strong>{plan.posts}</strong> / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span><strong>{plan.leads}</strong> enriched prospects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span>Radar Frequency: <strong className="text-violet-300">{scanFreq}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span><strong>{plan.impactAlerts}</strong> (Brand Impact Radar)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span>L1–L3 Autonomy Controls</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={handleSignIn}
                    className={`w-full py-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                      isGrowth
                        ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20"
                        : "bg-white text-black hover:bg-neutral-200"
                    }`}
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────── */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6 relative z-10 border-t border-white/[0.08] scroll-mt-20">
        <div className="text-center mb-12 space-y-2">
          <h2 className="font-serif text-3xl text-white font-normal">Frequently Answered Questions</h2>
          <p className="text-sm text-neutral-400 font-light">Clear explanations for founders and growth operators.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-[#111115] overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-medium text-white hover:text-neutral-200 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-300 font-light leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/[0.08] relative z-10 bg-[#070709] text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <Bot size={16} className="text-white" />
            <span className="font-serif text-white font-medium">Markopilot</span>
            <span>• The Autonomous Growth Co-Worker</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <span>Nairobi, Kenya &amp; Global</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
