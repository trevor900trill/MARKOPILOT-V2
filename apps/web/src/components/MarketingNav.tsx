import Link from "next/link";
import { Menu } from "lucide-react";

export function MarketingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--bg-primary)]/70 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-serif tracking-wide text-white">Markopilot</Link>
        <div className="hidden md:flex items-center gap-8 text-[var(--text-secondary)]">
          <Link href="/#how-it-works" className="hover:text-white transition">How It Works</Link>
          <Link href="/#pricing" className="hover:text-white transition">Pricing</Link>
        </div>
        <div className="hidden md:block">
          <Link href="/api/auth/signin" className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:bg-opacity-90 transition shadow-[0_0_15px_var(--accent-glow)]">
            Start Free Trial
          </Link>
        </div>
        <button className="md:hidden text-white"><Menu /></button>
      </div>
    </nav>
  );
}
