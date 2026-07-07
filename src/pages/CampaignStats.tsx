import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Campaign, Donation } from '../types';
import { formatCurrency, formatDate, isCampaignEnded } from '../utils/format';
import { CountUp } from '../components/CountUp';
import { TrendingUp, Users, IndianRupee, Calendar, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions, TooltipItem } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const isAnonymous = (d: Donation) =>
  d.donor_name === 'Anonymous' || d.donor_email === 'anonymous@raise.app';

export const CampaignStats = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const handleWithdraw = async () => {
    if (!id) return;
    setWithdrawing(true);
    setWithdrawError('');
    const { data, error } = await supabase.functions.invoke('withdraw', { body: { campaign_id: id } });
    setWithdrawing(false);
    if (error || !data?.success) {
      if (data?.needs_payout_account) {
        navigate('/payouts');
        return;
      }
      setWithdrawError(data?.error || 'Withdrawal failed. Please try again.');
      return;
    }
    setConfirmWithdraw(false);
    fetchData();
  };

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns').select('*').eq('id', id).single();
      if (campaignError) throw campaignError;
      if (campaignData.creator_id !== user?.id) { navigate('/dashboard'); return; }

      const { data: donationsData, error: donationsError } = await supabase
        .from('donations').select('*').eq('campaign_id', id).order('created_at', { ascending: true });
      if (donationsError) throw donationsError;

      setCampaign(campaignData);
      setDonations(donationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-32 mb-6" />
          <Skeleton className="h-8 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('campaign.not_found')}</h2>
      </div>
    );
  }

  const totalDonors = donations.length;
  const averageDonation = totalDonors > 0
    ? donations.reduce((sum, d) => sum + Number(d.amount), 0) / totalDonors : 0;
  const daysSinceCreation = Math.max(1,
    Math.ceil((new Date().getTime() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24)));
  const donationRate = totalDonors / daysSinceCreation;
  const progress = Math.min(Math.round((Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100), 100);

  const donationsByDay = donations.reduce((acc, d) => {
    const date = new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    acc[date] = (acc[date] || 0) + Number(d.amount);
    return acc;
  }, {} as Record<string, number>);

  const chartConfig = {
    labels: Object.keys(donationsByDay).length > 0 ? Object.keys(donationsByDay) : ['No data'],
    datasets: [{
      label: 'Daily Donations (₹)',
      data: Object.values(donationsByDay).length > 0 ? Object.values(donationsByDay) : [0],
      borderColor: 'rgb(234, 88, 12)',
      backgroundColor: 'rgba(234, 88, 12, 0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgb(234, 88, 12)',
      pointRadius: 4,
    }],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => '₹' + Number(value).toLocaleString('en-IN'),
        },
      },
      x: { grid: { display: false } },
    },
  };

  const statCards = [
    {
      label: t('stats.total_raised'),
      count: Number(campaign.current_amount),
      countFormat: (n: number) => formatCurrency(n),
      sub: `of ${formatCurrency(Number(campaign.goal_amount))} ${t('campaign.goal_suffix')}`,
      icon: <IndianRupee className="h-5 w-5 text-orange-500" />,
      accent: true,
      showProgress: false,
    },
    {
      label: t('stats.progress'),
      count: progress,
      countFormat: (n: number) => `${Math.round(n)}%`,
      sub: null,
      icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
      accent: false,
      showProgress: true,
    },
    {
      label: t('stats.total_donors'),
      count: totalDonors,
      countFormat: undefined as ((n: number) => string) | undefined,
      sub: t('stats.supporters'),
      icon: <Users className="h-5 w-5 text-orange-500" />,
      accent: false,
      showProgress: false,
    },
    {
      label: t('stats.avg_donation'),
      count: averageDonation,
      countFormat: (n: number) => formatCurrency(n),
      sub: t('stats.per_supporter'),
      icon: <IndianRupee className="h-5 w-5 text-orange-500" />,
      accent: false,
      showProgress: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('stats.back')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('stats.title')}</h1>
          <p className="text-gray-600">{campaign.title}</p>
        </div>

        {/* Withdrawal */}
        {campaign.status === 'withdrawn' ? (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="font-bold text-green-700">✅ Funds withdrawn</p>
            <p className="text-sm text-green-600 mt-1">
              The raised amount has been paid out to your bank account.
            </p>
          </div>
        ) : campaign.status === 'refunded' ? (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="font-bold text-gray-700">↩️ Refunded to donors</p>
            <p className="text-sm text-gray-600 mt-1">
              This campaign wasn't withdrawn within the claim window, so donations were refunded.
            </p>
          </div>
        ) : campaign.status !== 'completed' ? (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="font-bold text-blue-700">Funding is still active</p>
            <p className="text-sm text-blue-600 mt-1">
              Funds become withdrawable after the campaign reaches its goal or the funding period ends.
            </p>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Available to withdraw</p>
                <p className="text-2xl font-black text-gray-900">
                  {formatCurrency(Number(campaign.current_amount))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All-or-nothing — withdrawing pays out the full amount and closes the campaign.
                </p>
                {campaign.status === 'completed' && campaign.claim_deadline && (
                  <p className="text-xs font-semibold text-amber-700 mt-2">
                    Funding closed. Withdraw by {formatDate(campaign.claim_deadline)} (30-day claim
                    window) — after that, donations are refunded to donors.
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {!confirmWithdraw ? (
                  <button
                    onClick={() => setConfirmWithdraw(true)}
                    disabled={Number(campaign.current_amount) <= 0}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Withdraw funds
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-5 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
                    >
                      {withdrawing ? 'Processing…' : 'Confirm withdrawal'}
                    </button>
                    <button
                      onClick={() => setConfirmWithdraw(false)}
                      className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            {withdrawError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {withdrawError}
              </p>
            )}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white p-6 rounded-2xl shadow-md border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">{card.label}</span>
                {card.icon}
              </div>
              <div className={`text-3xl font-bold mb-1 ${card.accent ? 'text-orange-600' : 'text-gray-900'}`}>
                <CountUp value={card.count} format={card.countFormat} />
              </div>
              {card.showProgress && (
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
              {card.sub && <div className="text-sm text-gray-500">{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* Chart + Campaign Info */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-orange-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('stats.timeline_title')}</h2>
            <div style={{ height: '300px' }}>
              <Line data={chartConfig} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('stats.campaign_info')}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-500 text-sm mb-1">
                  <Calendar className="h-4 w-4 mr-2 text-orange-400" />
                  <span>{t('stats.info_created')}</span>
                </div>
                <div className="font-semibold text-gray-900">{formatDate(campaign.created_at)}</div>
              </div>

              {campaign.end_date && (
                <div>
                  <div className="flex items-center text-gray-500 text-sm mb-1">
                    <Calendar className="h-4 w-4 mr-2 text-orange-400" />
                    <span>{t('stats.info_end_date')}</span>
                  </div>
                  <div className="font-semibold text-gray-900">{formatDate(campaign.end_date)}</div>
                </div>
              )}

              <div>
                <div className="text-gray-500 text-sm mb-1">{t('stats.info_status')}</div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  !isCampaignEnded(campaign) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {!isCampaignEnded(campaign) ? t('stats.status_active') : t('stats.status_completed')}
                </span>
              </div>

              <div>
                <div className="text-gray-500 text-sm mb-1">{t('stats.donation_rate')}</div>
                <div className="font-semibold text-gray-900">{donationRate.toFixed(2)} {t('stats.rate_suffix')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('stats.recent_donations')}</h2>
          {donations.length === 0 ? (
            <p className="text-gray-500">{t('stats.no_donations')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-orange-100">
                <thead>
                  <tr>
                    {[t('stats.col_donor'), t('stats.col_email'), t('stats.col_amount'), t('stats.col_date')].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {donations.slice(-20).reverse().map((donation) => (
                    <tr key={donation.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                            {donation.donor_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{donation.donor_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isAnonymous(donation) ? (
                          <span className="italic text-gray-400">—</span>
                        ) : (
                          donation.donor_email
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-orange-600">
                          {formatCurrency(Number(donation.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(donation.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
