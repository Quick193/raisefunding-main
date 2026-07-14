import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, ShieldCheck } from 'lucide-react';
import { LEGAL } from '../config/legal';

const Card = ({ icon: Icon, title, children }: { icon: typeof Mail; title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 flex items-start gap-4">
    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
      <Icon className="h-5 w-5 text-orange-600" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <div className="text-gray-700 text-sm leading-relaxed space-y-1">{children}</div>
    </div>
  </div>
);

export const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Get in touch</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-600 mb-10 max-w-xl">
            We're here to help with donations, campaigns, refunds, and any question about {LEGAL.brand}. Reach us
            through any of the channels below and we'll get back to you as soon as we can.
          </p>

          <div className="space-y-4">
            <Card icon={Mail} title="Email">
              <a href={`mailto:${LEGAL.email}`} className="text-orange-600 underline">{LEGAL.email}</a>
              <p className="text-gray-500">Best for detailed queries, refund requests, and reporting a campaign.</p>
            </Card>

            <Card icon={Phone} title="Phone">
              <a href={`tel:${LEGAL.phoneHref}`} className="text-orange-600 underline">{LEGAL.phoneDisplay}</a>
              <p className="text-gray-500">Available on business days during standard hours (IST).</p>
            </Card>

            <Card icon={Clock} title="Response Time">
              <p>We aim to acknowledge every message within <strong>24–48 hours</strong> on business days.</p>
            </Card>

            <Card icon={ShieldCheck} title="Grievance Officer">
              <p>
                In line with the IT Act 2000 and the DPDP Act 2023, complaints about your data or our service can be
                raised with our Grievance Officer, <strong>{LEGAL.operatorName}</strong>, at the email above. See our{' '}
                <Link to="/privacy" className="text-orange-600 underline">Privacy Policy</Link> for details.
              </p>
            </Card>
          </div>

          <div className="mt-8 bg-white rounded-2xl border border-orange-100 p-6 text-sm text-gray-600">
            <p className="mb-1">
              <strong>{LEGAL.brand}</strong> is operated by <strong>{LEGAL.operatorName}</strong> ({LEGAL.operatorType}),
              India.
            </p>
            <p>Website: <a href={LEGAL.url} className="text-orange-600 underline">{LEGAL.domain}</a></p>
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
