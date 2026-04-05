import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppTopbar } from "@/components/dashboard/AppTopbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Markopilot",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
