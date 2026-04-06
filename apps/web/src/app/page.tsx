"use client";

import Link from "next/link";
import { Check, Menu, ArrowRight, Share2, Users, Send, Rocket, Sparkles, Zap, ShieldCheck, MessageSquare, Briefcase, Camera, Video, Mail, Bot, Database } from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Running Itself.";

  // Centralized URL to ensure absolute consistency
  const SIGNIN_URL = "/api/auth/signin?callbackUrl=/dashboard";

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

  // Safe navigation renderer to prevent hydration mismatch for auth links
  const NavLink = ({ 
    href, 
    className, 
    children, 
    isPrimary = false 
  }: { 
    href: string; 
    className?: string; 
    children: React.ReactNode; 
    isPrimary?: boolean;
  }) => {
    // During hydration/SSR, we render a stable version. Once mounted, we use the final URL.
    const safeHref = mounted ? href : "/api/auth/signin";
    
    return (
      <Link href={safeHref} className={className}>
        {isPrimary && <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>}
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white selection:bg-[var(--accent-primary)] selection:text-white relative pb-12 overflow-hidden">

      {/* Inline Styles for Guaranteeing Keyframe Animations natively w/o Tailwind Plugins */}
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
      <div
        className="fixed z-0 pointer-events-none rounded-full blur-[150px] opacity-40 mix-blend-screen transition-opacity duration-300"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
          transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
        }}
      />

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-start overflow-hidden">
        <div className="absolute top-80 -right-40 w-[800px] h-[800px] bg-blue-600/30 mix-blend-screen rounded-full blur-[200px] opacity-20 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#07070a_80%)] z-0" />
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] repeat pointer-events-none" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#07070a]/60 backdrop-blur-2xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-400 flex items-center justify-center text-black shadow-lg">
              <Rocket size={18} />
            </div>
            <span className="text-xl font-serif tracking-tight font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Markopilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white hover:-translate-y-0.5 transition-all drop-shadow-sm">Features</Link>
            <Link href="#how-it-works" className="hover:text-white hover:-translate-y-0.5 transition-all drop-shadow-sm">How It Works</Link>
            <Link href="#pricing" className="hover:text-white hover:-translate-y-0.5 transition-all drop-shadow-sm">Pricing</Link>
          </div>
          <div className="hidden md:block">
            <NavLink href={SIGNIN_URL} className="relative group px-6 py-2.5 rounded-full overflow-hidden inline-flex items-center justify-center font-medium bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all text-white text-sm tracking-wide">
              <span>Login to Dashboard</span>
            </NavLink>
          </div>
          <button className="md:hidden text-gray-300 hover:text-white"><Menu /></button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-visible">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-10 relative z-20">

          {/* Animated Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 tracking-wide uppercase mb-4 opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_100ms_forwards]"
          >
            <Sparkles size={14} className="text-[var(--accent-primary)] animate-pulse" />
            Markopilot 2.0 is now live
          </div>

          {/* Epic Animated Headline */}
          <h1
            className="font-serif text-[clamp(48px,8vw,110px)] leading-[1.05] tracking-tight opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_200ms_forwards]"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 drop-shadow-xl inline-block hover:scale-[1.02] transition-transform pb-2">
              Your Brand, <br />
            </span>
            <span className="relative inline-block mt-2">
              {/* Invisible ghost text to maintain fixed layout width while typing dynamically */}
              <span className="opacity-0 tracking-tight select-none pointer-events-none pb-4 inline-block">{fullText}</span>

              {/* Typed Text Overlay */}
              <span className="absolute inset-0 text-left whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-purple-300 to-white drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] pb-4 inline-block">
                {typedText}
                <span className={`inline-block w-[3px] h-[0.7em] bg-[var(--accent-primary)] ml-1 md:ml-3 align-baseline transition-opacity ${typedText.length === fullText.length ? 'animate-pulse' : ''} ${typedText.length === 0 ? 'opacity-0' : 'opacity-100'}`}></span>
              </span>

              {/* Underline glow */}
              <div className="absolute top-[80%] left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-80 blur-[2px]"></div>
            </span>
          </h1>

          <p
            className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto font-sans font-light leading-relaxed opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_300ms_forwards]"
          >
            Markopilot autonomously handles your social media, lead generation, and outreach — so you can focus entirely on building.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8 opacity-0 animate-[fadeUpIn_1s_cubic-bezier(0.16,1,0.3,1)_500ms_forwards]"
          >
            <NavLink href={SIGNIN_URL} isPrimary className="group relative w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:scale-105 transition-all flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </NavLink>
            <Link href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium text-base hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:-translate-y-1">
              See How It Works
            </Link>
          </div>
        </div>

        {/* Dashboard Preview Presentation */}
        <div
          className="mt-24 w-full max-w-6xl mx-auto px-6 relative z-10 opacity-0 animate-[fadeUpIn_1.5s_cubic-bezier(0.16,1,0.3,1)_700ms_forwards]"
        >
          <div className="w-full aspect-[21/9] rounded-2xl bg-gradient-to-t from-[#111] to-[#1a1a23] border border-white/10 shadow-[0_0_120px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden ring-1 ring-white/5 backdrop-blur-3xl relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-px w-full"></div>
            <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-black/40">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 cursor-pointer transition shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/80 hover:bg-yellow-500 cursor-pointer transition shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/80 hover:bg-green-500 cursor-pointer transition shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
              </div>
              <div className="text-xs text-white/30 font-mono tracking-widest bg-black/40 px-3 py-1 rounded w-64 text-center border border-white/5">app.markopilot.com</div>
              <div className="w-16"></div>
            </div>
            <div className="relative flex-1 w-full h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                alt="Dashboard Core UI"
                className="w-full h-full object-cover object-top opacity-50 mix-blend-screen scale-105 group-hover:opacity-80 transition-opacity duration-1000"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-[#111114]/70 backdrop-blur-sm z-10 group-hover:backdrop-blur-none group-hover:bg-[#111114]/20 transition-all duration-1000">
                <div className="text-gray-300 font-mono text-sm border border-[var(--accent-primary)]/50 bg-black/80 px-6 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
                  <Zap size={16} className="text-[var(--accent-primary)] animate-pulse" /> Telemetry Initialized — Engines Online
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Integrations Bar (Infinite Scrolling Ticker) */}
      <section className="py-12 border-y border-white/5 bg-black/40 backdrop-blur-md relative z-10 my-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center text-xs uppercase tracking-widest text-gray-400 font-bold">
          Natively integrated with your entire growth stack
        </div>
        <div className="flex max-w-full relative opacity-50 hover:opacity-100 transition-opacity duration-500 overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <div className="flex w-max animate-scroll pointer-events-none">
            <div className="flex gap-20 items-center px-10 text-xl font-medium tracking-wide whitespace-nowrap">
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><MessageSquare size={28} /> Twitter (X)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Briefcase size={28} /> LinkedIn</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Camera size={28} /> Instagram</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Video size={28} /> TikTok</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Mail size={28} /> Gmail SMTP</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={28} /> OpenAI Engines</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Database size={28} /> Supabase</div>
            </div>
            {/* Duplicated for seamless infinite looping */}
            <div className="flex gap-20 items-center px-10 text-xl font-medium tracking-wide whitespace-nowrap">
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><MessageSquare size={28} /> Twitter (X)</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Briefcase size={28} /> LinkedIn</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Camera size={28} /> Instagram</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Video size={28} /> TikTok</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Mail size={28} /> Gmail SMTP</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Bot size={28} /> OpenAI Engines</div>
              <div className="flex items-center gap-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"><Database size={28} /> Supabase</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section id="how-it-works" className="py-32 max-w-7xl mx-auto px-6 space-y-48 relative z-10">

        {/* Feature 1 */}
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/40 to-transparent group-hover:opacity-100 opacity-0 transition-opacity"></div>
              <Share2 size={24} className="relative z-10 text-[var(--accent-primary)]" />
            </div>
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
              Autonomous Publishing Topology
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed font-light">
              Connect your X, LinkedIn, Instagram, and TikTok accounts. Markopilot generates platform-optimised copy using AI, schedules it based on your content pillars, and publishes automatically. Never stare at a blank calendar again.
            </p>
            <ul className="space-y-4 mt-6">
              <li className="flex items-center gap-3 text-gray-300 font-medium text-sm"><Check size={18} className="text-[var(--success)]" /> AI Image & Copy Generation</li>
              <li className="flex items-center gap-3 text-gray-300 font-medium text-sm"><Check size={18} className="text-[var(--success)]" /> Fully Automated Scheduling Pipelines</li>
            </ul>
          </div>
          <div className="flex-1 w-full aspect-square relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-600/20 rounded-[32px] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000 -z-10"></div>
            <div className="relative w-full h-full rounded-[32px] border border-white/10 bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.03]">
              <div className="absolute inset-0 opacity-[0.8] mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-1000">
                <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop" alt="Social Apps Network UI" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out pointer-events-none" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-black/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 translate-y-4 group-hover:translate-y-0 opacity-80 group-hover:opacity-100 transition-all duration-500">
                <p className="font-mono text-sm text-white mb-1 drop-shadow-md flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>Queue Synchronised</p>
                <p className="text-xs text-gray-300 leading-tight">Successfully routed payloads to 4 connected networking interfaces mapping optimal execution paths.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-20">
          <div className="flex-1 space-y-8">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-transparent group-hover:opacity-100 opacity-0 transition-opacity"></div>
              <Users size={24} className="relative z-10 text-blue-400" />
            </div>
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
              Intelligent Lead Generation
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed font-light">
              Define your ideal customer profile and target titles. Our discovery engine searches the web, extracts verified contact information, and scores leads out of 100 based on their relevance to your brand.
            </p>
            <ul className="space-y-4 mt-6">
              <li className="flex items-center gap-3 text-gray-300 font-medium text-sm"><Check size={18} className="text-blue-400" /> 100-Point Scoring Heuristics</li>
              <li className="flex items-center gap-3 text-gray-300 font-medium text-sm"><Check size={18} className="text-blue-400" /> Automatic Deduplication Engines</li>
            </ul>
          </div>
          <div className="flex-1 w-full aspect-square relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-[32px] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000 -z-10"></div>
            <div className="relative w-full h-full rounded-[32px] border border-white/10 bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.03]">
              <div className="absolute inset-0 opacity-[0.8] mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-1000">
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop" alt="CRM Dashboard Graphs" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out pointer-events-none" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-black/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 translate-y-4 group-hover:translate-y-0 opacity-80 group-hover:opacity-100 transition-all duration-500">
                <p className="font-mono text-sm text-white mb-1 drop-shadow-md flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>Grid Evaluated</p>
                <p className="text-xs text-gray-300 leading-tight">Mined 120 potential nodes, yielding 84 positive matches above a strict &gt;90% threshold coefficient.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-transparent group-hover:opacity-100 opacity-0 transition-opacity"></div>
              <Send size={24} className="relative z-10 text-emerald-400" />
            </div>
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
              Automated Email Outreach
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed font-light">
              Connect your Gmail account. We draft highly personalised, 3-paragraph cold outreach emails referencing the lead's company and your value prop. Sent directly from your outbox with controlled cadence to ensure high deliverability.
            </p>
            <ul className="space-y-4 mt-6">
              <li className="flex items-center gap-3 text-gray-300 font-medium text-sm"><Check size={18} className="text-emerald-400" /> Strict Deliverability Governors</li>
              <li className="flex items-center gap-3 text-gray-300 font-medium text-sm"><Check size={18} className="text-emerald-400" /> GDPR Built-in Suppression Layers</li>
            </ul>
          </div>
          <div className="flex-1 w-full aspect-square relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-400/20 rounded-[32px] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000 -z-10"></div>
            <div className="relative w-full h-full rounded-[32px] border border-white/10 bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.03]">
              <div className="absolute inset-0 opacity-[0.8] mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-1000">
                <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop" alt="Outreach Server Interface UI" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out pointer-events-none" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-black/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 translate-y-4 group-hover:translate-y-0 opacity-80 group-hover:opacity-100 transition-all duration-500">
                <p className="font-mono text-sm text-white mb-1 drop-shadow-md flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Relay Active</p>
                <p className="text-xs text-gray-300 leading-tight">SMTP packet injected correctly with 0% bounce-back probability evaluated on active outbound lines.</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 relative z-10 mt-24 border-t border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-6">
            <h2 className="font-serif text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg">Simple, transparent pricing.</h2>
            <p className="text-gray-400 text-xl font-light max-w-2xl mx-auto">All plans include a 14-day free trial. No credit card required.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {/* Starter */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors rounded-[32px] p-10 flex flex-col h-full hover:-translate-y-2 duration-500 ease-out">
              <h3 className="text-xl font-medium text-white mb-2">Starter</h3>
              <p className="text-sm text-gray-500 mb-6">Perfect for solo founders establishing baseline activity.</p>
              <div className="text-5xl font-serif text-white mb-8">$19<span className="text-xl text-gray-500 font-sans font-light">/mo</span></div>
              <ul className="space-y-5 mb-10 flex-1">
                <li className="flex items-center gap-3 text-gray-300 font-light text-sm"><Check size={18} className="text-[var(--success)]" /> 1 Brand</li>
                <li className="flex items-center gap-3 text-gray-300 font-light text-sm"><Check size={18} className="text-[var(--success)]" /> 30 Posts / month</li>
                <li className="flex items-center gap-3 text-gray-300 font-light text-sm"><Check size={18} className="text-[var(--success)]" /> 100 Leads / month</li>
              </ul>
              <NavLink 
                href={SIGNIN_URL} 
                className="w-full block text-center py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all active:scale-95"
              >
                Start Free Trial
              </NavLink>
            </div>

            {/* Growth */}
            <div className="group bg-gradient-to-b from-[var(--bg-elevated)] to-[#07070a] border border-[var(--accent-primary)]/70 rounded-[32px] p-10 flex flex-col relative shadow-[0_0_50px_rgba(168,85,247,0.2)] ring-2 ring-[var(--accent-primary)]/30 lg:scale-105 z-10 h-full backdrop-blur-2xl hover:shadow-[0_0_100px_rgba(168,85,247,0.4)] transition-all duration-700 ease-out">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute -top-4 inset-x-0 flex justify-center">
                <span className="bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Most Popular
                </span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2 pb-1 relative z-10 drop-shadow-md">Growth</h3>
              <p className="text-sm text-gray-300 mb-6 relative z-10">Unlocks high throughput orchestration for scaling teams.</p>
              <div className="text-6xl font-serif text-white mb-8 relative z-10 drop-shadow-md">$49<span className="text-xl text-[var(--text-muted)] font-sans font-light">/mo</span></div>
              <ul className="space-y-5 mb-10 flex-1 relative z-10">
                <li className="flex items-center gap-3 text-white font-medium text-sm"><Check size={18} className="text-[var(--success)]" /> 3 Brands</li>
                <li className="flex items-center gap-3 text-white font-medium text-sm"><Check size={18} className="text-[var(--success)]" /> 120 Posts / month</li>
                <li className="flex items-center gap-3 text-white font-medium text-sm"><Check size={18} className="text-[var(--success)]" /> 500 Leads / month</li>
              </ul>
              <NavLink 
                href={SIGNIN_URL} 
                className="w-full block text-center py-4 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 hover:scale-[1.03] transition-all shadow-lg active:scale-95 relative z-10"
              >
                Start Free Trial
              </NavLink>
            </div>

            {/* Scale */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors rounded-[32px] p-10 flex flex-col h-full hover:-translate-y-2 duration-500 ease-out">
              <h3 className="text-xl font-medium text-white mb-2">Scale</h3>
              <p className="text-sm text-gray-500 mb-6">Designed for massive portfolio administration.</p>
              <div className="text-5xl font-serif text-white mb-8">$149<span className="text-xl text-gray-500 font-sans font-light">/mo</span></div>
              <ul className="space-y-5 mb-10 flex-1">
                <li className="flex items-center gap-3 text-gray-300 font-light text-sm"><Check size={18} className="text-[var(--success)]" /> 10 Brands</li>
                <li className="flex items-center gap-3 text-gray-300 font-light text-sm"><Check size={18} className="text-[var(--success)]" /> Unlimited Posts</li>
                <li className="flex items-center gap-3 text-gray-300 font-light text-sm"><Check size={18} className="text-[var(--success)]" /> 2,000 Leads / month</li>
              </ul>
              <NavLink 
                href={SIGNIN_URL} 
                className="w-full block text-center py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all active:scale-95"
              >
                Start Free Trial
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-40 text-center px-6 relative z-10 overflow-hidden mt-10">
        <div className="absolute inset-x-0 -bottom-[500px] h-[1000px] w-[1000px] mx-auto bg-[var(--accent-primary)]/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-pulse duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] to-transparent z-0 pointer-events-none"></div>
        <div className="relative z-10 space-y-10 max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-xl">Stop marketing manually.</h2>
          <NavLink href={SIGNIN_URL} className="group inline-flex items-center gap-3 px-12 py-5 rounded-full bg-white text-black font-semibold text-lg hover:scale-[1.04] transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 hover:shadow-[0_0_80px_rgba(255,255,255,0.4)]">
            Start Free Trial — No Card Needed <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#07070a]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-6 h-6 rounded border border-white/10 flex items-center justify-center text-white/50 group-hover:border-white/30 group-hover:text-white transition-all shadow-sm">
              <Rocket size={12} />
            </div>
            <span className="text-xl font-serif tracking-tight font-medium text-white/80 group-hover:text-white transition-colors">Markopilot</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-gray-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <a href="mailto:hello@markopilot.com" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-gray-600 text-xs font-mono">
            © 2026 Markopilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
