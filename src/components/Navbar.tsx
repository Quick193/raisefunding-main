import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, LogOut, LayoutDashboard, Plus, ChevronDown, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
];

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const langRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userInitial =
    (user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    '?';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Wallet className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Raise</span>
          </Link>

          {/* Centre nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/campaigns"
              className="text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors"
            >
              Browse
            </Link>

            <Link
              to="/about"
              className="text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors"
            >
              About Us
            </Link>

            {/* Language dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center space-x-1.5 text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>{selectedLang.label}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {langOpen && (
                <div className="absolute top-full mt-2 left-0 w-40 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedLang.code === lang.code
                          ? 'bg-orange-50 text-orange-600 font-semibold'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/create"
                  className="flex items-center space-x-2 bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Campaign</span>
                </Link>

                {/* User menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-xs">{userInitial}</span>
                    </div>
                  </button>

                  <div className="absolute right-0 mt-0 w-48 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 px-4 py-3 text-sm font-medium transition-colors w-full"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-gray-700 hover:bg-red-50 hover:text-red-600 px-4 py-3 text-sm font-medium transition-colors w-full border-t border-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors hidden sm:block"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
