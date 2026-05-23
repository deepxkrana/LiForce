import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplet, Menu, X, AlertCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { name: 'Find Blood', path: '/find-blood' },
  { name: 'Emergency', path: '/emergency', urgent: true },
  { name: 'Leaderboard', path: '/leaderboard' },
  { name: 'Community', path: '/community' },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setRegisterOpen(false);
  }, [location.pathname]);

  const token = localStorage.getItem('liforce_token');
  const userRole = localStorage.getItem('liforce_role');
  const isAuthenticated = !!token;
  const dashboardPath = userRole === 'bloodbank' ? '/dashboard/bloodbank' : '/dashboard/donor';

  const handleLogout = () => {
    localStorage.removeItem('liforce_token');
    localStorage.removeItem('liforce_role');
    window.location.href = '/';
  };

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname.startsWith('/dashboard');
  const showSolidBg = isScrolled || isDashboard;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showSolidBg
          ? 'bg-surface/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Droplet
              className="h-8 w-8 text-primary transition-transform group-hover:scale-110"
              fill="#C0392B"
            />
            <span className="font-bold text-2xl tracking-tight text-text-primary">LiForce</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  link.urgent
                    ? 'text-critical bg-[#FADBD8] hover:bg-critical hover:text-white border border-[#F5B7B1]'
                    : isActive(link.path)
                    ? 'text-primary font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.urgent && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-critical"></span>
                  </span>
                )}
                {link.urgent && <AlertCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                {link.name}
                {isActive(link.path) && !link.urgent && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  className="flex items-center px-4 py-2 rounded-lg border border-border font-medium hover:bg-gray-50 transition-colors text-sm text-text-primary"
                >
                  <User className="w-4 h-4 mr-1.5" /> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg font-medium text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors border border-transparent"
                >
                  Login
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRegisterOpen(!registerOpen)}
                    className="px-5 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors text-sm shadow-sm flex items-center"
                    aria-expanded={registerOpen}
                  >
                    Register <span className="ml-1 text-[10px]">▼</span>
                  </button>
                  {registerOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setRegisterOpen(false)} aria-hidden />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50">
                        <Link to="/register" className="block px-4 py-3 text-sm font-medium text-text-primary hover:bg-gray-50 border-b border-border">
                          Register as Donor
                        </Link>
                        <Link to="/register-bloodbank" className="block px-4 py-3 text-sm font-medium text-text-primary hover:bg-gray-50">
                          Register as Blood Bank
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-text-primary hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed inset-y-0 right-0 w-72 bg-surface shadow-2xl z-50 p-6 md:hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <Link to="/" className="flex items-center space-x-2">
                  <Droplet className="h-7 w-7 text-primary" fill="#C0392B" />
                  <span className="font-bold text-xl text-text-primary">LiForce</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-text-primary" />
                </button>
              </div>

              <nav className="flex flex-col space-y-1 flex-grow">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                      link.urgent
                        ? 'text-critical bg-[#FADBD8] border border-[#F5B7B1]'
                        : isActive(link.path)
                        ? 'bg-primary-light text-primary-dark font-bold border border-[#F5B7B1]'
                        : 'text-text-primary hover:bg-gray-50'
                    }`}
                  >
                    {link.urgent && <AlertCircle className="w-4 h-4 mr-2" />}
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col space-y-3 mt-6 pt-6 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={dashboardPath}
                      className="w-full text-center py-3 rounded-xl border border-border font-medium text-text-primary hover:bg-gray-50"
                    >
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-center py-3 rounded-xl bg-gray-100 text-text-secondary font-bold hover:bg-gray-200 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full text-center py-3 rounded-xl border border-border font-medium text-text-primary hover:bg-gray-50"
                    >
                      Login
                    </Link>
                    <div className="flex gap-2">
                      <Link
                        to="/register"
                        className="flex-1 text-center py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors text-sm"
                      >
                        Donor
                      </Link>
                      <Link
                        to="/register-bloodbank"
                        className="flex-1 text-center py-3 rounded-xl bg-accent text-white font-bold hover:bg-emerald-600 transition-colors text-sm"
                      >
                        Bank
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
