import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, ChevronLeft, ChevronRight, AlertTriangle, 
  Loader2, CheckCircle, Phone, User, Droplet, Building, MapPin 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { useToast } from '../components/ToastProvider';

interface Emergency {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalAddress: string;
  city?: string;
  urgency: string;
  patientGender?: string;
  patientAge?: number;
}

const PRESET_EMERGENCIES: Emergency[] = [
  {
    id: "preset-1",
    patientName: "Mohan Singh",
    bloodGroup: "O-",
    unitsRequired: 2,
    hospitalAddress: "PGIMER",
    city: "Chandigarh",
    urgency: "Critical"
  },
  {
    id: "preset-2",
    patientName: "Aarav Sharma",
    bloodGroup: "B+",
    unitsRequired: 3,
    hospitalAddress: "Fortis Hospital",
    city: "Mohali",
    urgency: "High"
  },
  {
    id: "preset-3",
    patientName: "Priya Patel",
    bloodGroup: "A-",
    unitsRequired: 4,
    hospitalAddress: "AIIMS",
    city: "New Delhi",
    urgency: "Critical"
  },
  {
    id: "preset-4",
    patientName: "Rohan Kapoor",
    bloodGroup: "AB+",
    unitsRequired: 1,
    hospitalAddress: "KEM Hospital",
    city: "Mumbai",
    urgency: "Normal"
  },
  {
    id: "preset-5",
    patientName: "Sneha Reddy",
    bloodGroup: "O+",
    unitsRequired: 3,
    hospitalAddress: "Apollo Hospital",
    city: "Bengaluru",
    urgency: "High"
  }
];

