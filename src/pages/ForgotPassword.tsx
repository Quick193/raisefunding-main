import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative">
      <div className="fixed inset-0 bg-white z-0" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-xl mx-4 flex flex-col items-center border border-white/40 z-20"
      >
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 150 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-full mb-2"
        >
          <Brain className="h-8 w-8 text-white" />
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-1"
        >
          Reset Password
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-gray-600 text-sm mb-6 text-center"
        >
          Enter your email and we'll send you a link to reset your password.
        </motion.p>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-4"
          >
            <p className="font-semibold">Check your inbox!</p>
            <p className="text-sm mt-1">A password reset link has been sent to <strong>{email}</strong>.</p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-4"
          >
            <motion.input
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
              whileFocus={{ scale: 1.02, boxShadow: '0 0 25px rgba(251, 146, 60, 0.3)' }}
              type="email"
              required
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white/80 text-gray-800 backdrop-blur-lg transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-200"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(251, 146, 60, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </motion.form>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-4 text-sm text-center"
        >
          <Link to="/login" className="text-orange-600 hover:underline font-semibold transition-colors hover:text-orange-700">
            Back to Sign In
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};
