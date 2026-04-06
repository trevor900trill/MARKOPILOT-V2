"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertCircle, Settings, Send, Clock, Trash2, Eye, Play, Pause, RefreshCw } from "lucide-react";

type OutreachEmail = {
  id: string;
  recipientEmail: string;
  subject: string;
  bodyText: string;
  status: string;
  sentAt?: string;
};

export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "settings">("overview");
  
  // Gmail State
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Settings State
  const [dailyLimit, setDailyLimit] = useState(50);
  const [delayHours, setDelayHours] = useState(4);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);

  // Data State
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<OutreachEmail | null>(null);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchEmails();
    }
  }, [activeTab]);

  const fetchEmails = () => {
    setIsLoading(true);
    setTimeout(() => {
      setEmails([
        {
          id: "1",
          recipientEmail: "tim@saasstartup.com",
          subject: "Scaling your engineering team?",
          bodyText: "Hi Tim,\n\nI saw your recent post about...",
          status: "sent",
          sentAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "2",
          recipientEmail: "sarah@designagency.io",
          subject: "Quick question regarding your workflow",
          bodyText: "Sarah,\n\nLove the recent portfolio piece you published...",
          status: "queued"
        },
        {
          id: "3",
          recipientEmail: "marc@salesforce.com",
          subject: "Automated pipelines",
          bodyText: "Marc,\n\nAre you looking to optimize outreach?",
          status: "bounced",
          sentAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setIsLoading(false);
    }, 600);
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    // Real implementation would redirect to OAuth URL
    setTimeout(() => {
      setIsGmailConnected(true);
      setIsConnecting(false);
    }, 1000);
  };

  const handleDisconnectGmail = () => {
    setIsGmailConnected(false);
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "sent": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/20 tracking-wider flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Sent</span>;
      case "queued": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider flex items-center gap-1 w-max"><Clock size={12}/> Queued</span>;
      case "bounced": return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20 tracking-wider flex items-center gap-1 w-max"><AlertCircle size={12}/> Bounced</span>;
      default: return <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-[var(--border)] text-[var(--text-muted)] tracking-wider">Unknown</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl">
       <div className="flex items-center justify-between">
           <h1 className="text-3xl font-serif text-white flex items-center gap-3">
              <Mail className="text-[var(--accent-primary)]" size={32} />
              Email Outreach
           </h1>
           {activeTab === "overview" && isGmailConnected && (
             <button 
                onClick={() => setIsAutomationEnabled(!isAutomationEnabled)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium border ${isAutomationEnabled ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'}`}>
               {isAutomationEnabled ? <><Pause size={16} /> Pause Engine</> : <><Play size={16} /> Resume Engine</>}
             </button>
           )}
       </div>

       {/* Tabs Navigation */}
       <div className="flex items-center gap-2 border-b border-[var(--border)] pb-0">
          <button onClick={() => setActiveTab("overview")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'overview' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <Mail size={14} /> Connection
          </button>
          <button onClick={() => setActiveTab("logs")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'logs' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <Send size={14} /> Dispatch Logs
          </button>
          <button onClick={() => setActiveTab("settings")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'settings' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <Settings size={14} /> Global Delivery Engine
          </button>
       </div>
       
       {/* OVERVIEW / CONNECTION VIEW */}
       {activeTab === "overview" && (
         <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-6">
               <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                 {/* Beautiful Gmail SVG Icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ea4335" d="M11.69 11.83 2.14 5.08a2.53 2.53 0 0 1 .15-1.55 2.52 2.52 0 0 1 2.37-1.42l7.03 5.48ZM12 12.05l9.7-7.46a2.52 2.52 0 0 1 2.22 1.45 2.53 2.53 0 0 1 .09 1.5Z"/><path fill="#fbbc04" d="M23.94 5.02A2.53 2.53 0 0 0 21.6 3.51L12 12.05l9.7 7.55c.34-.17.65-.4.9-.68a2.5 2.5 0 0 0 .34-.96V5.02Z"/><path fill="#4285f4" d="M12 12.05 2.3 3.51A2.52 2.52 0 0 0 0 5.02v12.94c0 .64.24 1.25.68 1.7a2.43 2.43 0 0 0 1.7.71h2.24v-6.73L12 12.05Z"/><path fill="#34a853" d="M24 17.96v-4.32l-7.39 5.67h2.28c.64 0 1.25-.24 1.7-.68a2.46 2.46 0 0 0 .71-1.7v1.03Z"/><path fill="#34a853" d="M24 18.99a2.46 2.46 0 0 0-.71-1.7 2.43 2.43 0 0 0-1.7-.71h-2.28V24h2.28a2.43 2.43 0 0 0 1.7-.68 2.46 2.46 0 0 0 .71-1.7v-1.03Z"/><path fill="#ea4335" d="M4.62 16.37v7.63H2.38a2.43 2.43 0 0 1-1.7-.68c-.44-.45-.68-1.06-.68-1.7v-1.03a2.46 2.46 0 0 1 .71 1.7c4.15-3.19 7.39-5.67 7.39-5.67v-6.98l-3.48 2.68v4.05Z"/></svg>
               </div>
               {isGmailConnected ? (
                 <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--success)] bg-[var(--success)]/10 px-2.5 py-1 rounded-full border border-[var(--success)]/20">
                   <CheckCircle2 size={14} /> Bound
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
                    : `Bind your Google Workspace or Gmail account. AI will dispatch strictly typed raw RFC-2822 emails through your outbox.`}
                </p>
                
                {isGmailConnected ? (
                   <button onClick={handleDisconnectGmail} className="w-full py-2.5 rounded-xl border border-[var(--error)]/30 text-[var(--error)] font-medium hover:bg-[var(--error)]/10 flex justify-center items-center transition">
                     Revoke Consent Access
                   </button>
                ) : (
                   <button onClick={handleConnectGmail} disabled={isConnecting} className="w-full py-2.5 rounded-xl bg-white text-black font-medium hover:bg-gray-200 flex justify-center items-center transition disabled:opacity-50">
                     {isConnecting ? "Binding Identity..." : `Connect Gmail Account`}
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
                   <span className="text-[var(--text-secondary)]">Today's Dispatched</span>
                   <span className="font-mono text-white">12 / {dailyLimit}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                   <span className="text-[var(--text-secondary)]">Active Engine state</span>
                   <span className={`font-mono ${isAutomationEnabled ? 'text-green-400' : 'text-red-400'}`}>{isAutomationEnabled ? 'RUNNING' : 'PAUSED'}</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                   <span className="text-[var(--text-secondary)]">Open Rates (7d)</span>
                   <span className="font-mono text-white">48%</span>
                </li>
             </ul>
           </div>
         </div>
       )}

       {/* SETTINGS VIEW */}
       {activeTab === "settings" && (
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 animate-in fade-in duration-200 max-w-3xl">
           <h2 className="text-xl font-serif text-white mb-6">Delivery Architecture</h2>
           
           <div className="space-y-8">
             <div>
                <label className="text-sm font-medium text-white mb-1 block">Daily Volume Limit</label>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Maximum emails to dispatch per day to protect domain reputation.</p>
                <input 
                   type="range" 
                   min="1" 
                   max="150" 
                   value={dailyLimit} 
                   onChange={(e) => setDailyLimit(parseInt(e.target.value))} 
                   className="w-full accent-[var(--accent-primary)] bg-[var(--bg-surface)] h-2 rounded-lg appearance-none cursor-pointer"
                />
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
                   <input 
                      type="number" 
                      min="0" 
                      max="72" 
                      value={delayHours} 
                      onChange={(e) => setDelayHours(parseInt(e.target.value))}
                      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--accent-primary)] transition w-24 text-center font-mono"
                   />
                   <span className="text-[var(--text-secondary)] text-sm">hours delay duration</span>
                </div>
             </div>
             
             <div className="border-t border-[var(--border)] pt-6 flex justify-end">
                <button className="bg-[var(--accent-primary)] hover:opacity-90 text-white px-6 py-2.5 rounded-xl transition font-medium">Save Engine Configuration</button>
             </div>
           </div>
         </div>
       )}

       {/* LOGS VIEW */}
       {activeTab === "logs" && (
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden animate-in fade-in duration-200">
           {isLoading ? (
             <div className="p-12 flex justify-center items-center text-[var(--text-muted)]">
                <RefreshCw className="animate-spin" />
             </div>
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
                       <td className="px-6 py-4 font-mono text-[13px] text-white">
                          {email.recipientEmail}
                       </td>
                       <td className="px-6 py-4">
                          <p className="text-[var(--text-secondary)] line-clamp-1 group-hover:text-white transition">{email.subject}</p>
                       </td>
                       <td className="px-6 py-4">
                          {renderStatus(email.status)}
                       </td>
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
                    <h2 className="text-lg font-serif text-white">Email Interrogation</h2>
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
