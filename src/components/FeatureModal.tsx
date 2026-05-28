import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, X, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PLANS = [
  { days: 7, label: '7 Days' },
  { days: 30, label: '30 Days', popular: true },
  { days: 90, label: '90 Days' },
];

interface Props {
  campaignId: string;
  campaignTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FeatureModal = ({ campaignId, campaignTitle, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const perks = [
    t('feature_modal.perk_1'),
    t('feature_modal.perk_2'),
    t('feature_modal.perk_3'),
    t('feature_modal.perk_4'),
  ];
  const [plan, setPlan] = useState(PLANS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFeature = async () => {
    setLoading(true);
    setError('');

    try {
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + plan.days);

      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          is_featured: true,
          featured_until: featuredUntil.toISOString(),
          featured_since: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .select('id')
        .single();

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
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
            <h2 className="text-xl font-bold">{t('feature_modal.title')}</h2>
          </div>
          <p className="text-orange-100 text-sm">
            {t('feature_modal.subtitle')}
          </p>
          <p className="text-orange-50 text-xs mt-1 truncate">
            {campaignTitle}
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('feature_modal.success_title')}</h3>
                <p className="text-gray-600">{t('feature_modal.success_message', { duration: plan.label })}</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Perks */}
                <ul className="space-y-2 mb-6">
                  {perks.map((perk) => (
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
                          {t('feature_modal.popular')}
                        </span>
                      )}
                      <div className={`text-lg font-bold ${plan.days === p.days ? 'text-orange-600' : 'text-gray-900'}`}>
                        {p.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{t('feature_modal.test_mode')}</div>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleFeature}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3.5 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Star className="h-5 w-5 fill-white" />
                      {t('feature_modal.feature_btn', { duration: plan.label })}
                    </>
                  )}
                </button>

                <button onClick={onClose} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  {t('feature_modal.skip_btn')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
