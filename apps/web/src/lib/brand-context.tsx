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
  automationPostReviewEnabled?: boolean;
  requireEmailApproval?: boolean;
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
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  isTrialExpired?: boolean;
  isSubscriptionExpired?: boolean;
  isSubscriptionActive?: boolean;
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
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("markopilot_active_brand_id");
    }
    return null;
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveBrandId = useCallback((id: string) => {
    setActiveBrandIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("markopilot_active_brand_id", id);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await apiGet<BrandSummary[]>("/brands");
      const brandList = data || [];
      setBrands(brandList);

      if (brandList.length > 0) {
        const storedId = typeof window !== "undefined" ? localStorage.getItem("markopilot_active_brand_id") : null;
        const targetId = (activeBrandId && brandList.some((b) => b.id === activeBrandId))
          ? activeBrandId
          : (storedId && brandList.some((b) => b.id === storedId))
          ? storedId
          : brandList[0].id;

        setActiveBrandId(targetId);
      }
    } catch (err) {
      console.error("Failed to fetch brands:", err);
      setBrands([]);
    }
  }, [activeBrandId, setActiveBrandId]);

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiGet<UserProfile>("/users/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoading(false);
      return;
    }
    if (status !== "authenticated") return;

    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchBrands(), fetchUser()]);
      setIsLoading(false);
    };
    init();
  }, [status, fetchBrands, fetchUser]);

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? (brands.length > 0 ? brands[0] : null);

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
