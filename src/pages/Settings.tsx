import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle, Mail, Settings as SettingsIcon, Phone, 
  MapPin, KeyRound, ArrowLeft, Pen, X 
} from 'lucide-react';
import { API_URL, fetchWithAuth } from '../lib/api';
import confetti from 'canvas-confetti';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const orangeIcon = L.divIcon({
  className: "custom-pin",
  iconAnchor: [0, 12],
  popupAnchor: [0, -24],
  html: `<span style="background-color: #E67E22; width: 24px; height: 24px; display: block; left: -12px; top: -12px; position: relative; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></span>`
});

// Map component for picking location
const LocationMarker = ({ position, setPosition }: { position: [number, number] | null, setPosition: (p: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : (
    <Marker position={position} icon={orangeIcon}></Marker>
  );
};

// Component to force Leaflet to recalculate map size and remove gray boxes
const FixMapDisplay = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
};

type EditField = 'email' | 'phone' | 'password' | 'location' | 'address' | 'maxTravelDistance' | null;

const Settings: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null);
  
  const [activeModal, setActiveModal] = useState<EditField>(null);
  const [modalStep, setModalStep] = useState<1 | 2>(1); // 1: Input, 2: OTP
  
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPosition, setNewPosition] = useState<[number, number] | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [newMaxTravelDistance, setNewMaxTravelDistance] = useState<number>(10);
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const userRole = localStorage.getItem('liforce_role');

  const fetchProfileData = useCallback(async () => {
    try {
      const endpoint = userRole === 'donor' ? '/donors/me' : '/bloodbanks/me/dashboard';
      const res = await fetchWithAuth(`${API_URL}${endpoint}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfileData(userRole === 'donor' ? data : data.bank);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }, [userRole]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const openModal = (field: EditField) => {
    setActiveModal(field);
    setModalStep(1);
    setError('');
    setSuccess('');
    setOtp('');
    // Pre-fill existing data for non-password fields
    if (field === 'email') setNewEmail(profileData?.email || '');
    if (field === 'phone') setNewPhone(profileData?.phone || '');
    if (field === 'location') setNewPosition([profileData?.latitude || 30.7333, profileData?.longitude || 76.7794]);
    if (field === 'address') setNewAddress(profileData?.address || '');
    if (field === 'maxTravelDistance') setNewMaxTravelDistance(profileData?.maxTravelDistanceKm || 10);
    if (field === 'password') setNewPassword('');
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (activeModal === 'password' && newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Bypass OTP for non-sensitive fields
    if (activeModal === 'address' || activeModal === 'maxTravelDistance') {
      setIsLoading(true);
      try {
        const endpoint = userRole === 'donor' ? '/donors/me' : '/bloodbanks/me';
        const payload: any = {};
        
        if (activeModal === 'address') {
          payload.address = newAddress;
        }
        
        if (activeModal === 'maxTravelDistance') {
          payload.maxTravelDistanceKm = newMaxTravelDistance;
        }

        const res = await fetchWithAuth(`${API_URL}${endpoint}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Failed to save settings');
        
        setSuccess('Update successful!');
        fetchProfileData();
        setTimeout(() => closeModal(), 1500);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
      return; // Skip OTP initiation
    }

    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/auth/settings/initiate`, {
        method: 'POST'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate update');
      }

      setModalStep(2); // Move to OTP step
      setSuccess('OTP sent to your current registered email!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const updatePayload: any = { code: otp };
    if (activeModal === 'email') updatePayload.newEmail = newEmail;
    if (activeModal === 'password') updatePayload.newPassword = newPassword;
    if (activeModal === 'phone') updatePayload.newPhone = newPhone;
    if (activeModal === 'location' && newPosition) {
      updatePayload.newLatitude = newPosition[0];
      updatePayload.newLongitude = newPosition[1];
    }

    try {
      const res = await fetchWithAuth(`${API_URL}/auth/settings/verify`, {
        method: 'POST',
        body: JSON.stringify(updatePayload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1D9E75', '#E67E22', '#C0392B']
      });

      setSuccess('Update successful!');
      fetchProfileData(); // Refresh data!
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOpenStatus = async () => {
    if (!profileData) return;
    const newStatus = profileData.isOpen === false ? true : false;
    
    // Optimistic UI update
    setProfileData({ ...profileData, isOpen: newStatus });
    
    try {
      const res = await fetchWithAuth(`${API_URL}/bloodbanks/me`, {
        method: 'PUT',
        body: JSON.stringify({ isOpen: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      console.error(err);
      // Revert on error
      setProfileData({ ...profileData, isOpen: !newStatus });
    }
  };

  const goBack = () => {
    if (userRole === 'donor') navigate('/dashboard/donor');
    else if (userRole === 'bloodbank') navigate('/dashboard/bloodbank');
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-24 pb-12 px-4">
      <div className="max-w-3xl w-full mx-auto">
        <button 
          onClick={goBack}
          className="flex items-center text-text-secondary hover:text-primary transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-2 rounded-xl">
                <SettingsIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Account Settings</h2>
            </div>
            
            {/* List of Settings */}
            <div className="space-y-4">

              {/* Read-Only Profile Information */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">Profile Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                    <span className="text-sm font-bold text-text-primary">Name</span>
                    <span className="text-sm text-text-secondary">{profileData?.name || 'Loading...'}</span>
                  </div>
                  
                  {userRole === 'donor' && (
                    <>
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                        <span className="text-sm font-bold text-text-primary">Age</span>
                        <span className="text-sm text-text-secondary">{profileData?.age || 'Not Provided'}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                        <span className="text-sm font-bold text-text-primary">Gender</span>
                        <span className="text-sm text-text-secondary capitalize">{profileData?.gender || 'Not Provided'}</span>
                      </div>
                    </>
                  )}

                  {userRole === 'bloodbank' && (
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                      <span className="text-sm font-bold text-text-primary">License Number</span>
                      <span className="text-sm text-text-secondary">{profileData?.licenseNumber || 'Loading...'}</span>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">Account Settings</h3>
              
              {/* Open Status Row (Bloodbank only) */}
              {userRole === 'bloodbank' && (
                <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-text-secondary mr-4" />
                    <div>
                      <p className="text-sm font-bold text-text-primary">Organization Open Status</p>
                      <p className="text-sm text-text-secondary">Toggle if your blood bank is currently open</p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer shrink-0">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={profileData?.isOpen !== false} onChange={handleToggleOpenStatus} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${profileData?.isOpen !== false ? 'bg-primary' : 'bg-gray-300'}`} />
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profileData?.isOpen !== false ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="ml-3 text-sm font-bold w-16 text-text-secondary">{profileData?.isOpen !== false ? 'Open' : 'Closed'}</span>
                  </label>
                </div>
              )}
              
              {/* Address Row (Non-OTP) */}
              <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-text-secondary mr-4" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">Address</p>
                    <p className="text-sm text-text-secondary">{profileData?.address || 'Not Provided'}</p>
                  </div>
                </div>
                <button onClick={() => openModal('address')} className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors">
                  <Pen className="w-4 h-4" />
                </button>
              </div>

              {/* Max Travel Distance Row (Donor only, Non-OTP) */}
              {userRole === 'donor' && (
                <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-text-secondary mr-4" />
                    <div>
                      <p className="text-sm font-bold text-text-primary">Max Travel Distance</p>
                      <p className="text-sm text-text-secondary">{profileData?.maxTravelDistanceKm || 10} km</p>
                    </div>
                  </div>
                  <button onClick={() => openModal('maxTravelDistance')} className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors">
                    <Pen className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Email Row */}
              <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-text-secondary mr-4" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">Email Address</p>
                    <p className="text-sm text-text-secondary">{profileData?.email || 'Loading...'}</p>
                  </div>
                </div>
                <button onClick={() => openModal('email')} className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors">
                  <Pen className="w-4 h-4" />
                </button>
              </div>

              {/* Password Row */}
              <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <KeyRound className="w-5 h-5 text-text-secondary mr-4" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">Password</p>
                    <p className="text-sm text-text-secondary font-mono">••••••••</p>
                  </div>
                </div>
                <button onClick={() => openModal('password')} className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors">
                  <Pen className="w-4 h-4" />
                </button>
              </div>

              {/* Phone Row */}
              <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-text-secondary mr-4" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">Phone Number</p>
                    <p className="text-sm text-text-secondary">{profileData?.phone || 'Loading...'}</p>
                  </div>
                </div>
                <button onClick={() => openModal('phone')} className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors">
                  <Pen className="w-4 h-4" />
                </button>
              </div>

              {/* Location Row */}
              <div className="flex items-start justify-between p-5 border border-border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-start w-full overflow-hidden">
                  <MapPin className="w-5 h-5 text-text-secondary mr-4 mt-0.5 flex-shrink-0" />
                  <div className="w-full pr-4">
                    <p className="text-sm font-bold text-text-primary mb-3">Location</p>
                    <div className="h-72 w-full max-w-lg rounded-lg overflow-hidden border border-border z-0 relative shadow-sm">
                      {profileData?.latitude && profileData?.longitude ? (
                        <MapContainer center={[profileData.latitude, profileData.longitude]} zoom={13} zoomControl={false} dragging={false} scrollWheelZoom={false} className="w-full h-full z-0 relative">
                          <FixMapDisplay />
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                          <Marker position={[profileData.latitude, profileData.longitude]} icon={orangeIcon} />
                        </MapContainer>
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-text-secondary">Loading map...</div>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => openModal('location')} className="p-2 bg-white border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors flex-shrink-0">
                  <Pen className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-text-secondary hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 pt-8">
                <h3 className="text-xl font-bold text-text-primary mb-1 capitalize">
                  Edit {activeModal}
                </h3>
                <p className="text-text-secondary text-sm mb-6">
                  {(modalStep === 1 && (activeModal === 'address' || activeModal === 'maxTravelDistance')) 
                    ? `Update your ${activeModal} details. This change takes effect immediately.`
                    : modalStep === 1 
                      ? `Enter your new ${activeModal} details.` 
                      : 'Verify this change with the OTP sent to your current email.'}
                </p>

                {error && (
                  <div className="bg-[#FADBD8] text-critical p-3 rounded-lg text-sm font-medium mb-4 border border-[#F5B7B1]">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="bg-[#D4EFDF] text-accent p-3 rounded-lg text-sm font-medium mb-4 border border-[#A9DFBF]">
                    {success}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {modalStep === 1 ? (
                    <motion.form 
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleInitiate} 
                      className="space-y-4"
                    >
                      {activeModal === 'email' && (
                        <input 
                          type="email" 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary outline-none"
                          placeholder="New Email Address"
                        />
                      )}
                      
                      {activeModal === 'password' && (
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary outline-none"
                          placeholder="New Password (min 8 chars)"
                        />
                      )}

                      {activeModal === 'phone' && (
                        <input 
                          type="tel" 
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary outline-none"
                          placeholder="New Phone Number"
                        />
                      )}

                      {activeModal === 'address' && (
                        <input 
                          type="text" 
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary outline-none"
                          placeholder="New Address/City"
                        />
                      )}

                      {activeModal === 'maxTravelDistance' && (
                        <input 
                          type="number" 
                          value={newMaxTravelDistance}
                          onChange={(e) => setNewMaxTravelDistance(Number(e.target.value))}
                          required
                          min="1"
                          max="1000"
                          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary outline-none"
                          placeholder="Max Travel Distance (km)"
                        />
                      )}

                      {activeModal === 'location' && (
                        <div className="h-64 w-full rounded-xl overflow-hidden border border-border relative z-0">
                          <MapContainer center={newPosition || [30.7333, 76.7794]} zoom={11} scrollWheelZoom={true} className="w-full h-full z-0 relative">
                            <FixMapDisplay />
                            <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            />
                            <LocationMarker position={newPosition} setPosition={setNewPosition} />
                          </MapContainer>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors flex justify-center items-center mt-2 disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : (activeModal === 'address' || activeModal === 'maxTravelDistance' ? 'Save Changes' : 'Initiate Change')} <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleVerify} 
                      className="space-y-4"
                    >
                      <input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full px-4 py-3 text-center tracking-widest text-2xl font-mono rounded-lg border border-border focus:border-primary outline-none"
                        placeholder="000000"
                      />
                      
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-emerald-600 transition-colors flex justify-center items-center mt-2 disabled:opacity-50"
                      >
                        {isLoading ? 'Verifying...' : 'Confirm Update'} <CheckCircle className="w-4 h-4 ml-2" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setModalStep(1)}
                        className="w-full text-text-secondary text-sm font-medium py-2 hover:text-text-primary transition-colors"
                      >
                        Back
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
