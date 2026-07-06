import { useNavigate } from 'react-router-dom';
import { X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Campaign } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface Props {
  campaigns: Campaign[];
  onClose: () => void;
}

// Deadline by which the creator must withdraw before donations are refunded.
const claimDeadline = (c: Campaign): string | null => {
  if (c.claim_deadline) return c.claim_deadline;
  if (!c.end_date) return null;
  const end = new Date(c.end_date.split('T')[0] + 'T23:59:59').getTime();
  return new Date(end + 30 * 24 * 60 * 60 * 1000).toISOString();
};

// Prompts a campaign creator to withdraw funds from campaigns that have ended.
export const ClaimFundsModal = ({ campaigns, onClose }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg rounded-2xl border border-white/50 bg-white/60 backdrop-blur-2xl shadow-2xl p-6"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-shrink-0 w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
            <img
              src="/favicon.png"
              alt="Raise"
              className="h-6 w-6 object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Claim your funds</h2>
            <p className="text-sm text-gray-600">
              {campaigns.length === 1
                ? 'A campaign has ended and has funds waiting for you.'
                : `${campaigns.length} campaigns have ended with funds waiting for you.`}
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {campaigns.map((c) => {
            const deadline = claimDeadline(c);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/50 bg-white/50 p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.title}</p>
                  <p className="text-lg font-black text-orange-600">
                    {formatCurrency(c.current_amount)}
                  </p>
                  {deadline && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <Clock className="h-3.5 w-3.5" />
                      Withdraw by {formatDate(deadline)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/dashboard/campaign/${c.id}`);
                  }}
                  className="shrink-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-lg transition-all"
                >
                  Claim
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-xs text-gray-500 text-center">
          You have 30 days from a campaign ending to withdraw. After that, donations are
          automatically refunded to your donors.
        </p>

        <button
          onClick={onClose}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Remind me later
        </button>
      </motion.div>
    </div>
  );
};
