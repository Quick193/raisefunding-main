import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LEGAL } from '../config/legal';

const Section = ({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) => (
  <div id={id} className="mb-10 scroll-mt-24">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-orange-100">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

const MailLink = () => (
  <a href={`mailto:${LEGAL.email}`} className="text-orange-600 underline">{LEGAL.email}</a>
);

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: {LEGAL.lastUpdated}</p>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">

            <Section title="1. Who We Are">
              <p>
                {LEGAL.brand} is a crowdfunding platform operated by {LEGAL.operatorName}, an individual
                ({LEGAL.operatorType}) based in India, available at {LEGAL.domain} (the "Platform"). In this policy,
                "{LEGAL.brand}", "we", "our", and "us" refer to this proprietor-operated service.
              </p>
              <p>
                This Privacy Policy explains what personal data we collect, why we collect it, how we use and protect it,
                and the rights you have under Indian law — including the Digital Personal Data Protection Act, 2023
                ("DPDP Act") and the Information Technology Act, 2000. By using the Platform you agree to the practices
                described here.
              </p>
              <p>
                Questions or requests? Email us at <MailLink /> or call {LEGAL.phoneDisplay}.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p><strong>Account information:</strong> your name and email address when you create an account, and a
                securely hashed password (we never see your password in plain text — authentication is handled by
                Supabase).</p>
              <p><strong>Campaign information:</strong> the title, description, images, goal amount, and any other content
                you submit when you create or edit a fundraising campaign.</p>
              <p><strong>Donation information:</strong> the donor name, donation amount, optional message, and the campaign
                supported. We do <strong>not</strong> collect or store your full card number, CVV, UPI PIN, or bank
                credentials — these are entered directly with our payment partner, Razorpay, a PCI-DSS compliant
                processor. We receive only a payment reference and status from Razorpay.</p>
              <p><strong>Payout information:</strong> if you claim funds as a campaign creator, the bank/UPI details you
                provide for payouts are collected and shared with Razorpay to process the transfer.</p>
              <p><strong>Usage &amp; device data:</strong> pages visited, actions taken, approximate device and browser
                type, and similar diagnostic data, collected automatically to keep the Platform secure and improve it.</p>
              <p><strong>Communications:</strong> messages, reports, and support requests you send us.</p>
            </Section>

            <Section title="3. How We Use Your Information">
              <ul className="list-disc pl-5 space-y-2">
                <li>To create, secure, and manage your account</li>
                <li>To publish campaigns and process donations and payouts</li>
                <li>To send transactional messages (verification, donation receipts, payout and refund notices)</li>
                <li>To operate the escrow and refund process for donations</li>
                <li>To detect, investigate, and prevent fraud, abuse, and prohibited campaigns</li>
                <li>To respond to your queries, reports, and legal requests</li>
                <li>To comply with our obligations under the DPDP Act 2023, the IT Act 2000, and other applicable law</li>
              </ul>
              <p>We process your data on the lawful bases of your consent, performance of our service to you, and
                compliance with legal obligations. <strong>We do not sell your personal data.</strong></p>
            </Section>

            <Section title="4. Cookies & Local Storage" id="cookies">
              <p>{LEGAL.brand} uses a small number of cookies and browser local-storage entries:</p>
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
                      ['sb-*-auth-token', 'Keeps you signed in (Supabase authentication)', 'Essential'],
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
                Our payment partner Razorpay may set its own cookies during checkout to process payments and prevent
                fraud; these are governed by Razorpay's privacy policy. You may decline non-essential cookies via our
                cookie banner. Essential cookies cannot be disabled as they are required for the Platform to function.
              </p>
            </Section>

            <Section title="5. Who We Share Data With">
              <p>We share personal data only with the following categories of recipients, and only as needed:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Supabase Inc.</strong> — our database, authentication, and storage provider</li>
                <li><strong>Razorpay Software Private Limited</strong> — payment processing, payouts, and refunds,
                  subject to Razorpay's own privacy policy</li>
                <li><strong>Service providers</strong> that host or send email on our behalf, bound by confidentiality</li>
                <li><strong>Government, law-enforcement, or courts</strong> — only where required by valid legal process
                  or to protect rights, safety, and the integrity of the Platform</li>
              </ul>
              <p>Some of these providers may process or store data on servers located outside India. Where that happens,
                we take reasonable steps to ensure your data continues to be protected in line with the DPDP Act.</p>
            </Section>

            <Section title="6. Data Retention">
              <p>
                We keep your account and campaign data for as long as your account is active. If you delete your account,
                we delete or anonymise your personal data within 30 days, except where we must retain certain records
                (for example, donation and payout transaction records) to meet legal, tax, accounting, or fraud-prevention
                obligations.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>Subject to the DPDP Act 2023, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access the personal data we hold about you</li>
                <li>Correct or update inaccurate or incomplete data</li>
                <li>Request erasure of your data ("right to be forgotten")</li>
                <li>Withdraw consent at any time (this does not affect processing already carried out)</li>
                <li>Nominate another person to exercise your rights in the event of death or incapacity</li>
                <li>Grievance redressal — escalate a concern to our Grievance Officer (see Section 10)</li>
              </ul>
              <p>To exercise any of these rights, email <MailLink />. We respond within the timelines required by law.</p>
            </Section>

            <Section title="8. Data Security">
              <p>
                We use industry-standard safeguards including HTTPS/TLS encryption in transit, database Row-Level
                Security, access controls, and reliance on PCI-DSS-compliant payment infrastructure. No system is
                perfectly secure, but we take reasonable technical and organisational measures to protect your data.
              </p>
            </Section>

            <Section title="9. Data Breach Notification">
              <p>
                In the event of a personal data breach that is likely to affect you, we will notify the affected users
                and the Data Protection Board of India as required under the DPDP Act 2023, and take prompt steps to
                contain and remediate the incident.
              </p>
            </Section>

            <Section title="10. Grievance Officer">
              <p>
                In accordance with the IT Act 2000 and the DPDP Act 2023, you may contact our Grievance Officer for any
                complaint about the handling of your personal data:
              </p>
              <ul className="list-none space-y-1">
                <li><strong>Name:</strong> {LEGAL.operatorName}</li>
                <li><strong>Email:</strong> <MailLink /></li>
                <li><strong>Phone:</strong> {LEGAL.phoneDisplay}</li>
              </ul>
              <p>We aim to acknowledge grievances within 48 hours and resolve them within the period prescribed by law.</p>
            </Section>

            <Section title="11. Children's Privacy">
              <p>
                {LEGAL.brand} is not intended for anyone under the age of 18. We do not knowingly collect personal data
                from minors. If you believe a minor has provided us data, contact us and we will delete it.
              </p>
            </Section>

            <Section title="12. Changes to This Policy">
              <p>
                We may update this policy from time to time. We will post the revised version here with a new "Last
                updated" date and, for material changes, notify registered users by email. Continued use of the Platform
                after the effective date means you accept the updated policy.
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
