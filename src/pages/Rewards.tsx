import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Gift, Star, Clock, ChevronRight, Droplet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../lib/api';

interface UserPoints {
  points: number;
  name: string;
}

const DONOR_REWARDS = [
  {
    id: 1,
    title: 'LiForce Water Bottle',
    points: 5000,
    description: 'Stay hydrated on your life-saving journey! A premium LiForce-branded water bottle — your constant companion.',
    emoji: '🧴',
    gradient: 'from-sky-400 to-blue-500',
    available: true,
  },
  {
    id: 2,
    title: 'Custom Red LiForce T-Shirt',
    points: 10000,
    description: 'Wear your heroism proudly. A custom-designed, vibrant red LiForce t-shirt — exclusive to our top contributors.',
    emoji: '👕',
    gradient: 'from-red-500 to-primary',
    available: true,
  },
  {
    id: 3,
    title: 'More Rewards Incoming...',
    points: 0,
    description: "We're constantly adding new rewards for our amazing donor community. Stay tuned for exciting upcoming prizes!",
    emoji: '✨',
    gradient: 'from-violet-500 to-purple-600',
    available: false,
  },
];

const BANK_REWARDS = [
  {
    id: 1,
    title: 'Blood Collection Monitor',
    points: 50000,
    description: 'A professional-grade blood collection monitor to enhance the safety and efficiency of your donation drives.',
    emoji: '🩺',
    gradient: 'from-teal-400 to-emerald-500',
    available: true,
  },
  {
    id: 2,
    title: 'Mini Blood Storage Refrigerator',
    points: 100000,
    description: 'A compact, medical-grade refrigerator purpose-built for safe blood unit storage — ideal for smaller blood bank operations.',
    emoji: '🧊',
    gradient: 'from-blue-500 to-indigo-600',
    available: true,
  },
  {
    id: 3,
    title: 'More Rewards Incoming...',
    points: 0,
    description: "We're constantly adding new rewards for our blood bank partners. Stay tuned for exciting upcoming equipment prizes!",
    emoji: '✨',
    gradient: 'from-violet-500 to-purple-600',
    available: false,
  },
];

