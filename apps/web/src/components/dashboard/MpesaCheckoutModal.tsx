"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, CheckCircle2, Loader2, ShieldCheck, ArrowRight, Copy, Check } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { apiPost } from "@/lib/api-client";
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
  const [mpesaMessage, setMpesaMessage] = useState("");
  const [step, setStep] = useState<"instructions" | "success">("instructions");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[0];

  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId(initialPlanId);
      setStep("instructions");
      setMpesaMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, initialPlanId]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.trim().length < 9) {
      toast.error("Please enter the Safaricom phone number used to make payment.");
      return;
    }

    if (!mpesaMessage || mpesaMessage.trim().length < 10) {
      toast.error("Please paste the M-PESA confirmation SMS message you received.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiPost<{ success: boolean; message: string }>("/subscriptions/manual-payment", {
        planId: selectedPlan.id,
        phoneNumber: phoneNumber.trim(),
        mpesaMessage: mpesaMessage.trim()
      });

      if (res.success) {
        setStep("success");
        toast.success("Payment details submitted successfully!");
        if (onSuccess) onSuccess();
      } else {
        toast.error("Unable to submit payment. Please verify your details.");
      }
    } catch (err: any) {
      console.error("Manual payment error:", err);
      toast.error(err?.message || "Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e0e12] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition z-10"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">M-PESA Subscription Payment</h2>
            <p className="text-xs text-gray-400">Instant verification & manual activation by our team</p>
          </div>
        </div>

        {step === "instructions" ? (
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            {/* Plan Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                1. Select Your Plan
              </label>
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

            {/* Official Payment Destination Card */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                2. Pay via M-PESA Till (Buy Goods)
              </label>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#13141a] to-[#0c0d12] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-gray-400">Recipient Name</span>
                  <span className="font-semibold text-emerald-400">Trevor Lawrence Mugo</span>
                </div>

                {/* Buy Goods / Till Number */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Buy Goods Till No.</span>
                    <span className="font-mono font-bold text-white text-base tracking-wide">1635990</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("1635990", "Till Number")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition font-medium"
                    title="Copy Till Number"
                  >
                    {copiedField === "Till Number" ? (
                      <>
                        <Check size={14} className="text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Till
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Steps */}
                <div className="text-[11px] text-gray-400 space-y-1 pt-1 bg-black/30 p-2.5 rounded-xl border border-white/5 font-sans">
                  <div className="text-white font-medium text-xs mb-1">Payment Steps:</div>
                  <div>1. Go to <strong>Lipa na M-PESA</strong> &rarr; <strong>Buy Goods and Services</strong></div>
                  <div>2. Enter Till No. <strong className="font-mono text-emerald-400">1635990</strong></div>
                  <div>3. Enter Amount: <strong className="text-white">{selectedPlan.price}</strong></div>
                  <div>4. Confirm recipient: <strong className="text-emerald-400">Trevor Lawrence Mugo</strong> & enter your PIN</div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-gray-400">Total Due (30 Days):</span>
                  <span className="text-base font-bold text-white">{selectedPlan.price}</span>
                </div>
              </div>
            </div>

            {/* Submission Details */}
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                3. Share Your Payment Confirmation
              </label>

              {/* Phone Number Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300">Your Safaricom Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0712 345 678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm text-white placeholder:text-gray-600 transition font-mono"
                  required
                />
              </div>

              {/* M-PESA SMS Confirmation Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300">M-PESA Confirmation SMS / Message</label>
                  <span className="text-[10px] text-gray-500">Paste the full message or code</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. QK87YTREWQ Confirmed. Ksh3,900.00 sent to Trevor Lawrence Mugo on 9/9/26 at 9:00 AM..."
                  value={mpesaMessage}
                  onChange={(e) => setMpesaMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-xs text-white placeholder:text-gray-600 transition font-mono resize-none"
                  required
                />
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting for Review...
                </>
              ) : (
                <>
                  Submit Payment Details <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Under Review Confirmation */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">Payment Details Received</h3>
              <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                Thank you! We have received your M-PESA payment details for the <strong className="text-emerald-400">{selectedPlan.name}</strong> plan.
              </p>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-gray-300 max-w-md mx-auto space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>A member of our team will review and activate your subscription shortly.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Once activated, your autonomous marketing, lead extraction, and social posting engines will restart automatically.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>You will receive an email confirmation and in-app notification when live.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition shadow-lg"
            >
              Got It, Return to Dashboard
            </button>
          </div>
        )}

        {/* Compliance Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500" /> Manual M-PESA Verification
          </span>
          <span>Account: Trevor Lawrence Mugo</span>
        </div>
      </div>
    </div>
  );
}
