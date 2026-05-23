import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ShieldCheck, MessageSquare, AlertCircle, Droplet, Clock, Flame, Trophy } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_URL } from '../lib/api';
import { useChat } from '../context/ChatContext';

const DonorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openChat } = useChat();
  const [donorData, setDonorData] = React.useState<any>(null);

  const token = localStorage.getItem('liforce_token');
  const loggedInUserId = React.useMemo(() => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload).id;
    } catch {
      return null;
    }
  }, [token]);

  const isOwnProfile = !id || id === 'me' || (donorData && loggedInUserId === donorData.id);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const fetchMe = !id || id === 'me';
        const endpoint = fetchMe ? `${API_URL}/donors/me` : `${API_URL}/donors/${id}`;
        const headers: Record<string, string> = {};
        if (fetchMe) {
          headers['Authorization'] = `Bearer ${localStorage.getItem('liforce_token') || ''}`;
        }
        const response = await fetch(endpoint, { headers });
        if (response.ok) {
          setDonorData(await response.json());
        }
      } catch (err) {
        console.error("Failed to fetch donor profile", err);
      }
    };
    fetchProfile();
  }, [id]);

  if (!donorData) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20 text-center animate-pulse">
        <Navbar />
        <p className="mt-20 text-text-secondary">Loading profile...</p>
      </div>
    );
  }

  const donationsCount = donorData?._count?.donations || donorData?.donations?.filter((d: any) => d.status === 'Completed').length || 0;
  const lastDonatedAt = donorData?.lastDonatedAt;
  
  let daysUntilEligible = 0;
  let eligibilityPercent = 100;
  let nextDateStr = 'Ready to Donate';
  if (lastDonatedAt) {
    const lastDate = new Date(lastDonatedAt);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 90);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    daysUntilEligible = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    eligibilityPercent = Math.min(100, Math.max(0, ((90 - daysUntilEligible) / 90) * 100));
    nextDateStr = nextDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    daysUntilEligible = 0;
    eligibilityPercent = 100;
  }

  const rewardPoints = donorData.rewardPoints || 0;
  const streak = Math.min(donationsCount, 12);

  const badges = [
    { id: 1, name: 'First Blood', earned: donationsCount >= 1, icon: '🩸', date: donationsCount >= 1 ? 'Earned' : 'Locked' },
    { id: 2, name: 'Bronze Donor', earned: rewardPoints >= 500, icon: '🥉', date: rewardPoints >= 500 ? 'Earned' : 'Locked' },
    { id: 3, name: '3 Streak', earned: donationsCount >= 3, icon: '🔥', date: donationsCount >= 3 ? 'Earned' : 'Locked' },
    { id: 4, name: 'Silver Donor', earned: rewardPoints >= 1500, icon: '🥈', date: rewardPoints >= 1500 ? 'Earned' : 'Locked' },
    { id: 5, name: 'Gold Donor', earned: rewardPoints >= 3000, icon: '🥇', date: rewardPoints >= 3000 ? 'Earned' : 'Locked' },
    { id: 6, name: 'Hero', earned: rewardPoints >= 5000, icon: '🦸', date: rewardPoints >= 5000 ? 'Earned' : 'Locked' },
  ];

  const recentActivity: any[] = [];
  if (donorData?.donations && donorData.donations.length > 0) {
    donorData.donations.slice(0, 5).forEach((d: any, idx: number) => {
      recentActivity.push({
        id: `don-${d.id || idx}`,
        action: d.status === 'Completed' ? 'Donated Blood' : 'Scheduled Donation',
        location: d.bloodBank?.name || 'Blood Center',
        date: new Date(d.scheduledDate).toLocaleDateString(),
      });
    });
  }
  
  // Add Join Activity
  recentActivity.push({
    id: 'join',
    action: 'Joined LiForce',
    location: donorData.city || 'App',
    date: new Date(donorData.createdAt).toLocaleDateString(),
  });

  const progressPercentage = eligibilityPercent;

  const donor = {
    name: donorData.name,
    bloodGroup: donorData.bloodGroup,
    city: donorData.city || 'Unknown',
    age: donorData.age || 28,
    isVerified: true,
    stats: {
      donations: donationsCount,
      livesSaved: donationsCount * 3,
      points: rewardPoints,
      streak: streak
    },
    eligibility: {
      daysLeft: daysUntilEligible,
      totalDays: 90,
      nextDate: nextDateStr
    },
    badges: badges,
    recentActivity: recentActivity
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <Navbar />
      
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden"
        >
          {/* Cover Photo Area */}
          <div className="h-48 md:h-64 bg-gradient-to-r from-primary to-primary-dark relative overflow-hidden">
            {/* Subtle Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>

          {/* Profile Content */}
          <div className="px-6 md:px-10 pb-10 relative">
            
            {/* Avatar & Action Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end -mt-20 md:-mt-24 mb-6">
              <div className="relative">
                <div className="w-36 h-36 md:w-40 md:h-40 bg-white rounded-full p-1.5 shadow-lg border-4 border-background z-10 relative">
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-5xl font-bold text-text-secondary overflow-hidden">
                    {/* Placeholder image or initials */}
                    {donor.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                </div>
                {donor.isVerified && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-md border-2 border-white" title="Verified Donor">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              {!isOwnProfile && (
                <div className="flex gap-3 mt-6 md:mt-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={openChat}
                    className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-white border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/emergency')}
                    className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-critical text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-500/20"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" /> Request Blood
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center md:text-left mb-10 border-b border-border pb-8">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-text-primary">{donor.name}</h1>
                <span className="bg-primary-light text-primary-dark font-bold px-3 py-1 rounded-full text-sm border border-[#F5B7B1]">
                  {donor.bloodGroup}
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-text-secondary text-sm">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {donor.city}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {donor.age} years old</span>
              </div>
            </div>

            {/* Stats Row (4 Pillars matching Dashboard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Donations */}
              <div className="bg-[#FCEBEB] p-5 rounded-2xl flex items-center border border-[#F5B7B1] hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm mr-4 shrink-0">
                  <Droplet className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{donor.stats.donations}</div>
                  <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Donations</div>
                </div>
              </div>
              
              {/* Next Eligible Date */}
              <div className="bg-gray-50 p-5 rounded-2xl flex items-center border border-border hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-text-secondary shadow-sm mr-4 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">
                    {donor.eligibility.daysLeft === 0 ? 'Ready' : donor.eligibility.daysLeft}
                    {donor.eligibility.daysLeft > 0 && <span className="text-sm font-medium text-text-secondary ml-1">days</span>}
                  </div>
                  <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Donation Cooldown</div>
                </div>
              </div>
              
              {/* Reward Points */}
              <div className="bg-[#E8F5F1] p-5 rounded-2xl flex items-center border border-[#A3E4D7] hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-accent shadow-sm mr-4 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{donor.stats.points}</div>
                  <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Reward Points</div>
                </div>
              </div>

              {/* Current Streak */}
              <div className="bg-[#FEF5E7] p-5 rounded-2xl flex items-center border border-[#FAD7A1] hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-warning shadow-sm mr-4 shrink-0">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary flex items-center">
                    {donor.stats.streak}
                    <Flame className="h-5 w-5 ml-1 text-warning" fill="#E67E22" />
                  </div>
                  <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Current Streak</div>
                </div>
              </div>
            </div>

            {/* Content Grid - 3 Column Split to perfectly match Dashboard and align layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Donation Status */}
              <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between h-full">
                <div>
                  <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center">
                    <Clock className="w-5 h-5 text-text-secondary mr-2" /> Donation Status
                  </h3>
                  {donor.eligibility.daysLeft <= 0 ? (
                    <div className="bg-[#E8F5F1] text-accent p-4 rounded-xl font-bold flex items-center border border-[#A3E4D7]">
                      <ShieldCheck className="w-5 h-5 mr-2" /> Ready to donate today!
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-text-primary text-sm">Eligible in {donor.eligibility.daysLeft} days</span>
                        <span className="text-[10px] font-bold text-text-secondary">{donor.eligibility.nextDate}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        To protect your health, we require a 90-day waiting period between blood donations.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="bg-primary-light text-primary-dark p-3 rounded-xl border border-[#F5B7B1] text-center text-xs font-bold">
                    Lives Saved Impact: {donor.stats.livesSaved} lives!
                  </div>
                </div>
              </div>

              {/* Column 2: Badges Grid */}
              <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-text-primary flex items-center">
                    <Trophy className="w-5 h-5 text-text-secondary mr-2" /> Badges Earned
                  </h3>
                  <Link to="/leaderboard" className="text-sm font-bold text-primary hover:underline">View all</Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {donor.badges.map(badge => (
                    <div key={badge.id} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-border hover:bg-gray-100 transition-colors group cursor-default shadow-sm">
                      <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform border ${badge.earned ? 'bg-primary-light border-primary' : 'bg-gray-100 border-gray-200 grayscale opacity-45'}`}>
                        {badge.icon}
                      </div>
                      <span className={`text-[10px] font-bold text-center mb-1 ${badge.earned ? 'text-text-primary' : 'text-text-secondary'}`}>{badge.name}</span>
                      <span className="text-[9px] text-text-secondary">{badge.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Recent Impact Activity */}
              <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm h-full">
                <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center">
                  <Activity className="w-5 h-5 text-text-secondary mr-2" /> Recent Impact
                </h3>
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {donor.recentActivity.map((activity, idx) => (
                    <div key={activity.id} className="flex items-start relative">
                      {idx !== donor.recentActivity.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-[-16px] w-[2px] bg-border"></div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-[#FCEBEB] text-primary flex items-center justify-center z-10 shrink-0 border-2 border-white shadow-sm">
                        {activity.action.includes('SOS') ? <AlertCircle className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
                      </div>
                      <div className="ml-4 pt-1 pb-2">
                        <h4 className="text-sm font-bold text-text-primary leading-snug">{activity.action}</h4>
                        <p className="text-xs text-text-secondary mt-1 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" /> {activity.location}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-1.5 font-semibold bg-gray-100 px-2 py-0.5 rounded-full w-max">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

// Simple Activity icon
const Activity = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default DonorProfile;
