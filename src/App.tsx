import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { X, Droplet, Users, Phone, Share2, Check, ArrowLeft } from 'lucide-react';
import { API_URL, fetchWithAuth } from './lib/api';
import Home from './pages/Home';
import Login from './pages/Login';
import FindBlood from './pages/FindBlood';
import DonorRegistration from './pages/DonorRegistration';
import BloodBankRegistration from './pages/BloodBankRegistration';
import DonorDashboard from './pages/DonorDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import EmergencyRequest from './pages/EmergencyRequest';
import Leaderboard from './pages/Leaderboard';
import Community from './pages/Community';
import DonorProfile from './pages/DonorProfile';
import BloodBankProfile from './pages/BloodBankProfile';
import ViewMyCamps from './pages/ViewMyCamps';
import DonateBlood from './pages/DonateBlood';
import OrganiseCamp from './pages/OrganiseCamp';
import Rewards from './pages/Rewards';

import FindDonors from './pages/FindDonors';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ChatbotWidget from './components/ChatbotWidget';
// Removed SOSFloatingButton
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider, useToast } from './components/ToastProvider';
import { ChatProvider } from './context/ChatContext';
import ScrollToTop from './components/ScrollToTop';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = { duration: 0.3 };


const AnimatedRoutes = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [sosResponseStep, setSosResponseStep] = useState<'details' | 'choice' | 'success_donate' | 'success_refer'>('details');

  const handleCloseSOS = () => {
    setActiveSOS(null);
    setSosResponseStep('details');
  };

  const submitSOSResponse = async (responseType: 'I will donate myself' | 'I will bring someone else' | 'Prepared Units'): Promise<boolean> => {
    try {
      const userId = localStorage.getItem('liforce_userId');
      
      let responderName = "Anonymous Donor";
      let responderPhone = "";
      let responderBloodGroup = "O+";
      let lastDonatedAt: string | null = null;

      if (userId) {
        try {
          const profileRes = await fetchWithAuth(`${API_URL}/donors/me`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            responderName = profile.name;
            responderPhone = profile.phone || "";
            responderBloodGroup = profile.bloodGroup || "O+";
            lastDonatedAt = profile.lastDonatedAt || null;
          }
        } catch (e) {
          console.error("Failed to fetch user profile for response mapping", e);
        }
      }

      // 56-day cooldown check for self-donation
      if (responseType === 'I will donate myself' && lastDonatedAt) {
        const lastDate = new Date(lastDonatedAt);
        const eligibleDate = new Date(lastDate);
        eligibleDate.setDate(eligibleDate.getDate() + 56);
        const today = new Date();
        const daysLeft = Math.ceil((eligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          const eligibleStr = eligibleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
          showToast(`⏳ Cooldown Active: You can donate again in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (eligible on ${eligibleStr}).`, 'error');
          return false;
        }
      }

      const role = localStorage.getItem('liforce_role');
      const isBloodBank = role === 'bloodbank';
      
      const payload: any = {
        responderName: responderName || JSON.parse(localStorage.getItem('liforce_user') || '{}')?.name || 'Unknown',
        responderPhone: responderPhone || JSON.parse(localStorage.getItem('liforce_user') || '{}')?.phone || 'Unknown',
        responderType: isBloodBank ? 'BloodBank' : 'Donor',
        responseType,
        bloodGroup: responderBloodGroup
      };
      
      if (isBloodBank) {
        payload.bloodBankId = userId;
      } else {
        payload.responderId = userId;
      }

      const response = await fetchWithAuth(`${API_URL}/emergencies/${activeSOS.id}/respond`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Your response has been registered successfully!', 'success');
        return true;
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to submit emergency response.', 'error');
        return false;
      }
    } catch (err) {
      console.error('Respond SOS error:', err);
      return false;
    }
  };

                

  useEffect(() => {
    const userId = localStorage.getItem('liforce_userId');

    if (userId) {
      if (!socketRef.current || socketRef.current.io.opts.query?.userId !== userId) {
        socketRef.current?.disconnect();
        const socket = io(API_URL, { query: { userId } });
        socket.on('emergency_sos', (data: any) => {
          if (data.requesterId === userId) return; // Prevent self-pinging
          setActiveSOS(data);
          setSosResponseStep('details');
          showToast(`🚨 URGENT: ${data.bloodGroup} needed at ${data.hospitalAddress}!`, 'error');
        });
        socket.on('emergency_response_received', (data: any) => {
          const fulfillerType = data.responderType === 'BloodBank' ? 'Blood Bank' : 'Donor';
          showToast(
            `❤️ REQUEST APPROVED: Your request for ${data.patientName} is approved and being fulfilled by ${fulfillerType} "${data.responderName}". Contact: ${data.responderPhone || 'Not provided'}`,
            'success'
          );
          // Dispatch a custom event to notify other components (e.g. DonorDashboard) to update live
          window.dispatchEvent(new CustomEvent('emergency_response_received', { detail: data }));
        });
        socket.on('new_appointment_created', (data: any) => {
          const role = localStorage.getItem('liforce_role');
          if (role === 'bloodbank') {
            showToast(`📅 NEW DONOR APPOINTMENT: ${data.donorName} (${data.bloodGroup}) booked an appointment!`, 'success');
            window.dispatchEvent(new CustomEvent('new_appointment_created', { detail: data }));
          }
        });
        socket.on('new_camp_organized', (data: any) => {
          const role = localStorage.getItem('liforce_role');
          if (role === 'donor') {
            showToast(`🎪 NEW CAMP ORGANIZED: "${data.title}" at ${data.location} by ${data.organizerName}!`, 'info');
            window.dispatchEvent(new CustomEvent('new_camp_organized', { detail: data }));
          }
        });
        socket.on('camp_updated', (data: any) => {
          showToast(`⚠️ CAMP UPDATE: The schedule for "${data.title}" has been modified.`, 'info');
          window.dispatchEvent(new CustomEvent('camp_updated', { detail: data }));
        });
        socket.on('camp_abandoned', (data: any) => {
          showToast(`🚨 CAMP CANCELLED: "${data.title}" has been abandoned. Reason: ${data.reason}`, 'error');
          window.dispatchEvent(new CustomEvent('camp_abandoned', { detail: data }));
        });
        socketRef.current = socket;
      }
    } else {
      socketRef.current?.disconnect();
      socketRef.current = null;
    }
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen"
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/find-blood" element={<FindBlood />} />
            <Route path="/register" element={<DonorRegistration />} />
            <Route path="/register/bloodbank" element={<BloodBankRegistration />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/dashboard/donor" element={<DonorDashboard />} />
            <Route path="/dashboard/bloodbank" element={<BloodBankDashboard />} />
            <Route path="/dashboard/bloodbank/camps" element={<ViewMyCamps />} />
            <Route path="/find-donors" element={<FindDonors />} />
            <Route path="/emergency" element={<EmergencyRequest />} />
            <Route path="/settings" element={<Settings />} />

            {/* Shared Static Pages */}
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile/:id" element={<DonorProfile />} />
            <Route path="/bank-profile/:id" element={<BloodBankProfile />} />
            <Route path="/donate-blood" element={<DonateBlood />} />
            <Route path="/organise-camp" element={<OrganiseCamp />} />
            <Route path="/donate" element={<Navigate to="/register" replace />} />
            <Route path="/blood-banks" element={<Navigate to="/find-blood" replace />} />
            <Route path="/partner" element={<Navigate to="/register-bloodbank" replace />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/blog" element={<Navigate to="/rewards" replace />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      </main>

      <Footer />

      <AnimatePresence>
        {activeSOS && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 left-4 right-4 md:left-auto md:right-8 md:max-w-md bg-gradient-to-r from-[#C0392B] to-[#962D22] text-white rounded-2xl p-5 shadow-2xl z-[999] border-2 border-white/20 flex flex-col gap-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
          >
            {sosResponseStep === 'details' && (
              <>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse shrink-0">
                      <span className="text-xl">🚨</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-lg tracking-wide uppercase">CRITICAL SOS MATCH</h4>
                      <p className="text-xs text-white/80">Real-time emergency near your location</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseSOS}
                    className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-3xl font-black">{activeSOS.bloodGroup}</span>
                    <span className="text-xl font-bold bg-white text-[#C0392B] px-3 py-0.5 rounded-full">{activeSOS.unitsRequired} Units</span>
                  </div>
                  <p className="text-sm font-semibold">🏥 {activeSOS.hospitalAddress}</p>
                  <p className="text-xs text-white/80 mt-1">
                    👤 {activeSOS.patientName}
                    {(activeSOS.patientAge || activeSOS.patientGender) && (
                      <span className="text-[11px] text-white/70 ml-1">
                        ({activeSOS.patientAge ? `${activeSOS.patientAge} y/o` : ''}
                        {activeSOS.patientAge && activeSOS.patientGender ? ', ' : ''}
                        {activeSOS.patientGender})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseSOS}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                  >
                    Decline
                  </button>
                  {localStorage.getItem('liforce_role') === 'bloodbank' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await submitSOSResponse('Prepared Units');
                        if (ok) {
                          handleCloseSOS();
                          window.dispatchEvent(new CustomEvent('sos_match_confirmed', { detail: { id: activeSOS.id } }));
                        }
                      }}
                      className="flex-1 bg-white text-[#C0392B] hover:bg-gray-100 py-2.5 rounded-xl text-sm font-black text-center shadow-lg transition-all active:scale-95"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSosResponseStep('choice')}
                      className="flex-1 bg-white text-[#C0392B] hover:bg-gray-100 py-2.5 rounded-xl text-sm font-black text-center shadow-lg transition-all active:scale-95"
                    >
                      RESPOND NOW
                    </button>
                  )}
                </div>
              </>
            )}

            {sosResponseStep === 'choice' && (
              <>
                <div className="flex justify-between items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setSosResponseStep('details')}
                    className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs shrink-0 font-bold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <h4 className="font-extrabold text-sm tracking-wide uppercase truncate">Response Options</h4>
                  <button
                    type="button"
                    onClick={handleCloseSOS}
                    className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-white/95 leading-relaxed font-semibold text-center my-1 bg-white/10 rounded-lg py-2 px-3 border border-white/10">
                  How can you support this critical <span className="font-black underline">{activeSOS.bloodGroup}</span> emergency?
                </p>
                
                <div className="flex flex-col gap-3">
                  {/* Option A: I am Donating */}
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await submitSOSResponse('I will donate myself');
                      if (ok) setSosResponseStep('success_donate');
                    }}
                    className="flex items-center gap-3.5 bg-white text-[#C0392B] p-3 rounded-xl hover:bg-gray-50 transition-all text-left shadow-md group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FADBD8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Droplet className="w-5 h-5 text-critical" fill="#C0392B" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-extrabold text-sm leading-tight text-[#962D22]">I will donate myself</h5>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">I am eligible and can travel to the hospital to donate blood now.</p>
                    </div>
                  </button>

                  {/* Option B: Bringing someone else */}
                  <button
                    type="button"
                    onClick={async () => {
                      setSosResponseStep('success_refer');
                      await submitSOSResponse('I will bring someone else');
                    }}
                    className="flex items-center gap-3.5 bg-white text-[#C0392B] p-3 rounded-xl hover:bg-gray-50 transition-all text-left shadow-md group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8F5F1] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-extrabold text-sm leading-tight text-[#1D9E75]">I will bring someone else</h5>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">I will organize or accompany another person who is willing to donate.</p>
                    </div>
                  </button>
                </div>
              </>
            )}

            {sosResponseStep === 'success_donate' && (
              <>
                <div className="flex justify-between items-center gap-3">
                  <span className="font-extrabold text-sm tracking-wide uppercase">RESPONSE REGISTERED</span>
                  <button
                    type="button"
                    onClick={handleCloseSOS}
                    className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center py-4 bg-white/10 rounded-xl p-4 border border-white/10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#E8F5F1] border border-accent flex items-center justify-center animate-bounce">
                    <Check className="w-6 h-6 text-accent" />
                  </div>
                  <h5 className="font-black text-base text-white">Life-Saver Choice! ❤️</h5>
                  <p className="text-xs text-white/90 leading-relaxed px-2">
                    Thank you so much! Please call the emergency coordinator immediately to coordinate your arrival at <span className="font-bold">{activeSOS.hospitalAddress}</span>.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSosResponseStep('choice')}
                    className="px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all active:scale-95"
                  >
                    Change
                  </button>
                  <a
                    href={`tel:${activeSOS.contactNumber || '102'}`}
                    onClick={handleCloseSOS}
                    className="flex-1 bg-white text-[#C0392B] hover:bg-gray-100 py-3 rounded-xl text-sm font-black text-center shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Phone className="w-4 h-4 animate-pulse" /> CALL COORDINATOR NOW
                  </a>
                </div>
              </>
            )}

            {sosResponseStep === 'success_refer' && (
              <>
                <div className="flex justify-between items-center gap-3">
                  <span className="font-extrabold text-sm tracking-wide uppercase">RESPONSE REGISTERED</span>
                  <button
                    type="button"
                    onClick={handleCloseSOS}
                    className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center py-4 bg-white/10 rounded-xl p-4 border border-white/10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-300" />
                  </div>
                  <h5 className="font-black text-base text-white">Community Champion! 🤝</h5>
                  <p className="text-xs text-white/90 leading-relaxed px-2">
                    Awesome! You can copy the emergency details to share with friends, or call the coordinator directly to register the volunteer's details.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const shareMsg = `🚨 URGENT BLOOD NEEDED! 🚨\nBlood Group: ${activeSOS.bloodGroup}\nUnits: ${activeSOS.unitsRequired}\nHospital: ${activeSOS.hospitalAddress}\nPatient: ${activeSOS.patientName}${activeSOS.patientAge || activeSOS.patientGender ? ` (${activeSOS.patientAge ? `${activeSOS.patientAge} y/o` : ''}${activeSOS.patientAge && activeSOS.patientGender ? ', ' : ''}${activeSOS.patientGender || ''})` : ''}\nContact: ${activeSOS.contactNumber || '102'}\nShared via LiForce - Join us to save lives!`;
                      navigator.clipboard.writeText(shareMsg);
                      showToast('SOS message copied to clipboard! Share it now.', 'success');
                    }}
                    className="w-full bg-white/20 hover:bg-white/30 border border-white/20 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4" /> COPY SOS SHARE MESSAGE
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSosResponseStep('choice')}
                      className="px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                      Change
                    </button>
                    <a
                      href={`tel:${activeSOS.contactNumber || '102'}`}
                      onClick={handleCloseSOS}
                      className="flex-grow bg-white text-[#C0392B] hover:bg-gray-100 py-3 rounded-xl text-sm font-black text-center shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4" /> CALL COORDINATOR
                    </a>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <ChatProvider>
        <Router>
          <ScrollToTop />
          <AnimatedRoutes />
          {/* Footer removed */}
          <ChatbotWidget />
        </Router>
      </ChatProvider>
    </ToastProvider>
  );
}

export default App;
