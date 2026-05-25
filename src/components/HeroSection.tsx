import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_URL } from '../lib/api';

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

const createCustomIcon = (color: string) =>
  L.divIcon({
    className: 'my-custom-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: `<span style="background-color:${color};width:24px;height:24px;display:block;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);" />`,
  });

const iconGood = createCustomIcon('#1D9E75');
const iconWarning = createCustomIcon('#E67E22');
const iconCritical = createCustomIcon('#E24B4A');

const orangeIcon = L.divIcon({
  className: "custom-pin-user",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
  tooltipAnchor: [0, -12],
  html: `<span style="background-color: #F59E0B; width: 24px; height: 24px; display: block; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></span>`
});

const getBankMarkerIcon = (status: string) => {
  if (status === 'Critical') return iconCritical;
  if (status === 'Warning') return iconWarning;
  return iconGood;
};

interface ActiveAlert {
  id: string;
  lat: number;
  lng: number;
  group: string;
  status: string;
}

const INITIAL_ALERTS: ActiveAlert[] = [
  { id: 'alert-1', lat: 30.745, lng: 76.765, group: 'A+', status: 'Good' },
  { id: 'alert-2', lat: 30.722, lng: 76.802, group: 'O-', status: 'Critical' },
  { id: 'alert-3', lat: 30.755, lng: 76.785, group: 'B+', status: 'Warning' },
];

