"use client";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppTopbar } from "@/components/dashboard/AppTopbar";
import { BrandProvider } from "@/lib/brand-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && (session?.user as any)?.onboardingCompleted === false) {
      router.push("/onboarding");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div className="h-screen w-screen bg-[#07070a] flex items-center justify-center text-white/50 animate-pulse">Telemetry Syncing...</div>;
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
    </BrandProvider>
  );
}
