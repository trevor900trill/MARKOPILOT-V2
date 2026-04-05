import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <MarketingNav />
      <main className="pt-32 pb-24 max-w-4xl mx-auto px-6">
        <h1 className="font-serif text-5xl text-white mb-8">Privacy Policy</h1>
        <div className="space-y-8 text-lg text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-2xl font-serif text-white mb-4">1. Introduction</h2>
            <p>Welcome to Markopilot. This privacy policy describes how we collect, use, and handle your information when you use our autonomous social media and lead generation platform.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-serif text-white mb-4">2. Information We Collect</h2>
            <p>We collect information primarily from your Google account via OAuth, your brand configuration, encrypted social tokens, discovered lead data, and usage analytics. Payment processing is handled by Lemon Squeezy, ensuring we never store your card numbers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">3. How We Use Your Information</h2>
            <p>We use your data to operate platform automation features, generate AI content tailored to your brand, send outreach emails natively from your attached accounts, and improve our baseline services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">4. Data Sharing</h2>
            <p>We share necessary data with integration partners like Google (Gemini, Gmail API) and Lemon Squeezy (Billing). Social platforms only receive content published to their APIs. We do not sell your data to any third party.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">5. Data Retention</h2>
            <p>User data is retained while your account is active and permanently purged 30 days following an account deletion request. Lead data expires after 12 months, and outreach logs are maintained for 6 months.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">6. Contact</h2>
            <p>If you have any questions or require data access, correction, or deletion under our policy, contact us directly at <a href="mailto:privacy@markopilot.com" className="text-[var(--accent-primary)] hover:underline">privacy@markopilot.com</a>.</p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
