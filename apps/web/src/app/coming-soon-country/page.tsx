"use client";

import { useState } from "react";
import { Globe2, Sparkles, CheckCircle2, ArrowRight, Loader2, Shield, Mail, Rocket } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";

export default function ComingSoonCountryPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/public/waitlist", {
        email: email.trim().toLowerCase(),
        countryName: typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "International"
      });
      setIsSuccess(true);
      toast.success("You've been added to our international priority access list!");
    } catch (err: any) {
      console.error("Waitlist error:", err);
      // Even if network hiccups, give user optimistic confirmation
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/5 bg-[#07070a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-sm">
              <Rocket size={16} />
            </div>
            <span className="text-xl font-serif tracking-tight font-medium text-white">Markopilot</span>
          </Link>
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider uppercase animate-in fade-in">
          <Globe2 size={14} /> Global Expansion In Progress
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight leading-tight">
          Markopilot is coming to your region very soon.
        </h1>

        <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          We are currently in active rollout across regions supported by <strong className="text-white font-medium">M-PESA</strong>. We are finalizing our international card payment processor to serve founders worldwide.
        </p>

        {/* Waitlist Card */}
        <div className="max-w-md mx-auto bg-[#111116] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-serif text-white">You're on the priority list!</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  We'll email <span className="text-emerald-400 font-mono">{email}</span> the moment global credit card payments go live for your country.
                </p>
              </div>
              <Link
                href="/"
                className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition"
              >
                Return to Homepage
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Mail size={12} className="text-emerald-400" /> Get Notified on Launch
                </label>
                <input
                  type="email"
                  placeholder="founder@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm text-white placeholder:text-gray-600 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Reserving Access...
                  </>
                ) : (
                  <>
                    Join International Waitlist <ArrowRight size={16} />
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-500 text-center">
                Zero spam. You will only receive an invitation once global payment is enabled.
              </p>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 text-left">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <Sparkles size={16} className="text-emerald-400 mb-2" />
            <h4 className="text-xs font-semibold text-white">Autonomous Social</h4>
            <p className="text-[11px] text-gray-400 mt-1">Multi-modal content formulated for X, LinkedIn, Instagram, and TikTok.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <Shield size={16} className="text-blue-400 mb-2" />
            <h4 className="text-xs font-semibold text-white">Lead Intelligence</h4>
            <p className="text-[11px] text-gray-400 mt-1">100-point ICP qualification with verified email deliverability.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <Globe2 size={16} className="text-purple-400 mb-2" />
            <h4 className="text-xs font-semibold text-white">AI Search Citations</h4>
            <p className="text-[11px] text-gray-400 mt-1">Continuous social knowledge graphs cited by Perplexity and ChatGPT.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#07070a] py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Markopilot Ltd. Registered address: Mirage Tower, Chiromo Rd, Nairobi, Kenya.
        </div>
      </footer>
    </div>
  );
}
