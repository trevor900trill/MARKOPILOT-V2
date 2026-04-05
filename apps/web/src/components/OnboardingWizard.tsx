"use client";

import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brandName: "",
    brandDescription: "",
    websiteUrl: "",
    industry: "",
    audienceDescription: "",
    jobTitles: [] as string[],
    painPoints: [] as string[],
    geographies: [] as string[],
    formality: "Professional",
    humour: "Subtle",
    assertiveness: "Balanced",
    empathy: "Medium",
    contentPillars: [] as string[],
  });

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const nextStep = () => setStep(s => s + 1);

  // Example placeholder user data mapping
  const user = { name: "Founder", photo: "" };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-[var(--text-primary)]">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Step Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-elevated)]">
          <div className="h-full bg-[var(--accent-primary)] transition-all duration-500" style={{ width: `${(step / 7) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-24 h-24 bg-[var(--bg-elevated)] rounded-full mx-auto mb-4 border border-[var(--border)] flex items-center justify-center">
              {user.photo ? <img src={user.photo} className="rounded-full" alt="Profile" /> : <span className="text-3xl text-[var(--text-muted)]">👋</span>}
            </div>
            <h1 className="font-serif text-4xl text-white">Welcome to Markopilot, {user.name}.</h1>
            <p className="text-[var(--text-secondary)] text-lg">Let's set up your first brand in about 2 minutes.</p>
            <button onClick={nextStep} className="w-full py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 flex justify-center gap-2 items-center">
              Let's get started <ArrowRight size={18} />
            </button>
          </div>
        )}

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
                  <option value="SaaS">Software & SaaS</option>
                  <option value="Ecommerce">Ecommerce</option>
                  <option value="Agency">Creative Agency</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button onClick={nextStep} disabled={!formData.brandName || !formData.brandDescription || !formData.industry} className="w-full py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-white">Target Audience</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-4">Who are we trying to reach?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Audience Description</label>
                <textarea value={formData.audienceDescription} onChange={(e) => updateForm("audienceDescription", e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white h-20 focus:outline-none focus:border-[var(--accent-primary)]" placeholder="e.g. B2B Founders in Europe" />
              </div>
              {/* Fake tag input for MVP visually */}
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Job Titles</label>
                <input type="text" className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Press enter to add..." />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Pain Points</label>
                <input type="text" className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Press enter to add..." />
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90">
              Continue
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-white">Brand Voice</h2>
            <div className="space-y-6">
              {[
                { label: "Formality", opts: ["Casual", "Professional", "Executive"], val: formData.formality, set: (v:string)=>updateForm("formality", v) },
                { label: "Humour", opts: ["None", "Subtle", "Playful"], val: formData.humour, set: (v:string)=>updateForm("humour", v) },
                { label: "Assertiveness", opts: ["Soft", "Balanced", "Bold"], val: formData.assertiveness, set: (v:string)=>updateForm("assertiveness", v) },
                { label: "Empathy", opts: ["Low", "Medium", "High"], val: formData.empathy, set: (v:string)=>updateForm("empathy", v) }
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
            <button onClick={nextStep} className="w-full py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90">
              Continue
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <h2 className="font-serif text-3xl text-white">Content Pillars</h2>
             <p className="text-[var(--text-secondary)] text-sm mb-4">What main topics will your social media cover?</p>
             <div>
                <input type="text" className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)]" placeholder="Type a topic and press enter..." />
             </div>
             <button className="w-full py-3 rounded-xl border border-[var(--accent-primary)] text-[var(--accent-primary)] flex items-center justify-center gap-2 hover:bg-[var(--accent-glow)] transition">
               <Sparkles size={16} /> Suggest Pillars with AI
             </button>
             <button onClick={nextStep} className="w-full py-4 mt-8 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90">
              Continue
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="font-serif text-3xl text-center text-white">Choose a Plan</h2>
            <div className="space-y-4">
              {['Starter', 'Growth'].map(plan => (
                <div key={plan} className={`p-4 rounded-xl border cursor-pointer transition ${plan === 'Growth' ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]' : 'border-[var(--border)] bg-[var(--bg-elevated)]'}`}>
                   <h3 className="font-medium text-white">{plan}</h3>
                   <p className="text-sm text-[var(--text-secondary)]">{plan === 'Growth' ? '$49/mo • 150 Posts • 500 Leads' : '$19/mo • 30 Posts • 100 Leads'}</p>
                </div>
              ))}
            </div>
            <button onClick={nextStep} className="w-full text-[var(--text-muted)] text-sm hover:underline py-2">
              Skip for now (continue with free trial)
            </button>
          </div>
        )}

        {step === 7 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="w-20 h-20 bg-[var(--success)]/20 text-[var(--success)] rounded-full mx-auto flex items-center justify-center">
               <Check size={40} />
             </div>
             <h2 className="font-serif text-3xl text-white">Setup Complete</h2>
             <p className="text-[var(--text-secondary)]">Your brand is fully configured. Our discovery engine is turning on...</p>
             <a href="/dashboard" className="block w-full py-4 mt-8 rounded-full bg-[var(--success)] text-[var(--bg-primary)] font-medium hover:opacity-90 mt-8">
               Go to Dashboard
             </a>
          </div>
        )}

      </div>
    </div>
  );
}
