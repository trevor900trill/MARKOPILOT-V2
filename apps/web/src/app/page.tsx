"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Check,
  ArrowRight,
  Bot,
  Radar,
  CheckCircle2,
  Clock,
  Target,
  Send,
  Lock,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Mail,
  Share2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Zap,
  Globe,
  Radio,
  FileCheck
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useState } from "react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      a: "Brand Impact Intelligence is your executive threat and opportunity radar. It continuously monitors breaking industry publications, competitor pricing shifts, regulatory changes, and brand sentiment. When an event happens, it calculates severity from Critical to Low, explains the commercial significance, recommends an immediate response, and prepares an authoritative statement ready for your social queues in one click."
    },
    {
      q: "How does the AI determine when to act on an online signal?",
      a: "Every signal captured from Reddit, RSS feeds, search queries, or competitor pages goes through a strict 4-stage evaluation funnel. The AI scores each item from 0 to 100 on revenue relevance and urgency. Signals that score under 45 or represent passive industry banter are discarded as noise. Only actionable signals with clear commercial intent produce opportunities in your queue."
    },
    {
      q: "How often does the system monitor the internet for my brand?",
      a: "Scan frequency is tied to your subscription plan. Scale plans scan every 30 minutes. Growth plans scan every 4 hours. Starter plans scan once every day at 08:00 UTC. In addition, you can trigger an immediate on-demand scan at any moment from your command center."
    },
    {
      q: "Can I approve actions before anything gets sent or published?",
      a: "Yes. You hold full control via the Autonomy Dial. In Level 1 (Copilot), every social post and outbound email stays in your pending queue until you click approve. In Level 2 (Supervised), safe brand posts publish on schedule while outbound sales emails pause for your review. In Level 3 (Autopilot), actions dispatch automatically within your defined daily sending caps."
    },
    {
      q: "How do you protect email domain deliverability?",
      a: "Markopilot avoids the pitfalls of generic spam bots. We route emails through your authenticated Google Workspace or Gmail connection. We enforce human-like delays between sends, cap daily volumes strictly, target only verified B2B prospects, and provide clean opt-out headers on every dispatch."
    },
    {
      q: "How does Safaricom M-PESA payment work?",
      a: "For founders in Kenya and East Africa, checkout connects directly to Safaricom M-PESA with instant STK push and Buy Goods Till numbers. All plans begin with a full 7-day free trial. International founders can join our priority rollout for card billing."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0e0f12] text-[#f2f3f5] font-sans selection:bg-[#0d99ff] selection:text-white">

      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0e0f12]/95 backdrop-blur-md border-b border-[#22242a]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-semibold shadow-sm">
              <Bot size={18} className="stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-semibold tracking-tight text-white">Markopilot</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-[#16181d] text-[#10b981] border border-[#22242a]">
                v2.4
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#9da3ae]">
            <Link href="#impact" className="hover:text-white transition-colors">Brand Impact</Link>
            <Link href="#signals" className="hover:text-white transition-colors">Market Radar</Link>
            <Link href="#outreach" className="hover:text-white transition-colors">B2B Outreach</Link>
            <Link href="#social" className="hover:text-white transition-colors">Social Queue</Link>
            <Link href="#autonomy" className="hover:text-white transition-colors">Autonomy Dial</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignIn}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#e4e5e7] transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
            >
              <GoogleLogo />
              <span>Deploy Agent</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <header className="relative pt-32 pb-16 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181a20] border border-[#272a33] text-xs font-mono text-[#9da3ae] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span>Autonomous Market Radar and Growth Execution</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] text-white leading-[1.08] mb-6">
          Growth engineering for founders who would rather build product.
        </h1>

        <p className="text-base sm:text-xl text-[#9da3ae] max-w-2xl mx-auto font-normal leading-relaxed mb-8">
          Markopilot monitors competitor moves, detects market threats, flags high-intent buyers, and executes calibrated outreach and social commentary. 24 hours a day, 7 days a week.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <button
            onClick={handleSignIn}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-black font-semibold text-sm hover:bg-[#e4e5e7] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
          >
            <GoogleLogo />
            <span>Start Free 7-Day Trial</span>
            <ArrowRight size={15} />
          </button>
          <a
            href="#impact"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#181a20] border border-[#272a33] text-[#d1d5db] font-medium text-sm hover:bg-[#20232b] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <ShieldAlert size={15} className="text-[#f43f5e]" />
            <span>See Brand Impact In Action</span>
          </a>
        </div>

        <div className="pt-6 border-t border-[#1c1e24] flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-mono text-[#6b7280]">
          <span className="text-[#9da3ae]">Integrated with:</span>
          <span>Google Workspace</span>
          <span>•</span>
          <span>LinkedIn</span>
          <span>•</span>
          <span>X / Twitter</span>
          <span>•</span>
          <span>Safaricom M-PESA</span>
          <span>•</span>
          <span>Reddit</span>
        </div>
      </header>

      {/* ── Section 1: Brand Impact Intelligence (Visible upfront, NO tabs) ── */}
      <section id="impact" className="py-16 max-w-6xl mx-auto px-6 border-t border-[#22242a] scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e] text-xs font-mono uppercase tracking-wider mb-3">
              <ShieldAlert size={13} /> Pillar 01
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Brand Impact Intelligence: your executive safeguard.
            </h2>
            <p className="text-sm text-[#9da3ae] leading-relaxed">
              Standard social tools blindly publish scheduled posts. Markopilot evaluates breaking industry news, competitor price adjustments, and market sentiment to protect your brand equity and capitalize on immediate openings.
            </p>
          </div>
          <span className="px-3 py-1 rounded text-xs font-mono bg-[#16181d] text-[#10b981] border border-[#22242a] self-start md:self-auto">
            Live Incident Radar Active
          </span>
        </div>

        {/* Live Visual Alert Cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Critical Card */}
          <div className="p-6 rounded-2xl bg-[#141519] border border-[#f43f5e]/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/20">
                CRITICAL IMPACT
              </span>
              <span className="text-xs font-mono text-[#6b7280]">12 mins ago • TechCrunch</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              Primary Competitor Increases Enterprise Pricing by 40% and Discontinues Free Tier
            </h3>
            <div className="text-xs space-y-2 text-[#d1d5db] font-light">
              <p><strong className="text-white font-medium">Why It Matters:</strong> Rapid pricing shock creates an immediate window to capture dissatisfied customers actively searching for migration alternatives.</p>
              <p><strong className="text-[#f43f5e] font-medium">Recommended Action:</strong> Publish a factual comparison matrix and offer a one-click migration guarantee.</p>
            </div>
            <div className="pt-3 border-t border-[#22242a] flex items-center justify-between text-xs">
              <span className="text-[#10b981] font-mono text-[11px] flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Response Hook Auto-Drafted
              </span>
              <span className="text-[#6b7280]">Ready in Social Queue</span>
            </div>
          </div>

          {/* High Impact Card */}
          <div className="p-6 rounded-2xl bg-[#141519] border border-[#f59e0b]/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20">
                HIGH IMPACT
              </span>
              <span className="text-xs font-mono text-[#6b7280]">48 mins ago • Regulatory Wire</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              New Data Compliance Directives Enacted for B2B Software Platforms
            </h3>
            <div className="text-xs space-y-2 text-[#d1d5db] font-light">
              <p><strong className="text-white font-medium">Why It Matters:</strong> Enterprise buyers need fast clarity on local compliance and residency guarantees.</p>
              <p><strong className="text-[#f59e0b] font-medium">Recommended Action:</strong> Broadcast an advisory summary explaining your verified compliance architecture.</p>
            </div>
            <div className="pt-3 border-t border-[#22242a] flex items-center justify-between text-xs">
              <span className="text-[#10b981] font-mono text-[11px] flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Advisory Note Prepared
              </span>
              <span className="text-[#6b7280]">Pending Approval Queue</span>
            </div>
          </div>
        </div>

        {/* 3 Step Breakdown */}
        <div className="grid md:grid-cols-3 gap-4 pt-2">
          <div className="p-5 rounded-xl bg-[#111215] border border-[#22242a] space-y-2">
            <div className="text-xs font-mono font-bold text-[#f43f5e]">01. SEVERITY TIERS</div>
            <p className="text-xs text-[#9da3ae] leading-relaxed">
              Every market event is classified from Critical to Low so your leadership team immediately knows what demands action.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-[#111215] border border-[#22242a] space-y-2">
            <div className="text-xs font-mono font-bold text-[#0d99ff]">02. COMMERCIAL SIGNIFICANCE</div>
            <p className="text-xs text-[#9da3ae] leading-relaxed">
              The AI explains why the incident matters to your specific customer base and flags immediate revenue risks or acquisition opportunities.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-[#111215] border border-[#22242a] space-y-2">
            <div className="text-xs font-mono font-bold text-[#10b981]">03. IMMEDIATE MITIGATION</div>
            <p className="text-xs text-[#9da3ae] leading-relaxed">
              One-click produces an authoritative counter-measure or positioning teardown ready to publish to connected accounts.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Market Signals & Opportunity Funnel (NO tabs) ─── */}
      <section id="signals" className="py-16 max-w-6xl mx-auto px-6 border-t border-[#22242a] scroll-mt-20">
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d99ff]/10 border border-[#0d99ff]/20 text-[#0d99ff] text-xs font-mono uppercase tracking-wider mb-3">
            <Radar size={13} /> Pillar 02
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            From raw internet signals to qualified opportunities.
          </h2>
          <p className="text-sm text-[#9da3ae] leading-relaxed">
            The agent ingests signals from Reddit discussions, competitor changelogs, industry feeds, and buyer queries. The AI scores every signal from 0 to 100 on commercial relevance. Noise is filtered out automatically.
          </p>
        </div>

        {/* 3 Real Funnel Example Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Signal 1 */}
          <div className="p-5 rounded-2xl bg-[#141519] border border-[#262830] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#0d99ff] font-semibold">REDDIT DISCUSSION</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20">
                Score: 94/100
              </span>
            </div>
            <p className="text-xs font-medium text-white leading-snug">
              &ldquo;Our growth team is spending 15 hours a week manually finding prospects on LinkedIn and sending emails. Is there an autonomous tool that handles both safely?&rdquo;
            </p>
            <div className="pt-3 border-t border-[#22242a] space-y-1 text-xs">
              <span className="text-[#10b981] font-semibold block">Decision: Opportunity Created</span>
              <span className="text-[#9da3ae] text-[11px] block">
                Targeted founder engagement sequence generated.
              </span>
            </div>
          </div>

          {/* Signal 2 */}
          <div className="p-5 rounded-2xl bg-[#141519] border border-[#262830] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#a855f7] font-semibold">COMPETITOR CHANGELOG</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20">
                Score: 86/100
              </span>
            </div>
            <p className="text-xs font-medium text-white leading-snug">
              Competitor removed webhook automation triggers from their standard pricing tier.
            </p>
            <div className="pt-3 border-t border-[#22242a] space-y-1 text-xs">
              <span className="text-[#10b981] font-semibold block">Decision: Action Planned</span>
              <span className="text-[#9da3ae] text-[11px] block">
                Drafted technical teardown post highlighting Markopilot open integration suite.
              </span>
            </div>
          </div>

          {/* Signal 3 (Filtered out) */}
          <div className="p-5 rounded-2xl bg-[#141519] border border-[#262830] space-y-3 opacity-60">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#6b7280]">GENERAL NEWS</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#22242a] text-[#6b7280] border border-[#333]">
                Score: 21/100
              </span>
            </div>
            <p className="text-xs font-medium text-[#9da3ae] leading-snug">
              Quarterly enterprise venture financing notes across European markets.
            </p>
            <div className="pt-3 border-t border-[#22242a] space-y-1 text-xs">
              <span className="text-[#6b7280] font-semibold block">Decision: Filtered Out</span>
              <span className="text-[#6b7280] text-[11px] block">
                Below action threshold (45). Discarded as general background chatter.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Precision B2B Outreach (NO tabs) ──────────────── */}
      <section id="outreach" className="py-16 max-w-6xl mx-auto px-6 border-t border-[#22242a] scroll-mt-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a855f7]/10 border border-[#a855f7]/20 text-[#a855f7] text-xs font-mono uppercase tracking-wider">
              <Mail size={13} /> Pillar 03
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Cold email that gets replies instead of landing in spam.
            </h2>
            <p className="text-sm text-[#9da3ae] leading-relaxed">
              Markopilot extracts decision-makers actively hiring or searching for your product category. Emails dispatch through your authenticated Google Workspace connection with staggered human pacing and strict daily caps.
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-[#d1d5db]">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[#10b981] flex-shrink-0" />
                <span>Zero purchased contact lists. All emails verified.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[#10b981] flex-shrink-0" />
                <span>Default 4-hour delay between automated dispatches.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[#10b981] flex-shrink-0" />
                <span>Direct Gmail and Google Workspace integration.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Realistic Email UI Preview */}
            <div className="p-6 rounded-2xl bg-[#141519] border border-[#262830] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#22242a] text-xs font-mono">
                <span className="text-[#6b7280]">OUTBOUND DISPATCH #820</span>
                <span className="text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20">
                  100% Deliverability
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between text-[#6b7280]">
                  <span>TO: <strong className="text-white">david.m@apexfintech.ke</strong></span>
                  <span className="text-[#0d99ff]">Head of Engineering</span>
                </div>
                <div className="p-4 rounded-xl bg-[#181a20] border border-[#262830] font-sans text-xs space-y-2 text-[#d1d5db]">
                  <p><strong className="text-white">Subject:</strong> Question regarding ApexFintech merchant settlement in Nairobi</p>
                  <p className="text-[#9da3ae] leading-relaxed">
                    Hi David. I saw that ApexFintech is expanding merchant settlement infrastructure this month. Most engineering and growth teams scaling at this pace hit friction maintaining reliable outbound pipelines alongside rapid feature delivery.
                  </p>
                  <p className="text-[#9da3ae] leading-relaxed">
                    We built Markopilot to automate market radar and outreach so technical teams can stay focused on core architecture. Would you be open to a five-minute look?
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] text-[#6b7280]">
                  <span>Staggered interval: 4 hours</span>
                  <span>Direct Google Workspace Connection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Cross-Platform Social Publishing (NO tabs) ────── */}
      <section id="social" className="py-16 max-w-6xl mx-auto px-6 border-t border-[#22242a] scroll-mt-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="p-6 rounded-2xl bg-[#141519] border border-[#262830] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#22242a] text-xs font-mono">
                <span className="text-[#0d99ff]">LINKEDIN &amp; X POST DRAFT</span>
                <span className="text-[#10b981]">Tone of Voice: Assertive, Professional</span>
              </div>

              <div className="p-4 rounded-xl bg-[#181a20] border border-[#262830] space-y-3">
                <p className="text-xs text-white leading-relaxed">
                  Most founders think automated marketing means scheduling thirty generic posts every Monday.
                </p>
                <p className="text-xs text-[#9da3ae] leading-relaxed">
                  Modern growth happens reactively. When your primary competitor increases prices by 40% or drops a core feature, you do not wait five business days for a marketing meeting. You publish a clear migration breakdown within twenty minutes.
                </p>
                <div className="pt-2 border-t border-[#22242a] flex items-center justify-between text-[11px] font-mono text-[#6b7280]">
                  <span>Scheduled for Peak Afternoon Engagement</span>
                  <span className="text-[#10b981]">Safety Guardrails Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-mono uppercase tracking-wider">
              <Share2 size={13} /> Pillar 04
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Reactive social thought leadership.
            </h2>
            <p className="text-sm text-[#9da3ae] leading-relaxed">
              Convert product achievements, customer case studies, and breaking industry news into compelling commentary across LinkedIn, X, and Instagram. Autonomously or queued for your approval.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 5: The Autonomy Dial (Visible side-by-side, NO tabs) ─ */}
      <section id="autonomy" className="py-20 max-w-6xl mx-auto px-6 border-t border-[#22242a] scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181a20] border border-[#272a33] text-xs font-mono text-[#0d99ff] uppercase tracking-wider">
            <SlidersHorizontal size={13} /> Governance
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            You hold the steering wheel.
          </h2>
          <p className="text-sm text-[#9da3ae]">
            Choose exactly how autonomous the growth agent should be. Change settings anytime from your command center.
          </p>
        </div>

        {/* 3 Autonomy Cards Side-by-Side (Everything visible at once) */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Level 1 */}
          <div className="p-6 rounded-2xl bg-[#141519] border border-[#262830] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#22242a]">
              <span className="text-xs font-mono font-bold text-[#f59e0b]">LEVEL 01</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f59e0b]/10 text-[#f59e0b]">
                Co-Pilot
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">Human-in-the-Loop Review</h3>
            <p className="text-xs text-[#9da3ae] leading-relaxed">
              The agent continuously monitors your market and prepares full drafts, but halts all publishing and email dispatches until you manually approve them in the Approval Queue.
            </p>
            <div className="pt-3 border-t border-[#22242a] text-[11px] font-mono text-[#6b7280]">
              Best for: Regulated industries and positioning validation.
            </div>
          </div>

          {/* Level 2 */}
          <div className="p-6 rounded-2xl bg-[#181a20] border-2 border-[#0d99ff] space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#22242a]">
              <span className="text-xs font-mono font-bold text-[#0d99ff]">LEVEL 02 (RECOMMENDED)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0d99ff]/15 text-[#0d99ff]">
                Supervised
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">Calibrated Supervised Autonomy</h3>
            <p className="text-xs text-[#9da3ae] leading-relaxed">
              Safe social thought leadership posts automatically on schedule. Outbound sales emails pause in your morning review queue for quick one-click confirmation.
            </p>
            <div className="pt-3 border-t border-[#22242a] text-[11px] font-mono text-[#0d99ff]">
              Best for: Growing companies balancing velocity with brand safety.
            </div>
          </div>

          {/* Level 3 */}
          <div className="p-6 rounded-2xl bg-[#141519] border border-[#262830] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#22242a]">
              <span className="text-xs font-mono font-bold text-[#10b981]">LEVEL 03</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10b981]/10 text-[#10b981]">
                Autopilot
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">Full Autonomous Flight</h3>
            <p className="text-xs text-[#9da3ae] leading-relaxed">
              The agent executes independently across all channels within your strict daily volume caps, delay windows, and reputation thresholds.
            </p>
            <div className="pt-3 border-t border-[#22242a] text-[11px] font-mono text-[#6b7280]">
              Best for: Aggressive scale, solo founders, and proven playbooks.
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Transparent Pricing ────────────────────────────── */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6 border-t border-[#22242a] scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-mono uppercase tracking-wider">
            <Smartphone size={13} /> Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Pay via Safaricom M-PESA or Card.
          </h2>
          <p className="text-sm text-[#9da3ae]">
            Every tier includes the Autonomous Growth Engine and a 7-day free trial.
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
                className={`p-7 rounded-2xl flex flex-col justify-between transition-all relative ${
                  isGrowth
                    ? "bg-[#181a20] border-2 border-[#0d99ff] shadow-xl"
                    : "bg-[#141519] border border-[#262830]"
                }`}
              >
                {isGrowth && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0d99ff] text-white uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white font-mono">{plan.price}</span>
                      <span className="text-xs text-[#9da3ae]">/ month</span>
                    </div>
                    <div className="text-[11px] text-[#6b7280] font-mono mt-1">Instant M-PESA STK Push or Till</div>
                  </div>

                  <div className="h-px bg-[#262830]" />

                  <ul className="space-y-2.5 text-xs text-[#d1d5db]">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#10b981] flex-shrink-0" />
                      <span><strong>{plan.brands}</strong> Managed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#10b981] flex-shrink-0" />
                      <span><strong>{plan.posts}</strong> / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#10b981] flex-shrink-0" />
                      <span><strong>{plan.leads}</strong> enriched prospects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#10b981] flex-shrink-0" />
                      <span>Radar Frequency: <strong className="text-white">{scanFreq}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#10b981] flex-shrink-0" />
                      <span><strong>{plan.impactAlerts}</strong> (Brand Impact Radar)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-[#10b981] flex-shrink-0" />
                      <span>L1 to L3 Autonomy Controls</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSignIn}
                    className={`w-full py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                      isGrowth
                        ? "bg-[#0d99ff] hover:bg-[#0284c7] text-white"
                        : "bg-white text-black hover:bg-[#e4e5e7]"
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

      {/* ── Section 7: FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-20 max-w-3xl mx-auto px-6 border-t border-[#22242a] scroll-mt-20">
        <div className="text-center mb-10 space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-[#9da3ae]">Answers for founders and growth operators.</p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-[#262830] bg-[#141519] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-medium text-white hover:text-[#0d99ff] transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#6b7280] transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#9da3ae] leading-relaxed border-t border-[#22242a]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-[#22242a] bg-[#0a0a0c] text-xs text-[#6b7280]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#9da3ae]">
            <Bot size={16} className="text-white" />
            <span className="font-semibold text-white">Markopilot</span>
            <span>The Autonomous Growth Co-Worker</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <span>Nairobi and Global</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
