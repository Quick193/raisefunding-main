import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-orange-100">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: 27 May 2026</p>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">

            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using the Raise platform ("Service") operated by Raise Technologies Pvt. Ltd. ("Raise",
                "we", "our"), you agree to be bound by these Terms of Service. If you do not agree, please do not use
                the Service.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>
                You must be at least 18 years old and capable of forming a binding contract under Indian law to use this
                Service. By creating an account you represent that you meet these requirements.
              </p>
            </Section>

            <Section title="3. Campaign Creator Obligations">
              <p>If you create a fundraising campaign on Raise, you agree to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate, truthful, and complete information about your campaign</li>
                <li>Use funds raised solely for the purpose stated in your campaign</li>
                <li>Not misrepresent yourself, your cause, or the intended use of funds</li>
                <li>Respond to donor queries in good faith</li>
                <li>Comply with all applicable Indian laws including the Foreign Contribution Regulation Act (FCRA)
                  where applicable</li>
              </ul>
            </Section>

            <Section title="4. Prohibited Content">
              <p>You may not use Raise to raise funds for:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Illegal activities or anything that violates Indian law</li>
                <li>Hate speech, discrimination, or violence against any group</li>
                <li>Fraudulent, deceptive, or misleading campaigns</li>
                <li>Gambling, lotteries, or speculative investments</li>
                <li>Any cause that promotes terrorism or extremism</li>
              </ul>
              <p>
                Raise reserves the right to remove any campaign that violates these terms without notice.
              </p>
            </Section>

            <Section title="5. Donations">
              <p>
                All donations made on Raise are voluntary. By donating you acknowledge that:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Donations are contributions to individual campaigns and may not be tax-deductible unless the
                  campaign is associated with a registered charitable organisation</li>
                <li>Raise does not guarantee that campaign goals will be met or that funds will be used as stated</li>
                <li>Donations are generally non-refundable once processed</li>
                <li>Full payment processing via Razorpay will be enabled in a future update</li>
              </ul>
            </Section>

            <Section title="6. Platform Fees">
              <p>
                Raise currently charges <strong>0% platform fee</strong>. A standard payment processing fee of{' '}
                <strong>~2%</strong> applies when payment processing is enabled. Fees are subject to change with 30
                days' notice.
              </p>
            </Section>

            <Section title="7. Intellectual Property">
              <p>
                The Raise platform, brand, logos, and code are the property of Raise Technologies Pvt. Ltd. Content
                you submit (campaign text, images) remains yours, but you grant Raise a non-exclusive, royalty-free
                licence to display it on the platform.
              </p>
            </Section>

            <Section title="8. Disclaimer of Warranties">
              <p>
                The Service is provided "as is" without warranty of any kind. Raise does not warrant that the platform
                will be uninterrupted, error-free, or free of viruses. Your use of the Service is at your sole risk.
              </p>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, Raise shall not be liable for any indirect, incidental, special,
                or consequential damages arising from your use of the platform, including but not limited to loss of
                donations, data, or profits.
              </p>
            </Section>

            <Section title="10. Account Termination">
              <p>
                We reserve the right to suspend or terminate your account at any time if you violate these Terms.
                You may delete your account at any time by contacting{' '}
                <a href="mailto:support@raisefunding.in" className="text-orange-600 underline">
                  support@raisefunding.in
                </a>
                .
              </p>
            </Section>

            <Section title="11. Governing Law">
              <p>
                These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
                jurisdiction of the courts of Mumbai, Maharashtra.
              </p>
            </Section>

            <Section title="12. Changes to These Terms">
              <p>
                We may update these Terms from time to time. Continued use of the Service after the effective date
                of any changes constitutes your acceptance. We will notify registered users of material changes by email.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                For any questions about these Terms, contact us at{' '}
                <a href="mailto:support@raisefunding.in" className="text-orange-600 underline">
                  support@raisefunding.in
                </a>
                .
              </p>
            </Section>

          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
