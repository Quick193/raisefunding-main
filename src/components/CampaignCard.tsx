import { Link } from 'react-router-dom';
import { Campaign } from '../types';
import { formatCurrency, calculateProgress, isCampaignEnded } from '../utils/format';
import { Calendar, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CampaignCardProps {
  campaign: Campaign;
}

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const { t } = useTranslation();
  const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);

  return (
    <Link
      to={`/campaign/${campaign.id}`}
      className="block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-orange-100"
    >
      <div className="h-48 bg-gray-200 overflow-hidden">
        {campaign.image_url ? (
          <img
            src={campaign.image_url}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
            <span className="text-white text-4xl font-bold opacity-60">
              {campaign.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              !isCampaignEnded(campaign)
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {!isCampaignEnded(campaign) ? t('common.active') : t('common.completed')}
          </span>
          {campaign.profiles && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-3 w-3 mr-1" />
              <span>{campaign.profiles.full_name}</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {campaign.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {campaign.description}
        </p>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(campaign.current_amount)}
            </span>
            <span className="text-sm text-gray-600">
              {formatCurrency(campaign.goal_amount)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1">{progress}% {t('campaigns.funded')}</div>
        </div>

        {campaign.end_date && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </Link>
  );
};
