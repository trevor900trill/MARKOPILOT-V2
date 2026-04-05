import Link from "next/link";
import { Check, Menu, ArrowRight, Share2, Users, Send } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--bg-primary)]/70 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-serif tracking-wide text-white">Markopilot</div>
          <div className="hidden md:flex items-center gap-8 text-[var(--text-secondary)]">
            <Link href="#features" className="hover:text-white transition">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition">How It Works</Link>
            <Link href="#pricing" className="hover:text-white transition">Pricing</Link>
          </div>
          <div className="hidden md:block">
            <Link href="/api/auth/signin" className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:bg-opacity-90 transition shadow-[0_0_15px_var(--accent-glow)]">
              Start Free Trial
            </Link>
          </div>
          {/* Mobile menu button could go here */}
          <button className="md:hidden text-white"><Menu /></button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Dot Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, var(--accent-primary) 0%, transparent 60%)', backgroundSize: '120% 120%', backgroundPosition: 'center', animation: 'pulse 8s infinite alternate' }} />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]" />

        <div className="max-w-4xl mx-auto px-6 text-center z-10 space-y-8">
          <h1 className="font-serif text-[clamp(48px,7vw,96px)] leading-[1.05] text-white">
            Your Brand,<br />Running Itself.
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto font-sans font-light">
            Markopilot autonomously handles your social media, lead generation, and outreach — so you can focus entirely on building.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/api/auth/signin" className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--accent-primary)] text-white font-medium text-lg hover:scale-105 transition-transform shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[var(--border)] text-white font-medium text-lg hover:bg-[var(--bg-elevated)] transition flex items-center justify-center gap-2">
               See How It Works
            </Link>
          </div>
        </div>
      </header>

      {/* Trust Bar */}
      <section className="py-12 border-y border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
          <p className="text-sm uppercase tracking-widest text-[var(--text-muted)]">Built for every kind of business</p>
        </div>
        <div className="flex whitespace-nowrap overflow-hidden opacity-50 text-[var(--text-secondary)] max-w-full relative">
          {/* We use a simple looping marquee in CSS */}
          <div className="flex gap-12 text-lg items-center px-12 animate-marquee">
            <span>Software & SaaS</span> • <span>Ecommerce</span> • <span>Creative Agency</span> • <span>Consulting</span> • <span>Real Estate</span> • <span>Personal Brand</span> • <span>Food & Beverage</span> • <span>Education</span> • <span>Non-Profit</span>
          </div>
        </div>
      </section>

      {/* Features / How It Works */}
      <section id="how-it-works" className="py-32 max-w-7xl mx-auto px-6 space-y-32">
        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center">
               <Share2 />
            </div>
            <h2 className="font-serif text-4xl text-white">Autonomous Social Posting</h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Connect your X, LinkedIn, Instagram, and TikTok accounts. Markopilot generates platform-optimised copy using AI, schedules it based on your content pillars, and publishes automatically. Never stare at a blank calendar again.
            </p>
          </div>
          <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl aspect-video w-full flex items-center justify-center text-[var(--text-muted)]">
            Illustration: Social Calendar
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center">
               <Users />
            </div>
            <h2 className="font-serif text-4xl text-white">Intelligent Lead Generation</h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Define your ideal customer profile and target titles. Our discovery engine searches the web, extracts verified contact information, and scores leads out of 100 based on their relevance to your brand.
            </p>
          </div>
          <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl aspect-video w-full flex items-center justify-center text-[var(--text-muted)]">
            Illustration: Lead Scoring
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center">
               <Send />
            </div>
            <h2 className="font-serif text-4xl text-white">Automated Email Outreach</h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Connect your Gmail account. We draft highly personalised, 3-paragraph cold outreach emails referencing the lead's company and your value prop. Sent directly from your outbox with controlled cadence to ensure high deliverability.
            </p>
          </div>
          <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl aspect-video w-full flex items-center justify-center text-[var(--text-muted)]">
            Illustration: Outreach Queue
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-white">Simple, transparent pricing.</h2>
            <p className="text-[var(--text-secondary)] text-lg">All plans include a 14-day free trial. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-medium text-white mb-2">Starter</h3>
              <div className="text-4xl font-serif text-white mb-6">$19<span className="text-lg text-[var(--text-muted)] font-sans">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-[var(--text-secondary)]">
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 1 Brand</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 30 Posts / month</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 100 Leads / month</li>
              </ul>
              <Link href="/api/auth/signin" className="w-full block text-center py-3 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-white hover:bg-[#2c2c31] transition">Start Free Trial</Link>
            </div>

            {/* Growth */}
            <div className="bg-[#15151a] border border-[var(--accent-primary)] rounded-3xl p-8 flex flex-col relative shadow-[0_0_30px_var(--accent-glow)] transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</div>
              <h3 className="text-xl font-medium text-white mb-2">Growth</h3>
              <div className="text-4xl font-serif text-white mb-6">$49<span className="text-lg text-[var(--text-muted)] font-sans">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-[var(--text-secondary)]">
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 3 Brands</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 150 Posts / month</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 500 Leads / month</li>
              </ul>
              <Link href="/api/auth/signin" className="w-full block text-center py-3 rounded-full bg-[var(--accent-primary)] text-white hover:bg-opacity-90 transition">Start Free Trial</Link>
            </div>

            {/* Scale */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-medium text-white mb-2">Scale</h3>
              <div className="text-4xl font-serif text-white mb-6">$99<span className="text-lg text-[var(--text-muted)] font-sans">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-[var(--text-secondary)]">
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 10 Brands</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 400 Posts / month</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-[var(--success)]" /> 2,000 Leads / month</li>
              </ul>
              <Link href="/api/auth/signin" className="w-full block text-center py-3 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-white hover:bg-[#2c2c31] transition">Start Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-32 text-center px-6">
        <h2 className="font-serif text-5xl md:text-6xl text-white mb-8">Stop marketing manually.</h2>
        <Link href="/api/auth/signin" className="inline-block px-10 py-4 rounded-full bg-[var(--accent-primary)] text-white font-medium text-xl hover:scale-105 transition-transform shadow-[0_0_30px_var(--accent-glow)]">
          Start Free Trial — No Card Needed
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-serif text-xl tracking-wider text-[var(--text-secondary)]">Markopilot</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link>
            <a href="mailto:hello@markopilot.com" className="hover:text-white transition">Contact</a>
          </div>
          <div>© 2026 Markopilot. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
