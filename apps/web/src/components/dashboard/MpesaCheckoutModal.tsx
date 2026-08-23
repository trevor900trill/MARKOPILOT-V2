"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ArrowRight, RefreshCw, Copy, Check } from "lucide-react";
import { PLANS, PlanDefinition } from "@/lib/plans";
import { apiPost, apiGet } from "@/lib/api-client";
import { toast } from "sonner";

interface MpesaCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: string;
  onSuccess?: () => void;
}

export function MpesaCheckoutModal({
  isOpen,
  onClose,
  initialPlanId = "starter",
  onSuccess
}: MpesaCheckoutModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "success" | "manual">("input");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptCode, setReceiptCode] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[0];

  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId(initialPlanId);
      setStep("input");
      setCheckoutRequestId(null);
      setStatusMessage("");
    }
  }, [isOpen, initialPlanId]);

  // Polling STK Push status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "processing" && checkoutRequestId) {
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds (every 2s)

      interval = setInterval(async () => {
        attempts++;
        try {
          const res = await apiGet<{ status: string; message: string }>(
            `/subscriptions/mpesa/status/${checkoutRequestId}`
          );

          if (res.status === "completed") {
            clearInterval(interval);
            setStep("success");
            toast.success("Payment received! Your subscription has been activated.");
            if (onSuccess) onSuccess();
          } else if (res.status === "failed") {
            clearInterval(interval);
            setStatusMessage(res.message || "Payment request was cancelled or timed out.");
            toast.error(res.message || "Payment was not completed.");
          } else {
            setStatusMessage(res.message || "Waiting for you to enter your M-PESA PIN...");
          }
        } catch (err) {
          console.error("Error polling M-PESA status:", err);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatusMessage("We didn't detect your payment confirmation yet. You can submit your M-PESA confirmation code below.");
          setStep("manual");
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, checkoutRequestId, onSuccess]);

  if (!isOpen) return null;

  const handleInitiateStk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 9) {
      toast.error("Please enter a valid phone number (e.g. 0712345678 or 254712345678).");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Sending STK Push prompt to your phone...");

    try {
      const res = await apiPost<{
        success: boolean;
        checkoutRequestId: string;
        customerMessage: string;
        amountKes: number;
        planName: string;
      }>("/subscriptions/mpesa/stk-push", {
        planId: selectedPlan.id,
        phoneNumber: phoneNumber.trim()
      });

      if (res.success && res.checkoutRequestId) {
        setCheckoutRequestId(res.checkoutRequestId);
        setStep("processing");
        setStatusMessage(res.customerMessage || "Please check your phone and enter your M-PESA PIN to complete.");
        toast.info("M-PESA prompt sent to your phone!");
      } else {
        toast.error("Failed to initiate STK Push. Please try manual Till payment.");
      }
    } catch (err: any) {
      console.error("STK Push error:", err);
      toast.error(err?.message || "Failed to initiate M-PESA prompt. Please check your number.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptCode || receiptCode.trim().length < 8) {
      toast.error("Please enter a valid M-PESA confirmation code (e.g., SLK89X721B).");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/subscriptions/manual-verify", {
        planId: selectedPlan.id,
        receiptCode: receiptCode.trim().toUpperCase(),
        phoneNumber: phoneNumber.trim() || undefined
      });

      setStep("success");
      toast.success("M-PESA confirmation verified! Your subscription is active.");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Manual verify error:", err);
      toast.error(err?.message || "Could not verify transaction. Please check the code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText("1635990");
    setCopied(true);
    toast.success("Till number copied to clipboard: 1635990");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e0e12] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">M-PESA Checkout</h2>
            <p className="text-xs text-gray-400">Instant activation via Safaricom STK Push &amp; Till</p>
          </div>
        </div>

        {/* STEP 1: Input Details */}
        {step === "input" && (
          <form onSubmit={handleInitiateStk} className="space-y-6">
            {/* Plan Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Select Plan</label>
              <div className="grid grid-cols-3 gap-2.5">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedPlanId === plan.id
                        ? "bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30"
                        : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{plan.name}</div>
                      <div className="text-[10px] text-gray-400">{plan.posts}</div>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-400">{plan.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Safaricom Phone Number (M-PESA)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 0712 345 678 or 2547..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm text-white placeholder:text-gray-600 transition"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400">
                You will receive a popup prompt on this phone to enter your PIN.
              </p>
            </div>

            {/* Price Summary Banner */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block">Total Due (30 Days)</span>
                <span className="text-lg font-bold text-white">{selectedPlan.price}</span>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                Autonomous Engine Enabled
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Dispatching STK Prompt...
                </>
              ) : (
                <>
                  Pay {selectedPlan.price} via STK Push <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Switch to Manual Till Option */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("manual")}
                className="text-xs text-gray-400 hover:text-white underline transition"
              >
                Prefer to pay directly via Buy Goods Till Number?
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Processing / Waiting for PIN */}
        {step === "processing" && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
              <Loader2 size={32} className="animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Check Your Phone</h3>
              <p className="text-sm text-gray-300 max-w-sm mx-auto">
                An M-PESA STK prompt has been sent to <span className="font-mono text-emerald-400">{phoneNumber}</span>.
              </p>
              <p className="text-xs text-gray-400">
                Please unlock your device and enter your M-PESA PIN to approve payment of <strong className="text-white">{selectedPlan.price}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-400 font-mono">
              Status: {statusMessage}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("manual")}
                className="text-xs text-emerald-400 hover:underline"
              >
                Enter M-PESA Confirmation Code Manually
              </button>
              <span className="text-gray-600">•</span>
              <button
                type="button"
                onClick={() => setStep("input")}
                className="text-xs text-gray-400 hover:text-white"
              >
                Change Phone Number
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Manual Till Payment & Verification */}
        {step === "manual" && (
          <form onSubmit={handleManualVerify} className="space-y-5">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Buy Goods Till Details</span>
                <button
                  type="button"
                  onClick={copyTill}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy Till"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-gray-400 block text-[10px]">Till Number</span>
                  <span className="text-base font-mono font-bold text-white">1635990</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-gray-400 block text-[10px]">Store Number</span>
                  <span className="text-base font-mono font-bold text-white">1162771</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Go to M-PESA &rarr; Lipa na M-PESA &rarr; Buy Goods and Services &rarr; Enter Till <strong>1635990</strong> &rarr; Amount <strong>{selectedPlan.price}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                M-PESA Confirmation Code (from SMS)
              </label>
              <input
                type="text"
                placeholder="e.g. SLK89X721B"
                value={receiptCode}
                onChange={(e) => setReceiptCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm text-white uppercase placeholder:normal-case placeholder:text-gray-600 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying Confirmation...
                </>
              ) : (
                <>
                  Verify Code &amp; Activate Plan <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="text-xs text-gray-400 hover:text-white underline transition"
              >
                &larr; Back to STK Push
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Screen */}
        {step === "success" && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-serif text-white">Subscription Active!</h3>
              <p className="text-sm text-gray-300 max-w-sm mx-auto">
                Your <strong className="text-emerald-400">{selectedPlan.name}</strong> plan is now active for the next 30 days.
              </p>
              <p className="text-xs text-gray-400">
                Your autonomous marketing and lead extraction engine has been started.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition shadow-lg"
            >
              Continue to Dashboard
            </button>
          </div>
        )}

        {/* Compliance Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-sans">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500" /> End-to-end encrypted M-PESA Daraja integration
          </span>
          <span>Safaricom Business Till: 1635990</span>
        </div>
      </div>
    </div>
  );
}
