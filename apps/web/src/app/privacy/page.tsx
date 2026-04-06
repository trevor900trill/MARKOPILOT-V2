import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-gray-300 py-24 px-6 font-sans selection:bg-[var(--accent-primary)] selection:text-white relative">
      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--accent-primary)] mb-12 transition-colors font-medium">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        {/* Header */}
        <header className="mb-14">
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4 drop-shadow-md tracking-tight">Privacy Policy</h1>
          <p className="text-[var(--accent-primary)] font-mono text-sm tracking-widest uppercase">Last Updated: September 29, 2025</p>
        </header>

        {/* Content Body */}
        <div className="space-y-10 text-lg text-gray-400 font-light leading-relaxed">
          <div className="space-y-4">
             <p>
               Welcome to Markopilot. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application (the "Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
             </p>
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">1. Collection of Your Information</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect in the Application includes:
            </p>
            
            <div className="space-y-4 ml-0 md:ml-4 border-l-2 border-white/10 pl-6">
               <div>
                 <h3 className="text-xl text-white font-medium mb-2">Personal Data</h3>
                 <p>
                   Personally identifiable information, such as your name, email address, and authentication information that you voluntarily give to us when you register with the Application. This also includes information you provide when creating "brands" or "projects," such as brand descriptions and industry details, which are used by our AI to generate content.
                 </p>
               </div>
               
               <div className="pt-2">
                 <h3 className="text-xl text-white font-medium mb-2">Financial Data</h3>
                 <p>
                   Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you subscribe to our paid plans. This data is securely processed by our third-party payment provider. We store only very limited, if any, financial information that we collect.
                 </p>
               </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">2. Use of Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-2 marker:text-[var(--accent-primary)]">
              <li>Create and manage your account.</li>
              <li>Process your subscription payments and transactions.</li>
              <li>Email you regarding your account or service updates.</li>
              <li>Generate AI-powered marketing content, leads, and social posts based on the project information you provide.</li>
              <li>Monitor usage to ensure compliance with your subscription plan's limits.</li>
              <li>Improve the performance and accuracy of our AI models and services.</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">3. Disclosure of Your Information</h2>
            <p>
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>

            <div className="space-y-4 ml-0 md:ml-4 border-l-2 border-white/10 pl-6">
               <div>
                  <h3 className="text-xl text-white font-medium mb-2">By Law or to Protect Rights</h3>
                  <p>
                    If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
                  </p>
               </div>
               <div className="pt-2">
                  <h3 className="text-xl text-white font-medium mb-2">Third-Party Service Providers</h3>
                  <p>
                    We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance. This includes sharing project descriptions and prompts with our AI model providers (e.g., Google) to generate content for you.
                  </p>
               </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">4. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-medium text-white tracking-wide">5. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
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
