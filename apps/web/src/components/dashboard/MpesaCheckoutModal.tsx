"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { PLANS } from "@/lib/plans";
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
  const [step, setStep] = useState<"input" | "processing" | "failed" | "success">("input");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[0];

  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId(initialPlanId);
      setStep("input");
      setCheckoutRequestId(null);
      setStatusMessage("");
      setErrorMessage("");
    }
  }, [isOpen, initialPlanId]);

  // Polling STK Push status via Daraja Webhook updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "processing" && checkoutRequestId) {
      let attempts = 0;
      const maxAttempts = 45; // 90 seconds (every 2s)

      interval = setInterval(async () => {
        attempts++;
        try {
          const res = await apiGet<{ status: string; message: string }>(
            `/subscriptions/mpesa/status/${checkoutRequestId}`
          );

          if (res.status === "completed") {
            clearInterval(interval);
            setStep("success");
            toast.success("Payment confirmed! Your subscription is active.");
            if (onSuccess) onSuccess();
          } else if (res.status === "failed") {
            clearInterval(interval);
            setErrorMessage(res.message || "Payment request was cancelled or declined.");
            setStep("failed");
            toast.error(res.message || "Payment was not completed.");
          } else {
            setStatusMessage(res.message || "Waiting for you to enter your M-PESA PIN...");
          }
        } catch (err) {
          console.error("Error polling M-PESA status:", err);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setErrorMessage("The payment request timed out. Please verify your phone has network reception and try again.");
          setStep("failed");
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, checkoutRequestId, onSuccess]);

  if (!isOpen) return null;

  const handleInitiateStk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 9) {
      toast.error("Please enter a valid phone number (e.g. 0712345678 or 254712345678).");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Sending STK Push prompt to your phone...");
    setErrorMessage("");

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
        toast.error("Failed to initiate STK Push. Please check your number.");
      }
    } catch (err: any) {
      console.error("STK Push error:", err);
      toast.error(err?.message || "Failed to initiate M-PESA prompt. Please check your number.");
    } finally {
      setIsSubmitting(false);
    }
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
            <h2 className="text-xl font-semibold text-white">M-PESA Express Checkout</h2>
            <p className="text-xs text-gray-400">Instant activation via Safaricom STK Push</p>
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
                  className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm text-white placeholder:text-gray-600 transition font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400">
                You will receive a secure Safaricom PIN prompt on this phone.
              </p>
            </div>

            {/* Price Summary Banner */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block">Total Due (30 Days)</span>
                <span className="text-lg font-bold text-white">{selectedPlan.price}</span>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                Autonomous Engines Resume Immediately
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
                  Pay {selectedPlan.price} via M-PESA <ArrowRight size={16} />
                </>
              )}
            </button>
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
                An M-PESA prompt has been sent to <span className="font-mono text-emerald-400 font-bold">{phoneNumber}</span>.
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
                onClick={() => setStep("input")}
                className="text-xs text-gray-400 hover:text-white underline transition"
              >
                Change Phone Number
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Failed / Timeout */}
        {step === "failed" && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Payment Incomplete</h3>
              <p className="text-xs text-red-200/80 max-w-sm mx-auto">
                {errorMessage || "The M-PESA request was cancelled or timed out before PIN was entered."}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleInitiateStk()}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending New Prompt...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} /> Resend Prompt to {phoneNumber}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("input")}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition"
              >
                Use Different Phone Number
              </button>
            </div>
          </div>
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
                Your autonomous marketing, social broadcasting, and lead mining engines have resumed.
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
            <ShieldCheck size={12} className="text-emerald-500" /> End-to-end encrypted Safaricom Daraja STK Push
          </span>
          <span>Verified Webhook Callback</span>
        </div>
      </div>
    </div>
  );
}

