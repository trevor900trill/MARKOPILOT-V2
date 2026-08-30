"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Check,
  ArrowRight,
  Share2,
  Users,
  Send,
  Rocket,
  Sparkles,
  Zap,
  ShieldCheck,
  MessageSquare,
  Briefcase,
  Camera,
  Video,
  Mail,
  Bot,
  Globe,
  Search,
  Sparkle,
  TrendingUp,
  SlidersHorizontal,
  Ban,
  ChevronDown,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  ExternalLink,
  Layers,
  Flame,
  Target
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { XIcon, LinkedInIcon, InstagramIcon, TikTokIcon } from "@/components/icons/SocialIcons";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Running Itself.";

  // Interactive state for FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Typewriter effect logic
    let typeInterval: NodeJS.Timeout;
    const startDelay = setTimeout(() => {
      let i = 0;
      typeInterval = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, 80);
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(startDelay);
      if (typeInterval) clearInterval(typeInterval);
    };
  }, []);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const GoogleLogo = () => (
    <svg className="w-5 h-5 bg-white rounded-full p-[2px] shadow-sm flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const NavLink = ({
    href,
    className,
    children,
    isPrimary = false,
    isAuth = false
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    isPrimary?: boolean;
    isAuth?: boolean;
  }) => {
    if (isAuth) {
      return (
        <button onClick={handleSignIn} className={`cursor-pointer flex items-center justify-center gap-2 ${className}`}>
          {isPrimary && <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>}
          <GoogleLogo />
          {children}
        </button>
      );
    }

    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  };

  const faqs = [
    {
      q: "Do I have to approve every post, or can it run 100% on autopilot?",
      a: "You have complete control. Markopilot features a built-in 'Review Mode'. If enabled, every AI-drafted post, image, video, and cold email lands in your morning approval queue where you can approve, tweak, or reject it in seconds. Once you're confident in your brand voice settings, you can flip the switch to 100% Autonomous Mode."
    },
    {
      q: "How does active social posting help my AI Search (GEO) ranking?",
      a: "Modern AI search engines like ChatGPT Search, Perplexity, Claude, and Google AI Overviews don't rely solely on static websites. They continuously scrape and cross-reference real-time social conversations on X, LinkedIn, and TikTok. An active omni-channel footprint provides the entity verification and citations required for AI engines to recommend your brand."
    },
    {
      q: "How are the images and videos generated?",
      a: "For Instagram and social visuals, Markopilot connects directly to Replicate to generate photorealistic and aesthetic imagery using Flux 1.1 Pro. For TikTok and short-form video, Markopilot uses Creatomate to assemble high-retention video footage, animated typography, and dynamic pacing aligned with current social trends."
    },
    {
      q: "I'm a solo indie developer. How much time will this really save me?",
      a: "Solo founders typically spend 15 to 20 hours a week brainstorming content, editing images, writing threads, and cold emailing. With Markopilot, you simply input your product URL or drop your release notes once. Markopilot handles generation, scheduling, and lead qualification, reducing your weekly marketing workload to less than 15 minutes of review time."
    },
    {
      q: "Can I connect my own custom email accounts for cold outreach?",
      a: "Yes! You can connect custom Gmail or custom SMTP accounts. Markopilot includes smart deliverability governors, automated rate limits, and deduplication heuristics to safeguard your sender reputation while reaching qualified leads."
    },
    {
      q: "Is the lead discovery and email outreach process compliant?",
      a: "Markopilot is designed specifically for B2B outreach to public professional contacts. It uses public business sources, verifies and deduplicates contacts, respects suppression lists, includes clear sender identity and one-click unsubscribe handling, and gives you Review Mode before outreach is sent."
    },
    {
      q: "How does the autonomous cadence work without a complicated calendar?",
      a: "Markopilot automatically optimizes dispatch times for your audience's global peak engagement windows. Instead of requiring you to configure calendar slots and alarms manually, background workers handle the pacing seamlessly while keeping your social feeds active and your outbound queue moving."
    }
  ];

  return (
    <div className="min-h-screen bg-[#07070a] text-white selection:bg-[var(--accent-primary)] selection:text-white relative pb-12 overflow-hidden">

      {/* Inline Styles for Keyframe Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        @keyframes fadeUpIn {
          0% { opacity: 0; transform: translateY(32px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />

      {/* Interactive Cursor Glow */}
      {mounted && mousePos.x !== 0 && (
        <div
          className="fixed z-0 pointer-events-none rounded-full blur-[120px] opacity-25 transition-opacity duration-300"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
            transform: `translate(${mousePos.x - 250}px, ${mousePos.y - 250}px)`,
          }}
        />
      )}

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(124,110,255,0.12),transparent_70%)]" />
        <div className="absolute top-[1000px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.07),transparent_70%)]" />
        <div className="absolute bottom-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_at_bottom,rgba(124,110,255,0.08),transparent_70%)]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#07070a]/70 backdrop-blur-2xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-400 flex items-center justify-center text-black shadow-lg">
              <Rocket size={18} />
            </div>
            <span className="text-xl font-serif tracking-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Markopilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white hover:-translate-y-0.5 transition-all">Features</Link>
            <Link href="#how-it-works" className="hover:text-white hover:-translate-y-0.5 transition-all">How It Works</Link>
            <Link href="#compliance" className="hover:text-white hover:-translate-y-0.5 transition-all">Compliance</Link>
            <Link href="#pricing" className="hover:text-white hover:-translate-y-0.5 transition-all">Pricing</Link>
            <Link href="#faq" className="hover:text-white hover:-translate-y-0.5 transition-all">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <NavLink href="#" isAuth={true} className="relative group px-5 py-2.5 rounded-full overflow-hidden inline-flex items-center justify-center font-medium bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all text-white text-sm tracking-wide shadow-sm">
              <span>Sign In</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 min-h-[85vh] flex flex-col items-center justify-center pt-28 pb-16 overflow-visible">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-7 relative z-20">

          {/* Headline with Typewriter */}
          <h1 className="font-serif text-[clamp(42px,6.5vw,88px)] leading-[1.08] tracking-tight text-white font-normal">
            Your Entire Growth Engine, <br />
            <span className="relative inline-block mt-1">
              {/* Ghost text to maintain stable layout */}
              <span className="opacity-0 tracking-tight select-none pointer-events-none pb-2 inline-block">
                {fullText}
              </span>

              {/* Typed Text Overlay */}
              <span className="absolute inset-0 text-left whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-200 pb-2 inline-block">
                {typedText}
                <span
                  className={`inline-block w-[3px] h-[0.75em] bg-[var(--accent-primary)] ml-1 md:ml-2 align-baseline transition-opacity ${
                    typedText.length === fullText.length ? "animate-pulse" : ""
                  } ${typedText.length === 0 ? "opacity-0" : "opacity-100"}`}
                ></span>
              </span>
            </span>
          </h1>

          {/* Clear Subtitle */}
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-sans font-light leading-relaxed">
            Markopilot writes and publishes high-converting posts across <strong className="text-white font-medium">X, LinkedIn, Instagram, and TikTok</strong>, extracts verified B2B leads, and makes AI search engines recommend your brand 24/7.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <NavLink href="#" isAuth={true} isPrimary className="group relative w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Start 7-Day Free Trial <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
            <Link href="#features" className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 border border-white/10 text-gray-200 font-medium text-sm hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md">
              See How It Works
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-2 text-xs text-gray-400 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5 text-gray-300"><CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> No credit card required</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-gray-300"><CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> 2-minute setup</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-gray-300"><CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> Review Mode or Autopilot</span>
          </div>
        </div>

        {/* 3 High-Impact Pillars */}
        <div className="mt-16 w-full max-w-6xl mx-auto px-6 relative z-10 opacity-0 animate-[fadeUpIn_1.5s_cubic-bezier(0.16,1,0.3,1)_700ms_forwards]">
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-red-500/[0.06] border border-red-400/20 p-6 text-left space-y-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 flex items-center justify-center">
                <Flame size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-red-300 mb-2">The Problem</p>
                <h2 className="text-xl font-serif text-white">Founders stop marketing when product building gets intense.</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Writing threads, rendering videos, and sending outreach takes 20 hours a week. When code takes over, your distribution dies.
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 text-left space-y-4 shadow-[0_0_60px_rgba(124,110,255,0.16)]">
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-purple-200 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-purple-300 mb-2">What Markopilot Does</p>
                <h2 className="text-xl font-serif text-white">Turns your product updates into daily autonomous growth.</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Connect your URL once. Markopilot automatically writes cross-channel posts, produces visuals, discovers B2B leads, and runs outreach.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-400/20 p-6 text-left space-y-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-emerald-300 mb-2">The Outcome</p>
                <h2 className="text-xl font-serif text-white">Stay visible, cited by AI search, and consistently inbound.</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your brand builds compounding authority across Google, ChatGPT, and Perplexity while you stay 100% focused on your product.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Integrations Bar */}
      <section className="py-10 border-y border-white/5 bg-black/40 backdrop-blur-md relative z-10 my-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center text-xs uppercase tracking-widest text-gray-400 font-bold">
          Autonomous multi-modal pipelines powered by best-in-class engines
        </div>
        <div className="flex max-w-full relative opacity-60 hover:opacity-100 transition-opacity duration-500 overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <div className="flex w-max animate-scroll pointer-events-none">
            <div className="flex gap-20 items-center px-10 text-xl font-medium tracking-wide whitespace-nowrap">
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><XIcon size={24} /> Twitter (X)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><LinkedInIcon size={24} /> LinkedIn</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><InstagramIcon size={24} /> Instagram</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><TikTokIcon size={24} /> TikTok</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Mail size={26} /> Gmail & SMTP</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Sparkles size={26} /> Flux 1.1 Pro 4K</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Video size={26} /> Creatomate Video API</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={26} /> OpenRouter Multi-LLM</div>
            </div>
            {/* Duplicated for infinite loop */}
            <div className="flex gap-20 items-center px-10 text-xl font-medium tracking-wide whitespace-nowrap">
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><XIcon size={24} /> Twitter (X)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><LinkedInIcon size={24} /> LinkedIn</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><InstagramIcon size={24} /> Instagram</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><TikTokIcon size={24} /> TikTok</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Mail size={26} /> Gmail & SMTP</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Sparkles size={26} /> Flux 1.1 Pro 4K</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Video size={26} /> Creatomate Video API</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={26} /> OpenRouter Multi-LLM</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ALTERNATING FEATURE FLOW SECTION (Clean, Simple, Readable, Visual Flow)  */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 relative z-10 scroll-mt-20 space-y-28">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono uppercase tracking-wider">
            <Zap size={14} /> Core Capabilities
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            How Markopilot Powers Your Brand
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Everything your product needs to stay visible, attract customers, and rank on modern AI engines—simplified into an autonomous system.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 1: Multi-Channel Social (Text Left, Image/Visual Right)  */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
              <Share2 size={13} /> 01 • Multi-Channel Social Publishing
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Publish native, high-converting posts across 4 major networks.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              Stop spending hours rewriting the same update for different apps. Markopilot takes your product announcements, devlogs, or website content and creates custom formats for each platform.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Algorithm-Optimized Formats</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Viral threads on X, insightful B2B essays on LinkedIn, 4K visual carousels on Instagram, and vertical videos on TikTok.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Flux 1.1 Pro Images &amp; Creatomate Videos</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Generates high-resolution 4K imagery and short-form video clips automatically with zero design skill required.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Peak Engagement Dispatch</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Dispatches content during peak algorithmic traffic windows to ensure maximum organic reach.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-b from-[#121218] to-[#0a0a0e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Multi-Channel Pipeline
                </span>
                <span className="text-[11px] font-mono bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full">
                  4 Channels Active
                </span>
              </div>

              {/* 4 Channel Rows */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white border border-white/10">
                      <XIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Twitter / X</div>
                      <div className="text-[11px] text-gray-400">Viral launch threads &amp; devlog insights</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Auto-Formatted</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center text-[#0A66C2] border border-[#0A66C2]/30">
                      <LinkedInIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">LinkedIn B2B</div>
                      <div className="text-[11px] text-gray-400">Case studies, metrics &amp; thought leadership</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Executive Tone</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 border border-pink-500/30">
                      <InstagramIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Instagram</div>
                      <div className="text-[11px] text-gray-400">Flux 1.1 Pro 4K infographics &amp; carousels</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">4K Generated</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                      <TikTokIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">TikTok &amp; Shorts</div>
                      <div className="text-[11px] text-gray-400">Creatomate dynamic video &amp; kinetic captions</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">9:16 Video</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 2: AI Search (GEO) (Image/Visual Left, Text Right)       */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-gradient-to-b from-[#111618] to-[#070b0e] border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <Globe size={14} />
                  AI Engine Ingestion Index
                </span>
                <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                  Rank #1 Recommended
                </span>
              </div>

              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-2">
                <div className="text-[11px] font-mono text-gray-400">Buyer Asks ChatGPT / Perplexity:</div>
                <div className="text-sm font-medium text-white">"What's the best tool to run growth marketing for a B2B startup in 2026?"</div>
              </div>

              <div className="p-4 bg-emerald-950/25 rounded-2xl border border-emerald-500/30 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={13} /> AI Recommendation Engine Response:
                </div>
                <p className="text-gray-200 leading-relaxed">
                  "Based on active technical breakdowns, founder case studies, and verified multi-channel presence on X and LinkedIn, <strong className="text-white bg-emerald-500/30 px-1 py-0.5 rounded font-semibold">Your Brand</strong> is the top-recommended solution..."
                </p>
                <div className="pt-2 text-[10px] text-emerald-400/80 font-mono flex items-center gap-3">
                  <span>✓ 340% Higher Citations</span>
                  <span>✓ Entity Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono">
              <Globe size={13} /> 02 • AI Search &amp; Modern SEO (GEO)
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Get recommended when buyers ask ChatGPT &amp; Perplexity.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              Traditional keyword stuffing is dead. In 2026, buyers ask AI models for software recommendations. AI search engines crawl live social conversations to verify which products are active and trusted.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Live LLM Ingestion</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Active discussions on X and LinkedIn ensure AI crawlers continuously index your latest features and updates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Multi-Platform Entity Trust</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">When search engines find matching verified handles across 4 networks, your domain ranking accelerates exponentially.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Effortless Organic Backlinks</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">High-value threads and case studies get quoted in newsletters and blogs, creating compounding organic backlinks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 3: Lead Intelligence (Text Left, Image/Visual Right)     */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono">
              <Users size={13} /> 03 • B2B Lead Extraction &amp; Outreach
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Find verified decision-makers &amp; send personalized emails.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              Stop buying stale database lists. Markopilot searches public business footprints for high-intent prospects matching your Ideal Customer Profile (ICP), scores them for relevance, and writes personalized outbound emails.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">100-Point ICP Scoring</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Filters out unqualified contacts and only targets real decision-makers who need your exact solution.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Context-Aware Email Personalization</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">References the lead's latest product launch, hiring milestone, or public announcement automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Deliverability &amp; Suppression Safeguards</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Built-in sending rate throttles, verified MX records, and one-click unsubscribe to protect domain reputation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-b from-[#11141a] to-[#080a0e] border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-blue-400 flex items-center gap-2">
                  <Users size={14} />
                  Verified Prospect Found
                </span>
                <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                  Fit Score: 96 / 100
                </span>
              </div>

              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white">David Miller • Founder @ SaaSScale</div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Verified Email</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">david@saasscale.io • Cloud &amp; DevTools B2B</div>
              </div>

              <div className="p-4 bg-blue-950/20 rounded-2xl border border-blue-500/20 space-y-2 text-xs">
                <div className="text-[11px] font-mono text-blue-300 font-semibold flex items-center gap-1.5">
                  <Mail size={13} /> Auto-Drafted Outreach (Review Ready):
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  "Hi David — noticed SaaSScale just launched your new API tier last week. Most developer platforms struggle to maintain continuous multi-channel presence without hiring an agency..."
                </p>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition shadow">
                    Approve &amp; Send
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 transition">
                    Edit Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 4: Automated Cadence (Image/Visual Left, Text Right)      */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-gradient-to-b from-[#13111a] to-[#09080d] border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-purple-300 flex items-center gap-2">
                  <Clock size={14} />
                  Continuous Growth Cadence
                </span>
                <span className="text-[11px] font-mono bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full">
                  Hands-Free
                </span>
              </div>

              {/* 3 Cadence Flow Steps */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                      <Share2 size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Daily Social Broadcast</div>
                      <div className="text-[10px] text-gray-400">Dispatches at morning peak across X &amp; LinkedIn</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Scheduled</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                      <Users size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">B2B Lead Discovery Sweep</div>
                      <div className="text-[10px] text-gray-400">Autonomous crawl extracts 20 verified decision-makers</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400">Sweeping</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                      <Send size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Cold Outbound Throttling</div>
                      <div className="text-[10px] text-gray-400">Personalized emails delivered safely with smart pacing</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">15/hr Cap</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
              <Clock size={13} /> 04 • Autonomous Cadence &amp; Scheduling
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              One steady growth cadence. Zero calendar headaches.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              Forget complicated calendar grids, spreadsheets, and reminder alarms. Markopilot orchestrates your growth engine continuously in the background so you never have to remember to post or follow up.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Hands-Free Automation</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Background workers keep your social presence active and your outbound pipeline full without manual intervention.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Synchronized Touchpoints</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Social proof is timed so that when cold emails land in inboxes, prospects already recognize your brand from recent online chatter.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Timezone Intelligence</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Calculates audience timezones automatically to deliver content when your buyers are actually browsing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 5: Review Mode or Autopilot (Text Left, Visual Right)    */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-mono">
              <SlidersHorizontal size={13} /> 05 • Full Control or Autopilot
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Review everything in 60 seconds, or let it run hands-free.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              You never have to worry about AI hallucinating or posting off-brand content. Use Review Mode for simple 1-click approvals, or flip the switch to 100% Autonomous Mode when you're confident.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">1-Click Morning Approvals</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Quickly approve or tweak scheduled posts and cold emails in a clean, unified morning queue.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Autonomous Autopilot Switch</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Toggle between human-in-the-loop review and hands-free automated dispatch whenever you choose.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Consistent Brand Voice</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Every piece of copy aligns strictly with your product tone guidelines and target persona.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-b from-[#151412] to-[#0a0908] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-yellow-300 flex items-center gap-2">
                  <SlidersHorizontal size={14} />
                  Mode Selector
                </span>
                <span className="text-[11px] font-mono bg-yellow-500/20 text-yellow-300 px-2.5 py-0.5 rounded-full">
                  1-Click Switch
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Review Mode (Human-in-the-Loop)</div>
                    <div className="text-[11px] text-gray-400">Inspect drafts before anything goes live</div>
                  </div>
                  <div className="w-10 h-6 bg-emerald-500 rounded-full p-0.5 flex items-center justify-end">
                    <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Autonomous Mode (Autopilot)</div>
                    <div className="text-[11px] text-gray-400">AI drafts, verifies, and posts automatically</div>
                  </div>
                  <div className="w-10 h-6 bg-white/20 rounded-full p-0.5 flex items-center">
                    <div className="w-5 h-5 bg-gray-400 rounded-full shadow-md"></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-950/20 border border-yellow-500/20 rounded-xl text-xs text-yellow-200">
                ⚡ Result: You stay 100% in charge of your brand voice with zero manual friction.
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION: The Old Way vs The Markopilot Way                                */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-mono uppercase tracking-wider">
            <BarChart3 size={14} /> The ROI Breakdown
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            How Markopilot saves you 20 hours every week.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Compare manual context switching against autonomous growth infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* The Old Way */}
          <div className="bg-red-950/10 border border-red-500/20 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-red-300 flex items-center gap-2">
                <XCircle size={20} className="text-red-400" /> The Fragmented Old Way
              </h3>
              <span className="text-xs font-mono text-red-400 bg-red-500/20 px-2.5 py-1 rounded-full">18-22 hrs/week</span>
            </div>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Logging into 5 separate social and outreach platforms every morning.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Paying $500+/mo across separate schedulers, image editors, video tools, and lead databases.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Invisible on modern AI search (Perplexity, ChatGPT) because social citations are stale.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Founder marketing burnout: marketing stops whenever coding sprints begin.</span>
              </li>
            </ul>
          </div>

          {/* The Markopilot Way */}
          <div className="bg-emerald-950/15 border border-emerald-500/30 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative">
            <div className="absolute -top-3 right-6 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
              The Modern Standard
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" /> The Markopilot System
              </h3>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full">15 mins/week</span>
            </div>
            <ul className="space-y-4 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>One single cockpit: X, LinkedIn, Instagram, TikTok, and Cold Email synchronized.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Flux 1.1 Pro images &amp; Creatomate TikTok video rendering included natively.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Generative Engine Optimization (GEO) turns social presence into top AI search citations.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Review Mode gives you 100% control with 1-click approvals, or full autonomous autopilot.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: 3-Step Setup (How It Works)                                      */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono uppercase tracking-wider">
            <Zap size={14} /> 3-Step Setup
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            From zero to autonomous growth in 2 minutes.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            No complex setup scripts or lengthy onboarding.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-lg border border-purple-500/30 group-hover:scale-110 transition">
              01
            </div>
            <h3 className="text-xl font-semibold text-white">Connect Your Brand</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enter your website URL or drop your product description. Markopilot scans your value propositions and builds a persistent brand knowledge base.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-lg border border-blue-500/30 group-hover:scale-110 transition">
              02
            </div>
            <h3 className="text-xl font-semibold text-white">Engines Activate</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Our multi-modal engines formulate X threads, render Flux Instagram graphics, assemble Creatomate TikTok videos, and discover scored ICP leads automatically.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-lg border border-emerald-500/30 group-hover:scale-110 transition">
              03
            </div>
            <h3 className="text-xl font-semibold text-white">Review or Fly Autopilot</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Use the Review Queue to approve posts with a single click, or let Markopilot run 100% autonomously while your AI search ranking and inbound traffic compound.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Pricing                                                          */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-28 relative z-10 border-t border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono uppercase tracking-wider">
              <ShieldCheck size={14} className="text-emerald-400" /> Transparent Plans
            </div>
            <h2 className="font-serif text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg">
              Simple, transparent pricing.
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto">
              All plans include a 7-day free trial. Instant activation via Safaricom M-PESA STK Push &amp; Business Till.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {PLANS.map((plan) => {
              const isFeatured = plan.featured;
              const descriptions: Record<string, string> = {
                starter: "Perfect for solo builders establishing baseline social & AI search footprint.",
                growth: "Unlocks high-throughput multi-modal orchestration for scaling products.",
                scale: "Designed for agencies & multi-product brand portfolios.",
              };
              return (
                <div
                  key={plan.id}
                  suppressHydrationWarning
                  className={isFeatured
                    ? "group bg-gradient-to-b from-[var(--bg-elevated)] to-[#07070a] border border-[var(--accent-primary)]/70 rounded-[32px] p-8 md:p-10 flex flex-col relative shadow-[0_0_50px_rgba(168,85,247,0.25)] ring-2 ring-[var(--accent-primary)]/30 lg:scale-105 z-10 h-full backdrop-blur-2xl transition-all duration-500"
                    : "bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors rounded-[32px] p-8 md:p-10 flex flex-col h-full hover:-translate-y-1 duration-500"
                  }
                >
                  {isFeatured && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                      <div className="absolute -top-4 inset-x-0 flex justify-center">
                        <span className="bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
                          <ShieldCheck size={14} /> Most Popular
                        </span>
                      </div>
                    </>
                  )}
                  <h3 className={`text-xl font-medium text-white mb-2 ${isFeatured ? 'pb-1 relative z-10' : ''}`}>{plan.name}</h3>
                  <p className={`text-sm mb-6 ${isFeatured ? 'text-gray-300 relative z-10' : 'text-gray-400'}`}>{descriptions[plan.id] || ''}</p>
                  <div suppressHydrationWarning className={`font-serif text-white mb-8 ${isFeatured ? 'text-5xl md:text-6xl relative z-10 drop-shadow-md' : 'text-4xl md:text-5xl'}`}>
                    {plan.price}<span className={`text-lg font-sans font-light ${isFeatured ? 'text-gray-300' : 'text-gray-500'}`}>/mo</span>
                  </div>
                  <ul className={`space-y-4 mb-10 flex-1 ${isFeatured ? 'relative z-10' : ''}`}>
                    <li className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-white font-medium' : 'text-gray-300 font-light'}`}>
                      <Check size={18} className="text-emerald-400 flex-shrink-0" /> {plan.brands}
                    </li>
                    <li className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-white font-medium' : 'text-gray-300 font-light'}`}>
                      <Check size={18} className="text-emerald-400 flex-shrink-0" /> {plan.posts} / month
                    </li>
                    <li className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-white font-medium' : 'text-gray-300 font-light'}`}>
                      <Check size={18} className="text-emerald-400 flex-shrink-0" /> {plan.leads} / month
                    </li>
                    <li className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-white font-medium' : 'text-gray-300 font-light'}`}>
                      <Check size={18} className="text-emerald-400 flex-shrink-0" /> X, LinkedIn, IG, TikTok & Email
                    </li>
                    <li className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-white font-medium' : 'text-gray-300 font-light'}`}>
                      <Check size={18} className="text-emerald-400 flex-shrink-0" /> AI Search (GEO) Optimization
                    </li>
                  </ul>
                  <NavLink
                    href="#"
                    isAuth={true}
                    className={isFeatured
                      ? "w-full block text-center py-4 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:opacity-95 hover:scale-[1.02] transition-all shadow-lg active:scale-95 relative z-10"
                      : "w-full block text-center py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all active:scale-95"
                    }
                  >
                    Start 7-Day Free Trial
                  </NavLink>
                </div>
              );
            })}
          </div>

          {/* International Waitlist Callout */}
          <div className="mt-12 text-center text-xs text-gray-400">
            <span>Outside M-PESA supported regions? </span>
            <Link href="/coming-soon-country" className="text-emerald-400 hover:text-emerald-300 font-medium underline inline-flex items-center gap-1">
              Join our International Priority Waitlist <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Compliance, Privacy & Data Sourcing                              */}
      {/* ========================================================================= */}
      <section id="compliance" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <ShieldCheck size={14} /> Trust &amp; Compliance Architecture
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            B2B outreach without becoming a spam machine.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Markopilot discovers public business contacts, verifies fit, writes context-aware emails, and enforces opt-out and sender-identity rules before anything leaves your inbox.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
          <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center">
                <Search size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-blue-300">How discovery works</p>
                <h3 className="text-2xl font-serif text-white">Public, professional, relevance-first.</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Markopilot searches public professional pages, company websites, public social profiles, and indexable business footprints. Built for B2B contacts, not consumer lists.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Every prospect is scored against your ICP before outreach. Low-fit contacts are filtered out automatically.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Emails are verified, deduplicated, and checked against suppression lists before messages are drafted.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-500/[0.05] border border-emerald-400/20 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-emerald-300">How sending stays controlled</p>
                <h3 className="text-2xl font-serif text-white">Reviewable, identifiable, and opt-out safe.</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Review Mode lets you approve, edit, or reject every outbound email before it sends. Autopilot is available when you are ready.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Outbound messages include truthful subject lines, brand identity, address details, and 1-click unsubscribe handling.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Smart throttles and daily caps protect sender reputation and prevent aggressive sending spikes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Globe size={18} />
            </div>
            <h3 className="text-lg font-medium text-white">Public Sources Only</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No purchased mystery lists, consumer databases, or hidden broker dumps. The system works strictly from public B2B signals.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Ban size={18} />
            </div>
            <h3 className="text-lg font-medium text-white">Instant Suppression</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              One unsubscribe suppresses that contact globally, cancels pending follow-ups, and blocks future outreach.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
              <Mail size={18} />
            </div>
            <h3 className="text-lg font-medium text-white">Your Inbox, Your Identity</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Messages dispatch through connected Gmail or custom SMTP accounts with verified sender details for complete transparency.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: FAQ Accordion                                                    */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono uppercase tracking-wider">
            <Sparkles size={14} className="text-purple-400" /> Knowledge &amp; FAQ
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Everything you need to know about Markopilot's autonomous engine.
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
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-400' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm md:text-base text-gray-300 font-light leading-relaxed border-t border-white/5 pt-4 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-32 text-center px-6 relative z-10 overflow-hidden mt-10 border-t border-white/5 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,110,255,0.1),transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
            <Sparkle size={13} className="text-purple-400" /> Start shipping products without marketing burnout
          </div>
          <h2 className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-xl">
            Put your brand's growth on autopilot.
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-light max-w-xl">
            Join founders and indie builders saving 20 hours a week while ranking #1 across AI search engines.
          </p>
          <NavLink href="#" isAuth={true} isPrimary className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-semibold text-lg hover:scale-[1.04] transition-all shadow-[0_0_50px_rgba(255,255,255,0.25)] active:scale-95">
            Start Your 7-Day Free Trial <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#07070a] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
            {/* Brand column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-sm">
                  <Rocket size={16} />
                </div>
                <span className="text-xl font-serif tracking-tight font-medium text-white">Markopilot</span>
              </div>
              <p className="text-gray-400 text-sm max-w-sm font-light leading-relaxed">
                Autonomous marketing &amp; B2B lead intelligence. Publish across 4 networks, enrich verified leads, and rank on AI search engines hands-free.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Autonomous Engine Active</span>
              </div>
            </div>

            {/* Links column: Product */}
            <div className="md:col-span-4 md:col-start-7 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-300 font-semibold font-mono">Product &amp; Solutions</div>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Core Capabilities</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#compliance" className="hover:text-white transition-colors">Compliance &amp; Trust</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Plans &amp; Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Links column: Legal & Contact */}
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-300 font-semibold font-mono">Company &amp; Legal</div>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                <li><a href="mailto:hello@markopilot.com" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-sans">
            <p>© {new Date().getFullYear()} Markopilot Ltd. Registered address: Mirage Tower, Chiromo Rd, Nairobi, Kenya.</p>
            <p className="text-gray-400">Engineered for fast-moving founders &amp; indie builders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
