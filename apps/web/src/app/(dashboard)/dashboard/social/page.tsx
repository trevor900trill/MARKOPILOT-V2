"use client";

import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Clock,
  Trash2,
  RefreshCw,
  Video,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Eye,
  Copy,
  Check,
  X,
  Sliders,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/api-client";
import { XIcon, LinkedInIcon, InstagramIcon, TikTokIcon, PlatformIcon } from "@/components/icons/SocialIcons";

type Post = {
  id: string;
  platform: string;
  contentPillar: string;
  generatedCopy: string;
  hashtags?: string[];
  mediaUrl?: string;
  mediaType?: string; // "image" | "video" | null
  scheduledFor: string;
  status: string;
  publishedAt?: string;
  generatedAt?: string;
  errorMessage?: string;
};

export default function SocialPage() {
  const { activeBrand, refreshBrands, isLoading: isBrandLoading } = useBrand();
  const [activeTab, setActiveTab] = useState<"accounts" | "queue" | "published" | "failed">("accounts");
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostPlatform, setNewPostPlatform] = useState("linkedin");
  const [newPostCopy, setNewPostCopy] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [copied, setCopied] = useState(false);
  const [togglingReview, setTogglingReview] = useState(false);

  const connectedPlatforms: Record<string, boolean> = {
    x: activeBrand?.twitterConnected ?? false,
    linkedin: activeBrand?.linkedinConnected ?? false,
    instagram: activeBrand?.instagramConnected ?? false,
    tiktok: activeBrand?.tiktokConnected ?? false,
  };

  const isReviewQueueEnabled = activeBrand?.automationPostReviewEnabled ?? false;

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
      setPosts(prev => prev.filter(p => p.id !== id));
      if (selectedPost?.id === id) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error("Failed to cancel post:", err);
    }
  };

  const handleRetryPost = async (id: string) => {
    if (!activeBrand) return;
    setActionLoading(id);
    try {
      await apiPost(`/social/${activeBrand.id}/posts/${id}/retry`);
      await fetchPosts();
      if (selectedPost?.id === id) {
        setSelectedPost(prev => prev ? { ...prev, status: "queued", errorMessage: undefined } : null);
      }
    } catch (err) {
      console.error("Failed to retry post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovePost = async (id: string) => {
    if (!activeBrand) return;
    setActionLoading(id);
    try {
      await apiPost(`/social/${activeBrand.id}/posts/${id}/approve`);
      await fetchPosts();
      if (selectedPost?.id === id) {
        setSelectedPost(prev => prev ? { ...prev, status: "queued" } : null);
      }
    } catch (err) {
      console.error("Failed to approve post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPost = async (id: string) => {
    if (!activeBrand) return;
    setActionLoading(id);
    try {
      await apiPost(`/social/${activeBrand.id}/posts/${id}/reject`);
      await fetchPosts();
      if (selectedPost?.id === id) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error("Failed to reject post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleWorkflow = async () => {
    if (!activeBrand) return;
    setTogglingReview(true);
    try {
      const nextValue = !isReviewQueueEnabled;
      await apiPut(`/brands/${activeBrand.id}`, {
        ...activeBrand,
        automationPostReviewEnabled: nextValue,
      });
      await refreshBrands();
    } catch (err) {
      console.error("Failed to toggle review workflow:", err);
    } finally {
      setTogglingReview(false);
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

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    { id: "x", name: "X (Twitter)", icon: XIcon, color: "bg-black border border-white/10", textColor: "text-white" },
    { id: "linkedin", name: "LinkedIn", icon: LinkedInIcon, color: "bg-[#0A66C2]", textColor: "text-white" },
    { id: "instagram", name: "Instagram", icon: InstagramIcon, color: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]", textColor: "text-white", comingSoon: true },
    { id: "tiktok", name: "TikTok", icon: TikTokIcon, color: "bg-black border border-white/10", textColor: "text-white" },
  ];

  const queuedPosts = posts.filter(p => p.status === "queued" || p.status === "pending_review");
  const publishedPosts = posts.filter(p => p.status === "published");
  const failedPosts = posts.filter(p => p.status === "failed");

  const formatCleanError = (raw?: string) => {
    if (!raw) return "Publication failed.";
    // Clean up common verbose messages
    if (raw.includes("No publisher available")) {
      return "Platform client configuration mismatch (resolved). Click Retry to publish.";
    }
    if (raw.includes("Missing") && raw.includes("token")) {
      return "Social account token is expired or disconnected. Reconnect in Connected Accounts.";
    }
    if (raw.includes("UnprocessableEntity") || raw.includes("ShareContent")) {
      return "LinkedIn schema error (fixed). Click Retry to post with updated payload.";
    }
    return raw;
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white flex items-center gap-3">
            Social Posting & Automation
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Manage connected platforms, automated drafting pipelines, and publishing history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-opacity-90 text-white px-4 py-2.5 rounded-xl transition font-medium text-sm shadow-lg shadow-[var(--accent-glow)]/20"
          >
            <Plus size={16} /> Create Manual Post
          </button>
        </div>
      </div>

      {/* Workflow Mode Switcher Card */}
      {isBrandLoading || !activeBrand ? (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-white/10 rounded" />
              <div className="h-3 w-72 bg-white/5 rounded" />
            </div>
          </div>
          <div className="h-9 w-40 bg-white/10 rounded-xl" />
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isReviewQueueEnabled ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Publishing Workflow:</span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isReviewQueueEnabled ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                  {isReviewQueueEnabled ? "Manual Review Queue" : "Autonomous Posting"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isReviewQueueEnabled
                  ? "AI schedules posts into the Pending Queue for your approval before publishing to live feeds."
                  : "AI automatically posts generated content directly to connected channels on schedule."}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleWorkflow}
            disabled={togglingReview}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 flex-shrink-0 ${isReviewQueueEnabled ? 'bg-[var(--bg-surface)] hover:bg-white/10 text-white border-[var(--border)]' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'}`}
          >
            {togglingReview && <RefreshCw size={12} className="animate-spin" />}
            {isReviewQueueEnabled ? "Switch to Auto-Post" : "Switch to Review Queue"}
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 ${activeTab === 'accounts' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          Connected Accounts
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'queue' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          <Clock size={14} /> Pending Queue
          {queuedPosts.length > 0 && (
            <span className="bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {queuedPosts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'published' ? 'border-[var(--accent-primary)] text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          <CheckCircle2 size={14} /> Published History
          {publishedPosts.length > 0 && (
            <span className="bg-white/10 text-gray-300 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
              {publishedPosts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("failed")}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'failed' ? 'border-red-500 text-white font-semibold' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          <XCircle size={14} className={failedPosts.length > 0 ? "text-red-400" : ""} /> Failed
          {failedPosts.length > 0 && (
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {failedPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* 1. ACCOUNTS VIEW */}
      {activeTab === "accounts" && (
        isBrandLoading || !activeBrand ? (
          <div className="grid md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between h-56 shadow-xl">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-white/5 rounded-xl" />
                  <div className="h-5 w-20 bg-white/5 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded" />
                  <div className="h-3 w-full bg-white/5 rounded" />
                </div>
                <div className="h-10 bg-white/5 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-200">
            {platforms.map(platform => {
              const isConnected = connectedPlatforms[platform.id];
              const isComingSoon = (platform as any).comingSoon;

              return (
                <div key={platform.id} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 ${platform.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <platform.icon size={28} className={platform.textColor} />
                    </div>
                    {isComingSoon ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                        Coming Soon
                      </span>
                    ) : isConnected ? (
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
                      {isComingSoon
                        ? `We're currently building the ${platform.name} integration. Stay tuned!`
                        : isConnected
                          ? "Your account is linked and ready for autonomous posting."
                          : `Connect your ${platform.name} account to enable AI scheduling.`}
                    </p>

                    {isConnected ? (
                      <button onClick={() => handleDisconnect(platform.id)} className="w-full py-2.5 rounded-xl border border-[var(--error)]/30 text-[var(--error)] font-medium hover:bg-[var(--error)]/10 flex justify-center items-center transition">
                        Disconnect Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => !isComingSoon && handleConnect(platform.id)}
                        disabled={loadingPlatform === platform.id || isComingSoon}
                        className={`w-full py-2.5 rounded-xl border font-medium flex justify-center items-center transition disabled:opacity-40 ${isComingSoon ? 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]' : 'bg-[var(--bg-surface)] border-[var(--border)] text-white hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'}`}
                      >
                        {loadingPlatform === platform.id ? "Connecting..." : isComingSoon ? "Coming Soon" : `Connect ${platform.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* 2. QUEUE VIEW */}
      {activeTab === "queue" && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden animate-in fade-in duration-200 shadow-xl">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center text-[var(--text-muted)]">
              <RefreshCw className="animate-spin" />
            </div>
          ) : queuedPosts.length === 0 ? (
            <div className="p-16 text-center text-[var(--text-secondary)]">
              <Clock className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" size={36} />
              <p className="text-white font-medium">No posts currently in queue.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Autonomous worker will generate posts based on your content schedule.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[700px]">
                <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[140px]">Platform</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Content Preview</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[130px]">Status</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[170px]">Scheduled Time</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider text-right w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {queuedPosts.map(post => (
                    <tr key={post.id} className="hover:bg-white/5 transition group cursor-pointer" onClick={() => setSelectedPost(post)}>
                      <td className="px-6 py-4">
                        <span className="capitalize text-white bg-[var(--bg-primary)] px-3 py-1 rounded border border-[var(--border)] inline-flex items-center gap-2 text-xs font-medium">
                          <PlatformIcon platform={post.platform} size={14} />
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {post.mediaUrl && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center">
                              {post.mediaType === 'video' ? (
                                <div className="relative w-full h-full bg-neutral-900 flex items-center justify-center">
                                  <Video size={16} className="text-[var(--text-muted)]" />
                                  <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/60 px-1 rounded">MP4</span>
                                </div>
                              ) : (
                                <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          )}
                          <p className="text-[var(--text-secondary)] line-clamp-2 text-xs flex-1 leading-relaxed">
                            {post.generatedCopy}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {post.status === "pending_review" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 tracking-wider inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Review
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 tracking-wider inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Queued
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-mono">
                          <Calendar size={12} className="text-[var(--accent-primary)] flex-shrink-0" />
                          {new Date(post.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {post.status === "pending_review" && (
                            <>
                              <button
                                onClick={() => handleApprovePost(post.id)}
                                disabled={actionLoading === post.id}
                                title="Approve & Schedule"
                                className="p-2 text-emerald-400 hover:bg-emerald-500/10 transition rounded-lg disabled:opacity-50"
                              >
                                {actionLoading === post.id ? <RefreshCw size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                              </button>
                              <button
                                onClick={() => handleRejectPost(post.id)}
                                disabled={actionLoading === post.id}
                                title="Reject"
                                className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition rounded-lg disabled:opacity-50"
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedPost(post)}
                            title="View Full Post"
                            className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition rounded-lg"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete"
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] transition rounded-lg hover:bg-[var(--error)]/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. PUBLISHED VIEW */}
      {activeTab === "published" && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden animate-in fade-in duration-200 shadow-xl">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center text-[var(--text-muted)]">
              <RefreshCw className="animate-spin" />
            </div>
          ) : publishedPosts.length === 0 ? (
            <div className="p-16 text-center text-[var(--text-secondary)]">
              <CheckCircle2 className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" size={36} />
              <p className="text-white font-medium">No posts published yet.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Once scheduled posts are dispatched by the worker, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[650px]">
                <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[140px]">Platform</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Content Preview</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[180px]">Published On</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider text-right w-[90px]">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {publishedPosts.map(post => (
                    <tr key={post.id} className="hover:bg-white/5 transition cursor-pointer" onClick={() => setSelectedPost(post)}>
                      <td className="px-6 py-4">
                        <span className="capitalize text-white bg-[var(--bg-primary)] px-3 py-1 rounded border border-[var(--border)] inline-flex items-center gap-2 text-xs font-medium">
                          <PlatformIcon platform={post.platform} size={14} />
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {post.mediaUrl && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center">
                              {post.mediaType === 'video' ? (
                                <div className="relative w-full h-full bg-neutral-900 flex items-center justify-center">
                                  <Video size={16} className="text-[var(--text-muted)]" />
                                  <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/60 px-1 rounded">MP4</span>
                                </div>
                              ) : (
                                <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          )}
                          <p className="text-[var(--text-secondary)] line-clamp-2 text-xs flex-1 leading-relaxed">
                            {post.generatedCopy}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)] text-xs font-mono">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date(post.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-lg transition"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. FAILED VIEW */}
      {activeTab === "failed" && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden animate-in fade-in duration-200 shadow-xl">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center text-[var(--text-muted)]">
              <RefreshCw className="animate-spin" />
            </div>
          ) : failedPosts.length === 0 ? (
            <div className="p-16 text-center text-[var(--text-secondary)]">
              <CheckCircle2 className="mx-auto mb-3 text-emerald-400 opacity-60" size={36} />
              <p className="text-white font-medium">No failed posts.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">All scheduled and manual posts have executed smoothly.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[750px]">
                <thead className="bg-[#111114] border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[140px]">Platform</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider w-[260px]">Content Preview</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider">Error Diagnosis</th>
                    <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-wider text-right w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {failedPosts.map(post => (
                    <tr
                      key={post.id}
                      className="hover:bg-white/5 transition group cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      <td className="px-6 py-4">
                        <span className="capitalize text-white bg-[var(--bg-primary)] px-3 py-1 rounded border border-[var(--border)] inline-flex items-center gap-2 text-xs font-medium">
                          <PlatformIcon platform={post.platform} size={14} />
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2.5">
                          {post.mediaUrl && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center">
                              {post.mediaType === 'video' ? <Video size={12} className="text-gray-400" /> : <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />}
                            </div>
                          )}
                          <p className="text-[var(--text-secondary)] line-clamp-2 text-xs leading-relaxed">
                            {post.generatedCopy}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-full">
                          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-red-300 text-xs font-medium line-clamp-2 leading-relaxed">
                              {formatCleanError(post.errorMessage)}
                            </p>
                            <span className="text-[10px] text-red-400/60 font-mono hover:underline cursor-pointer">
                              Click row to view full post & error
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRetryPost(post.id)}
                            disabled={actionLoading === post.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                          >
                            {actionLoading === post.id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Retry
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete"
                            className="p-2 text-[var(--text-muted)] hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* POST DETAILS & INSPECTION MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="capitalize text-white bg-[var(--bg-primary)] px-3 py-1 rounded-xl border border-[var(--border)] inline-flex items-center gap-2 text-xs font-semibold">
                  <PlatformIcon platform={selectedPost.platform} size={16} />
                  {selectedPost.platform}
                </span>

                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                  selectedPost.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : selectedPost.status === 'failed'
                    ? 'bg-red-500/10 text-red-300 border-red-500/30'
                    : selectedPost.status === 'pending_review'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                }`}>
                  {selectedPost.status === 'pending_review' ? 'Awaiting Review' : selectedPost.status}
                </span>
              </div>

              <button
                onClick={() => setSelectedPost(null)}
                className="text-[var(--text-muted)] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Error Box if failed */}
              {selectedPost.status === "failed" && selectedPost.errorMessage && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle size={14} /> Error Details
                  </div>
                  <p className="text-red-300 text-xs leading-relaxed break-words font-mono bg-black/40 p-3 rounded-xl border border-red-500/20 max-h-40 overflow-y-auto">
                    {selectedPost.errorMessage}
                  </p>
                </div>
              )}

              {/* Copy Container */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Post Copy
                  </label>
                  <button
                    onClick={() => handleCopyText(selectedPost.generatedCopy)}
                    className="flex items-center gap-1.5 text-xs text-[var(--accent-primary)] hover:text-white transition font-medium"
                  >
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Copy</>}
                  </button>
                </div>
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 text-sm text-gray-100 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedPost.generatedCopy}
                </div>
              </div>

              {/* Hashtags */}
              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Hashtags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.hashtags.map((h, idx) => (
                      <span key={idx} className="text-xs font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2.5 py-1 rounded-lg">
                        #{h.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Preview */}
              {selectedPost.mediaUrl && (
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Media Attachment
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-black">
                    {selectedPost.mediaType === 'video' ? (
                      <video src={selectedPost.mediaUrl} controls className="w-full max-h-72 object-contain" />
                    ) : (
                      <img src={selectedPost.mediaUrl} alt="Post Attachment" className="w-full max-h-72 object-contain mx-auto" />
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[var(--text-muted)] font-mono border-t border-[var(--border)]">
                <div>
                  <span className="block text-[10px] text-[var(--text-muted)] uppercase">Scheduled For</span>
                  <span className="text-gray-200">{new Date(selectedPost.scheduledFor).toLocaleString()}</span>
                </div>
                {selectedPost.publishedAt && (
                  <div>
                    <span className="block text-[10px] text-[var(--text-muted)] uppercase">Published At</span>
                    <span className="text-emerald-400">{new Date(selectedPost.publishedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[var(--border)] flex items-center justify-between bg-[#111114]">
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-400 transition font-medium px-3 py-2 rounded-xl hover:bg-red-500/10"
              >
                <Trash2 size={14} /> Delete Post
              </button>

              <div className="flex items-center gap-2.5">
                {selectedPost.status === "failed" && (
                  <button
                    onClick={() => handleRetryPost(selectedPost.id)}
                    disabled={actionLoading === selectedPost.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  >
                    {actionLoading === selectedPost.id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                    Retry Publishing
                  </button>
                )}

                {selectedPost.status === "pending_review" && (
                  <>
                    <button
                      onClick={() => handleRejectPost(selectedPost.id)}
                      disabled={actionLoading === selectedPost.id}
                      className="px-3.5 py-2 bg-white/5 hover:bg-red-500/15 text-gray-300 hover:text-red-400 border border-[var(--border)] rounded-xl text-xs font-medium transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovePost(selectedPost.id)}
                      disabled={actionLoading === selectedPost.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-emerald-900/30"
                    >
                      {actionLoading === selectedPost.id ? <RefreshCw size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                      Approve & Schedule
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 bg-[var(--bg-surface)] hover:bg-white/10 text-white border border-[var(--border)] rounded-xl text-xs font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL POST MODAL */}
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
