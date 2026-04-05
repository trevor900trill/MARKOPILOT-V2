import { LayoutDashboard, Send, Users, Activity, Settings, Plus, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Placeholder data
  const planName = "Growth";
  const postsUsed = 45;
  const postsAllowed = 150;
  const leadsUsed = 120;
  const leadsAllowed = 500;

  const links = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Social Posting", href: "/dashboard/social", icon: Send },
    { name: "Lead Generation", href: "/dashboard/leads", icon: Users },
    { name: "Email Outreach", href: "/dashboard/outreach", icon: Send }, // Using send for outreach too, or Mail
    { name: "Activity Log", href: "/dashboard/activity", icon: Activity },
  ];

  return (
    <aside className={`bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"} hidden md:flex`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)]">
        <Link href="/dashboard" className="font-serif text-xl tracking-wide text-white overflow-hidden whitespace-nowrap">
           {collapsed ? "M" : "Markopilot"}
        </Link>
      </div>

      {/* Brand Switcher */}
      <div className="p-4">
        <button className="w-full flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm hover:border-[var(--accent-primary)] transition">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-md bg-[var(--accent-primary)] text-white flex flex-shrink-0 items-center justify-center font-bold">A</div>
            {!collapsed && <span className="font-medium truncate">Acme Corp</span>}
          </div>
          {!collapsed && <ChevronDown size={14} className="text-[var(--text-muted)]" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition group">
             <link.icon size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] flex-shrink-0" />
             {!collapsed && <span className="text-sm font-medium">{link.name}</span>}
          </Link>
        ))}
        {!collapsed && <hr className="my-4 border-[var(--border)] mx-3" />}
        <Link href="/account" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition group">
            <Settings size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Account Settings</span>}
        </Link>
      </nav>

      {/* Footer Quotas */}
      {!collapsed && (
        <div className="p-4 border-t border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">{planName} Plan</span>
            <Link href="/account" className="text-xs text-[var(--accent-primary)] hover:underline">Upgrade</Link>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                 <span>Posts</span>
                 <span>{postsUsed} / {postsAllowed}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${(postsUsed/postsAllowed)*100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                 <span>Leads</span>
                 <span>{leadsUsed} / {leadsAllowed}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${(leadsUsed/leadsAllowed)*100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button onClick={() => setCollapsed(!collapsed)} className="h-10 border-t border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition">
         {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>
    </aside>
  );
}
