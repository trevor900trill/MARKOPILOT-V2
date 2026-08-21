import Link from "next/link";
import { ArrowLeft, Home, LayoutDashboard, Rocket } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col justify-between selection:bg-[var(--accent-primary)] selection:text-white relative overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(124,110,255,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)] pointer-events-none" />

      {/* Top bar with Logo */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-sm group-hover:border-white/20 transition-all">
            <Rocket size={16} />
          </div>
          <span className="text-xl font-serif tracking-tight font-medium text-white/90 group-hover:text-white transition-colors">
            Markopilot
          </span>
        </Link>
      </header>

      {/* Main 404 content */}
      <main className="max-w-xl mx-auto px-6 text-center space-y-6 relative z-10 py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
          Error 404 • Signal Lost
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-white tracking-tight leading-tight">
          Page not found in our orbit.
        </h1>

        <p className="text-gray-400 text-base md:text-lg font-light leading-relaxed max-w-md mx-auto">
          The telemetry endpoint or page you requested could not be located. It may have moved or been decommissioned.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            <LayoutDashboard size={16} />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-200 font-medium text-sm hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Back to Homepage
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-white/5 text-center text-xs text-gray-400 relative z-10">
        <p>© {new Date().getFullYear()} Markopilot. Autonomous marketing &amp; B2B lead intelligence.</p>
      </footer>
    </div>
  );
}
