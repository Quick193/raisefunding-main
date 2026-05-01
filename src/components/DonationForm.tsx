import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign } from 'lucide-react';

interface DonationFormProps {
  campaignId: string;
  onSuccess: () => void;
}

export const DonationForm = ({ campaignId, onSuccess }: DonationFormProps) => {
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: donationError } = await supabase.from('donations').insert({
        campaign_id: campaignId,
        donor_name: donorName,
        donor_email: donorEmail,
        amount: parseFloat(amount),
        message: message || null,
      });

      if (donationError) throw donationError;

      setDonorName('');
      setDonorEmail('');
      setAmount('');
      setMessage('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process donation');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100, 250];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Name
        </label>
        <input
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Email
        </label>
        <input
          type="email"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Donation Amount
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
            step="0.01"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => setAmount(quickAmount.toString())}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ${quickAmount}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message (Optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="Leave a message of support..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 text-white py-3 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Processing...' : 'Donate Now'}
      </button>
    </form>
  );
};