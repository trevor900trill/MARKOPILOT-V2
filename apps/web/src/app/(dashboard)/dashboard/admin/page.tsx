"use client";

import { useState, useEffect, useMemo } from "react";
import { useBrand } from "@/lib/brand-context";
import { apiGet, apiPost } from "@/lib/api-client";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  Calendar,
  CreditCard,
  Check,
  X,
  Clock,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Smartphone,
  Copy,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/lib/plans";

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  onboardingCompleted: boolean;
  subscriptionStatus: string;
  planName: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  quotaLeadsPerMonth: number;
  quotaPostsPerMonth: number;
  quotaBrandsAllowed: number;
  quotaLeadsUsed: number;
  quotaPostsUsed: number;
  brandsCount: number;
  brandNames: string[];
  isEngineActive: boolean;
  pendingPaymentsCount: number;
  createdAt: string;
}

interface ManualPayment {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  planName: string;
  amount: number;
  phoneNumber: string;
  transactionCode: string | null;
  mpesaMessage: string;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export default function AdminDashboardPage() {
  const { user } = useBrand();
  const [activeTab, setActiveTab] = useState<"users" | "payments">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Engine Trigger Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [triggerPlan, setTriggerPlan] = useState("starter");
  const [triggerMonths, setTriggerMonths] = useState(1);
  const [isTriggering, setIsTriggering] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isSuperAdmin = user?.email?.toLowerCase() === "trevormugolawrence@gmail.com";

  const loadData = async () => {
    if (!isSuperAdmin) return;
    setIsLoading(true);
    try {
      const [usersRes, paymentsRes] = await Promise.all([
        apiGet<AdminUser[]>("/admin/users"),
        apiGet<ManualPayment[]>("/admin/manual-payments")
      ]);
      setUsers(usersRes || []);
      setPayments(paymentsRes || []);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      toast.error(err?.message || "Failed to load admin data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open trigger modal for a user
  const handleOpenTriggerModal = (u: AdminUser) => {
    setSelectedUser(u);
    setTriggerPlan(u.planName || "starter");
    setTriggerMonths(1);
  };

  // Execute engine start + subscription extension
  const handleExecuteEngineStart = async () => {
    if (!selectedUser) return;
    setIsTriggering(true);

    try {
      const res = await apiPost<{ success: boolean; message: string }>(
        `/admin/users/${selectedUser.id}/activate-subscription`,
        {
          planName: triggerPlan,
          monthsToAdd: triggerMonths
        }
      );

      if (res.success) {
        toast.success(res.message || `Activated subscription and started engines for ${selectedUser.email}!`);
        setSelectedUser(null);
        await loadData();
      }
    } catch (err: any) {
      console.error("Error activating subscription:", err);
      toast.error(err?.message || "Failed to activate subscription.");
    } finally {
      setIsTriggering(false);
    }
  };

  // Approve manual payment
  const handleApprovePayment = async (paymentId: string, email: string) => {
    try {
      const res = await apiPost<{ success: boolean; message: string }>(
        `/admin/manual-payments/${paymentId}/approve`,
        {}
      );
      if (res.success) {
        toast.success(`Payment approved & engines started for ${email}!`);
        await loadData();
      }
    } catch (err: any) {
      console.error("Error approving payment:", err);
      toast.error(err?.message || "Failed to approve payment.");
    }
  };

  // Reject manual payment
  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt("Enter optional rejection note:", "Payment details could not be verified.");
    if (reason === null) return; // user cancelled prompt

    try {
      const res = await apiPost<{ success: boolean; message: string }>(
        `/admin/manual-payments/${paymentId}/reject`,
        { notes: reason }
      );
      if (res.success) {
        toast.info("Payment submission marked as rejected.");
        await loadData();
      }
    } catch (err: any) {
      console.error("Error rejecting payment:", err);
      toast.error(err?.message || "Failed to reject payment.");
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.brandNames.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "active") return u.isEngineActive;
      if (statusFilter === "paused") return !u.isEngineActive;
      if (statusFilter === "onboarded") return u.onboardingCompleted;
      if (statusFilter === "pending-payment") return u.pendingPaymentsCount > 0;
      return true;
    });
  }, [users, searchQuery, statusFilter]);

  // Metrics
  const totalOnboarded = users.filter(u => u.onboardingCompleted).length;
  const activeEngines = users.filter(u => u.isEngineActive).length;
  const pendingPaymentsCount = payments.filter(p => p.status === "pending").length;

