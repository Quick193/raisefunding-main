import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogOut, LayoutDashboard, Plus, ChevronDown, Globe, Menu, X } from 'lucide-react';
import { RaiseLogo } from './RaiseLogo';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
  const langRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('raise_lang', code);
    setLangOpen(false);
    setMobileOpen(false);
  };

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
    setMobileOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const userInitial =
    (user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    '?';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <Link to="/" onClick={closeMobileMenu} className="flex items-center min-w-0 text-gray-900 hover:text-orange-600 transition-colors">
            <RaiseLogo iconSize={32} textSize="text-2xl" />
          </Link>

          {/* Centre nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/campaigns"
              className="text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors"
            >
              {t('nav.browse')}
            </Link>

            <Link
              to="/about"
              className="text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors"
            >
              {t('nav.about')}
            </Link>

            {/* Language dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center space-x-1.5 text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>{currentLang.label}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {langOpen && (
                <div className="absolute top-full mt-2 left-0 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        currentLang.code === lang.code
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
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/create"
                  className="flex items-center space-x-2 bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('nav.create')}</span>
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
                      <span>{t('nav.dashboard')}</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-gray-700 hover:bg-red-50 hover:text-red-600 px-4 py-3 text-sm font-medium transition-colors w-full border-t border-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('nav.signout')}</span>
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
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <div className="flex flex-col gap-1">
              <Link
                to="/campaigns"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600"
              >
                {t('nav.browse')}
              </Link>
              <Link
                to="/about"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600"
              >
                {t('nav.about')}
              </Link>

              <div className="px-3 py-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Globe className="h-4 w-4 text-orange-600" />
                  {t('nav.language')}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => changeLanguage(lang.code)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        currentLang.code === lang.code
                          ? 'border-orange-300 bg-orange-50 text-orange-600 font-semibold'
                          : 'border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 border-t border-gray-100 pt-3">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/create"
                      onClick={closeMobileMenu}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4" />
                      {t('nav.create')}
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.signout')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={closeMobileMenu}
                      className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      {t('nav.signup')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
