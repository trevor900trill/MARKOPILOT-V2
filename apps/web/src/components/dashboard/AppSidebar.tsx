"use client";

import { LayoutDashboard, Send, Users, Activity, Settings, ChevronDown, ChevronsLeft, ChevronsRight, Mail, Briefcase, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useBrand } from "@/lib/brand-context";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { brands, activeBrand, setActiveBrandId, user, isLoading } = useBrand();

  const planName = user?.planName || "Starter";
  const postsUsed = user?.quotaPostsUsed || 0;
  const postsAllowed = user?.quotaPostsPerMonth || 45;
  const leadsUsed = user?.quotaLeadsUsed || 0;
  const leadsAllowed = user?.quotaLeadsPerMonth || 150;
  const brandsUsed = user?.quotaBrandsUsed || 0;
  const brandsAllowed = user?.quotaBrandsAllowed || 1;

  const links = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { name: "Brands", href: "/dashboard/brands", icon: Briefcase },
    { name: "Calendar & Schedule", href: "/dashboard/calendar", icon: Calendar },
    { name: "Social Posting", href: "/dashboard/social", icon: Send },
    { name: "Lead Generation", href: "/dashboard/leads", icon: Users },
    { name: "Email Outreach", href: "/dashboard/outreach", icon: Mail },
    { name: "Activity Log", href: "/dashboard/activity", icon: Activity },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

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
        {isLoading ? (
          <div className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 flex items-center gap-2 animate-pulse">
            <div className="w-6 h-6 rounded-md bg-white/10 flex-shrink-0" />
            {!collapsed && <div className="h-4 w-24 bg-white/10 rounded" />}
          </div>
        ) : (
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
        )}

        {/* Dropdown */}
        {switcherOpen && !collapsed && !isLoading && (
          <div className="absolute left-4 right-4 top-[calc(100%+4px)] z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => { setActiveBrandId(brand.id); setSwitcherOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--bg-surface)] transition flex items-center gap-2 ${brand.id === activeBrand?.id ? "text-[var(--accent-primary)] font-medium" : "text-[var(--text-secondary)]"}`}
              >
                <div className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold ${brand.id === activeBrand?.id ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]"}`}>
                  {brand.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{brand.name}</span>
              </button>
            ))}
            <div className="p-2 border-t border-[var(--border)]">
              <Link
                href="/dashboard/brands"
                onClick={() => setSwitcherOpen(false)}
                className="w-full block text-center px-3 py-2 text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--bg-surface)] transition rounded-lg"
              >
                Manage All Brands
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]/20" : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"}`}
            >
              <link.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area with Settings and Quota */}
      <div className="p-4 border-t border-[var(--border)] space-y-3">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive("/dashboard/settings") ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"}`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Brand Settings</span>}
        </Link>

        <Link
          href="/account"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive("/account") ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"}`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Account Settings</span>}
        </Link>

        {/* Quota Mini Widget */}
        {!collapsed && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize font-medium text-white">{planName} Plan</span>
              <Link href="/pricing" className="text-[var(--accent-primary)] hover:underline text-[10px]">Upgrade</Link>
            </div>

            {isLoading ? (
              <div className="space-y-2 animate-pulse pt-1">
                <div className="h-2 bg-white/10 rounded-full w-full" />
                <div className="h-2 bg-white/10 rounded-full w-full" />
                <div className="h-2 bg-white/10 rounded-full w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Posts</span>
                    <span>{postsUsed} / {postsAllowed}</span>
                  </div>
                  <div className="w-full bg-[var(--bg-surface)] rounded-full h-1 overflow-hidden">
                    <div className="bg-[var(--accent-primary)] h-1 rounded-full" style={{ width: `${Math.min(100, (postsUsed / postsAllowed) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Leads</span>
                    <span>{leadsUsed} / {leadsAllowed}</span>
                  </div>
                  <div className="w-full bg-[var(--bg-surface)] rounded-full h-1 overflow-hidden">
                    <div className="bg-[var(--accent-primary)] h-1 rounded-full" style={{ width: `${Math.min(100, (leadsUsed / leadsAllowed) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Brands</span>
                    <span>{brandsUsed} / {brandsAllowed}</span>
                  </div>
                  <div className="w-full bg-[var(--bg-surface)] rounded-full h-1 overflow-hidden">
                    <div className="bg-[var(--accent-primary)] h-1 rounded-full" style={{ width: `${Math.min(100, (brandsUsed / brandsAllowed) * 100)}%` }}></div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-[var(--bg-elevated)] transition"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
