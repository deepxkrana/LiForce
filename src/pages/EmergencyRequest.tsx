import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, Send, MapPin, Activity, Navigation, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link, useLocation } from 'react-router-dom';
import { API_URL, fetchWithAuth } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { getDashboardPath } from '../lib/auth';

const formSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  patientGender: z.string().min(1, "Please select a gender"),
  patientAge: z.string().refine(val => { const parsed = parseInt(val); return !isNaN(parsed) && parsed > 0 && parsed <= 125; }, "Please enter a valid age (1-125)"),
  bloodGroup: z.string().min(1, "Please select a blood group"),
  unitsRequired: z.string().refine(val => parseInt(val) > 0, "At least 1 unit is required"),
  hospitalAddress: z.string().min(2, "Hospital name/address is required"),
  contactNumber: z.string().min(10, "Valid contact number is required"),
  urgencyLevel: z.enum(["Critical", "Urgent", "Planned"]),
  requiredWithin: z.string().min(1, "Please select required timeframe"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Real Matched donors will be fetched here

// Map Icon
const createStatusIcon = (status: string) => {
  const color = status === 'Responding' ? '#1D9E75' : status === 'Notified' ? '#E67E22' : '#9CA3AF';
  return L.divIcon({
    className: "donor-pin",
    iconAnchor: [0, 12],
    popupAnchor: [0, -24],
    html: `<span style="background-color: ${color}; width: 20px; height: 20px; display: block; left: -10px; top: -10px; position: relative; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></span>`
  });
};

const EmergencyRequest: React.FC = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const hospitalFromState = (location.state as { hospitalAddress?: string })?.hospitalAddress;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [matchedDonors, setMatchedDonors] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLat, setUserLat] = useState(30.7333);
  const [userLng, setUserLng] = useState(76.7794);

  useEffect(() => {
    const fetchUserLocation = async () => {
      const role = localStorage.getItem('liforce_role');
      if (!role) return;
      try {
        const endpoint = role === 'bloodbank' ? '/bloodbanks/me/dashboard' : '/donors/me';
        const response = await fetchWithAuth(`${API_URL}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          const lat = role === 'bloodbank' ? data.bank?.latitude : data.latitude;
          const lng = role === 'bloodbank' ? data.bank?.longitude : data.longitude;
          if (lat && lng) {
            setUserLat(lat);
            setUserLng(lng);
          }
        }
      } catch (err) {
        console.error("Failed to fetch location", err);
      }
    };
    fetchUserLocation();
  }, []);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urgencyLevel: "Critical",
      unitsRequired: "1",
      hospitalAddress: hospitalFromState || "",
      patientGender: "",
      patientAge: "",
      requiredWithin: "24",
    }
  });

  const bloodGroup = watch('bloodGroup');
  const urgencyLevel = watch('urgencyLevel');

  useEffect(() => {
    if (hospitalFromState) setValue('hospitalAddress', hospitalFromState);
  }, [hospitalFromState, setValue]);

  // Simulate auto-refresh of donors
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Fetch real matched donors when blood group changes
  useEffect(() => {
    const fetchMatches = async () => {
      if (!bloodGroup) {
        setMatchedDonors([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetchWithAuth(`${API_URL}/match/emergency`, {
          method: 'POST',
          body: JSON.stringify({
            bloodGroup,
            latitude: userLat,
            longitude: userLng
          })
        });
        if (response.ok) {
          const data = await response.json();
          // The API returns { matchCount, donors }
          const donorsWithMockStatus = (data.donors || []).map((d: any) => ({
            ...d,
            status: 'Notified', // Real status would be driven by Notifications/Websockets
            distance: d.distanceKm + ' km',
            group: bloodGroup
          }));
          setMatchedDonors(donorsWithMockStatus);
        }
      } catch (err) {
        console.error("Failed to fetch matches", err);
      } finally {
        setIsSearching(false);
      }
    };
    
    // Add a small debounce
    const timer = setTimeout(() => {
      fetchMatches();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [bloodGroup, refreshKey, userLat, userLng]);

  const onSubmit = async (data: FormData) => {
    try {
      const token = localStorage.getItem('liforce_userId');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const now = new Date();
      const requiredHours = parseInt(data.requiredWithin);
      now.setHours(now.getHours() + requiredHours);

      const response = await fetch(`${API_URL}/emergencies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...data,
          latitude: userLat,
          longitude: userLng,
          requiredDate: now.toISOString(),
        })
      });
      
      if (response.ok) {
        // Confetti effect but with red/urgent colors
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C0392B', '#E24B4A', '#F5B7B1']
        });
        setIsSubmitted(true);
      } else {
        showToast('Failed to submit emergency request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred. Please try again.', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Responding': return <span className="bg-[#E8F5F1] text-accent text-xs px-2 py-1 rounded font-bold">Responding</span>;
      case 'Notified': return <span className="bg-[#FEF5E7] text-warning text-xs px-2 py-1 rounded font-bold">Notified</span>;
      case 'Unavailable': return <span className="bg-gray-100 text-text-secondary text-xs px-2 py-1 rounded font-bold">Unavailable</span>;
      default: return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background pt-20">
                <div className="flex-grow flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface p-10 rounded-2xl border border-critical shadow-2xl shadow-red-500/10 max-w-lg w-full text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-critical"></div>
            <div className="w-24 h-24 bg-[#FADBD8] rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <span className="absolute inset-0 bg-critical opacity-20 rounded-full animate-ping"></span>
              <Activity className="h-12 w-12 text-critical relative z-10" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Alert Broadcasted!</h2>
            <p className="text-text-secondary mb-8">
              Your emergency request has been sent to <strong>{matchedDonors.length} matched donors/banks</strong> near you.
            </p>
            <div className="bg-primary-light p-4 rounded-xl mb-8 border border-[#F5B7B1] text-left">
              <p className="text-sm font-bold text-primary-dark mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> Live Status
              </p>
              <p className="text-sm text-primary">{Math.min(matchedDonors.length, 2)} donor(s) notified. We will alert you when someone responds.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to={getDashboardPath()} className="w-full bg-critical text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors text-center">
                Track Request Status
              </Link>
              <button type="button" onClick={() => setIsSubmitted(false)} className="w-full bg-white border border-border text-text-primary font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors">
                Create Another Alert
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pt-20">
            
      {/* Thin Red Top Banner */}
      <div className="bg-critical text-white py-2 px-4 text-center text-sm font-bold flex items-center justify-center shadow-md z-10 relative">
        <span className="flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        This alert will be sent to all nearby matched donors and blood banks instantly.
      </div>

      <div className="flex-grow max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column - Request Form */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary flex items-center">
              <Activity className="h-8 w-8 text-critical mr-3" /> Emergency Request
            </h1>
            <p className="text-text-secondary mt-2">Fill out this form to broadcast an SOS alert for blood.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-surface rounded-2xl border-2 border-[#F5B7B1] shadow-lg shadow-red-500/5 p-6 sm:p-8 flex-grow">
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Patient Name</label>
                <input 
                  {...register('patientName')} 
                  className={`w-full px-4 py-3 rounded-lg border ${errors.patientName ? 'border-critical' : 'border-border focus:border-critical'} bg-background outline-none transition-colors`}
                  placeholder="Enter patient name"
                />
                {errors.patientName && <p className="text-critical text-xs mt-1">{errors.patientName.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Patient Age</label>
                  <input 
                    type="number"
                    {...register('patientAge')} 
                    className={`w-full px-4 py-3 rounded-lg border ${errors.patientAge ? 'border-critical' : 'border-border focus:border-critical'} bg-background outline-none transition-colors`}
                    placeholder="e.g. 28"
                  />
                  {errors.patientAge && <p className="text-critical text-xs mt-1">{errors.patientAge.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Patient Gender</label>
                  <select 
                    {...register('patientGender')} 
                    className={`w-full px-4 py-3 rounded-lg border ${errors.patientGender ? 'border-critical' : 'border-border focus:border-critical'} bg-background outline-none transition-colors`}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.patientGender && <p className="text-critical text-xs mt-1">{errors.patientGender.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">Blood Group Required</label>
                <div className="grid grid-cols-4 gap-3">
                  {BLOOD_GROUPS.map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setValue('bloodGroup', bg, { shouldValidate: true })}
                      className={`py-3 rounded-lg border-2 font-bold transition-all ${
                        bloodGroup === bg 
                          ? 'bg-critical border-critical text-white shadow-md' 
                          : 'bg-background border-border text-text-secondary hover:border-critical'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                {errors.bloodGroup && <p className="text-critical text-xs mt-2">{errors.bloodGroup.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Units Required</label>
                  <input 
                    type="number"
                    {...register('unitsRequired')} 
                    className={`w-full px-4 py-3 rounded-lg border ${errors.unitsRequired ? 'border-critical' : 'border-border focus:border-critical'} bg-background outline-none transition-colors`}
                  />
                  {errors.unitsRequired && <p className="text-critical text-xs mt-1">{errors.unitsRequired.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">Contact Number</label>
                  <input 
                    {...register('contactNumber')} 
                    className={`w-full px-4 py-3 rounded-lg border ${errors.contactNumber ? 'border-critical' : 'border-border focus:border-critical'} bg-background outline-none transition-colors`}
                    placeholder="Mobile number"
                  />
                  {errors.contactNumber && <p className="text-critical text-xs mt-1">{errors.contactNumber.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Hospital Name & Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                  <input 
                    {...register('hospitalAddress')} 
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border ${errors.hospitalAddress ? 'border-critical' : 'border-border focus:border-critical'} bg-background outline-none transition-colors`}
                    placeholder="Search hospital or enter address"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        showToast('Geolocation not supported.', 'error');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        () => showToast('Location captured. Enter hospital name above.', 'success'),
                        () => showToast('Could not access location.', 'error')
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-critical p-1"
                    aria-label="Use my location"
                  >
                    <Navigation className="h-4 w-4" />
                  </button>
                </div>
                {errors.hospitalAddress && <p className="text-critical text-xs mt-1">{errors.hospitalAddress.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-3">Urgency Level</label>
                  <div className="flex bg-background rounded-lg border border-border p-1">
                    {['Critical', 'Urgent', 'Planned'].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setValue('urgencyLevel', level as any)}
                        className={`flex-1 py-3 rounded-md text-sm font-bold transition-all ${
                          urgencyLevel === level 
                            ? level === 'Critical' ? 'bg-critical text-white shadow-md' : 
                              level === 'Urgent' ? 'bg-warning text-white shadow-md' : 
                              'bg-surface text-text-primary shadow-md border border-border'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-3">Required Within</label>
                  <select 
                    {...register('requiredWithin')} 
                    className={`w-full px-4 py-3.5 rounded-lg border ${errors.requiredWithin ? 'border-critical' : 'border-border focus:border-critical'} bg-background outline-none transition-colors`}
                  >
                    <option value="1">Within 1 Hour</option>
                    <option value="2">Within 2 Hours</option>
                    <option value="3">Within 3 Hours</option>
                    <option value="6">Within 6 Hours</option>
                    <option value="12">Within 12 Hours</option>
                    <option value="24">Within 1 Day</option>
                    <option value="48">Within 2 Days</option>
                    <option value="72">Within 3 Days</option>
                    <option value="168">Within 1 Week</option>
                  </select>
                  {errors.requiredWithin && <p className="text-critical text-xs mt-1">{errors.requiredWithin.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">Additional Notes (Optional)</label>
                <textarea 
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border focus:border-critical bg-background outline-none transition-colors resize-none"
                  placeholder="Any specific instructions for donors..."
                ></textarea>
              </div>

              <div className="pt-4 border-t border-border mt-6">
                <button 
                  type="submit"
                  className="w-full bg-critical text-white font-bold text-lg py-4 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center group"
                >
                  <Send className="h-6 w-6 mr-2 group-hover:translate-x-1 transition-transform" /> Send emergency alert
                </button>
                <p className="text-xs text-text-secondary text-center mt-3 flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> Alert will be sent via SMS, WhatsApp & Push notification to donors within 10 km.
                </p>
              </div>

            </div>
          </form>
        </div>

        {/* Right Column - Live Map & Donors */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 flex flex-col h-[600px] lg:h-auto lg:flex-grow">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-text-primary flex items-center">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                Live Matched Donors
              </h3>
              <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded border border-border">
                {isSearching ? 'Searching...' : 'Auto-refreshes in 30s'}
              </span>
            </div>

            {/* Map Area */}
            <div className="h-[300px] rounded-xl overflow-hidden border border-border relative z-0 mb-6 shrink-0">
              <MapContainer 
                key={`${refreshKey}-${userLat}-${userLng}`}
                center={[userLat, userLng]} 
                zoom={12} 
                scrollWheelZoom={false} 
                className="w-full h-full"
                zoomControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                
                {/* User/Hospital Pin */}
                <Marker position={[userLat, userLng]} icon={createStatusIcon('Critical')}>
                  <Popup>Requested Location</Popup>
                </Marker>

                {/* Donor Pins */}
                {matchedDonors.map(donor => (
                  <Marker 
                    key={donor.id} 
                    position={[donor.latitude, donor.longitude]}
                    icon={createStatusIcon(donor.status)}
                  >
                    <Popup className="custom-popup">
                      <div className="font-bold text-sm">{donor.name} ({donor.group})</div>
                      <div className="text-xs text-text-secondary">{donor.distance}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Donor List */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
              {matchedDonors.map((donor) => (
                <div key={donor.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-[#F5B7B1] transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mr-3 shrink-0">
                      {donor.type === 'BloodBank' ? <Building2 className="w-5 h-5" /> : donor.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary text-sm">{donor.name}</h4>
                      <div className="flex items-center text-xs text-text-secondary mt-0.5">
                        {donor.type === 'BloodBank' && <span className="font-bold text-accent mr-2">Blood Bank</span>}
                        <span className="font-bold text-primary mr-2">{donor.group}</span>
                        <span>{donor.distance}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {getStatusBadge(donor.status)}
                  </div>
                </div>
              ))}
              
              {bloodGroup && matchedDonors.length === 0 && !isSearching && (
                <div className="text-center p-6 bg-background rounded-xl border border-dashed border-border">
                  <p className="text-sm text-text-secondary">No exact matches found nearby yet. We will expand the search radius upon broadcasting.</p>
                </div>
              )}
              
              {!bloodGroup && (
                <div className="text-center p-6 bg-background rounded-xl border border-dashed border-border">
                  <p className="text-sm text-text-secondary">Select a blood group to see live matched donors.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default EmergencyRequest;
