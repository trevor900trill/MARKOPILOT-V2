"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiGet } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────

export type BrandSummary = {
  id: string;
  name: string;
  description: string;
  industry: string;
  status: string;
  twitterConnected: boolean;
  linkedinConnected: boolean;
  instagramConnected: boolean;
  tiktokConnected: boolean;
  gmailConnected: boolean;
  automationPostsEnabled: boolean;
  automationLeadsEnabled: boolean;
  automationOutreachEnabled: boolean;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  planName: string;
  subscriptionStatus: string;
  onboardingCompleted: boolean;
  quotaLeadsPerMonth: number;
  quotaPostsPerMonth: number;
  quotaLeadsUsed: number;
  quotaPostsUsed: number;
  quotaBrandsAllowed: number;
  quotaBrandsUsed: number;
};

type BrandContextType = {
  brands: BrandSummary[];
  activeBrand: BrandSummary | null;
  setActiveBrandId: (id: string) => void;
  refreshBrands: () => Promise<void>;
  user: UserProfile | null;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
};

const BrandContext = createContext<BrandContextType>({
  brands: [],
  activeBrand: null,
  setActiveBrandId: () => {},
  refreshBrands: async () => {},
  user: null,
  refreshUser: async () => {},
  isLoading: true,
});

export function useBrand() {
  return useContext(BrandContext);
}

// ── Provider ───────────────────────────────────────

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await apiGet<BrandSummary[]>("/brands");
      setBrands(data || []);
      // Auto-select first brand if none selected or current selection no longer exists
      if (data && data.length > 0) {
        if (!activeBrandId || !data.find((b: BrandSummary) => b.id === activeBrandId)) {
          setActiveBrandId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch brands:", err);
      setBrands([]);
    }
  }, [activeBrandId]);

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiGet<UserProfile>("/users/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchBrands(), fetchUser()]);
      setIsLoading(false);
    };
    init();
  }, [status, fetchBrands, fetchUser]);

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null;

  return (
    <BrandContext.Provider
      value={{
        brands,
        activeBrand,
        setActiveBrandId,
        refreshBrands: fetchBrands,
        user,
        refreshUser: fetchUser,
        isLoading,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}
