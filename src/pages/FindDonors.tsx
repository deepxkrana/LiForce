import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Search, MapPin, Phone, Navigation, X, Mail, Copy, Check, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { API_URL } from '../lib/api';
import L from 'leaflet';

const createCustomIcon = (color: string) =>
  L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 12],
    popupAnchor: [0, -24],
    html: `<span style="background-color:${color};width:24px;height:24px;display:block;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);" />`,
  });

const iconGood = createCustomIcon('#1D9E75');
const iconWarning = createCustomIcon('#E67E22');
const iconCritical = createCustomIcon('#E24B4A');
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];


const MAJOR_INDIAN_CITIES = [
  { name: 'Chandigarh', pincode: '160017', lat: 30.7333, lng: 76.7794 },
  { name: 'Mohali', pincode: '160055', lat: 30.6942, lng: 76.7381 },
  { name: 'Panchkula', pincode: '134109', lat: 30.6915, lng: 76.8537 },
  { name: 'Mumbai', pincode: '400001', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', pincode: '110001', lat: 28.6139, lng: 77.2090 },
  { name: 'Bengaluru', pincode: '560001', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', pincode: '500001', lat: 17.3850, lng: 78.4867 },
  { name: 'Ahmedabad', pincode: '380001', lat: 23.0225, lng: 72.5714 },
  { name: 'Chennai', pincode: '600001', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', pincode: '700001', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', pincode: '411001', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur', pincode: '302001', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', pincode: '226001', lat: 26.8467, lng: 80.9462 },
  { name: 'Patna', pincode: '800001', lat: 25.5941, lng: 85.1376 },
  { name: 'Indore', pincode: '452001', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', pincode: '462001', lat: 23.2599, lng: 77.4126 },
  { name: 'Surat', pincode: '395003', lat: 21.1702, lng: 72.8311 },
  { name: 'Nagpur', pincode: '440001', lat: 21.1458, lng: 79.0882 },
  { name: 'Visakhapatnam', pincode: '530001', lat: 17.6868, lng: 83.2185 },
  { name: 'Kanpur', pincode: '208001', lat: 26.4499, lng: 80.3319 },
  { name: 'Ludhiana', pincode: '141001', lat: 30.9010, lng: 75.8573 },
  { name: 'Amritsar', pincode: '143001', lat: 31.6340, lng: 74.8723 },
];

const ChangeMapView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
};

const LocationPicker = ({ position }: any) => {
  return position ? (
    <Marker 
      position={position} 
      icon={iconCritical} 
      draggable={false}
    >
      <Popup>
        <div className="text-center">
          <strong>Your Location</strong>
        </div>
      </Popup>
    </Marker>
  ) : null;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;  
  const dLon = (lon2 - lon1) * Math.PI / 180; 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};

const FindDonors: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const role = localStorage.getItem('liforce_role');
    if (role !== 'bloodbank') {
      navigate('/');
    }
  }, [navigate]);
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [selectedUrgency, setSelectedUrgency] = useState('Normal');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [distance, setDistance] = useState(10);
  const [openNow, setOpenNow] = useState(false);
  const [searchGroup, setSearchGroup] = useState(searchParams.get('group') || '');
  const [searchCity, setSearchCity] = useState(searchParams.get('city') || 'Chandigarh');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const filteredCities = useMemo(() => {
    if (!searchCity.trim()) return MAJOR_INDIAN_CITIES;
    const query = searchCity.toLowerCase();
    return MAJOR_INDIAN_CITIES.filter(
      (c) => c.name.toLowerCase().includes(query) || c.pincode.includes(query)
    );
  }, [searchCity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [banks, setBanks] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.7333, 76.7794]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Premium modal states
  const [selectedContactBank, setSelectedContactBank] = useState<any | null>(null);
  const [selectedRequestBank, setSelectedRequestBank] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);


  const [requestForm, setRequestForm] = useState({
    bloodGroup: 'A+',
    unitsRequired: 1,
    deliveryMode: 'Self-Collection',
    deliveryAddress: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00',
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    urgencyLevel: 'Normal',
    contactNumber: '',
  });

  const isLoggedIn = !!localStorage.getItem('liforce_token');

  // Load user data if logged in to autofill contact number
  useEffect(() => {
    if (isLoggedIn) {
      const fetchBankProfile = async () => {
        try {
          const token = localStorage.getItem('liforce_token');
          const res = await fetch(`${API_URL}/bloodbanks/me/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.bank?.latitude && data.bank?.longitude) {
              setMapCenter([data.bank.latitude, data.bank.longitude]);
              setUserLocation([data.bank.latitude, data.bank.longitude]);
            }
          }
        } catch (err) {
          console.warn('Could not pre-fetch bank info', err);
        }
      };
      fetchBankProfile();
    }
  }, [isLoggedIn]);

  // Set default requested blood group when a blood bank is selected
  useEffect(() => {
    if (selectedRequestBank) {
      if (selectedGroups.length > 0) {
        setRequestForm(prev => ({ ...prev, bloodGroup: selectedGroups[0] }));
      } else if (searchGroup) {
        setRequestForm(prev => ({ ...prev, bloodGroup: searchGroup }));
      } else if (selectedRequestBank.bloodGroups?.length > 0) {
        setRequestForm(prev => ({ ...prev, bloodGroup: selectedRequestBank.bloodGroups[0].type }));
      } else {
        setRequestForm(prev => ({ ...prev, bloodGroup: 'A+' }));
      }
    }
  }, [selectedRequestBank, selectedGroups, searchGroup]);

  useEffect(() => {
    const g = searchParams.get('group');
    const c = searchParams.get('city');
    if (g) {
      setSearchGroup(g);
      setSelectedGroups([g]);
    }
    if (c) setSearchCity(c);
  }, [searchParams]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch(`${API_URL}/donors`);
        const data = await response.json();
        const formatted = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            address: d.city || 'Unknown City',
            lat: d.latitude || 30.7333,
            lng: d.longitude || 76.7794,
            distance: 'Nearby',
            phone: '',
            email: '',
            licenseNumber: '',
            openNow: true,
            status: d.status || 'Good',
            bloodGroups: [{
              type: d.bloodGroup,
              count: 1,
              status: d.status || 'Good'
            }],
        }));
        setBanks(formatted);
      } catch {
        showToast('Could not load donors. Is the backend running?', 'error');
      }
    };
    fetchBanks();
  }, [showToast]);

  const filteredBanks = useMemo(() => {
    return banks.map(bank => {
      const dist = bank.lat && bank.lng 
        ? calculateDistance(mapCenter[0], mapCenter[1], bank.lat, bank.lng) 
        : Infinity;
      return { ...bank, calculatedDistance: dist };
    }).filter((bank) => {
      if (bank.calculatedDistance > distance) return false;
      if (openNow && !bank.openNow) return false;
      if (selectedGroups.length > 0) {
        const hasGroup = bank.bloodGroups.some((bg: any) => selectedGroups.includes(bg.type));
        if (!hasGroup) return false;
      }
      if (searchGroup && !bank.bloodGroups.some((bg: any) => bg.type === searchGroup)) return false;
      return true;
    }).sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }, [banks, openNow, searchCity, selectedGroups, searchGroup, distance, mapCenter]);

  const toggleGroup = (bg: string) => {
    setSelectedGroups((prev) =>
      prev.includes(bg) ? prev.filter((g) => g !== bg) : [...prev, bg]
    );
  };

  const clearFilters = () => {
    setSelectedGroups([]);
    setSearchGroup('');
    setOpenNow(false);
    setDistance(10);
    setSearchCity('');
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in your browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        showToast('Map centered on your location.', 'success');
      },
      () => showToast('Could not access your location.', 'error')
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-critical text-white border-critical';
      case 'Low': return 'bg-warning text-white border-warning';
      case 'Good': return 'bg-accent text-white border-accent';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getBankMarkerIcon = (status: string) => {
    if (status === 'Critical') return iconCritical;
    if (status === 'Warning') return iconWarning;
    return iconGood;
  };

  const handleSearch = () => {
    if (searchGroup && !selectedGroups.includes(searchGroup)) {
      setSelectedGroups(searchGroup ? [searchGroup] : []);
    }
    showToast(`Showing ${filteredBanks.length} donor(s)`, 'info');
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    showToast(`${field} copied to clipboard!`, 'success');
  };



  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <div className="bg-surface border-b border-border py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-text-primary mb-6">Find donors near you</h1>
          <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col lg:flex-row gap-3 items-stretch">
            <div className="flex-1 flex items-center px-4 py-3 bg-background rounded-lg border border-border min-h-[48px]">
              <span className="text-primary font-bold mr-3 text-sm shrink-0">ABO</span>
              <select
                value={searchGroup}
                onChange={(e) => setSearchGroup(e.target.value)}
                className="w-full bg-transparent outline-none text-text-primary"
              >
                <option value="">Any Blood Group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div
              ref={cityDropdownRef}
              className="flex-1 flex items-center px-4 py-3 bg-background rounded-lg border border-border relative min-h-[48px]"
            >
              <MapPin className="text-text-secondary mr-3 h-5 w-5 shrink-0" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => {
                  setSearchCity(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowCityDropdown(false);
                  }
                }}
                placeholder="City or Pincode"
                className="w-full bg-transparent outline-none text-text-primary pr-10"
              />
              <button
                type="button"
                onClick={handleGeolocation}
                className="absolute right-3 text-primary hover:text-primary-dark z-10"
                aria-label="Use my location"
              >
                <Navigation className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {showCityDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-md border border-border shadow-lg rounded-xl max-h-60 overflow-y-auto z-50 py-1.5"
                    style={{
                      scrollbarWidth: 'thin',
                    }}
                  >
                    {filteredCities.length === 0 ? (
                      <div className="px-4 py-2.5 text-sm text-text-secondary italic">
                        No major cities found
                      </div>
                    ) : (
                      filteredCities.map((city) => (
                        <button
                          key={`${city.name}-${city.pincode}`}
                          type="button"
                          onClick={() => {
                            setSearchCity(city.name);
                            setMapCenter([city.lat, city.lng]);
                            setShowCityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-light hover:text-primary transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                            {city.name}
                          </span>
                          <span className="text-xs text-text-secondary bg-gray-100 group-hover:bg-primary/10 group-hover:text-primary px-2 py-0.5 rounded transition-all">
                            {city.pincode}
                          </span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex bg-background rounded-lg border border-border p-1 shrink-0">
              {['Normal', 'Urgent', 'Emergency'].map((urgency) => (
                <button
                  key={urgency}
                  type="button"
                  onClick={() => {
                    setSelectedUrgency(urgency);
                    if (urgency === 'Emergency') navigate('/emergency');
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    selectedUrgency === urgency
                      ? urgency === 'Emergency'
                        ? 'bg-critical text-white'
                        : urgency === 'Urgent'
                        ? 'bg-warning text-white'
                        : 'bg-surface shadow-sm text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {urgency}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center justify-center shrink-0"
            >
              <Search className="h-5 w-5 mr-2" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-16 shrink-0">
        <div className="flex flex-col lg:flex-row bg-surface border border-border rounded-2xl shadow-sm overflow-hidden min-h-0 lg:h-[680px] relative z-10">
          <div className="w-full lg:w-[400px] xl:w-[420px] bg-surface flex flex-col border-b lg:border-b-0 lg:border-r border-border h-full shrink-0">
            <div className="p-4 border-b border-border bg-background shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text-primary">Filters</h3>
                <button type="button" onClick={clearFilters} className="text-sm text-primary font-medium hover:underline">
                  Clear all
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-text-secondary mb-2">Blood Group</p>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => toggleGroup(bg)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        selectedGroups.includes(bg)
                          ? 'bg-primary text-white'
                          : 'bg-white border border-border text-text-secondary hover:border-primary'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-secondary mb-2">Distance: {distance} km</p>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={distance}
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <label className="flex items-center cursor-pointer shrink-0">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={openNow} onChange={() => setOpenNow(!openNow)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${openNow ? 'bg-primary' : 'bg-gray-300'}`} />
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${openNow ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="ml-3 text-sm font-medium text-text-secondary">Open now</span>
                </label>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-background min-h-[300px] lg:min-h-0 overscroll-contain">
              {filteredBanks.length === 0 && (
                <p className="text-center text-text-secondary mt-10">No donors match your filters..</p>
              )}
              {filteredBanks.map((bank, index) => (
                <motion.div
                  key={bank.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-surface rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-text-primary text-lg leading-tight">{bank.name}</h3>
                      <p className="text-text-secondary text-sm flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{bank.calculatedDistance === Infinity ? 'Unknown distance' : `${bank.calculatedDistance?.toFixed(1)} km`} · {bank.address}</span>
                      </p>
                    </div>
                    {bank.openNow && (
                      <span className="bg-[#E8F5F1] text-accent text-xs px-2 py-1 rounded font-medium shrink-0">Open</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bank.bloodGroups.length ? (
                      bank.bloodGroups.map((bg: any, i: number) => (
                        <div key={i} className={`flex items-center text-xs px-2 py-1 rounded-md border ${getStatusColor(bg.status)}`}>
                          <span className="font-bold mr-1">{bg.type}</span>
                          <span>{bg.count} units</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-text-secondary italic">Inventory unavailable</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedContactBank(bank)}
                      className="flex-1 border border-border text-text-primary py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center cursor-pointer"
                    >
                      <Phone className="h-4 w-4 mr-2" /> Contact
                    </button>
                    
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex-grow min-h-[400px] lg:h-full relative bg-gray-100">
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="w-full h-full">
              <ChangeMapView center={mapCenter} />
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <LocationPicker position={userLocation} />
              {filteredBanks.map((bank) => (
                <Marker key={bank.id} position={[bank.lat, bank.lng]} icon={iconGood}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <h3 className="font-bold text-sm mb-1">{bank.name}</h3>
                      <p className="text-xs text-text-secondary mb-2 leading-tight">{bank.address}</p>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedContactBank(bank)}
                          className="w-full border border-border text-text-primary py-1.5 rounded text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Phone className="h-3.5 w-3.5" /> Contact
                        </button>
                        
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Contact Details Modal */}
      <AnimatePresence>
        {selectedContactBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContactBank(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden p-6 relative z-10"
            >
              <button
                type="button"
                onClick={() => setSelectedContactBank(null)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-xl leading-tight">Contact Information</h3>
                  <p className="text-text-secondary text-xs mt-0.5">Get in touch directly with the blood bank</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-primary-light p-4 rounded-xl border border-primary/10 mb-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-primary">Donor Profile</span>
                  <h4 className="font-bold text-text-primary text-lg mt-0.5 leading-snug">{selectedContactBank.name}</h4>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-border hover:border-gray-300 transition-colors">
                  <a href={`tel:${selectedContactBank.phone}`} className="flex items-center gap-3 flex-grow cursor-pointer group">
                    <div className="bg-white p-2 rounded-lg border border-border text-text-secondary group-hover:text-primary transition-colors">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary">Phone Number</p>
                      <p className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors truncate">{selectedContactBank.phone || 'N/A'}</p>
                    </div>
                  </a>
                  {selectedContactBank.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedContactBank.phone, 'Phone')}
                      className="p-2 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                      title="Copy Phone"
                    >
                      {copiedField === 'Phone' ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-border hover:border-gray-300 transition-colors">
                  <a href={`mailto:${selectedContactBank.email}`} className="flex items-center gap-3 flex-grow cursor-pointer group">
                    <div className="bg-white p-2 rounded-lg border border-border text-text-secondary group-hover:text-primary transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary">Email Address</p>
                      <p className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors truncate">{selectedContactBank.email || 'N/A'}</p>
                    </div>
                  </a>
                  {selectedContactBank.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedContactBank.email, 'Email')}
                      className="p-2 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                      title="Copy Email"
                    >
                      {copiedField === 'Email' ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-border hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 flex-grow">
                    <div className="bg-white p-2 rounded-lg border border-border text-text-secondary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary">Government License Number</p>
                      <p className="font-bold text-text-primary text-sm truncate">{selectedContactBank.licenseNumber || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedContactBank.licenseNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedContactBank.licenseNumber, 'License')}
                      className="p-2 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                      title="Copy License"
                    >
                      {copiedField === 'License' ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-border hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 flex-grow">
                    <div className="bg-white p-2 rounded-lg border border-border text-text-secondary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary">Physical Address</p>
                      <p className="font-semibold text-text-primary text-xs leading-normal mt-0.5">{selectedContactBank.address || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedContactBank.address && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedContactBank.address, 'Address')}
                      className="p-2 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      {copiedField === 'Address' ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex gap-3">
                <a
                  href={`tel:${selectedContactBank.phone}`}
                  className="flex-1 bg-primary text-white text-center py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" /> Call Now
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedContactBank(null)}
                  className="flex-1 border border-border text-text-primary py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Blood Modal Removed */}

          </div>
  );
};

export default FindDonors;

