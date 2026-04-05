import Link from "next/link";

export function MarketingFooter() {
  return (
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
  );
}
