import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COOKIE_KEY = 'raise_cookie_consent';

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if the user hasn't made a choice yet
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      // Slight delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/50 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Cookie className="h-5 w-5 text-orange-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 mb-1">We use cookies</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Raise uses essential cookies to keep you signed in and remember your preferences. We don't sell your data.{' '}
                <Link to="/privacy#cookies" className="text-orange-600 underline hover:text-orange-700">
                  Learn more
                </Link>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={decline}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:shadow-lg transition-all"
              >
                Accept all
              </button>
            </div>

            <button
              onClick={decline}
              aria-label="Close cookie banner"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 sm:static"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
