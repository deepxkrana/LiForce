import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Medal } from 'lucide-react';
import { API_URL } from '../lib/api';

const LeaderboardPreview: React.FC = () => {
  const navigate = useNavigate();
  const [topDonors, setTopDonors] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/donors/leaderboard`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTopDonors(data.slice(0, 5)))
      .catch(() => setTopDonors([]));
  }, []);

  const fallback = [
    { id: '1', name: 'Rahul Sharma', city: 'Delhi', rewardPoints: 2400, _count: { donations: 12 } },
    { id: '2', name: 'Priya Patel', city: 'Mumbai', rewardPoints: 2100, _count: { donations: 10 } },
  ];

  const donors = topDonors.length ? topDonors : fallback;

  const getBadge = (points: number) => {
    if (points >= 5000) return 'Hero';
    if (points >= 3000) return 'Gold Donor';
    if (points >= 1500) return 'Silver Donor';
    if (points >= 500) return 'Bronze Donor';
    return 'Active Donor';
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Top donors this month</h2>
          <Link to="/leaderboard" className="flex items-center text-primary font-bold hover:underline">
            View full leaderboard <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          {donors.map((donor, index) => (
            <motion.div
              key={donor.id || index}
              role="button"
              tabIndex={0}
              onClick={() => donor.id && navigate(`/profile/${donor.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && donor.id && navigate(`/profile/${donor.id}`)}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`flex items-center p-4 sm:p-6 border-b border-border last:border-b-0 transition-colors cursor-pointer ${
                index === 0 ? 'bg-primary-light/50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 font-bold text-lg text-text-secondary flex justify-center shrink-0">
                {index === 0 ? <span className="w-3 h-3 rounded-full bg-yellow-400" title="Gold" /> :
                 index === 1 ? <span className="w-3 h-3 rounded-full bg-gray-400" title="Silver" /> :
                 index === 2 ? <span className="w-3 h-3 rounded-full bg-amber-600" title="Bronze" /> :
                 `#${index + 1}`}
              </div>

              <div className="mx-4 sm:mx-6 shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                  {donor.name?.substring(0, 2).toUpperCase()}
                </div>
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-text-primary truncate">{donor.name}</h4>
                  {index === 0 && <Medal className="h-5 w-5 text-yellow-500 shrink-0" />}
                </div>
                <div className="text-sm text-text-secondary truncate">{donor.city || 'India'}</div>
              </div>

              <div className="hidden sm:block mx-4 shrink-0">
                <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-semibold text-text-primary">
                  {getBadge(donor.rewardPoints || 0)}
                </span>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-primary">{donor._count?.donations || 0} donations</div>
                <div className="text-sm text-text-secondary">{donor.rewardPoints || 0} pts</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeaderboardPreview;
