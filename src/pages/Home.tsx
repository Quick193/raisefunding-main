import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Campaign } from '../types';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FAQAccordion } from '../components/FAQAccordion';
import { Zap, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Home = () => {
  const { t } = useTranslation();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({
    totalRaised: 0,
    activeCampaigns: 0,
    totalSupporters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date().toISOString();
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*, profiles(full_name, email)')
        .eq('status', 'active')
        .eq('is_featured', true)
        .gt('featured_until', now)
        .order('featured_until', { ascending: false })
        .limit(12);

      if (campaignsError) throw campaignsError;

      setCampaigns(campaignsData || []);

      const { data: allCampaigns } = await supabase
        .from('campaigns')
        .select('current_amount, status, supporter_count');

      if (allCampaigns) {
        const totalRaised = allCampaigns.reduce(
          (sum, c) => sum + (parseFloat(c.current_amount?.toString() || '0')),
          0
        );
        const activeCampaigns = allCampaigns.filter(
          (c) => c.status === 'active'
        ).length;
        const totalSupporters = allCampaigns.reduce(
          (sum, c) => sum + Number(c.supporter_count || 0),
          0
        );

        setStats({
          totalRaised,
          activeCampaigns,
          totalSupporters,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const faqItems = [
    { question: t('home.faq_q1'), answer: t('home.faq_a1') },
    { question: t('home.faq_q2'), answer: t('home.faq_a2') },
    { question: t('home.faq_q3'), answer: t('home.faq_a3') },
    { question: t('home.faq_q4'), answer: t('home.faq_a4') },
    { question: t('home.faq_q5'), answer: t('home.faq_a5') },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="animate-fade-in-up text-4xl sm:text-6xl lg:text-8xl font-black text-gray-900 mb-6 sm:mb-8 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                {t('home.hero_title_1')}
              </span>
              <br />
              <span>{t('home.hero_title_2')}</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                {t('home.hero_title_3')}
              </span>
            </h1>

            <p className="animate-fade-in-up text-base sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed" style={{ animationDelay: '0.1s' }}>
              {t('home.hero_subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[
            {
              label: t('home.total_raised'),
              value: `$${(stats.totalRaised / 1000000).toFixed(1)}M`,
              subtext: t('home.funds_mobilized'),
            },
            {
              label: t('home.active_campaigns'),
              value: stats.activeCampaigns,
              subtext: t('home.dreams_funded'),
            },
            {
              label: t('home.supporters'),
              value: `${stats.totalSupporters / 1000 > 1 ? (stats.totalSupporters / 1000).toFixed(0) + 'K' : stats.totalSupporters}`,
              subtext: t('home.community'),
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="animate-count-up bg-gradient-to-br from-orange-50 to-white p-6 sm:p-8 rounded-2xl border border-orange-100 text-center hover:shadow-lg transition-all"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="text-4xl sm:text-5xl font-black text-orange-600 mb-2">
                {loading ? '—' : stat.value}
              </div>
              <p className="text-orange-600 font-semibold text-sm mb-2">
                {stat.label}
              </p>
              <p className="text-gray-600 text-sm">{stat.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white py-12 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="animate-fade-in-up text-3xl sm:text-5xl font-black text-gray-900 mb-4">
              {t('home.featured_title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                {t('home.featured_title_2')}
              </span>
            </h2>
            <p className="animate-fade-in-up text-base sm:text-lg text-gray-600 max-w-2xl mx-auto" style={{ animationDelay: '0.1s' }}>
              {t('home.featured_subtitle')}
            </p>
          </div>

          {!loading && <FeaturedCarousel campaigns={campaigns} />}
        </div>
      </div>

      <div className="bg-gray-50 py-12 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="animate-fade-in-up text-3xl sm:text-5xl font-black text-gray-900 mb-4">
              {t('home.faq_title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                {t('home.faq_title_2')}
              </span>
            </h2>
            <p className="animate-fade-in-up text-base sm:text-lg text-gray-600" style={{ animationDelay: '0.1s' }}>
              {t('home.faq_subtitle')}
            </p>
          </div>

          <FAQAccordion items={faqItems} />
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-14 sm:py-24 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="animate-float text-3xl sm:text-5xl font-black text-white mb-6">
            {t('home.cta_title')}
          </h2>

          <p className="animate-float text-base sm:text-xl text-orange-50 mb-8 max-w-2xl mx-auto" style={{ animationDelay: '0.2s' }}>
            {t('home.cta_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center" style={{ animationDelay: '0.4s' }}>
            <Link
              to="/create"
              className="inline-flex w-full sm:w-auto items-center justify-center px-6 sm:px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              {t('home.cta_start')}
              <Zap className="h-5 w-5 ml-2" />
            </Link>

            <Link
              to="/campaigns"
              className="inline-flex w-full sm:w-auto items-center justify-center px-6 sm:px-8 py-4 bg-orange-700 bg-opacity-50 border-2 border-white text-white font-bold rounded-xl hover:bg-opacity-70 transition-all group"
            >
              <Star className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              {t('home.cta_browse')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