const Rewards: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserPoints | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('liforce_token');
  const role = localStorage.getItem('liforce_role');
  const isLoggedIn = !!token;

  useEffect(() => {
    const fetchPoints = async () => {
      if (!token || !role) { setIsLoading(false); return; }
      try {
        const url = role === 'bloodbank'
          ? `${API_URL}/bloodbanks/me`
          : `${API_URL}/donors/me`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUserInfo({ points: data.rewardPoints ?? 0, name: data.name });
        }
      } catch (e) {
        console.error('Failed to fetch reward points', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPoints();
  }, [token, role]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  const currentPoints = userInfo?.points ?? 0;
  const rewards = role === 'bloodbank' ? BANK_REWARDS : DONOR_REWARDS;
  const nextReward = rewards.filter(r => r.available && r.points > currentPoints).sort((a, b) => a.points - b.points)[0];
  const pointsToNext = nextReward ? nextReward.points - currentPoints : 0;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#962D22] to-[#6B1A12] py-20 px-4 text-white text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            LiForce Rewards
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            Every drop you donate earns you points. Redeem them for exclusive LiForce merchandise — because heroes deserve recognition!
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

        {/* Current Points Card */}
        {isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 bg-white rounded-2xl shadow-lg border border-border p-6 flex flex-col sm:flex-row items-center gap-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center shrink-0">
              <Star className="w-8 h-8 text-primary" fill="#C0392B" />
            </div>
            <div className="flex-grow text-center sm:text-left">
              <p className="text-sm text-text-secondary font-medium">
                {isLoading ? 'Loading...' : `Hello, ${userInfo?.name ?? 'Hero'}!`}
              </p>
              <h2 className="text-3xl font-black text-primary mt-0.5">
                {isLoading ? '...' : currentPoints.toLocaleString()} <span className="text-xl font-semibold text-text-secondary">points</span>
              </h2>
              {nextReward && !isLoading && (
                <p className="text-sm text-text-secondary mt-1">
                  You need <span className="font-bold text-primary">{pointsToNext.toLocaleString()} more points</span> to unlock the <span className="font-semibold">{nextReward.title}</span>!
                </p>
              )}
              {!nextReward && !isLoading && (
                <p className="text-sm text-accent font-bold mt-1">🎉 You've unlocked all available rewards!</p>
              )}
            </div>
            {nextReward && !isLoading && (
              <div className="shrink-0 w-full sm:w-auto">
                <div className="w-full sm:w-36 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-[#E74C3C] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (currentPoints / nextReward.points) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary text-center mt-1">
                  {Math.round((currentPoints / nextReward.points) * 100)}% to next reward
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* How to earn points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 bg-gradient-to-r from-[#FFF5F5] to-[#FFF0EE] border border-primary/20 rounded-2xl p-6"
        >
          <h3 className="font-bold text-text-primary text-lg mb-4 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-primary" fill="#C0392B" /> How to earn points
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Complete a donation appointment', pts: '+50 pts' },
              { label: 'Fulfill an emergency SOS request', pts: '+100 pts' },
              { label: 'Join & attend a blood camp', pts: '+25 pts' },
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-border">
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary leading-snug">{rule.label}</p>
                  <p className="text-sm font-black text-primary">{rule.pts}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reward Cards */}
        <h2 className="text-2xl font-black text-text-primary mb-6">
          🎁 Available Rewards
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {rewards.map((reward) => {
            const unlocked = isLoggedIn && reward.available && currentPoints >= reward.points;
            return (
              <motion.div
                key={reward.id}
                variants={item}
                className={`relative rounded-2xl overflow-hidden border shadow-md flex flex-col ${
                  reward.available ? 'bg-white border-border' : 'bg-gray-50 border-dashed border-gray-300'
                }`}
              >
                {/* Card Top Gradient */}
                <div className={`bg-gradient-to-br ${reward.gradient} h-32 flex items-center justify-center text-6xl`}>
                  {reward.emoji}
                </div>

                {/* Unlocked Badge */}
                {unlocked && (
                  <div className="absolute top-3 right-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                    Unlocked! 🎉
                  </div>
                )}

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-black text-text-primary text-base leading-tight">{reward.title}</h3>
                    {reward.available && (
                      <span className="shrink-0 text-sm font-black text-primary bg-primary-light px-2.5 py-0.5 rounded-full">
                        {reward.points.toLocaleString()} pts
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed flex-grow">{reward.description}</p>

                  {reward.available && !isLoggedIn && (
                    <Link
                      to="/login"
                      className="mt-4 w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm text-center hover:bg-primary/90 transition-colors"
                    >
                      Login to track progress
                    </Link>
                  )}
                  {reward.available && isLoggedIn && !unlocked && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-text-secondary mb-1 font-medium">
                        <span>{currentPoints.toLocaleString()} pts</span>
                        <span>{reward.points.toLocaleString()} pts</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${reward.gradient} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(100, (currentPoints / reward.points) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary text-right mt-1">
                        {(reward.points - currentPoints).toLocaleString()} pts to go
                      </p>
                    </div>
                  )}
                  {reward.available && isLoggedIn && unlocked && (
                    <div className="mt-4 w-full py-2.5 rounded-xl bg-accent text-white font-bold text-sm text-center">
                      🎉 Reward Unlocked — Contact us to claim!
                    </div>
                  )}
                  {!reward.available && (
                    <div className="mt-4 flex items-center gap-2 text-text-secondary text-sm">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Coming soon — stay tuned!</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* How to Claim */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 bg-white rounded-2xl border border-border shadow-sm p-6 text-center"
        >
          <Gift className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="font-black text-text-primary text-lg mb-2">How to claim your reward</h3>
          <p className="text-text-secondary text-sm max-w-lg mx-auto leading-relaxed">
            Once you've accumulated enough points, reach out to us at{' '}
            <a href="mailto:rewards@liforce.in" className="text-primary font-semibold hover:underline">
              rewards@liforce.in
            </a>{' '}
            or call{' '}
            <span className="font-semibold text-primary">1800-LIFORCE</span> with your registered details. We'll verify your points and ship your reward right to your doorstep! 🚀
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Rewards;
