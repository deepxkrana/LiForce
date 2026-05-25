import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { 
  Calendar, 
  MapPin, 
  Droplet, 
  User, 
  Heart, 
  ArrowLeft, 
  Clock, 
  ChevronDown 
} from 'lucide-react';

interface BloodBank {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface DonorProfile {
  name: string;
  bloodGroup: string;
  isVerified: boolean;
  lastDonatedAt?: string | null;
}

const TIME_SLOTS = [
  { value: '08:00', label: '08:00 AM' },
  { value: '08:30', label: '08:30 AM' },
  { value: '09:00', label: '09:00 AM' },
  { value: '09:30', label: '09:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '15:30', label: '03:30 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '16:30', label: '04:30 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '17:30', label: '05:30 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '19:30', label: '07:30 PM' }
];

const DonateBlood: React.FC = () => {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('liforce_userId');
    const role = localStorage.getItem('liforce_role');

    // Protect Route
    if (!token || role !== 'donor') {
      showToast('Please login as a donor to book an appointment.', 'error');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Blood Banks
        const banksRes = await fetch(`${API_URL}/bloodbanks`);
        if (banksRes.ok) {
          const banksData = await banksRes.json();
          setBloodBanks(banksData);
        }

        // Fetch Donor Profile
        const profileRes = await fetch(`${API_URL}/donors/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setDonorProfile(profileData);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        showToast('Error connecting to backend services.', 'error');
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, [navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankId) {
      showToast('Please select a blood bank to donate in.', 'error');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      showToast('Please specify both appointment date and time.', 'error');
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('liforce_userId');
    const combinedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    try {
      const res = await fetch(`${API_URL}/donations/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bloodBankId: selectedBankId,
          scheduledDate: combinedDateTime.toISOString()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      showToast('📅 Appointment booked successfully! The Blood Bank has been notified.', 'success');
      navigate('/dashboard/donor');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20">
                <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
              </div>
    );
  }

  // --- 56-day cooldown calculations ---
  const COOLDOWN_DAYS = 56;
  let daysUntilEligible = 0;
  let eligibleDateStr = '';
  let eligibilityPercent = 100;
  if (donorProfile?.lastDonatedAt) {
    const lastDate = new Date(donorProfile.lastDonatedAt);
    const eligibleDate = new Date(lastDate);
    eligibleDate.setDate(eligibleDate.getDate() + COOLDOWN_DAYS);
    eligibleDateStr = eligibleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const today = new Date();
    const diffTime = eligibleDate.getTime() - today.getTime();
    daysUntilEligible = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const daysDone = COOLDOWN_DAYS - daysUntilEligible;
    eligibilityPercent = Math.min(100, Math.max(0, (daysDone / COOLDOWN_DAYS) * 100));
  }
  const onCooldown = daysUntilEligible > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
            
      <div className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-bold mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-border p-8 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent"></div>
              
              <h2 className="text-3xl font-extrabold text-text-primary mb-2 flex items-center gap-2">
                <Heart className="w-8 h-8 text-primary shrink-0 fill-primary/10" /> Book Donation
              </h2>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                Choose your preferred blood bank, date, and time. Your selected blood bank will receive a real-time notification about your request.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* 56-Day Cooldown Warning Card */}
                {onCooldown && (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6 shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200 rounded-full -mr-8 -mt-8 opacity-40 blur-xl" />
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-extrabold text-amber-800 mb-1">Donation Cooldown Active</h3>
                        <p className="text-sm text-amber-700 leading-relaxed mb-4">
                          You donated blood recently. For your safety, the WHO guidelines require a minimum 56-day recovery period between donations.
                        </p>
                        {/* Progress bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-amber-700">Recovery Progress</span>
                            <span className="text-xs font-bold text-amber-700">{Math.round(eligibilityPercent)}%</span>
                          </div>
                          <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-green-400 transition-all duration-700"
                              style={{ width: `${eligibilityPercent}%` }}
                            />
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/80 border border-amber-200 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-2xl font-black text-amber-600">{daysUntilEligible}</div>
                            <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mt-0.5">Days Remaining</div>
                          </div>
                          <div className="bg-white/80 border border-amber-200 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-sm font-black text-green-600 leading-tight">{eligibleDateStr}</div>
                            <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mt-0.5">Eligible On</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blood Bank Selection */}
                <div className={onCooldown ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" /> Select Blood Bank
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      required={!onCooldown}
                      disabled={onCooldown}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-primary appearance-none cursor-pointer pr-10 text-text-primary disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>Choose a verified blood bank...</option>
                      {bloodBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} — {bank.address}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Scheduling Details */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${onCooldown ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" /> Preferred Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required={!onCooldown}
                      disabled={onCooldown}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-primary text-text-primary disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" /> Preferred Time
                    </label>
                    <div className="relative">
                      <select
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        required={!onCooldown}
                        disabled={onCooldown}
                        className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-primary appearance-none cursor-pointer pr-10 text-text-primary disabled:cursor-not-allowed"
                      >
                        <option value="" disabled>Select a time slot...</option>
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || onCooldown}
                  className="w-full py-4 rounded-xl bg-primary text-white font-extrabold shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
                  title={onCooldown ? `You can donate again on ${eligibleDateStr}` : ''}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : onCooldown ? (
                    <>
                      <span>⏳</span> Cooldown Active — {daysUntilEligible} Days Remaining
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 fill-white/10" /> Book Appointment
                    </>
                  )}
                </button>

              </form>
            </motion.div>
          </div>

          {/* Profile Details Side */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Donor Card */}
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-md relative overflow-hidden">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-3">
                  <User className="w-5 h-5 text-primary" /> Your Donor Card
                </h3>
                
                {donorProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Full Name</span>
                      <span className="font-bold text-text-primary">{donorProfile.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Blood Group</span>
                      <span className="text-xl font-black text-primary flex items-center gap-1">
                        <Droplet className="w-4 h-4 text-primary fill-primary" /> {donorProfile.bloodGroup}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Status</span>
                      <span className="text-xs font-bold text-accent bg-[#E8F5F1] px-2.5 py-1 rounded-full">
                        {donorProfile.isVerified ? 'Verified Donor' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm">Could not retrieve profile.</p>
                )}
              </div>

              {/* Guidelines Info */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
                  💡 Donation Guidelines
                </h3>
                <ul className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    Eat a light meal and drink plenty of water before your appointment.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    Avoid alcohol consumption for 24 hours prior to donation.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    Bring a valid government-issued photo identity proof with you.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    You must weigh at least 45 kg and be between 18 and 65 years old.
                  </li>
                </ul>
              </div>

            </motion.div>
          </div>

        </div>
      </div>

          </div>
  );
};

export default DonateBlood;
