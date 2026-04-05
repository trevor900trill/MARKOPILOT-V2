import { OnboardingWizard } from "@/components/OnboardingWizard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding — Markopilot",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
