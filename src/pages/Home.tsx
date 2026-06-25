import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Campaign } from '../types';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FeaturedCarouselSkeleton } from '../components/Skeleton';
import { TypingHeroTitle } from '../components/TypingHeroTitle';
import { FAQAccordion } from '../components/FAQAccordion';
import { CountUp } from '../components/CountUp';
import BlurText from '../components/BlurText';
import ClickSpark from '../components/ClickSpark';
import { Zap, Star } from 'lucide-react';
import { isCampaignEnded, formatCompactINR } from '../utils/format';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const Home = () => {
  const { t } = useTranslation();

  const [titleDone, setTitleDone] = useState(false);
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
      // One day ago — campaigns featured before this are eligible to be displaced
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // ── Fairness selection ───────────────────────────────────────────────
      // Protected: featured < 24 h ago → guaranteed their first day, always shown
      // Falls back to simple query if featured_since column not yet migrated.
      const { data: protectedData, error: protectedError } = await supabase
        .from('campaigns')
        .select('*, profiles(full_name)')
        .eq('status', 'active')
        .eq('is_featured', true)
        .gt('featured_until', now)
        .gt('featured_since', oneDayAgo)
        .order('featured_since', { ascending: false })
        .limit(30);

      // If featured_since column doesn't exist yet, fall back to simple query
      if (protectedError) {
        const { data: fallbackData } = await supabase
          .from('campaigns')
          .select('*, profiles(full_name)')
          .eq('status', 'active')
          .eq('is_featured', true)
          .gt('featured_until', now)
          .order('featured_until', { ascending: false })
          .limit(30);
        setCampaigns(fallbackData || []);
      } else {
        const protectedCampaigns = protectedData || [];
        const remainingSlots = 30 - protectedCampaigns.length;

        // Eligible: featured ≥ 24 h ago → have had their day, fill leftover slots
        let eligibleCampaigns: Campaign[] = [];
        if (remainingSlots > 0) {
          const { data: eligibleData } = await supabase
            .from('campaigns')
            .select('*, profiles(full_name)')
            .eq('status', 'active')
            .eq('is_featured', true)
            .gt('featured_until', now)
            .or(`featured_since.lte.${oneDayAgo},featured_since.is.null`)
            .order('featured_since', { ascending: false })
            .limit(remainingSlots);

          eligibleCampaigns = eligibleData || [];
        }

        setCampaigns([...protectedCampaigns, ...eligibleCampaigns]);
      }
      // ────────────────────────────────────────────────────────────────────

      const { data: allCampaigns } = await supabase
        .from('campaigns')
        .select('current_amount, status, supporter_count, end_date');

      if (allCampaigns) {
        const totalRaised = allCampaigns.reduce(
          (sum, c) => sum + (parseFloat(c.current_amount?.toString() || '0')),
          0
        );
        const activeCampaigns = allCampaigns.filter(
          (c) => !isCampaignEnded(c)
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
    { question: t('home.faq_q6'), answer: t('home.faq_a6') },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-24 lg:py-32">
          <div className="text-center">
            <TypingHeroTitle
              className="text-4xl sm:text-6xl lg:text-8xl font-black text-gray-900 mb-6 sm:mb-8 leading-snug break-words"
              onComplete={() => setTitleDone(true)}
            />

            <BlurText
              text={t('home.hero_subtitle')}
              className="text-base sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed justify-center"
              delay={80}
              direction="bottom"
              stepDuration={0.4}
              paused={!titleDone}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[
            {
              label: t('home.total_raised'),
              count: stats.totalRaised,
              countFormat: formatCompactINR,
              subtext: t('home.funds_mobilized'),
            },
            {
              label: t('home.active_campaigns'),
              count: stats.activeCampaigns,
              countFormat: undefined as ((n: number) => string) | undefined,
              subtext: t('home.dreams_funded'),
            },
            {
              label: t('home.supporters'),
              count: stats.totalSupporters,
              countFormat: (n: number) =>
                stats.totalSupporters >= 1000
                  ? `${Math.round(n / 1000)}K`
                  : String(Math.round(n)),
              subtext: t('home.community'),
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.10)' }}
              className="bg-gradient-to-br from-orange-50 to-white p-6 sm:p-8 rounded-2xl border border-orange-100 text-center transition-all"
            >
              <div className="text-4xl sm:text-5xl font-black text-orange-600 mb-2">
                {loading ? '—' : (
                  <CountUp value={stat.count} format={stat.countFormat} />
                )}
              </div>
              <p className="text-orange-600 font-semibold text-sm mb-2">
                {stat.label}
              </p>
              <p className="text-gray-600 text-sm">{stat.subtext}</p>
            </motion.div>
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

          {loading ? <FeaturedCarouselSkeleton /> : <FeaturedCarousel campaigns={campaigns} />}

          {!loading && campaigns.length > 0 && (
            <div className="text-center mt-10">
              <Link
                to="/campaigns?featured=true"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl transition-all hover:scale-105"
              >
                <Star className="h-5 w-5 mr-2" />
                Browse All Featured Campaigns
              </Link>
            </div>
          )}
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
            <ClickSpark sparkColor="#fb923c" sparkSize={8} sparkRadius={22} sparkCount={8} duration={480}>
              <Link
                to="/create"
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 sm:px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                {t('home.cta_start')}
                <Zap className="h-5 w-5 ml-2" />
              </Link>
            </ClickSpark>

            <ClickSpark sparkColor="#fff7ed" sparkSize={8} sparkRadius={22} sparkCount={8} duration={480}>
              <Link
                to="/campaigns"
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 sm:px-8 py-4 bg-orange-700 bg-opacity-50 border-2 border-white text-white font-bold rounded-xl hover:bg-opacity-70 transition-all group"
              >
                <Star className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                {t('home.cta_browse')}
              </Link>
            </ClickSpark>
          </div>
        </div>
      </div>
    </div>
  );
};
