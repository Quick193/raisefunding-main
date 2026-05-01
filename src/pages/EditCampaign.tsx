import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Campaign } from '../types';
import { ImagePlus, Video } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { DatePicker } from '../components/DatePicker';

const CATEGORY_OPTIONS = [
  'Medical',
  'Education',
  'Social Impact',
  'Emergency',
  'Environment',
  'Animal Welfare',
  'Other',
];

export const EditCampaign = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    category: CATEGORY_OPTIONS[0],
    location: '',
    imageUrl: '',
    videoUrl: '',
    endDate: '',
    status: 'active' as 'active' | 'completed',
  });

  const fetchCampaign = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.creator_id !== user?.id) {
        navigate('/dashboard');
        return;
      }

      setCampaign(data);
      setFormData({
        title: data.title,
        description: data.description,
        goalAmount: data.goal_amount.toString(),
        category: data.category || CATEGORY_OPTIONS[0],
        location: data.location || '',
        imageUrl: data.image_url || '',
        videoUrl: data.video_url || '',
        endDate: data.end_date ? data.end_date.split('T')[0] : '',
        status: data.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign');
    } finally {
      setFetchLoading(false);
    }
  }, [id, navigate, user?.id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = (): string | null => {
    if (formData.title.trim().length < 10) return 'Title must be at least 10 characters.';
    if (formData.title.trim().length > 100) return 'Title must be 100 characters or fewer.';
    if (formData.description.trim().length < 50) return 'Description must be at least 50 characters.';
    if (formData.description.trim().length > 5000) return 'Description must be 5,000 characters or fewer.';
    const goal = parseFloat(formData.goalAmount);
    if (isNaN(goal) || goal < 100) return 'Funding goal must be at least ₹100.';
    if (goal > 100_000_000) return 'Funding goal cannot exceed ₹10 crore.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          goal_amount: parseFloat(formData.goalAmount),
          category: formData.category,
          location: formData.location.trim() || null,
          image_url: formData.imageUrl || null,
          video_url: formData.videoUrl.trim() || null,
          end_date: formData.endDate || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      navigate(`/campaign/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to update campaign';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCampaign = async () => {
    if (!confirm('Are you sure you want to end this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      navigate(`/campaign/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end campaign');
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Campaign
          </h1>
          <p className="text-gray-600">
            Update your campaign details
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <CustomSelect
                value={formData.category}
                onChange={(val) => setFormData((p) => ({ ...p, category: val }))}
                options={CATEGORY_OPTIONS}
                buttonClassName="py-2"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location (Optional)
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="City, State"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Goal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <input
                    id="goalAmount"
                    name="goalAmount"
                    type="number"
                    value={formData.goalAmount}
                    onChange={handleChange}
                    required
                    min="100"
                    step="1"
                    className="w-full pl-8 pr-4 py-2 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <DatePicker
                  value={formData.endDate}
                  onChange={(val) => setFormData((p) => ({ ...p, endDate: val }))}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="Pick an end date"
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Image URL (Optional)
              </label>
              <div className="flex items-center space-x-3">
                <ImagePlus className="h-5 w-5 text-gray-400" />
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (Optional — YouTube or Vimeo)
              </label>
              <div className="flex items-center space-x-3">
                <Video className="h-5 w-5 text-gray-400" />
                <input
                  id="videoUrl" name="videoUrl" type="url"
                  value={formData.videoUrl} onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Status
              </label>
              <CustomSelect
                value={formData.status === 'active' ? 'Active' : 'Completed'}
                onChange={(val) => setFormData((p) => ({ ...p, status: val === 'Active' ? 'active' : 'completed' }))}
                options={['Active', 'Completed']}
                buttonClassName="py-2"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/campaign/${id}`)}
                className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-md hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              {campaign.status === 'active' && (
                <button
                  type="button"
                  onClick={handleEndCampaign}
                  className="flex-1 bg-red-600 text-white py-3 rounded-md hover:bg-red-700 font-medium"
                >
                  End Campaign
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 text-white py-3 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
