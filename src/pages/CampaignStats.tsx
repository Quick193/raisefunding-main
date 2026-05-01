import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Campaign, Donation } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { TrendingUp, Users, IndianRupee, Calendar, ArrowLeft } from 'lucide-react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const isAnonymous = (d: Donation) =>
  d.donor_name === 'Anonymous' || d.donor_email === 'anonymous@raise.app';

export const CampaignStats = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900">Campaign not found</h2>
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
      label: 'Total Raised',
      value: formatCurrency(Number(campaign.current_amount)),
      sub: `of ${formatCurrency(Number(campaign.goal_amount))} goal`,
      icon: <IndianRupee className="h-5 w-5 text-orange-500" />,
      accent: true,
    },
    {
      label: 'Progress',
      value: `${progress}%`,
      sub: null,
      icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
      progress: true,
    },
    {
      label: 'Total Donors',
      value: String(totalDonors),
      sub: 'supporters',
      icon: <Users className="h-5 w-5 text-orange-500" />,
    },
    {
      label: 'Avg Donation',
      value: formatCurrency(averageDonation),
      sub: 'per supporter',
      icon: <IndianRupee className="h-5 w-5 text-orange-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Campaign Analytics</h1>
          <p className="text-gray-600">{campaign.title}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white p-6 rounded-2xl shadow-md border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">{card.label}</span>
                {card.icon}
              </div>
              <div className={`text-3xl font-bold mb-1 ${card.accent ? 'text-orange-600' : 'text-gray-900'}`}>
                {card.value}
              </div>
              {card.progress && (
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Donation Timeline</h2>
            <div style={{ height: '300px' }}>
              <Line data={chartConfig} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Info</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-500 text-sm mb-1">
                  <Calendar className="h-4 w-4 mr-2 text-orange-400" />
                  <span>Created</span>
                </div>
                <div className="font-semibold text-gray-900">{formatDate(campaign.created_at)}</div>
              </div>

              {campaign.end_date && (
                <div>
                  <div className="flex items-center text-gray-500 text-sm mb-1">
                    <Calendar className="h-4 w-4 mr-2 text-orange-400" />
                    <span>End Date</span>
                  </div>
                  <div className="font-semibold text-gray-900">{formatDate(campaign.end_date)}</div>
                </div>
              )}

              <div>
                <div className="text-gray-500 text-sm mb-1">Status</div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status === 'active' ? 'Active' : 'Completed'}
                </span>
              </div>

              <div>
                <div className="text-gray-500 text-sm mb-1">Donation Rate</div>
                <div className="font-semibold text-gray-900">{donationRate.toFixed(2)} donations/day</div>
              </div>
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Donations</h2>
          {donations.length === 0 ? (
            <p className="text-gray-500">No donations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-orange-100">
                <thead>
                  <tr>
                    {['Donor', 'Email', 'Amount', 'Date'].map((h) => (
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
