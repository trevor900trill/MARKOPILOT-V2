"use client";

import { Share2, Briefcase, Image as ImageIcon, Video, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function SocialPage() {
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  // Mock initial connected state
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({
    x: false,
    linkedin: true, // Example connected
    instagram: false,
    tiktok: false
  });

  const handleConnect = async (platformId: string) => {
     setLoadingPlatform(platformId);
     try {
       // Typically: fetch(`/api/social/{brandId}/connect/${platformId}`)
       // and window.location.href = res.authUrl;
       
       // Stubming generic timeout for UI demo
       await new Promise(resolve => setTimeout(resolve, 800));
       // In real usage, we redirect:
       // window.location.href = `http://localhost:5030/api/social/00000000-0000-0000-0000-000000000000/connect/${platformId}`;
     } finally {
       setLoadingPlatform(null);
     }
  };

  const handleDisconnect = async (platformId: string) => {
      setConnectedPlatforms(prev => ({ ...prev, [platformId]: false }));
  };

  const platforms = [
    { id: "x", name: "X (Twitter)", icon: Share2, color: "bg-black", textColor: "text-white" },
    { id: "linkedin", name: "LinkedIn", icon: Briefcase, color: "bg-[#0A66C2]", textColor: "text-white" },
    { id: "instagram", name: "Instagram", icon: ImageIcon, color: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]", textColor: "text-white" },
    { id: "tiktok", name: "TikTok", icon: Video, color: "bg-black", textColor: "text-[#00f2fe]" } // Custom styled
  ];

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl">
       <div className="flex items-center justify-between">
           <h1 className="text-3xl font-serif text-white">Social Posting</h1>
       </div>
       
       <div className="grid md:grid-cols-2 gap-6">
         {platforms.map(platform => {
           const isConnected = connectedPlatforms[platform.id];
           
           return (
             <div key={platform.id} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
               <div className="flex justify-between items-start mb-6">
                 <div className={`w-14 h-14 ${platform.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <platform.icon size={28} className={platform.textColor} />
                 </div>
                 {isConnected ? (
                   <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--success)] bg-[var(--success)]/10 px-2.5 py-1 rounded-full border border-[var(--success)]/20">
                     <CheckCircle2 size={14} /> Connected
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                     <AlertCircle size={14} /> Disconnected
                   </span>
                 )}
               </div>
               
               <div>
                  <h3 className="text-xl font-medium text-white mb-2">{platform.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-6">
                    {isConnected 
                      ? "Your account is linked and ready for autonomous posting." 
                      : `Connect your ${platform.name} account to enable AI scheduling.`}
                  </p>
                  
                  {isConnected ? (
                     <button onClick={() => handleDisconnect(platform.id)} className="w-full py-2.5 rounded-xl border border-[var(--error)]/30 text-[var(--error)] font-medium hover:bg-[var(--error)]/10 flex justify-center items-center transition">
                       Disconnect Profile
                     </button>
                  ) : (
                     <button onClick={() => handleConnect(platform.id)} disabled={loadingPlatform === platform.id} className="w-full py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-white font-medium hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] flex justify-center items-center transition disabled:opacity-50">
                       {loadingPlatform === platform.id ? "Connecting..." : `Connect ${platform.name}`}
                     </button>
                  )}
               </div>
             </div>
           );
         })}
       </div>
    </div>
  );
}
