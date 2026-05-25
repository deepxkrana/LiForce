import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Heart } from 'lucide-react';

const FOOTER_LINKS = {
  company: [
    { name: 'About us', path: '/about' },
    { name: 'Rewards', path: '/rewards' },
    { name: 'Privacy policy', path: '/privacy' },
    { name: 'Contact us', path: '/contact' },
  ],
};

const Footer: React.FC = () => {
  const userRole = localStorage.getItem('liforce_role');
  const isLoggedIn = !!localStorage.getItem('liforce_userId');

  const donorsLinks = [
    { name: 'Register as donor', path: '/register', hideIfLogged: true },
    { name: 'Find blood', path: '/find-blood' },
    { name: 'Donor dashboard', path: '/dashboard/donor' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Community', path: '/community' },
  ];

  const bloodBanksLinks = [
    { name: 'Blood bank dashboard', path: '/dashboard/bloodbank' },
    { name: 'Community', path: '/community' },
    { name: 'Organise Camp', path: '/community?tab=Camps' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row flex-wrap justify-between gap-10 lg:gap-12 mb-16">

          {/* Brand Column */}
          <div className="w-full md:w-1/3 lg:max-w-xs">
            <Link to="/" className="flex items-center space-x-2 mb-5 group">
              <Droplet className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" fill="#C0392B" />
              <span className="font-bold text-2xl tracking-tight text-text-primary">LiForce</span>
            </Link>
            <p className="text-text-secondary mb-6 leading-relaxed text-sm">
              Every drop counts. Connect. Donate. Save lives. Join India's fastest-growing blood donor network.
            </p>
          </div>

          {/* Donors Column */}
          {userRole !== 'bloodbank' && (
            <div>
              <h4 className="font-bold text-text-primary mb-5">Donor</h4>
              <ul className="space-y-3">
                {donorsLinks
                  .filter((link) => !(link.hideIfLogged && isLoggedIn))
                  .map((link) => (
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
          )}

          {/* Blood Banks Column */}
          {userRole !== 'donor' && (
            <div>
              <h4 className="font-bold text-text-primary mb-5">Blood Bank</h4>
              <ul className="space-y-3">
                {bloodBanksLinks.map((link) => (
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
          )}

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

          {/* Social Media Column */}
          <div>
            <h4 className="font-bold text-text-primary mb-5">Our Social Media</h4>
            <ul className="space-y-3">
              {[
                { 
                  icon: (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  ), 
                  href: 'https://instagram.com/liforce', 
                  label: 'Instagram' 
                },
                { 
                  icon: (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                  ), 
                  href: 'https://youtube.com/@liforce', 
                  label: 'Youtube' 
                },
                { 
                  icon: (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                  ), 
                  href: 'https://x.com/liforce', 
                  label: 'X.com' 
                },
                { 
                  icon: (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <ellipse cx="12" cy="12" rx="6" ry="4"></ellipse>
                      <circle cx="9.5" cy="11" r="1"></circle>
                      <circle cx="14.5" cy="11" r="1"></circle>
                      <path d="M9 14s1 1 3 1 3-1 3-1"></path>
                    </svg>
                  ), 
                  href: 'https://reddit.com/r/liforce', 
                  label: 'Reddit' 
                },
              ].map((social, idx) => (
                <li key={idx}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-text-secondary hover:text-primary transition-colors text-sm group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-all">
                      {social.icon}
                    </span>
                    {social.label}
                  </a>
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
