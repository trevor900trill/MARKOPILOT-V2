"use client";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppTopbar } from "@/components/dashboard/AppTopbar";
import { OnboardingTour } from "@/components/dashboard/OnboardingTour";
import { BrandProvider } from "@/lib/brand-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      const u = session?.user as any;
      if (u?.onboardingCompleted === false) {
        router.push("/onboarding");
      } else if (u?.requiresWaitlist === true) {
        router.push("/coming-soon-country");
      }
    }
  }, [status, session, router, update]);

  // Prevent hydration mismatch: only render once the client has mounted
  if (!mounted) {
    return <div className="h-screen w-screen bg-[#07070a]" />;
  }



  // If session is still loading, we just show a subtle background state 
  // but let the BrandProvider handle its own internal loading states
  if (status === "loading") {
    return (
      <div className="h-screen w-screen bg-[#07070a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrandProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppTopbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <OnboardingTour />
    </BrandProvider>
  );
}
