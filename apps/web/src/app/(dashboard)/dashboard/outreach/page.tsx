"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, CheckCircle2, AlertCircle, Settings, Send, Clock, Eye, Play, Pause, RefreshCw, Edit2, FileCheck, XCircle, CheckCheck, AlertTriangle, Smartphone } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPut, apiDelete } from "@/lib/api-client";
import { MpesaCheckoutModal } from "@/components/dashboard/MpesaCheckoutModal";
import { toast } from "sonner";

type OutreachEmail = {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyText: string;
  status: string;
  sentAt?: string;
  generatedAt: string;
};

export default function OutreachPage() {
  const { activeBrand, user, refreshUser, refreshBrands } = useBrand();
  const [activeTab, setActiveTab] = useState<"overview" | "review" | "logs" | "settings">("overview");
  
  const isGmailConnected = activeBrand?.gmailConnected ?? false;
  const [isConnecting, setIsConnecting] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);

  const isSubscriptionActive = user?.isSubscriptionActive ?? true;
  
  const [dailyLimit, setDailyLimit] = useState(50);
  const [delayHours, setDelayHours] = useState(4);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [pendingEmails, setPendingEmails] = useState<OutreachEmail[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<OutreachEmail | null>(null);
  const [editingEmail, setEditingEmail] = useState<OutreachEmail | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  useEffect(() => {
    if (activeBrand) {
      setIsAutomationEnabled(activeBrand.automationOutreachEnabled);
      setDailyLimit((activeBrand as any).automationOutreachDailyLimit ?? 50);
      setDelayHours((activeBrand as any).automationOutreachDelayHours ?? 4);
      setRequireApproval((activeBrand as any).requireEmailApproval ?? false);
    }
  }, [activeBrand]);

  const fetchEmails = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const [queuedRes, sentRes] = await Promise.all([
        apiGet<{ data: OutreachEmail[] }>(`/outreach/${activeBrand.id}/queue`),
        apiGet<{ data: OutreachEmail[] }>(`/outreach/${activeBrand.id}/sent`),
      ]);
      setEmails([...(queuedRes.data || []), ...(sentRes.data || [])]);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand]);

  const fetchPendingEmails = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const res = await apiGet<{ data: OutreachEmail[]; total: number }>(`/outreach/${activeBrand.id}/pending`);
      setPendingEmails(res.data || []);
      setPendingTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to fetch pending emails:", err);
      setPendingEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand]);

  useEffect(() => {
    if (activeTab === "logs" && activeBrand) fetchEmails();
    if (activeTab === "review" && activeBrand) fetchPendingEmails();
  }, [activeTab, activeBrand, fetchEmails, fetchPendingEmails]);

  const handleApproveEmail = async (emailId: string) => {
    if (!activeBrand) return;
    setIsApproving(emailId);
    try {
      await apiPut(`/outreach/${activeBrand.id}/${emailId}/approve`, {});
      setPendingEmails(prev => prev.filter(e => e.id !== emailId));
      setPendingTotal(prev => prev - 1);
    } catch (err) {
      console.error("Failed to approve email:", err);
    } finally {
      setIsApproving(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!activeBrand || pendingEmails.length === 0) return;
    setIsApproving("bulk");
    try {
      await apiPut(`/outreach/${activeBrand.id}/bulk-approve`, { emailIds: pendingEmails.map(e => e.id) });
      setPendingEmails([]);
      setPendingTotal(0);
    } catch (err) {
      console.error("Failed to bulk approve:", err);
    } finally {
      setIsApproving(null);
    }
  };

  const handleRejectEmail = async (emailId: string) => {
    if (!activeBrand) return;
    try {
      await apiDelete(`/outreach/${activeBrand.id}/${emailId}/reject`);
      setPendingEmails(prev => prev.filter(e => e.id !== emailId));
      setPendingTotal(prev => prev - 1);
    } catch (err) {
      console.error("Failed to reject email:", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeBrand || !editingEmail) return;
    setIsSaving(true);
    try {
      await apiPut(`/outreach/${activeBrand.id}/${editingEmail.id}/edit`, {
        subject: editSubject,
        bodyText: editBody,
        bodyHtml: `<p>${editBody.replace(/\n/g, "</p><p>")}</p>`,
      });
      setPendingEmails(prev => prev.map(e => e.id === editingEmail.id ? { ...e, subject: editSubject, bodyText: editBody } : e));
      setEditingEmail(null);
    } catch (err) {
      console.error("Failed to save edit:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGmail = async () => {
    if (!activeBrand) return;
    setIsConnecting(true);
    try {
      const res = await apiGet<{ authUrl: string }>(`/social/${activeBrand.id}/connect/gmail`);
      if (res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err) {
      console.error("Failed to get Gmail OAuth URL:", err);
      alert("Failed to initiate Gmail connection.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!activeBrand) return;
    try {
      await apiDelete(`/social/${activeBrand.id}/disconnect/gmail`);
      await refreshBrands();
    } catch (err) {
      console.error("Failed to disconnect Gmail:", err);
    }
  };

  const handleCancelEmail = async (emailId: string) => {
    if (!activeBrand) return;
    try {
      await apiDelete(`/outreach/${activeBrand.id}/${emailId}`);
      setEmails(emails.filter(e => e.id !== emailId));
    } catch (err) {
      console.error("Failed to cancel email:", err);
    }
  };

  const handleSaveSettings = async () => {
    if (!activeBrand) return;
    if (isAutomationEnabled && !isSubscriptionActive) {
      toast.error("Cannot enable outreach: your free trial or subscription has expired. Please renew via M-PESA.");
      setShowMpesaModal(true);
      return;
    }
    setIsSaving(true);
    try {
      await apiPut(`/brands/${activeBrand.id}`, {
        ...activeBrand,
        automationOutreachEnabled: isAutomationEnabled,
        automationOutreachDailyLimit: dailyLimit,
        automationOutreachDelayHours: delayHours,
        requireEmailApproval: requireApproval,
      });
      await refreshBrands();
      toast.success("Outreach settings saved.");
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      if (err?.code === "ENGINE_PAUSED") {
        toast.error("Your engine is paused due to expired subscription. Please pay via M-PESA.");
        setShowMpesaModal(true);
      } else {
        toast.error(err?.message || "Failed to save settings.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "sent": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/20 tracking-wider flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Sent</span>;
      case "queued": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider flex items-center gap-1 w-max"><Clock size={12}/> Queued</span>;
      case "pending_approval": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider flex items-center gap-1 w-max"><Eye size={12}/> Review</span>;
      case "rejected": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-300 border border-red-500/20 tracking-wider flex items-center gap-1 w-max"><XCircle size={12}/> Rejected</span>;
      case "failed": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20 tracking-wider flex items-center gap-1 w-max"><AlertCircle size={12}/> Failed</span>;
      case "cancelled": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 tracking-wider flex items-center gap-1 w-max">Cancelled</span>;
      default: return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-[var(--border)] text-[var(--text-muted)] tracking-wider">{status}</span>;
    }
  };

  const queuedCount = emails.filter(e => e.status === 'queued').length;
  const sentCount = emails.filter(e => e.status === 'sent').length;

  return (
    <div data-tour="page-outreach-body" className="space-y-8 animate-in fade-in max-w-6xl">
       {/* EXPIRED SUBSCRIPTION / ENGINE PAUSED BANNER */}
       {!isSubscriptionActive && (
         <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
           <div className="flex items-start gap-3">
             <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
             <div>
               <h3 className="text-sm font-semibold text-white">Outreach Engine Paused</h3>
               <p className="text-xs text-amber-200/80 mt-0.5">
                 Your free trial or subscription has ended. Automated email outreach is paused. Pay via M-PESA to resume sending.
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

       <div className="flex items-center justify-between">
           <h1 data-tour="page-outreach-head" className="text-3xl font-serif text-white flex items-center gap-3">
              <Mail className="text-[var(--accent-primary)]" size={32} />
              Email Outreach
           </h1>
           {activeTab === "overview" && isGmailConnected && (
             <button 
                onClick={async () => {
                  const newState = !isAutomationEnabled;
                  if (newState && !isSubscriptionActive) {
                    toast.error("Cannot resume outreach engine: your trial or subscription has expired. Please pay via M-PESA.");
                    setShowMpesaModal(true);
                    return;
                  }
                  setIsAutomationEnabled(newState);
                  if (activeBrand) {
                    try {
                      await apiPut(`/brands/${activeBrand.id}`, { ...activeBrand, automationOutreachEnabled: newState });
                      await refreshBrands();
                      toast.success(newState ? "Outreach engine resumed." : "Outreach engine paused.");
                    } catch (err: any) {
                      console.error("Failed to toggle outreach:", err);
                      setIsAutomationEnabled(!newState);
                      if (err?.code === "ENGINE_PAUSED") {
                        toast.error("Your engine is paused due to expired subscription. Please pay via M-PESA.");
                        setShowMpesaModal(true);
                      } else {
                        toast.error(err?.message || "Failed to toggle outreach engine.");
                      }
                    }
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium border ${isAutomationEnabled ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'}`}>
               {isAutomationEnabled ? <><Pause size={16} /> Pause Engine</> : <><Play size={16} /> Resume Engine</>}
             </button>
           )}
       </div>

       {/* Tabs */}
       <div className="flex items-center gap-2 border-b border-[var(--border)] pb-0">
          <button onClick={() => setActiveTab("overview")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'overview' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <Mail size={14} /> Connection
          </button>
          <button onClick={() => setActiveTab("review")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'review' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <FileCheck size={14} /> Review Queue
            {pendingTotal > 0 && <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{pendingTotal}</span>}
          </button>
          <button onClick={() => setActiveTab("logs")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'logs' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <Send size={14} /> Dispatch Logs
          </button>
          <button onClick={() => setActiveTab("settings")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'settings' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <Settings size={14} /> Delivery Engine
          </button>
       </div>
       
       {/* OVERVIEW */}
       {activeTab === "overview" && (
         <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-6">
               <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                 <Mail size={28} className="text-red-500" />
               </div>
               {isGmailConnected ? (
                 <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--success)] bg-[var(--success)]/10 px-2.5 py-1 rounded-full border border-[var(--success)]/20">
                   <CheckCircle2 size={14} /> Connected
                 </span>
               ) : (
                 <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                   <AlertCircle size={14} /> Unbound
                 </span>
               )}
             </div>
             <div>
                <h3 className="text-xl font-medium text-white mb-2">Gmail OAuth 2.0</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  {isGmailConnected 
                    ? "Your Gmail account is bound. The autonomous engine uses your account to dispatch high-deliverability emails." 
                    : "Bind your Google Workspace or Gmail account. AI will dispatch strictly typed raw RFC-2822 emails through your outbox."}
                </p>
                {isGmailConnected ? (
                   <button onClick={handleDisconnectGmail} className="w-full py-2.5 rounded-xl border border-[var(--error)]/30 text-[var(--error)] font-medium hover:bg-[var(--error)]/10 flex justify-center items-center transition">
                     Revoke Consent Access
                   </button>
                ) : (
                   <button onClick={handleConnectGmail} disabled={isConnecting} className="w-full py-2.5 rounded-xl bg-white text-black font-medium hover:bg-gray-200 flex justify-center items-center transition disabled:opacity-50">
                     {isConnecting ? "Binding Identity..." : "Connect Gmail Account"}
                   </button>
                )}
             </div>
           </div>

           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
             <h3 className="flex flex-col gap-1 text-white font-serif text-xl border-b border-[var(--border)] pb-4 mb-4">
                 Engine Status
                 <span className="text-xs font-sans text-[var(--text-muted)] uppercase tracking-wider">Metrics & Limitations</span>
             </h3>
             <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm">
                   <span className="text-[var(--text-secondary)]">Queued Emails</span>
                   <span className="font-mono text-white">{queuedCount}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                   <span className="text-[var(--text-secondary)]">Sent Emails</span>
                   <span className="font-mono text-white">{sentCount}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                   <span className="text-[var(--text-secondary)]">Active Engine State</span>
                   <span className={`font-mono ${isAutomationEnabled ? 'text-green-400' : 'text-red-400'}`}>{isAutomationEnabled ? 'RUNNING' : 'PAUSED'}</span>
                </li>
             </ul>
           </div>
         </div>
       )}

       {/* SETTINGS */}
       {activeTab === "settings" && (
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 animate-in fade-in duration-200 max-w-3xl">
           <h2 className="text-xl font-serif text-white mb-6">Delivery Architecture</h2>
           <div className="space-y-8">
             <div>
                <label className="text-sm font-medium text-white mb-1 block">Daily Volume Limit</label>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Maximum emails to dispatch per day to protect domain reputation.</p>
                <input type="range" min="1" max="150" value={dailyLimit} onChange={(e) => setDailyLimit(parseInt(e.target.value))} className="w-full accent-[var(--accent-primary)] bg-[var(--bg-surface)] h-2 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)] font-mono">
                   <span>1</span>
                   <span className="text-white text-sm font-semibold">{dailyLimit} emails/day</span>
                   <span>150</span>
                </div>
             </div>
             <div className="border-t border-[var(--border)] pt-8">
                <label className="text-sm font-medium text-white mb-1 block">Delay Hours Between Automation</label>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Time to wait after capturing a lead before initiating the first touchpoint.</p>
                <div className="flex items-center gap-4">
                   <input type="number" min="0" max="72" value={delayHours} onChange={(e) => setDelayHours(parseInt(e.target.value))} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--accent-primary)] transition w-24 text-center font-mono" />
                   <span className="text-[var(--text-secondary)] text-sm">hours delay duration</span>
                </div>
             </div>
              {/* ── Review Mode Toggle ──────────────────── */}
              <div className="pt-6 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Review Mode</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">When enabled, AI-generated emails will be held for your review before sending. You can approve, edit, or reject each email.</p>
                  </div>
                  <button
                    onClick={() => setRequireApproval(!requireApproval)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      requireApproval ? 'bg-amber-500' : 'bg-neutral-700'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      requireApproval ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                {requireApproval && (
                  <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                    <Eye size={14} className="inline mr-2" />
                    Review Mode is ON — outreach emails will appear in the Review Queue tab for your approval before being sent.
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] pt-6 flex justify-end">
                 <button onClick={handleSaveSettings} disabled={isSaving} className="bg-[var(--accent-primary)] hover:opacity-90 text-white px-6 py-2.5 rounded-xl transition font-medium disabled:opacity-50">
                   {isSaving ? "Saving..." : "Save Engine Configuration"}
                 </button>
              </div>
            </div>
         </div>
       )}

       {/* REVIEW QUEUE */}
       {activeTab === "review" && (
         <div className="space-y-4 animate-in fade-in duration-200">
           {pendingEmails.length > 0 && (
             <div className="flex justify-between items-center">
               <p className="text-sm text-[var(--text-muted)]">{pendingTotal} email{pendingTotal !== 1 ? 's' : ''} awaiting your review</p>
               <button
                 onClick={handleBulkApprove}
                 disabled={isApproving === 'bulk'}
                 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition text-sm font-medium disabled:opacity-50"
               >
                 <CheckCheck size={14} />
                 {isApproving === 'bulk' ? 'Approving...' : 'Approve All'}
               </button>
             </div>
           )}
           {isLoading ? (
             <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-12 flex justify-center"><RefreshCw className="animate-spin text-[var(--text-muted)]" /></div>
           ) : pendingEmails.length === 0 ? (
             <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-12 text-center">
               <FileCheck size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
               <p className="text-[var(--text-secondary)]">No emails waiting for review.</p>
               <p className="text-sm text-[var(--text-muted)] mt-1">{requireApproval ? 'New emails will appear here once the outreach engine generates them.' : 'Enable Review Mode in Settings to review emails before they\'re sent.'}</p>
             </div>
           ) : (
             pendingEmails.map(email => (
               <div key={email.id} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-amber-500/30 transition">
                 <div className="p-5 flex items-start justify-between gap-4">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       {renderStatus(email.status)}
                       <span className="text-xs text-[var(--text-muted)] font-mono">{new Date(email.generatedAt).toLocaleDateString()}</span>
                     </div>
                     <p className="text-white font-medium mt-2">{email.subject}</p>
                     <p className="text-sm text-[var(--text-muted)] font-mono mt-1">To: {email.recipientEmail}</p>
                     <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-3 leading-relaxed">{email.bodyText}</p>
                   </div>
                   <div className="flex flex-col gap-2 flex-shrink-0">
                     <button
                       onClick={() => handleApproveEmail(email.id)}
                       disabled={isApproving === email.id}
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition text-xs font-medium disabled:opacity-50"
                     >
                       <CheckCircle2 size={12} /> {isApproving === email.id ? '...' : 'Approve'}
                     </button>
                     <button
                       onClick={() => { setEditingEmail(email); setEditSubject(email.subject); setEditBody(email.bodyText); }}
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition text-xs font-medium"
                     >
                       <Edit2 size={12} /> Edit
                     </button>
                     <button
                       onClick={() => handleRejectEmail(email.id)}
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition text-xs font-medium"
                     >
                       <XCircle size={12} /> Reject
                     </button>
                   </div>
                 </div>
               </div>
             ))
           )}
         </div>
       )}

       {/* LOGS */}
       {activeTab === "logs" && (
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden animate-in fade-in duration-200">
           {isLoading ? (
             <div className="p-12 flex justify-center items-center text-[var(--text-muted)]"><RefreshCw className="animate-spin" /></div>
           ) : emails.length === 0 ? (
             <div className="p-12 text-center text-[var(--text-secondary)]">No outbound interactions generated yet.</div>
           ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[25%]">Recipient</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[40%]">Subject Line</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[15%]">Status</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider text-right w-[20%]">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {emails.map(email => (
                    <tr key={email.id} className="hover:bg-white/5 transition group cursor-pointer" onClick={() => setViewingEmail(email)}>
                       <td className="px-6 py-4 font-mono text-[13px] text-white">{email.recipientEmail}</td>
                       <td className="px-6 py-4"><p className="text-[var(--text-secondary)] line-clamp-1 group-hover:text-white transition">{email.subject}</p></td>
                       <td className="px-6 py-4">{renderStatus(email.status)}</td>
                       <td className="px-6 py-4 text-right text-[var(--text-muted)] font-mono text-[12px]">
                          {email.sentAt ? new Date(email.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           )}
         </div>
       )}

       {/* EMAIL PREVIEW MODAL */}
       {viewingEmail && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
             <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[#111114]">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-serif text-white">Email Details</h2>
                    {renderStatus(viewingEmail.status)}
                </div>
                <button onClick={() => setViewingEmail(null)} className="text-[var(--text-muted)] hover:text-white transition">✕</button>
             </div>
             <div className="p-6 border-b border-[var(--border)] flex flex-col gap-2 flex-shrink-0">
                <div className="flex gap-4 text-sm">
                   <span className="text-[var(--text-muted)] w-16">To:</span>
                   <span className="font-mono text-white tracking-tight">{viewingEmail.recipientEmail}</span>
                </div>
                <div className="flex gap-4 text-sm items-start">
                   <span className="text-[var(--text-muted)] w-16 pt-0.5">Subject:</span>
                   <span className="text-white font-medium">{viewingEmail.subject}</span>
                </div>
             </div>
             <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                {viewingEmail.bodyText}
             </div>
             <div className="p-4 border-t border-[var(--border)] bg-[#111114] flex justify-between items-center text-xs text-[var(--text-muted)] font-mono">
                <span>ID: {viewingEmail.id}</span>
                <span>{viewingEmail.sentAt ? `Dispatched at ${new Date(viewingEmail.sentAt).toLocaleString()}` : "Scheduled for intelligent sending"}</span>
             </div>
           </div>
         </div>
       )}

       {/* EDIT DRAFT MODAL */}
       {editingEmail && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
             <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[#111114]">
                <div className="flex items-center gap-3">
                    <Edit2 size={18} className="text-blue-400" />
                    <h2 className="text-lg font-serif text-white">Edit Email Draft</h2>
                </div>
                <button onClick={() => setEditingEmail(null)} className="text-[var(--text-muted)] hover:text-white transition">✕</button>
             </div>
             <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1.5 block">To</label>
                  <p className="font-mono text-sm text-white/60">{editingEmail.recipientEmail}</p>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1.5 block">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1.5 block">Body</label>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={12}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/50 transition resize-none font-sans"
                  />
                </div>
             </div>
             <div className="p-4 border-t border-[var(--border)] bg-[#111114] flex justify-end gap-3">
                <button onClick={() => setEditingEmail(null)} className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white transition">Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
             </div>
           </div>
         </div>
       )}

       {/* M-PESA CHECKOUT MODAL */}
       <MpesaCheckoutModal
         isOpen={showMpesaModal}
         onClose={() => setShowMpesaModal(false)}
         initialPlanId={user?.planName || "starter"}
         onSuccess={async () => {
           await refreshUser();
           await refreshBrands();
         }}
       />
    </div>
  );
}
