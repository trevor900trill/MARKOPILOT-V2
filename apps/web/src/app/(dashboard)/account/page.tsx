"use client";

import { useSession } from "next-auth/react";
import { CreditCard, ExternalLink, Trash2, BatteryCharging, User as UserIcon, LogOut, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function AccountPage() {
   const { data: session } = useSession();
   const [isDeleting, setIsDeleting] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);

   // Mocking quotas for Sprint 1 demo
   const currentPlan = "Growth Tier";
   const limits = {
      leadsUsed: 2100,
      leadsAllowed: 5000,
      postsUsed: 140,
      postsAllowed: 300,
      cycleCurrent: "Oct 12, 2026",
      cycleEnd: "Nov 12, 2026"
   };

   const handleManageBilling = () => {
      // Trigger API to generate Lemon Squeezy portal URL, then redirect
      window.location.href = "https://app.lemonsqueezy.com/my-orders/";
   };

   const handleDeleteAccount = () => {
      setIsDeleting(true);
      setTimeout(() => {
         // Mock successful API response
         signOut({ callbackUrl: '/' });
      }, 1500);
   };

   const calculatePercentage = (used: number, total: number) => {
      return Math.min(Math.round((used / total) * 100), 100);
   };

   return (
      <div className="space-y-8 animate-in fade-in max-w-4xl pb-12">
         <div>
            <h1 className="text-3xl font-serif text-white flex items-center gap-3">
               Account Management
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">Manage your personal profile, billing preferences, and platform quotas.</p>
         </div>

         {/* PROFILE SECTION */}
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 slide-in-from-bottom-4 duration-300 animate-in">
            <div className="flex justify-between items-start mb-8">
               <div className="flex items-center gap-5">
                  {session?.user?.image ? (
                     <img src={session.user.image} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-[var(--border)] object-cover" />
                  ) : (
                     <div className="w-20 h-20 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-primary)]">
                        <UserIcon size={32} />
                     </div>
                  )}
                  <div>
                     <h2 className="text-2xl font-medium text-white">{session?.user?.name || "Markopilot Pilot"}</h2>
                     <p className="text-[var(--text-secondary)]">{session?.user?.email || "loading@email.com"}</p>
                     <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--success)] bg-[var(--success)]/10 px-2.5 py-1 rounded-full border border-[var(--success)]/20 mt-3">
                        Google Managed Account
                     </span>
                  </div>
               </div>
               <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:border-gray-500 transition">
                  <LogOut size={16} /> Sign Out
               </button>
            </div>
         </div>

         {/* SUBSCRIPTION & BILLING */}
         <div className="grid md:grid-cols-2 gap-6 slide-in-from-bottom-6 duration-500 animate-in">
            {/* Current Plan */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-center mb-6">
                     <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shadow-lg border border-purple-500/20">
                        <CreditCard size={24} />
                     </div>
                     <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold">Active Subscription</span>
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-2">{currentPlan}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-6">
                     You are billed $99 automatically. Your next billing date is <span className="text-white font-medium">{limits.cycleEnd}</span>.
                  </p>
                  <ul className="space-y-2 mb-8">
                     <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 size={16} className="text-[var(--success)]" /> 5 Active Brands</li>
                     <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 size={16} className="text-[var(--success)]" /> AI Content Generation</li>
                     <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 size={16} className="text-[var(--success)]" /> Unbranded Emails</li>
                  </ul>
               </div>
               <button onClick={handleManageBilling} className="w-full py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-white font-medium hover:border-[var(--accent-primary)] flex justify-center items-center gap-2 transition">
                  Manage Billing using Lemon Squeezy <ExternalLink size={16} />
               </button>
            </div>

            {/* Quota Usage */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
               <div>
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shadow-lg border border-blue-500/20">
                        <BatteryCharging size={24} />
                     </div>
                     <div>
                        <h3 className="font-serif text-white text-lg">Monthly Automation Quotas</h3>
                        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Cycle resets on {limits.cycleEnd}</p>
                     </div>
                  </div>

                  {/* Discovery Quota */}
                  <div className="mb-6">
                     <div className="flex justify-between items-center text-sm font-medium mb-2">
                        <span className="text-[var(--text-secondary)] uppercase tracking-wider text-[11px]">Leads Discovered</span>
                        <span className="text-white font-mono">{limits.leadsUsed.toLocaleString()} <span className="text-[var(--text-muted)]">/ {limits.leadsAllowed.toLocaleString()}</span></span>
                     </div>
                     <div className="w-full h-2.5 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(limits.leadsUsed, limits.leadsAllowed)}%` }}></div>
                     </div>
                  </div>

                  {/* Posting Quota */}
                  <div className="mb-2">
                     <div className="flex justify-between items-center text-sm font-medium mb-2">
                        <span className="text-[var(--text-secondary)] uppercase tracking-wider text-[11px]">Social Posts Published</span>
                        <span className="text-white font-mono">{limits.postsUsed.toLocaleString()} <span className="text-[var(--text-muted)]">/ {limits.postsAllowed.toLocaleString()}</span></span>
                     </div>
                     <div className="w-full h-2.5 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(limits.postsUsed, limits.postsAllowed)}%` }}></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* DANGER ZONE */}
         <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 mt-12 slide-in-from-bottom-8 duration-700 animate-in">
            <div className="flex justify-between items-center">
               <div>
                  <h3 className="text-red-400 font-medium text-lg flex items-center gap-2"><Trash2 size={20} /> Danger Zone</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
                     Permanently delete your account. This halts all background automation jobs, cancels your Lemon Squeezy subscription, and schedules your data for hard-deletion.
                  </p>
               </div>
               <button onClick={() => setShowDeleteModal(true)} className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-500 font-medium hover:bg-red-500 hover:text-white transition whitespace-nowrap">
                  Delete Account
               </button>
            </div>
         </div>

         {/* DELETE CONFIRMATION MODAL */}
         {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-[var(--border)]">
                     <h2 className="text-xl font-serif text-white flex items-center gap-2"><ShieldAlert className="text-red-500" /> Confirm Account Deletion</h2>
                  </div>
                  <div className="p-6 space-y-4 text-sm text-[var(--text-secondary)]">
                     <p>Are you entirely sure you want to delete your payload configuration?</p>
                     <ul className="list-disc pl-5 space-y-2">
                        <li>All automation polling stops immediately.</li>
                        <li>Pending outreach emails are aborted.</li>
                        <li>Your active subscription via Lemon Squeezy is canceled synchronously.</li>
                        <li>GDPR hard-deletion is queued for 30 days.</li>
                     </ul>
                     <div className="pt-4">
                        <label className="text-xs uppercase tracking-wider font-bold mb-2 block">To verify, type "permanently delete"</label>
                        <input type="text" className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-white outline-none focus:border-red-500 transition" />
                     </div>
                  </div>
                  <div className="p-4 border-t border-[var(--border)] bg-[#111114] flex justify-end gap-3">
                     <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2 rounded-xl border border-[var(--border)] text-white hover:bg-[var(--bg-surface)] transition">Cancel</button>
                     <button onClick={handleDeleteAccount} disabled={isDeleting} className="px-5 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50 min-w-[120px]">
                        {isDeleting ? "Deleting..." : "Delete Account"}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
