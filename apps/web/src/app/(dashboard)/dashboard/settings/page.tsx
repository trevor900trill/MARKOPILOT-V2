"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Save } from "lucide-react";

export default function BrandSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    websiteUrl: "",
    industry: "",
    targetAudienceDescription: "",
    brandVoiceFormality: "professional",
    brandVoiceHumour: "subtle",
    brandVoiceAssertiveness: "balanced",
    brandVoiceEmpathy: "medium",
  });

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const fetchBrand = async () => {
     // Placeholder: Fetch the first brand for now (until ID routing is built)
  };

  const handleSave = async () => {
    setLoading(true);
    // Placeholder API call to PUT /api/brands passing session.supabaseAccessToken
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-serif text-white">Brand Settings</h1>
         <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition flex gap-2 items-center">
             <Save size={16} /> Save Changes
         </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
           <h2 className="text-xl font-medium text-white mb-4">General</h2>
           <div>
             <label className="block text-sm text-[var(--text-secondary)] mb-1">Brand Name</label>
             <input type="text" value={formData.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-white focus:border-[var(--accent-primary)] outline-none" />
           </div>
           <div>
             <label className="block text-sm text-[var(--text-secondary)] mb-1">Description</label>
             <textarea value={formData.description} onChange={(e) => updateForm("description", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-white h-24 focus:border-[var(--accent-primary)] outline-none" />
           </div>
           <div>
             <label className="block text-sm text-[var(--text-secondary)] mb-1">Website URL</label>
             <input type="url" value={formData.websiteUrl} onChange={(e) => updateForm("websiteUrl", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-white focus:border-[var(--accent-primary)] outline-none" />
           </div>
        </section>

        <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
           <h2 className="text-xl font-medium text-white mb-4">Brand Voice</h2>
           {[
                { label: "Formality", opts: ["casual", "professional", "executive"], val: formData.brandVoiceFormality, key: "brandVoiceFormality" },
                { label: "Humour", opts: ["none", "subtle", "playful"], val: formData.brandVoiceHumour, key: "brandVoiceHumour" },
                { label: "Assertiveness", opts: ["soft", "balanced", "bold"], val: formData.brandVoiceAssertiveness, key: "brandVoiceAssertiveness" },
                { label: "Empathy", opts: ["low", "medium", "high"], val: formData.brandVoiceEmpathy, key: "brandVoiceEmpathy" }
              ].map((group) => (
                <div key={group.label}>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">{group.label}</label>
                  <div className="flex bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--border)]">
                    {group.opts.map(opt => (
                      <button key={opt} onClick={() => updateForm(group.key, opt)} className={`flex-1 py-1.5 text-xs capitalize rounded-md transition-colors ${group.val === opt ? "bg-[var(--bg-elevated)] text-white shadow-sm border border-[var(--border)]" : "text-[var(--text-muted)] hover:text-white"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
        </section>
      </div>
    </div>
  );
}
