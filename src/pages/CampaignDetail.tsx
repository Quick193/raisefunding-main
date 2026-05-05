import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Users,
  Calendar,
  Target,
  Heart,
  MapPin,
  Bookmark,
  ChevronDown,
  Flag
} from 'lucide-react';
import { Campaign } from '../types';
import { formatCurrency } from '../utils/format';
import { useTranslation } from 'react-i18next';

export const CampaignDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [relatedCampaigns, setRelatedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [supporters, setSupporters] = useState<{ donor_name: string; amount: number; created_at: string }[]>([]);
  const [showSupporters, setShowSupporters] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reporterEmail, setReporterEmail] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [reportError, setReportError] = useState('');
  const { user } = useAuth();

  const fetchSupporters = useCallback(async (campaignId: string) => {
    const { data } = await supabase
      .from('donations')
      .select('donor_name, amount, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    setSupporters(data || []);
  }, []);

  const fetchCampaign = useCallback(async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq('id', campaignId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCampaign(data);

        // Pre-load supporters for campaign creator
        if (data.creator_id) fetchSupporters(campaignId);

        // Only query related campaigns when this campaign has a category set
        if (data.category) {
          const { data: related } = await supabase
            .from('campaigns')
            .select(`
              *,
              profiles (
                full_name,
                email
              )
            `)
            .eq('category', data.category)
            .neq('id', campaignId)
            .limit(3);

          setRelatedCampaigns(related || []);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setLoading(false);
    }
  }, [fetchSupporters]);

  useEffect(() => {
    if (id) {
      fetchCampaign(id);
    }
  }, [fetchCampaign, id]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    if (reportReason.trim().length < 10) {
      setReportError(t('campaign.report_error_min'));
      return;
    }

    setReportStatus('submitting');
    setReportError('');

    try {
      const { error } = await supabase.from('campaign_reports').insert({
        campaign_id: campaign.id,
        reporter_email: reporterEmail.trim() || null,
        reason: reportReason.trim(),
      });

      if (error) throw error;
      setReportStatus('success');
      setReporterEmail('');
      setReportReason('');
      setShowReportForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message || 'Failed to submit report. Please try again.';
      setReportError(msg);
      setReportStatus('error');
    }
  };

  const handleShare = async (platform: string) => {
    const shareUrl = `${window.location.origin}/campaign/${campaign?.id}`;
    const text = `Check out this campaign: ${campaign?.title}`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      alert(t('common.copied'));
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    } else if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    }
  };

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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            {t('campaign.not_found')}
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:shadow-xl transition-all font-semibold"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('campaign.back')}
          </motion.button>
        </div>
      </div>
    );
  }

  const progress = Math.min(
    (parseFloat(campaign.current_amount?.toString() || '0') /
      parseFloat(campaign.goal_amount?.toString() || '1')) * 100,
    100
  );

  const daysLeft = campaign.end_date
    ? Math.ceil(
        (new Date(campaign.end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 relative">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/campaigns')}
          className="mb-6 inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold transition-all"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {t('campaign.back')}
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image and Campaign Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-orange-200/50 shadow-xl"
            >
              {/* Campaign Image */}
              <div className="relative h-96 overflow-hidden">
                {campaign.image_url ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-9xl font-bold opacity-20">
                      {campaign.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Category Badge */}
                {campaign.category && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-4 left-4"
                  >
                    <span className="bg-white/90 backdrop-blur-md text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg border border-orange-200/50">
                      {campaign.category}
                    </span>
                  </motion.div>
                )}

                {/* Days Left Badge */}
                {daysLeft !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute top-4 right-4"
                  >
                    <span className={`px-4 py-2 rounded-full font-bold text-sm text-white shadow-lg ${
                      daysLeft > 0 ? 'bg-orange-600' : 'bg-gray-600'
                    }`}>
                      {daysLeft > 0 ? `${daysLeft} ${t('campaign.days_left')}` : t('campaign.campaign_ended')}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Campaign Details */}
              <div className="p-8">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl font-black text-gray-900 mb-4"
                >
                  {campaign.title}
                </motion.h1>

                {/* Creator Info */}
                {campaign.profiles && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 mb-6"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {campaign.profiles.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{campaign.profiles.full_name}</p>
                      <p className="text-sm text-gray-600">Campaign Creator</p>
                    </div>
                  </motion.div>
                )}

                {/* Share Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex gap-3 mb-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all text-sm font-medium border border-orange-200/50"
                  >
                    <Share2 className="h-4 w-4 text-orange-600" />
                    {t('campaign.share')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all text-sm font-medium border border-orange-200/50"
                  >
                    <Bookmark className="h-4 w-4 text-orange-600" />
                    {t('campaign.copy_link')}
                  </motion.button>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="grid grid-cols-3 gap-4 mb-8 bg-orange-50/80 rounded-xl p-6 border border-orange-200/50"
                >
                  <div className="text-center">
                    <p className="text-3xl font-black text-orange-600">{Math.round(progress)}%</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">{t('campaign.funded_label')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-orange-600">{campaign.supporter_count || 0}</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">{t('campaign.supporters_label')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-orange-600">
                      {daysLeft && daysLeft > 0 ? daysLeft : 0}
                    </p>
                    <p className="text-xs text-gray-600 font-medium mt-1">{t('campaign.days_left_label')}</p>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('campaign.about_title')}</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {campaign.description}
                  </p>
                </motion.div>

                {/* Photo gallery (additional media images) */}
                {campaign.media && campaign.media.filter((m) => m.type === 'image').length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }} className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('campaign.gallery_title')}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {campaign.media.filter((m) => m.type === 'image').map((item, i) => (
                        <div key={i} className="rounded-xl overflow-hidden aspect-square border border-orange-100">
                          <img src={item.url} alt={item.name || `Photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Videos (uploaded files + video_url) */}
                {(() => {
                  const uploadedVideos = (campaign.media || []).filter((m) => m.type === 'video');
                  const allVideos: { url: string; name?: string }[] = [
                    ...(campaign.video_url ? [{ url: campaign.video_url }] : []),
                    ...uploadedVideos,
                  ];
                  if (allVideos.length === 0) return null;
                  return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="mt-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {allVideos.length === 1 ? t('campaign.video_title') : t('campaign.videos_title')}
                      </h2>
                      <div className="space-y-6">
                        {allVideos.map((v, i) => {
                          const ytMatch = v.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
                          const viMatch = v.url.match(/vimeo\.com\/(\d+)/);
                          const isDirect = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(v.url) || v.url.includes('/storage/v1/object/public/');
                          if (ytMatch || viMatch) {
                            const src = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : `https://player.vimeo.com/video/${viMatch![1]}`;
                            return (
                              <div key={i} className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                                <iframe src={src} className="absolute inset-0 w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                              </div>
                            );
                          }
                          if (isDirect) {
                            return <video key={i} controls className="w-full rounded-xl border border-orange-200" src={v.url} />;
                          }
                          return null;
                        })}
                      </div>
                    </motion.div>
                  );
                })()}


                {/* Additional Info Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8"
                >
                  {campaign.location && (
                    <div className="bg-orange-50/80 rounded-xl p-4 border border-orange-200/50">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <span className="text-gray-900 font-semibold">{t('campaign.location_label')}</span>
                      </div>
                      <p className="text-gray-700">{campaign.location}</p>
                    </div>
                  )}
                  <div className="bg-orange-50/80 rounded-xl p-4 border border-orange-200/50">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="w-5 h-5 text-orange-500" />
                      <span className="text-gray-900 font-semibold">{t('campaign.goal_label')}</span>
                    </div>
                    <p className="text-gray-700">{formatCurrency(campaign.goal_amount)}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Related Campaigns */}
            {relatedCampaigns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-orange-200/50 shadow-xl"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('campaign.similar_title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedCampaigns.map((related, idx) => (
                    <motion.div
                      key={related.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + idx * 0.1 }}
                      whileHover={{ scale: 1.03, y: -5 }}
                      onClick={() => navigate(`/campaign/${related.id}`)}
                      className="bg-white rounded-xl overflow-hidden border border-orange-200/50 cursor-pointer hover:shadow-xl transition-all"
                    >
                      <div className="relative h-40">
                        {related.image_url ? (
                          <img
                            src={related.image_url}
                            alt={related.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white opacity-20">
                              {related.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{related.title}</h3>
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-orange-600">
                            {formatCurrency(parseFloat(related.current_amount?.toString() || '0'))}
                          </span>
                          <span className="text-gray-600">
                            of {formatCurrency(parseFloat(related.goal_amount?.toString() || '1'))}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Donation Card + Supporters (creator only) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
            {/* Supporters list — visible to campaign creator only */}
            {user?.id === campaign.creator_id && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-orange-200/50 shadow-xl"
              >
                <button
                  onClick={() => setShowSupporters((v) => !v)}
                  className="flex items-center justify-between w-full"
                >
                  <h2 className="text-xl font-bold text-gray-900">
                    Supporters ({campaign.supporter_count || 0})
                  </h2>
                  <ChevronDown className={`h-5 w-5 text-orange-600 transition-transform duration-200 ${showSupporters ? 'rotate-180' : ''}`} />
                </button>

                {showSupporters && (
                  <div className="mt-4">
                    {supporters.length === 0 ? (
                      <p className="text-gray-500 text-sm">No donations yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {supporters.map((s, i) => (
                          <div key={i} className="flex items-center justify-between py-3 border-b border-orange-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                {s.donor_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{s.donor_name}</p>
                                <p className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <span className="font-bold text-orange-600 text-sm">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(s.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl border border-orange-200/50 shadow-xl p-6 space-y-6"
            >
              {/* Amount Raised */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border-b pb-6"
              >
                <p className="text-sm text-gray-600 font-medium mb-2">{t('campaign.raised_so_far')}</p>
                <p className="text-4xl font-black text-orange-600 mb-2">
                  {formatCurrency(campaign.current_amount)}
                </p>
                <p className="text-sm text-gray-600">
                  of {formatCurrency(campaign.goal_amount)} {t('campaign.goal_suffix')}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-orange-400 h-3 rounded-full shadow-lg transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </motion.div>

              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900">{t('campaign.donations_notice_title')}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {t('campaign.donations_notice_body')}
                    </p>
                  </div>
                </div>
              </div>

              {reportStatus === 'success' && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {t('campaign.report_success')}
                </div>
              )}

              {!showReportForm ? (
                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <Flag className="h-4 w-4" />
                  {t('campaign.report_button')}
                </button>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('campaign.report_email_label')}</label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      className="w-full rounded-lg border border-orange-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={t('campaign.report_email_placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('campaign.report_concern_label')}</label>
                    <textarea
                      required
                      rows={4}
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-lg border border-orange-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={t('campaign.report_concern_placeholder')}
                    />
                  </div>
                  {reportError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {reportError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={reportStatus === 'submitting'}
                      className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                      {reportStatus === 'submitting' ? t('common.loading') : t('campaign.report_submit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      {t('campaign.report_cancel')}
                    </button>
                  </div>
                </form>
              )}

              {/* Campaign Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="space-y-4 pt-6 border-t"
              >
                <h3 className="font-bold text-gray-900">{t('stats.campaign_info')}</h3>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{campaign.supporter_count || 0} {t('campaign.supporters_label').toLowerCase()}</p>
                    <p className="text-xs text-gray-600">People backing this campaign</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{Math.round(progress)}% funded</p>
                    <p className="text-xs text-gray-600">{t('campaign.progress_label')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {daysLeft && daysLeft > 0 ? daysLeft : 0} {t('campaign.days_left')}
                    </p>
                    <p className="text-xs text-gray-600">Time to support</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
