import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Campaign } from '../types';
import { CampaignCard } from '../components/CampaignCard';
import { Plus, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

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
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Failed to delete campaign. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
    totalRaised: campaigns.reduce((sum, c) => sum + Number(c.current_amount), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Campaigns
              </h1>
              <p className="text-gray-600">
                Manage and track your crowdfunding campaigns
              </p>
            </div>
            <Link
              to="/create"
              className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>New Campaign</span>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Campaigns</span>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Active</span>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Completed</span>
              <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Raised</span>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats.totalRaised)}
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
              All ({campaigns.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-xl font-semibold ${
                filter === 'active'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-xl font-semibold ${
                filter === 'completed'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {filter === 'all'
                  ? "You haven't created any campaigns yet"
                  : `No ${filter} campaigns`}
              </p>
              {filter === 'all' && (
                <Link
                  to="/create"
                  className="inline-block bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 font-medium"
                >
                  Create Your First Campaign
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="relative flex flex-col">
                  <CampaignCard campaign={campaign} />
                  <div className="flex gap-2 mt-2">
                    <Link
                      to={`/dashboard/campaign/${campaign.id}`}
                      className="flex-1 text-center bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl text-sm font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
                    >
                      View Stats
                    </Link>
                    <button
                      onClick={() => navigate(`/campaign/${campaign.id}/edit`)}
                      className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id, campaign.title)}
                      disabled={deletingId === campaign.id}
                      className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === campaign.id ? '…' : 'Delete'}
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
