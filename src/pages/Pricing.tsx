import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Heart, CreditCard, Wallet } from 'lucide-react';
import { LEGAL } from '../config/legal';

const FeeCard = ({ icon: Icon, title, amount, children }: {
  icon: typeof Heart; title: string; amount: string; children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
        <Icon className="h-5 w-5 text-orange-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-2xl font-black text-orange-600">{amount}</p>
      </div>
    </div>
    <p className="text-gray-600 text-sm leading-relaxed">{children}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

export const Pricing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Transparent by design</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Pricing &amp; Fees</h1>
          <p className="text-gray-600 mb-10 max-w-xl">
            {LEGAL.brand} keeps more of every donation with the cause. Here is exactly what it costs to raise and to
            give.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <FeeCard icon={Heart} title="Platform Fee" amount="0%">
              {LEGAL.brand} charges no platform fee on the donations your campaign receives.
            </FeeCard>
            <FeeCard icon={Wallet} title="Optional Tip" amount="Voluntary">
              Supporters may choose to add an optional tip at checkout to help keep {LEGAL.brand} running. It is never
              required.
            </FeeCard>
            <FeeCard icon={CreditCard} title="Payment Processing" amount="~2%*">
              Standard fees charged by our payment partner Razorpay apply to each transaction.
            </FeeCard>
          </div>
          <p className="text-xs text-gray-500 mb-10">
            *Payment-processing fees are set by Razorpay and vary by payment method (card, UPI, net banking, wallet) and
            are subject to applicable taxes. The exact fee is determined by Razorpay at the time of payment.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">
            <Section title="How it works">
              <ul className="space-y-3">
                {[
                  'Create a campaign for free — there is no charge to start fundraising.',
                  'Supporters donate through Razorpay using card, UPI, net banking, or wallet.',
                  'Donations are held securely in escrow and released to you when you claim them.',
                  'You provide bank/UPI details to receive a payout; Razorpay transfers the funds.',
                  'If funds are left unclaimed for 30 days after a campaign ends, they are automatically refunded to donors.',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{line}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="No hidden charges">
              <p>
                There are no sign-up fees, subscription fees, or withdrawal fees charged by {LEGAL.brand}. The only cost
                is the payment-processing fee charged by Razorpay, plus any optional tip a supporter chooses to add. We
                will give at least 30 days' notice before introducing any new platform fee.
              </p>
            </Section>

            <Section title="Related policies">
              <p>
                See our <Link to="/refunds" className="text-orange-600 underline">Refund &amp; Cancellation Policy</Link>,{' '}
                <Link to="/terms" className="text-orange-600 underline">Terms of Service</Link>, and{' '}
                <Link to="/contact" className="text-orange-600 underline">Contact Us</Link> page for more.
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