  // Render unauthorized state if not Trevor
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-serif text-white">Super Admin Access Required</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md">
          This operations module is restricted to <strong>trevormugolawrence@gmail.com</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 text-amber-300">
              Super Administrator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            Operations & Engine Command Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage onboarded accounts, extend subscriptions +1 month, restart autonomous engines, and verify manual M-PESA payments.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition disabled:opacity-50"
        >
          <RotateCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Onboarded Users</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalOnboarded}</div>
          <p className="text-[11px] text-[var(--text-muted)]">{users.length} total registered accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Live Active Engines</span>
            <Zap size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{activeEngines}</div>
          <p className="text-[11px] text-[var(--text-muted)]">Autonomously generating leads & posts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Paused Engines</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{users.length - activeEngines}</div>
          <p className="text-[11px] text-[var(--text-muted)]">Awaiting activation or renewal</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 relative overflow-hidden">
          {pendingPaymentsCount > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Pending M-PESA Reviews</span>
            <Smartphone size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendingPaymentsCount}</div>
          <p className="text-[11px] text-[var(--text-muted)]">Awaiting manual approval</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === "users"
              ? "border-[var(--accent-primary)] text-white"
              : "border-transparent text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <Users size={16} /> Onboarded Users & Engines ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === "payments"
              ? "border-[var(--accent-primary)] text-white"
              : "border-transparent text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <Smartphone size={16} /> M-PESA Submissions
          {pendingPaymentsCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingPaymentsCount} new
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ONBOARDED USERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by email, name, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)] transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
              {[
                { id: "all", label: "All Users" },
                { id: "active", label: "Engines Live" },
                { id: "paused", label: "Engines Paused" },
                { id: "onboarded", label: "Onboarded Only" },
                { id: "pending-payment", label: "Pending Payment" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    statusFilter === f.id
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[#101014] text-[var(--text-muted)] font-medium">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Brands</th>
                    <th className="py-3.5 px-4">Plan & Status</th>
                    <th className="py-3.5 px-4">Subscription Ends</th>
                    <th className="py-3.5 px-4">Engine State</th>
                    <th className="py-3.5 px-4 text-right">Action Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                        <div className="w-6 h-6 border-2 border-white/10 border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto mb-2" />
                        Loading user directory...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      // Calculate expiration status
                      const expiryDate = u.currentPeriodEnd
                        ? new Date(u.currentPeriodEnd)
                        : u.trialEndsAt
                        ? new Date(u.trialEndsAt)
                        : null;

                      const now = new Date();
                      const isExpired = expiryDate ? expiryDate.getTime() < now.getTime() : false;
                      const daysRemaining = expiryDate
                        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition">
                          {/* User Details */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-white truncate flex items-center gap-1.5">
                                  <span>{u.displayName || "Anonymous Founder"}</span>
                                  {u.onboardingCompleted ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Onboarded" />
                                  ) : (
                                    <span className="text-[10px] text-gray-500" title="Incomplete Onboarding">(pending)</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Brands */}
                          <td className="py-4 px-4">
                            {u.brandsCount > 0 ? (
                              <div className="space-y-1">
                                <span className="font-semibold text-white">{u.brandsCount} Brand{u.brandsCount > 1 ? "s" : ""}</span>
                                <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[140px]">
                                  {u.brandNames.join(", ")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[var(--text-muted)] text-[11px]">No brands yet</span>
                            )}
                          </td>

                          {/* Plan & Status */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-white/5 text-white border border-white/10">
                                {u.planName || "Starter"}
                              </span>
                              <div className="text-[10px] text-[var(--text-muted)] capitalize">
                                {u.subscriptionStatus}
                              </div>
                            </div>
                          </td>

                          {/* Subscription Ends Column */}
                          <td className="py-4 px-4">
                            {expiryDate ? (
                              <div className="space-y-1">
                                <div className="font-medium text-white flex items-center gap-1.5">
                                  <Calendar size={13} className="text-[var(--text-muted)]" />
                                  <span>
                                    {expiryDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </span>
                                </div>
                                <div>
                                  {isExpired ? (
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                      Expired {Math.abs(daysRemaining || 0)}d ago
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      In {daysRemaining} days
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[var(--text-muted)] text-[11px]">No end date</span>
                            )}
                          </td>

                          {/* Engine State */}
                          <td className="py-4 px-4">
                            {u.isEngineActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Running
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Paused
                              </span>
                            )}
                          </td>

                          {/* Action Trigger */}
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleOpenTriggerModal(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-xs transition shadow-md shadow-emerald-500/10"
                            >
                              <Play size={12} className="fill-black" />
                              Start Engine & +1 Mo
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL PAYMENT SUBMISSIONS */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-1">
            <span>Past and incoming manual M-PESA payment receipts</span>
            <span>{payments.length} total recorded submissions</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="p-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
                <div className="w-6 h-6 border-2 border-white/10 border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto mb-2" />
                Loading submissions...
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
                No manual payment submissions yet.
              </div>
            ) : (
              payments.map((p) => {
                const isPending = p.status === "pending";
                const isApproved = p.status === "approved";

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border transition space-y-4 ${
                      isPending
                        ? "bg-[#111217] border-amber-500/40 shadow-lg shadow-amber-500/5"
                        : isApproved
                        ? "bg-[var(--bg-surface)] border-emerald-500/30"
                        : "bg-[var(--bg-surface)] border-[var(--border)] opacity-70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isPending
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : isApproved
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{p.userEmail}</span>
                            {p.userDisplayName && (
                              <span className="text-xs text-[var(--text-muted)]">({p.userDisplayName})</span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] flex items-center gap-3 mt-0.5">
                            <span>Paid from: <strong className="font-mono text-gray-300">{p.phoneNumber}</strong></span>
                            <span>•</span>
                            <span>{new Date(p.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-sm font-bold text-emerald-400">
                          KES {p.amount?.toLocaleString()} ({p.planName})
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                              : isApproved
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>

                    {/* M-PESA SMS Message Box */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-gray-300 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>FULL M-PESA CONFIRMATION MESSAGE:</span>
                        {p.transactionCode && (
                          <span className="text-emerald-400 font-bold">TX Code: {p.transactionCode}</span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap select-all text-xs leading-relaxed text-emerald-100/90">
                        {p.mpesaMessage}
                      </p>
                    </div>

                    {/* Action buttons on pending submissions */}
                    {isPending && (
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleRejectPayment(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 border border-white/10 text-xs font-medium text-gray-400 hover:text-red-300 transition"
                        >
                          Reject Submission
                        </button>

                        <button
                          onClick={() => handleApprovePayment(p.id, p.userEmail)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                        >
                          <Check size={14} /> Approve & Start Engine
                        </button>
                      </div>
                    )}

                    {p.reviewedAt && (
                      <div className="text-[11px] text-gray-500 flex items-center gap-2 pt-1 border-t border-white/5">
                        <span>Reviewed by: {p.reviewedBy || "Admin"}</span>
                        <span>•</span>
                        <span>{new Date(p.reviewedAt).toLocaleString()}</span>
                        {p.adminNotes && <span>• Note: {p.adminNotes}</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: START ENGINE & EXTEND PLAN */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0e0e12] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Action Trigger
              </span>
              <h3 className="text-xl font-semibold text-white">Start Engines & Renew Subscription</h3>
              <p className="text-xs text-[var(--text-muted)]">
                For user <strong className="text-white">{selectedUser.email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              {/* Select Plan to Activate */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Plan Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTriggerPlan(p.id)}
                      className={`p-2.5 rounded-xl border text-xs text-left transition ${
                        triggerPlan === p.id
                          ? "bg-emerald-500/10 border-emerald-500 text-white font-semibold"
                          : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <div>{p.name}</div>
                      <div className="text-[10px] text-emerald-400 font-bold mt-1">{p.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Months */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Subscription Duration Extension
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { months: 1, label: "+1 Month (30d)" },
                    { months: 2, label: "+2 Months (60d)" },
                    { months: 3, label: "+3 Months (90d)" }
                  ].map((m) => (
                    <button
                      key={m.months}
                      type="button"
                      onClick={() => setTriggerMonths(m.months)}
                      className={`p-2.5 rounded-xl border text-xs text-center transition ${
                        triggerMonths === m.months
                          ? "bg-emerald-500/10 border-emerald-500 text-white font-semibold"
                          : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automated Actions Checklist Preview */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs text-gray-300">
                <div className="text-[11px] font-semibold text-white">This trigger will automatically:</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={13} className="text-emerald-400" />
                  <span>Update subscription status to <strong>Active</strong> & add +{triggerMonths * 30} days</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={13} className="text-emerald-400" />
                  <span>Resume automations & reschedule background discovery / social engines</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={13} className="text-emerald-400" />
                  <span>Send in-app notification & activity feed log</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check size={13} className="text-emerald-400" />
                  <span>Dispatch transactional confirmation email via Resend</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteEngineStart}
                disabled={isTriggering}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isTriggering ? (
                  <>
                    <RotateCw size={14} className="animate-spin" /> Starting Engines...
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-black" /> Confirm & Start Engines
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
