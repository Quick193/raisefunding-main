import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { ImagePlus, Video, Upload, X, Plus, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect } from '../components/CustomSelect';
import { DatePicker } from '../components/DatePicker';
import { FeatureModal } from '../components/FeatureModal';
import { MediaItem } from '../types';
import { useTranslation } from 'react-i18next';
import { getTrustedCampaignMediaUrl, isAllowedCampaignVideoUrl } from '../utils/media';

const CATEGORY_OPTIONS = [
  'Medical', 'Education', 'Social Impact', 'Emergency',
  'Environment', 'Animal Welfare', 'Other',
];

export const CreateCampaign = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wantFeature, setWantFeature] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<{ id: string; title: string } | null>(null);

  // Cover image
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Additional media (photos + videos)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    category: CATEGORY_OPTIONS[0],
    location: '',
    imageUrl: '',
    videoUrl: '',
    endDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadFile = async (file: File, folder: string) => {
    if (!user) throw new Error('You must be signed in to upload media.');
    const ext = file.name.split('.').pop();
    const path = `campaigns/${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('campaign-media')
      .upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    return supabase.storage.from('campaign-media').getPublicUrl(path).data.publicUrl;
  };

  const handleCoverImage = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError(t('create.error_image_type')); return; }
    if (file.size > 5 * 1024 * 1024) { setError(t('create.error_image_size')); return; }
    setImageUploading(true);
    setError('');
    try {
      const url = await uploadFile(file, 'covers');
      setFormData((p) => ({ ...p, imageUrl: url }));
      setImagePreview(url);
    } catch {
      setError(t('create.error_image_upload'));
    } finally {
      setImageUploading(false);
    }
  };

  const handleMediaFiles = async (files: FileList) => {
    setMediaUploading(true);
    setError('');
    const added: MediaItem[] = [];
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) continue;
      if (file.size > 100 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 100 MB — skipped.`);
        continue;
      }
      try {
        const folder = isImage ? 'gallery' : 'videos';
        const url = await uploadFile(file, folder);
        added.push({ type: isImage ? 'image' : 'video', url, name: file.name });
      } catch {
        setError(`Failed to upload "${file.name}".`);
      }
    }
    setMediaItems((prev) => [...prev, ...added]);
    setMediaUploading(false);
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): string | null => {
    if (formData.title.trim().length < 10) return t('create.error_title_min');
    if (formData.title.trim().length > 100) return t('create.error_title_max');
    if (formData.description.trim().length < 50) return t('create.error_desc_min');
    if (formData.description.trim().length > 5000) return t('create.error_desc_max');
    const goal = parseFloat(formData.goalAmount);
    if (isNaN(goal) || goal < 100) return t('create.error_goal_min');
    if (goal > 100_000_000) return t('create.error_goal_max');
    if (!formData.endDate) return 'Please select an end date for your campaign.';
    if (formData.imageUrl && !getTrustedCampaignMediaUrl(formData.imageUrl)) {
      return 'Use an uploaded campaign image or a trusted campaign media URL.';
    }
    if (formData.videoUrl && !isAllowedCampaignVideoUrl(formData.videoUrl)) {
      return 'Use an uploaded campaign video, YouTube, or Vimeo URL.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      if (!user) throw new Error('You must be logged in to create a campaign');

      // Belt-and-suspenders: ensure profile exists before FK insert
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        phone_number: user.user_metadata?.phone_number || '',
      }, { onConflict: 'id', ignoreDuplicates: true });

      const { data, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          creator_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          goal_amount: parseFloat(formData.goalAmount),
          category: formData.category,
          location: formData.location.trim() || null,
          image_url: getTrustedCampaignMediaUrl(formData.imageUrl) || null,
          video_url: formData.videoUrl.trim() || null,
          media: mediaItems,
          end_date: formData.endDate,
          status: 'active',
        })
        .select()
        .single();
      if (campaignError) throw campaignError;
      if (wantFeature) {
        setCreatedCampaign({ id: data.id, title: data.title });
      } else {
        navigate(`/campaign/${data.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to create campaign';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{t('create.title')}</h1>
          <p className="text-gray-600">{t('create.subtitle')}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">{error}</div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('create.title_label')} <span className="text-red-500">*</span></label>
              <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} required
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                placeholder={t('create.title_placeholder')} />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('create.description_label')} <span className="text-red-500">*</span></label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={7}
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all resize-none"
                placeholder={t('create.description_placeholder')} />
              <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length} / 5000</p>
            </div>

            {/* Category + Location */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('create.category_label')} <span className="text-red-500">*</span></label>
                <CustomSelect value={formData.category}
                  onChange={(val) => setFormData((p) => ({ ...p, category: val }))}
                  options={CATEGORY_OPTIONS} />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('create.location_label')} <span className="text-gray-400 font-normal">{t('create.location_optional')}</span>
                </label>
                <input id="location" name="location" type="text" value={formData.location} onChange={handleChange}
                  className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                  placeholder={t('create.location_placeholder')} />
              </div>
            </div>

            {/* Goal + End Date */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="goalAmount" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('create.goal_label')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input id="goalAmount" name="goalAmount" type="number" value={formData.goalAmount} onChange={handleChange}
                    required min="100" step="1"
                    className="w-full pl-8 pr-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                    placeholder="10000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('create.end_date_label')} <span className="text-red-500">*</span>
                </label>
                <DatePicker value={formData.endDate}
                  onChange={(val) => setFormData((p) => ({ ...p, endDate: val }))}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="Pick an end date" />
              </div>
            </div>

            {/* ── Cover Image ───────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('create.cover_label')} <span className="text-gray-400 font-normal">{t('create.cover_optional')}</span>
              </label>
              {(imagePreview || getTrustedCampaignMediaUrl(formData.imageUrl)) && (
                <div className="relative mb-3 rounded-xl overflow-hidden h-48 border border-orange-200">
                  <img src={imagePreview || getTrustedCampaignMediaUrl(formData.imageUrl)!} alt="Cover preview" className="w-full h-full object-cover" referrerPolicy="no-referrer"
                    onError={() => setImagePreview('')} />
                  <button type="button"
                    onClick={() => { setFormData((p) => ({ ...p, imageUrl: '' })); setImagePreview(''); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverImage(f); }} />
              <div className="flex gap-3">
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={imageUploading}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 transition-all text-sm font-medium disabled:opacity-50">
                  {imageUploading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full" />
                    : <Upload className="h-4 w-4" />}
                  {imageUploading ? t('common.uploading') : t('create.cover_upload_btn')}
                </button>
                <div className="relative flex-1">
                  <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input name="imageUrl" type="url" value={formData.imageUrl} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm transition-all"
                    placeholder={t('create.cover_url_placeholder')}
                    onBlur={(e) => { if (e.target.value) setImagePreview(e.target.value); }} />
                </div>
              </div>
            </div>

            {/* ── Additional Photos & Videos ────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('create.media_label')} <span className="text-gray-400 font-normal">{t('create.media_optional')}</span>
              </label>

              {/* Thumbnails grid */}
              {mediaItems.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                  {mediaItems.map((item, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-orange-200 bg-gray-100 aspect-square">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                          <Video className="h-6 w-6 text-orange-400" />
                          <span className="text-xs text-gray-500 text-center truncate w-full px-1">{item.name}</span>
                        </div>
                      )}
                      <button type="button" onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  <button type="button" onClick={() => mediaInputRef.current?.click()} disabled={mediaUploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-orange-300 flex flex-col items-center justify-center gap-1 text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-50">
                    {mediaUploading
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full" />
                      : <Plus className="h-5 w-5" />}
                    <span className="text-xs font-medium">{mediaUploading ? '…' : 'Add'}</span>
                  </button>
                </div>
              )}

              {mediaItems.length === 0 && (
                <button type="button" onClick={() => mediaInputRef.current?.click()} disabled={mediaUploading}
                  className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-orange-200 rounded-xl hover:bg-orange-50 transition-all disabled:opacity-50">
                  {mediaUploading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                    : <Upload className="h-6 w-6 text-orange-400" />}
                  <span className="text-sm text-gray-500">
                    {mediaUploading ? t('create.media_uploading') : t('create.media_upload_btn')}
                  </span>
                  <span className="text-xs text-gray-400">{t('create.media_upload_info')}</span>
                </button>
              )}

              <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
                onChange={(e) => { if (e.target.files?.length) handleMediaFiles(e.target.files); e.target.value = ''; }} />

              {/* Video URL fallback */}
              <div className="relative mt-3">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input name="videoUrl" type="url" value={formData.videoUrl}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm transition-all"
                  placeholder={t('create.video_url_placeholder')} />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                Requires Supabase Storage — run <code className="bg-gray-100 px-1 rounded">supabase/storage_setup.sql</code> once.
              </p>
            </div>

            {/* ── Feature Campaign ──────────────────────────────────── */}
            <div
              onClick={() => setWantFeature((v) => !v)}
              className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                wantFeature
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  wantFeature ? 'bg-orange-500' : 'bg-gray-100'
                }`}>
                  <Star className={`h-5 w-5 ${wantFeature ? 'fill-white text-white' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{t('create.feature_label')}</h3>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      wantFeature ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}>
                      {wantFeature && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('create.feature_description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => navigate('/dashboard')}
                className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 font-semibold transition-all">
                {t('create.cancel_btn')}
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 rounded-xl hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg">
                {loading ? t('create.submitting') : t('create.submit_btn')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>

    <AnimatePresence>
      {createdCampaign && (
        <FeatureModal
          campaignId={createdCampaign.id}
          campaignTitle={createdCampaign.title}
          onClose={() => navigate(`/campaign/${createdCampaign.id}`)}
          onSuccess={() => navigate(`/campaign/${createdCampaign.id}`)}
        />
      )}
    </AnimatePresence>
    </>
  );
};
