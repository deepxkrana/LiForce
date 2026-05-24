import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { API_URL } from '../lib/api';

const CTABanner: React.FC = () => {
  const token = localStorage.getItem('liforce_token');
  const role = localStorage.getItem('liforce_role');
  const isAuthenticated = !!token;

  const [stats, setStats] = useState({ donors: 48000, bloodbanks: 1200 });

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.donors && data.bloodbanks) {
          setStats({ donors: data.donors, bloodbanks: data.bloodbanks });
        }
      })
      .catch(err => console.error("Failed to fetch stats for CTA:", err));
  }, []);

  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary-dark opacity-50 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          Ready to save a life?
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-primary-light mb-10 max-w-2xl mx-auto opacity-90"
        >
          Join {stats.donors.toLocaleString()}+ donors and {stats.bloodbanks.toLocaleString()}+ banks making a difference across India
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          {!isAuthenticated ? (
            <>
              <Link to="/register" className="px-8 py-4 rounded-lg bg-white text-primary font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                Register as donor
              </Link>
              <Link to="/register-bloodbank" className="px-8 py-4 rounded-lg border-2 border-white text-white font-bold text-lg hover:bg-primary-dark transition-colors">
                List your blood bank
              </Link>
            </>
          ) : role === 'donor' ? (
            <Link to="/donate-blood" className="px-8 py-4 rounded-lg bg-white text-primary font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center">
              Donate blood
            </Link>
          ) : (
            <Link to="/organise-camp" className="px-8 py-4 rounded-lg bg-white text-primary font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center">
              Organise a blood camp
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
