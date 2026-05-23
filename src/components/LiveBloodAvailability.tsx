import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { API_URL } from '../lib/api';

type BloodStatus = 'Critical' | 'Low' | 'Good';

interface BloodType {
  type: string;
  status: BloodStatus;
  units: number;
}

const LiveBloodAvailability: React.FC = () => {
  const [bloodData, setBloodData] = useState<BloodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusColor = (status: BloodStatus) => {
    switch (status) {
      case 'Critical': return 'bg-critical text-white border-critical';
      case 'Low': return 'bg-warning text-white border-warning';
      case 'Good': return 'bg-accent text-white border-accent';
    }
  };

  const fetchInventoryTotals = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch(`${API_URL}/bloodbanks/inventory/totals`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      const data = await response.json();
      setBloodData(data);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching inventory totals:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventoryTotals();

    // Set polling interval to exactly 5 minutes (300,000 milliseconds)
    const interval = setInterval(() => {
      fetchInventoryTotals(true);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }
  };

  return (
    <section className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Live blood availability</h2>
          <p className="text-lg text-text-secondary mb-2">Updated every 5 minutes across all partner blood banks</p>
          
          <div className="flex items-center justify-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface-variant px-3 py-1.5 rounded-full border border-border-color shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                <span>Last synced: {lastUpdated}</span>
              </div>
            )}
            {isRefreshing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <RefreshCw className="h-3.5 w-3.5 text-text-secondary" />
              </motion.div>
            )}
          </div>
        </div>

        {loading && bloodData.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">
            {Array.from({ length: 8 }).map((_, index) => (
              <div 
                key={index}
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-border-color bg-surface-variant shadow-sm animate-pulse h-[126px]"
              >
                <div className="h-8 w-12 bg-text-secondary/20 rounded mb-2"></div>
                <div className="h-3 w-16 bg-text-secondary/20 rounded mb-3"></div>
                <div className="h-4 w-20 bg-text-secondary/20 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-10"
          >
            <AnimatePresence mode="popLayout">
              {bloodData.map((blood) => (
                <motion.div 
                  key={blood.type}
                  layout
                  variants={item}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 ${getStatusColor(blood.status)} shadow-sm transition-shadow hover:shadow-md`}
                >
                  {blood.status === 'Critical' && (
                    <div className="absolute inset-0 rounded-xl border-2 border-critical animate-ping opacity-25"></div>
                  )}
                  <span className="text-3xl font-bold mb-2">{blood.type}</span>
                  <span className="text-xs uppercase tracking-wider font-semibold opacity-90 mb-1">{blood.status}</span>
                  
                  {/* Pulse count dynamically on live updates */}
                  <motion.span 
                    key={blood.units}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="text-sm font-medium"
                  >
                    {blood.units} units
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="text-center">
          <Link to="/find-blood" className="inline-flex items-center text-primary font-bold hover:underline group">
            View full map <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LiveBloodAvailability;
