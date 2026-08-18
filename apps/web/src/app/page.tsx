"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Check,
  Menu,
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
  Database,
  Wand2,
  Film,
  Eye,
  Code,
  Globe,
  Search,
  Sparkle,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle,
  ChevronDown,
  Clock,
  Terminal,
  ExternalLink,
  Target,
  Flame,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  Calendar,
  CalendarDays,
  SlidersHorizontal
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { XIcon, LinkedInIcon, InstagramIcon, TikTokIcon } from "@/components/icons/SocialIcons";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Running Itself.";

  // Interactive state for Persona Switcher
  const [activePersona, setActivePersona] = useState<"dev" | "founder" | "brand">("dev");

  // Interactive state for Platform Deep Dive
  const [activePlatform, setActivePlatform] = useState<"twitter" | "linkedin" | "instagram" | "tiktok" | "outreach">("twitter");

  // Interactive state for FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive state for GEO AI Engine Demo
  const [geoTab, setGeoTab] = useState<"with-marko" | "without-marko">("with-marko");

  // Interactive state for Calendar Engine Demo
  const [calendarFilter, setCalendarFilter] = useState<"all" | "social" | "leads" | "outreach">("all");
  const [calendarView, setCalendarView] = useState<"week" | "timeline">("week");
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<string>("cal-3");

  const calendarEvents = [
    {
      id: "cal-1",
      dayName: "Mon",
      dateStr: "Aug 18",
      type: "social" as const,
      platform: "twitter" as const,
      time: "09:30 AM UTC",
      title: "Why we rebuilt our backend pipeline from scratch in .NET 9",
      snippet: "Architecture breakdown of our high-throughput worker queues handling 50k+ background events...",
      status: "Published",
      statusColor: "emerald",
      badge: "Viral Thread",
      mediaType: "Thread Graph",
      aiHook: "High-retention technical devlog hook calibrated for indie hackers and engineering leaders.",
      metrics: "4.2k views • 89 bookmarks"
    },
    {
      id: "cal-2",
      dayName: "Mon",
      dateStr: "Aug 18",
      type: "leads" as const,
      platform: "lead" as const,
      time: "02:00 PM UTC",
      title: "AI Lead Discovery Sweep #14",
      snippet: "Autonomous search across verified B2B directories & social signals. 18 qualified founders scored 90+.",
      status: "Completed",
      statusColor: "blue",
      badge: "Autonomous Run",
      mediaType: "Lead Intelligence",
      aiHook: "Filtered for B2B founders with recent funding or public feature releases in the last 14 days.",
      metrics: "18 Leads Verified"
    },
    {
      id: "cal-3",
      dayName: "Tue",
      dateStr: "Aug 19",
      type: "social" as const,
      platform: "linkedin" as const,
      time: "11:00 AM UTC",
      title: "The secret to 99.4% AI Search authority in 2026",
      snippet: "Why modern AI search engines cite active social conversation graphs over stale keyword landing pages...",
      status: "Published",
      statusColor: "emerald",
      badge: "GEO Authority",
      mediaType: "Infographic",
      aiHook: "Data-backed breakdown of ChatGPT Search & Perplexity ranking signals.",
      metrics: "1.8k impressions • 34 reposts"
    },
    {
      id: "cal-4",
      dayName: "Tue",
      dateStr: "Aug 19",
      type: "outreach" as const,
      platform: "outreach" as const,
      time: "03:15 PM UTC",
      title: "Cold Sequence Wave: 'GEO & Omnichannel Scaling'",
      snippet: "Personalized cold emails dispatched with smart throttle & 100-point reputation safeguard.",
      status: "Dispatched",
      statusColor: "emerald",
      badge: "Smart Throttle",
      mediaType: "Email Cadence",
      aiHook: "Customized intro referencing prospect's latest product announcement automatically.",
      metrics: "15 Sent • 64% Open Rate"
    },
    {
      id: "cal-5",
      dayName: "Wed (Today)",
      dateStr: "Aug 20",
      type: "social" as const,
      platform: "instagram" as const,
      time: "01:00 PM UTC",
      title: "Architecting Autonomous Background Workers",
      snippet: "Photorealistic Flux 1.1 Pro visual showing futuristic server room telemetry & growth analytics...",
      status: "Scheduled",
      statusColor: "purple",
      badge: "Flux 1.1 Pro 4K",
      mediaType: "Flux Pro 4K Visual",
      aiHook: "Visual aesthetic optimized for Instagram carousel engagement and high-contrast dark theme.",
      metrics: "Dispatches in 2h 15m"
    },
    {
      id: "cal-6",
      dayName: "Wed (Today)",
      dateStr: "Aug 20",
      type: "leads" as const,
      platform: "lead" as const,
      time: "04:30 PM UTC",
      title: "Scheduled Lead Qualification Run #15",
      snippet: "Autonomous worker scheduled to crawl seed queries and score 20 new high-intent SaaS leads.",
      status: "Scheduled",
      statusColor: "purple",
      badge: "Lead Worker",
      mediaType: "Enrichment Sweep",
      aiHook: "Targeting seed keywords: 'growth engineering', 'founder in residence', 'indie SaaS'.",
      metrics: "Dispatches in 5h 45m"
    },
    {
      id: "cal-7",
      dayName: "Thu",
      dateStr: "Aug 21",
      type: "social" as const,
      platform: "tiktok" as const,
      time: "10:15 AM UTC",
      title: "3 mistakes killing your AI search ranking",
      snippet: "Creatomate dynamic vertical video rendering with synchronized kinetic captions and upbeat audio...",
      status: "Queued",
      statusColor: "amber",
      badge: "Creatomate MP4",
      mediaType: "Creatomate 1080p MP4",
      aiHook: "Hook within first 1.2s: 'If your brand is invisible on Perplexity, here is the exact fix.'",
      metrics: "Review Queue Ready"
    },
    {
      id: "cal-8",
      dayName: "Thu",
      dateStr: "Aug 21",
      type: "outreach" as const,
      platform: "outreach" as const,
      time: "02:00 PM UTC",
      title: "Follow-Up Sequence Step 2 (Contextual Touchpoint)",
      snippet: "Automated objection handling sequence sent to leads who opened Wave #1 without replying.",
      status: "Projected",
      statusColor: "blue",
      badge: "Auto Follow-up",
      mediaType: "Smart Sequence",
      aiHook: "Gentle non-intrusive value bump with 1-click live demo link.",
      metrics: "Automated Cadence"
    },
    {
      id: "cal-9",
      dayName: "Fri",
      dateStr: "Aug 22",
      type: "social" as const,
      platform: "twitter" as const,
      time: "04:00 PM UTC",
      title: "Weekend Build Challenge: Shipping with Zero Marketing Headaches",
      snippet: "Inspirational founder story on automating all marketing pipelines while keeping heads down in code.",
      status: "Approved",
      statusColor: "emerald",
      badge: "Friday Peak Window",
      mediaType: "Thread & Poll",
      aiHook: "Interactive poll formatted to boost weekend algorithmic reach.",
      metrics: "Queued for Dispatch"
    }
  ];

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
      }, 80); // 80ms per character
    }, 1200); // 1.2s delay to wait for hero fade-in

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(startDelay);
      if (typeInterval) clearInterval(typeInterval);
    };
  }, []);

  // Use signIn() helper instead of direct links to avoid CSRF issues in production
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
      a: "You have complete control. Markopilot features a built-in 'Review Mode'. If enabled, every AI-drafted post, image, video, and cold email lands in your approval queue where you can approve, tweak, or reject it in seconds. Once you're confident in your brand voice settings, you can flip the switch to 100% Autonomous Mode."
    },
    {
      q: "How does active social posting help my AI Search (GEO) and modern SEO ranking?",
      a: "AI search engines like ChatGPT Search, Perplexity, Claude, and Google AI Overviews don't rely only on static websites. They constantly scrape and cross-reference real-time social conversations on X, LinkedIn, Reddit, and TikTok. An active omni-channel footprint provides continuous citations and entity verification, ensuring AI engines recommend your brand when users ask for recommendations in your niche."
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
      q: "How does the Autonomous Marketing Calendar schedule content and background workers?",
      a: "The Autonomous Marketing Calendar acts as the unified mission control for all your engines. It projects upcoming autonomous social posting, AI lead discovery sweeps, and cold email cadences across peak engagement windows. You can filter by channel, inspect AI reasoning for each post, make quick edits in Review Mode, or let the engine run hands-free."
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
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#solutions" className="hover:text-white hover:-translate-y-0.5 transition-all">Solutions</Link>
            <Link href="#ai-discovery" className="hover:text-white hover:-translate-y-0.5 transition-all">AI Search (GEO)</Link>
            <Link href="#channels" className="hover:text-white hover:-translate-y-0.5 transition-all">Channels</Link>
            <Link href="#calendar" className="hover:text-white hover:-translate-y-0.5 transition-all flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>Calendar</Link>
            <Link href="#how-it-works" className="hover:text-white hover:-translate-y-0.5 transition-all">How It Works</Link>
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
      <header className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-visible">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-20">

          {/* Animated Announcement Pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 tracking-wide mb-2 opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_100ms_forwards] backdrop-blur-md shadow-inner"
          >
            <Sparkles size={14} className="text-[var(--accent-primary)] animate-pulse" />
            <span className="text-gray-400">Markopilot 2.0:</span>
            <span className="text-white font-semibold">Autonomous Socials, Leads & AI Search (GEO)</span>
          </div>

          {/* Epic Animated Headline */}
          <h1
            className="font-serif text-[clamp(44px,7.5vw,104px)] leading-[1.06] tracking-tight opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_200ms_forwards]"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70 drop-shadow-xl inline-block">
              Your Entire Growth Engine, <br />
            </span>
            <span className="relative inline-block mt-1">
              {/* Ghost text to maintain stable width */}
              <span className="opacity-0 tracking-tight select-none pointer-events-none pb-4 inline-block">{fullText}</span>

              {/* Typed Text Overlay */}
              <span className="absolute inset-0 text-left whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-purple-300 to-white drop-shadow-[0_0_40px_rgba(168,85,247,0.45)] pb-4 inline-block">
                {typedText}
                <span className={`inline-block w-[3px] h-[0.7em] bg-[var(--accent-primary)] ml-1 md:ml-3 align-baseline transition-opacity ${typedText.length === fullText.length ? 'animate-pulse' : ''} ${typedText.length === 0 ? 'opacity-0' : 'opacity-100'}`}></span>
              </span>

              {/* Underline glow */}
              <div className="absolute top-[82%] left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-80 blur-[2px]"></div>
            </span>
          </h1>

          <p
            className="text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto font-sans font-light leading-relaxed opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_300ms_forwards]"
          >
            Stop wasting 20 hours a week juggling social apps. Markopilot autonomously drafts posts, renders Flux images & TikTok videos, mines qualified leads, and turns your brand into the <strong className="text-white font-normal">#1 recommendation across AI search engines</strong>.
          </p>

          {/* Quick Persona Hook Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_400ms_forwards]">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-medium mr-2">I am:</span>
            <button
              onClick={() => {
                setActivePersona("dev");
                document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition flex items-center gap-1.5"
            >
              <Code size={13} className="text-purple-400" /> A Solo Indie Dev
            </button>
            <button
              onClick={() => {
                setActivePersona("founder");
                document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition flex items-center gap-1.5"
            >
              <Clock size={13} className="text-blue-400" /> An Overwhelmed Founder
            </button>
            <button
              onClick={() => {
                setActivePersona("brand");
                document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition flex items-center gap-1.5"
            >
              <Search size={13} className="text-emerald-400" /> A Brand Building AI Discoverability
            </button>
          </div>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_500ms_forwards]"
          >
            <NavLink href="#" isAuth={true} isPrimary className="group relative w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:scale-105 transition-all flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.25)]">
              Start 14-Day Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </NavLink>
            <Link href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium text-base hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:-translate-y-0.5">
              Explore The Cockpit
            </Link>
          </div>

          <div className="pt-2 text-xs text-gray-400 flex items-center justify-center gap-4 font-mono">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> No credit card required</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> 2-minute setup</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Review Queue or Full Autopilot</span>
          </div>
        </div>

        {/* Dashboard Preview Presentation */}
        <div
          className="mt-16 w-full max-w-6xl mx-auto px-6 relative z-10 opacity-0 animate-[fadeUpIn_1.5s_cubic-bezier(0.16,1,0.3,1)_700ms_forwards]"
        >
          <div className="w-full aspect-[21/10] rounded-2xl bg-gradient-to-t from-[#111] to-[#1a1a23] border border-white/10 shadow-[0_0_120px_rgba(168,85,247,0.18)] flex flex-col overflow-hidden ring-1 ring-white/5 backdrop-blur-3xl relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-px w-full"></div>
            <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-black/40">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 cursor-pointer transition shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/80 hover:bg-yellow-500 cursor-pointer transition shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/80 hover:bg-green-500 cursor-pointer transition shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
              </div>
              <div className="text-xs text-white/40 font-mono tracking-widest bg-black/40 px-3 py-1 rounded w-72 text-center border border-white/5 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                markopilot.com/dashboard/pipeline
              </div>
              <div className="w-16"></div>
            </div>
            
            {/* Cockpit Simulation Visual */}
            <div className="relative flex-1 w-full h-full bg-[#0a0a0e] p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
              {/* Left Column: Live Generation Feed */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase text-gray-400 flex items-center gap-1.5"><Sparkles size={13} className="text-purple-400" /> Multi-Modal Dispatch</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Running</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2.5">
                      <MessageSquare size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white/90">X (Twitter) Thread</div>
                        <div className="text-gray-400 text-[11px] mt-0.5 truncate">"Why traditional SEO is dying and how GEO is taking over..."</div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2.5">
                      <Camera size={15} className="text-pink-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white/90">Instagram (Flux 1.1)</div>
                        <div className="text-gray-400 text-[11px] mt-0.5 truncate">Generated 4K cybernetic workspace asset</div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2.5">
                      <Video size={15} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white/90">TikTok (Creatomate MP4)</div>
                        <div className="text-gray-400 text-[11px] mt-0.5 truncate">34s Video render with animated captions</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 font-mono border-t border-white/5 pt-2 flex items-center justify-between">
                  <span>Engine: GPT-4o + Flux Pro</span>
                  <span className="text-emerald-400 font-medium">9 scheduled</span>
                </div>
              </div>

              {/* Middle Column: Review Queue Cockpit */}
              <div className="bg-white/[0.03] border border-[var(--accent-primary)]/30 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_30px_rgba(124,110,255,0.08)]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase text-white flex items-center gap-1.5"><Eye size={13} className="text-amber-400" /> Human Review Queue</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">3 Pending</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white flex items-center gap-1.5"><Briefcase size={13} className="text-blue-400" /> LinkedIn Authority Post</span>
                      <span className="text-[9px] text-gray-400">Drafted 4m ago</span>
                    </div>
                    <p className="text-[11px] text-gray-300 line-clamp-3 leading-relaxed">
                      "Building in public isn't just about sharing revenue numbers. It's about feeding the modern AI recommendation index with verifiable proof..."
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button className="flex-1 py-1 rounded bg-white text-black text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-200 transition"><Check size={12} /> Approve (1-Click)</button>
                      <button className="px-2 py-1 rounded bg-white/10 text-gray-300 text-[11px] hover:bg-white/20 transition">Edit</button>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 font-mono border-t border-white/5 pt-2 flex items-center justify-between">
                  <span>Review Mode: Active</span>
                  <span className="text-amber-400 font-medium">100% Control</span>
                </div>
              </div>

              {/* Right Column: Lead Radar & AI Ingestion */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase text-gray-400 flex items-center gap-1.5"><Search size={13} className="text-emerald-400" /> Lead Radar & SEO</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Scoring ICP</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white/90">Sarah Jenkins</div>
                        <div className="text-gray-400 text-[11px]">VP of Growth @ CloudScale</div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">98/100</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white/90">Alex Rivera</div>
                        <div className="text-gray-400 text-[11px]">Founder @ DevTools.io</div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">94/100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 flex items-center gap-2">
                      <Globe size={13} className="text-purple-400 flex-shrink-0" />
                      <span>AI Engine citation index refreshed</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 font-mono border-t border-white/5 pt-2 flex items-center justify-between">
                  <span>Cold Email Queue: 12 Drafts</span>
                  <span className="text-blue-400 font-medium">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Integrations Bar (Infinite Scrolling Ticker) */}
      <section className="py-10 border-y border-white/5 bg-black/40 backdrop-blur-md relative z-10 my-12 overflow-hidden">
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
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Wand2 size={26} /> Replicate (Flux 1.1 Pro)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Film size={26} /> Creatomate Video API</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={26} /> OpenRouter Multi-LLM</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Database size={26} /> Supabase</div>
            </div>
            {/* Duplicated for infinite looping */}
            <div className="flex gap-20 items-center px-10 text-xl font-medium tracking-wide whitespace-nowrap">
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><XIcon size={24} /> Twitter (X)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><LinkedInIcon size={24} /> LinkedIn</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><InstagramIcon size={24} /> Instagram</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><TikTokIcon size={24} /> TikTok</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Mail size={26} /> Gmail & SMTP</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Wand2 size={26} /> Replicate (Flux 1.1 Pro)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Film size={26} /> Creatomate Video API</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={26} /> OpenRouter Multi-LLM</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Database size={26} /> Supabase</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Choose Your Pain / Interactive Persona Switcher */}
      <section id="solutions" className="py-24 max-w-7xl mx-auto px-6 relative z-10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono uppercase tracking-wider">
            <Target size={14} /> Tailored Solutions
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Engineered for your exact growth bottleneck.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Select what best describes your situation to see how Markopilot transforms your daily workflow.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12 max-w-4xl mx-auto">
          <button
            onClick={() => setActivePersona("dev")}
            className={`px-6 py-3.5 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center gap-2.5 ${
              activePersona === "dev"
                ? "bg-[var(--accent-primary)] text-white shadow-[0_0_30px_rgba(124,110,255,0.4)] scale-105 border border-purple-400/40"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <Code size={18} />
            <span>I'm an Indie Dev & Solo Builder</span>
          </button>
          <button
            onClick={() => setActivePersona("founder")}
            className={`px-6 py-3.5 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center gap-2.5 ${
              activePersona === "founder"
                ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] scale-105 border border-blue-400/40"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <Clock size={18} />
            <span>I'm an Overwhelmed Founder</span>
          </button>
          <button
            onClick={() => setActivePersona("brand")}
            className={`px-6 py-3.5 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center gap-2.5 ${
              activePersona === "brand"
                ? "bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 border border-emerald-400/40"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <Search size={18} />
            <span>I Want AI Search & Modern SEO (GEO)</span>
          </button>
        </div>

        {/* Persona Details Card */}
        <div className="bg-gradient-to-b from-[#111116] to-[#0a0a0d] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-primary)]/10 blur-[120px] rounded-full pointer-events-none"></div>

          {activePersona === "dev" && (
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
                  <Terminal size={13} /> The Solo Developer Bottleneck
                </div>
                <h3 className="font-serif text-3xl md:text-4xl text-white">
                  "I want to build and ship code, not be a 24/7 social media manager."
                </h3>
                <p className="text-gray-300 leading-relaxed text-base md:text-lg font-light">
                  You spend 12 hours building an incredible product, and then dread the next phase: writing 10 promotional tweets, filming TikTok demos, formatting LinkedIn posts, and sending cold emails. 
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="text-white font-medium block">Zero Context Switching from Your IDE</strong>
                      <p className="text-gray-400 text-sm">Drop in your product URL or release notes once. Markopilot automatically extracts feature highlights, architectural innovations, and use cases to formulate high-converting launch threads and visuals.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="text-white font-medium block">Automatic Build-in-Public Presence</strong>
                      <p className="text-gray-400 text-sm">Consistent daily authority content across X and LinkedIn while you remain heads-down in your terminal.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <NavLink href="#" isAuth={true} isPrimary className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition shadow-lg">
                    Ship Products While AI Markets Them <ArrowRight size={16} />
                  </NavLink>
                </div>
              </div>

              {/* Dev Mock Visual */}
              <div className="lg:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-5 font-mono text-xs shadow-xl space-y-4">
                <div className="flex items-center justify-between text-gray-500 border-b border-white/5 pb-3">
                  <span className="flex items-center gap-2 text-purple-300"><Terminal size={14} /> devlog_pipeline.ts</span>
                  <span className="text-[10px] text-emerald-400">Autonomous</span>
                </div>
                <div className="text-gray-400 space-y-2">
                  <p><span className="text-purple-400">const</span> product = <span className="text-yellow-300">"https://my-saas.app"</span>;</p>
                  <p><span className="text-purple-400">const</span> update = <span className="text-yellow-300">"Shipped vector search + instant API"</span>;</p>
                </div>
                <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-lg text-purple-200 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkle size={12} /> Markopilot Auto-Synthesized:
                  </div>
                  <p className="text-xs text-gray-200">
                    "🚀 Most devs get vector search wrong. Here is how we indexed 100k embeddings in 2ms without breaking our database [Thread 🧵 1/6]"
                  </p>
                  <div className="text-[10px] text-gray-400 pt-1 flex items-center justify-between">
                    <span>Generated: X Thread + LinkedIn Post + Flux Art</span>
                    <span className="text-emerald-400 font-semibold">Ready to post</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePersona === "founder" && (
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono">
                  <Clock size={13} /> The Overwhelmed Founder Bottleneck
                </div>
                <h3 className="font-serif text-3xl md:text-4xl text-white">
                  "I hate having to log into 5 different social apps every day."
                </h3>
                <p className="text-gray-300 leading-relaxed text-base md:text-lg font-light">
                  Between running operations, talking to customers, and managing your team, logging into Twitter, LinkedIn, Instagram, TikTok, and your email client burns 3 hours every day with unbearable context switching.
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="text-white font-medium block">One Single Mission Control Cockpit</strong>
                      <p className="text-gray-400 text-sm">Review, approve, or reject multi-modal drafts for X, LinkedIn, Instagram, TikTok, and outbound email in a 60-second morning scan.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="text-white font-medium block">Cross-Platform Tone Harmonization</strong>
                      <p className="text-gray-400 text-sm">Markopilot automatically adapts content: witty & snappy on X, authoritative & analytical on LinkedIn, visually stunning on Instagram, dynamic & engaging on TikTok.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <NavLink href="#" isAuth={true} isPrimary className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition shadow-lg">
                    Eliminate App-Switching Fatigue <ArrowRight size={16} />
                  </NavLink>
                </div>
              </div>

              {/* Founder Multi-App Mock */}
              <div className="lg:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="text-xs font-mono text-gray-400 flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-blue-300 flex items-center gap-1.5"><Layers size={14} /> 5 Channels Synchronized</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">All-in-One</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><XIcon size={14} className="text-white" /> Twitter (X)</div>
                    <span className="text-[11px] text-emerald-400 font-mono">Autopilot (3/day)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><LinkedInIcon size={14} className="text-[#0A66C2]" /> LinkedIn B2B</div>
                    <span className="text-[11px] text-emerald-400 font-mono">Autopilot (1/day)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><InstagramIcon size={14} className="text-pink-400" /> Instagram</div>
                    <span className="text-[11px] text-purple-300 font-mono">Flux 1.1 Pro AI</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><TikTokIcon size={14} className="text-cyan-400" /> TikTok</div>
                    <span className="text-[11px] text-cyan-300 font-mono">Creatomate Render</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><Mail size={14} className="text-emerald-400" /> Cold Outreach</div>
                    <span className="text-[11px] text-amber-300 font-mono">Review Mode (14 drafts)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePersona === "brand" && (
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                  <Search size={13} /> The 2026 AI Search (GEO) Shift
                </div>
                <h3 className="font-serif text-3xl md:text-4xl text-white">
                  "I have a brand, but I didn't think social engagement was that important."
                </h3>
                <p className="text-gray-300 leading-relaxed text-base md:text-lg font-light">
                  In 2026, buyers don't just type into Google — they ask <strong className="text-white font-normal">ChatGPT, Perplexity, Claude, and Gemini</strong>. When an AI search engine evaluates which product to recommend, it scours live social graphs. If your brand is silent on social, AI engines literally do not recommend you.
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="text-white font-medium block">Generative Engine Optimization (GEO)</strong>
                      <p className="text-gray-400 text-sm">Every high-authority X thread, LinkedIn post, and community citation is ingested by LLM crawlers, indexing your product as the authoritative solution in your category.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                      <Check size={14} />
                    </div>
                    <div>
                      <strong className="text-white font-medium block">Entity Verification & Organic Backlinks</strong>
                      <p className="text-gray-400 text-sm">Active social signals compound your traditional SEO authority, giving Google and Perplexity the trust signals required for page-one rankings.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <NavLink href="#" isAuth={true} isPrimary className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition shadow-lg">
                    Claim Your AI Search Ranking <ArrowRight size={16} />
                  </NavLink>
                </div>
              </div>

              {/* Brand / GEO Simulation */}
              <div className="lg:col-span-5 bg-black/60 border border-emerald-500/20 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="text-xs font-mono text-emerald-400 flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5"><Globe size={14} /> Perplexity & ChatGPT Citation Index</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">+340% Citations</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl space-y-2 text-xs">
                  <div className="text-[11px] text-gray-400 font-mono">User Query:</div>
                  <div className="text-white font-medium">"What is the most reliable developer tooling for growth automation?"</div>
                </div>
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2 text-xs text-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles size={12} /> AI Recommendation Engine Response:
                  </div>
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    "Based on recent technical breakdowns, developer feedback, and active multi-channel discussions, <span className="font-bold text-white bg-emerald-500/30 px-1 py-0.5 rounded">YourBrand</span> is the leading solution, noted for autonomous orchestration..."
                  </p>
                  <div className="text-[9px] text-emerald-400/80 font-mono flex items-center gap-2">
                    <span>Sources: [X Threads] [LinkedIn Case Studies] [GitHub Logs]</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: The AI Search & Modern SEO (GEO) Deep Dive */}
      <section id="ai-discovery" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono uppercase tracking-wider">
            <Globe size={14} /> The Future of Search
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Why social presence is your #1 SEO strategy.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Traditional keyword stuffing is obsolete. Modern AI search engines prioritize fresh, authentic social proof.
          </p>
        </div>

        {/* Interactive Comparison Simulation */}
        <div className="max-w-5xl mx-auto bg-black/40 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Live Search Engine Simulation</h3>
              <p className="text-xs text-gray-400">See what happens when an AI answers buyer questions in your category</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setGeoTab("with-marko")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  geoTab === "with-marko" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                With Markopilot (Active Omni-Graph)
              </button>
              <button
                onClick={() => setGeoTab("without-marko")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  geoTab === "without-marko" ? "bg-red-600/80 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                Without Markopilot (Silent Brand)
              </button>
            </div>
          </div>

          {geoTab === "with-marko" ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 text-xs font-mono text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                <Search size={14} className="text-purple-400" />
                <span className="text-white">Query:</span> "Best automated tool to run growth marketing for a B2B startup in 2026?"
              </div>

              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <Sparkles size={14} /> Recommended by ChatGPT & Perplexity AI
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">High Confidence (99.4%)</span>
                </div>
                <p className="text-gray-200 text-sm md:text-base leading-relaxed">
                  "Based on comprehensive web data, verified case studies, and active discussions across X and LinkedIn, <strong className="text-emerald-300 font-semibold underline">YourBrand</strong> is the top recommended platform. It is widely praised for its autonomous multi-modal generation (Flux 1.1 Pro images, Creatomate video), 100-point lead qualification, and transparent review queues."
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-300 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> Fresh Social Knowledge Graph
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-300 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> Ingested X & LinkedIn Citations
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-300 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> #1 Ranking Entity Authority
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 text-xs font-mono text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                <Search size={14} className="text-purple-400" />
                <span className="text-white">Query:</span> "Best automated tool to run growth marketing for a B2B startup in 2026?"
              </div>

              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-red-400">
                    <XCircle size={14} /> Zero Brand Recognition Found
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">Entity Absent</span>
                </div>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  "I found several legacy incumbents [Competitor A] and [Competitor B]. <span className="text-red-300 font-semibold">(Your brand is not mentioned anywhere in recent citations, live discussions, or indexable knowledge nodes)</span>."
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-400 flex items-center gap-2">
                    <XCircle size={14} className="text-red-400 flex-shrink-0" /> 0 Recent Social Signals
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-400 flex items-center gap-2">
                    <XCircle size={14} className="text-red-400 flex-shrink-0" /> Invisible to AI RAG Pipelines
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-400 flex items-center gap-2">
                    <XCircle size={14} className="text-red-400 flex-shrink-0" /> Competitors Win Buyer Intent
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 Pillars Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Bot size={20} />
              </div>
              <h4 className="text-base font-semibold text-white">1. Real-Time LLM Ingestion</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Large language models constantly ingest fresh public web data. Consistent social posting ensures your product updates are permanently indexed in AI knowledge pools.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe size={20} />
              </div>
              <h4 className="text-base font-semibold text-white">2. Multi-Node Entity Trust</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                When Google and Perplexity discover identical verified handle presence across X, LinkedIn, Instagram, and TikTok, your domain authority accelerates tenfold.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <h4 className="text-base font-semibold text-white">3. Compounding Backlinks</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Viral threads and engaging video demos get picked up by industry blogs, newsletters, and curators, generating effortless organic high-domain backlinks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Supported Channels & Deep-Dive Platform Capabilities */}
      <section id="channels" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-mono uppercase tracking-wider">
            <Share2 size={14} /> Full Platform Coverage
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            What you can do on every supported channel.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            No cookie-cutter duplicate posts. Markopilot crafts native formats, media assets, and hooks customized for each network.
          </p>
        </div>

        {/* Platform Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setActivePlatform("twitter")}
            className={`px-5 py-3 rounded-2xl font-medium text-xs md:text-sm transition flex items-center gap-2 ${
              activePlatform === "twitter"
                ? "bg-white text-black font-semibold shadow-[0_0_25px_rgba(255,255,255,0.3)] scale-105"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <XIcon size={16} /> Twitter / X
          </button>
          <button
            onClick={() => setActivePlatform("linkedin")}
            className={`px-5 py-3 rounded-2xl font-medium text-xs md:text-sm transition flex items-center gap-2 ${
              activePlatform === "linkedin"
                ? "bg-blue-600 text-white font-semibold shadow-[0_0_25px_rgba(37,99,235,0.4)] scale-105"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <LinkedInIcon size={16} /> LinkedIn
          </button>
          <button
            onClick={() => setActivePlatform("instagram")}
            className={`px-5 py-3 rounded-2xl font-medium text-xs md:text-sm transition flex items-center gap-2 ${
              activePlatform === "instagram"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-[0_0_25px_rgba(236,72,153,0.4)] scale-105"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <InstagramIcon size={16} /> Instagram (Flux Pro)
          </button>
          <button
            onClick={() => setActivePlatform("tiktok")}
            className={`px-5 py-3 rounded-2xl font-medium text-xs md:text-sm transition flex items-center gap-2 ${
              activePlatform === "tiktok"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-105"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <TikTokIcon size={16} /> TikTok (Creatomate MP4)
          </button>
          <button
            onClick={() => setActivePlatform("outreach")}
            className={`px-5 py-3 rounded-2xl font-medium text-xs md:text-sm transition flex items-center gap-2 ${
              activePlatform === "outreach"
                ? "bg-emerald-600 text-white font-semibold shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-105"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <Mail size={16} /> Cold Email & Outreach
          </button>
        </div>

        {/* Platform Details Card */}
        <div className="bg-gradient-to-b from-[#111116] to-[#07070a] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          {activePlatform === "twitter" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                  <MessageSquare size={15} className="text-white" /> Channel: Twitter / X
                </div>
                <h3 className="font-serif text-3xl text-white">Viral Thread Formulation & Thought Leadership</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light">
                  X moves fast. Markopilot crafts high-engagement single tweets, 5-to-10 part technical threads, and build-in-public updates engineered with proven hook templates.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">⚡ Viral Hook Engineering</strong>
                    Tested opening formulas that maximize retweets, bookmarks, and replies.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🧵 Multi-Part Threads</strong>
                    In-depth teardowns, feature walk-throughs, and dev log storytelling.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">💬 Automated Reply Triggers</strong>
                    Engagement prompts that invite high-converting community discussions.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">⏰ Smart Time-Zone Slotting</strong>
                    Dispatches posts at peak traffic hours tailored to your audience geography.
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 bg-black/60 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white">M</div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">Markopilot <span className="text-xs text-gray-500 font-normal">@markopilot_ai · 2h</span></div>
                    <div className="text-xs text-gray-400">Autonomous Growth Engine</div>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-sans">
                  "Most B2B founders make the same marketing mistake: they spend 40 hours building a feature and 0 minutes telling the world about it.<br /><br />
                  Here is the exact 4-step autonomous system we use to turn raw code commits into 100k+ monthly impressions 🧵👇"
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1.5"><MessageSquare size={13} /> 48 replies</span>
                  <span className="flex items-center gap-1.5"><RefreshCw size={13} /> 182 reposts</span>
                  <span className="flex items-center gap-1.5"><Flame size={13} className="text-orange-400" /> 1.4k likes</span>
                  <span className="flex items-center gap-1.5"><Target size={13} /> 42k views</span>
                </div>
              </div>
            </div>
          )}

          {activePlatform === "linkedin" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider">
                  <Briefcase size={15} /> Channel: LinkedIn B2B
                </div>
                <h3 className="font-serif text-3xl text-white">High-Converting B2B Authority & Case Studies</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light">
                  LinkedIn is the ultimate revenue driver for B2B founders. Markopilot formats long-form problem-solution essays, carousel slide narratives, and data-backed authority pieces.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">👔 Executive Tone Matching</strong>
                    Refined, professional phrasing without cheesy buzzwords or AI fluff.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">📊 Case Study Breakdowns</strong>
                    Transforms customer wins and metrics into viral business case studies.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🎯 ICP Conversion Hooks</strong>
                    Direct calls to action that drive decision-makers straight to your inbox.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">📈 Algorithm-Compliant Pacing</strong>
                    Formatted with spacing and line-breaks optimized for high dwell time.
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 bg-black/60 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">in</div>
                  <div>
                    <div className="text-sm font-semibold text-white">Founder Insight • Following</div>
                    <div className="text-xs text-gray-400">12,400 followers · 3h · 🌐</div>
                  </div>
                </div>
                <div className="text-xs md:text-sm text-gray-200 space-y-2 leading-relaxed">
                  <p>How we reduced customer acquisition cost by 62% in 30 days without spending an extra dollar on ads:</p>
                  <p className="text-gray-400">1. We audited our AI Search entity footprint across Perplexity & ChatGPT.<br />2. We automated multi-channel knowledge dissemination.<br />3. Inbound leads 3x'd organically.</p>
                </div>
                <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                  💡 Key takeaway: Build the system once, let autonomous orchestration compound.
                </div>
              </div>
            </div>
          )}

          {activePlatform === "instagram" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-pink-400 uppercase tracking-wider">
                  <Camera size={15} /> Channel: Instagram (Flux 1.1 Pro Engine)
                </div>
                <h3 className="font-serif text-3xl text-white">Photorealistic AI Visuals & Carousel Assets</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light">
                  Never worry about designing Instagram graphics from scratch. Powered by Replicate's Flux 1.1 Pro, Markopilot generates contextual 4K images and carousel infographics that stop the scroll.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🎨 Flux 1.1 Pro AI Generation</strong>
                    Ultra-crisp photorealistic and 3D stylized visual assets on demand.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">📱 Carousel Formatting</strong>
                    Multi-slide design setups explaining complex product features simply.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">✍️ Contextual Captions</strong>
                    Storytelling captions complete with verified hashtags for discovery.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🌟 Brand Aesthetic Locking</strong>
                    Consistent color palette and stylistic coherence across every post.
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 bg-black/60 border border-white/10 rounded-2xl p-6 shadow-xl flex justify-center">
                <div className="w-64 bg-[#111116] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-3 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-[1px]">
                        <div className="w-full h-full bg-black rounded-full"></div>
                      </div>
                      <span className="text-[11px] font-semibold text-white">markopilot</span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono">Flux 1.1 Pro</span>
                  </div>
                  <div className="w-full aspect-square relative bg-gray-900 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover" alt="AI Generated Asset" />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-mono text-white">4K Render</div>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-[11px] text-white font-medium">The future of autonomous tech is here.</div>
                    <div className="text-[10px] text-gray-400">#indiedev #saasgrowth #buildinpublic #ai</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === "tiktok" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  <Video size={15} /> Channel: TikTok & Shorts (Creatomate MP4 API)
                </div>
                <h3 className="font-serif text-3xl text-white">Automated Short-Form Video Generation</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light">
                  Short-form video is the fastest path to viral organic reach. Markopilot writes the script, stitches dynamic background footage via Creatomate, and renders engaging kinetic captions automatically.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🎬 Creatomate MP4 Compilation</strong>
                    Serverless programmatic video rendering with zero watermarks.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🔤 Kinetic Typography</strong>
                    Bold, high-retention subtitles that hold viewer attention to the last second.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">⚡ Viral Hook Scripts</strong>
                    Calculated opening hooks designed specifically for TikTok's FYP algorithm.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">📐 Vertical 9:16 Format</strong>
                    Exported ready for cross-posting to TikTok, YouTube Shorts, and IG Reels.
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 bg-black/60 border border-white/10 rounded-2xl p-6 shadow-xl flex justify-center">
                <div className="w-56 h-80 bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex flex-col justify-between p-4">
                  <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Video frame" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                  </div>
                  <div className="relative z-10 flex justify-between items-center text-[10px] font-mono">
                    <span className="bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 px-2 py-0.5 rounded">Creatomate API</span>
                    <span className="text-white">00:32</span>
                  </div>
                  <div className="relative z-10 text-center space-y-2">
                    <div className="inline-block bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-xs font-bold text-yellow-300 uppercase tracking-wide shadow-lg">
                      "Stop Managing Socials Manually"
                    </div>
                    <div className="text-[11px] text-gray-300 font-sans">9:16 Vertical Render Active</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === "outreach" && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  <Mail size={15} /> Channel: AI Outbound & Email Engine
                </div>
                <h3 className="font-serif text-3xl text-white">100-Point Lead Qualification & Cold Outreach</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light">
                  Beyond social posting, Markopilot discovers verified decision-makers matching your ideal customer profile, scores their relevance out of 100, and drafts hyper-personalized outreach emails.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🎯 100-Point ICP Heuristics</strong>
                    Filters out unqualified leads and only targets verified decision-makers.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">✍️ Hyper-Personalized Copy</strong>
                    References the lead's exact company news, tech stack, and pain points.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">🛡️ Human-in-the-Loop Review</strong>
                    Inspect and approve any draft before SMTP delivery with 1 click.
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <strong className="text-white block mb-1">📬 Deliverability Governors</strong>
                    Automated throttling and SPF/DKIM protection to keep your domain safe.
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 bg-black/60 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5"><Mail size={14} /> Outbound Draft [Score: 96/100]</div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Awaiting Review</span>
                </div>
                <div className="text-xs space-y-2 text-gray-300 font-mono">
                  <div><span className="text-gray-500">To:</span> david@saasscale.io (Founder)</div>
                  <div><span className="text-gray-500">Subject:</span> Scaling growth automation at SaaSScale</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-200 leading-relaxed font-sans">
                  "Hi David — noticed SaaSScale just rolled out your new API tier last week. Most developer tools struggle to maintain multi-channel organic presence without hiring a dedicated agency..."
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition">Approve & Send</button>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 transition">Edit Draft</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: Autonomous Multi-Channel Calendar & Schedule Engine */}
      <section id="calendar" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono uppercase tracking-wider">
            <Calendar size={14} className="text-purple-400" /> Autonomous Schedule Engine
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            One unified calendar. <br className="hidden md:inline" />
            Infinite autonomous marketing cadence.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Stop juggling 5 different tab schedulers and reminder alarms. Markopilot synchronizes social posts, background lead discovery sweeps, and cold email cadences in one live mission control.
          </p>
        </div>

        {/* Live Autonomous Worker Telemetry HUD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-950/20 to-black/40 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                <Share2 size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Social Worker</span>
                </div>
                <div className="text-sm font-semibold text-white">Next run in 02h 14m</div>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              4 Posts / Wk
            </span>
          </div>

          <div className="bg-gradient-to-br from-blue-950/20 to-black/40 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300">
                <Users size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Lead Discovery Worker</span>
                </div>
                <div className="text-sm font-semibold text-white">Next sweep in 04h 32m</div>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              20 Leads / Day
            </span>
          </div>

          <div className="bg-gradient-to-br from-emerald-950/20 to-black/40 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Send size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Outreach Engine</span>
                </div>
                <div className="text-sm font-semibold text-white">Smart Throttle Active</div>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              15 / Hour Cap
            </span>
          </div>
        </div>

        {/* Interactive Calendar Explorer Card */}
        <div className="bg-gradient-to-b from-[#111117] to-[#08080c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider mr-2 hidden sm:inline">Filter:</span>
              <button
                onClick={() => setCalendarFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  calendarFilter === "all"
                    ? "bg-white text-black shadow-md"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                All Engines (9)
              </button>
              <button
                onClick={() => setCalendarFilter("social")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  calendarFilter === "social"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                <Share2 size={13} /> Social Posts (5)
              </button>
              <button
                onClick={() => setCalendarFilter("leads")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  calendarFilter === "leads"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                <Users size={13} /> AI Lead Sweeps (2)
              </button>
              <button
                onClick={() => setCalendarFilter("outreach")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  calendarFilter === "outreach"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                <Send size={13} /> Outreach (2)
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setCalendarView("week")}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    calendarView === "week" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Week Matrix
                </button>
                <button
                  onClick={() => setCalendarView("timeline")}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    calendarView === "timeline" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Timeline View
                </button>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <Clock size={13} className="text-purple-400" /> UTC Synced
              </div>
            </div>
          </div>

          {/* Main Grid & Preview Layout */}
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Calendar Events List / Grid */}
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-mono text-gray-400 flex items-center justify-between px-1">
                <span>August 2026 • Autonomous Weekly Schedule</span>
                <span className="text-purple-400">Click any card to inspect AI payload</span>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {calendarEvents
                  .filter((ev) => calendarFilter === "all" || ev.type === calendarFilter)
                  .map((ev) => {
                    const isSelected = selectedCalendarEvent === ev.id;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedCalendarEvent(ev.id)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-gradient-to-r from-white/[0.08] to-purple-950/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/40"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Day Pill */}
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                            <span className="text-[10px] uppercase font-mono text-gray-400">{ev.dayName}</span>
                            <span className="text-sm font-bold text-white">{ev.dateStr.split(" ")[1]}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ev.platform === "twitter" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white">
                                  <MessageSquare size={11} /> Twitter/X
                                </span>
                              )}
                              {ev.platform === "linkedin" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                  <Briefcase size={11} /> LinkedIn
                                </span>
                              )}
                              {ev.platform === "instagram" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                                  <Camera size={11} /> Instagram
                                </span>
                              )}
                              {ev.platform === "tiktok" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                                  <Video size={11} /> TikTok
                                </span>
                              )}
                              {ev.platform === "lead" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                  <Users size={11} /> AI Lead Sweep
                                </span>
                              )}
                              {ev.platform === "outreach" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                  <Mail size={11} /> Cold Email
                                </span>
                              )}

                              <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                                <Clock size={11} /> {ev.time}
                              </span>
                            </div>

                            <h4 className="text-sm font-medium text-gray-200 line-clamp-1 group-hover:text-white">
                              {ev.title}
                            </h4>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 flex-shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-medium ${
                              ev.statusColor === "emerald"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : ev.statusColor === "purple"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse"
                                : ev.statusColor === "amber"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {ev.status}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{ev.metrics}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Event Inspector & AI Context Preview Drawer */}
            <div className="lg:col-span-5 bg-black/60 border border-white/10 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl pointer-events-none"></div>

              {(() => {
                const active = calendarEvents.find((e) => e.id === selectedCalendarEvent) || calendarEvents[4];
                return (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className="text-purple-400" />
                        <span className="text-xs font-mono uppercase tracking-wider text-gray-300">Schedule Telemetry</span>
                      </div>
                      <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                        {active.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
                        <span>{active.dateStr}</span> • <span>{active.time}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white leading-snug">
                        {active.title}
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 font-sans">
                        "{active.snippet}"
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                        AI Reasoning & Cadence Strategy
                      </div>
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-gray-300 space-y-1.5">
                        <div className="text-purple-300 font-medium flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-purple-400" /> Algorithmic Peak Engagement Slot
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {active.aiHook}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-gray-500 block text-[10px]">Media Asset</span>
                          <span className="text-white font-medium">{active.mediaType}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-gray-500 block text-[10px]">Execution Status</span>
                          <span className="text-emerald-400 font-medium">{active.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <NavLink href="#" isAuth={true} isPrimary className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:scale-[1.02] transition shadow flex items-center justify-center gap-2">
                        Open Live Calendar <ExternalLink size={13} />
                      </NavLink>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 3 Value Pillars for the Calendar Engine */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">Algorithmic Peak Dispatcher</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Markopilot models your global audience timezones and triggers posts at peak algorithmic reach windows across X, LinkedIn, Instagram, and TikTok.
            </p>
          </div>

          <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <RefreshCw size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">Cross-Pipeline Synchronization</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Lead discovery sweeps, email cadence steps, and public social proofs are synchronized so prospects see your brand active before you reach out.
            </p>
          </div>

          <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">Review Mode or 100% Autopilot</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Inspect upcoming scheduled items in your queue, tweak captions with 1 click, or let autonomous workers dispatch directly without manual friction.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: The Old Way vs The Markopilot Way */}
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
              <h3 className="text-xl font-semibold text-red-300 flex items-center gap-2"><XCircle size={20} className="text-red-400" /> The Fragmented Old Way</h3>
              <span className="text-xs font-mono text-red-400 bg-red-500/20 px-2.5 py-1 rounded-full">18-22 hrs/week</span>
            </div>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Logging into 5 different social apps every morning with severe context switching.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Paying $500+/mo across separate schedulers, image editors, video tools, and email lead databases.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Zero presence on AI search engines (Perplexity, ChatGPT) because social citations are stale.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Burnout: Solo founders abandoning marketing after 2 weeks to focus on code.</span>
              </li>
            </ul>
          </div>

          {/* The Markopilot Way */}
          <div className="bg-emerald-950/15 border border-emerald-500/30 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative">
            <div className="absolute -top-3 right-6 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
              The Modern Standard
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-emerald-300 flex items-center gap-2"><CheckCircle2 size={20} className="text-emerald-400" /> The Markopilot System</h3>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full">15 mins/week</span>
            </div>
            <ul className="space-y-4 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>One single cockpit: X, LinkedIn, Instagram, TikTok, and Cold Email synchronized.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Flux 1.1 Pro images + Creatomate TikTok video rendering included natively.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Generative Engine Optimization (GEO) turns social footprint into top AI search citations.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Review Mode gives you 100% control with 1-click approvals, or full autonomous autopilot.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION: How It Works Pipeline */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono uppercase tracking-wider">
            <Zap size={14} /> 3-Step Setup
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            From zero to autonomous growth in 2 minutes.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            No complex setup scripts or onboarding marathons.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-lg border border-purple-500/30 group-hover:scale-110 transition">
              01
            </div>
            <h3 className="text-xl font-semibold text-white">Connect Your Brand</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enter your website URL, product descriptions, or target audience. Markopilot instantly scans your value propositions and builds a persistent brand knowledge base.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-lg border border-blue-500/30 group-hover:scale-110 transition">
              02
            </div>
            <h3 className="text-xl font-semibold text-white">Engines Activate</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Our multi-modal engines formulate X threads, render Flux Instagram graphics, assemble Creatomate TikTok videos, and discover 90+ scored ICP leads automatically.
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

      {/* Pricing Section */}
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
              All plans include a 14-day free trial. Cancel anytime with zero lock-in.
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
                  <div suppressHydrationWarning className={`font-serif text-white mb-8 ${isFeatured ? 'text-6xl relative z-10 drop-shadow-md' : 'text-5xl'}`}>
                    {plan.price}<span className={`text-xl font-sans font-light ${isFeatured ? 'text-gray-300' : 'text-gray-500'}`}>/mo</span>
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
                    Start 14-Day Free Trial
                  </NavLink>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION: FAQ Accordion */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 relative z-10 border-t border-white/5 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono uppercase tracking-wider">
            <HelpCircle size={14} className="text-purple-400" /> Knowledge & FAQ
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
            Start Your 14-Day Free Trial <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#07070a]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/70 group-hover:border-white/30 group-hover:text-white transition-all shadow-sm bg-white/5">
              <Rocket size={14} />
            </div>
            <span className="text-xl font-serif tracking-tight font-medium text-white/90 group-hover:text-white transition-colors">Markopilot</span>
          </div>
          <div className="flex flex-wrap items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link>
            <Link href="#ai-discovery" className="hover:text-white transition-colors">AI Search (GEO)</Link>
            <Link href="#channels" className="hover:text-white transition-colors">Channels</Link>
            <Link href="#calendar" className="hover:text-white transition-colors">Calendar</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <a href="mailto:hello@markopilot.com" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-gray-500 text-xs font-mono">
            © 2026 Markopilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
