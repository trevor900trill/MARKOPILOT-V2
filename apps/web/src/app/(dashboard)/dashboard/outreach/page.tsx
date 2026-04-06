"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, CheckCircle2, AlertCircle, Settings, Send, Clock, Eye, Play, Pause, RefreshCw } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPut, apiDelete } from "@/lib/api-client";

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
  const { activeBrand, refreshBrands } = useBrand();
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "settings">("overview");
  
  const isGmailConnected = activeBrand?.gmailConnected ?? false;
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [dailyLimit, setDailyLimit] = useState(50);
  const [delayHours, setDelayHours] = useState(4);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);

  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<OutreachEmail | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeBrand) {
      setIsAutomationEnabled(activeBrand.automationOutreachEnabled);
      setDailyLimit((activeBrand as any).automationOutreachDailyLimit ?? 50);
      setDelayHours((activeBrand as any).automationOutreachDelayHours ?? 4);
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

  useEffect(() => {
    if (activeTab === "logs" && activeBrand) {
      fetchEmails();
    }
  }, [activeTab, activeBrand, fetchEmails]);

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
    setIsSaving(true);
    try {
      await apiPut(`/brands/${activeBrand.id}`, {
        ...activeBrand,
        automationOutreachEnabled: isAutomationEnabled,
        automationOutreachDailyLimit: dailyLimit,
        automationOutreachDelayHours: delayHours,
      });
      await refreshBrands();
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "sent": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/20 tracking-wider flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Sent</span>;
      case "queued": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider flex items-center gap-1 w-max"><Clock size={12}/> Queued</span>;
      case "failed": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20 tracking-wider flex items-center gap-1 w-max"><AlertCircle size={12}/> Failed</span>;
      case "cancelled": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 tracking-wider flex items-center gap-1 w-max">Cancelled</span>;
      default: return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-[var(--border)] text-[var(--text-muted)] tracking-wider">{status}</span>;
    }
  };

  const queuedCount = emails.filter(e => e.status === 'queued').length;
  const sentCount = emails.filter(e => e.status === 'sent').length;

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl">
       <div className="flex items-center justify-between">
           <h1 className="text-3xl font-serif text-white flex items-center gap-3">
              <Mail className="text-[var(--accent-primary)]" size={32} />
              Email Outreach
           </h1>
           {activeTab === "overview" && isGmailConnected && (
             <button 
                onClick={async () => {
                  const newState = !isAutomationEnabled;
                  setIsAutomationEnabled(newState);
                  if (activeBrand) {
                    await apiPut(`/brands/${activeBrand.id}`, { ...activeBrand, automationOutreachEnabled: newState });
                    await refreshBrands();
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
             <div className="border-t border-[var(--border)] pt-6 flex justify-end">
                <button onClick={handleSaveSettings} disabled={isSaving} className="bg-[var(--accent-primary)] hover:opacity-90 text-white px-6 py-2.5 rounded-xl transition font-medium disabled:opacity-50">
                  {isSaving ? "Saving..." : "Save Engine Configuration"}
                </button>
             </div>
           </div>
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
    </div>
  );
}
