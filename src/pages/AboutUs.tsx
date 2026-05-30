import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { CountUp } from '../components/CountUp';
import {
  Sparkles,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Users,
  Calculator,
  Rocket,
  Target,
  Lightbulb,
  PiggyBank,
  CreditCard,
  CheckCircle,
  Wallet,
  Star,
} from 'lucide-react';

export const AboutUs = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    campaignsCreated: 0,
    totalRaised: 0,
    successRate: 0,
    statesSupported: 5,
  });
  const [goalStr, setGoalStr] = useState('1000');
  const [donorsStr, setDonorsStr] = useState('4');
  const [loading, setLoading] = useState(true);

  const earnings = useMemo(() => {
    const totalFunds = parseInt(goalStr) || 0;
    const processing = totalFunds * 0.02;
    const platform = 0;
    return {
      net: totalFunds - processing - platform,
      processing,
      platform,
    };
  }, [goalStr]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('current_amount, status, id');

      if (campaigns) {
        const created = campaigns.length;
        const totalRaised = campaigns.reduce(
          (sum, c) => sum + (parseFloat(c.current_amount?.toString() || '0')),
          0
        );
        const completed = campaigns.filter((c) => c.status === 'completed').length;
        const successRate = created > 0 ? ((completed / created) * 100).toFixed(1) : 0;

        setStats({
          campaignsCreated: created,
          totalRaised,
          successRate: parseFloat(successRate as string),
          statesSupported: 5,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Lightbulb,
      title: t('about.feature_setup_title'),
      description: t('about.feature_setup_desc'),
    },
    {
      icon: Shield,
      title: t('about.feature_security_title'),
      description: t('about.feature_security_desc'),
    },
    {
      icon: Zap,
      title: t('about.feature_speed_title'),
      description: t('about.feature_speed_desc'),
    },
    {
      icon: Globe,
      title: t('about.feature_global_title'),
      description: t('about.feature_global_desc'),
    },
    {
      icon: TrendingUp,
      title: t('about.feature_analytics_title'),
      description: t('about.feature_analytics_desc'),
    },
    {
      icon: Users,
      title: t('about.feature_community_title'),
      description: t('about.feature_community_desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl font-black text-orange-600 mb-6"
          >
            {t('about.title')}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-700 max-w-3xl mx-auto mb-8"
          >
            {t('about.subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/create"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl transition-all"
              >
                <Rocket className="h-5 w-5 mr-2" />
                {t('about.cta_campaign')}
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/campaigns"
                className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-orange-600 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all"
              >
                <Globe className="h-5 w-5 mr-2" />
                {t('about.cta_browse')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-gray-900 mb-4"
          >
            {t('about.powering_title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
              {t('about.powering_title_2')}
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            {t('about.powering_desc')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Target,
              count: stats.campaignsCreated,
              countFormat: undefined as ((n: number) => string) | undefined,
              label: t('about.stat_campaigns'),
            },
            {
              icon: Lightbulb,
              count: stats.totalRaised / 100000,
              countFormat: (n: number) => `₹${n.toFixed(1)}L`,
              label: t('about.stat_raised'),
            },
            {
              icon: TrendingUp,
              count: stats.successRate,
              countFormat: (n: number) => `${n.toFixed(1)}%`,
              label: t('about.stat_success'),
            },
            {
              icon: Globe,
              count: stats.statesSupported,
              countFormat: undefined as ((n: number) => string) | undefined,
              label: t('about.stat_states'),
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)" }}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center group transition-shadow"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="mb-4 transition-transform"
              >
                <stat.icon className="h-12 w-12 text-orange-500 mx-auto" />
              </motion.div>
              <div className="text-4xl font-black text-gray-900 mb-2">
                {loading ? '—' : <CountUp value={stat.count} format={stat.countFormat} />}
              </div>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-orange-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl font-black text-gray-900 mb-8"
              >
                {t('about.mission_title')}
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-lg text-gray-700 mb-6 leading-relaxed"
              >
                {t('about.mission_p1')}
              </motion.p>

              <motion.p 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg text-gray-700 mb-8 leading-relaxed"
              >
                {t('about.mission_p2')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="#features"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  <span>{t('about.mission_learn_more')}</span>
                  <Sparkles className="h-5 w-5 ml-2" />
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl p-8 border border-orange-200 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-40" />

                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="relative flex items-center justify-center w-24 h-24 bg-white rounded-2xl mx-auto mb-6"
                >
                  <Target className="h-12 w-12 text-orange-600" />
                </motion.div>

                <h3 className="text-2xl font-black text-gray-900 text-center mb-4">
                  {t('about.mission_box_title')}
                </h3>

                <p className="text-center text-gray-700 mb-6">
                  {t('about.mission_box_desc')}
                </p>

                <div className="flex items-center justify-center text-orange-600 font-bold">
                  <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                  <span>{t('about.mission_box_feature')}</span>
                </div>
              </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-gray-900 mb-4"
          >
            {t('about.pricing_title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
              {t('about.pricing_title_2')}
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            {t('about.pricing_desc')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: t('about.pricing_platform_title'),
              value: '0%',
              icon: PiggyBank,
              color: 'bg-green-50',
              description: t('about.pricing_platform_desc'),
            },
            {
              title: t('about.pricing_payment_title'),
              value: '2%',
              icon: CreditCard,
              color: 'bg-blue-50',
              description: t('about.pricing_payment_desc'),
            },
            {
              title: t('about.pricing_premium_title'),
              value: '1%',
              icon: Star,
              color: 'bg-green-50',
              description: t('about.pricing_premium_desc'),
            },
          ].map((pricing, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)" }}
              className={`${pricing.color} rounded-2xl p-8 text-center border border-gray-200 group transition-shadow`}
            >
              <motion.div 
                whileHover={{ scale: 1.25 }}
                className="mb-4 flex justify-center"
              >
                <pricing.icon className="h-12 w-12 text-orange-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {pricing.title}
              </h3>
              <div className="text-5xl font-black text-orange-600 mb-4">
                {pricing.value}
              </div>
              <p className="text-gray-700">{pricing.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-gray-900 mb-4"
          >
            {t('about.features_title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
              {t('about.features_title_2')}
            </span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }}
                className="bg-gradient-to-br from-white to-orange-50 border border-orange-100 rounded-2xl p-8 group transition-shadow"
              >
                <motion.div 
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl mb-6"
                >
                  <Icon className="h-8 w-8 text-orange-600" />
                </motion.div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-700">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-16 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center mb-6"
            >
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <Calculator className="h-8 w-8 text-white" />
              </div>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-black text-white mb-4"
            >
              {t('about.calc_title')}
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-orange-100"
            >
              {t('about.calc_subtitle')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-3xl p-8 text-white"
            >
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-lg">{t('about.calc_goal_label')}</label>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black">₹</span>
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={goalStr}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setGoalStr(e.target.value)}
                      onBlur={() => {
                        const val = Math.min(1000000, Math.max(0, parseInt(goalStr) || 0));
                        setGoalStr(String(val));
                      }}
                      className="w-28 text-right text-2xl font-black bg-transparent border-b-2 border-white border-opacity-60 focus:outline-none focus:border-opacity-100 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  value={parseInt(goalStr) || 0}
                  onChange={(e) => setGoalStr(e.target.value)}
                  className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-sm text-orange-100 mt-2">{t('about.calc_goal_range')}</div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-lg">{t('about.calc_donors_label')}</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={donorsStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDonorsStr(e.target.value)}
                    onBlur={() => {
                      const val = Math.min(10000, Math.max(0, parseInt(donorsStr) || 0));
                      setDonorsStr(String(val));
                    }}
                    className="w-24 text-right text-2xl font-black bg-transparent border-b-2 border-white border-opacity-60 focus:outline-none focus:border-opacity-100 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={parseInt(donorsStr) || 0}
                  onChange={(e) => setDonorsStr(e.target.value)}
                  className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="bg-white bg-opacity-15 border border-white border-opacity-20 rounded-xl p-6">
                <p className="text-orange-100 text-sm mb-2">{t('about.calc_fee_label')}</p>
                <p className="text-2xl font-black mb-3">₹0.00</p>
                <p className="text-sm text-orange-100">{t('about.calc_fee_note')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {[5000, 25000, 50000, 100000].map((amount) => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGoalStr(String(amount))}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 border border-white border-opacity-30 rounded-lg px-4 py-3 font-bold transition-all"
                  >
                    ₹{amount.toLocaleString()}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-3xl p-8 text-white"
            >
              <div className="mb-8">
                <p className="text-orange-100 text-sm mb-2 flex items-center">
                  <Wallet className="h-5 w-5 mr-2" /> {t('about.calc_you_receive')}
                </p>
                <p className="text-5xl font-black mb-4">
                  ₹{earnings.net.toFixed(2)}
                </p>
                <p className="text-orange-100">{t('about.calc_bank')}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-4">
                  <span className="flex items-center text-orange-100">
                    <CreditCard className="h-5 w-5 mr-2" /> {t('about.calc_processing')}
                  </span>
                  <span className="font-bold">₹{earnings.processing.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between bg-green-500 bg-opacity-20 rounded-lg p-4">
                  <span className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" /> {t('about.calc_platform')}
                  </span>
                  <span className="font-bold">₹{earnings.platform.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-orange-100 text-center">
                {t('about.calc_note')}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-3xl p-12 sm:p-16 text-center"
        >
          <div className="flex justify-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl p-6"
            >
              <Rocket className="h-12 w-12 text-white" />
            </motion.div>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            {t('about.cta_final_title')}
          </h2>

          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            {t('about.cta_final_desc')}
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/create"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl transition-all"
            >
              <span>{t('about.cta_final_btn')}</span>
              <Zap className="h-5 w-5 ml-2 animate-pulse" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