const createAlertIcon = (group: string, status: string) => {
  const color = status === 'Critical' ? '#E24B4A' : status === 'Warning' ? '#E67E22' : '#1D9E75';
  return L.divIcon({
    className: 'alert-leaflet-pin',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white shadow-lg animate-bounce" style="border-color: ${color}; color: ${color}; font-weight: 800; font-size: 13px; font-family: 'Inter', sans-serif;">
        <span class="absolute inset-0 rounded-full animate-ping opacity-25" style="background-color: ${color};"></span>
        ${group}
      </div>
    `,
  });
};

const DEFAULT_BANKS = [
  {
    id: 'default-1',
    name: 'Rotary Blood Bank',
    address: 'Sector 37, Chandigarh',
    lat: 30.7342,
    lng: 76.7582,
    phone: '0172-2606555',
    status: 'Good',
    bloodGroups: [
      { type: 'A+', count: 18, status: 'Good' },
      { type: 'O-', count: 1, status: 'Critical' },
      { type: 'B+', count: 25, status: 'Good' }
    ]
  },
  {
    id: 'default-2',
    name: 'PGIMER Blood Center',
    address: 'Sector 12, Chandigarh',
    lat: 30.7628,
    lng: 76.7766,
    phone: '0172-2747585',
    status: 'Critical',
    bloodGroups: [
      { type: 'A+', count: 32, status: 'Good' },
      { type: 'O-', count: 0, status: 'Critical' },
      { type: 'B+', count: 12, status: 'Low' }
    ]
  },
  {
    id: 'default-3',
    name: 'Civil Hospital Blood Bank',
    address: 'Sector 6, Panchkula',
    lat: 30.6974,
    lng: 76.8488,
    phone: '0172-2560427',
    status: 'Warning',
    bloodGroups: [
      { type: 'A+', count: 8, status: 'Low' },
      { type: 'O-', count: 3, status: 'Low' },
      { type: 'B+', count: 19, status: 'Good' }
    ]
  }
];

const ChangeMapView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [bloodGroup, setBloodGroup] = useState('');
  const [location, setLocation] = useState('');
  const userRole = localStorage.getItem('liforce_role');
  const [banks, setBanks] = useState<any[]>(DEFAULT_BANKS);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const filteredCities = useMemo(() => {
    if (!location.trim()) return MAJOR_INDIAN_CITIES;
    const query = location.toLowerCase();
    return MAJOR_INDIAN_CITIES.filter(
      (c) => c.name.toLowerCase().includes(query) || c.pincode.includes(query)
    );
  }, [location]);

  useEffect(() => {
    const fetchUserLocation = async () => {
      const token = localStorage.getItem('liforce_userId');
      const role = localStorage.getItem('liforce_role');
      
      if (token && role) {
        try {
          const endpoint = role === 'bloodbank' ? '/bloodbanks/me/dashboard' : '/donors/me';
          const res = await fetch(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const userData = role === 'bloodbank' ? data.bank : data;
            
            if (userData?.latitude && userData?.longitude) {
              setUserLocation([userData.latitude, userData.longitude]);
              return; 
            } else if (role === 'bloodbank') {
              // Blood banks are fixed facilities. Prevent falling back to browser GPS 
              // which could be different. Use the same fallback as fetchBanks to perfectly overlap.
              setUserLocation([30.7333, 76.7794]);
              return;
            }
          }
        } catch (e) {
          console.error('Failed to fetch user location from DB', e);
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation([position.coords.latitude, position.coords.longitude]);
          },
          (error) => console.warn('Geolocation blocked or failed:', error)
        );
      }
    };
    fetchUserLocation();
  }, []);

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

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch(`${API_URL}/bloodbanks`);
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          let formatted = data.map((b: any) => {
            let overallStatus = 'Good';
            if (b.inventory?.length) {
              const criticalCount = b.inventory.filter((i: any) => i.status === 'Critical').length;
              if (criticalCount > 2) overallStatus = 'Critical';
              else if (criticalCount > 0) overallStatus = 'Warning';
            } else overallStatus = 'Warning';

            return {
              id: b.id || Math.random().toString(),
              name: b.name,
              address: b.address,
              lat: b.latitude || 30.7333,
              lng: b.longitude || 76.7794,
              phone: b.phone || '',
              status: overallStatus,
              bloodGroups: (b.inventory || []).map((inv: any) => ({
                type: inv.bloodGroup,
                count: inv.unitsAvailable,
                status: inv.status,
              })),
            };
          });

          if (formatted.length < 3) {
            const padCount = 3 - formatted.length;
            const mockBanks = DEFAULT_BANKS.slice(0, padCount).map(b => ({ ...b }));
            formatted = [...formatted, ...mockBanks];
          }

          setBanks(formatted);
        }
      } catch (error) {
        console.warn('Could not fetch live blood banks. Using premium mock fallback data.', error);
      }
    };
    fetchBanks();
  }, []);

  const [alerts, setAlerts] = useState<ActiveAlert[]>(INITIAL_ALERTS);

  useEffect(() => {
    const centerLat = userLocation?.[0] || 30.7333;
    const centerLng = userLocation?.[1] || 76.7794;

    // Immediately snap any mock banks to the new center
    setBanks(prevBanks => {
      if (prevBanks.some(b => b.id?.toString().startsWith('default'))) {
        return prevBanks.map((bank, index) => {
          if (bank.id?.toString().startsWith('default')) {
            const offsets = [
              { lat: 0.015, lng: 0.02 },
              { lat: -0.02, lng: 0.01 },
              { lat: 0.01, lng: -0.02 }
            ];
            const offset = offsets[index % 3];
            return {
              ...bank,
              lat: centerLat + offset.lat,
              lng: centerLng + offset.lng
            };
          }
          return bank;
        });
      }
      return prevBanks;
    });

    // Immediately snap existing alerts to the new center
    setAlerts(prev => prev.map(a => ({
      ...a,
      lat: centerLat + (Math.random() - 0.5) * 0.06,
      lng: centerLng + (Math.random() - 0.5) * 0.06,
    })));

    const interval = setInterval(() => {
      setAlerts((prevAlerts) => {
        const indexToUpdate = Math.floor(Math.random() * prevAlerts.length);
        const nextAlerts = [...prevAlerts];
        
        const latOffset = (Math.random() - 0.5) * 0.06;
        const lngOffset = (Math.random() - 0.5) * 0.06;
        
        const randomGroup = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
        const statuses = ['Critical', 'Warning', 'Good'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        nextAlerts[indexToUpdate] = {
          id: prevAlerts[indexToUpdate].id,
          lat: centerLat + latOffset,
          lng: centerLng + lngOffset,
          group: randomGroup,
          status: randomStatus,
        };
        
        return nextAlerts;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [userLocation]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (bloodGroup) params.set('group', bloodGroup);
    if (location.trim()) params.set('city', location.trim());
    navigate(`/find-blood${params.toString() ? `?${params}` : ''}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="relative pt-8 pb-20 bg-background z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-12">
          <div className="w-full lg:w-[58%] flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-3 py-1 rounded-full bg-primary-light text-primary-dark font-medium text-sm mb-6"
            >
              <span className="mr-2">🩸</span> India's #1 Blood Platform
            </motion.div>

            <motion.h1
              variants={container}
              initial="hidden"
              animate="show"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-6 leading-tight"
            >
              {['Every drop counts.', 'Connect. Donate.', 'Save lives.'].map((word, index) => (
                <motion.span key={index} variants={item} className="block">
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl leading-relaxed"
            >
              LiForce bridges the gap between blood donors and banks — ensuring the right blood reaches the right person at the right time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex flex-wrap gap-3 mb-10 w-full"
            >
              {userRole === 'bloodbank' ? (
                <>
                  <Link to="/find-donors" className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors shadow-sm">
                    Find donors
                  </Link>
                  <Link to="/find-blood" className="px-6 py-3 rounded-lg border border-border text-text-primary font-medium hover:bg-gray-50 transition-colors shadow-sm">
                    Find blood bank
                  </Link>
                  <Link to="/community?tab=camps" className="px-6 py-3 rounded-lg border border-border text-text-primary font-medium hover:bg-gray-50 transition-colors shadow-sm">
                    Join camps
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/donate-blood" className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors shadow-sm">
                    Donate blood
                  </Link>
                  <Link to="/emergency" className="px-6 py-3 rounded-lg border border-accent text-accent font-medium hover:bg-[#E8F5F1] transition-colors shadow-sm">
                    I need blood
                  </Link>
                  <Link to="/find-blood" className="px-6 py-3 rounded-lg border border-border text-text-primary font-medium hover:bg-gray-50 transition-colors shadow-sm">
                    Find blood bank
                  </Link>
                  <Link to="/community?tab=camps" className="px-6 py-3 rounded-lg border border-border text-text-primary font-medium hover:bg-gray-50 transition-colors shadow-sm">
                    Join camps
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="w-full max-w-2xl bg-surface p-2 rounded-xl shadow-sm border border-border flex flex-col sm:flex-row gap-2 items-stretch"
            >
              <div className="flex-1 flex items-center px-4 py-2 sm:border-r border-border min-h-[48px]">
                <span className="text-primary font-bold mr-3 shrink-0">ABO</span>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-text-primary outline-none"
                >
                  <option value="">Blood Group</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div
                ref={cityDropdownRef}
                className="flex-1 flex items-center px-4 py-2 min-h-[48px] relative"
              >
                <MapPin className="text-text-secondary mr-3 h-5 w-5 shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowCityDropdown(false);
                    } else if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="City or Pincode"
                  className="w-full bg-transparent border-none focus:ring-0 text-text-primary outline-none placeholder:text-text-secondary"
                />

                <AnimatePresence>
                  {showCityDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-md border border-border shadow-lg rounded-xl max-h-60 overflow-y-auto z-[2100] py-1.5"
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
                              setLocation(city.name);
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
              <button
                type="button"
                onClick={handleSearch}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center shrink-0"
              >
                <Search className="h-5 w-5 mr-2" /> Search
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-full lg:w-[42%] relative flex flex-col"
          >
            <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm relative aspect-square md:aspect-auto h-full min-h-[460px] flex flex-col">
              {/* Floating Overlay Header */}
              <div className="absolute top-6 left-6 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-md flex items-center z-[1000]">
                <span className="relative flex h-2.5 w-2.5 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                </span>
                <span className="text-xs font-semibold text-text-primary">Live availability →</span>
              </div>

              {/* Map Container */}
              <div className="w-full flex-grow rounded-xl overflow-hidden border border-border relative animate-fade-in min-h-[380px]">
                <MapContainer
                  center={userLocation || [30.7333, 76.7794]}
                  zoom={12}
                  dragging={false}
                  touchZoom={false}
                  doubleClickZoom={false}
                  scrollWheelZoom={false}
                  boxZoom={false}
                  keyboard={false}
                  zoomControl={false}
                  style={{ height: '100%', minHeight: '380px', width: '100%' }}
                  className="absolute inset-0 z-0"
                >
                  {userLocation && <ChangeMapView center={userLocation} />}
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  
                  {userLocation && (
                    <Marker position={userLocation} icon={orangeIcon} zIndexOffset={1000}>
                      <LeafletTooltip direction="top" opacity={1} permanent={false}>
                        <span className="font-bold">You</span>
                      </LeafletTooltip>
                    </Marker>
                  )}

                  {banks.map((bank) => (
                    <Marker
                      key={bank.id}
                      position={[bank.lat, bank.lng]}
                      icon={getBankMarkerIcon(bank.status)}
                    >
                      <Popup>
                        <div className="min-w-[180px] p-0.5 font-sans">
                          <h4 className="font-bold text-sm text-text-primary mb-0.5">{bank.name}</h4>
                          <p className="text-[11px] text-text-secondary mb-2">{bank.address}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bank.bloodGroups?.slice(0, 4).map((bg: any, i: number) => (
                              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                                bg.status === 'Critical' ? 'bg-[#FCEBEB] text-[#C0392B] border-[#FCEBEB]' :
                                bg.status === 'Low' ? 'bg-[#FFF3E0] text-[#E67E22] border-[#FFF3E0]' :
                                'bg-[#E8F5F1] text-[#1D9E75] border-[#E8F5F1]'
                              }`}>
                                {bg.type} ({bg.count}u)
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/find-blood?group=${bank.bloodGroups?.[0]?.type || ''}&city=${encodeURIComponent(bank.address.split(',')[1]?.trim() || 'Chandigarh')}`)}
                            className="w-full bg-primary text-white py-1.5 rounded text-center text-xs font-bold hover:bg-primary-dark transition-colors"
                          >
                            Explore Full Inventory
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {alerts.map((alert) => (
                    <Marker
                      key={alert.id}
                      position={[alert.lat, alert.lng]}
                      icon={createAlertIcon(alert.group, alert.status)}
                    >
                      <Popup>
                        <div className="min-w-[150px] p-0.5 font-sans text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold text-white mb-1.5 ${
                            alert.status === 'Critical' ? 'bg-[#E24B4A]' :
                            alert.status === 'Warning' ? 'bg-[#E67E22]' :
                            'bg-[#1D9E75]'
                          }`}>
                            Live Alert: {alert.status}
                          </span>
                          <p className="text-xs text-text-primary font-semibold">
                            Blood type <span className="font-extrabold">{alert.group}</span> needed nearby!
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate(`/emergency?group=${alert.group}`)}
                            className="w-full mt-2.5 bg-primary text-white py-1 rounded text-center text-xs font-bold hover:bg-primary-dark transition-colors"
                          >
                            Respond to Alert
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
