import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Database, Users, GitPullRequest, BarChart2, Radio, Settings,
  Droplets, AlertOctagon, Clock, Activity, ShieldCheck, AlertTriangle, Plus, User,
  CheckCircle, Check, CheckCheck, X, Minus, Settings as SettingsIcon, XCircle, Bell
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import SectionPlaceholder from '../components/dashboard/SectionPlaceholder';
import { useToast } from '../components/ToastProvider';
import { API_URL, fetchWithAuth } from '../lib/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const createCustomIcon = (color: string) =>
  L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 12],
    popupAnchor: [0, -24],
    html: `<span style="background-color:${color};width:24px;height:24px;display:block;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);" />`,
  });

const iconRed = createCustomIcon('#E24B4A');

const LocationPicker = ({ position, setPosition }: any) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={iconRed} /> : null;
};

const BloodBankDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('overview');
  const [resolvedRequests, setResolvedRequests] = useState<Set<string>>(new Set());
  const [requestStats, setRequestStats] = useState({ approved: 0, declined: 0 });
  
  const [profileCoordinates, setProfileCoordinates] = useState<[number, number] | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const sidebarItems = [
    { name: 'Overview', id: 'overview', icon: <LayoutDashboard /> },
    { name: 'Inventory', id: 'inventory', icon: <Database /> },
    { name: 'Donors', id: 'donors', icon: <Users /> },
    { name: 'Requests', id: 'requests', icon: <GitPullRequest /> },
    { name: 'Analytics', id: 'analytics', icon: <BarChart2 /> },
    { name: 'Broadcast', id: 'broadcast', icon: <Radio /> },
    { name: 'Settings', id: 'settings', icon: <Settings /> },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-critical text-white border-critical';
      case 'Low': return 'bg-warning text-white border-warning';
      case 'Good': return 'bg-accent text-white border-accent';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const [generalNotifications, setGeneralNotifications] = useState<any[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const handleDismissNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGeneralNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [restockModal, setRestockModal] = useState<{ open: boolean, bg: string | null }>({ open: false, bg: null });
  const [restockAmount, setRestockAmount] = useState<string>('');

  const [camps, setCamps] = useState<any[]>([]);
  const [campModalOpen, setCampModalOpen] = useState(false);
  const [campFormData, setCampFormData] = useState({ name: '', location: '', date: '', time: '', description: '', capacity: '50', maxDonorVolunteers: '10', maxBloodBankVolunteers: '5' });

  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    email: '',
    phone: '',
    latitude: 30.7333 as number,
    longitude: 76.7794 as number
  });



  const handleCampSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campFormData.name || !campFormData.location || !campFormData.date || !campFormData.time) return;
    
    const campDateTime = `${campFormData.date}T${campFormData.time}:00`;
    
    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/camps/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: campFormData.name,
          location: campFormData.location,
          date: campDateTime,
          description: campFormData.description,
          capacity: campFormData.capacity,
          maxDonorVolunteers: campFormData.maxDonorVolunteers,
          maxBloodBankVolunteers: campFormData.maxBloodBankVolunteers
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        setCamps(prev => [
          ...prev,
          {
            id: data.camp?.id || Date.now().toString(),
            name: data.camp?.title || campFormData.name,
            location: data.camp?.location || campFormData.location,
            date: data.camp?.date || campFormData.date,
            description: data.camp?.description || campFormData.description,
            rsvps: data.camp?.rsvps || 0,
            capacity: data.camp?.capacity || parseInt(campFormData.capacity) || 50
          }
        ]);
        
        showToast('Camp successfully scheduled!', 'success');
        setCampModalOpen(false);
        setCampFormData({ name: '', location: '', date: '', time: '', description: '', capacity: '50', maxDonorVolunteers: '10', maxBloodBankVolunteers: '5' });
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to schedule camp', 'error');
      }
    } catch (err) {
      showToast('Error organizing camp', 'error');
    }
  };



  const handleRestockConfirm = async () => {
    if (!restockModal.bg || !restockAmount || isNaN(Number(restockAmount))) return;
    
    const amountToAdd = parseInt(restockAmount);
    if (amountToAdd <= 0) return;

    try {
      const token = localStorage.getItem('liforce_userId');
      const existing = dashboardData?.bank?.inventory?.find((i: any) => i.bloodGroup === restockModal.bg);
      const currentUnits = existing ? existing.unitsAvailable : 0;
      const newTotal = currentUnits + amountToAdd;
      const newStatus = newTotal > 10 ? 'Good' : (newTotal > 5 ? 'Warning' : 'Critical');

      const response = await fetchWithAuth(`${API_URL}/bloodbanks/me/inventory`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bloodGroup: restockModal.bg,
          unitsAvailable: newTotal,
          status: newStatus
        })
      });

      if (response.ok) {
        setDashboardData((prev: any) => {
          if (!prev) return prev;
          const newInventory = [...(prev.bank.inventory || [])];
          const idx = newInventory.findIndex((i: any) => i.bloodGroup === restockModal.bg);
          
          if (idx >= 0) {
            newInventory[idx] = { 
              ...newInventory[idx], 
              unitsAvailable: newTotal, 
              status: newStatus 
            };
          } else {
            newInventory.push({
              bloodGroup: restockModal.bg,
              unitsAvailable: newTotal,
              status: newStatus
            });
          }
          
          return {
            ...prev,
            bank: {
              ...prev.bank,
              inventory: newInventory
            }
          };
        });

        showToast(`Successfully added ${amountToAdd} units of ${restockModal.bg}`, 'success');
        setRestockModal({ open: false, bg: null });
        setRestockAmount('');
      } else {
        showToast('Failed to restock. Make sure you are authenticated.', 'error');
      }
    } catch (err) {
      showToast('Error during restock', 'error');
    }
  };

  const handleDecreaseUnits = async (bg: string) => {
    try {
      const token = localStorage.getItem('liforce_userId');
      const existing = dashboardData?.bank?.inventory?.find((i: any) => i.bloodGroup === bg);
      const currentUnits = existing ? existing.unitsAvailable : 0;
      
      if (currentUnits <= 0) {
        showToast('Cannot decrease below 0 units', 'error');
        return;
      }
      
      const newTotal = currentUnits - 1;
      const newStatus = newTotal < 5 ? 'Critical' : newTotal < 15 ? 'Low' : 'Good';

      const response = await fetchWithAuth(`${API_URL}/bloodbanks/me/inventory`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bloodGroup: bg,
          unitsAvailable: newTotal,
          status: newStatus
        })
      });

      if (response.ok) {
        setDashboardData((prev: any) => {
          if (!prev) return prev;
          const newInventory = [...(prev.bank.inventory || [])];
          const idx = newInventory.findIndex((i: any) => i.bloodGroup === bg);
          
          if (idx >= 0) {
            newInventory[idx] = { 
              ...newInventory[idx], 
              unitsAvailable: newTotal, 
              status: newStatus 
            };
          }
          
          return {
            ...prev,
            bank: {
              ...prev.bank,
              inventory: newInventory
            }
          };
        });

        showToast(`Decreased 1 unit of ${bg}`, 'info');
      } else {
        showToast('Failed to update inventory', 'error');
      }
    } catch (err) {
      showToast('Error updating inventory', 'error');
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('liforce_userId');
        if (!token) return;
        
        const response = await fetchWithAuth(`${API_URL}/bloodbanks/me/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
          
          try {
            const notifRes = await fetch(`${API_URL}/notifications`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (notifRes.ok) {
              setGeneralNotifications(await notifRes.json());
            }
          } catch (err) {
            console.error("Failed to fetch general notifications", err);
          }
          
          if (data.bank?.latitude && data.bank?.longitude) {
            setProfileCoordinates([data.bank.latitude, data.bank.longitude]);
          }

          if (data.camps) {
            setCamps(data.camps.map((c: any) => ({
              id: c.id,
              name: c.title,
              location: c.location,
              date: c.date,
              description: c.description || '',
              rsvps: c.rsvps
            })));
          }

          // Load persisted resolved/rejected requests from localStorage
          if (data.bank?.id) {
            const savedResolved = localStorage.getItem(`liforce_resolved_reqs_${data.bank.id}`);
            if (savedResolved) {
              setResolvedRequests(new Set(JSON.parse(savedResolved)));
            }
            
            const savedStats = localStorage.getItem(`liforce_request_stats_${data.bank.id}`);
            if (savedStats) {
              setRequestStats(JSON.parse(savedStats));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch bloodbank dashboard", err);
      }
    };
    fetchDashboard();
    
    const handleSosConfirmed = () => {
      fetchDashboard();
    };
    
    window.addEventListener('sos_match_confirmed', handleSosConfirmed);
    return () => window.removeEventListener('sos_match_confirmed', handleSosConfirmed);
  }, []);

  const bankName = dashboardData?.bank?.name || "Loading...";
  const address = dashboardData?.bank?.address || "Loading...";
  const isVerified = dashboardData?.bank?.isVerified || false;
  
  // Inventory mapping
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const inventoryItems = bloodGroups.map(bg => {
    const existing = dashboardData?.bank?.inventory?.find((i: any) => i.bloodGroup === bg);
    const units = existing?.unitsAvailable ?? 0;
    // Per-bank thresholds: Critical (< 5), Low (5-14), Good (>= 15)
    const status = units < 5 ? 'Critical' : units < 15 ? 'Low' : 'Good';
    return { type: bg, units, status, expiring: 0 };
  });

  const totalUnits = inventoryItems.reduce((sum, item) => sum + item.units, 0);
  const criticalCount = inventoryItems.filter(i => i.status === 'Critical').length;
  
  const pendingRequests = dashboardData?.pendingRequests || [];
  const recentDonors = dashboardData?.bank?.donations || [];
  
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const donationTrends = dashboardData?.weeklyTrends || [
    { week: 'Week 1', units: 0 },
    { week: 'Week 2', units: 0 },
    { week: 'Week 3', units: 0 },
    { week: 'Week 4', units: 0 },
  ];

  const visibleRequests = pendingRequests.filter((r: any) => !resolvedRequests.has(r.id));
  
  const totalDonations = dashboardData?.bank?.donations?.length || 0;
  const completedDonations = dashboardData?.bank?.donations?.filter((d: any) => d.status === 'Completed').length || 0;
  
  const totalFulfilled = completedDonations + requestStats.approved;
  const totalActions = totalDonations + requestStats.approved + requestStats.declined;
  
  const fulfillmentRate = totalActions > 0 ? ((totalFulfilled / totalActions) * 100).toFixed(1) : '0.0';

  const handleRequestAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const newResolved = new Set(resolvedRequests).add(id);
      setResolvedRequests(newResolved);
      
      const newStats = { ...requestStats, declined: requestStats.declined + 1 };
      setRequestStats(newStats);
      
      if (dashboardData?.bank?.id) {
        localStorage.setItem(`liforce_resolved_reqs_${dashboardData.bank.id}`, JSON.stringify(Array.from(newResolved)));
        localStorage.setItem(`liforce_request_stats_${dashboardData.bank.id}`, JSON.stringify(newStats));
      }
      showToast('Request declined.', 'info');
      return;
    }
    
    // For 'approve' (Confirm)
    try {
      const matchedRequest = pendingRequests.find((r: any) => r.id === id);
      if (matchedRequest) {
        const bankPhone = dashboardData?.bank?.phone || "1800-LIFORCE";
        const response = await fetchWithAuth(`${API_URL}/emergencies/${id}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bloodBankId: dashboardData?.bank?.id,
            responderName: bankName,
            responderPhone: bankPhone,
            responderType: 'BloodBank',
            responseType: 'Prepared Units',
            bloodGroup: matchedRequest.bloodGroup
          })
        });
        if (response.ok) {
          showToast('Request confirmed! Inventory updated.', 'success');
          
          setDashboardData((prev: any) => {
            if (!prev) return prev;
            
            const newRequests = prev.pendingRequests.map((r: any) => 
              r.id === id ? { ...r, assignedBloodBankId: prev.bank.id } : r
            );
            
            return {
              ...prev,
              pendingRequests: newRequests
            };
          });
        } else {
          showToast('Failed to confirm request.', 'error');
        }
      }
    } catch (err) {
      console.error("Failed to confirm request", err);
      showToast('Error confirming request.', 'error');
    }
  };

  const handleDonatedAction = async (id: string) => {
    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/emergencies/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: 'Fulfilled' })
      });
      if (response.ok) {
        showToast('Blood successfully donated to patient!', 'success');
        
        // Deduct inventory locally now that it's actually donated
        const matchedRequest = pendingRequests.find((r: any) => r.id === id);
        if (matchedRequest) {
          setDashboardData((prev: any) => {
            if (!prev || !prev.bank || !prev.bank.inventory) return prev;
            const newInventory = [...prev.bank.inventory];
            const idx = newInventory.findIndex((i: any) => i.bloodGroup === matchedRequest.bloodGroup);
            if (idx >= 0) {
              const currentItem = newInventory[idx];
              const newUnits = Math.max(0, currentItem.unitsAvailable - matchedRequest.unitsRequired);
              newInventory[idx] = {
                ...currentItem,
                unitsAvailable: newUnits,
                status: newUnits < 5 ? 'Critical' : newUnits < 15 ? 'Low' : 'Good'
              };
            }
            return {
              ...prev,
              bank: {
                ...prev.bank,
                inventory: newInventory
              }
            };
          });
        }
        
        const newResolved = new Set(resolvedRequests).add(id);
        setResolvedRequests(newResolved);
        
        const newStats = { ...requestStats, approved: requestStats.approved + 1 };
        setRequestStats(newStats);
        
        if (dashboardData?.bank?.id) {
          localStorage.setItem(`liforce_resolved_reqs_${dashboardData.bank.id}`, JSON.stringify(Array.from(newResolved)));
          localStorage.setItem(`liforce_request_stats_${dashboardData.bank.id}`, JSON.stringify(newStats));
        }
      } else {
        showToast('Failed to mark as donated.', 'error');
      }
    } catch (err) {
      showToast('Error marking as donated.', 'error');
    }
  };

  const handleDonationStatus = async (donationId: string, status: 'Accepted' | 'Completed' | 'Cancelled') => {
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;

      const response = await fetchWithAuth(`${API_URL}/donations/${donationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        showToast(`Donation marked as ${status}!`, 'success');
        // Refresh dashboard data
        const refreshResponse = await fetchWithAuth(`${API_URL}/bloodbanks/me/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setDashboardData(data);
        }
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Failed to update donation status', 'error');
      }
    } catch (err) {
      console.error("Failed to update donation status", err);
      showToast('Error updating donation status', 'error');
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/bloodbanks/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editProfileData)
      });
      
      if (response.ok) {
        setDashboardData((prev: any) => ({
          ...prev,
          bank: {
            ...prev.bank,
            email: editProfileData.email,
            phone: editProfileData.phone,
            latitude: editProfileData.latitude,
            longitude: editProfileData.longitude
          }
        }));
        showToast('Profile updated successfully!', 'success');
        setEditProfileModalOpen(false);
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Error updating profile', 'error');
    }
  };

  const handleSaveProfile = async () => {
    if (!profileCoordinates) {
      showToast('Please select a location on the map', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/bloodbanks/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: profileCoordinates[0],
          longitude: profileCoordinates[1]
        })
      });
      if (response.ok) {
        showToast('Profile location updated successfully!', 'success');
      } else {
        showToast('Failed to update location', 'error');
      }
    } catch (err) {
      showToast('Error saving profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!dashboardData) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === 'inventory' && (
        <SectionPlaceholder title="Live inventory" description="Stock levels by blood group.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {inventoryItems.map((item) => (
              <div key={item.type} className={`p-4 rounded-xl border-2 ${getStatusColor(item.status)}`}>
                <span className="text-xl font-bold">{item.type}</span>
                <p className="text-2xl font-bold mt-1">{item.units} units</p>
                <button type="button" onClick={() => setRestockModal({ open: true, bg: item.type })} className="mt-3 w-full py-1.5 bg-white/90 rounded text-xs font-bold text-gray-900">Restock</button>
              </div>
            ))}
          </div>
        </SectionPlaceholder>
      )}
      {activeSection === 'donors' && (
        <SectionPlaceholder title="Recent donors" description="Donors linked to your bank.">
          <div className="space-y-4">
            {recentDonors.map((d: any) => (
              <div key={d.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border border-border bg-surface rounded-xl gap-4 shadow-sm hover:border-primary-light transition-all">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark font-bold flex items-center justify-center mr-4 shrink-0">
                    {d.donor?.bloodGroup || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">{d.donor?.name || 'Donor'}</h4>
                    <p className="text-xs text-text-secondary">Scheduled: {new Date(d.scheduledDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    d.status === 'Completed' ? 'bg-[#E8F5F1] text-accent' :
                    d.status === 'Cancelled' ? 'bg-[#FADBD8] text-critical' :
                    'bg-gray-100 text-text-secondary border border-gray-200'
                  }`}>
                    {d.status}
                  </span>
                  
                  {d.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDonationStatus(d.id, 'Completed')}
                        className="px-3 py-1.5 bg-accent text-white font-bold text-xs rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDonationStatus(d.id, 'Cancelled')}
                        className="px-3 py-1.5 bg-critical text-white font-bold text-xs rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => d.donor?.id && navigate(`/profile/${d.donor.id}`)}
                    className="text-primary font-medium text-xs bg-primary-light px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
            {!recentDonors.length && <p className="text-text-secondary">No recent donor activity.</p>}
          </div>
        </SectionPlaceholder>
      )}
      {activeSection === 'requests' && (
        <SectionPlaceholder title="Blood requests" description="Manage incoming emergency and routine requests.">
          {visibleRequests.length === 0 ? (
            <p className="text-text-secondary">No pending requests.</p>
          ) : (
            visibleRequests.map((req: any) => (
              <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border border-border rounded-xl mb-3">
                <div>
                  <p className="font-bold">
                    {req.patientName}
                    {(req.patientAge || req.patientGender) && (
                      <span className="text-xs font-normal text-text-secondary ml-1">
                        ({req.patientAge ? `${req.patientAge} y/o` : ''}
                        {req.patientAge && req.patientGender ? ', ' : ''}
                        {req.patientGender})
                      </span>
                    )}
                    {" "}— {req.bloodGroup}
                  </p>
                  <p className="text-sm text-text-secondary">{req.hospitalAddress}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleRequestAction(req.id, 'approve')} className="p-2 text-accent hover:bg-[#E8F5F1] rounded-lg"><CheckCircle className="w-5 h-5" /></button>
                  <button type="button" onClick={() => handleRequestAction(req.id, 'reject')} className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5" /></button>
                </div>
              </div>
            ))
          )}
        </SectionPlaceholder>
      )}

      {activeSection === 'analytics' && (
        <SectionPlaceholder title="Analytics" description="30-day donation trends.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="units" stroke="#1D9E75" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionPlaceholder>
      )}
      {activeSection === 'broadcast' && (
        <SectionPlaceholder title="Broadcast" description="Send urgent alerts to nearby donors.">
          <button type="button" onClick={() => navigate('/emergency')} className="px-5 py-2.5 bg-critical text-white rounded-lg font-bold hover:bg-red-600">Send urgent alert</button>
        </SectionPlaceholder>
      )}
      {activeSection === 'settings' && (
        <SectionPlaceholder title="Settings" description="Blood bank profile and location.">
          <div className="space-y-4">
            <p><strong>{bankName}</strong></p>
            <p className="text-sm text-text-secondary mt-1">{address}</p>
            {isVerified && <p className="text-accent text-sm font-bold mb-6">✓ Verified institution</p>}

            <h4 className="font-bold text-text-primary mt-6">Pin Your Location</h4>
            <p className="text-sm text-text-secondary mb-2">Update your exact location on the map so donors can find you easily.</p>
            
            <div className="h-80 w-full rounded-xl overflow-hidden border border-border mb-4">
              <MapContainer 
                center={profileCoordinates || [30.7333, 76.7794]} 
                zoom={profileCoordinates ? 13 : 11} 
                scrollWheelZoom={true} 
                className="w-full h-full"
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker position={profileCoordinates} setPosition={setProfileCoordinates} />
              </MapContainer>
            </div>
            
            <button 
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isSavingProfile ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </SectionPlaceholder>
      )}

      {activeSection === 'overview' && (
      <>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg mr-4 border border-primary-dark">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-text-primary mr-2">{bankName}</h1>
              {isVerified && (
                <span className="bg-[#E8F5F1] text-accent text-xs px-2 py-0.5 rounded flex items-center font-bold">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified Bank
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-1">{address}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNotificationsModalOpen(true)}
            className="p-2.5 rounded-lg border border-border text-text-secondary bg-white hover:bg-gray-50 transition-colors relative shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {generalNotifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center bg-white border border-border text-text-primary p-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="Settings"
          >
            <SettingsIcon className="h-5 w-5 text-text-secondary" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/emergency')}
            className="flex items-center bg-critical text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-600 transition-colors shadow-sm"
          >
            <Radio className="h-4 w-4 mr-2" /> Send urgent alert
          </button>
        </div>
      </div>

      {/* Row 1 - Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Total units in stock</h3>
            <div className="p-2 bg-primary-light rounded-lg"><Droplets className="h-5 w-5 text-primary" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{totalUnits}</p>
          <p className="text-xs text-accent font-medium mt-2 flex items-center">Healthy inventory level</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface p-6 rounded-2xl border border-critical shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-critical opacity-10 rounded-bl-full"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Critical blood groups</h3>
            <div className="p-2 bg-[#FADBD8] rounded-lg"><AlertOctagon className="h-5 w-5 text-critical" /></div>
          </div>
          <p className="text-3xl font-bold text-critical">{criticalCount}</p>
          <p className="text-xs text-critical mt-2 font-medium">Require attention</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Pending requests</h3>
            <div className="p-2 bg-[#FEF5E7] rounded-lg"><Clock className="h-5 w-5 text-warning" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{visibleRequests.length}</p>
          <p className="text-xs text-text-secondary mt-2">{visibleRequests.filter((r: any) => r.urgency === 'Critical').length} critical emergencies</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Fulfilment rate</h3>
            <div className="p-2 bg-[#E8F5F1] rounded-lg"><Activity className="h-5 w-5 text-accent" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{fulfillmentRate}%</p>
          <p className="text-xs text-text-secondary mt-2 font-medium flex items-center">Based on recent appointments</p>
        </motion.div>
      </div>

      {/* Row 2 - Inventory Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Live Inventory</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          {inventoryItems.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * index }}
              key={item.type} 
              className={`relative flex flex-col p-4 rounded-xl border-2 ${getStatusColor(item.status)} shadow-sm min-h-[180px]`}
            >
              {item.status === 'Critical' && (
                <div className="absolute inset-0 rounded-xl border-2 border-critical animate-ping opacity-20 pointer-events-none"></div>
              )}
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl font-bold">{item.type}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDecreaseUnits(item.type)}
                disabled={item.units <= 0}
                className="absolute top-2 right-2 p-1 bg-transparent hover:bg-red-500 text-white/80 hover:text-white rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                title="Decrease by 1 unit"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-3xl font-bold mt-1">{item.units} <span className="text-xs font-normal opacity-80">units</span></span>
              
              <div className="mt-auto pt-3 border-t border-white/20">
                <p className={`text-[10px] font-medium flex items-center mb-2 transition-opacity duration-300 ${
                  (item.status === 'Critical' || item.expiring > 0) ? 'opacity-90' : 'opacity-0 select-none'
                }`}>
                  <AlertTriangle className="w-3 h-3 mr-1" /> 
                  {item.status === 'Critical' ? 'Immediate shortage' : (item.expiring > 0 ? `${item.expiring} exp. soon` : 'Spacer text')}
                </p>
                <button
                  type="button"
                  onClick={() => setRestockModal({ open: true, bg: item.type })}
                  className={`w-full py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center ${
                    item.status === 'Good' ? 'bg-white/20 hover:bg-white/30 text-white' : 
                    'bg-white text-gray-900 hover:bg-gray-100 shadow-sm'
                  }`}
                >
                  <Plus className="w-3 h-3 mr-1" /> Restock
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Row 3 - Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col h-[400px]">
          <h3 className="font-bold text-text-primary mb-6">Donation Trends ({currentMonth})</h3>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="units" stroke="#1D9E75" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#1D9E75', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-primary">Recent Donor Activity</h3>
          </div>
          <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            {recentDonors.map((donorObj: any) => (
              <div key={donorObj.id} className="flex items-center p-3 rounded-xl border border-border hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark font-bold flex items-center justify-center mr-4 shrink-0">
                  {donorObj.donor?.bloodGroup || '?'}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-text-primary text-sm truncate">{donorObj.donor?.name || 'Unknown'}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      donorObj.status === 'Completed' ? 'bg-[#E8F5F1] text-accent' :
                      donorObj.status === 'Accepted' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      donorObj.status === 'Cancelled' ? 'bg-[#FADBD8] text-critical' :
                      'bg-gray-100 text-text-secondary border border-gray-200'
                    }`}>
                      {donorObj.status}
                    </span>
                    <span className="text-text-secondary">•</span>
                    <span className="text-[10px] text-text-secondary">
                      {new Date(donorObj.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {donorObj.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDonationStatus(donorObj.id, 'Accepted')}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                        title="Accept Appointment"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDonationStatus(donorObj.id, 'Cancelled')}
                        className="p-1.5 text-critical hover:bg-[#FADBD8] rounded transition-colors"
                        title="Decline Appointment"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {donorObj.status === 'Accepted' && (
                    <button
                      type="button"
                      onClick={() => handleDonationStatus(donorObj.id, 'Completed')}
                      className="p-1.5 text-accent hover:bg-[#E8F5F1] rounded transition-colors"
                      title="Confirm Donated"
                    >
                      <CheckCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => donorObj.donor?.id && navigate(`/profile/${donorObj.donor.id}`)}
                    className="text-primary font-medium text-xs bg-primary-light px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
            {recentDonors.length === 0 && (
              <p className="text-sm text-text-secondary">No recent donors found.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 4 - Tables & Camps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Pending Requests Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-primary">Pending Blood Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-sm text-text-secondary">
                  <th className="pb-3 font-medium">Patient / Hospital</th>
                  <th className="pb-3 font-medium">Group & Units</th>
                  <th className="pb-3 font-medium">Urgency</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((req: any) => (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-text-primary text-sm">
                        {req.patientName}
                        {(req.patientAge || req.patientGender) && (
                          <span className="text-xs font-normal text-text-secondary ml-1">
                            ({req.patientAge ? `${req.patientAge} y/o` : ''}
                            {req.patientAge && req.patientGender ? ', ' : ''}
                            {req.patientGender})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{req.hospitalAddress}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{req.id.split('-')[0]}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center">
                        <span className="w-8 h-8 rounded bg-primary-light text-primary-dark font-bold flex items-center justify-center text-xs mr-2">
                          {req.bloodGroup}
                        </span>
                        <span className="text-sm font-medium">{req.unitsRequired} unit{req.unitsRequired > 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        req.urgency === 'Critical' ? 'bg-[#FADBD8] text-critical' :
                        req.urgency === 'Urgent' ? 'bg-[#FEF5E7] text-warning' :
                        'bg-gray-100 text-text-secondary'
                      }`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.assignedBloodBankId === dashboardData?.bank?.id ? (
                          <button type="button" onClick={() => handleDonatedAction(req.id)} className="p-1.5 bg-[#E8F5F1] text-accent hover:bg-accent hover:text-white rounded transition-colors" title="Donated">
                            <CheckCheck className="w-5 h-5" />
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleRequestAction(req.id, 'approve')} className="p-1.5 bg-[#FEF5E7] text-warning hover:bg-warning hover:text-white rounded transition-colors" title="Confirm">
                              <Check className="w-5 h-5" />
                            </button>
                            <button type="button" onClick={() => handleRequestAction(req.id, 'reject')} className="p-1.5 bg-[#FADBD8] text-critical hover:bg-critical hover:text-white rounded transition-colors" title="Decline">
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-secondary text-sm">
                      No pending requests at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Upcoming Camps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-primary">Upcoming Camps</h3>
            <button type="button" onClick={() => setCampModalOpen(true)} className="p-1.5 bg-primary-light text-primary hover:bg-primary hover:text-white rounded transition-colors" aria-label="Add camp">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-0">
            {camps.length === 0 ? (
              <div className="text-center py-6 text-sm text-text-secondary border border-dashed border-border rounded-xl">
                No upcoming camps scheduled. Use the + button to organize one.
              </div>
            ) : (
              camps.map(camp => {
                const d = new Date(camp.date);
                const month = d.toLocaleString('default', { month: 'short' });
                const day = d.getDate();
                
                return (
                  <div key={camp.id} className="bg-background border border-border rounded-xl p-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary opacity-5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center mb-3">
                      <div className="bg-primary text-white rounded px-2 py-1 text-center mr-3 shrink-0 min-w-[3.5rem]">
                        <p className="text-[10px] font-bold uppercase leading-none mb-0.5">{month}</p>
                        <p className="text-lg font-bold leading-none">{day}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-sm">{camp.name}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">{camp.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                        <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                        <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white"></div>
                        <div className="w-6 h-6 rounded-full bg-primary-light border-2 border-white flex items-center justify-center text-[8px] font-bold text-primary">
                          <User className="w-3 h-3" />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-accent">{camp.rsvps} {camp.rsvps === 1 ? 'Attendee' : 'Attendees'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button type="button" onClick={() => navigate('/dashboard/bloodbank/camps')} className="w-full mt-auto py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            View all camps
          </button>
        </motion.div>

      </div>
      </>
      )}

      {restockModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <form onSubmit={(e) => { e.preventDefault(); handleRestockConfirm(); }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Restock {restockModal.bg}</h3>
                <button type="button" onClick={() => setRestockModal({ open: false, bg: null })} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-4">Enter the number of units you want to add to your inventory.</p>
              <input
                type="number"
                min="1"
                required
                className="w-full border border-border rounded-lg px-4 py-2 mb-4 outline-none focus:border-primary"
                placeholder="e.g. 5"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors"
              >
                Confirm Restock
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {campModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Organize a New Camp</h3>
              <button type="button" onClick={() => setCampModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-6">Fill out the details below to schedule a new blood donation camp.</p>
            
            <form onSubmit={handleCampSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Camp Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                  placeholder="e.g. Winter Blood Drive"
                  value={campFormData.name}
                  onChange={(e) => setCampFormData({...campFormData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Location</label>
                <input
                  type="text"
                  required
                  className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                  placeholder="e.g. Community Center, Sector 12"
                  value={campFormData.location}
                  onChange={(e) => setCampFormData({...campFormData, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                    value={campFormData.date}
                    onChange={(e) => setCampFormData({...campFormData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Time</label>
                  <input
                    type="time"
                    required
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                    value={campFormData.time}
                    onChange={(e) => setCampFormData({...campFormData, time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Total Capacity</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                  value={campFormData.capacity}
                  onChange={(e) => setCampFormData({...campFormData, capacity: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Description</label>
                <textarea
                  className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary min-h-[100px] resize-y"
                  placeholder="Optional details about the camp..."
                  value={campFormData.description}
                  onChange={(e) => setCampFormData({...campFormData, description: e.target.value})}
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 mt-4 rounded-lg font-bold hover:bg-primary-dark transition-colors"
              >
                Schedule Camp
              </button>
            </form>
          </motion.div>
        </div>
      )}





      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative"
            >
              {/* Header cover decoration */}
              <div className="h-32 bg-gradient-to-r from-primary to-primary-dark relative shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditProfileModalOpen(false)}
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-20 cursor-pointer"
                  aria-label="Close edit profile"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              </div>

              <div className="px-6 relative shrink-0">
                <div className="flex justify-between items-end -mt-14 mb-4">
                  <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg border-4 border-background z-10 shrink-0">
                    <div className="w-full h-full bg-primary-light text-primary-dark rounded-full flex items-center justify-center text-3xl font-extrabold select-none">
                      {bankName !== 'Loading...' ? bankName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'BB'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 overflow-y-auto">
                <form onSubmit={handleEditProfileSubmit}>
                  <h3 className="text-xl font-bold text-text-primary mb-1">Edit Facility Details</h3>
                  <p className="text-xs text-text-secondary mb-6">Update your contact information and exact map location.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={editProfileData.email}
                        onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                        required
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={editProfileData.phone}
                        onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                        required
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Pin Your Location</label>
                      <div className="h-48 w-full rounded-xl overflow-hidden border border-border">
                        <MapContainer 
                          center={[editProfileData.latitude, editProfileData.longitude]} 
                          zoom={13} 
                          scrollWheelZoom={true} 
                          className="w-full h-full"
                          key={`${editProfileData.latitude}-${editProfileData.longitude}`}
                        >
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                          <LocationPicker 
                            position={[editProfileData.latitude, editProfileData.longitude]} 
                            setPosition={(pos: any) => setEditProfileData({...editProfileData, latitude: pos[0], longitude: pos[1]})} 
                          />
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-8">
                    <button 
                      type="submit" 
                      className="flex-1 bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-dark transition-colors text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Save Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditProfileModalOpen(false)} 
                      className="flex-1 bg-gray-100 border border-transparent text-text-secondary font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Modal */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl max-w-3xl w-full border border-border shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Red top border/accents */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-primary"></div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary-light opacity-20 rounded-full -mr-10 -mt-10 blur-xl"></div>
            
            {/* Header with Title and Vertically Aligned Close Button */}
            <div className="flex items-center justify-between mb-6 mt-2 relative z-10 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text-primary">Urgent Notifications</h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-primary-light text-primary rounded-full">
                  {generalNotifications.filter(n => !n.isRead).length} Active
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNotificationsModalOpen(false)}
                className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-gray-100 border border-border bg-white shadow-sm transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
              {generalNotifications.filter(n => !n.isRead).length > 0 ? (
                <>
                {/* General Notifications */}
                {generalNotifications.filter(n => !n.isRead).map((n: any, i: number) => (
                  <motion.div 
                    key={`gen-${n.id}`} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-gray-50 rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-grow w-full sm:w-auto pr-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-[10px] font-extrabold tracking-wider uppercase">Info</span>
                        <span className="text-xs font-medium text-text-secondary">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-sm text-text-primary mt-2.5">
                        {n.title}
                      </p>
                      <div className="mt-2 text-xs text-text-secondary">
                        {n.message}
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => handleDismissNotification(n.id)}
                      className="p-2 bg-white text-text-secondary border border-border hover:bg-red-50 hover:text-critical rounded-lg shadow-sm transition-colors shrink-0"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-[#E8F5F1] rounded-full flex items-center justify-center mb-4 border border-[#A3E4D7]">
                    <CheckCircle className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">You're all caught up!</h3>
                  <p className="text-sm text-text-secondary mt-1">There are currently no active notifications for you.</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer aligned bottom */}
            <div className="mt-6 pt-4 border-t border-border flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsNotificationsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-100 text-text-secondary font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default BloodBankDashboard;
