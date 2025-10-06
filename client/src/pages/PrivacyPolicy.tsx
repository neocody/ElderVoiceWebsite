import MarketingLayout from "@/components/MarketingLayout";

export default function PrivacyPolicy() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-lg text-gray-600 mb-8">
            <strong>Last Updated:</strong> September 27, 2025
          </p>

          <p className="text-gray-700 mb-8">
            This Privacy Policy describes how <strong>Inverse Collective LLC</strong> ("Inverse Collective," "we," "our," or "us") collects, uses, discloses, and protects personal information when you use our AI phone companion service and caregiver/facility dashboard (the "Service"). The Service is intended for customers in the <strong>United States</strong> only.
          </p>

          <p className="text-gray-700 mb-8">
            By using the Service, you agree to this Privacy Policy and our Terms of Service.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <p className="text-gray-700 mb-4">
              <strong>Account & Profile Data.</strong> Name, email, role (family, caregiver, admin), organization, phone numbers for seniors and caregivers, preferences, schedules.
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Call Data.</strong> Call metadata (time, duration, outcome), <strong>call recordings</strong> and <strong>transcripts</strong> (not viewable by humans), and AI‑generated embeddings/signals for personalization.
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Communications.</strong> SMS reminders (service‑only), support requests, feedback.
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Payment Data.</strong> Billing contacts, plan details, and limited payment information via <strong>Stripe</strong> (we do not store full card numbers).
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Technical Data.</strong> Log files, device/browser data, IP addresses, cookies, and analytics events via <strong>Google Analytics</strong>.
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Sensitive Data.</strong> The Service is <strong>not a medical or HIPAA service</strong> and is not intended to collect protected health information (PHI). If you choose to input health‑related notes, we handle them with heightened safeguards; do not upload PHI.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Information</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide, operate, and secure the Service (including scheduling, placing calls, transcribing, and personalization);</li>
              <li>Send service messages (verifications, password resets, billing notices) and SMS reminders;</li>
              <li>Monitor performance, debug, and prevent fraud/abuse;</li>
              <li>Improve and develop features, including using <strong>de‑identified/aggregated</strong> data and model quality signals;</li>
              <li>Comply with legal obligations and enforce our Terms.</li>
            </ul>
            
            <p className="text-gray-700 mb-4">
              <strong>No Selling / No Cross‑Context Behavioral Ads.</strong> We <strong>do not sell</strong> personal information and do <strong>not</strong> use personal information for cross‑context behavioral advertising.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">We share personal information with:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Processors/Service Providers</strong> acting on our behalf, including <strong>Twilio</strong> (telephony), <strong>OpenAI</strong> (AI processing), <strong>Stripe</strong> (payments), <strong>SendGrid</strong> (email), and <strong>Google Analytics</strong> (analytics), under contracts that limit use to our instructions;</li>
              <li><strong>Legal/Compliance</strong> recipients where required by law or to protect rights, safety, and security;</li>
              <li><strong>Business Transfers</strong> in connection with a merger, acquisition, or asset sale.</li>
            </ul>
            
            <p className="text-gray-700 mb-4">
              We do not permit providers to use personal information for their own marketing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Access & Visibility</h2>
            <p className="text-gray-700 mb-4">
              <strong>No Human Access to Call Content.</strong> Call recordings and transcripts are <strong>not viewable by anyone</strong>, including customers and Inverse Collective personnel, except where disclosure is legally required. We apply technical and policy controls to enforce this.
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Customer Access.</strong> Customers may view limited <strong>metadata</strong> (e.g., call attempt, success/failure, schedule) but not transcript content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain personal information for as long as needed to provide the Service and for legitimate business purposes (e.g., accounting, security), then delete or de‑identify it. <strong>Call recordings/transcripts</strong> are retained for <strong>90 days</strong> by default, unless law or active disputes require longer retention.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Choices & Rights</h2>
            <p className="text-gray-700 mb-4">
              <strong>Account Controls.</strong> Update account details and settings in the dashboard.
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>SMS Opt‑Out.</strong> Reply <strong>STOP</strong> to opt out of SMS; <strong>HELP</strong> for help.
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Privacy Rights.</strong> Where applicable under U.S. state privacy laws (e.g., California), you may request access, deletion, or correction. Submit requests to <a href="mailto:hello@eldervoice.com" className="text-blue-600 hover:text-blue-800">hello@eldervoice.com</a>. We will verify your identity before responding.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Security</h2>
            <p className="text-gray-700 mb-4">
              We use administrative, technical, and physical safeguards designed to protect personal information, including encryption in transit and at rest, access control, and monitoring. No system is 100% secure; please use strong, unique passwords and keep them confidential.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies & Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies for authentication, preferences, and analytics via Google Analytics. You can control cookies through your browser settings. Some features may not function properly without certain cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              The Service is not directed to children under 13 and we do not knowingly collect personal information from them. If we learn we have collected such data, we will delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Users</h2>
            <p className="text-gray-700 mb-4">
              The Service is intended for use in the <strong>United States</strong> only. If you access the Service from outside the U.S., you consent to processing in the U.S. and understand that the Service may be unavailable or limited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. State‑Specific Disclosures (U.S.)</h2>
            <p className="text-gray-700 mb-4">
              We honor rights provided by applicable state privacy laws. We do not sell personal information. We do not share for cross‑context behavioral advertising. Authorized agent requests will be honored consistent with law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Data Processing Addendum (DPA)</h2>
            <p className="text-gray-700 mb-4">
              For business customers needing a DPA, <strong>contact us at <a href="mailto:hello@eldervoice.com" className="text-blue-600 hover:text-blue-800">hello@eldervoice.com</a></strong>. The DPA will describe roles (customer = controller; Inverse Collective = processor), security measures, and subprocessors (Twilio, OpenAI, Stripe, SendGrid, Google Analytics). <strong>We are not a HIPAA‑covered entity and do not offer BAAs</strong> unless separately agreed in writing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy periodically. We will notify you of material changes (e.g., by email or in‑product). Your continued use after changes become effective signifies your acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. How to Contact Us</h2>
            <p className="text-gray-700 mb-4">
              Questions about privacy? Reach us at <a href="mailto:hello@eldervoice.com" className="text-blue-600 hover:text-blue-800">hello@eldervoice.com</a> or by mail at the address above.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Inverse Collective LLC</strong><br />
              5900 Balcones Drive, Suite 16274<br />
              Austin, TX 78731
            </p>
          </section>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Processing Addendum (Outline)</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Parties & Roles (Controller/Processor)</li>
              <li>Processing Details (subject matter, duration, nature, purpose)</li>
              <li>Security Measures (encryption, access controls, logging, vulnerability management)</li>
              <li>Subprocessors (Twilio, OpenAI, Stripe, SendGrid, Google Analytics)</li>
              <li>U.S. State Law Addendum (CPRA‑style definitions & rights)</li>
              <li>Audit & Assistance; Incident Notice; Deletion/Return at end of term</li>
            </ul>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}