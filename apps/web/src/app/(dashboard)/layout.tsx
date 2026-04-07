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
      } else if (u?.hasSubscription === false && !isRedirecting) {

        // Prevent aggressive loops by checking if we just returned from a payment
        const search = window.location.search;
        const isCheckoutCompleted = search.includes('checkout_completed=true');
        const planHint = new URLSearchParams(search).get('plan');

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
                  await update({ hasSubscription: true, planName: statusData.user.planName });
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

        // Normal flow: if not returning from checkout, do a pre-flight check
        import("@/lib/api-client").then(async ({ apiGet }) => {
          try {
            const statusData = await apiGet<any>('/subscriptions/status');
            if (statusData?.user?.subscriptionId) {
              await update({
                hasSubscription: true,
                planName: statusData.user.planName
              });
              // Session update will trigger a re-render, so we're good
              return;
            }

            // If we're here, we really don't have a subscription
            setIsRedirecting(true);
            setLoadingMsg("Preparing checkout...");

            const checkoutPlan = (planHint || statusData?.user?.planName || "starter").toLowerCase();
            const data = await apiGet<{ url: string }>(`/subscriptions/checkout?planId=${checkoutPlan}`);

            if (data?.url) {
              window.location.href = data.url;
            } else {
              setIsRedirecting(false);
            }

          } catch (err) {
            console.error("Subscription check failed", err);
            setIsRedirecting(false);
          }
        });
      }
    }
  }, [status, session, router, update]);

  // Prevent hydration mismatch: only render once the client has mounted
  if (!mounted) {
    return <div className="h-screen w-screen bg-[#07070a]" />;
  }

  // Only show the blocking sync screen if we are actually redirecting or verifying payment
  if (isRedirecting) {
    return (
      <div className="h-screen w-screen bg-[#07070a] flex flex-col gap-4 items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(139,92,246,0.3)]"></div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-serif text-white">{loadingMsg}</p>
          <p className="text-[var(--text-muted)] text-sm animate-pulse">This usually takes a few seconds...</p>
        </div>

        {/* Safety valve: if stuck for 10s, show a reload button */}
        <button
          onClick={() => window.location.reload()}
          className="mt-8 text-xs text-[var(--text-muted)] hover:text-white transition underline underline-offset-4"
        >
          Taking too long? Click to refresh
        </button>
      </div>
    );
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
    </BrandProvider>
  );
}
