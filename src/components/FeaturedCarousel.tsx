import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Campaign } from '../types';
import { formatCurrency, calculateProgress } from '../utils/format';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrustedCampaignMediaUrl } from '../utils/media';

interface FeaturedCarouselProps {
  campaigns: Campaign[];
}

export const FeaturedCarousel = ({ campaigns }: FeaturedCarouselProps) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const visibleCampaigns = campaigns.length > 0 ? campaigns : [];
  const itemsPerView = 3;

  const totalPages = Math.ceil(visibleCampaigns.length / itemsPerView);
  const maxIndex = Math.max(0, (totalPages - 1) * itemsPerView);

  useEffect(() => {
    if (!autoPlay || visibleCampaigns.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + itemsPerView));
    }, 7000);

    return () => clearInterval(timer);
  }, [autoPlay, maxIndex, visibleCampaigns.length]);

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - itemsPerView));
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + itemsPerView));
  };

  const visibleItems = visibleCampaigns.slice(
    currentIndex,
    currentIndex + itemsPerView
  );

  if (visibleCampaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('campaigns.no_results_empty')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {visibleItems.map((campaign) => {
          const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
          const daysLeft = campaign.end_date
            ? Math.ceil(
                (new Date(campaign.end_date.split('T')[0] + 'T23:59:59').getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;

          return (
            <Link
              key={campaign.id}
              to={`/campaign/${campaign.id}`}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                <div className="relative h-56 bg-gray-200 overflow-hidden">
                  {getTrustedCampaignMediaUrl(campaign.image_url) ? (
                    <img
                      src={getTrustedCampaignMediaUrl(campaign.image_url)!}
                      alt={campaign.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                      <span className="text-white text-5xl font-bold opacity-20">
                        {campaign.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {daysLeft !== null && (
                    <div className="absolute top-3 right-3 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {daysLeft > 0 ? t('campaigns.days_left', { count: daysLeft }) : t('campaigns.ended')}
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                    {campaign.profiles?.full_name?.split(' ')[0] || 'Creator'}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wider">
                    {campaign.category || 'Other'}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {campaign.title}
                  </h3>

                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(campaign.current_amount)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatCurrency(campaign.goal_amount)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                      <div
                        className="bg-orange-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">
                        {progress}% {t('campaigns.funded')}
                      </span>
                      <div className="flex items-center text-xs text-gray-600 font-medium">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{campaign.supporter_count ?? 0} {t('campaigns.supporters')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </motion.div>
      </AnimatePresence>

      {visibleCampaigns.length > itemsPerView && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 md:left-0 top-1/2 -translate-y-1/2 md:-translate-x-16 lg:-translate-x-20 bg-white text-orange-600 rounded-full p-3 shadow-lg hover:bg-orange-50 transition-all"
            aria-label="Previous featured campaign"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 md:translate-x-16 lg:translate-x-20 bg-white text-orange-600 rounded-full p-3 shadow-lg hover:bg-orange-50 transition-all"
            aria-label="Next featured campaign"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="flex gap-2 justify-center mt-6">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setAutoPlay(false);
              setCurrentIndex(idx * itemsPerView);
            }}
            className={`h-2 rounded-full transition-all ${
              idx === Math.floor(currentIndex / itemsPerView) ? 'bg-orange-600 w-6' : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
