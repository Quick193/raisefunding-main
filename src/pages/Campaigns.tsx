import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Campaign } from '../types';
import { Users, ChevronLeft, ChevronRight, Search, Star } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/format';

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
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const now = new Date().toISOString();
      const [allRes, featuredRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false }),
        supabase
          .from('campaigns')
          .select('*, profiles(full_name, email)')
          .eq('is_featured', true)
          .eq('status', 'active')
          .gt('featured_until', now)
          .order('featured_until', { ascending: false }),
      ]);
      if (allRes.error) throw allRes.error;
      setCampaigns(allRes.data || []);
      setFeaturedCampaigns(featuredRes.data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE);
  const startIdx = (page - 1) * CAMPAIGNS_PER_PAGE;
  const endIdx = startIdx + CAMPAIGNS_PER_PAGE;
  const campaignsToShow = filteredCampaigns.slice(startIdx, endIdx);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter, selectedCategory]);

  // Scroll to top when page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 z-0" />
      
      {/* Invisible top reference for scroll */}
      <div ref={topRef} className="absolute -top-20 left-0 w-full h-1 pointer-events-none z-50" />

      <div className="relative z-10 pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl font-black text-center mb-4 text-gray-900"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
              Browse
            </span>{' '}
            Campaigns
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-gray-600 mb-10 text-base sm:text-lg"
          >
            Discover and support amazing projects from creators around the world
          </motion.p>

          {/* ── Featured Campaigns ─────────────────────────────── */}
          {featuredCampaigns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-5">
                <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Featured Campaigns</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCampaigns.map((campaign, idx) => {
                  const progress = Math.min(
                    (Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100, 100
                  );
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.03, y: -6 }}
                      onClick={() => navigate(`/campaign/${campaign.id}`)}
                      className="relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer border-2 border-orange-400 hover:shadow-2xl transition-all"
                    >
                      {/* Featured badge */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                        <Star className="h-3 w-3 fill-white" />
                        Featured
                      </div>

                      <div className="relative h-52">
                        {campaign.image_url ? (
                          <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                            <span className="text-6xl font-bold text-white opacity-20">
                              {campaign.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                            {campaign.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2 text-sm">
                          <span className="font-bold text-gray-900">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(campaign.current_amount))}
                          </span>
                          <span className="text-gray-500">
                            of {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(campaign.goal_amount))}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span className="font-medium">{Math.round(progress)}% funded</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.supporter_count || 0}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

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
                  placeholder="Search campaigns..."
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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </motion.div>

          {/* Campaigns Grid */}
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
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">No campaigns found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filter !== 'all' || selectedCategory !== 'All'
                      ? "Try adjusting your search terms or filters."
                      : "No campaigns are currently available."}
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
                      Clear filters
                    </motion.button>
                  )}
                </motion.div>
              </div>
            ) : (
              campaignsToShow.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
                  initial={{ scale: 1, y: 0 }}
                  whileHover={{
                    scale: 1.05,
                    y: -8
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/campaign/${campaign.id}`)}
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
                      {campaign.status}
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
                      {campaign.supporter_count || 0} supporters
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

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
                Page {page} of {totalPages}
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
