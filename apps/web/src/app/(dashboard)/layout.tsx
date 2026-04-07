"use client";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppTopbar } from "@/components/dashboard/AppTopbar";
import { BrandProvider } from "@/lib/brand-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Telemetry Syncing...");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      const u = session?.user as any;
      if (u?.onboardingCompleted === false) {
        router.push("/onboarding");
      } else if (u?.hasSubscription === false && !isRedirecting) {
        
        // Prevent aggressive loops by checking if we just returned from a payment
        const isCheckoutCompleted = window.location.search.includes('checkout_completed=true');

        if (isCheckoutCompleted) {
            setIsRedirecting(true);
            setLoadingMsg("Verifying your payment... Please do not close this window.");
            
            import("@/lib/api-client").then(({ apiGet }) => {
                let attempts = 0;
                const maxAttempts = 15; // 30 seconds max
                
                const poll = setInterval(async () => {
                    attempts++;
                    try {
                        const statusData = await apiGet<any>('/subscriptions/status');
                        if (statusData?.user?.subscriptionId) {
                            clearInterval(poll);
                            await update({ hasSubscription: true });
                            setIsRedirecting(false);
                            router.replace('/dashboard'); // Clean the URL
                        } else if (attempts >= maxAttempts) {
                            clearInterval(poll);
                            setLoadingMsg("Verification taking longer than expected. Please contact support or refresh the page.");
                        }
                    } catch (err) {
                        console.error("Polling error:", err);
                    }
                }, 2000);
            });
            return; // Halt the rest of the flow
        }

        // Normal flow: if not returning from checkout, do a pre-flight check, then redirect
        setIsRedirecting(true);
        const planId = (u?.planName || "starter").toLowerCase();
        
        import("@/lib/api-client").then(async ({ apiGet }) => {
          try {
            const statusData = await apiGet<any>('/subscriptions/status');
            if (statusData?.user?.subscriptionId) {
                await update({ hasSubscription: true });
                setIsRedirecting(false);
                return;
            }

            const data = await apiGet<{ url: string }>(`/subscriptions/checkout?planId=${planId}`);
            if (data?.url) window.location.href = data.url;
            
          } catch (err) {
            console.error("Failed to fetch checkout URL", err);
          }
        });
      }
    }
  }, [status, session, router, update]);

  if (status === "loading" || isRedirecting) {
    return (
      <div className="h-screen w-screen bg-[#07070a] flex flex-col gap-4 items-center justify-center text-white animate-pulse">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/50">{loadingMsg}</p>
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
    </BrandProvider>
  );
}
