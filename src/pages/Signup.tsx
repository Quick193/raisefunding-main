import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Eye, EyeOff, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (phoneNumber.trim().length < 10) {
      setError('Phone number must be at least 10 digits');
      return false;
    }

    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName, phoneNumber);
      setVerificationSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative px-4 py-8">
      <div className="fixed inset-0 bg-white z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-12 w-full max-w-xl flex flex-col items-center border border-white/40 z-20"
      >
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 150 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-full mb-2"
        >
          <Wallet className="h-8 w-8 text-white" />
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-1"
        >
          Sign Up for Raise
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-gray-600 text-sm mb-6"
        >
          Create an account to get started
        </motion.p>

        {verificationSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center space-y-4"
          >
            <div className="bg-green-50 border border-green-200 text-green-700 p-5 rounded-xl">
              <p className="font-bold text-lg mb-1">Account created!</p>
              <p className="text-sm">We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
            >
              Go to Sign In
            </button>
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
            type="text"
            required
            placeholder="Full Name"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white/80 text-gray-800 backdrop-blur-lg transition-all duration-300"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <motion.input
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            whileFocus={{ scale: 1.02, boxShadow: '0 0 25px rgba(251, 146, 60, 0.3)' }}
            type="tel"
            required
            placeholder="Phone Number"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white/80 text-gray-800 backdrop-blur-lg transition-all duration-300"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <motion.input
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            whileFocus={{ scale: 1.02, boxShadow: '0 0 25px rgba(251, 146, 60, 0.3)' }}
            type="email"
            required
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white/80 text-gray-800 backdrop-blur-lg transition-all duration-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="relative w-full"
          >
            <motion.input
              whileFocus={{ scale: 1.02, boxShadow: '0 0 25px rgba(251, 146, 60, 0.3)' }}
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white/80 text-gray-800 backdrop-blur-lg pr-12 transition-all duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <motion.button
              whileHover={{ color: '#F97316' }}
              whileTap={{ scale: 0.9 }}
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-3 text-gray-500 hover:text-orange-500 transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <AnimatePresence mode="wait">
                {showPassword ? (
                  <motion.div
                    key="hide"
                    initial={{ opacity: 0, rotate: 180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EyeOff className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="show"
                    initial={{ opacity: 0, rotate: 180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Eye className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.4 }}
            className="relative w-full"
          >
            <motion.input
              whileFocus={{ scale: 1.02, boxShadow: '0 0 25px rgba(251, 146, 60, 0.3)' }}
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="Confirm Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white/80 text-gray-800 backdrop-blur-lg pr-12 transition-all duration-300"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <motion.button
              whileHover={{ color: '#F97316' }}
              whileTap={{ scale: 0.9 }}
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-3 text-gray-500 hover:text-orange-500 transition-colors"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              <AnimatePresence mode="wait">
                {showConfirmPassword ? (
                  <motion.div
                    key="hide"
                    initial={{ opacity: 0, rotate: 180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EyeOff className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="show"
                    initial={{ opacity: 0, rotate: 180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Eye className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="text-center text-sm mb-2"
          >
            <span>Already have an account?{' '}</span>
            <Link
              to="/login"
              className="text-orange-600 hover:underline font-semibold transition-colors hover:text-orange-700"
            >
              Sign in
            </Link>
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(251, 146, 60, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.span
                  key="signing-up"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Creating account...
                </motion.span>
              ) : (
                <motion.span
                  key="sign-up"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  Sign Up
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.form>
        )}
      </motion.div>
    </div>
  );
};
