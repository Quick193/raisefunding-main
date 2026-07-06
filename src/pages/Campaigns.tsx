import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Campaign } from '../types';
import { Users, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import ShinyText from '../components/ShinyText';
import GlareHover from '../components/GlareHover';
import { motion } from 'framer-motion';
import { formatCurrency, isCampaignEnded } from '../utils/format';
import { useTranslation } from 'react-i18next';
import { CampaignGridSkeleton } from '../components/Skeleton';

const CAMPAIGNS_PER_PAGE = 28;

const CATEGORY_OPTIONS = [
  "All",
  "Medical",
  "Education",
  "Social Impact",
  "Emergency",
  "Environment",
  "Animal Welfare",
  "Other",
];

export const Campaigns = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [featuredOnly, setFeaturedOnly] = useState(() => searchParams.get('featured') === 'true');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Toggling the Featured filter is often a no-op visually (featured campaigns
  // already sort to the top), so flash the grid skeleton briefly to make the
  // action feel responsive.
  const handleToggleFeatured = () => {
    setFeaturedOnly((v) => !v);
    setPage(1);
    setRefreshing(true);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => setRefreshing(false), 450);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const nowIso = new Date().toISOString();

  const filteredCampaigns = campaigns
    .filter((campaign) => {
      const matchesSearch = campaign.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
      const effectiveStatus = isCampaignEnded(campaign) ? 'completed' : 'active';
      // Completed campaigns only appear under the "Completed" filter — "All"
      // and "Active" both show active (non-ended) campaigns only.
      const matchesFilter =
        filter === 'completed' ? effectiveStatus === 'completed' : effectiveStatus === 'active';
      const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;
      const matchesFeatured = !featuredOnly || (
        campaign.is_featured && campaign.featured_until && campaign.featured_until > nowIso
      );
      return matchesSearch && matchesFilter && matchesCategory && matchesFeatured;
    })
    .sort((a, b) => {
      const aFeatured = !!(a.is_featured && a.featured_until && a.featured_until > nowIso && !isCampaignEnded(a));
      const bFeatured = !!(b.is_featured && b.featured_until && b.featured_until > nowIso && !isCampaignEnded(b));
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return 0;
    });

  const totalPages = Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE);
  const startIdx = (page - 1) * CAMPAIGNS_PER_PAGE;
  const endIdx = startIdx + CAMPAIGNS_PER_PAGE;
  const campaignsToShow = filteredCampaigns.slice(startIdx, endIdx);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter, selectedCategory, featuredOnly]);

  // Scroll to top when page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [page]);

  if (loading) {
    return (
      <div className="bg-white relative">
        <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 z-0" />
        <div className="relative z-10 pt-12 pb-10">
          <div className="max-w-7xl mx-auto px-4">
            <CampaignGridSkeleton count={CAMPAIGNS_PER_PAGE > 12 ? 12 : CAMPAIGNS_PER_PAGE} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 z-0" />
      
      {/* Invisible top reference for scroll */}
      <div ref={topRef} className="absolute -top-20 left-0 w-full h-1 pointer-events-none z-50" />

      <div className="relative z-10 pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl font-black text-center mb-4 text-gray-900"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
              {t('campaigns.title')}
            </span>{' '}
            {t('campaigns.title_2')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-gray-600 mb-10 text-base sm:text-lg"
          >
            {t('campaigns.subtitle')}
          </motion.p>

          {/* Search and Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-8 relative z-20"
          >
            <motion.div
              whileHover={{ scale: 1.02, boxShadow: "0 12px 40px 0 rgba(251, 146, 60, 0.25)" }}
              className="flex w-full max-w-2xl flex-col gap-2 bg-white/80 backdrop-blur-lg border border-orange-200/50 shadow-lg px-4 py-3 rounded-2xl transition-all sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:py-2"
            >
              <div className="flex min-w-0 flex-1 items-center">
                <span className="flex items-center pr-2 text-orange-500">
                  <Search size={22} />
                </span>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  className="min-w-0 flex-1 py-3 pr-2 bg-transparent text-base sm:text-lg focus:outline-none focus:ring-0 focus:border-transparent placeholder:text-gray-500 text-gray-700 transition-all duration-300"
                  placeholder={t('campaigns.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full border-t border-orange-200 pt-2 sm:w-auto sm:border-l sm:border-t-0 sm:pt-0" style={{ borderColor: "#fed7aa" }}>
                <CustomSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={CATEGORY_OPTIONS}
                  buttonClassName="w-full border-none rounded-xl sm:rounded-none sm:rounded-r-full py-3 sm:min-w-[150px] focus:ring-0 shadow-none"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Status Filter Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {(['all', 'active', 'completed'] as const).map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(status)}
                className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg'
                    : 'bg-white/60 text-gray-700 border border-orange-200 hover:bg-orange-50'
                }`}
              >
                {status === 'all' ? t('campaigns.filter_all') : status === 'active' ? t('campaigns.filter_active') : t('campaigns.filter_completed')}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleFeatured}
              className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all ${
                featuredOnly
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                  : 'bg-white/60 border border-orange-200 hover:bg-orange-50'
              }`}
            >
              <ShinyText
                text="Featured"
                speed={2.5}
                color={featuredOnly ? '#fdba74' : '#c2410c'}
                shineColor={featuredOnly ? '#ffffff' : '#fbbf24'}
                spread={100}
              />
            </motion.button>
          </motion.div>

          {/* Campaigns Grid */}
          {refreshing ? (
            <CampaignGridSkeleton count={8} />
          ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            {campaignsToShow.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-orange-200/50 max-w-md mx-auto"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('campaigns.no_results_title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filter !== 'all' || selectedCategory !== 'All'
                      ? t('campaigns.no_results_filtered')
                      : t('campaigns.no_results_empty')}
                  </p>
                  {(searchTerm || filter !== 'all' || selectedCategory !== 'All') && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSearchTerm("");
                        setFilter('all');
                        setSelectedCategory('All');
                      }}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl text-white px-6 py-2 rounded-full font-semibold transition-all"
                    >
                      {t('campaigns.clear_filters')}
                    </motion.button>
                  )}
                </motion.div>
              </div>
            ) : (
              campaignsToShow.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                <GlareHover
                  onClick={() => navigate(`/campaign/${campaign.id}`)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                >
                  <div className="relative h-56">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white opacity-20">
                          {campaign.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-3 right-3 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {!isCampaignEnded(campaign) ? t('common.active') : t('common.completed')}
                    </div>

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {/* Category badge */}
                      <div className="mb-2">
                        <span className="bg-white bg-opacity-90 text-gray-800 text-xs px-3 py-1 rounded-full font-bold">
                          {campaign.category || 'Other'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                        {campaign.title}
                      </h3>
                    </div>
                  </div>

                  {/* Progress section */}
                  <div className="p-5">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(parseFloat(campaign.current_amount?.toString() || '0'))}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatCurrency(parseFloat(campaign.goal_amount?.toString() || '1'))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                        <motion.div
                          className="bg-orange-600 h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${Math.min(
                              (parseFloat(campaign.current_amount?.toString() || '0') /
                                parseFloat(campaign.goal_amount?.toString() || '1')) * 100,
                              100
                            )}%`
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-gray-600 font-medium">
                      <Users className="h-3 w-3 mr-1" />
                      {campaign.supporter_count || 0} {t('campaigns.supporters')}
                    </div>
                  </div>
                </GlareHover>
                </motion.div>
              ))
            )}
          </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-wrap justify-center items-center mt-12 gap-3 sm:gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl text-white rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous Page"
              >
                <ChevronLeft size={24} />
              </motion.button>
              <span className="text-base sm:text-lg font-semibold text-gray-700 bg-white/80 backdrop-blur-lg px-4 sm:px-6 py-2 rounded-full shadow-lg border border-orange-200/50">
                {t('campaigns.page_of', { page, total: totalPages })}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl text-white rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                aria-label="Next Page"
              >
                <ChevronRight size={24} />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
