import { Bell, Menu, User, Power } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function AppTopbar() {
  const [automationActive, setAutomationActive] = useState(true);

  return (
    <header className="h-16 bg-[var(--bg-primary)] border-b border-[var(--border)] flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu (placeholder) */}
        <button className="md:hidden text-[var(--text-secondary)]"><Menu /></button>
        
        {/* Brand Context */}
        <div className="hidden md:flex items-center gap-3">
          <h2 className="text-lg font-medium text-white">Acme Corp</h2>
          <span className="px-2 py-0.5 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-xs font-medium">Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Master Automation Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">Automation</span>
          <button 
            onClick={() => setAutomationActive(!automationActive)}
            className={`w-11 h-6 rounded-full relative transition-colors ${automationActive ? "bg-[var(--accent-primary)]" : "bg-[var(--text-muted)]"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${automationActive ? "left-6" : "left-1"}`} />
          </button>
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-[var(--border)]" />

        {/* Notifications */}
        <button className="relative text-[var(--text-muted)] hover:text-white transition">
           <Bell size={20} />
           <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--error)] text-[10px] text-white flex items-center justify-center font-bold">2</span>
        </button>

        {/* User Dropdown */}
        <div className="relative group cursor-pointer">
           <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent-primary)] transition">
             <User size={16} className="text-[var(--text-muted)]" />
           </div>
           
           {/* Simple Hover Menu */}
           <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
             <div className="p-3 border-b border-[var(--border)]">
                <p className="text-sm font-medium text-white truncate">founder@acmecorp.co</p>
             </div>
             <div className="p-2 space-y-1">
                <Link href="/account" className="block px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface)] rounded-md transition">Account Settings</Link>
                <Link href="/account/billing" className="block px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface)] rounded-md transition">Manage Billing</Link>
             </div>
             <div className="p-2 border-t border-[var(--border)]">
               <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 rounded-md transition">
                 <Power size={14} /> Sign Out
               </button>
             </div>
           </div>
        </div>
      </div>
    </header>
  );
}
