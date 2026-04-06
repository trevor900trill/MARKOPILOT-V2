import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-gray-300 py-24 px-6 font-sans selection:bg-[var(--accent-primary)] selection:text-white relative">
      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--accent-primary)] mb-12 transition-colors font-medium">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        {/* Header */}
        <header className="mb-14">
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4 drop-shadow-md tracking-tight">Terms and Conditions</h1>
          <p className="text-[var(--accent-primary)] font-mono text-sm tracking-widest uppercase">Last Updated: December 5, 2025</p>
        </header>

        {/* Content Body */}
        <div className="space-y-10 text-lg text-gray-400 font-light leading-relaxed">
          <div className="space-y-4">
             <p>
                Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the Markopilot web application (the "Service") operated by Markopilot ("us", "we", or "our").
             </p>
             <p>
                Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who wish to access or use the Service.
             </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">1. Accounts</h2>
            <p>
              When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">2. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of Markopilot and its licensors. The Service is protected by copyright, trademark, and other laws of both the Kenya and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Markopilot.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">3. Links To Other Web Sites</h2>
            <p>
              Our Service may contain links to third-party web sites or services that are not owned or controlled by Markopilot.
            </p>
            <p>
              Markopilot has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third-party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">4. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
            <p>
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">5. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">6. Refunds and Payments</h2>
            <p>
              All payments made through our Service are processed securely. Please note our refund policy:
            </p>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl md:bg-gradient-to-r from-transparent to-[var(--accent-primary)]/5 mt-4">
                <h3 className="text-xl text-white mb-2 font-medium">Refund Eligibility</h3>
                <p className="mb-4">
                  Refunds are only available within 3 days from the date of payment. Refund requests made after 3 days of payment will not be processed. All refund requests are subject to review and approval at our sole discretion.
                </p>
                <div className="flex items-start gap-3 mt-4 text-sm text-[var(--accent-primary)] font-medium">
                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></div>
                   <p className="leading-snug">Note: Users with active campaigns cannot request refunds until all campaigns have been cancelled or completed.</p>
                </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">7. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">8. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <a href="mailto:support@markopilot.com" className="inline-block px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors">
              support@markopilot.com
            </a>
          </section>
        </div>
        
      </div>
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden h-screen bg-[#07070a]">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 mix-blend-screen rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 mix-blend-screen rounded-full blur-[150px]" />
      </div>
    </div>
  );
}
