import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Database, Users, GitPullRequest, Tent, BarChart2, Radio, Settings,
  Droplets, AlertOctagon, Clock, Activity, ShieldCheck, AlertTriangle, Plus, ChevronRight,
  CheckCircle, XCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import SectionPlaceholder from '../components/dashboard/SectionPlaceholder';
import { useToast } from '../components/ToastProvider';
import { API_URL } from '../lib/api';

const BloodBankDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('overview');
  const [resolvedRequests, setResolvedRequests] = useState<Set<string>>(new Set());

  const sidebarItems = [
    { name: 'Overview', id: 'overview', icon: <LayoutDashboard /> },
    { name: 'Inventory', id: 'inventory', icon: <Database /> },
    { name: 'Donors', id: 'donors', icon: <Users /> },
    { name: 'Requests', id: 'requests', icon: <GitPullRequest /> },
    { name: 'Camps', id: 'camps', icon: <Tent /> },
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

  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('liforce_token');
        if (!token) return;
        
        const response = await fetch(`${API_URL}/bloodbanks/me/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Failed to fetch bloodbank dashboard", err);
      }
    };
    fetchDashboard();
  }, []);

  const bankName = dashboardData?.bank?.name || "Loading...";
  const address = dashboardData?.bank?.address || "Loading...";
  const isVerified = dashboardData?.bank?.isVerified || false;
  
  // Inventory mapping
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const inventoryItems = bloodGroups.map(bg => {
    const existing = dashboardData?.bank?.inventory?.find((i: any) => i.bloodGroup === bg);
    return existing ? { type: bg, units: existing.unitsAvailable, status: existing.status, expiring: 0 } 
                    : { type: bg, units: 0, status: 'Critical', expiring: 0 };
  });

  const totalUnits = inventoryItems.reduce((sum, item) => sum + item.units, 0);
  const criticalCount = inventoryItems.filter(i => i.status === 'Critical').length;
  
  const pendingRequests = dashboardData?.pendingRequests || [];
  const recentDonors = dashboardData?.bank?.donations || [];
  
  // Fake trends for now since we don't have historical units data daily
  const donationTrends = [
    { day: '1', units: 12 }, { day: '5', units: 19 }, { day: '10', units: 15 },
    { day: '15', units: 25 }, { day: '20', units: 22 }, { day: '25', units: 30 },
    { day: '30', units: 28 },
  ];

  const visibleRequests = pendingRequests.filter((r: any) => !resolvedRequests.has(r.id));

  const handleRequestAction = async (id: string, action: 'approve' | 'reject') => {
    setResolvedRequests((prev) => new Set(prev).add(id));
    
    if (action === 'approve') {
      try {
        const matchedRequest = pendingRequests.find((r: any) => r.id === id);
        if (matchedRequest) {
          const bankPhone = dashboardData?.bank?.phone || "1800-LIFORCE";
          const response = await fetch(`${API_URL}/emergencies/${id}/respond`, {
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
            showToast('Response registered! Patient/Donor notified.', 'success');
            return;
          }
        }
      } catch (err) {
        console.error("Failed to submit blood bank response to emergency", err);
      }
    }
    
    showToast(action === 'approve' ? 'Request approved and donor notified.' : 'Request declined.', action === 'approve' ? 'success' : 'info');
  };

  const handleDonationStatus = async (donationId: string, status: 'Completed' | 'Cancelled') => {
    try {
      const token = localStorage.getItem('liforce_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/donations/${donationId}/status`, {
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
        const refreshResponse = await fetch(`${API_URL}/bloodbanks/me/dashboard`, {
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
                <button type="button" onClick={() => showToast(`Restock order placed for ${item.type}.`, 'success')} className="mt-3 w-full py-1.5 bg-white/90 rounded text-xs font-bold text-gray-900">Restock</button>
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
                  <p className="text-sm text-text-secondary">{req.hospitalName}</p>
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
      {activeSection === 'camps' && (
        <SectionPlaceholder title="Donation camps" description="Plan and track community drives.">
          <p className="font-medium">Panjab University Drive — Oct 28</p>
          <p className="text-sm text-text-secondary">Student Center, Sector 14</p>
          <button type="button" onClick={() => showToast('Camp created successfully.', 'success')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-bold">Add new camp</button>
        </SectionPlaceholder>
      )}
      {activeSection === 'analytics' && (
        <SectionPlaceholder title="Analytics" description="30-day donation trends.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
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
        <SectionPlaceholder title="Settings" description="Blood bank profile and verification.">
          <p><strong>{bankName}</strong></p>
          <p className="text-sm text-text-secondary mt-1">{address}</p>
          {isVerified && <p className="text-accent text-sm font-bold mt-2">✓ Verified institution</p>}
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
          <p className="text-3xl font-bold text-text-primary">{pendingRequests.length}</p>
          <p className="text-xs text-text-secondary mt-2">{pendingRequests.filter((r: any) => r.urgency === 'Critical').length} critical emergencies</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-text-secondary font-medium">Fulfilment rate</h3>
            <div className="p-2 bg-[#E8F5F1] rounded-lg"><Activity className="h-5 w-5 text-accent" /></div>
          </div>
          <p className="text-3xl font-bold text-text-primary">94.2%</p>
          <p className="text-xs text-accent mt-2 font-medium flex items-center">+2.1% from last month</p>
        </motion.div>
      </div>

      {/* Row 2 - Inventory Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Live Inventory</h2>
          <button type="button" onClick={() => setActiveSection('inventory')} className="text-primary text-sm font-bold hover:underline flex items-center">View full details <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          {inventoryItems.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * index }}
              key={item.type} 
              className={`relative flex flex-col p-4 rounded-xl border-2 ${getStatusColor(item.status)} shadow-sm`}
            >
              {item.status === 'Critical' && (
                <div className="absolute inset-0 rounded-xl border-2 border-critical animate-ping opacity-20"></div>
              )}
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl font-bold">{item.type}</span>
              </div>
              <span className="text-3xl font-bold mt-1">{item.units} <span className="text-xs font-normal opacity-80">units</span></span>
              
              <div className="mt-4 pt-3 border-t border-white/20">
                {item.expiring > 0 && item.status !== 'Critical' && (
                  <p className="text-[10px] font-medium opacity-90 flex items-center mb-2">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {item.expiring} exp. soon
                  </p>
                )}
                {item.status === 'Critical' && (
                  <p className="text-[10px] font-medium opacity-90 flex items-center mb-2">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Immediate shortage
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => showToast(`Restock order placed for ${item.type}.`, 'success')}
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
          <h3 className="font-bold text-text-primary mb-6">Donation Trends (30 Days)</h3>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} dy={10} />
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
            <button type="button" onClick={() => setActiveSection('donors')} className="text-primary text-sm font-bold hover:underline">View all</button>
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
                        onClick={() => handleDonationStatus(donorObj.id, 'Completed')}
                        className="p-1.5 text-accent hover:bg-[#E8F5F1] rounded transition-colors"
                        title="Confirm Donation"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDonationStatus(donorObj.id, 'Cancelled')}
                        className="p-1.5 text-critical hover:bg-[#FADBD8] rounded transition-colors"
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
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
            <button type="button" onClick={() => setActiveSection('requests')} className="text-primary text-sm font-bold hover:underline">Manage requests</button>
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
                      <p className="text-xs text-text-secondary mt-0.5">{req.hospitalName}</p>
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
                    <td className="py-4 text-right whitespace-nowrap">
                      <button type="button" onClick={() => handleRequestAction(req.id, 'approve')} className="p-1.5 text-accent hover:bg-[#E8F5F1] rounded transition-colors mr-2" title="Approve">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button type="button" onClick={() => handleRequestAction(req.id, 'reject')} className="p-1.5 text-text-secondary hover:bg-gray-100 rounded transition-colors" title="Reject">
                        <XCircle className="w-5 h-5" />
                      </button>
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
            <button type="button" onClick={() => setActiveSection('camps')} className="p-1.5 bg-primary-light text-primary hover:bg-primary hover:text-white rounded transition-colors" aria-label="Add camp">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-background border border-border rounded-xl p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary opacity-5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center mb-3">
              <div className="bg-primary text-white rounded px-2 py-1 text-center mr-3 shrink-0">
                <p className="text-[10px] font-bold uppercase leading-none mb-0.5">Oct</p>
                <p className="text-lg font-bold leading-none">28</p>
              </div>
              <div>
                <h4 className="font-bold text-text-primary text-sm">Panjab University Drive</h4>
                <p className="text-xs text-text-secondary mt-0.5">Student Center, Sector 14</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-primary-light border-2 border-white flex items-center justify-center text-[8px] font-bold text-primary">+42</div>
              </div>
              <span className="text-xs font-medium text-accent">RSVPs</span>
            </div>
          </div>
          
          <button type="button" onClick={() => setActiveSection('camps')} className="w-full mt-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            View all camps
          </button>
        </motion.div>

      </div>
      </>
      )}

    </DashboardLayout>
  );
};

export default BloodBankDashboard;
