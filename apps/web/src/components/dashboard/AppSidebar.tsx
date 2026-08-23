"use client";

import { LayoutDashboard, Send, Users, Activity, Settings, ChevronDown, ChevronsLeft, ChevronsRight, Mail, Briefcase, Calendar, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useBrand } from "@/lib/brand-context";
import { replayTour } from "@/components/dashboard/OnboardingTour";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
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
      <div className={`h-16 flex items-center border-b border-[var(--border)] ${collapsed ? "justify-center px-0" : "px-6"}`}>
        <Link href="/dashboard" className="font-serif text-xl tracking-wide text-white overflow-hidden whitespace-nowrap">
          {collapsed ? "M" : "Markopilot"}
        </Link>
      </div>

      {/* Brand Switcher */}
      <div className={`p-4 relative ${collapsed ? "flex justify-center px-2" : ""}`} data-tour="brand-switcher">
        {isLoading ? (
          <div className={`bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl flex items-center gap-2 animate-pulse ${collapsed ? "w-11 h-11 justify-center p-0" : "w-full px-3 py-2"}`}>
            <div className="w-6 h-6 rounded-md bg-white/10 flex-shrink-0" />
            {!collapsed && <div className="h-4 w-24 bg-white/10 rounded" />}
          </div>
        ) : (
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            title={collapsed ? (activeBrand?.name || "Select Brand") : undefined}
            className={`flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm hover:border-[var(--accent-primary)] transition ${collapsed ? "w-11 h-11 justify-center p-0" : "w-full justify-between px-3 py-2"}`}
          >
            <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? "justify-center" : ""}`}>
              <div className="w-6 h-6 rounded-md bg-[var(--accent-primary)] text-white flex flex-shrink-0 items-center justify-center font-bold text-xs">
                {activeBrand?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {!collapsed && <span className="font-medium truncate">{activeBrand?.name || "Select Brand"}</span>}
            </div>
            {!collapsed && <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${switcherOpen ? "rotate-180" : ""}`} />}
          </button>
        )}

        {/* Dropdown */}
        {switcherOpen && !isLoading && (
          <div className={`absolute z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden ${collapsed ? "left-16 top-2 w-56" : "left-4 right-4 top-[calc(100%+4px)]"}`}>
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
      <nav data-tour="nav-links" className={`flex-1 space-y-1.5 overflow-y-auto ${collapsed ? "px-2" : "px-3"}`}>
        {links.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition-all ${collapsed
                  ? "w-11 h-11 mx-auto justify-center p-0"
                  : "gap-3 px-3 py-2.5"
                } ${active
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]/20"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"
                }`}
            >
              <link.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area with Settings and Quota */}
      <div className={`p-4 border-t border-[var(--border)] space-y-2 ${collapsed ? "px-2" : ""}`}>
        <Link
          href="/dashboard/settings"
          title={collapsed ? "Brand Settings" : undefined}
          className={`flex items-center rounded-xl text-sm font-medium transition-all ${collapsed ? "w-11 h-11 mx-auto justify-center p-0" : "gap-3 px-3 py-2"
            } ${isActive("/dashboard/settings") ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"}`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Brand Settings</span>}
        </Link>

        <Link
          href="/dashboard/account"
          title={collapsed ? "Account Settings" : undefined}
          className={`flex items-center rounded-xl text-sm font-medium transition-all ${collapsed ? "w-11 h-11 mx-auto justify-center p-0" : "gap-3 px-3 py-2"
            } ${isActive("/dashboard/account") ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]"}`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Account Settings</span>}
        </Link>

        {/* Quota Mini Widget */}
        {!collapsed && (
          <div data-tour="quota-widget" className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize font-medium text-white">{planName} Plan</span>
              <Link href="/dashboard/account" className="text-[var(--accent-primary)] hover:underline text-[10px]">Upgrade</Link>
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

        {!collapsed && (
          <button
            onClick={replayTour}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] rounded-xl transition"
          >
            <HelpCircle size={14} />
            <span>Replay Tour</span>
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`flex items-center justify-center text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-[var(--bg-elevated)] transition ${collapsed ? "w-11 h-8 mx-auto" : "w-full p-1.5"}`}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
