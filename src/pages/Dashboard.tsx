import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Campaign } from '../types';
import { CampaignCard } from '../components/CampaignCard';
import { CountUp } from '../components/CountUp';
import { Plus, TrendingUp, Pencil, Trash2, Landmark } from 'lucide-react';
import { formatCurrency, isCampaignEnded } from '../utils/format';
import { useTranslation } from 'react-i18next';
import { Skeleton, CampaignGridSkeleton } from '../components/Skeleton';
import { ClaimFundsModal } from '../components/ClaimFundsModal';

export const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClaim, setShowClaim] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(t('dashboard.delete_confirm', { title }))) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert(t('dashboard.delete_failed'));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === 'all') return true;
    const effectiveStatus = isCampaignEnded(campaign) ? 'completed' : 'active';
    return effectiveStatus === filter;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => !isCampaignEnded(c)).length,
    completed: campaigns.filter((c) => isCampaignEnded(c)).length,
    totalRaised: campaigns.reduce((sum, c) => sum + Number(c.current_amount), 0),
  };

  // Ended campaigns that still hold funds the creator hasn't withdrawn.
  const claimable = campaigns.filter(
    (c) =>
      isCampaignEnded(c) &&
      !['withdrawn', 'refunded'].includes(c.status || '') &&
      Number(c.current_amount) > 0
  );

  // Prompt the creator to claim every time the dashboard loads (new session,
  // reload, or navigation back here) while any campaign has unclaimed funds.
  useEffect(() => {
    if (claimable.length > 0) setShowClaim(true);
  }, [claimable.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-56 mb-3" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <CampaignGridSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      {showClaim && claimable.length > 0 && (
        <ClaimFundsModal
          campaigns={claimable}
          onClose={() => setShowClaim(false)}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('dashboard.title')}
              </h1>
              <p className="text-gray-600">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/payouts"
                className="flex items-center justify-center space-x-2 bg-white text-orange-700 border border-orange-200 px-5 py-3 rounded-md hover:bg-orange-50 font-medium"
              >
                <Landmark className="h-5 w-5" />
                <span>Payout setup</span>
              </Link>
              <Link
                to="/create"
                className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>{t('dashboard.new_campaign')}</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">{t('dashboard.total_campaigns')}</span>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              <CountUp value={stats.total} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">{t('dashboard.active')}</span>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              <CountUp value={stats.active} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">{t('dashboard.completed')}</span>
              <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              <CountUp value={stats.completed} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">{t('dashboard.total_raised')}</span>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600">
              <CountUp value={stats.totalRaised} format={(n) => formatCurrency(n)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-semibold ${
                filter === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {`${t('dashboard.filter_all')} (${campaigns.length})`}
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-xl font-semibold ${
                filter === 'active'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {`${t('dashboard.filter_active')} (${stats.active})`}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-xl font-semibold ${
                filter === 'completed'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {`${t('dashboard.filter_completed')} (${stats.completed})`}
            </button>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {filter === 'all'
                  ? t('dashboard.no_campaigns')
                  : t('dashboard.no_filtered', { status: filter })}
              </p>
              {filter === 'all' && (
                <Link
                  to="/create"
                  className="inline-block bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 font-medium"
                >
                  {t('dashboard.create_first')}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="relative flex flex-col min-w-0">
                  <CampaignCard campaign={campaign} />
                  <div className="flex gap-2 mt-2">
                    <Link
                      to={`/dashboard/campaign/${campaign.id}`}
                      className="flex-1 min-w-0 text-center bg-orange-50 border border-orange-200 px-2 py-2 rounded-xl text-sm font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
                    >
                      {t('dashboard.view_stats')}
                    </Link>
                    <button
                      onClick={() => navigate(`/campaign/${campaign.id}/edit`)}
                      className="flex flex-1 min-w-0 items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 flex-shrink-0" />
                      {t('dashboard.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id, campaign.title)}
                      disabled={deletingId === campaign.id}
                      className="flex flex-1 min-w-0 items-center justify-center gap-1.5 bg-red-50 border border-red-200 px-2 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                      {deletingId === campaign.id ? '…' : t('dashboard.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