const UrgentSOSBanner: React.FC = () => {
  const { showToast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [emergencies, setEmergencies] = useState<Emergency[]>(PRESET_EMERGENCIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [isHovered, setIsHovered] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [responderName, setResponderName] = useState('');
  const [responderPhone, setResponderPhone] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [responseType, setResponseType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = localStorage.getItem('liforce_userId');
  const role = localStorage.getItem('liforce_role');

  // Load nearby emergencies if user is logged in
  useEffect(() => {
    const fetchNearby = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/donors/emergencies/nearby`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((item: any) => ({
              id: item.id,
              patientName: item.patientName || "Emergency Patient",
              bloodGroup: item.bloodGroup,
              unitsRequired: item.unitsRequired || 1,
              hospitalAddress: item.hospitalAddress,
              city: item.city || "Nearby",
              urgency: item.urgency || "Critical"
            }));
            setEmergencies(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load nearby emergencies:", err);
      }
    };
    fetchNearby();
  }, [token]);

  // Slideshow Auto-Rotation Interval
  useEffect(() => {
    if (isHovered || isModalOpen || emergencies.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % emergencies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, isModalOpen, emergencies.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + emergencies.length) % emergencies.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % emergencies.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Open Glassmorphic Modal & Fetch Profile
  const handleOpenModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
    setIsSuccess(false);
    setUserData(null);
    setResponseType('');
    
    if (!token) {
      return; // Non-authenticated guest state handles itself in modal rendering
    }

    setIsLoadingProfile(true);
    try {
      if (role === 'donor') {
        const response = await fetch(`${API_URL}/donors/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setResponderName(data.name || '');
          setResponderPhone(data.phone || '');
          setSelectedBloodGroup(data.bloodGroup || emergencies[currentIndex].bloodGroup);
          setResponseType('I will donate myself');
        }
      } else if (role === 'bloodbank') {
        const response = await fetch(`${API_URL}/bloodbanks/me/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setResponderName(data.bank?.name || '');
          setResponderPhone(data.bank?.phone || '');
          setSelectedBloodGroup(emergencies[currentIndex].bloodGroup);
          setResponseType('Prepared Units');
        }
      }
    } catch (err) {
      console.error("Failed to load user profile for response modal", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const activeReq = emergencies[currentIndex];

    // Simulate mock responses instantly for preset IDs
    if (activeReq.id.startsWith('preset-')) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitting(false);
      setIsSuccess(true);
      showToast('Simulated response captured! Thank you for experiencing LiForce.', 'success');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/emergencies/${activeReq.id}/respond`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          responderId: role === 'donor' ? userData?.id : null,
          bloodBankId: role === 'bloodbank' ? userData?.bank?.id : null,
          responderName,
          responderPhone,
          responderType: role === 'bloodbank' ? 'BloodBank' : 'Donor',
          responseType,
          bloodGroup: selectedBloodGroup
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        showToast('Response registered! Patient/Donor notified.', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to submit response.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error registering response. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeReq = emergencies[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && emergencies.length > 0 && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-[#FFF5F5] border-b border-[#F9D5D5] relative z-40"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between min-h-[50px] relative">
              {/* Left Chevron */}
              {emergencies.length > 1 && (
                <button 
                  onClick={handlePrev} 
                  className="text-primary hover:bg-[#FCDDDD] rounded-full p-1 transition-colors mr-2 cursor-pointer focus:outline-none"
                  aria-label="Previous Emergency"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {/* Slider Content Wrapper */}
              <div className="flex-grow overflow-hidden relative h-6 flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={activeReq.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="flex items-center space-x-2 md:space-x-3 w-full justify-center"
                  >
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        activeReq.urgency === 'Critical' ? 'bg-[#E24B4A]' : 'bg-[#F39C12]'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        activeReq.urgency === 'Critical' ? 'bg-[#E24B4A]' : 'bg-[#F39C12]'
                      }`}></span>
                    </span>
                    <p className="text-xs md:text-sm font-medium text-primary-dark truncate max-w-[85%] md:max-w-none text-center">
                      <span className="font-semibold uppercase tracking-wider text-[#C0392B] mr-1.5">
                        [{activeReq.urgency}]
                      </span>
                      Urgent: {activeReq.bloodGroup} blood needed at {activeReq.hospitalAddress}
                      {activeReq.city ? `, ${activeReq.city}` : ''} — {activeReq.unitsRequired} {activeReq.unitsRequired === 1 ? 'unit' : 'units'} required
                    </p>
                    <button 
                      onClick={handleOpenModal} 
                      className="inline-flex items-center text-[#E24B4A] font-bold text-xs md:text-sm hover:underline cursor-pointer focus:outline-none whitespace-nowrap ml-2 group"
                    >
                      Respond now 
                      <ArrowRight className="h-3.5 w-3.5 ml-0.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Chevron & Indicators */}
              <div className="flex items-center space-x-2 ml-2">
                {emergencies.length > 1 && (
                  <button 
                    onClick={handleNext} 
                    className="text-primary hover:bg-[#FCDDDD] rounded-full p-1 transition-colors cursor-pointer focus:outline-none"
                    aria-label="Next Emergency"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}

                <button 
                  onClick={() => setIsVisible(false)}
                  className="text-primary hover:bg-[#FCDDDD] rounded-full p-1 transition-colors cursor-pointer focus:outline-none"
                  aria-label="Close Banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Micro Pagination Dots */}
            {emergencies.length > 1 && (
              <div className="flex justify-center space-x-1 pb-1.5 -mt-1 relative z-50">
                {emergencies.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'bg-[#E24B4A] w-3' : 'bg-red-200 hover:bg-red-300'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Glassmorphic Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden relative z-10 text-text-primary"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary hover:bg-black/5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>

              {/* SUCCESS STATE VIEW */}
              {isSuccess ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4"
                  >
                    <CheckCircle className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Response Registered!</h3>
                  <p className="text-text-secondary text-sm mb-6 max-w-md">
                    Thank you so much! Your willingness to respond to this SOS emergency will help save lives.
                    The requester has been notified, and they will connect with you shortly.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition-colors cursor-pointer focus:outline-none"
                  >
                    Done
                  </button>
                </div>
              ) : !token ? (
                /* GUEST / AUTH REQUIREMENT VIEW */
                <div className="p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-800">Authentication Required</h3>
                  </div>

                  <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                    To respond directly to active SOS emergency requests and coordinate donations, you need to have a registered account on LiForce.
                  </p>

                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 mb-6 flex flex-col">
                    <span className="text-xs font-semibold text-[#E24B4A] uppercase tracking-wider mb-1">SOS Alert details</span>
                    <span className="font-bold text-sm text-text-primary">
                      {activeReq?.bloodGroup} Blood at {activeReq?.hospitalAddress}
                    </span>
                    <span className="text-xs text-text-secondary mt-1">
                      Required units: {activeReq?.unitsRequired} unit(s) • Status: {activeReq?.urgency}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setIsModalOpen(false)}
                      className="block w-full py-3 text-center bg-[#E24B4A] hover:bg-[#C0392B] text-white font-bold rounded-2xl shadow-lg transition-colors cursor-pointer"
                    >
                      Login to Respond
                    </Link>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/register"
                        onClick={() => setIsModalOpen(false)}
                        className="py-2.5 text-center bg-white border border-gray-200 hover:bg-gray-50 text-text-primary font-semibold text-xs md:text-sm rounded-xl transition-colors cursor-pointer"
                      >
                        Register as Donor
                      </Link>
                      <Link
                        to="/register-bloodbank"
                        onClick={() => setIsModalOpen(false)}
                        className="py-2.5 text-center bg-white border border-gray-200 hover:bg-gray-50 text-text-primary font-semibold text-xs md:text-sm rounded-xl transition-colors cursor-pointer"
                      >
                        List Blood Bank
                      </Link>
                    </div>
                  </div>
                </div>
              ) : isLoadingProfile ? (
                /* LOADING PROFILE STATE */
                <div className="p-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-[#E24B4A] animate-spin mb-4" />
                  <p className="text-text-secondary font-medium text-sm">Preparing response workspace...</p>
                </div>
              ) : (
                /* AUTHENTICATED RESPONDER FORM */
                <form onSubmit={handleSubmitResponse} className="p-6 md:p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-[#FDEDEC] rounded-2xl flex items-center justify-center text-[#E24B4A]">
                      <Droplet className="w-6 h-6 fill-[#E24B4A]" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold">Emergency Response</h3>
                      <p className="text-xs text-text-secondary">Logged in as {role === 'bloodbank' ? 'Blood Bank' : 'Donor'}</p>
                    </div>
                  </div>

                  {/* EMERGENCY SUMMARY PANEL */}
                  <div className="bg-[#FFF5F5] border border-[#FADBD8] rounded-2xl p-4 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-[#E24B4A] uppercase tracking-wider block mb-1">SOS LOCATION</span>
                        <h4 className="font-bold text-text-primary text-base flex items-center">
                          <MapPin className="w-4 h-4 text-[#E24B4A] mr-1 flex-shrink-0" />
                          {activeReq?.hospitalAddress} {activeReq?.city ? `, ${activeReq?.city}` : ''}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 bg-[#FDEDEC] text-[#E24B4A] text-[10px] font-extrabold rounded-full uppercase">
                        {activeReq?.urgency}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-[#FCDDDD] text-center">
                      <div>
                        <span className="text-[10px] font-medium text-text-secondary uppercase">Group Needed</span>
                        <p className="font-black text-2xl text-[#E24B4A]">{activeReq?.bloodGroup}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-text-secondary uppercase">Units Requested</span>
                        <p className="font-black text-2xl text-[#E24B4A]">{activeReq?.unitsRequired} Units</p>
                      </div>
                    </div>
                  </div>

                  {/* RESPONDER INPUT CONTROLS */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                        {role === 'bloodbank' ? 'Blood Bank Name' : 'Donor Name'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                          type="text"
                          required
                          value={responderName}
                          onChange={(e) => setResponderName(e.target.value)}
                          className="w-full bg-black/5 hover:bg-black/10 focus:bg-white focus:ring-2 focus:ring-[#E24B4A] border border-transparent focus:border-[#E24B4A] rounded-2xl py-3 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none"
                          placeholder={role === 'bloodbank' ? 'Enter blood bank name' : 'Enter your name'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                        Contact Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                          type="tel"
                          required
                          value={responderPhone}
                          onChange={(e) => setResponderPhone(e.target.value)}
                          className="w-full bg-black/5 hover:bg-black/10 focus:bg-white focus:ring-2 focus:ring-[#E24B4A] border border-transparent focus:border-[#E24B4A] rounded-2xl py-3 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none"
                          placeholder="Contact phone number"
                        />
                      </div>
                    </div>

                    {role === 'donor' ? (
                      /* DONOR CHOICE CONTROLS */
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                              My Blood Group
                            </label>
                            <div className="relative">
                              <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E24B4A]" />
                              <select
                                value={selectedBloodGroup}
                                onChange={(e) => setSelectedBloodGroup(e.target.value)}
                                className="w-full bg-black/5 hover:bg-black/10 focus:bg-white focus:ring-2 focus:ring-[#E24B4A] border border-transparent focus:border-[#E24B4A] rounded-2xl py-3 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none appearance-none"
                              >
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                  <option key={bg} value={bg}>{bg}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                              I will...
                            </label>
                            <select
                              value={responseType}
                              onChange={(e) => setResponseType(e.target.value)}
                              className="w-full bg-black/5 hover:bg-black/10 focus:bg-white focus:ring-2 focus:ring-[#E24B4A] border border-transparent focus:border-[#E24B4A] rounded-2xl py-3 px-4 text-sm font-medium transition-all focus:outline-none"
                            >
                              <option value="I will donate myself">Donate Myself</option>
                              <option value="I will bring someone else">Bring a Donor</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* BLOOD BANK INVENTORY PREPARATION CONTROLS */
                      <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                          Response Intent
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                          <select
                            disabled
                            value="Prepared Units"
                            className="w-full bg-black/5 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium border border-transparent text-text-secondary cursor-not-allowed opacity-80"
                          >
                            <option value="Prepared Units">Prepare Units from Inventory</option>
                          </select>
                        </div>
                        <div className="mt-4 flex items-start space-x-2.5">
                          <input
                            type="checkbox"
                            required
                            id="confirm-inventory-check"
                            className="mt-1 accent-[#E24B4A] rounded"
                          />
                          <label htmlFor="confirm-inventory-check" className="text-xs text-text-secondary font-medium leading-relaxed">
                            We verify that {activeReq?.unitsRequired} {activeReq?.unitsRequired === 1 ? 'unit' : 'units'} of {activeReq?.bloodGroup} blood is physically ready and locked for PGIMER patient.
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="mt-8 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 text-center bg-gray-100 hover:bg-gray-200 text-text-primary font-bold rounded-2xl transition-colors cursor-pointer focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-3 bg-[#E24B4A] hover:bg-[#C0392B] text-white font-bold rounded-2xl shadow-lg transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Registering...
                        </>
                      ) : (
                        'Submit Response'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UrgentSOSBanner;

