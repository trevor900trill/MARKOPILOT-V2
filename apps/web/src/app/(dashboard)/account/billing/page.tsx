"use client";

import { useSession } from "next-auth/react";
import { CreditCard, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function BillingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  // Placeholder data that would come from API
  const currentPlan: string = "Starter";
  const status: string = "active";
  const renewalDate = "April 29, 2026";

  const handleCheckout = async (planId: string) => {
    setLoading(true);
    try {
      // Typically we'd call our .NET endpoint which returns a LemonSqueezy checkout URL
      // const res = await fetchClientApi(`/subscriptions/checkout?plan=${planId}`);
      // window.location.href = res.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl">
      <h1 className="text-3xl font-serif text-white">Billing & Plan</h1>

      {/* Current Plan Overview */}
      <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
             <h2 className="text-2xl font-medium text-white">{currentPlan} Plan</h2>
             {status === "active" ? (
               <span className="px-2 py-0.5 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-xs font-medium uppercase tracking-wider">Active</span>
             ) : (
               <span className="px-2 py-0.5 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-xs font-medium uppercase tracking-wider">Past Due</span>
             )}
           </div>
           <p className="text-[var(--text-secondary)]">Your subscription renews automatically on {renewalDate}.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button className="flex-1 md:flex-none px-5 py-2.5 rounded-full border border-[var(--border)] text-white font-medium hover:bg-[var(--bg-surface)] transition flex gap-2 items-center justify-center">
              Customer Portal
           </button>
        </div>
      </section>

      {/* Quotas */}
      <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
         <h3 className="text-lg font-medium text-white mb-6">Monthly Utilization</h3>
         <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm text-white mb-2">
                 <span className="flex items-center gap-2">Accounts Included</span>
                 <span className="text-[var(--text-secondary)]">1 / 1</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-white mb-2">
                 <span className="flex items-center gap-2">Social Posts</span>
                 <span className="text-[var(--text-secondary)]">14 / 30</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: '46%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-white mb-2">
                 <span className="flex items-center gap-2">Lead Generation</span>
                 <span className="text-[var(--text-secondary)]">88 / 100</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
         </div>
         <div className="mt-6 flex items-start gap-3 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-xl text-[var(--warning)] text-sm">
            <AlertTriangle className="flex-shrink-0" size={18} />
            <p>You are approaching your lead generation limit. Upgrade to the Growth plan to unlock 500 leads per month.</p>
         </div>
      </section>

      {/* Available Plans */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-white">Upgrade Plan</h3>
        <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border transition ${currentPlan === 'Growth' ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]' : 'border-[var(--border)] bg-[var(--bg-elevated)]'}`}>
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-xl font-medium text-white">Growth</h3>
                   <div className="text-3xl font-serif text-white mt-1">$49<span className="text-sm text-[var(--text-muted)] font-sans">/mo</span></div>
                 </div>
                 {currentPlan === 'Growth' && <span className="bg-[var(--accent-primary)] text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold">Current</span>}
               </div>
               <ul className="space-y-3 mb-6 text-sm text-[var(--text-secondary)]">
                 <li className="flex items-center gap-2"><Check size={16} className="text-[var(--success)]" /> 3 Brands</li>
                 <li className="flex items-center gap-2"><Check size={16} className="text-[var(--success)]" /> 150 Posts / month</li>
                 <li className="flex items-center gap-2"><Check size={16} className="text-[var(--success)]" /> 500 Leads / month</li>
               </ul>
               <button onClick={() => handleCheckout('growth')} disabled={currentPlan === 'Growth'} className={`w-full py-2.5 rounded-full font-medium transition ${currentPlan === 'Growth' ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--accent-primary)] text-white hover:opacity-90'}`}>
                 {currentPlan === 'Growth' ? 'Current Plan' : 'Upgrade to Growth'}
               </button>
            </div>

            <div className={`p-6 rounded-2xl border transition ${currentPlan === 'Scale' ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]' : 'border-[var(--border)] bg-[var(--bg-elevated)]'}`}>
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-xl font-medium text-white">Scale</h3>
                   <div className="text-3xl font-serif text-white mt-1">$99<span className="text-sm text-[var(--text-muted)] font-sans">/mo</span></div>
                 </div>
                 {currentPlan === 'Scale' && <span className="bg-[var(--accent-primary)] text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold">Current</span>}
               </div>
               <ul className="space-y-3 mb-6 text-sm text-[var(--text-secondary)]">
                 <li className="flex items-center gap-2"><Check size={16} className="text-[var(--success)]" /> 10 Brands</li>
                 <li className="flex items-center gap-2"><Check size={16} className="text-[var(--success)]" /> 400 Posts / month</li>
                 <li className="flex items-center gap-2"><Check size={16} className="text-[var(--success)]" /> 2,000 Leads / month</li>
               </ul>
               <button onClick={() => handleCheckout('scale')} disabled={currentPlan === 'Scale'} className={`w-full py-2.5 rounded-full font-medium transition ${currentPlan === 'Scale' ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--accent-primary)] text-white hover:opacity-90'}`}>
                 {currentPlan === 'Scale' ? 'Current Plan' : 'Upgrade to Scale'}
               </button>
            </div>
        </div>
      </section>

    </div>
  );
}
