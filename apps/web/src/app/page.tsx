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
  Flame
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { XIcon, LinkedInIcon, InstagramIcon, TikTokIcon } from "@/components/icons/SocialIcons";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Running Itself.";

  // State for FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Typewriter effect
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
      q: "Do I have to approve every post, or can it post automatically?",
      a: "You are in complete control. With 'Review Mode' turned on, every post, image, video, and email waits in a morning queue for your 1-click approval. Whenever you feel ready, you can switch on 'Autopilot' and let Markopilot post and send on its own."
    },
    {
      q: "How does posting on social media help my brand get recommended by ChatGPT?",
      a: "When potential customers ask AI tools like ChatGPT, Perplexity, or Google for recommendations, the AI checks live internet conversations to see which products are real, active, and trusted. Regular social activity gives AI engines the fresh proof they need to recommend your brand."
    },
    {
      q: "How are images and videos made?",
      a: "Markopilot creates clean 4K visuals and short videos with captions automatically using your product notes. You don't need any design skills or video editing software."
    },
    {
      q: "I'm a solo founder. How much time will this save me?",
      a: "Most solo founders spend 15 to 20 hours a week on social posts, editing graphics, and cold emails. With Markopilot, you simply add your website link once, and your weekly marketing time drops to under 15 minutes of quick reviews."
    },
    {
      q: "Can I use my own email address for outreach?",
      a: "Yes! You can connect your existing Gmail or company work email. Markopilot spaces out emails safely and follows anti-spam limits so your inbox reputation stays healthy."
    },
    {
      q: "Is the customer search and email process safe and legal?",
      a: "Yes. Markopilot searches public business websites for verified work contacts. It removes duplicate emails, checks for real company matches, includes a one-click unsubscribe button in every email, and lets you review every message before it sends."
    },
    {
      q: "How does the automatic schedule work without a messy calendar?",
      a: "Markopilot automatically picks the best times when your target audience is awake and active. It spaces out your posts and outreach steadily throughout the week so you never have to organize calendar slots by hand."
    }
  ];

  return (
    <div className="min-h-screen bg-[#07070a] text-white selection:bg-[var(--accent-primary)] selection:text-white relative pb-12 overflow-hidden">

      {/* Inline Keyframe Animations */}
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

      {/* Mouse Glow Background */}
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

      {/* Background Gradients */}
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
            <Link href="#compliance" className="hover:text-white hover:-translate-y-0.5 transition-all">Safe Outreach</Link>
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

          {/* Headline */}
          <h1 className="font-serif text-[clamp(42px,6.5vw,88px)] leading-[1.08] tracking-tight text-white font-normal">
            Your Entire Growth Engine, <br />
            <span className="relative inline-block mt-1">
              <span className="opacity-0 tracking-tight select-none pointer-events-none pb-2 inline-block">
                {fullText}
              </span>
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

          {/* Plain English Subtitle */}
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-sans font-light leading-relaxed">
            Markopilot automatically writes and posts for you on <strong className="text-white font-medium">X, LinkedIn, Instagram, and TikTok</strong>, finds verified business leads, and gets your brand recommended by ChatGPT and Google 24/7.
          </p>

          {/* Action Buttons */}
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
            <span className="flex items-center gap-1.5 text-gray-300"><CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> No credit card needed</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-gray-300"><CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> 2-minute setup</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-gray-300"><CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> Review first or run on autopilot</span>
          </div>
        </div>

        {/* 3 Simple Overview Cards */}
        <div className="mt-16 w-full max-w-6xl mx-auto px-6 relative z-10 opacity-0 animate-[fadeUpIn_1.5s_cubic-bezier(0.16,1,0.3,1)_700ms_forwards]">
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-red-500/[0.06] border border-red-400/20 p-6 text-left space-y-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 flex items-center justify-center">
                <Flame size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-red-300 mb-2">The Problem</p>
                <h2 className="text-xl font-serif text-white">Marketing stops when you're busy building.</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Writing posts, creating visuals, and finding leads takes 20 hours a week. When product work picks up, marketing goes quiet.
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 text-left space-y-4 shadow-[0_0_60px_rgba(124,110,255,0.16)]">
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-purple-200 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-purple-300 mb-2">How Markopilot Helps</p>
                <h2 className="text-xl font-serif text-white">Turn product updates into daily marketing.</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Enter your website URL once. Markopilot automatically writes posts, makes images and videos, finds new customers, and sends emails.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-400/20 p-6 text-left space-y-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-emerald-300 mb-2">The Result</p>
                <h2 className="text-xl font-serif text-white">Get new buyers and stay recommended by AI.</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your brand stays active every day, gets cited when buyers ask ChatGPT for recommendations, and brings in qualified leads consistently.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Social Platforms Bar */}
      <section className="py-10 border-y border-white/5 bg-black/40 backdrop-blur-md relative z-10 my-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center text-xs uppercase tracking-widest text-gray-400 font-bold">
          Works seamlessly with the platforms and tools you use
        </div>
        <div className="flex max-w-full relative opacity-60 hover:opacity-100 transition-opacity duration-500 overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <div className="flex w-max animate-scroll pointer-events-none">
            <div className="flex gap-20 items-center px-10 text-xl font-medium tracking-wide whitespace-nowrap">
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><XIcon size={24} /> Twitter (X)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><LinkedInIcon size={24} /> LinkedIn</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><InstagramIcon size={24} /> Instagram</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><TikTokIcon size={24} /> TikTok</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Mail size={26} /> Gmail &amp; Work Email</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Sparkles size={26} /> 4K AI Images</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Video size={26} /> Short-Form Videos</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={26} /> Multi-LLM Brain</div>
            </div>
            {/* Duplicated for loop */}
            <div className="flex gap-20 items-center px-10 text-xl font-medium tracking-wide whitespace-nowrap">
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><XIcon size={24} /> Twitter (X)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><LinkedInIcon size={24} /> LinkedIn</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><InstagramIcon size={24} /> Instagram</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><TikTokIcon size={24} /> TikTok</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Mail size={26} /> Gmail &amp; Work Email</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Sparkles size={26} /> 4K AI Images</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Video size={26} /> Short-Form Videos</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={26} /> Multi-LLM Brain</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ALTERNATING FEATURE FLOW SECTION (Clean, Simple, Readable, Zigzag)        */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 relative z-10 scroll-mt-20 space-y-28">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono uppercase tracking-wider">
            <Zap size={14} /> What It Does
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            How Markopilot Works For You
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Everything you need to find customers, grow your social accounts, and get noticed—made simple and automatic.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 1: Social Media (Text Left, Visual Right)                */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
              <Share2 size={13} /> 01 • Social Media Posting
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Automatically creates and shares posts on 4 social networks.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              You don't need to write 4 different posts every time you have an update. Markopilot turns your website notes and feature releases into natural posts tailored for each platform.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Written for Each Platform</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Threads for Twitter/X, professional essays for LinkedIn, picture posts for Instagram, and short video clips for TikTok.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Makes Images &amp; Short Videos</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Automatically creates crisp 4K pictures and short video clips so you don't have to hire a designer.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Posts at the Best Times</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Publishes when your target audience is online and reading, giving your product the best organic reach.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-b from-[#121218] to-[#0a0a0e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Automated Social Feed
                </span>
                <span className="text-[11px] font-mono bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full">
                  4 Channels Ready
                </span>
              </div>

              {/* 4 Clean Rows */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white border border-white/10">
                      <XIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Twitter / X</div>
                      <div className="text-[11px] text-gray-400">Launch threads &amp; product highlights</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Ready to Post</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center text-[#0A66C2] border border-[#0A66C2]/30">
                      <LinkedInIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">LinkedIn</div>
                      <div className="text-[11px] text-gray-400">Case studies &amp; business insights</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Professional Tone</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 border border-pink-500/30">
                      <InstagramIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Instagram</div>
                      <div className="text-[11px] text-gray-400">4K image carousels &amp; infographics</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">4K Image Made</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                      <TikTokIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">TikTok &amp; Shorts</div>
                      <div className="text-[11px] text-gray-400">Short vertical video with dynamic subtitles</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">Video Rendered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 2: AI Search Recommendations (Visual Left, Text Right)   */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-gradient-to-b from-[#111618] to-[#070b0e] border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <Globe size={14} />
                  ChatGPT &amp; Perplexity Search
                </span>
                <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                  Top Recommended
                </span>
              </div>

              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-2">
                <div className="text-[11px] font-mono text-gray-400">User Query to AI:</div>
                <div className="text-sm font-medium text-white">"What's the best tool to automate marketing for a startup in 2026?"</div>
              </div>

              <div className="p-4 bg-emerald-950/25 rounded-2xl border border-emerald-500/30 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={13} /> AI Assistant Answer:
                </div>
                <p className="text-gray-200 leading-relaxed">
                  "Based on active customer reviews, case studies, and verified discussions on X and LinkedIn, <strong className="text-white bg-emerald-500/30 px-1 py-0.5 rounded font-semibold">Your Product</strong> is the top recommended tool..."
                </p>
                <div className="pt-2 text-[10px] text-emerald-400/80 font-mono flex items-center gap-3">
                  <span>✓ Cited by AI Search</span>
                  <span>✓ Verified Business Footprint</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono">
              <Globe size={13} /> 02 • AI Search Recommendations
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Get recommended when people ask ChatGPT &amp; Perplexity.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              Old-school SEO keyword stuffing doesn't work anymore. In 2026, buyers ask AI models for software recommendations. AI tools look at active social discussions to decide which products to trust and recommend.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">AI Models Learn About Your Product</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Active discussions on X and LinkedIn make sure AI search engines know about your latest updates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Builds Real Online Trust</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Having matching, active social accounts proves to search engines and buyers that your brand is real.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Brings in Ready-to-Buy Customers</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">People looking for solutions discover your brand directly from answers given by ChatGPT and Perplexity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 3: Finding Leads & Outreach (Text Left, Visual Right)    */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono">
              <Users size={13} /> 03 • Finding Customers &amp; Outreach
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Find real decision-makers &amp; send personalized emails.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              No more buying stale email lists. Markopilot searches public business pages to find people who actually need your product, checks their contact details, and writes personalized emails for them.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Finds the Right Buyers</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Scores prospects out of 100 so you only contact people who are a great match for your product.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Writes Personal Messages</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Mentions recent news or updates about the person's company so the email feels genuine, not robotic.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Protects Your Email Inbox</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Spaces out emails safely and includes a one-click unsubscribe button so your account never gets flagged as spam.</p>
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
                  <Mail size={13} /> Drafted Email (Ready to Review):
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  "Hi David — noticed SaaSScale just launched your new API tier last week. Most developer platforms struggle to maintain continuous social presence without hiring an agency..."
                </p>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition shadow">
                    Approve &amp; Send
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 transition">
                    Edit Text
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ITEM 4: Automatic Timing (Visual Left, Text Right)            */}
        {/* ------------------------------------------------------------- */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-gradient-to-b from-[#13111a] to-[#09080d] border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-purple-300 flex items-center gap-2">
                  <Clock size={14} />
                  Automatic Daily Schedule
                </span>
                <span className="text-[11px] font-mono bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full">
                  Runs Automatically
                </span>
              </div>

              {/* 3 Step Timeline */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                      <Share2 size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Daily Social Posts</div>
                      <div className="text-[10px] text-gray-400">Published at peak morning hours on X &amp; LinkedIn</div>
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
                      <div className="text-xs font-semibold text-white">Find New Customer Leads</div>
                      <div className="text-[10px] text-gray-400">Extracts 20 verified decision-makers every day</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400">Active</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                      <Send size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Safe Email Sending</div>
                      <div className="text-[10px] text-gray-400">Personalized emails delivered at natural intervals</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Safe Pace</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
              <Clock size={13} /> 04 • Automatic Timing &amp; Scheduling
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Runs in the background. No calendar to manage.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              You don't have to set reminders, manage calendar slots, or remember to follow up. Markopilot handles the timing automatically so your marketing stays active every day.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Zero Daily Maintenance</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Background tasks handle the posting and lead searches automatically without you lifting a finger.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Warms Up Your Prospects</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">People see your social posts first, so they recognize your brand when your email arrives in their inbox.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Smart Timezone Timing</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Sends emails and shares content when potential customers in different countries are awake and browsing.</p>
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
              Check everything in 60 seconds, or let it run hands-free.
            </h3>
            <p className="text-gray-300 text-base leading-relaxed font-light">
              You never have to worry about the AI posting something off-brand. Use Review Mode for simple 1-click approvals in the morning, or turn on Autopilot whenever you're ready.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">1-Click Morning Approvals</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Quickly approve or tweak scheduled posts and cold emails in a clean, simple queue.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Autopilot Switch</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Switch between reviewing drafts yourself and 100% automated posting whenever you want.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 flex-shrink-0 mt-1">
                  <Check size={14} />
                </div>
                <div>
                  <strong className="text-white text-sm block">Always Sounds Like You</strong>
                  <p className="text-gray-400 text-xs leading-relaxed">Every message follows your brand voice guidelines and sounds like a real person wrote it.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-b from-[#151412] to-[#0a0908] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-yellow-300 flex items-center gap-2">
                  <SlidersHorizontal size={14} />
                  Posting Mode
                </span>
                <span className="text-[11px] font-mono bg-yellow-500/20 text-yellow-300 px-2.5 py-0.5 rounded-full">
                  Easy Toggle
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Review Mode (Recommended at first)</div>
                    <div className="text-[11px] text-gray-400">Look over drafts before anything goes live</div>
                  </div>
                  <div className="w-10 h-6 bg-emerald-500 rounded-full p-0.5 flex items-center justify-end">
                    <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Autopilot Mode (Hands-Free)</div>
                    <div className="text-[11px] text-gray-400">AI creates, schedules, and posts on its own</div>
                  </div>
                  <div className="w-10 h-6 bg-white/20 rounded-full p-0.5 flex items-center">
                    <div className="w-5 h-5 bg-gray-400 rounded-full shadow-md"></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-950/20 border border-yellow-500/20 rounded-xl text-xs text-yellow-200">
                ⚡ You stay in 100% control with zero stress or guesswork.
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
            <BarChart3 size={14} /> Time &amp; Cost Savings
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Save 20 hours every single week.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            See the difference between doing everything by hand versus using Markopilot.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* The Old Way */}
          <div className="bg-red-950/10 border border-red-500/20 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-red-300 flex items-center gap-2">
                <XCircle size={20} className="text-red-400" /> The Old, Manual Way
              </h3>
              <span className="text-xs font-mono text-red-400 bg-red-500/20 px-2.5 py-1 rounded-full">18-22 hrs / week</span>
            </div>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Logging into 5 separate social and email apps every morning.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Paying $500+/mo for separate schedulers, image editors, video tools, and lead databases.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Invisible on ChatGPT and Perplexity because your accounts are quiet.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>Marketing stops completely whenever coding sprints or client work begins.</span>
              </li>
            </ul>
          </div>

          {/* The Markopilot Way */}
          <div className="bg-emerald-950/15 border border-emerald-500/30 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative">
            <div className="absolute -top-3 right-6 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
              The Easy Way
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" /> With Markopilot
              </h3>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full">15 mins / week</span>
            </div>
            <ul className="space-y-4 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>One dashboard: X, LinkedIn, Instagram, TikTok, and Email all organized in one place.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>AI images and short video clips made for you automatically.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Get recommended when buyers search on ChatGPT, Google, and Perplexity.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Approve drafts in 60 seconds each morning, or let it run 100% on autopilot.</span>
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
            <Zap size={14} /> Quick Setup
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Get started in 2 minutes.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            No technical knowledge or long setup required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-lg border border-purple-500/30 group-hover:scale-110 transition">
              01
            </div>
            <h3 className="text-xl font-semibold text-white">Add Your Website</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Type in your website URL or a short description of what you sell. Markopilot scans your product features and learns your brand voice.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-lg border border-blue-500/30 group-hover:scale-110 transition">
              02
            </div>
            <h3 className="text-xl font-semibold text-white">AI Creates &amp; Finds Leads</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Markopilot writes social posts, generates pictures and videos, and finds matching business leads automatically.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-5 hover:border-white/20 transition group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-lg border border-emerald-500/30 group-hover:scale-110 transition">
              03
            </div>
            <h3 className="text-xl font-semibold text-white">Approve or Autopilot</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Click approve with one tap in your morning review queue, or switch on Autopilot to let everything run completely hands-free.
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
              <ShieldCheck size={14} className="text-emerald-400" /> Simple Pricing
            </div>
            <h2 className="font-serif text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg">
              Simple, transparent plans.
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto">
              All plans include a 7-day free trial. Instant activation with Safaricom M-PESA STK Push or Business Till.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {PLANS.map((plan) => {
              const isFeatured = plan.featured;
              const descriptions: Record<string, string> = {
                starter: "Great for solo builders starting out on social media and AI search.",
                growth: "Best for growing businesses wanting daily posts, videos, and leads.",
                scale: "Designed for agencies and companies managing multiple products.",
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
                      <Check size={18} className="text-emerald-400 flex-shrink-0" /> X, LinkedIn, IG, TikTok &amp; Email
                    </li>
                    <li className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-white font-medium' : 'text-gray-300 font-light'}`}>
                      <Check size={18} className="text-emerald-400 flex-shrink-0" /> AI Search (ChatGPT &amp; Google) Ranking
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

          {/* International Waitlist */}
          <div className="mt-12 text-center text-xs text-gray-400">
            <span>Outside M-PESA supported countries? </span>
            <Link href="/coming-soon-country" className="text-emerald-400 hover:text-emerald-300 font-medium underline inline-flex items-center gap-1">
              Join our International Priority Waitlist <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Safe & Responsible Outreach                                      */}
      {/* ========================================================================= */}
      <section id="compliance" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <ShieldCheck size={14} /> Safe &amp; Responsible
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Email outreach that respects people's inboxes.
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Markopilot finds public business contacts, checks fit, and gives people a clear way to opt out.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
          <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center">
                <Search size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-blue-300">How Finding Leads Works</p>
                <h3 className="text-2xl font-serif text-white">Public, verified business contacts.</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Searches public business websites and professional profiles. Made strictly for finding business contacts, not consumer emails.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Every person is scored against your customer criteria before any message is drafted.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Emails are verified and checked to avoid duplicate messages.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-500/[0.05] border border-emerald-400/20 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-emerald-300">How Sending Stays Safe</p>
                <h3 className="text-2xl font-serif text-white">Reviewable and easy to opt out.</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Review Mode lets you read and approve every email before it sends. Autopilot is available whenever you are ready.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Emails include your real business name, truthful subject lines, and a 1-click unsubscribe button.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">Safe sending limits prevent email spikes and protect your account from getting blocked.</p>
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
              No bought spam lists or mystery databases. The system only looks at public business information.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Ban size={18} />
            </div>
            <h3 className="text-lg font-medium text-white">1-Click Unsubscribe</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              If someone unsubscribes, they are instantly removed and will never be emailed again.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
              <Mail size={18} />
            </div>
            <h3 className="text-lg font-medium text-white">Sent From Your Email</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Emails go out through your connected Gmail or work address with your real name for transparency.
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
            <Sparkles size={14} className="text-purple-400" /> Common Questions
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Everything you need to know about Markopilot.
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

      {/* CTA Section */}
      <section className="py-32 text-center px-6 relative z-10 overflow-hidden mt-10 border-t border-white/5 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,110,255,0.1),transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
            <Sparkle size={13} className="text-purple-400" /> Start growing without marketing burnout
          </div>
          <h2 className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-xl">
            Put your brand's growth on autopilot.
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-light max-w-xl">
            Join founders and solo builders saving 20 hours a week while getting recommended by AI search engines.
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
                Automatic marketing and customer discovery. Post across 4 networks, find verified business leads, and get recommended by AI engines hands-free.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Automatic Engine Active</span>
              </div>
            </div>

            {/* Links column: Product */}
            <div className="md:col-span-4 md:col-start-7 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-300 font-semibold font-mono">Product &amp; Features</div>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#compliance" className="hover:text-white transition-colors">Safe Outreach</Link></li>
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
            <p className="text-gray-400">Built for founders, creators, and indie builders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
