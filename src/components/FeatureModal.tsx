import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, X, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window { Razorpay: new (options: object) => { open(): void }; }
}

const PLANS = [
  { days: 7,  amountPaise: 49900,   display: '₹499',   label: '7 Days',  perDay: '₹71/day' },
  { days: 30, amountPaise: 149900,  display: '₹1,499', label: '30 Days', perDay: '₹50/day', popular: true },
  { days: 90, amountPaise: 299900,  display: '₹2,999', label: '90 Days', perDay: '₹33/day' },
];

const PERKS = [
  'Pinned at the top of Browse Campaigns',
  'Featured badge on your campaign card',
  'Highlighted in search results',
  'More visibility = more donors',
];

interface Props {
  campaignId: string;
  campaignTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FeatureModal = ({ campaignId, campaignTitle, onClose, onSuccess }: Props) => {
  const [plan, setPlan] = useState(PLANS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadSDK = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const loaded = await loadSDK();
      if (!loaded) throw new Error('Payment gateway failed to load.');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please refresh and try again.');

      // Create Razorpay order via Edge Function
      const orderRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ amount: plan.amountPaise, campaign_id: campaignId }),
        }
      );
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(body.error || 'Could not create payment order.');
      }
      const order = await orderRes.json();

      // Open Razorpay checkout
      new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: plan.amountPaise,
        currency: 'INR',
        name: 'RaiseFunding',
        description: `Feature "${campaignTitle}" for ${plan.label}`,
        order_id: order.id,
        theme: { color: '#ea580c' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Verify payment + activate featuring on the server
          const verifyRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                ...response,
                campaign_id: campaignId,
                days: plan.days,
              }),
            }
          );
          if (!verifyRes.ok) {
            const body = await verifyRes.json().catch(() => ({}));
            setError(body.error || 'Payment verification failed. Contact support.');
            setLoading(false);
            return;
          }
          setSuccess(true);
          setLoading(false);
          setTimeout(onSuccess, 2000);
        },
        modal: { ondismiss: () => setLoading(false) },
      }).open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-5 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Star className="h-6 w-6 fill-white" />
            <h2 className="text-xl font-bold">Feature Your Campaign</h2>
          </div>
          <p className="text-orange-100 text-sm">
            Get maximum visibility and reach more donors
          </p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Campaign Featured!</h3>
                <p className="text-gray-600">Your campaign is now featured for {plan.label}. Redirecting…</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Perks */}
                <ul className="space-y-2 mb-6">
                  {PERKS.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-gray-700">
                      <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>

                {/* Plan selector */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {PLANS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                        plan.days === p.days
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          POPULAR
                        </span>
                      )}
                      <div className={`text-lg font-bold ${plan.days === p.days ? 'text-orange-600' : 'text-gray-900'}`}>
                        {p.display}
                      </div>
                      <div className="text-xs font-semibold text-gray-700">{p.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.perDay}</div>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3.5 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Star className="h-5 w-5 fill-white" />
                      Pay {plan.display} · Feature for {plan.label}
                    </>
                  )}
                </button>

                <button onClick={onClose} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Skip for now — I'll feature it later from the dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
