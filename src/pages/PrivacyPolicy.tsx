import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-orange-100">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: 27 May 2026</p>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">

            <Section title="1. Who We Are">
              <p>
                Raise Technologies Pvt. Ltd. ("Raise", "we", "our", or "us") operates the crowdfunding platform at
                raisefunding.in. This Privacy Policy explains how we collect, use, and protect your personal information
                when you use our platform.
              </p>
              <p>
                If you have any questions, contact us at{' '}
                <a href="mailto:support@raisefunding.in" className="text-orange-600 underline">
                  support@raisefunding.in
                </a>
                .
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p><strong>Account information:</strong> When you create an account we collect your name and email address.</p>
              <p><strong>Campaign information:</strong> Content, images, and descriptions you submit for campaigns.</p>
              <p><strong>Donation information:</strong> When you donate we record the donor name, amount, and the campaign
                supported. We do not currently process or store credit card or bank details directly — payment processing
                will be handled by Razorpay (a PCI-DSS-compliant third party) when enabled.</p>
              <p><strong>Usage data:</strong> Pages visited, time spent, device type, and browser type — collected
                automatically to improve the platform.</p>
              <p><strong>Communications:</strong> Any messages you send us via email or support channels.</p>
            </Section>

            <Section title="3. How We Use Your Information">
              <ul className="list-disc pl-5 space-y-2">
                <li>To create and manage your account</li>
                <li>To display campaigns and process donations</li>
                <li>To send transactional emails (account verification, donation receipts)</li>
                <li>To improve and personalise the platform</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations under the Information Technology Act 2000 and the Digital Personal Data
                  Protection Act 2023</li>
              </ul>
              <p>We do not sell your personal data to third parties.</p>
            </Section>

            <Section title="4. Cookies & Local Storage" id="cookies">
              <p>
                Raise uses cookies and browser local storage for the following purposes:
              </p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-orange-50">
                      <th className="text-left p-3 border border-orange-100 font-semibold text-gray-800">Name</th>
                      <th className="text-left p-3 border border-orange-100 font-semibold text-gray-800">Purpose</th>
                      <th className="text-left p-3 border border-orange-100 font-semibold text-gray-800">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['sb-*-auth-token', 'Keeps you signed in (Supabase auth)', 'Essential'],
                      ['raise_lang', 'Remembers your language preference', 'Functional'],
                      ['raise_cookie_consent', 'Remembers your cookie preference', 'Essential'],
                    ].map(([name, purpose, type]) => (
                      <tr key={name}>
                        <td className="p-3 border border-orange-100 font-mono text-xs text-gray-600">{name}</td>
                        <td className="p-3 border border-orange-100 text-gray-700">{purpose}</td>
                        <td className="p-3 border border-orange-100">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            type === 'Essential' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>{type}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                You may decline non-essential cookies via our cookie banner. Essential cookies cannot be disabled as they
                are required for the platform to function.
              </p>
            </Section>

            <Section title="5. Data Sharing">
              <p>We share your data only with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Supabase Inc.</strong> — our database and authentication provider (servers in the EU)</li>
                <li><strong>Razorpay</strong> — payment processing (when enabled), subject to their privacy policy</li>
                <li><strong>Law enforcement</strong> — only when required by a valid court order or government authority</li>
              </ul>
            </Section>

            <Section title="6. Data Retention">
              <p>
                We retain your account data for as long as your account is active. If you delete your account, we will
                delete your personal data within 30 days, except where we are required to retain it for legal or
                regulatory purposes.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>Under applicable Indian law (DPDPA 2023) you have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Erase your data ("right to be forgotten")</li>
                <li>Withdraw consent at any time</li>
                <li>Nominate a person to exercise rights on your behalf</li>
              </ul>
              <p>
                To exercise these rights, email us at{' '}
                <a href="mailto:support@raisefunding.in" className="text-orange-600 underline">
                  support@raisefunding.in
                </a>
                .
              </p>
            </Section>

            <Section title="8. Security">
              <p>
                We use industry-standard security measures including HTTPS/TLS encryption, Row-Level Security on our
                database (Supabase), and access controls. No method of transmission over the internet is 100% secure,
                but we take reasonable precautions to protect your data.
              </p>
            </Section>

            <Section title="9. Children's Privacy">
              <p>
                Raise is not intended for use by anyone under the age of 18. We do not knowingly collect personal data
                from minors.
              </p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>
                We may update this policy from time to time. We will notify registered users of material changes by
                email. Continued use of the platform after the effective date constitutes acceptance of the updated policy.
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
