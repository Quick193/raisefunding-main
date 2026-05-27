import { Link } from 'react-router-dom';
import { RaiseLogo } from './RaiseLogo';
import { Instagram, Twitter, Linkedin, Facebook, Mail, Shield } from 'lucide-react';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-gray-800">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="text-white mb-4">
              <RaiseLogo iconSize={30} textSize="text-2xl" useSvgIcon />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              A crowdfunding platform built for India — helping individuals and communities raise funds for causes that matter.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, label: 'Instagram', href: '#' },
                { icon: Twitter, label: 'Twitter / X', href: '#' },
                { icon: Linkedin, label: 'LinkedIn', href: '#' },
                { icon: Facebook, label: 'Facebook', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Browse Campaigns', to: '/campaigns' },
                { label: 'Start a Campaign', to: '/create' },
                { label: 'About Raise', to: '/about' },
                { label: 'Dashboard', to: '/dashboard' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-gray-400 hover:text-orange-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Help Centre', href: '#' },
                { label: 'Contact Us', href: 'mailto:support@raisefunding.in' },
                { label: 'How It Works', to: '/about' },
                { label: 'Report a Campaign', href: '#' },
              ].map(({ label, href, to }) => (
                <li key={label}>
                  {to ? (
                    <Link to={to} className="text-gray-400 hover:text-orange-400 transition-colors">
                      {label}
                    </Link>
                  ) : (
                    <a href={href} className="text-gray-400 hover:text-orange-400 transition-colors">
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3 text-sm mb-6">
              {[
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
                { label: 'Cookie Policy', to: '/privacy#cookies' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-gray-400 hover:text-orange-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Mail className="h-4 w-4 flex-shrink-0 mt-0.5 text-orange-600" />
              <span>support@raisefunding.in</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {year} Raise Technologies Pvt. Ltd. All rights reserved.</p>

          {/* Trust signals */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img
                src="https://supabase.com/favicon/favicon-32x32.png"
                alt="Supabase"
                className="h-3.5 w-3.5 rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span>Powered by Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
