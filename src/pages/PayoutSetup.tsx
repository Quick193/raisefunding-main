import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Landmark, CheckCircle, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

// Lets a campaign creator onboard a Razorpay Route linked account by submitting
// their bank details. Once linked, donations to their campaigns are split and
// transferred to them automatically.
export const PayoutSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [linkedAccountId, setLinkedAccountId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    beneficiary_name: '',
    account_number: '',
    ifsc: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, razorpay_account_id')
        .eq('id', user.id)
        .single();
      if (data) {
        setLinkedAccountId(data.razorpay_account_id ?? null);
        setForm((f) => ({
          ...f,
          name: data.full_name || '',
          email: data.email || '',
          beneficiary_name: data.full_name || '',
        }));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.beneficiary_name || !form.account_number || !form.ifsc) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    const { data, error: fnError } = await supabase.functions.invoke('razorpay-linked-account', {
      body: {
        name: form.name,
        email: form.email,
        beneficiary_name: form.beneficiary_name,
        account_number: form.account_number,
        ifsc: form.ifsc,
      },
    });
    setSubmitting(false);

    if (fnError || !data?.razorpay_account_id) {
      setError(data?.error || 'Could not set up payouts. Please check your details and try again.');
      return;
    }
    setLinkedAccountId(data.razorpay_account_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to dashboard
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Landmark className="h-7 w-7 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Payout setup</h1>
        </div>

        {linkedAccountId ? (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 text-green-700 mb-3">
              <CheckCircle className="h-6 w-6" />
              <h2 className="text-lg font-bold">Payouts are set up</h2>
            </div>
            <p className="text-gray-600">
              Donations to your campaigns are split automatically and settled to your linked bank
              account.
            </p>
            <p className="mt-4 text-xs text-gray-400 break-all">Linked account: {linkedAccountId}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-5">
            <p className="text-gray-600 text-sm">
              Add the bank account where you'd like to receive donations. We use Razorpay to settle
              funds securely — we never see or store your full bank credentials.
            </p>

            {([
              ['Account holder / business name', 'name', 'text', 'Jane Doe'],
              ['Email', 'email', 'email', 'jane@example.com'],
              ['Beneficiary name (as per bank)', 'beneficiary_name', 'text', 'Jane Doe'],
              ['Bank account number', 'account_number', 'text', '0001020304050607'],
              ['IFSC code', 'ifsc', 'text', 'HDFC0000001'],
            ] as const).map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-orange-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ))}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
            >
              {submitting ? 'Setting up…' : 'Set up payouts'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
