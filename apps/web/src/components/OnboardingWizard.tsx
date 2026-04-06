"use client";

import { useState } from "react";
import { ArrowRight, Check, Sparkles, Loader2, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  { value: "SaaS", label: "Software & SaaS" },
  { value: "Ecommerce", label: "Ecommerce" },
  { value: "ProfessionalServices", label: "Professional Services" },
  { value: "Agency", label: "Creative Agency" },
  { value: "Consulting", label: "Consulting" },
  { value: "RealEstate", label: "Real Estate" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Education", label: "Education" },
  { value: "FoodBeverage", label: "Food & Beverage" },
  { value: "NonProfit", label: "Non-Profit" },
  { value: "PersonalBrand", label: "Personal Brand" },
  { value: "Other", label: "Other" },
];

const PLANS = [
  { id: "Starter", price: "$19", posts: "30 Posts", leads: "100 Leads", brands: "1 Brand" },
  { id: "Growth", price: "$49", posts: "120 Posts", leads: "500 Leads", brands: "3 Brands", featured: true },
  { id: "Scale", price: "$149", posts: "Unlimited Posts", leads: "2,000 Leads", brands: "10 Brands" },
];

export function OnboardingWizard() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    brandName: "",
    brandDescription: "",
    websiteUrl: "",
    industry: "",
    industryCustom: "",
    audienceDescription: "",
    jobTitles: [] as string[],
    painPoints: [] as string[],
    geographies: [] as string[],
    formality: "Professional",
    humour: "Subtle",
    assertiveness: "Balanced",
    empathy: "Medium",
    contentPillars: [] as string[],
    selectedPlan: "Starter",
  });

  // Tag input helpers
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [painPointInput, setPainPointInput] = useState("");
  const [geoInput, setGeoInput] = useState("");
  const [pillarInput, setPillarInput] = useState("");

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleTagKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: (v: string) => void,
    field: string,
    max: number
  ) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const current = (formData as any)[field] as string[];
      if (current.length < max) {
        updateForm(field, [...current, input.trim()]);
        setInput("");
      }
    }
  };

  const removeTag = (field: string, index: number) => {
    const current = (formData as any)[field] as string[];
    updateForm(field, current.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (!session?.user?.id) return;
    setIsSubmitting(true);

    try {
      const token = (session as any).supabaseAccessToken;
      const envApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5030";
      const API_BASE_URL = envApiUrl.endsWith("/api") ? envApiUrl : `${envApiUrl}/api`;

      // 1. Create the Brand via .NET API
      const brandRes = await fetch(`${API_BASE_URL}/brands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.brandName,
          description: formData.brandDescription,
          websiteUrl: formData.websiteUrl,
          industry: formData.industry,
          industryCustom: formData.industry === "Other" ? formData.industryCustom : null,
          targetAudienceDescription: formData.audienceDescription,
          targetJobTitles: formData.jobTitles,
          targetPainPoints: formData.painPoints,
          targetGeographies: formData.geographies,
          brandVoiceFormality: formData.formality.toLowerCase(),
          brandVoiceHumour: formData.humour.toLowerCase(),
          brandVoiceAssertiveness: formData.assertiveness.toLowerCase(),
          brandVoiceEmpathy: formData.empathy.toLowerCase(),
          contentPillars: formData.contentPillars,
        })
      });

      if (!brandRes.ok) throw new Error("Failed to create brand");

      // 2. Mark User as Onboarded via .NET API
      const userRes = await fetch(`${API_BASE_URL}/users/onboarding-complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!userRes.ok) throw new Error("Failed to update onboarding status");

      // 3. Update the local session
      await update({ onboardingCompleted: true });

      // 4. Move to success step
      setStep(8);
    } catch (err) {
      console.error("Onboarding failed:", err);
      alert("Failed to save your brand. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const user = session?.user || { name: "Pilot", image: "" };
  const totalSteps = 7;

  const TagDisplay = ({ field }: { field: string }) => {
    const tags = (formData as any)[field] as string[];
    if (!tags.length) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full text-xs font-medium"
          >
            {tag}
            <button
              onClick={() => removeTag(field, i)}
              className="hover:text-white transition text-[var(--accent-primary)]/60"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-[var(--text-primary)]">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Step Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-elevated)]">
          <div className="h-full bg-[var(--accent-primary)] transition-all duration-500" style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }} />
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-24 h-24 bg-[var(--bg-elevated)] rounded-full mx-auto mb-4 border border-[var(--border)] flex items-center justify-center overflow-hidden">
              {user.image ? <img src={user.image} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" /> : <span className="text-3xl text-[var(--text-muted)]">👋</span>}
            </div>
            <h1 className="font-serif text-4xl text-white">Welcome, {(user as any).name?.split(' ')[0] || "Pilot"}.</h1>
            <p className="text-[var(--text-secondary)] text-lg">Let&apos;s set up your first brand in about 2 minutes.</p>
            <button onClick={nextStep} className="w-full py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 flex justify-center gap-2 items-center">
              Let&apos;s get started <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2 — Create Your First Brand */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-white">Create Your First Brand</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Brand Name *</label>
                <input type="text" value={formData.brandName} onChange={(e) => updateForm("brandName", e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Short Description *</label>
                <textarea value={formData.brandDescription} onChange={(e) => updateForm("brandDescription", e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white h-24 focus:outline-none focus:border-[var(--accent-primary)]" placeholder="What does your company do?" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Website URL</label>
                <input type="url" value={formData.websiteUrl} onChange={(e) => updateForm("websiteUrl", e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Industry *</label>
                <select value={formData.industry} onChange={(e) => updateForm("industry", e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)] appearance-none">
                  <option value="">Select Industry...</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
              </div>
              {formData.industry === "Other" && (
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Describe Your Industry *</label>
                  <input type="text" value={formData.industryCustom} onChange={(e) => updateForm("industryCustom", e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="e.g. Veterinary Services" />
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 mt-8 rounded-full border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-white/5">Back</button>
              <button onClick={nextStep} disabled={!formData.brandName || !formData.brandDescription || !formData.industry || (formData.industry === "Other" && !formData.industryCustom)} className="flex-[2] py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 — Define Your Target Audience */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-white">Target Audience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Audience Description</label>
                <textarea value={formData.audienceDescription} onChange={(e) => updateForm("audienceDescription", e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white h-20 focus:outline-none focus:border-[var(--accent-primary)]" placeholder="e.g. B2B Founders in Europe" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Job Titles (press Enter to add, up to 10)</label>
                <input
                  type="text"
                  value={jobTitleInput}
                  onChange={(e) => setJobTitleInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyDown(e, jobTitleInput, setJobTitleInput, "jobTitles", 10)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  placeholder="CEO, Marketing Manager..."
                />
                <TagDisplay field="jobTitles" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Pain Points (press Enter to add, up to 5)</label>
                <input
                  type="text"
                  value={painPointInput}
                  onChange={(e) => setPainPointInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyDown(e, painPointInput, setPainPointInput, "painPoints", 5)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  placeholder="Low leads, high churn..."
                />
                <TagDisplay field="painPoints" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Target Geographies (press Enter to add, up to 5)</label>
                <input
                  type="text"
                  value={geoInput}
                  onChange={(e) => setGeoInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyDown(e, geoInput, setGeoInput, "geographies", 5)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  placeholder="United States, Europe, Kenya..."
                />
                <TagDisplay field="geographies" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 mt-8 rounded-full border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-white/5">Back</button>
              <button onClick={nextStep} className="flex-[2] py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4 — Set Brand Voice */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-white">Brand Voice</h2>
            <div className="space-y-6">
              {[
                { label: "Formality", opts: ["Casual", "Professional", "Executive"], val: formData.formality, set: (v: string) => updateForm("formality", v) },
                { label: "Humour", opts: ["None", "Subtle", "Playful"], val: formData.humour, set: (v: string) => updateForm("humour", v) },
                { label: "Assertiveness", opts: ["Soft", "Balanced", "Bold"], val: formData.assertiveness, set: (v: string) => updateForm("assertiveness", v) },
                { label: "Empathy", opts: ["Low", "Medium", "High"], val: formData.empathy, set: (v: string) => updateForm("empathy", v) }
              ].map((group) => (
                <div key={group.label}>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">{group.label}</label>
                  <div className="flex bg-[var(--bg-elevated)] rounded-xl p-1 border border-[var(--border)]">
                    {group.opts.map(opt => (
                      <button key={opt} onClick={() => group.set(opt)} className={`flex-1 py-2 text-sm rounded-lg transition-colors ${group.val === opt ? "bg-[var(--bg-surface)] text-white shadow-sm border border-[var(--border)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 mt-8 rounded-full border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-white/5">Back</button>
              <button onClick={nextStep} className="flex-[2] py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90">Continue</button>
            </div>
          </div>
        )}

        {/* Step 5 — Choose Content Pillars */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-white">Content Pillars</h2>
            <p className="text-[var(--text-secondary)] text-sm">Add up to 5 content topics that define your brand&apos;s posting themes.</p>
            <div className="space-y-3">
              <input
                type="text"
                value={pillarInput}
                onChange={(e) => setPillarInput(e.target.value)}
                onKeyDown={(e) => handleTagKeyDown(e, pillarInput, setPillarInput, "contentPillars", 5)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]"
                placeholder="Press Enter to add (e.g. AI News, Growth Tips...)"
              />
              <TagDisplay field="contentPillars" />
              <button className="w-full py-3 rounded-xl border border-[var(--accent-primary)] text-[var(--accent-primary)] flex items-center justify-center gap-2 hover:bg-[var(--accent-glow)] transition">
                <Sparkles size={16} /> Suggest Pillars with AI
              </button>
            </div>
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 mt-8 rounded-full border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-white/5">Back</button>
              <button onClick={nextStep} className="flex-[2] py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90">Continue</button>
            </div>
          </div>
        )}

        {/* Step 6 — Choose a Plan */}
        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-white text-center">Choose Your Plan</h2>
            <div className="grid gap-4">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => updateForm("selectedPlan", plan.id)}
                  className={`p-4 rounded-2xl border transition-all text-left flex justify-between items-center ${formData.selectedPlan === plan.id ? "bg-[var(--bg-elevated)] border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-glow)]/10" : "bg-transparent border-[var(--border)] hover:border-white/20"}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-white">{plan.id}</span>
                       {plan.featured && <span className="text-[10px] bg-[var(--accent-primary)] px-2 py-0.5 rounded-full text-white font-bold uppercase">Popular</span>}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">{plan.brands}, {plan.posts}, {plan.leads}</div>
                  </div>
                  <div className="text-xl font-serif text-white">{plan.price}<span className="text-[10px] text-[var(--text-muted)] font-sans">/mo</span></div>
                </button>
              ))}
            </div>
            <p className="text-center text-[var(--text-muted)] text-[10px]">All plans start with a 14-day free trial. No credit card required.</p>
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 mt-4 rounded-full border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-white/5">Back</button>
              <button onClick={nextStep} className="flex-[2] py-4 mt-4 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90">Continue</button>
            </div>
            <button onClick={nextStep} className="w-full text-center text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] transition mt-2">
              Skip for now (continue with free trial)
            </button>
          </div>
        )}

        {/* Step 7 — Complete */}
        {step === 7 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-center text-white">Ready to Launch</h2>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
               <Zap className="mx-auto text-[var(--accent-primary)]" size={32} />
               <p className="text-gray-300">Your brand <b>{formData.brandName}</b> is ready. Once finalized, automation begins immediately.</p>
               <div className="flex flex-wrap justify-center gap-3 text-[10px] font-mono text-[var(--accent-primary)] uppercase tracking-widest">
                 <span className="flex items-center gap-1"><Check size={12} /> Discovery Engine</span>
                 <span className="flex items-center gap-1"><Check size={12} /> Content Pipeline</span>
                 <span className="flex items-center gap-1"><Check size={12} /> Outreach System</span>
               </div>
            </div>
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 mt-8 rounded-full border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-white/5">Back</button>
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-[2] py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 flex justify-center items-center gap-2 shadow-xl shadow-[var(--accent-glow)]/20"
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Finalizing...</> : <>Start My Trial <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {/* Success Screen (after step 7 completes) */}
        {step === 8 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-[var(--success)]/20 text-[var(--success)] rounded-full mx-auto flex items-center justify-center">
              <Check size={40} />
            </div>
            <h2 className="font-serif text-3xl text-white">Your Brand is Ready</h2>
            <p className="text-[var(--text-secondary)]">Automation starts in a few minutes. Your discovery engine is now operational.</p>
            <button onClick={() => router.push("/dashboard")} className="block w-full py-4 mt-8 rounded-full bg-[var(--success)] text-[var(--bg-primary)] font-medium hover:opacity-90">
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
