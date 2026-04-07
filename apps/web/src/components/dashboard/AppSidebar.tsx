"use client";

import { LayoutDashboard, Send, Users, Activity, Settings, ChevronDown, ChevronsLeft, ChevronsRight, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useBrand } from "@/lib/brand-context";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const { brands, activeBrand, setActiveBrandId, user } = useBrand();

  const planName = user?.planName || "Starter";
  const postsUsed = user?.quotaPostsUsed || 0;
  const postsAllowed = user?.quotaPostsPerMonth || 30;
  const leadsUsed = user?.quotaLeadsUsed || 0;
  const leadsAllowed = user?.quotaLeadsPerMonth || 100;
  const brandsUsed = user?.quotaBrandsUsed || 0;
  const brandsAllowed = user?.quotaBrandsAllowed || 1;

  const links = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Social Posting", href: "/dashboard/social", icon: Send },
    { name: "Lead Generation", href: "/dashboard/leads", icon: Users },
    { name: "Email Outreach", href: "/dashboard/outreach", icon: Mail },
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
      <div className="p-4 relative">
        <button
          onClick={() => setSwitcherOpen(!switcherOpen)}
          className="w-full flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm hover:border-[var(--accent-primary)] transition"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-md bg-[var(--accent-primary)] text-white flex flex-shrink-0 items-center justify-center font-bold text-xs">
              {activeBrand?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {!collapsed && <span className="font-medium truncate">{activeBrand?.name || "Select Brand"}</span>}
          </div>
          {!collapsed && <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${switcherOpen ? "rotate-180" : ""}`} />}
        </button>

        {/* Dropdown */}
        {switcherOpen && !collapsed && (
          <div className="absolute left-4 right-4 top-[calc(100%+4px)] z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => { setActiveBrandId(brand.id); setSwitcherOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--bg-surface)] transition flex items-center gap-2 ${brand.id === activeBrand?.id ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}`}
              >
                <div className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold ${brand.id === activeBrand?.id ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]"}`}>
                  {brand.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{brand.name}</span>
              </button>
            ))}
            <Link
              href="/onboarding"
              onClick={() => setSwitcherOpen(false)}
              className="w-full block text-left px-3 py-2.5 text-sm text-[var(--accent-primary)] hover:bg-[var(--bg-surface)] transition border-t border-[var(--border)]"
            >
              + New Brand
            </Link>
          </div>
        )}
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
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition group">
            <Settings size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Brand Settings</span>}
        </Link>
        <Link href="/account" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition group">
            <Settings size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Account Settings</span>}
        </Link>
      </nav>

      {/* Footer Quotas */}
      {!collapsed && (
        <div className="p-4 border-t border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white capitalize">{planName} Plan</span>
            <Link href="/account" className="text-xs text-[var(--accent-primary)] hover:underline">Upgrade</Link>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                 <span>Posts</span>
                 <span>{postsUsed} / {postsAllowed}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-700" style={{ width: `${postsAllowed > 0 ? (postsUsed/postsAllowed)*100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                 <span>Leads</span>
                 <span>{leadsUsed} / {leadsAllowed}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-700" style={{ width: `${leadsAllowed > 0 ? (leadsUsed/leadsAllowed)*100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                 <span>Brands</span>
                 <span>{brandsUsed} / {brandsAllowed}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-700" style={{ width: `${brandsAllowed > 0 ? (brandsUsed/brandsAllowed)*100 : 0}%` }} />
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
