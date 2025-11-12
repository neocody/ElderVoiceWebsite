import MarketingLayout from "@/components/MarketingLayout";

export default function TermsOfService() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-lg text-gray-600 mb-8">
            <strong>Last Updated:</strong> September 27, 2025
          </p>

          <p className="text-gray-700 mb-8">
            These Terms of Service ("Terms") govern your access to and use of the services provided by <strong>Inverse Collective LLC</strong> ("Inverse Collective," "we," "our," or "us"), including our AI phone‑based companion service for seniors and the associated caregiver/facility web portal (collectively, the "Service"). By creating an account, scheduling calls, or otherwise using the Service, you agree to these Terms.
          </p>

          <p className="text-gray-700 mb-8">
            If you do not agree to these Terms, do not use the Service.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Who We Are & What We Do</h2>
            <p className="text-gray-700 mb-4">
              Inverse Collective LLC operates a conversational AI platform that places scheduled, automated voice calls to seniors to provide friendly conversation, wellbeing check‑ins, and optional reminders. Authorized caregivers and care facilities configure call schedules and preferences through a secure dashboard.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
              <p className="text-amber-800">
                <strong>No Medical Care. Not for Emergencies.</strong> The Service is not medical, behavioral health, or emergency care, and does not provide diagnosis or treatment. <strong>Do not rely on the Service for emergencies. Call 911 (or your local emergency number) in an emergency.</strong>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              The Service is offered <strong>only to customers in the United States</strong>. You must be at least <strong>18 years old</strong> to create an account or purchase a subscription. Caregivers/facilities represent that they have authority to provide senior phone numbers and manage preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Your Account</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for the security of your account credentials and for all activity under your account. Keep your information accurate and up to date. We may offer multi‑factor authentication and other safeguards; you are responsible for enabling and maintaining them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscriptions, Trials, and Billing</h2>
            <p className="text-gray-700 mb-4">
              We offer plans that <strong>auto‑renew monthly or annually</strong> (as selected) until canceled. You authorize us (and our payment processor, <strong>Stripe</strong>) to charge your payment method on each renewal at the then‑current rate.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Trials.</strong> We may offer a <strong>7‑day free trial</strong>; charges begin at the end of the trial unless you cancel before it ends.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Cancellation & Refunds.</strong> You may cancel at any time effective at the end of the current billing period. <strong>No refunds are provided after renewal unless required by law.</strong>
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Taxes.</strong> Fees are exclusive of applicable taxes, which you are responsible for paying.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to misuse the Service, including by:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Attempting to access others' data or our systems without authorization;</li>
              <li>Interfering with call operations or platform security;</li>
              <li>Using the Service to send unlawful, harassing, deceptive, or spam communications;</li>
              <li>Attempting to re‑identify anonymized data; or</li>
              <li>Violating applicable laws (e.g., TCPA, call‑recording consent laws, data protection laws).</li>
            </ul>
            <p className="text-gray-700 mb-4">We may suspend or terminate access for violations.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Consent to Automated Calls, SMS, and Call Recording</h2>
            <p className="text-gray-700 mb-4">
              By providing a phone number and scheduling calls or reminders, you <strong>expressly consent</strong> (for yourself and represent you have authority for the senior) to receive <strong>automated and AI‑generated calls and SMS</strong> from <strong>Inverse Collective LLC</strong> at the provided number(s). 
            </p>
            <p className="text-gray-700 mb-4">
              <strong>SMS Communications.</strong> We send SMS for one‑time verification codes (OTP) to verify your identity (one message per request) and for account notifications and service‑related communications. Message and data rates may apply. To opt out of SMS messages, reply <strong>STOP</strong> to any message; for help, reply <strong>HELP</strong>. You may also contact us at <a href="mailto:hello@inversecollective.com" className="text-blue-600 hover:text-blue-800">hello@inversecollective.com</a> or by mail at our address below.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Call Recording/Transcription.</strong> Calls are recorded and transcribed <strong>to allow the AI to learn about the person and improve conversations over time</strong>. <strong>Transcripts and recordings are not viewable by anyone (including customers and Inverse Collective personnel)</strong>, except as may be strictly required by law. We maintain consent logs and comply with applicable one‑party/two‑party consent laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Caregiver & Facility Responsibilities</h2>
            <p className="text-gray-700 mb-4">Caregivers/facilities must:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Ensure accuracy of senior contact details and schedules;</li>
              <li>Obtain and maintain appropriate consent from seniors or their legal representatives;</li>
              <li>Use the Service in a manner consistent with applicable privacy, elder‑care, and telecommunications laws;</li>
              <li>Understand that <strong>call content and transcripts are not accessible</strong>; rely on independent judgment and any allowed metadata.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our <strong>Privacy Policy</strong> explains how we collect, use, and protect personal data and is incorporated into these Terms. By using the Service, you agree to our data practices as described in the Privacy Policy, including recording and 90‑day retention.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Intellectual Property; License</h2>
            <p className="text-gray-700 mb-4">
              We and our licensors own the Service and all related IP. Subject to these Terms, we grant you a limited, revocable, non‑transferable license to access and use the Service for your internal purposes (caregiving/facility operations). You will not reverse engineer, copy, or create derivative works of the Service.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Feedback.</strong> If you submit feedback or suggestions, we may use them without restriction or compensation to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third‑Party Services</h2>
            <p className="text-gray-700 mb-4">
              The Service integrates telephony, AI, and payment providers. Your use of those features may be subject to the third parties' terms and privacy policies. We are not responsible for third‑party services, and availability may change without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. De‑Identified and Aggregated Data</h2>
            <p className="text-gray-700 mb-4">
              We may use <strong>de‑identified and/or aggregated</strong> data to operate, maintain, and improve the Service, develop new features, and for analytics and quality assurance. We will not attempt to re‑identify de‑identified data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Service Changes; Availability; Service Level Target</h2>
            <p className="text-gray-700 mb-4">
              We may modify, suspend, or discontinue features at any time. We strive for high availability and target <strong>99.5% monthly uptime</strong> excluding scheduled maintenance, emergency maintenance, and third‑party outages. This is a <strong>non‑binding target</strong> and does not include service credits unless agreed in a separate written order form.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Disclaimers</h2>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE."</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT. WE DO NOT WARRANT THAT CALLS WILL ALWAYS CONNECT OR THAT TRANSCRIPTS ARE ERROR‑FREE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WIREFUSEMEDIA AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND PARTNERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE IN ANY 12‑MONTH PERIOD SHALL NOT EXCEED THE AMOUNTS YOU PAID TO US FOR THE SERVICE IN THAT PERIOD.
            </p>
            <p className="text-gray-700 mb-4">
              Some jurisdictions do not allow certain limitations; in those cases, the above limits apply to the fullest extent permitted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You will defend, indemnify, and hold harmless Inverse Collective from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of law; or (d) any communications you initiate through the Service (including telemarketing/TCPA issues) and any failure to obtain necessary consents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Suspension and Termination</h2>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate access for any violation of these Terms or where required by law. You may stop using the Service at any time. Upon termination, your right to use the Service ends, but sections that by their nature should survive (e.g., fees owed, IP, disclaimers, limitations, indemnities) will survive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Governing Law; Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              <strong>Governing Law.</strong> These Terms are governed by the laws of the <strong>State of Texas</strong>, without regard to conflicts of laws principles.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Arbitration; Class‑Action Waiver; Venue.</strong> Any dispute, claim, or controversy arising out of or relating to the Service or these Terms will be resolved by <strong>binding arbitration</strong> administered by a recognized arbitration provider. You and Inverse Collective agree to <strong>waive any right to a jury trial</strong> and to proceed on an <strong>individual basis only</strong>; <strong>class actions and representative proceedings are not permitted</strong>. Judgment on the award may be entered in the state or federal courts located in <strong>Travis County, Texas</strong>, which shall have exclusive jurisdiction for any court proceedings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Changes to These Terms</h2>
            <p className="text-gray-700 mb-4">
              We may revise these Terms from time to time. If we make material changes, we will provide notice (e.g., via email or in‑product). Your continued use after changes become effective constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. Contact</h2>
            <p className="text-gray-700 mb-4">
              <strong>Inverse Collective LLC</strong><br />
              5900 Balcones Drive, Suite 16274<br />
              Austin, TX 78731<br />
              Email: <a href="mailto:hello@eldervoice.com" className="text-blue-600 hover:text-blue-800">hello@eldervoice.com</a>
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}