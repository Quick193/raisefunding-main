import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LEGAL } from '../config/legal';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-orange-100">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

const MailLink = () => (
  <a href={`mailto:${LEGAL.email}`} className="text-orange-600 underline">{LEGAL.email}</a>
);

export const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Refund &amp; Cancellation Policy</h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: {LEGAL.lastUpdated}</p>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8">

            <Section title="1. Overview">
              <p>
                {LEGAL.brand} is a crowdfunding platform operated by {LEGAL.operatorName}. Donations made through the
                Platform are voluntary contributions to specific campaigns. Because your donation goes towards a
                fundraiser's cause, donations are generally final. However, we operate a donor-protective escrow model
                and offer refunds in the situations described below. This policy is designed to be fair to both donors
                and campaign creators.
              </p>
            </Section>

            <Section title="2. Escrow Protection & Automatic Refunds">
              <p>
                Donations are held securely and released to a campaign creator only when the creator claims them by
                providing valid payout details. When a campaign ends or reaches its goal, a <strong>30-day claim
                window</strong> begins.
              </p>
              <p>
                If the creator does <strong>not</strong> claim the funds within 30 days, every donation to that campaign
                is <strong>automatically refunded</strong> to the original payment method — you do not need to request
                it. Optional voluntary tips given to support {LEGAL.brand} are non-refundable.
              </p>
            </Section>

            <Section title="3. When You Can Request a Refund">
              <p>You may request a refund of your donation in any of these cases:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Duplicate or accidental donation</strong> — you were charged more than once, or donated in
                  error, and request a refund within 7 days of the transaction</li>
                <li><strong>Unauthorised transaction</strong> — a payment was made from your account or card without your
                  authorisation</li>
                <li><strong>Technical error</strong> — you were charged but the donation was not recorded against the
                  campaign, or you were charged an incorrect amount</li>
                <li><strong>Fraudulent or removed campaign</strong> — the campaign is found to violate our{' '}
                  <Link to="/terms" className="text-orange-600 underline">Terms</Link> and is removed before the funds are
                  paid out to the creator</li>
              </ul>
              <p>
                Once funds have been paid out to a verified creator, we may be unable to reverse the donation, but we
                will assist you and may take action against a creator who violates our Terms.
              </p>
            </Section>

            <Section title="4. How to Request a Refund">
              <p>Email <MailLink /> with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The email address on your {LEGAL.brand} account or used at checkout</li>
                <li>The campaign name and the donation amount</li>
                <li>The Razorpay payment reference or a screenshot of the receipt, if available</li>
                <li>The reason for your refund request</li>
              </ul>
              <p>You may also call us at {LEGAL.phoneDisplay} for help with a refund request.</p>
            </Section>

            <Section title="5. Processing Time">
              <p>
                We review eligible refund requests within <strong>2–3 business days</strong>. Approved refunds are issued
                to your original payment method through Razorpay and typically appear within <strong>5–7 business
                days</strong>, depending on your bank or card issuer. We will confirm by email once a refund is
                initiated.
              </p>
            </Section>

            <Section title="6. Non-Refundable Amounts">
              <ul className="list-disc pl-5 space-y-2">
                <li>Optional voluntary tips given to support {LEGAL.brand}</li>
                <li>Donations already paid out to a creator, except where required by law or in cases of proven fraud</li>
                <li>Payment-gateway fees may be non-refundable in line with Razorpay's policies</li>
              </ul>
            </Section>

            <Section title="7. Cancellations">
              <p>
                Donations cannot be cancelled once a payment has been successfully processed; please use the refund
                process above instead. A campaign creator may cancel their own campaign before claiming funds — in that
                case all collected donations are refunded to donors.
              </p>
            </Section>

            <Section title="8. Contact">
              <p>
                Questions about this policy? Email <MailLink />, call {LEGAL.phoneDisplay}, or visit our{' '}
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
