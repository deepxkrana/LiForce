import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Droplet, CalendarClock, Bell, Trophy, Activity, MessageSquare, Settings as SettingsIcon,
  Flame, Calendar, MapPin, CheckCircle, AlertTriangle, Bot, Phone, Heart, X, Check, User, Users, Plus, Minus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import DashboardLayout from '../layouts/DashboardLayout';
import SectionPlaceholder from '../components/dashboard/SectionPlaceholder';
import { useToast } from '../components/ToastProvider';
import { useChat } from '../context/ChatContext';
import { API_URL, fetchWithAuth } from '../lib/api';



// Custom Leaflet Icon
const redIcon = L.divIcon({
  className: "custom-pin",
  iconAnchor: [0, 12],
  popupAnchor: [0, -24],
  html: `<span style="background-color: #E24B4A; width: 24px; height: 24px; display: block; left: -12px; top: -12px; position: relative; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></span>`
});

const orangeIcon = L.divIcon({
  className: "custom-pin-user",
  iconAnchor: [0, 12],
  popupAnchor: [0, -24],
  tooltipAnchor: [0, -12],
  html: `<span style="background-color: #F59E0B; width: 24px; height: 24px; display: block; left: -12px; top: -12px; position: relative; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></span>`
});

const LocationPicker = ({ position, setPosition }: any) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={redIcon} /> : null;
};

