"use client";

import { useSession, signOut } from "next-auth/react";
import { CreditCard, Trash2, BatteryCharging, User as UserIcon, LogOut, CheckCircle2, ShieldAlert, Smartphone, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useBrand } from "@/lib/brand-context";
import { PLANS, getPlanById } from "@/lib/plans";
import { MpesaCheckoutModal } from "@/components/dashboard/MpesaCheckoutModal";
import { apiGet } from "@/lib/api-client";

export default function AccountPage() {
   const { data: session } = useSession();
   const { user, refreshUser, refreshBrands } = useBrand();
   const [isDeleting, setIsDeleting] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [showMpesaModal, setShowMpesaModal] = useState(false);
   const [subscriptionData, setSubscriptionData] = useState<any>(null);

   const currentPlanDef = getPlanById(user?.planName || "starter");
   const limits = {
      leadsUsed: user?.quotaLeadsUsed || 0,
      leadsAllowed: user?.quotaLeadsPerMonth || currentPlanDef.leads,
      postsUsed: user?.quotaPostsUsed || 0,
      postsAllowed: user?.quotaPostsPerMonth || currentPlanDef.posts,
   };

   useEffect(() => {
      async function loadSub() {
         try {
            const data = await apiGet<any>("/subscriptions/status");
            setSubscriptionData(data);
         } catch (e) {
            console.error("Failed to load subscription status:", e);
         }
      }
      loadSub();
   }, []);

   const handleDeleteAccount = () => {
      setIsDeleting(true);
      setTimeout(() => {
         signOut({ callbackUrl: '/' });
      }, 1500);
   };

   const calculatePercentage = (used: number, total: any) => {
      const numTotal = typeof total === "number" ? total : parseInt(String(total).replace(/\D/g, "") || "100", 10);
      return Math.min(Math.round((used / numTotal) * 100), 100);
   };

   const isTrialing = user?.subscriptionStatus === "trialing";
   const isEnginePaused = subscriptionData?.isEnginePaused ?? false;

   return (
      <div className="space-y-8 animate-in fade-in max-w-4xl pb-12">
         <div>
            <h1 className="text-3xl font-serif text-white flex items-center gap-3">
               Account &amp; Subscription
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
               Manage your personal profile, Safaricom M-PESA billing, and autonomous quotas.
            </p>
         </div>

         {/* ENGINE PAUSED BANNER (IF EXPIRED) */}
         {isEnginePaused && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                     <h3 className="text-sm font-semibold text-white">Autonomous Engine Paused</h3>
                     <p className="text-xs text-amber-200/80 mt-0.5">
                        Your 7-day trial or monthly subscription has ended. Renew via M-PESA to resume autonomous lead extraction and posting.
                     </p>
                  </div>
               </div>
               <button
                  onClick={() => setShowMpesaModal(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition whitespace-nowrap shadow-lg shadow-emerald-500/20"
               >
                  <Smartphone size={14} /> Pay via M-PESA
               </button>
            </div>
         )}

         {/* PROFILE SECTION */}
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 slide-in-from-bottom-4 duration-300 animate-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
               <div className="flex items-center gap-5">
                  {session?.user?.image ? (
                     <img src={session.user.image} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-[var(--border)] object-cover" />
                  ) : (
                     <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-primary)] font-serif text-xl font-bold">
                        {session?.user?.name?.charAt(0) || "M"}
                     </div>
                  )}
                  <div>
                     <h2 className="text-xl font-medium text-white">{session?.user?.name || "Markopilot Founder"}</h2>
                     <p className="text-xs text-[var(--text-secondary)]">{session?.user?.email || "founder@domain.com"}</p>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--success)] bg-[var(--success)]/10 px-2.5 py-0.5 rounded-full border border-[var(--success)]/20">
                           Google Verified
                        </span>
                        {isTrialing ? (
                           <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                              <Clock size={10} /> 7-Day Free Trial
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 size={10} /> Active Subscription
                           </span>
                        )}
                     </div>
                  </div>
               </div>
               <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-white hover:border-gray-500 transition">
                  <LogOut size={14} /> Sign Out
               </button>
            </div>
         </div>

         {/* SUBSCRIPTION & BILLING */}
         <div className="grid md:grid-cols-2 gap-6 slide-in-from-bottom-6 duration-500 animate-in">
            {/* Current Plan */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-center mb-6">
                     <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shadow-lg border border-emerald-500/20">
                        <Smartphone size={24} />
                     </div>
                     <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                        {isTrialing ? "Free Trial" : "M-PESA Subscription"}
                     </span>
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-1">{currentPlanDef.name} Plan</h3>
                  <div className="text-sm text-emerald-400 font-semibold mb-4">
                     {currentPlanDef.price} <span className="text-xs text-[var(--text-muted)] font-normal">/ month</span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
                     {isTrialing 
                        ? "You are currently exploring on the 7-day free trial. Upgrade anytime to ensure uninterrupted autonomous runs."
                        : "Billed monthly via Safaricom M-PESA STK Push & Business Till 1635990."}
                  </p>

                  <ul className="space-y-2.5 mb-8 text-xs text-[var(--text-secondary)]">
                     <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> {currentPlanDef.posts} per month
                     </li>
                     <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> {currentPlanDef.leads} verified leads
                     </li>
                     <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> {currentPlanDef.brands} capacity
                     </li>
                  </ul>
               </div>

               <button 
                  onClick={() => setShowMpesaModal(true)} 
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex justify-center items-center gap-2 transition shadow-lg shadow-emerald-500/20"
               >
                  <Smartphone size={16} /> Upgrade / Pay via M-PESA <ArrowUpRight size={14} />
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
                        <h3 className="font-serif text-white text-lg">Monthly Capacity</h3>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Autonomous usage this cycle</p>
                     </div>
                  </div>

                  {/* Discovery Quota */}
                  <div className="mb-6">
                     <div className="flex justify-between items-center text-xs font-medium mb-2">
                        <span className="text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Leads Extracted</span>
                        <span className="text-white font-mono">{limits.leadsUsed.toLocaleString()} <span className="text-[var(--text-muted)]">/ {limits.leadsAllowed}</span></span>
                     </div>
                     <div className="w-full h-2 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(limits.leadsUsed, limits.leadsAllowed)}%` }}></div>
                     </div>
                  </div>

                  {/* Posting Quota */}
                  <div className="mb-2">
                     <div className="flex justify-between items-center text-xs font-medium mb-2">
                        <span className="text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Social Posts Published</span>
                        <span className="text-white font-mono">{limits.postsUsed.toLocaleString()} <span className="text-[var(--text-muted)]">/ {limits.postsAllowed}</span></span>
                     </div>
                     <div className="w-full h-2 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(limits.postsUsed, limits.postsAllowed)}%` }}></div>
                     </div>
                  </div>
               </div>

               <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-400">
                  <span>M-PESA Business Till: </span>
                  <span className="font-mono text-white font-semibold">1635990</span>
                  <span className="block text-[10px] text-gray-500 mt-1">Direct Safaricom Buy Goods integration</span>
               </div>
            </div>
         </div>

         {/* DANGER ZONE */}
         <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 mt-12 slide-in-from-bottom-8 duration-700 animate-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h3 className="text-red-400 font-medium text-base flex items-center gap-2"><Trash2 size={18} /> Danger Zone</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
                     Permanently delete your account and halt all background automation engines.
                  </p>
               </div>
               <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500 hover:text-white transition whitespace-nowrap">
                  Delete Account
               </button>
            </div>
         </div>

         {/* M-PESA CHECKOUT MODAL */}
         <MpesaCheckoutModal
            isOpen={showMpesaModal}
            onClose={() => setShowMpesaModal(false)}
            initialPlanId={user?.planName?.toLowerCase() || "starter"}
            onSuccess={() => {
               refreshUser();
               refreshBrands();
            }}
         />

         {/* DELETE CONFIRMATION MODAL */}
         {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-[var(--border)]">
                     <h2 className="text-xl font-serif text-white flex items-center gap-2"><ShieldAlert className="text-red-500" /> Confirm Account Deletion</h2>
                  </div>
                  <div className="p-6 space-y-4 text-sm text-[var(--text-secondary)]">
                     <p>Are you entirely sure you want to delete your account?</p>
                     <ul className="list-disc pl-5 space-y-2 text-xs">
                        <li>All automation polling and lead discovery stops immediately.</li>
                        <li>Pending outreach emails are cancelled.</li>
                        <li>Your account data is scheduled for GDPR hard-deletion.</li>
                     </ul>
                  </div>
                  <div className="p-4 border-t border-[var(--border)] bg-[#111114] flex justify-end gap-3">
                     <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-white text-xs hover:bg-[var(--bg-surface)] transition">Cancel</button>
                     <button onClick={handleDeleteAccount} disabled={isDeleting} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition disabled:opacity-50 min-w-[100px]">
                        {isDeleting ? "Deleting..." : "Delete Account"}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
