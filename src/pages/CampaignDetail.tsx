import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { motion } from 'framer-motion';
import { CountUp } from '../components/CountUp';
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
import { Skeleton } from '../components/Skeleton';
import { loadRazorpay, RazorpayHandlerResponse } from '../lib/razorpay';
import { getTrustedCampaignMediaUrl } from '../utils/media';

const getTipMessage = (category: string | null | undefined, title: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat === 'medical') return `The team behind "${title}" is fighting for someone's life. Your ₹300 tip keeps this platform free for campaigns that can't wait.`;
  if (cat === 'education') return `Every child deserves a shot at learning. Your ₹300 tip helps us bring more campaigns like "${title}" to students who need it most.`;
  if (cat === 'social impact') return `Change starts with someone caring enough to act. Your ₹300 tip helps amplify voices like the one behind "${title}".`;
  if (cat === 'emergency') return `Emergencies don't wait. Your ₹300 tip keeps our servers running so campaigns like "${title}" reach people in their darkest hour.`;
  if (cat === 'environment') return `The planet needs more people like you. Your ₹300 tip helps us grow more campaigns like "${title}" for a greener future.`;
  if (cat === 'animal welfare') return `Animals can't speak for themselves — but you can. Your ₹300 tip helps more causes like "${title}" find the support they deserve.`;
  return `Your ₹300 tip helps us keep Raise free and accessible for everyone, so campaigns like "${title}" can keep making a difference.`;
};

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
  const [donateStep, setDonateStep] = useState<'idle' | 'amount' | 'tip' | 'summary' | 'success'>('idle');
  const [donateAmountStr, setDonateAmountStr] = useState('500');
  const [donateName, setDonateName] = useState('');
  const [donateEmail, setDonateEmail] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [showPersuasion, setShowPersuasion] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [donateError, setDonateError] = useState('');
  const [localDonors, setLocalDonors] = useState<{ donor_name: string; amount: number; created_at: string }[]>([]);
  const [showAllDonors, setShowAllDonors] = useState(false);
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
            full_name
          )
        `)
        .eq('id', campaignId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Display uses isCampaignEnded (date-aware), and the daily job flips
        // expired campaigns to 'completed' with a claim window. We no longer
        // write status from the client here — doing so set no claim_deadline
        // (escaping refunds) and tripped RLS for non-owner viewers.
        setCampaign(data as typeof data);

        // Pre-load supporters for campaign creator
        if (data.creator_id) fetchSupporters(campaignId);

        // Only query related campaigns when this campaign has a category set
        if (data.category) {
          const { data: related } = await supabase
            .from('campaigns')
            .select(`
              *,
              profiles (
            full_name
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
      const { data, error } = await supabase.functions.invoke('campaign-report', {
        body: {
          campaign_id: campaign.id,
          reporter_email: reporterEmail.trim() || null,
          reason: reportReason.trim(),
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to submit report. Please try again.');
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
        '_blank',
        'noopener,noreferrer'
      );
    } else if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const resetDonate = () => {
    setDonateStep('idle');
    setDonateAmountStr('500');
    setDonateName('');
    setDonateEmail('');
    setTipAmount(0);
    setShowPersuasion(false);
    setDonateError('');
  };

  const handlePayment = async () => {
    if (!campaign) return;
    setIsProcessing(true);
    setDonateError('');
    const donateAmount = Math.max(1, parseInt(donateAmountStr) || 1);
    const donorNameFinal = donateName.trim() || 'Anonymous';
    const donorEmailFinal = donateEmail.trim();

    try {
      const ready = await loadRazorpay();
      if (!ready) {
        setDonateError('Could not load the payment gateway. Please try again.');
        setIsProcessing(false);
        return;
      }

      // 1. Create the order server-side (also computes the Route split).
      const { data: order, error: orderError } = await supabase.functions.invoke('donation-order', {
        body: {
          campaign_id: campaign.id,
          amount: donateAmount,
          tip: tipAmount,
          donor_name: donorNameFinal,
          donor_email: donorEmailFinal,
        },
      });
      if (orderError || !order?.id) {
        setDonateError(order?.error || 'Could not start the payment. Please try again.');
        setIsProcessing(false);
        return;
      }

      // 2. Open Razorpay Checkout (UPI / cards / netbanking).
      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'Raise',
        description: campaign.title,
        image: `${window.location.origin}/favicon.png`,
        prefill: { name: donorNameFinal, email: donorEmailFinal },
        theme: { color: '#ea580c' },
        modal: { ondismiss: () => setIsProcessing(false) },
        handler: async (response: RazorpayHandlerResponse) => {
          // 3. Verify the signature and record the donation server-side.
          const { data: result, error: verifyError } = await supabase.functions.invoke('donation-verify', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaign_id: campaign.id,
              donor_name: donorNameFinal,
              donor_email: donorEmailFinal,
              amount: donateAmount,
            },
          });

          if (verifyError || !result?.success) {
            setDonateError(
              'Payment received but we could not confirm it instantly — it will be reflected shortly.'
            );
            setIsProcessing(false);
            return;
          }

          setLocalDonors((prev) => [
            { donor_name: donorNameFinal, amount: donateAmount, created_at: new Date().toISOString() },
            ...prev,
          ]);
          await fetchCampaign(campaign.id);
          setIsProcessing(false);
          setDonateStep('success');
        },
      });
      rzp.open();
    } catch {
      setDonateError('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <Skeleton className="h-5 w-28 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[420px] w-full rounded-2xl" />
              <Skeleton className="h-8 w-3/4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
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
        (new Date(campaign.end_date.split('T')[0] + 'T23:59:59').getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isEnded = campaign.status === 'completed' || (daysLeft !== null && daysLeft <= 0);

  const remaining = Math.max(
    0,
    parseFloat(campaign.goal_amount?.toString() || '0') -
      parseFloat(campaign.current_amount?.toString() || '0')
  );
  const goalReached = remaining <= 0;

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
                {getTrustedCampaignMediaUrl(campaign.image_url) ? (
                  <img
                    src={getTrustedCampaignMediaUrl(campaign.image_url)!}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
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

                {/* Status / Days Left Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-4 right-4"
                >
                  <span className={`px-4 py-2 rounded-full font-bold text-sm text-white shadow-lg ${
                    isEnded ? 'bg-gray-600' : 'bg-green-600'
                  }`}>
                    {isEnded
                      ? t('campaign.campaign_ended')
                      : daysLeft === 1
                        ? 'Ending today'
                        : daysLeft !== null
                          ? `${daysLeft} ${t('campaign.days_left')}`
                          : t('common.active')}
                  </span>
                </motion.div>
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
                    <p className="text-3xl font-black text-orange-600">
                      <CountUp value={Math.round(progress)} format={(n) => `${Math.round(n)}%`} />
                    </p>
                    <p className="text-xs text-gray-600 font-medium mt-1">{t('campaign.funded_label')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-orange-600">
                      <CountUp value={campaign.supporter_count || 0} />
                    </p>
                    <p className="text-xs text-gray-600 font-medium mt-1">{t('campaign.supporters_label')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-orange-600">
                      {isEnded ? '—' : daysLeft !== null ? daysLeft : '∞'}
                    </p>
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      {isEnded
                        ? t('campaign.campaign_ended')
                        : daysLeft === 1
                          ? 'Ending today'
                          : t('campaign.days_left_label')}
                    </p>
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
                      {campaign.media.filter((m) => m.type === 'image' && getTrustedCampaignMediaUrl(m.url)).map((item, i) => (
                        <div key={i} className="rounded-xl overflow-hidden aspect-square border border-orange-100">
                          <img src={getTrustedCampaignMediaUrl(item.url)!} alt={item.name || `Photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
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
                          const trustedDirectUrl = getTrustedCampaignMediaUrl(v.url);
                          const isDirect = trustedDirectUrl && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(trustedDirectUrl);
                          if (ytMatch || viMatch) {
                            const src = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : `https://player.vimeo.com/video/${viMatch![1]}`;
                            return (
                              <div key={i} className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                                <iframe src={src} title={v.name || `Campaign video ${i + 1}`} className="absolute inset-0 w-full h-full" referrerPolicy="no-referrer"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                              </div>
                            );
                          }
                          if (isDirect) {
                            return <video key={i} controls className="w-full rounded-xl border border-orange-200" src={trustedDirectUrl} />;
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
                        {getTrustedCampaignMediaUrl(related.image_url) ? (
                          <img
                            src={getTrustedCampaignMediaUrl(related.image_url)!}
                            alt={related.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
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

              {/* Goal reached — donations closed */}
              {!isEnded && goalReached && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                  <p className="font-bold text-green-700">🎉 Goal reached!</p>
                  <p className="text-sm text-green-600 mt-1">
                    This campaign is fully funded and no longer accepting donations.
                  </p>
                </div>
              )}

              {/* Donate Section */}
              {!isEnded && !goalReached && (
                <div>
                  {donateStep === 'idle' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDonateStep('amount')}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-4 rounded-xl hover:shadow-xl transition-all text-lg"
                    >
                      <Heart className="h-5 w-5" />
                      Donate Now
                    </motion.button>
                  )}

                  {donateStep === 'amount' && (
                    <div className="space-y-4 rounded-xl border border-orange-200 bg-white p-5">
                      <h3 className="font-bold text-gray-900 text-lg">Choose an amount</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {[100, 500, 1000, 5000].map((amt) => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => setDonateAmountStr(String(amt))}
                            className={`rounded-lg py-2 text-sm font-bold transition-all border ${
                              donateAmountStr === String(amt)
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            ₹{amt.toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Custom amount (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={donateAmountStr}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setDonateAmountStr(e.target.value)}
                          onBlur={() => {
                            const val = Math.max(1, parseInt(donateAmountStr) || 1);
                            setDonateAmountStr(String(val));
                          }}
                          className="w-full rounded-lg border border-orange-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className={`mt-1 text-xs ${(parseInt(donateAmountStr) || 0) > remaining ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {(parseInt(donateAmountStr) || 0) > remaining
                            ? `Only ₹${remaining.toLocaleString('en-IN')} left to reach the goal.`
                            : `₹${remaining.toLocaleString('en-IN')} left to reach the goal.`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Your name (optional)</label>
                        <input
                          type="text"
                          value={donateName}
                          onChange={(e) => setDonateName(e.target.value)}
                          placeholder="Anonymous"
                          className="w-full rounded-lg border border-orange-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email (for your receipt)</label>
                        <input
                          type="email"
                          value={donateEmail}
                          onChange={(e) => setDonateEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-lg border border-orange-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowPersuasion(false); setDonateStep('tip'); }}
                          disabled={
                            !donateAmountStr ||
                            (parseInt(donateAmountStr) || 0) < 1 ||
                            (parseInt(donateAmountStr) || 0) > remaining ||
                            !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(donateEmail.trim())
                          }
                          className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          onClick={resetDonate}
                          className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {donateStep === 'tip' && (
                    <div className="space-y-4 rounded-xl border border-orange-200 bg-white p-5">
                      <div className="text-center">
                        <Heart className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <h3 className="font-bold text-gray-900 text-lg">One more thing...</h3>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {getTipMessage(campaign?.category, campaign?.title || '')}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                        <p className="text-xs text-gray-500 mb-1">Suggested tip to Raise</p>
                        <p className="text-3xl font-black text-orange-600">₹300</p>
                      </div>
                      {showPersuasion && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
                          Just ₹300 — less than a cup of chai — keeps this platform running for thousands of campaigns. Every rupee counts.
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => { setTipAmount(300); setDonateStep('summary'); }}
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all"
                        >
                          Add ₹300 tip
                        </button>
                        {!showPersuasion ? (
                          <button
                            type="button"
                            onClick={() => setShowPersuasion(true)}
                            className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
                          >
                            No thanks
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setTipAmount(0); setDonateStep('summary'); }}
                            className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
                          >
                            Continue without tip
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {donateStep === 'summary' && (
                    <div className="space-y-4 rounded-xl border border-orange-200 bg-white p-5">
                      <h3 className="font-bold text-gray-900 text-lg">Payment Summary</h3>
                      <div className="space-y-2 bg-orange-50 rounded-xl p-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Donation to campaign</span>
                          <span className="font-semibold">₹{(parseInt(donateAmountStr) || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {tipAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tip to Raise</span>
                            <span className="font-semibold">₹{tipAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span className="text-orange-600">
                            ₹{((parseInt(donateAmountStr) || 0) + tipAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      {donateError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{donateError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handlePayment}
                          disabled={isProcessing}
                          className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
                        >
                          {isProcessing ? 'Processing...' : 'Complete Payment'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDonateStep('tip')}
                          className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                        >
                          Back
                        </button>
                      </div>
                      <p className="text-xs text-center text-gray-500">Payment processing via Razorpay coming soon.</p>
                    </div>
                  )}

                  {donateStep === 'success' && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                      <Heart className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-bold text-green-800 text-lg mb-1">
                        Thank you, {donateName.trim() || 'friend'}!
                      </p>
                      <p className="text-sm text-green-700 mb-1">
                        Your contribution of{' '}
                        <span className="font-bold">
                          ₹{((parseInt(donateAmountStr) || 0) + tipAmount).toLocaleString('en-IN')}
                        </span>{' '}
                        has been recorded.
                      </p>
                      <p className="text-xs text-green-600 mb-4">
                        Full payment integration is coming soon via Razorpay.
                      </p>
                      <button
                        onClick={resetDonate}
                        className="text-sm text-green-600 underline"
                      >
                        Donate again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Supporters */}
              {localDonors.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-3">Recent Supporters</h3>
                  <div className="space-y-2">
                    {(showAllDonors ? localDonors : localDonors.slice(0, 10)).map((donor, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs flex-shrink-0">
                            {donor.donor_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{donor.donor_name}</span>
                        </div>
                        <span className="text-xs font-bold text-orange-600 flex-shrink-0">
                          ₹{donor.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {localDonors.length > 10 && (
                    <button
                      onClick={() => setShowAllDonors((v) => !v)}
                      className="mt-2 text-xs text-orange-600 font-semibold underline"
                    >
                      {showAllDonors ? 'Show less' : `Show all ${localDonors.length} supporters`}
                    </button>
                  )}
                </div>
              )}

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
                      {isEnded
                        ? t('campaign.campaign_ended')
                        : daysLeft === 1
                          ? 'Ending today'
                          : daysLeft !== null
                            ? `${daysLeft} ${t('campaign.days_left')}`
                            : t('common.active')}
                    </p>
                    <p className="text-xs text-gray-600">{isEnded ? 'This campaign has closed' : 'Time to support'}</p>
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
