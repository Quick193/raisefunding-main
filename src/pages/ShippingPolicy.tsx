import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LEGAL } from '../config/legal';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-orange-100">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

export const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Shipping &amp; Delivery Policy</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: {LEGAL.lastUpdated}</p>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">

            <Section title="1. Digital Service — No Physical Shipping">
              <p>
                {LEGAL.brand} ({LEGAL.domain}), operated by {LEGAL.operatorName}, is an online crowdfunding platform. We
                do not sell, ship, or deliver any physical goods. This policy is provided for transparency and to satisfy
                standard payment-gateway requirements.
              </p>
            </Section>

            <Section title="2. How Donations Are Delivered">
              <p>
                When you make a donation, it is processed electronically through our payment partner, Razorpay. On
                successful payment, your contribution is recorded against the chosen campaign and reflected on the
                campaign page <strong>immediately or within a few minutes</strong>. A confirmation is available on screen
                and, where applicable, by email.
              </p>
            </Section>

            <Section title="3. Payouts to Campaign Creators">
              <p>
                Funds raised are delivered to verified campaign creators electronically via bank transfer or UPI through
                Razorpay once the creator claims them, subject to our escrow process. Payout timelines depend on Razorpay
                and the recipient's bank and are typically completed within a few business days of a successful claim.
              </p>
            </Section>

            <Section title="4. No Delivery Charges">
              <p>
                As no physical goods are involved, no shipping, handling, or delivery charges apply. The only fees that
                may apply are the payment-processing fees described on our{' '}
                <Link to="/pricing" className="text-orange-600 underline">Pricing &amp; Fees</Link> page.
              </p>
            </Section>

            <Section title="5. Contact">
              <p>
                For any questions, email{' '}
                <a href={`mailto:${LEGAL.email}`} className="text-orange-600 underline">{LEGAL.email}</a> or call{' '}
                {LEGAL.phoneDisplay}.
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
