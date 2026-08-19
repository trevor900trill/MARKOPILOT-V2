"use client";

import { useBrand } from "@/lib/brand-context";
import { BrandCard } from "@/components/dashboard/BrandCard";
import { Plus, Briefcase, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BrandsPage() {
  const { brands, activeBrand, setActiveBrandId, isLoading } = useBrand();
  const router = useRouter();

  const handleSelectBrand = (id: string) => {
    setActiveBrandId(id);
    router.push("/dashboard");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white">Your Brands</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Manage your connected businesses and their automation status.
          </p>
        </div>
        <button
          onClick={() => { window.location.href = "/onboarding"; }}
          className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-[var(--accent-glow)]/20 hover:scale-105 active:scale-95"
        >
          <Plus size={18} /> Add New Brand
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 animate-pulse space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-5 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-5 w-14 bg-white/5 rounded-full" />
              </div>
              <div className="h-10 bg-white/5 rounded-xl w-full" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-14 bg-white/5 rounded-xl" />
                <div className="h-14 bg-white/5 rounded-xl" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-7 h-7 bg-white/5 rounded-lg" />
                  ))}
                </div>
                <div className="h-8 w-28 bg-white/10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : brands && brands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              isActive={brand.id === activeBrand?.id}
              onSelect={handleSelectBrand}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-dashed border-[var(--border)] rounded-3xl p-12 text-center max-w-2xl mx-auto mt-12 shadow-xl">
          <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase size={28} className="text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-xl font-serif text-white mb-2">No Brands Found</h3>
          <p className="text-[var(--text-secondary)] mb-8 text-sm">
            You don't have any brands connected yet. Add your first brand to start automating your social media and lead generation.
          </p>
          <button
            onClick={() => { window.location.href = "/onboarding"; }}
            className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg shadow-[var(--accent-glow)]/20 hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Create Your First Brand
          </button>
        </div>
      )}
    </div>
  );
}
