import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Heart, Globe, ExternalLink, Share2, MessageCircle } from 'lucide-react';

const FOOTER_LINKS = {
  donors: [
    { name: 'Register as donor', path: '/register' },
    { name: 'Find blood', path: '/find-blood' },
    { name: 'Donor dashboard', path: '/dashboard/donor' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ],
  bloodBanks: [
    { name: 'Blood bank dashboard', path: '/dashboard/bloodbank' },
    { name: 'Community', path: '/community' },
    { name: 'Emergency request', path: '/emergency' },
  ],
  company: [
    { name: 'About us', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'Privacy policy', path: '/privacy' },
    { name: 'Contact us', path: '/contact' },
  ],
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-5 group">
              <Droplet className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" fill="#C0392B" />
              <span className="font-bold text-2xl tracking-tight text-text-primary">LiForce</span>
            </Link>
            <p className="text-text-secondary mb-6 leading-relaxed text-sm">
              Every drop counts. Connect. Donate. Save lives. Join India's fastest-growing blood donor network.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Globe className="h-4 w-4" />, href: 'https://liforce.in', label: 'Website' },
                { icon: <ExternalLink className="h-4 w-4" />, href: '/blog', label: 'Blog', internal: true },
                { icon: <MessageCircle className="h-4 w-4" />, href: '/contact', label: 'Contact', internal: true },
                { icon: <Share2 className="h-4 w-4" />, href: 'mailto:support@liforce.in', label: 'Share' },
              ].map((social, idx) =>
                social.internal ? (
                  <Link
                    key={idx}
                    to={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all hover:scale-110"
                  >
                    {social.icon}
                  </Link>
                ) : (
                  <a
                    key={idx}
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all hover:scale-110"
                  >
                    {social.icon}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Donors Column */}
          <div>
            <h4 className="font-bold text-text-primary mb-5">For donors</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.donors.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Blood Banks Column */}
          <div>
            <h4 className="font-bold text-text-primary mb-5">For blood banks</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.bloodBanks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-bold text-text-primary mb-5">Company</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-secondary text-sm">
            © 2026 LiForce · All rights reserved.
          </p>
          <p className="text-text-secondary text-sm flex items-center">
            Made with <Heart className="h-4 w-4 text-primary mx-1.5" fill="#C0392B" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