const CustomZoomControl = () => {
  const map = useMap();
  
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentZoom = map.getZoom();
    if (currentZoom < 18) map.setZoom(currentZoom + 1);
  };
  
  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentZoom = map.getZoom();
    if (currentZoom > 10) map.setZoom(currentZoom - 1);
  };

  return (
    <div className="absolute top-2 right-2 flex flex-col gap-1 z-[400]">
      <button 
        type="button" 
        onClick={handleZoomIn} 
        className="w-8 h-8 bg-white/90 backdrop-blur-md border border-border rounded shadow-sm flex items-center justify-center text-text-primary hover:bg-gray-50 focus:outline-none transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button 
        type="button" 
        onClick={handleZoomOut} 
        className="w-8 h-8 bg-white/90 backdrop-blur-md border border-border rounded shadow-sm flex items-center justify-center text-text-primary hover:bg-gray-50 focus:outline-none transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};

const AVAILABLE_BLOOD_BANKS = [
  { id: '1', name: 'Rotary Blood Bank', address: 'Sector 37, Chandigarh' },
  { id: '2', name: 'PGI Blood Center', address: 'Sector 12, Chandigarh' },
  { id: '3', name: 'Red Cross Blood Society', address: 'Sector 19, Chandigarh' },
  { id: '4', name: 'Max Hospital Blood Bank', address: 'Phase 6, Mohali' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const DonorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openChat } = useChat();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSOSRequest, setActiveSOSRequest] = useState<any>(null);
  const [isSOSTrackerOpen, setIsSOSTrackerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMaxDistance, setEditMaxDistance] = useState(50);
  const [editNotifications, setEditNotifications] = useState(true);
  const [editCoordinates, setEditCoordinates] = useState<[number, number] | null>(null);
  const [selectedResponseRequestId, setSelectedResponseRequestId] = useState<string | null>(null);

  const handleRespondToSOS = async (requestId: string, responseType: 'I will donate myself' | 'I will bring someone else') => {
    // Block self-donation if donor is on 56-day cooldown
    if (responseType === 'I will donate myself') {
      const lastDonated = donorData?.lastDonatedAt;
      if (lastDonated) {
        const lastDate = new Date(lastDonated);
        const eligibleDate = new Date(lastDate);
        eligibleDate.setDate(eligibleDate.getDate() + 56);
        const today = new Date();
        const daysLeft = Math.ceil((eligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          const eligibleStr = eligibleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
          showToast(`⏳ Cooldown Active: You can donate again in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (eligible on ${eligibleStr}).`, 'error');
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;

      const response = await fetchWithAuth(`${API_URL}/emergencies/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          responderId: donorData?.id || null,
          responderName: donorData?.name || "Anonymous Donor",
          responderPhone: donorData?.phone || "",
          responderType: 'Donor',
          responseType: responseType,
          bloodGroup: donorData?.bloodGroup || "O+"
        })
      });

      if (response.ok) {
        showToast('Your emergency response has been registered! Thank you.', 'success');
        // Refresh nearby requests
        try {
          const responseNearby = await fetchWithAuth(`${API_URL}/donors/emergencies/nearby`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (responseNearby.ok) {
            const data = await responseNearby.json();
            setNearbyRequests(data);
          }
        } catch (err) {
          console.error(err);
        }
        setIsNotificationsModalOpen(false);
        setSelectedResponseRequestId(null);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to submit response.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while submitting response.', 'error');
    }
  };


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;

      const response = await fetchWithAuth(`${API_URL}/donors/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: editPhone,
          address: editAddress,
          maxTravelDistanceKm: Number(editMaxDistance),
          notificationsEnabled: editNotifications,
          latitude: editCoordinates?.[0],
          longitude: editCoordinates?.[1]
        })
      });

      if (response.ok) {
        showToast('Profile updated successfully!', 'success');
        setIsEditingProfile(false);
        // Refresh profile data
        const updatedResponse = await fetchWithAuth(`${API_URL}/donors/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (updatedResponse.ok) {
          const data = await updatedResponse.json();
          setDonorData(data);
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while updating profile.', 'error');
    }
  };

  const fetchActiveSOSRequest = async () => {
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;
      
      const response = await fetchWithAuth(`${API_URL}/emergencies/my-active`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSOSRequest(data);
      }
    } catch (err) {
      console.error("Failed to fetch active emergency request", err);
    }
  };

  const handleFulfillSOS = async (id: string) => {
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;
      
      const response = await fetchWithAuth(`${API_URL}/emergencies/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Fulfilled' })
      });
      if (response.ok) {
        showToast('SOS Emergency Request marked as Fulfilled. Thank you for saving lives!', 'success');
        setActiveSOSRequest(null);
        setIsSOSTrackerOpen(false);
      } else {
        showToast('Failed to update request status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while updating status.', 'error');
    }
  };

  const handleCancelSOS = async (id: string) => {
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;
      
      const response = await fetchWithAuth(`${API_URL}/emergencies/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (response.ok) {
        showToast('SOS Emergency Request cancelled.', 'info');
        setActiveSOSRequest(null);
        setIsSOSTrackerOpen(false);
      } else {
        showToast('Failed to cancel request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while cancelling request.', 'error');
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return;
      const res = await fetchWithAuth(`${API_URL}/notifications/${id}/read`, {
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

  const [hasAppointment, setHasAppointment] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('2026-10-24');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM - 10:30 AM');
  const [appointmentBank] = useState('Rotary Blood Bank');
  const [appointmentAddress] = useState('Sector 37, Chandigarh');

  const [rescheduleDate, setRescheduleDate] = useState('2026-10-24');
  const [rescheduleTime, setRescheduleTime] = useState('10:00 AM - 10:30 AM');

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleBankId, setScheduleBankId] = useState('1');
  const [scheduleDate, setScheduleDate] = useState('2026-10-24');
  const [scheduleTime, setScheduleTime] = useState('10:00 AM - 10:30 AM');

  const [donorData, setDonorData] = useState<any>(null);
  const [nearbyRequests, setNearbyRequests] = useState<any[]>([]);
  const [generalNotifications, setGeneralNotifications] = useState<any[]>([]);
  const [bloodBanks, setBloodBanks] = useState<any[]>([]);

  useEffect(() => {
    if (bloodBanks.length > 0) {
      setScheduleBankId(bloodBanks[0].id);
    }
  }, [bloodBanks]);

  const getMonthAbbr = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('default', { month: 'short' }).toUpperCase();
    } catch {
      return 'OCT';
    }
  };

  const getDayStr = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.getDate().toString();
    } catch {
      return '24';
    }
  };

  const sidebarItems = [
    { name: 'Dashboard', id: 'dashboard', icon: <LayoutDashboard /> },
    { name: 'My donations', id: 'donations', icon: <Droplet /> },
    { name: 'Schedule', id: 'schedule', icon: <CalendarClock /> },
    { name: 'Alerts', id: 'alerts', icon: <Bell /> },
    { name: 'Rewards', id: 'rewards', icon: <Trophy /> },
    { name: 'Health tracker', id: 'health', icon: <Activity /> },
    { name: 'Messages', id: 'messages', icon: <MessageSquare /> },
    { name: 'Settings', id: 'settings', icon: <SettingsIcon /> },
  ];

  const fetchDonorProfile = async () => {
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) return; // Not logged in
      
      const response = await fetchWithAuth(`${API_URL}/donors/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDonorData(data);
      }

      // Fetch nearby requests
      try {
        const responseNearby = await fetchWithAuth(`${API_URL}/donors/emergencies/nearby`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (responseNearby.ok) {
          const data = await responseNearby.json();
          setNearbyRequests(data);
        }
      } catch (err) {
        console.error("Failed to fetch nearby emergencies", err);
      }

      // Fetch general notifications
      try {
        const notifRes = await fetchWithAuth(`${API_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (notifRes.ok) {
          setGeneralNotifications(await notifRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch general notifications", err);
      }

      // Fetch blood banks
      try {
        const banksRes = await fetch(`${API_URL}/bloodbanks`); // Public route doesn't strictly need auth
        if (banksRes.ok) {
          const banksData = await banksRes.json();
          setBloodBanks(banksData);
        }
      } catch (err) {
        console.error("Failed to fetch blood banks", err);
      }
    } catch (err) {
      console.error("Failed to fetch donor profile", err);
    }
  };

  useEffect(() => {
    fetchDonorProfile();
    fetchActiveSOSRequest();

    const handleResponseReceived = () => {
      console.log("Emergency response received custom event: re-fetching my active request status...");
      fetchActiveSOSRequest();
    };

    window.addEventListener('emergency_response_received', handleResponseReceived);
    return () => {
      window.removeEventListener('emergency_response_received', handleResponseReceived);
    };
  }, []);

  // Use dynamic data
  const name = donorData?.name || "Loading...";
  const initials = name.substring(0, 2).toUpperCase();
  const bloodGroup = donorData?.bloodGroup || "-";
  const rewardPoints = donorData?.rewardPoints || 0;
  const baseDonationsCount = donorData?.donations?.filter((d: any) => d.status === 'Completed').length || 0;
  const campDonationsCount = donorData?.donatedCamps?.length || 0;
  const donationsCount = baseDonationsCount + campDonationsCount;
  const lastDonatedAt = donorData?.lastDonatedAt;

  // Find the first pending appointment from real backend data
  const upcomingAppointment = donorData?.donations?.find((d: any) => ['Pending', 'Accepted'].includes(d.status));
  const upcomingCamps = donorData?.upcomingCamps || [];

  const formatAppointmentTime = (dateStr: string) => {
    try {
      const start = new Date(dateStr);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      
      const formatTime = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      };
      
      return `${formatTime(start)} - ${formatTime(end)}`;
    } catch {
      return '10:00 AM - 10:30 AM';
    }
  };

  const showAppointmentCard = !!upcomingAppointment || hasAppointment;
  const dispBank = upcomingAppointment ? upcomingAppointment.bloodBank?.name : appointmentBank;
  const dispDate = upcomingAppointment ? upcomingAppointment.scheduledDate : appointmentDate;
  const dispTime = upcomingAppointment ? formatAppointmentTime(upcomingAppointment.scheduledDate) : appointmentTime;
  const dispAddress = upcomingAppointment ? (upcomingAppointment.bloodBank?.address || 'Sector 37, Chandigarh') : appointmentAddress;
  const dispStatus = upcomingAppointment ? upcomingAppointment.status : 'Confirmed';

  const combineDateAndTimeSlot = (dateStr: string, timeSlotStr: string) => {
    try {
      const timePart = timeSlotStr.split('-')[0].trim();
      const [time, ampm] = timePart.split(' ');
      let [hoursStr, minutesStr] = time.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
      const hh = hours.toString().padStart(2, '0');
      const mm = minutes.toString().padStart(2, '0');
      return new Date(`${dateStr}T${hh}:${mm}:00`);
    } catch (err) {
      console.error("Failed to parse date/time slot:", err);
      return new Date(`${dateStr}T10:00:00`);
    }
  };

  const handleCancelAppointment = async () => {
    if (upcomingAppointment) {
      try {
        const token = localStorage.getItem('liforce_userId');
        if (!token) return;
        
        const response = await fetchWithAuth(`${API_URL}/donations/${upcomingAppointment.id}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          showToast('Appointment cancelled successfully.', 'success');
          fetchDonorProfile();
        } else {
          showToast('Failed to cancel appointment.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('An error occurred while cancelling appointment.', 'error');
      }
    } else {
      setHasAppointment(false);
      showToast('Appointment cancelled.', 'info');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (upcomingAppointment) {
      try {
        const token = localStorage.getItem('liforce_userId');
        if (!token) return;
        
        const combinedDateTime = combineDateAndTimeSlot(rescheduleDate, rescheduleTime);
        
        const response = await fetchWithAuth(`${API_URL}/donations/${upcomingAppointment.id}/reschedule`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            scheduledDate: combinedDateTime.toISOString()
          })
        });
        
        if (response.ok) {
          showToast('📅 Appointment rescheduled successfully!', 'success');
          setIsRescheduleOpen(false);
          fetchDonorProfile();
        } else {
          const data = await response.json();
          showToast(data.error || 'Failed to reschedule appointment.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('An error occurred while rescheduling appointment.', 'error');
      }
    } else {
      setAppointmentDate(rescheduleDate);
      setAppointmentTime(rescheduleTime);
      setIsRescheduleOpen(false);
      showToast('Appointment rescheduled successfully!', 'success');
    }
  };

  const handleBookAppointment = async () => {
    if (!scheduleDate) {
      showToast('Please select a date for your appointment.', 'info');
      return;
    }
    
    try {
      const token = localStorage.getItem('liforce_userId');
      if (!token) {
        showToast('Please login as a donor to book an appointment.', 'error');
        return;
      }
      
      const combinedDateTime = combineDateAndTimeSlot(scheduleDate, scheduleTime);
      
      const response = await fetchWithAuth(`${API_URL}/donations/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bloodBankId: scheduleBankId,
          scheduledDate: combinedDateTime.toISOString()
        })
      });
      
      if (response.ok) {
        showToast('📅 Appointment booked successfully! The Blood Bank has been notified.', 'success');
        setIsScheduleOpen(false);
        fetchDonorProfile();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to book appointment.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while booking appointment.', 'error');
    }
  };
  
  // Calculate days until next eligible donation (56-day cooldown per WHO guidelines)
  let daysUntilEligible = 0;
  let eligibilityPercent = 100;
  let eligibleDateStr = '';
  if (lastDonatedAt) {
    const lastDate = new Date(lastDonatedAt);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 56);
    eligibleDateStr = nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    daysUntilEligible = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    eligibilityPercent = Math.min(100, Math.max(0, ((56 - daysUntilEligible) / 56) * 100));
  }
  const onCooldown = daysUntilEligible > 0;


  // Generate dynamic DONATION_HISTORY (last 12 months)
  const donationHistory = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - (11 - i));
    const monthStr = monthDate.toLocaleString('default', { month: 'short' });
    
    const directCount = donorData?.donations?.filter((d: any) => {
      const dDate = new Date(d.scheduledDate);
      return dDate.getMonth() === monthDate.getMonth() && dDate.getFullYear() === monthDate.getFullYear() && d.status === 'Completed';
    }).length || 0;

    const campCount = donorData?.donatedCamps?.filter((c: any) => {
      const cDate = new Date(c.date);
      return cDate.getMonth() === monthDate.getMonth() && cDate.getFullYear() === monthDate.getFullYear();
    }).length || 0;

    const count = directCount + campCount;

    return { month: monthStr, donations: count };
  });

  // Generate dynamic BADGES
  const badges = [
    { id: 1, name: 'First Blood', earned: donationsCount >= 1, icon: '🩸' },
    { id: 2, name: 'Bronze Donor', earned: rewardPoints >= 500, icon: '🥉' },
    { id: 3, name: '3 Streak', earned: donationsCount >= 3, icon: '🔥' },
    { id: 4, name: 'Silver Donor', earned: rewardPoints >= 1500, icon: '🥈' },
    { id: 5, name: 'Gold Donor', earned: rewardPoints >= 3000, icon: '🥇' },
    { id: 6, name: 'Hero', earned: rewardPoints >= 5000, icon: '🦸' },
  ];

  // Generate dynamic RECENT_ACTIVITY
  let recentActivity: any[] = [];
  if (donorData?.donations) {
    donorData.donations.forEach((d: any) => {
      const timeStr = new Date(d.scheduledDate).toLocaleDateString();
      let icon = <CalendarClock className="h-5 w-5 text-text-secondary" />;
      let title = 'Donation Scheduled';
      if (d.status === 'Completed') {
        icon = <CheckCircle className="h-5 w-5 text-accent" />;
        title = 'Donation Confirmed';
      }
      recentActivity.push({
        id: `don-${d.id}`,
        type: 'donation',
        title,
        desc: d.bloodBank?.name || 'Blood Center',
        time: timeStr,
        icon,
        timestamp: new Date(d.scheduledDate).getTime()
      });
    });
  }

  if (donorData?.donatedCamps) {
    donorData.donatedCamps.forEach((camp: any) => {
      recentActivity.push({
        id: `camp-${camp.id}`,
        type: 'donation',
        title: 'Donated at Camp',
        desc: `${camp.title} by ${camp.organizerName || 'Blood Bank'}`,
        time: new Date(camp.date).toLocaleDateString(),
        icon: <CheckCircle className="h-5 w-5 text-accent" />,
        timestamp: new Date(camp.date).getTime()
      });
    });
  }

  recentActivity.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  recentActivity = recentActivity.slice(0, 5);
  
  if (recentActivity.length === 0) {
    recentActivity.push({
      id: 'empty',
      type: 'info',
      title: 'No activity yet',
      desc: 'Schedule your first donation!',
      time: 'Just now',
      icon: <Activity className="h-5 w-5 text-primary" />
    });
  }

  const streak = Math.min(donationsCount, 12);

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection !== 'dashboard' && (
        <div className="mb-6">
          {activeSection === 'donations' && (
            <SectionPlaceholder title="My donations" description="Your donation history and impact.">
              <ul className="space-y-3">
                {(donorData?.donations?.length ? donorData.donations : []).map((d: any) => (
                  <li key={d.id} className="flex justify-between items-center p-4 bg-background rounded-xl border border-border">
                    <span className="font-medium">{d.bloodBank?.name || 'Blood center'}</span>
                    <span className="text-sm text-text-secondary">{new Date(d.scheduledDate).toLocaleDateString()} · {d.status}</span>
                  </li>
                ))}
                {!donorData?.donations?.length && <p className="text-text-secondary">No donations recorded yet.</p>}
              </ul>
            </SectionPlaceholder>
          )}
          {activeSection === 'schedule' && (
            <SectionPlaceholder title="Schedule" description="Upcoming and past appointments.">
              {showAppointmentCard ? (
                <>
                  <p className="text-text-primary font-medium">
                    {dispBank} — {getMonthAbbr(dispDate)} {getDayStr(dispDate)}, {dispTime}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">{dispAddress}</p>
                  <div className="flex gap-2 mt-4">
                    <button 
                      type="button" 
                      onClick={() => { 
                        setRescheduleDate(upcomingAppointment ? new Date(upcomingAppointment.scheduledDate).toISOString().split('T')[0] : appointmentDate); 
                        setRescheduleTime(upcomingAppointment ? formatAppointmentTime(upcomingAppointment.scheduledDate) : appointmentTime); 
                        setIsRescheduleOpen(true); 
                      }} 
                      className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Reschedule
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancelAppointment} 
                      className="px-4 py-2 border border-critical text-critical rounded-lg text-sm font-medium hover:bg-[#FADBD8]"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-text-secondary">No scheduled appointments.</p>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (onCooldown) {
                        showToast(`⏳ Cooldown Active: You can donate again in ${daysUntilEligible} day${daysUntilEligible === 1 ? '' : 's'}${eligibleDateStr ? ` (eligible on ${eligibleDateStr})` : ''}.`, 'error');
                        return;
                      }
                      setScheduleDate(new Date().toISOString().split('T')[0]);
                      setScheduleTime('10:00 AM - 10:30 AM');
                      setIsScheduleOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Schedule Appointment
                  </button>
                </div>
              )}
            </SectionPlaceholder>
          )}
          {activeSection === 'alerts' && (
            <SectionPlaceholder title="Alerts" description={`${nearbyRequests.length} active emergency request(s) near you.`}>
              <ul className="space-y-3">
                {nearbyRequests.map((req: any, i: number) => (
                  <li key={i} className="p-4 bg-[#FADBD8] rounded-xl border border-[#F5B7B1]">
                    <p className="font-bold text-critical">{req.bloodGroup} at {req.hospitalAddress}</p>
                    <button type="button" onClick={() => navigate('/emergency')} className="mt-2 text-sm font-bold text-primary hover:underline">View details →</button>
                  </li>
                ))}
                {!nearbyRequests.length && <p className="text-text-secondary">No active alerts right now.</p>}
              </ul>
            </SectionPlaceholder>
          )}
          {activeSection === 'rewards' && (
            <SectionPlaceholder title="Rewards & badges" description={`You have ${rewardPoints} reward points.`}>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {badges.map((b) => (
                  <div key={b.id} className={`text-center p-3 rounded-xl border ${b.earned ? 'border-primary bg-primary-light' : 'border-border opacity-50'}`}>
                    <span className="text-2xl">{b.icon}</span>
                    <p className="text-[10px] font-bold mt-1">{b.name}</p>
                  </div>
                ))}
              </div>
            </SectionPlaceholder>
          )}
          {activeSection === 'health' && (
            <SectionPlaceholder title="Health tracker" description="Track eligibility and wellness notes.">
              <p>Next eligible donation: <strong>{daysUntilEligible === 0 ? 'Now' : `in ${daysUntilEligible} days`}</strong></p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${eligibilityPercent}%` }} />
              </div>
            </SectionPlaceholder>
          )}
          {activeSection === 'messages' && (
            <SectionPlaceholder title="Messages" description="Chat with LiForce AI or blood bank coordinators.">
              <button type="button" onClick={openChat} className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">Open Chat</button>
            </SectionPlaceholder>
          )}
          {activeSection === 'settings' && (
            <SectionPlaceholder title="Settings" description="Manage your profile and notification preferences.">
              <button type="button" onClick={() => navigate('/profile/me')} className="text-primary font-bold hover:underline">View public profile →</button>
            </SectionPlaceholder>
          )}
        </div>
      )}

      {activeSection === 'dashboard' && (
      <>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mr-4">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{getGreeting()}, {name.split(' ')[0]}</h1>
            <div className="flex items-center mt-1">
              <span className="px-2 py-0.5 bg-primary-light text-primary-dark rounded text-xs font-bold mr-2 border border-[#F5B7B1]">{bloodGroup}</span>
              <span className="text-sm text-text-secondary">Ready to save lives today?</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center bg-white border border-border text-text-primary px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors relative overflow-hidden cursor-pointer shadow-sm"
          >
            <User className="h-4 w-4 mr-2 text-primary" /> Profile
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center bg-white border border-border text-text-primary p-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="Settings"
          >
            <SettingsIcon className="h-5 w-5 text-text-secondary" />
          </button>
          <button
            type="button"
            onClick={() => setIsSOSTrackerOpen(true)}
            className="flex items-center bg-[#FADBD8] text-critical px-4 py-2 rounded-lg font-bold hover:bg-[#F5B7B1] transition-colors relative overflow-hidden cursor-pointer"
          >
            <AlertTriangle className="h-4 w-4 mr-2" /> SOS Status
          </button>
          <button
            type="button"
            onClick={() => setIsNotificationsModalOpen(true)}
            className="p-2 rounded-lg border border-border text-text-secondary hover:bg-gray-50 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {(nearbyRequests.length > 0 || generalNotifications.filter(n => !n.isRead).length > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>



      {/* Row 1 - Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Total donations</h3>
            <div className="p-2 bg-primary-light rounded-lg"><Droplet className="h-5 w-5 text-primary" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{donationsCount}</p>
          <p className="text-xs text-accent font-medium mt-2 flex items-center">+1 this year</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Next eligible date</h3>
            <div className="p-2 bg-gray-100 rounded-lg"><CalendarClock className="h-5 w-5 text-text-secondary" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{daysUntilEligible === 0 ? 'Ready' : daysUntilEligible}<span className="text-lg text-text-secondary ml-1">{daysUntilEligible === 0 ? '' : 'days'}</span></p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${eligibilityPercent}%` }}></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Reward points</h3>
            <div className="p-2 bg-[#E8F5F1] rounded-lg"><Trophy className="h-5 w-5 text-accent" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{rewardPoints}</p>
          <p className="text-xs text-text-secondary mt-2">{1000 - (rewardPoints % 1000)} pts to next badge</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Current streak</h3>
            <div className="p-2 bg-[#FEF5E7] rounded-lg"><Flame className="h-5 w-5 text-warning" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary flex items-center">{streak} <Flame className="h-6 w-6 ml-2 text-warning" fill="#E67E22" /></p>
          <p className="text-xs text-text-secondary mt-2">Donate in 2026 to keep it alive</p>
        </motion.div>
      </div>

      {/* Row 2 - Charts & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col h-[400px]">
          <h3 className="font-bold text-text-primary mb-6">Donation History (12 Months)</h3>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#FCEBEB' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="donations" fill="#C0392B" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-text-primary">Nearby Urgent Requests</h3>
            <span className="flex items-center text-xs font-bold text-critical bg-[#FADBD8] px-2 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-critical mr-1 animate-pulse"></span> {nearbyRequests.length} Active</span>
          </div>
          <div className="flex-grow rounded-xl overflow-hidden border border-border relative z-0">
            <MapContainer 
              key={`${donorData?.latitude || 30.7333}-${donorData?.longitude || 76.7794}`}
              center={[donorData?.latitude || 30.7333, donorData?.longitude || 76.7794]} 
              zoom={12} 
              scrollWheelZoom={false} 
              doubleClickZoom={false}
              touchZoom={false}
              keyboard={false}
              className="w-full h-full" 
              zoomControl={false}
            >
              <CustomZoomControl />
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              
              {donorData?.latitude && donorData?.longitude && (
                <Marker position={[donorData.latitude, donorData.longitude]} icon={orangeIcon} zIndexOffset={1000}>
                  <LeafletTooltip direction="top" opacity={1} permanent={false}>
                    <span className="font-bold">You</span>
                  </LeafletTooltip>
                </Marker>
              )}

              {nearbyRequests.map((req, idx) => (
                <Marker key={idx} position={[req.latitude, req.longitude]} icon={redIcon}>
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px]">
                      <div className="font-bold text-sm text-text-primary">{req.bloodGroup} Needed ({req.unitsRequired} units)</div>
                      <div className="text-xs text-text-primary font-semibold mt-1">
                        Patient: {req.patientName || "Anonymous"}
                        {(req.patientAge || req.patientGender) && (
                          <span className="text-[10px] font-normal text-text-secondary ml-1">
                            ({req.patientAge ? `${req.patientAge} y/o` : ''}
                            {req.patientAge && req.patientGender ? ', ' : ''}
                            {req.patientGender})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary mt-1 mb-2">{req.hospitalAddress}</div>
                      
                      {selectedResponseRequestId === req.id ? (
                        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border">
                          <span className="text-[10px] font-bold text-text-secondary">Are you donating or bringing someone?</span>
                          <div className="flex gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleRespondToSOS(req.id, 'I will donate myself')}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                onCooldown
                                  ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={onCooldown ? `Cooldown active — ${daysUntilEligible} days remaining` : ''}
                            >
                              {onCooldown ? `\u23f3 Cooldown (${daysUntilEligible}d)` : 'I will donate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRespondToSOS(req.id, 'I will bring someone else')}
                              className="px-2 py-1 bg-accent hover:bg-accent-dark text-white rounded text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Will bring someone
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedResponseRequestId(null)}
                              className="px-1.5 py-1 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => setSelectedResponseRequestId(req.id)}
                          className="w-full mt-2 px-3 py-1.5 bg-critical hover:bg-critical-dark text-white rounded text-xs font-bold transition-colors text-center cursor-pointer shadow-sm"
                        >
                          Respond Now
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </motion.div>
      </div>

      {/* Row 3 - 3 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Upcoming Schedules (Appointments & Camps) */}
        {(showAppointmentCard || upcomingCamps.length > 0) ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-6 max-h-[420px] overflow-y-auto">
             <h3 className="font-bold text-text-primary flex items-center justify-between border-b border-border pb-3 shrink-0">
               Upcoming Schedules
             </h3>
             
             {showAppointmentCard && (
               <div className="flex flex-col gap-4 border-b border-border pb-4 last:border-0 last:pb-0 shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Appointment</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dispStatus === 'Pending' ? 'text-yellow-800 bg-yellow-50 border border-yellow-200' : 'text-text-secondary bg-gray-100'}`}>{dispStatus}</span>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-primary-light rounded-xl p-2 flex flex-col items-center justify-center min-w-[56px] border border-[#F5B7B1]">
                      <span className="text-[10px] font-bold text-primary-dark uppercase">{getMonthAbbr(dispDate)}</span>
                      <span className="text-lg font-bold text-primary">{getDayStr(dispDate)}</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-bold text-sm text-text-primary">{dispBank}</h4>
                      <p className="text-xs text-text-secondary flex items-center mt-1"><Calendar className="w-3 h-3 mr-1"/> {dispTime}</p>
                      <p className="text-xs text-text-secondary flex items-center mt-1"><MapPin className="w-3 h-3 mr-1"/> {dispAddress}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setRescheduleDate(upcomingAppointment ? new Date(upcomingAppointment.scheduledDate).toISOString().split('T')[0] : appointmentDate);
                        setRescheduleTime(upcomingAppointment ? formatAppointmentTime(upcomingAppointment.scheduledDate) : appointmentTime);
                        setIsRescheduleOpen(true);
                      }} 
                      className="flex-1 border border-border text-text-primary font-medium py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Reschedule
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancelAppointment} 
                      className="flex-1 bg-white border border-critical text-critical font-medium py-1.5 rounded-lg text-xs hover:bg-[#FADBD8] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
               </div>
             )}

             {upcomingCamps.map((camp: any) => (
               <div key={camp.id} className="flex flex-col gap-4 border-b border-border pb-4 last:border-0 last:pb-0 shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-accent uppercase tracking-wider">Blood Camp</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-accent bg-accent/10 border border-accent/20">Joined</span>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-accent/10 rounded-xl p-2 flex flex-col items-center justify-center min-w-[56px] border border-accent/20">
                      <span className="text-[10px] font-bold text-accent uppercase">{getMonthAbbr(camp.date)}</span>
                      <span className="text-lg font-bold text-accent">{getDayStr(camp.date)}</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-bold text-sm text-text-primary leading-tight">{camp.title}</h4>
                      <p className="text-xs text-text-secondary flex items-center mt-1.5"><Users className="w-3 h-3 mr-1 shrink-0"/> {camp.organizerName}</p>
                      <p className="text-xs text-text-secondary flex items-center mt-1"><Calendar className="w-3 h-3 mr-1 shrink-0"/> {new Date(camp.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <p className="text-xs text-text-secondary flex items-center mt-1"><MapPin className="w-3 h-3 mr-1 shrink-0"/> {camp.location}</p>
                    </div>
                  </div>
               </div>
             ))}

          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-text-primary mb-6 flex items-center justify-between">Upcoming Schedules</h3>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CalendarClock className="w-12 h-12 text-text-secondary opacity-40 mb-3" />
                <p className="font-medium text-text-primary">No Scheduled Events</p>
                <p className="text-xs text-text-secondary mt-1 px-4">You have no upcoming blood donations or camps. Schedule one to make a difference!</p>
              </div>
            </div>
            <button 
                type="button" 
                onClick={() => {
                  if (onCooldown) {
                    showToast(`⏳ Cooldown Active: You can donate again in ${daysUntilEligible} day${daysUntilEligible === 1 ? '' : 's'}${eligibleDateStr ? ` (eligible on ${eligibleDateStr})` : ''}.`, 'error');
                    return;
                  }
                  setScheduleDate(new Date().toISOString().split('T')[0]);
                  setScheduleTime('10:00 AM - 10:30 AM');
                  setIsScheduleOpen(true);
                }} 
                className={`w-full font-medium py-2 rounded-lg text-sm transition-colors mt-4 cursor-pointer ${
                  onCooldown
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {onCooldown ? `⏳ Cooldown — ${daysUntilEligible} days remaining` : 'Schedule Appointment'}
              </button>
          </motion.div>
        )}

        {/* My Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-primary">My Badges</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 mb-2 transition-transform hover:scale-110 cursor-pointer ${badge.earned ? 'bg-primary-light border-primary' : 'bg-gray-50 border-gray-200 grayscale opacity-50'}`}>
                  {badge.icon}
                </div>
                <span className={`text-[10px] text-center font-semibold ${badge.earned ? 'text-text-primary' : 'text-text-secondary'}`}>{badge.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-text-primary mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-start relative">
                {index !== recentActivity.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-[-16px] w-[2px] bg-border"></div>
                )}
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-border flex items-center justify-center z-10 shrink-0">
                  {activity.icon}
                </div>
                <div className="ml-4 pb-2">
                  <h4 className="text-sm font-bold text-text-primary">{activity.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{activity.desc}</p>
                  <p className="text-[10px] text-text-secondary mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Row 4 - AI Chatbot Widget */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
        <div className="flex items-center mb-4 md:mb-0 relative z-10">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 mr-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">LiForce AI Assistant</h3>
            <p className="text-primary-light text-sm">Check your eligibility today or find nearby camps instantly.</p>
          </div>
        </div>
        <button type="button" onClick={openChat} className="w-full md:w-auto bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-sm relative z-10 whitespace-nowrap">
          Open Chat
        </button>
      </motion.div>
      </>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl max-w-md w-full border border-border shadow-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary-light opacity-30 rounded-full -mr-10 -mt-10 blur-xl"></div>
            
            <h3 className="text-xl font-bold text-text-primary mb-2">Reschedule Appointment</h3>
            <p className="text-sm text-text-secondary mb-6">Modify your blood donation details at <span className="font-semibold text-text-primary">{dispBank}</span>.</p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="reschedule-date" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Select Date</label>
                <input 
                  type="date" 
                  id="reschedule-date"
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="reschedule-time" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Select Time Slot</label>
                <select 
                  id="reschedule-time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm cursor-pointer"
                >
                  <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                  <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                  <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-8">
              <button 
                type="button" 
                onClick={handleRescheduleAppointment}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm shadow-md cursor-pointer"
              >
                Confirm Reschedule
              </button>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    handleCancelAppointment();
                    setIsRescheduleOpen(false);
                  }}
                  className="flex-1 bg-white border border-critical text-critical font-semibold py-2.5 rounded-xl hover:bg-[#FADBD8] transition-colors text-sm cursor-pointer"
                >
                  Cancel Appointment
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsRescheduleOpen(false)}
                  className="flex-1 bg-gray-100 border border-transparent text-text-secondary font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                >
                  Go Back
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl max-w-md w-full border border-border shadow-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary-light opacity-30 rounded-full -mr-10 -mt-10 blur-xl"></div>
            
            <h3 className="text-xl font-bold text-text-primary mb-2">Schedule Blood Donation</h3>
            <p className="text-sm text-text-secondary mb-6">Select your preferred blood bank, date, and time slot to book your appointment.</p>
            
            <div className="space-y-4">
              {/* Step 1: Select Blood Bank */}
              <div>
                <label htmlFor="schedule-bank" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Select Blood Bank</label>
                <select 
                  id="schedule-bank"
                  value={scheduleBankId}
                  onChange={(e) => setScheduleBankId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm cursor-pointer"
                >
                  {(bloodBanks.length > 0 ? bloodBanks : AVAILABLE_BLOOD_BANKS).map((bank) => (
                    <option key={bank.id} value={bank.id}>{bank.name} — {bank.address}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Date */}
              <div>
                <label htmlFor="schedule-date" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Select Date</label>
                <input 
                  type="date" 
                  id="schedule-date"
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm"
                  required
                />
              </div>
              
              {/* Step 3: Select Time Slot */}
              <div>
                <label htmlFor="schedule-time" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Select Time Slot</label>
                <select 
                  id="schedule-time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm cursor-pointer"
                >
                  <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                  <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                  <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-8">
              <button 
                type="button" 
                onClick={() => setIsScheduleOpen(false)}
                className="flex-1 bg-gray-100 border border-transparent text-text-secondary font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm cursor-pointer"
              >
                Go Back
              </button>
              <button 
                type="button" 
                onClick={handleBookAppointment}
                className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm shadow-md cursor-pointer"
              >
                Book Now
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SOS Tracker Modal */}
      {isSOSTrackerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl max-w-4xl w-full border border-border shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button 
              type="button" 
              onClick={() => setIsSOSTrackerOpen(false)}
              className="absolute top-6 right-6 p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-gray-100 border border-border bg-white shadow-sm transition-colors cursor-pointer z-20 flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {activeSOSRequest ? (
              <>
                {/* Red top border/accents */}
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-critical"></div>
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#FADBD8] opacity-20 rounded-full -mr-10 -mt-10 blur-xl"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2 pr-0 sm:pr-12">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-critical animate-ping"></span>
                      <h2 className="text-lg font-bold text-text-primary">Active Emergency SOS Request Tracker</h2>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">Live updates from matching donors and blood banks near your patient</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleFulfillSOS(activeSOSRequest.id)}
                      className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark as Fulfilled
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleCancelSOS(activeSOSRequest.id)}
                      className="px-4 py-2 border border-critical text-critical rounded-lg text-xs font-bold hover:bg-[#FADBD8] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel SOS Status
                    </button>
                  </div>
                </div>

                {/* Info Box of Patient & Hospital */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-border mb-6">
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Patient Name</p>
                    <p className="text-sm font-bold text-text-primary mt-1">
                      {activeSOSRequest.patientName}
                      {(activeSOSRequest.patientAge || activeSOSRequest.patientGender) && (
                        <span className="text-xs font-normal text-text-secondary ml-1">
                          ({activeSOSRequest.patientAge ? `${activeSOSRequest.patientAge} y/o` : ''}
                          {activeSOSRequest.patientAge && activeSOSRequest.patientGender ? ', ' : ''}
                          {activeSOSRequest.patientGender})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Blood Group Required</p>
                    <span className="inline-block px-2.5 py-0.5 bg-critical/10 text-critical border border-[#F5B7B1] rounded text-xs font-extrabold mt-1">
                      {activeSOSRequest.bloodGroup}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Units Required</p>
                    <p className="text-sm font-bold text-text-primary mt-1">{activeSOSRequest.unitsRequired} Units</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Hospital Location</p>
                    <p className="text-sm font-bold text-text-primary mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-critical shrink-0" /> {activeSOSRequest.hospitalAddress}
                    </p>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 px-4 bg-gray-50/50 border border-border rounded-xl mb-6">
                  {[
                    { label: 'Alert Broadcasted', description: 'Matched nearby donors', status: 'completed' },
                    { 
                      label: 'Responders Matched', 
                      description: (activeSOSRequest.responses || []).length > 0 
                        ? `${(activeSOSRequest.responses || []).length} life-saver(s) found` 
                        : 'Waiting for response', 
                      status: (activeSOSRequest.responses || []).length > 0 ? 'completed' : 'active' 
                    },
                    { label: 'Fulfilled / Resolved', description: 'Patient received blood', status: 'pending' }
                  ].map((step, idx, arr) => (
                    <div key={idx} className="flex-1 flex items-center md:flex-col md:text-center gap-3 md:gap-2 relative w-full">
                      {/* Connector Line */}
                      {idx < arr.length - 1 && (
                        <div className="hidden md:block absolute top-4 left-[60%] right-[-40%] h-[2px] bg-gray-200 z-0">
                          <div 
                            className="h-full bg-[#10B981] transition-all duration-500" 
                            style={{ width: step.status === 'completed' ? '100%' : '0%' }}
                          />
                        </div>
                      )}
                      
                      {/* Icon Node */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 shrink-0 border-2 ${
                        step.status === 'completed' 
                          ? 'bg-emerald-50 border-[#10B981] text-[#10B981]' 
                          : step.status === 'active'
                          ? 'bg-primary-light border-primary text-primary animate-pulse'
                          : 'bg-gray-100 border-gray-200 text-text-secondary'
                      }`}>
                        {step.status === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      
                      {/* Labels */}
                      <div>
                        <p className={`font-semibold text-sm ${
                          step.status === 'completed' ? 'text-[#10B981]' : step.status === 'active' ? 'text-primary' : 'text-text-secondary'
                        }`}>{step.label}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Responders segment */}
                <div>
                  <h3 className="font-bold text-sm text-text-primary mb-4 flex items-center justify-between">
                    <span>Matched Responders</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded text-text-secondary">
                      {(activeSOSRequest.responses || []).length} Responded
                    </span>
                  </h3>
                  
                  {(activeSOSRequest.responses || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-border">
                      <div className="relative mb-3">
                        <span className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></span>
                        <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center relative">
                          <Activity className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-text-primary">Finding Life-Savers...</p>
                      <p className="text-xs text-text-secondary mt-1 px-6">SOS alert successfully broadcasted to nearby eligible donors and blood banks.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(activeSOSRequest.responses || []).map((resp: any) => {
                        const respInitials = (resp.responderName || 'BB').substring(0, 2).toUpperCase();
                        const isBloodBank = resp.responderType === 'BloodBank';
                        return (
                          <motion.div 
                            key={resp.id} 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-xl border border-border bg-white shadow-sm flex items-start justify-between gap-3 hover:shadow transition-shadow"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 relative ${
                                isBloodBank ? 'bg-purple-600' : 'bg-primary'
                              }`}>
                                {respInitials}
                                <span className="absolute bottom-0 right-0 w-4 h-4 bg-accent rounded-full border-2 border-white flex items-center justify-center">
                                  <Heart className="w-2.5 h-2.5 text-white" fill="white" />
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-sm text-text-primary">{resp.responderName}</h4>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    isBloodBank 
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}>
                                    {isBloodBank ? 'Blood Bank' : 'Donor'}
                                  </span>
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-critical/10 text-critical border border-critical/20 rounded">
                                    {resp.bloodGroup}
                                  </span>
                                </div>
                                
                                {/* Option chosen */}
                                <p className="text-xs text-text-secondary mt-1 font-medium italic">
                                  "{resp.responseType}"
                                </p>
                                
                                {resp.responderPhone && (
                                  <p className="text-xs text-text-secondary mt-1.5 flex items-center gap-1 font-mono font-medium">
                                    <Phone className="w-3.5 h-3.5 text-text-secondary" /> {resp.responderPhone}
                                  </p>
                                )}
                              </div>
                            </div>
                            

                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-[#FADBD8] rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-critical" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Active SOS Broadcasts</h3>
                <p className="text-sm text-text-secondary max-w-md mb-8">
                  You have not broadcasted any active emergency SOS alerts. If you or someone you know requires urgent blood donation, broadcast an SOS alert to notify nearby donors and blood banks immediately.
                </p>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsSOSTrackerOpen(false);
                      navigate('/emergency');
                    }}
                    className="px-6 py-3 bg-critical hover:bg-critical-dark text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20 cursor-pointer text-sm"
                  >
                    Broadcast Emergency Alert
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsSOSTrackerOpen(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded-xl font-bold transition-colors cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Profile view & Edit Modal */}
      {isProfileModalOpen && donorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl max-w-lg w-full border border-border shadow-2xl overflow-hidden relative"
          >
            {/* Header cover decoration */}
            <div className="h-32 bg-gradient-to-r from-primary to-primary-dark relative">
              <button 
                type="button" 
                onClick={() => { setIsProfileModalOpen(false); setIsEditingProfile(false); }}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-20 cursor-pointer"
                aria-label="Close profile"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            </div>

            {/* Profile Avatar Overlay */}
            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -mt-14 mb-6">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg border-4 border-background z-10">
                  <div className="w-full h-full bg-primary-light text-primary-dark rounded-full flex items-center justify-center text-3xl font-extrabold select-none">
                    {initials}
                  </div>
                </div>

              </div>

              {!isEditingProfile ? (
                /* View Profile Mode */
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-2xl font-black text-text-primary">{donorData.name}</h3>
                      <span className="bg-primary-light text-primary-dark font-extrabold px-2.5 py-0.5 rounded-full text-xs border border-[#F5B7B1] uppercase tracking-wider">
                        {bloodGroup}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-accent mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified Donor
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 border border-border space-y-4">
                    <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-text-secondary">Email</span>
                      <span className="font-bold text-text-primary">{donorData.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-text-secondary">Phone</span>
                      <span className="font-bold text-text-primary">{donorData.phone || 'Not Provided'}</span>
                    </div>
                    <div className="flex items-start justify-between text-sm py-1 gap-4 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-text-secondary shrink-0">Address</span>
                      <span className="font-bold text-text-primary capitalize text-right break-words">{donorData.address || 'Not Provided'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-text-secondary">Max Travel Distance</span>
                      <span className="font-bold text-text-primary">{donorData.maxTravelDistanceKm || 50} km</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1">
                      <span className="font-semibold text-text-secondary">SOS Notifications</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${donorData.notificationsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {donorData.notificationsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button 
                      type="button" 
                      onClick={() => { setIsProfileModalOpen(false); navigate('/profile/me'); }}
                      className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <User className="w-4 h-4" /> View Public Profile
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setIsProfileModalOpen(false); setIsEditingProfile(false); }}
                      className="flex-1 bg-gray-100 border border-transparent text-text-secondary font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Profile Mode */
                <form onSubmit={handleUpdateProfile}>
                  <h3 className="text-xl font-bold text-text-primary mb-1">Edit Profile Details</h3>
                  <p className="text-xs text-text-secondary mb-6">Modify your preferences or coordinates to help with matches.</p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-phone" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        id="edit-phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-address" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Address</label>
                      <input 
                        id="edit-address"
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="e.g. 123 Main St, City"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-max-distance" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Max Travel Distance ({editMaxDistance} km)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          id="edit-max-distance"
                          min="5"
                          max="150"
                          step="5"
                          value={editMaxDistance}
                          onChange={(e) => setEditMaxDistance(Number(e.target.value))}
                          className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="w-12 text-right text-sm font-bold text-text-primary">{editMaxDistance}km</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-border mt-2">
                      <div>
                        <span className="block text-sm font-bold text-text-primary">SOS Match Alerts</span>
                        <span className="text-[10px] text-text-secondary block">Receive instant push notifications when a nearby patient needs {bloodGroup} blood.</span>
                      </div>
                      <label htmlFor="edit-notifications" className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          id="edit-notifications"
                          checked={editNotifications}
                          onChange={(e) => setEditNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Pin Your Location</label>
                      <div className="h-48 w-full rounded-xl overflow-hidden border border-border">
                        <MapContainer 
                          center={editCoordinates || [30.7333, 76.7794]} 
                          zoom={editCoordinates ? 13 : 11} 
                          scrollWheelZoom={true} 
                          className="w-full h-full"
                        >
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                          <LocationPicker position={editCoordinates} setPosition={setEditCoordinates} />
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
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 bg-gray-100 border border-transparent text-text-secondary font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Notifications / Alerts Modal */}
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
                  {nearbyRequests.length + generalNotifications.filter(n => !n.isRead).length} Active
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
              {nearbyRequests.length > 0 || generalNotifications.filter(n => !n.isRead).length > 0 ? (
                <>
                {nearbyRequests.map((req: any, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-[#FADBD8]/30 rounded-xl border border-[#F5B7B1]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#FADBD8]/40 transition-colors"
                  >
                    <div className="flex-grow w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-critical text-white rounded text-[10px] font-extrabold tracking-wider uppercase">Urgent</span>
                        <span className="inline-block px-1.5 py-0.5 bg-critical/10 text-critical border border-[#F5B7B1] rounded text-[11px] font-black">
                          {req.bloodGroup} Needed
                        </span>
                      </div>
                      <p className="font-bold text-sm text-text-primary mt-2.5">
                        Patient: {req.patientName || "Anonymous"}
                        {(req.patientAge || req.patientGender) && (
                          <span className="text-xs font-normal text-text-secondary ml-1">
                            ({req.patientAge ? `${req.patientAge} y/o` : ''}
                            {req.patientAge && req.patientGender ? ', ' : ''}
                            {req.patientGender})
                          </span>
                        )}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs text-text-secondary flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-critical shrink-0" /> 
                          <span className="font-medium">{req.hospitalAddress}</span>
                        </p>
                        {req.unitsRequired && (
                          <p className="text-xs text-text-secondary flex items-center gap-1.5">
                            <Droplet className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>Required: <span className="font-bold text-text-primary">{req.unitsRequired} units</span></span>
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedResponseRequestId === req.id ? (
                      <div className="flex flex-col gap-2 mt-3 sm:mt-0 items-start sm:items-end shrink-0 w-full sm:w-auto">
                        <span className="text-[11px] font-bold text-text-secondary">Are you donating or bringing someone?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespondToSOS(req.id, 'I will donate myself')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-sm ${
                              onCooldown
                                ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            title={onCooldown ? `Cooldown active — ${daysUntilEligible} days remaining` : ''}
                          >
                            {onCooldown ? `⏳ Cooldown (${daysUntilEligible}d)` : 'I will donate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondToSOS(req.id, 'I will bring someone else')}
                            className="px-3 py-1.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                          >
                            Will bring someone
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedResponseRequestId(null)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setSelectedResponseRequestId(req.id)}
                        className="px-4 py-2 bg-critical hover:bg-critical-dark text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer shrink-0 mt-2 sm:mt-0"
                      >
                        Respond Now
                      </button>
                    )}
                  </motion.div>
                ))}

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

export default DonorDashboard;
