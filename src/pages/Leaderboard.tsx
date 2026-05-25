import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, MapPin, Info, Star } from 'lucide-react';
import { API_URL } from '../lib/api';

// Keep constants for points guide and camps
const POINTS_GUIDE = [
  { action: 'Successful Donation', points: 100 },
  { action: 'Emergency Response', points: 100 },
  { action: 'Profile Completion', points: 50 },
  { action: 'Camp Attendance', points: 50 },
];

// Removed hardcoded UPCOMING_CAMPS

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('This month');
  const [leaderboardType, setLeaderboardType] = useState<'donors' | 'bloodbanks'>('donors');
  const [donorData, setDonorData] = useState<any[]>([]);
  const [bankData, setBankData] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const tabs = ['This month', 'All time', 'By city', 'By blood group'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [donorRes, bankRes, campsRes] = await Promise.all([
          fetch(`${API_URL}/donors/leaderboard`),
          fetch(`${API_URL}/bloodbanks/leaderboard`),
          fetch(`${API_URL}/community/camps`)
        ]);
        
        if (donorRes.ok) {
          setDonorData(await donorRes.json());
        }
        if (bankRes.ok) {
          setBankData(await bankRes.json());
        }
        if (campsRes.ok) {
          setCamps(await campsRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, []);

  const getBadge = (points: number) => {
    if (points >= 5000) return 'Hero';
    if (points >= 3000) return 'Gold Donor';
    if (points >= 1500) return 'Silver Donor';
    if (points >= 500) return 'Bronze Donor';
    return 'Active Donor';
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const filteredData = useMemo(() => {
    let list = leaderboardType === 'donors' ? [...donorData] : [...bankData];
    
    if (activeTab === 'By city') {
      list = list.filter((d) => d.address);
      list.sort((a, b) => (a.address || '').localeCompare(b.address || ''));
    }
    if (activeTab === 'By blood group' && bloodGroupFilter && leaderboardType === 'donors') {
      list = list.filter((d) => d.bloodGroup === bloodGroupFilter);
    }
    if (activeTab === 'All time') {
      list.sort((a, b) => {
        const scoreA = a.rewardPoints || 0;
        const scoreB = b.rewardPoints || 0;
        return scoreB - scoreA;
      });
    }
    return list;
  }, [donorData, bankData, leaderboardType, activeTab, bloodGroupFilter]);

  const topDonors = filteredData.slice(0, 3);
  const TOP_3 = [];
  if (topDonors.length > 1) {
    TOP_3.push({
      ...topDonors[1],
      rank: 2,
      donations: topDonors[1]?._count?.donations || 0,
      badge: leaderboardType === 'donors' ? getBadge(topDonors[1].rewardPoints) : 'Verified Bank',
      initials: getInitials(topDonors[1].name),
      points: topDonors[1].rewardPoints || 0,
      color: 'bg-gray-200 border-gray-400', textColor: 'text-gray-600'
    });
  }
  if (topDonors.length > 0) {
    TOP_3.push({
      ...topDonors[0],
      rank: 1,
      donations: topDonors[0]?._count?.donations || 0,
      badge: leaderboardType === 'donors' ? getBadge(topDonors[0].rewardPoints) : 'Verified Bank',
      initials: getInitials(topDonors[0].name),
      points: topDonors[0].rewardPoints || 0,
      color: 'bg-yellow-100 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10', textColor: 'text-yellow-600'
    });
  }
  if (topDonors.length > 2) {
    TOP_3.push({
      ...topDonors[2],
      rank: 3,
      donations: topDonors[2]?._count?.donations || 0,
      badge: leaderboardType === 'donors' ? getBadge(topDonors[2].rewardPoints) : 'Verified Bank',
      initials: getInitials(topDonors[2].name),
      points: topDonors[2].rewardPoints || 0,
      color: 'bg-orange-100 border-orange-400', textColor: 'text-orange-600'
    });
  }

  // Ensure podium order is [Rank 2, Rank 1, Rank 3]
  TOP_3.sort((a, b) => {
    const order = [2, 1, 3];
    return order.indexOf(a.rank) - order.indexOf(b.rank);
  });

  const LEADERBOARD_LIST = filteredData.slice(3).map((d, index) => ({
    ...d,
    rank: index + 4,
    donations: d?._count?.donations || 0,
    points: d.rewardPoints || 0,
    badge: leaderboardType === 'donors' ? getBadge(d.rewardPoints) : 'Verified Bank',
    isUser: false, // Could check against current logged in user ID
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
            
      {/* Header */}
      <div className="bg-primary text-white py-12 border-b border-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center">
            <Trophy className="mr-4 w-10 h-10 text-yellow-400" /> Hall of Fame
          </h1>
          <p className="text-primary-light text-lg max-w-2xl mx-auto">
            Celebrating our top lifesavers. Your contributions ensure no one ever has to wait for blood.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col lg:flex-row gap-8 flex-grow">
        
        {/* Main Content */}
        <div className="w-full lg:w-2/3 xl:w-3/4">
          
          {/* Toggle Type */}
          <div className="flex bg-white rounded-xl border border-border p-1 mb-8 w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setLeaderboardType('donors')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                leaderboardType === 'donors' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Top Donors
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardType('bloodbanks')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                leaderboardType === 'bloodbanks' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Top Blood Banks
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 mb-6">
            <div className="flex overflow-x-auto hide-scrollbar gap-2">
              {tabs.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-colors shadow-sm ${
                    activeTab === tab
                      ? 'bg-primary text-white'
                      : 'bg-white text-text-secondary border border-border hover:border-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === 'By blood group' && leaderboardType === 'donors' && (
              <select
                value={bloodGroupFilter}
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium"
              >
                <option value="">All groups</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>

          {/* Top 3 Podium */}
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 mb-12 mt-8">
            {TOP_3.map((donor, idx) => (
              <motion.div 
                key={donor.rank}
                role="button"
                tabIndex={0}
                onClick={() => donor.id && navigate(`/profile/${donor.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && donor.id && navigate(`/profile/${donor.id}`)}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, type: 'spring', stiffness: 100 }}
                className={`bg-surface border border-border rounded-2xl p-6 flex flex-col items-center text-center shadow-md relative w-full md:w-1/3 cursor-pointer hover:shadow-lg transition-shadow ${
                  donor.rank === 1 ? 'md:-mt-12 md:pb-12 border-2 border-yellow-400 z-10' : ''
                }`}
              >
                {donor.rank === 1 && <Crown className="w-10 h-10 text-yellow-500 absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-md" fill="#EAB308" />}
                
                <div className={`w-20 h-20 rounded-full border-4 ${donor.color} flex items-center justify-center text-2xl font-bold mb-4 relative`}>
                  {donor.initials}
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${donor.color} flex items-center justify-center font-bold text-sm ${donor.textColor}`}>
                    #{donor.rank}
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-text-primary">{donor.name}</h3>
                <div className="flex items-center text-xs text-text-secondary mt-1 mb-3">
                  <MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate max-w-[150px]">{donor.address || 'Unknown'}</span>
                  {leaderboardType === 'donors' && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-bold text-primary">{donor.bloodGroup || donor.bg}</span>
                    </>
                  )}
                </div>
                
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold mb-4 text-text-primary">
                  {donor.badge}
                </span>
                
                <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-border">
                  <div>
                    <div className="text-xl font-bold text-text-primary">{donor.donations}</div>
                    <div className="text-[10px] uppercase text-text-secondary font-bold">Donations</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{donor.rewardPoints || donor.points}</div>
                    <div className="text-[10px] uppercase text-text-secondary font-bold">Points</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Ranked List */}
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                    <th className="py-4 px-6 font-bold w-16 text-center">Rank</th>
                    <th className="py-4 px-6 font-bold">{leaderboardType === 'donors' ? 'Donor' : 'Blood Bank'}</th>
                    <th className="py-4 px-6 font-bold">{leaderboardType === 'donors' ? 'Location & BG' : 'Location'}</th>
                    <th className="py-4 px-6 font-bold text-center">Donations</th>
                    <th className="py-4 px-6 font-bold text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD_LIST.map((donor, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{ delay: idx * 0.05 }}
                      key={donor.rank}
                      onClick={() => donor.id && navigate(`/profile/${donor.id}`)}
                      className={`border-b border-border last:border-0 transition-colors cursor-pointer ${
                        donor.isUser ? 'bg-primary-light/30 border-l-4 border-l-primary' : 
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      } hover:bg-gray-50`}
                    >
                      <td className="py-4 px-6 text-center font-bold text-text-secondary">
                        {donor.rank}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark font-bold flex items-center justify-center mr-3">
                            {getInitials(donor.name)}
                          </div>
                          <div>
                            <div className="font-bold text-text-primary text-sm flex items-center">
                              {donor.name}
                              {donor.isUser && <span className="ml-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                            </div>
                            <div className="text-xs text-text-secondary mt-0.5">{donor.badge}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-text-primary truncate max-w-[150px]">{donor.address || 'Unknown'}</div>
                        {leaderboardType === 'donors' && (
                          <div className="text-xs font-bold text-primary mt-0.5">{donor.bloodGroup || donor.bg}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-text-primary">
                        {donor.donations}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-primary">
                        {(donor.rewardPoints || donor.points).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
          
          {/* Points Guide */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" fill="#EAB308" /> Points Guide
            </h3>
            <p className="text-sm text-text-secondary mb-4 pb-4 border-b border-border">
              Earn points to climb the leaderboard and unlock exclusive badges.
            </p>
            <div className="space-y-3">
              {POINTS_GUIDE.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-background p-3 rounded-xl border border-border">
                  <span className="text-sm font-medium text-text-primary">{item.action}</span>
                  <span className="text-sm font-bold text-accent">+{item.points}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-start text-xs text-text-secondary bg-[#E8F5F1] p-3 rounded-lg border border-accent/20">
              <Info className="w-4 h-4 text-accent mr-2 shrink-0" />
              <span>Points reset annually, but lifetime badges are yours forever!</span>
            </div>
          </div>

          {/* Upcoming Camps */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
              <Tent className="w-5 h-5 text-primary mr-2" /> Upcoming Camps
            </h3>
            <div className="space-y-4">
              {camps.slice(0, 3).map((camp) => {
                const dateObj = new Date(camp.date);
                const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const dayStr = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
                return (
                  <div key={camp.id} className="flex items-start group cursor-pointer">
                    <div className="bg-primary text-white rounded-lg p-2 text-center min-w-[50px] mr-3 group-hover:bg-primary-dark transition-colors">
                      <div className="text-[10px] font-bold uppercase">{monthStr}</div>
                      <div className="text-lg font-bold leading-none mt-1">{dayStr}</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">{camp.title}</h4>
                      <p className="text-xs text-text-secondary mt-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {camp.location}
                      </p>
                    </div>
                  </div>
                );
              })}
              {camps.length === 0 && (
                <div className="text-sm text-text-secondary text-center py-4">No upcoming camps found.</div>
              )}
            </div>
            <Link to="/community?tab=Camps" className="block w-full mt-6 py-2.5 border border-border rounded-lg text-sm font-bold text-text-primary hover:bg-gray-50 transition-colors text-center">
              Find more camps
            </Link>
          </div>
          
        </div>
      </div>
      
          </div>
  );
};

// Simple Trophy icon component since we only need it here
const Trophy = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

// Simple Tent icon
const Tent = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3.5 21 14 3" />
    <path d="M20.5 21 10 3" />
    <path d="M15.5 21 12 15l-3.5 6" />
    <path d="M2 21h20" />
  </svg>
);

export default Leaderboard;
