"use client";

import { Share2, Briefcase, Image as ImageIcon, Video, CheckCircle2, AlertCircle, Plus, Calendar, Clock, Trash2, Heart, MessageSquare, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

type Post = {
  id: string;
  platform: string;
  contentPillar: string;
  generatedCopy: string;
  scheduledFor: string;
  status: string;
  publishedAt?: string;
};

export default function SocialPage() {
  const { activeBrand, refreshBrands } = useBrand();
  const [activeTab, setActiveTab] = useState<"accounts" | "queue" | "published">("accounts");
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostPlatform, setNewPostPlatform] = useState("linkedin");
  const [newPostCopy, setNewPostCopy] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const connectedPlatforms: Record<string, boolean> = {
    x: activeBrand?.twitterConnected ?? false,
    linkedin: activeBrand?.linkedinConnected ?? false,
    instagram: activeBrand?.instagramConnected ?? false,
    tiktok: activeBrand?.tiktokConnected ?? false,
  };

  const fetchPosts = useCallback(async () => {
    if (!activeBrand) return;
    setIsLoading(true);
    try {
      const res = await apiGet<{ data: Post[] }>(`/social/${activeBrand.id}/posts`);
      setPosts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand]);

  useEffect(() => {
    if (activeTab !== "accounts" && activeBrand) {
      fetchPosts();
    }
  }, [activeTab, activeBrand, fetchPosts]);

  const handleConnect = async (platformId: string) => {
    if (!activeBrand) return;
    setLoadingPlatform(platformId);
    try {
      const res = await apiGet<{ authUrl: string }>(`/social/${activeBrand.id}/connect/${platformId}`);
      if (res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err) {
      console.error("Failed to get OAuth URL:", err);
      alert("Failed to initiate connection. Please try again.");
    } finally {
      setLoadingPlatform(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (!activeBrand) return;
    try {
      await apiDelete(`/social/${activeBrand.id}/disconnect/${platformId}`);
      await refreshBrands();
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!activeBrand) return;
    try {
      await apiDelete(`/social/${activeBrand.id}/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to cancel post:", err);
    }
  };

  const handleCreatePost = async () => {
    if (!activeBrand || !newPostCopy.trim()) return;
    setIsCreating(true);
    try {
      await apiPost(`/social/${activeBrand.id}/posts`, {
        platform: newPostPlatform,
        generatedCopy: newPostCopy,
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
        hashtags: [],
      });
      setIsModalOpen(false);
      setNewPostCopy("");
      await fetchPosts();
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const platforms = [
    { id: "x", name: "X (Twitter)", icon: Share2, color: "bg-black", textColor: "text-white" },
    { id: "linkedin", name: "LinkedIn", icon: Briefcase, color: "bg-[#0A66C2]", textColor: "text-white" },
    { id: "instagram", name: "Instagram", icon: ImageIcon, color: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]", textColor: "text-white" },
    { id: "tiktok", name: "TikTok", icon: Video, color: "bg-black", textColor: "text-[#00f2fe]" },
  ];

  const queuedPosts = posts.filter(p => p.status === "queued");
  const publishedPosts = posts.filter(p => p.status === "published");

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl">
       <div className="flex items-center justify-between">
           <h1 className="text-3xl font-serif text-white">Social Posting</h1>
           {activeTab === "queue" && (
             <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-opacity-90 text-white px-4 py-2 rounded-xl transition font-medium">
               <Plus size={16} /> Create Post Now
             </button>
           )}
       </div>

       {/* Tabs Navigation */}
       <div className="flex items-center gap-2 border-b border-[var(--border)] pb-0">
          <button onClick={() => setActiveTab("accounts")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 ${activeTab === 'accounts' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            Connected Accounts
          </button>
          <button onClick={() => setActiveTab("queue")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'queue' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <Clock size={14} /> Pending Queue
          </button>
          <button onClick={() => setActiveTab("published")} className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'published' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}>
            <CheckCircle2 size={14} /> Published History
          </button>
       </div>
       
       {/* ACCOUNTS VIEW */}
       {activeTab === "accounts" && (
         <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-200">
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
       )}

       {/* QUEUE VIEW */}
       {activeTab === "queue" && (
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden animate-in fade-in duration-200">
           {isLoading ? (
             <div className="p-12 flex justify-center items-center text-[var(--text-muted)]">
                <RefreshCw className="animate-spin" />
             </div>
           ) : queuedPosts.length === 0 ? (
             <div className="p-12 text-center text-[var(--text-secondary)]">No posts currently queued.</div>
           ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[15%]">Platform</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[50%]">Content Preview</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[25%]">Scheduled Time</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider text-right w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {queuedPosts.map(post => (
                    <tr key={post.id} className="hover:bg-white/5 transition group">
                       <td className="px-6 py-4">
                          <span className="capitalize text-white bg-[var(--bg-primary)] px-3 py-1 rounded border border-[var(--border)] inline-flex items-center gap-2">
                             {post.platform.toLowerCase() === 'linkedin' ? <Briefcase size={14}/> : <Share2 size={14}/>}
                             {post.platform}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <p className="text-[var(--text-secondary)] line-clamp-2">{post.generatedCopy}</p>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                             <Calendar size={14} className="text-[var(--accent-primary)]"/> 
                             {new Date(post.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeletePost(post.id)} className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] transition rounded hover:bg-[var(--error)]/10">
                            <Trash2 size={16} />
                          </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           )}
         </div>
       )}

       {/* PUBLISHED VIEW */}
       {activeTab === "published" && (
         <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden animate-in fade-in duration-200">
           {isLoading ? (
             <div className="p-12 flex justify-center items-center text-[var(--text-muted)]">
                <RefreshCw className="animate-spin" />
             </div>
           ) : publishedPosts.length === 0 ? (
             <div className="p-12 text-center text-[var(--text-secondary)]">No posts published yet.</div>
           ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[15%]">Platform</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[55%]">Content Preview</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[30%]">Published On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {publishedPosts.map(post => (
                    <tr key={post.id} className="hover:bg-white/5 transition">
                       <td className="px-6 py-4">
                          <span className="capitalize text-[var(--text-muted)]">{post.platform}</span>
                       </td>
                       <td className="px-6 py-4">
                          <p className="text-[var(--text-secondary)] line-clamp-1">{post.generatedCopy}</p>
                       </td>
                       <td className="px-6 py-4 text-[var(--text-muted)]">
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : new Date(post.scheduledFor).toLocaleDateString()}
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           )}
         </div>
       )}

       {/* CREATE MODAL */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h2 className="text-xl font-serif text-white">Create Manual Post</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-white transition">✕</button>
             </div>
             <div className="p-6 space-y-4">
                <div>
                   <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Platform</label>
                   <select value={newPostPlatform} onChange={(e) => setNewPostPlatform(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--accent-primary)] transition">
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Post Copy</label>
                   <textarea rows={4} value={newPostCopy} onChange={(e) => setNewPostCopy(e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--accent-primary)] transition resize-none placeholder:text-[var(--text-muted)]" placeholder="What do you want to share with your audience?"></textarea>
                </div>
             </div>
             <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[#111114]">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-white font-medium hover:bg-[var(--bg-elevated)] transition">Cancel</button>
                <button onClick={handleCreatePost} disabled={isCreating || !newPostCopy.trim()} className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition disabled:opacity-50">
                  {isCreating ? "Queuing..." : "Queue Post"}
                </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
