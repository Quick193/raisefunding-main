import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LEGAL, OPERATED_BY } from '../config/legal';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-orange-100">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

const MailLink = () => (
  <a href={`mailto:${LEGAL.email}`} className="text-orange-600 underline">{LEGAL.email}</a>
);

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: {LEGAL.lastUpdated}</p>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">

            <Section title="1. Acceptance of Terms">
              <p>
                {LEGAL.brand} is a crowdfunding platform ({OPERATED_BY}), available at {LEGAL.domain} (the "Platform" or
                "Service"). By accessing or using the Service you agree to be bound by these Terms of Service, our{' '}
                <Link to="/privacy" className="text-orange-600 underline">Privacy Policy</Link>, and our{' '}
                <Link to="/refunds" className="text-orange-600 underline">Refund &amp; Cancellation Policy</Link>. If you
                do not agree, please do not use the Service.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>
                You must be at least 18 years old and capable of entering into a legally binding contract under Indian
                law. By creating an account you represent that you meet these requirements and that the information you
                provide is accurate and current.
              </p>
            </Section>

            <Section title="3. What Raise Does (and Does Not) Do">
              <p>
                {LEGAL.brand} provides the technology that lets individuals and communities create fundraising campaigns
                and lets supporters donate to them. We are an intermediary and technology provider — we are{' '}
                <strong>not</strong> the recipient of donations, not a trustee, not a financial institution, and not a
                registered charity. We do not endorse, guarantee, or independently verify any campaign, creator, or the
                use of funds, except for the checks described in these Terms.
              </p>
            </Section>

            <Section title="4. Campaign Creator Obligations">
              <p>If you create a campaign, you agree to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate, truthful, and complete information about yourself and your cause</li>
                <li>Use all funds raised solely for the purpose stated in your campaign</li>
                <li>Not misrepresent yourself, your cause, or the intended use of funds</li>
                <li>Provide honest updates and respond to supporter queries in good faith</li>
                <li>Provide valid bank/UPI details for payouts, and complete any verification we or Razorpay require</li>
                <li>Comply with all applicable Indian laws, including the Foreign Contribution (Regulation) Act (FCRA)
                  where foreign donations are involved, and applicable tax laws</li>
              </ul>
              <p>You are solely responsible and liable for your campaign, the accuracy of its claims, and the lawful use
                of funds you receive.</p>
            </Section>

            <Section title="5. Donor Terms">
              <p>By donating through {LEGAL.brand} you acknowledge that:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Donations are voluntary contributions to a specific campaign, not purchases of goods or services</li>
                <li>Donations may not be tax-deductible unless the campaign is run by a registered charity that issues a
                  valid receipt — {LEGAL.brand} does not issue 80G or tax receipts</li>
                <li>We do not guarantee that a campaign goal will be met or that funds will be used as described</li>
                <li>Refunds are governed by our{' '}
                  <Link to="/refunds" className="text-orange-600 underline">Refund &amp; Cancellation Policy</Link></li>
              </ul>
            </Section>

            <Section title="6. Escrow, Payouts & Unclaimed Funds">
              <p>
                Donations are held with our payment partner and released to the creator only when the creator claims them
                by providing valid payout details. When a campaign's funding period ends (or its goal is reached), a
                30-day claim window begins. If the creator does not claim the funds within that window, the donated
                amounts are <strong>automatically refunded</strong> to donors, and the campaign is closed. Optional tips
                given to support the Platform are non-refundable. Payout processing times depend on Razorpay and your
                bank.
              </p>
            </Section>

            <Section title="7. Prohibited Campaigns & Content">
              <p>You may not use {LEGAL.brand} to raise funds for, or to post, any of the following:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Anything illegal under Indian law, or that funds illegal activity</li>
                <li>Fraudulent, deceptive, or misleading campaigns</li>
                <li>Hate speech, harassment, discrimination, or the promotion of violence against any group</li>
                <li>Terrorism, extremism, or activities that threaten national security or public order</li>
                <li>Gambling, lotteries, betting, or speculative or investment schemes promising financial returns</li>
                <li>Weapons, drugs, or other regulated or prohibited goods</li>
                <li>Content that infringes another person's intellectual property or privacy</li>
              </ul>
              <p>
                We may remove, suspend, or refuse any campaign that we reasonably believe violates these Terms or the law,
                withhold or refund its funds, and report it to the authorities where appropriate. You can report a
                campaign to us at <MailLink />.
              </p>
            </Section>

            <Section title="8. Fees">
              <p>
                {LEGAL.brand} charges a <strong>0% platform fee</strong> on donations. We sustain the Platform through an
                optional voluntary tip that supporters may choose to add at checkout. Standard payment-processing fees
                charged by Razorpay apply to each transaction. Full details are on our{' '}
                <Link to="/pricing" className="text-orange-600 underline">Pricing &amp; Fees</Link> page. We will give at
                least 30 days' notice before introducing any new platform fee.
              </p>
            </Section>

            <Section title="9. Chargebacks & Payment Disputes">
              <p>
                Initiating a chargeback or payment dispute with your bank instead of contacting us first may delay
                resolution. If a chargeback is raised on funds already paid out to a creator, the creator is responsible
                for the disputed amount. We cooperate with Razorpay and banks to resolve disputes and prevent fraud, and
                we may suspend accounts associated with abusive chargebacks.
              </p>
            </Section>

            <Section title="10. Intellectual Property">
              <p>
                The {LEGAL.brand} name, brand, logo, design, and software are owned by {LEGAL.operatorName} and may not
                be used without permission. Content you submit (campaign text and images) remains yours, but you grant
                {' '}{LEGAL.brand} a non-exclusive, royalty-free, worldwide licence to host, display, and promote it in
                connection with operating the Platform. You confirm you have the rights to any content you upload.
              </p>
            </Section>

            <Section title="11. Disclaimer of Warranties">
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind, express or implied.
                We do not warrant that the Platform will be uninterrupted, secure, or error-free, or that any campaign is
                genuine or that funds will be used as stated. Your use of the Service is at your own risk.
              </p>
            </Section>

            <Section title="12. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, {LEGAL.operatorName} shall not be liable for any indirect,
                incidental, special, or consequential damages, or for any loss of donations, data, goodwill, or profits,
                arising from your use of the Platform or from any campaign or donation. Our total aggregate liability for
                any claim shall not exceed the total fees (if any) you paid to us in the three months before the claim.
              </p>
            </Section>

            <Section title="13. Indemnity">
              <p>
                You agree to indemnify and hold harmless {LEGAL.operatorName} from any claims, damages, losses, or
                expenses (including reasonable legal fees) arising out of your campaign, your content, your use of the
                Service, or your breach of these Terms or of any law.
              </p>
            </Section>

            <Section title="14. Account Suspension & Termination">
              <p>
                We may suspend or terminate your account at any time if you violate these Terms, engage in fraud, or
                create risk for the Platform, other users, or the public. You may delete your account at any time by
                contacting <MailLink />. Provisions that by their nature should survive termination (such as liability,
                indemnity, and dispute resolution) will continue to apply.
              </p>
            </Section>

            <Section title="15. Governing Law & Dispute Resolution">
              <p>
                These Terms are governed by the laws of India. Subject to any right you have to approach a consumer
                forum, any dispute arising out of or relating to these Terms or the Service shall be subject to the
                exclusive jurisdiction of the courts of competent jurisdiction in India. The parties will first attempt
                to resolve disputes amicably by contacting <MailLink />.
              </p>
            </Section>

            <Section title="16. Force Majeure">
              <p>
                We are not liable for any failure or delay caused by events beyond our reasonable control, including
                acts of God, natural disasters, war, civil unrest, changes in law, or failures of payment processors,
                internet, hosting, or other third-party infrastructure.
              </p>
            </Section>

            <Section title="17. Changes to These Terms">
              <p>
                We may update these Terms from time to time. We will post the revised version here with a new "Last
                updated" date and, for material changes, notify registered users by email. Continued use of the Service
                after the effective date constitutes acceptance of the updated Terms.
              </p>
            </Section>

            <Section title="18. Contact">
              <p>
                For any questions about these Terms, contact us at <MailLink /> or {LEGAL.phoneDisplay}, or visit our{' '}
                <Link to="/contact" className="text-orange-600 underline">Contact Us</Link> page.
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
