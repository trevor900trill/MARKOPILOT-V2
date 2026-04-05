import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <MarketingNav />
      <main className="pt-32 pb-24 max-w-4xl mx-auto px-6">
        <h1 className="font-serif text-5xl text-white mb-8">Terms & Conditions</h1>
        <div className="space-y-8 text-lg text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-2xl font-serif text-white mb-4">1. Acceptance of Terms</h2>
            <p>By registering for and utilizing Markopilot, you agree to these Terms & Conditions. Markopilot provides autonomous social media, marketing, and lead generation capabilities intended strictly for legitimate B2B applications.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">2. Account & Eligibility</h2>
            <p>You must be at least 16 years old to create an account. You are responsible for ensuring the security of your account, providing accurate information, and are prohibited from sharing authentication capabilities with third parties without written consent.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">3. Acceptable Use Policy</h2>
            <p>Prohibited actions include: engaging in spam operations, utilizing the platform for harassment or impersonation, scaling unauthorized mass-marketing funnels outside CAN-SPAM or GDPR compliance, and reselling Markopilot features to unregistered entities.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">4. Compliance & AI-Generated Content</h2>
            <p>Users are exclusively responsible for adherence to the Terms of Service of their connected platforms (e.g., LinkedIn, Twitter, Google). AI generation is statistically automated; therefore, Markopilot makes no guarantees surrounding content accuracy. Periodic reviews of authored content are highly recommended.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">5. Subscription & Billing</h2>
            <p>Markopilot operates through Stripe/Lemon Squeezy. Upon upgrading, subscriptions automatically renew at the close of every billing interval unless appropriately canceled prior. Processing logic issues no partial-month refunds.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-white mb-4">6. Limitation of Liability</h2>
            <p>Markopilot is provided "as is". We are not liable for direct, indirect, or incidental damages deriving from account bans imposed by tertiary platforms (e.g. Gmail shadowbanning), missed enterprise opportunities, or external API outages.</p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
