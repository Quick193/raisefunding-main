import { Link } from 'react-router-dom';
import { Campaign } from '../types';
import { formatCurrency, calculateProgress } from '../utils/format';
import { Users, Zap } from 'lucide-react';
import { getTrustedCampaignMediaUrl } from '../utils/media';

interface CampaignCardGridProps {
  campaign: Campaign;
  index: number;
}

export const CampaignCardGrid = ({ campaign, index }: CampaignCardGridProps) => {
  const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
  const imageUrl = getTrustedCampaignMediaUrl(campaign.image_url);
  const daysLeft = campaign.end_date
    ? Math.ceil(
        (new Date(campaign.end_date + 'T00:00:00').getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Link
      to={`/campaign/${campaign.id}`}
      className="group animate-fade-in-up h-full"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col group-hover:bg-opacity-15 group-hover:border-opacity-40">
        <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-600 to-orange-400">
              <span className="text-white text-6xl font-black opacity-20">
                {campaign.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

          <div className="absolute top-3 right-3 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
            {daysLeft && daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
          </div>

          <div className="absolute top-3 left-3 bg-white bg-opacity-90 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
            {campaign.category || 'General'}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-orange-300 transition-colors">
              {campaign.title}
            </h3>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center text-xs text-orange-400">
              <Zap className="h-3 w-3 mr-1" />
              {campaign.profiles?.full_name?.split(' ')[0] || 'Creator'}
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-white">
              {formatCurrency(campaign.current_amount)}
            </span>
            <span className="text-xs text-gray-400">
              {formatCurrency(campaign.goal_amount)}
            </span>
          </div>

          <div className="w-full bg-gray-700 bg-opacity-50 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-medium">{progress}% funded</span>
            <div className="flex items-center text-xs text-gray-300 font-medium gap-1">
              <Users className="h-3 w-3" />
              <span>{campaign.supporter_count ?? 0} supporters</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
