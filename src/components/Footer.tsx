import { Link } from 'react-router-dom';
import { RaiseLogo } from './RaiseLogo';
import { Mail, Phone, Shield } from 'lucide-react';
import { LEGAL } from '../config/legal';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-gray-950 text-gray-300">
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
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-orange-600" />
                <a href={`mailto:${LEGAL.email}`} className="hover:text-orange-400 transition-colors break-all">
                  {LEGAL.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-orange-600" />
                <a href={`tel:${LEGAL.phoneHref}`} className="hover:text-orange-400 transition-colors">
                  {LEGAL.phoneDisplay}
                </a>
              </div>
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
                { label: 'Pricing & Fees', to: '/pricing' },
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
                { label: 'Contact Us', to: '/contact' },
                { label: 'How It Works', to: '/about' },
                { label: 'Report a Campaign', href: `mailto:${LEGAL.email}?subject=Report%20a%20campaign` },
                { label: 'Request a Refund', href: `mailto:${LEGAL.email}?subject=Refund%20request` },
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

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
                { label: 'Refund & Cancellation', to: '/refunds' },
                { label: 'Shipping & Delivery', to: '/shipping' },
                { label: 'Cookie Policy', to: '/privacy#cookies' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-gray-400 hover:text-orange-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {year} {LEGAL.brand} — operated by {LEGAL.operatorName}. All rights reserved.</p>

          {/* Trust signals */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-orange-500" />
              <span>Payments by Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
