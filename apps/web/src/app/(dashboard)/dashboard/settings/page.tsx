"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useBrand, type BrandSummary } from "@/lib/brand-context";
import { apiGet, apiPut } from "@/lib/api-client";

type BrandDetails = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  industry: string;
  targetAudienceDescription: string;
  brandVoiceFormality: string;
  brandVoiceHumour: string;
  brandVoiceAssertiveness: string;
  brandVoiceEmpathy: string;
  targetJobTitles: string[];
  targetPainPoints: string[];
  targetGeographies: string[];
  contentPillars: string[];
};

export default function BrandSettingsPage() {
  const { activeBrand, refreshBrands } = useBrand();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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
    targetJobTitles: [] as string[],
    targetPainPoints: [] as string[],
    targetGeographies: [] as string[],
    contentPillars: [] as string[],
  });

  useEffect(() => {
    if (!activeBrand) return;
    const fetchBrand = async () => {
      try {
        const brand = await apiGet<BrandDetails>(`/brands/${activeBrand.id}`);
        setFormData({
          name: brand.name || "",
          description: brand.description || "",
          websiteUrl: brand.websiteUrl || "",
          industry: brand.industry || "",
          targetAudienceDescription: brand.targetAudienceDescription || "",
          brandVoiceFormality: brand.brandVoiceFormality || "professional",
          brandVoiceHumour: brand.brandVoiceHumour || "subtle",
          brandVoiceAssertiveness: brand.brandVoiceAssertiveness || "balanced",
          brandVoiceEmpathy: brand.brandVoiceEmpathy || "medium",
          targetJobTitles: brand.targetJobTitles || [],
          targetPainPoints: brand.targetPainPoints || [],
          targetGeographies: brand.targetGeographies || [],
          contentPillars: brand.contentPillars || [],
        });
      } catch (err) {
        console.error("Failed to fetch brand details:", err);
      }
    };
    fetchBrand();
  }, [activeBrand]);

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!activeBrand) return;
    setLoading(true);
    try {
      await apiPut(`/brands/${activeBrand.id}`, { ...activeBrand, ...formData });
      await refreshBrands();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save brand:", err);
    } finally {
      setLoading(false);
    }
  };

  function TagInput({ label, tags, setTags }: { label: string, tags: string[], setTags: (tags: string[]) => void }) {
    const [input, setInput] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = input.trim();
        if (val && !tags.includes(val)) {
          setTags([...tags, val]);
          setInput("");
        }
      }
    };

    const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(t => t !== tagToRemove));
    };

    return (
      <div>
        <label className="block text-sm text-[var(--text-secondary)] mb-1">{label}</label>
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-2 focus-within:border-[var(--accent-primary)] transition">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-white">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-[var(--text-muted)] hover:text-red-400 focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type and press Enter..."
            className="w-full bg-transparent outline-none text-white text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif text-white">Brand Settings</h1>
        <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition flex gap-2 items-center disabled:opacity-50 shadow-lg shadow-[var(--accent-primary)]/20">
          <Save size={16} /> {loading ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-medium text-white mb-4">General Details</h2>
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
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Industry / Niche</label>
            <input type="text" value={formData.industry} onChange={(e) => updateForm("industry", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-white focus:border-[var(--accent-primary)] outline-none" />
          </div>
          <TagInput label="Content Pillars (Press Enter)" tags={formData.contentPillars} setTags={(t) => updateForm("contentPillars", t)} />
        </section>

        <div className="space-y-8">
          <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-medium text-white mb-4">Target Audience Definitions</h2>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Audience Description</label>
              <textarea value={formData.targetAudienceDescription} onChange={(e) => updateForm("targetAudienceDescription", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-white h-20 focus:border-[var(--accent-primary)] outline-none" />
            </div>

            <TagInput label="Target Job Titles (Press Enter)" tags={formData.targetJobTitles} setTags={(t) => updateForm("targetJobTitles", t)} />
            <TagInput label="Target Pain Points (Press Enter)" tags={formData.targetPainPoints} setTags={(t) => updateForm("targetPainPoints", t)} />
            <TagInput label="Geographies (Press Enter)" tags={formData.targetGeographies} setTags={(t) => updateForm("targetGeographies", t)} />
          </section>

          <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-medium text-white mb-4">Brand Voice & Persona</h2>
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
                    <button key={opt} onClick={() => updateForm(group.key, opt)} className={`flex-1 py-1.5 text-xs capitalize rounded-md transition-colors ${group.val === opt ? "bg-[var(--bg-elevated)] text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-[var(--border)]" : "text-[var(--text-muted)] hover:text-white"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
