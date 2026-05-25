import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, XCircle, Users, ArrowLeft, Droplet, CheckCircle, Check, X } from 'lucide-react';
import { API_URL, fetchWithAuth } from '../lib/api';
import { useToast } from '../components/ToastProvider';

const ViewMyCamps: React.FC = () => {
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [campModalOpen, setCampModalOpen] = useState(false);
  const [campFormData, setCampFormData] = useState({ name: '', location: '', date: '', time: '', description: '', capacity: '50', maxDonorVolunteers: '10', maxBloodBankVolunteers: '5' });

  const [editCampModalOpen, setEditCampModalOpen] = useState(false);
  const [editCampId, setEditCampId] = useState<string | null>(null);
  const [editCampFormData, setEditCampFormData] = useState({ name: '', location: '', date: '', time: '', description: '', capacity: '50', maxDonorVolunteers: '10', maxBloodBankVolunteers: '5' });

  const [abandonCampModalOpen, setAbandonCampModalOpen] = useState(false);
  const [abandonCampData, setAbandonCampData] = useState({ id: '', name: '', reason: '' });

  const [completeCampModalOpen, setCompleteCampModalOpen] = useState(false);
  const [completeCampId, setCompleteCampId] = useState<string | null>(null);

  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [attendeesData, setAttendeesData] = useState<{ donors: any[], bloodBanks: any[], progress?: any }>({ donors: [], bloodBanks: [] });
  const [activeAttendeesTab, setActiveAttendeesTab] = useState<'donors' | 'bloodbanks'>('donors');
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [selectedCampIdForAttendees, setSelectedCampIdForAttendees] = useState<string | null>(null);

  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [tempProgress, setTempProgress] = useState<{checkin: boolean | null, medical: boolean | null, donated: boolean | null}>({checkin: null, medical: null, donated: null});

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('liforce_userId');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await fetchWithAuth(`${API_URL}/bloodbanks/me/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.camps) {
            setCamps(data.camps.map((c: any) => ({
              id: c.id,
              name: c.title,
              location: c.location,
              date: c.date,
              description: c.description || '',
              rsvps: c.rsvps,
              capacity: c.capacity,
              maxDonorVolunteers: c.maxDonorVolunteers,
              maxBloodBankVolunteers: c.maxBloodBankVolunteers
            })));
          }
        }
      } catch (err) {
        showToast('Error fetching camps', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate, showToast]);

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
            capacity: data.camp?.capacity || parseInt(campFormData.capacity) || 50,
            maxDonorVolunteers: data.camp?.maxDonorVolunteers || parseInt(campFormData.maxDonorVolunteers) || 10,
            maxBloodBankVolunteers: data.camp?.maxBloodBankVolunteers || parseInt(campFormData.maxBloodBankVolunteers) || 5
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

  const handleCampEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampFormData.name || !editCampFormData.location || !editCampFormData.date || !editCampFormData.time || !editCampId) return;
    
    const campDateTime = `${editCampFormData.date}T${editCampFormData.time}:00`;
    
    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/camps/${editCampId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editCampFormData.name,
          location: editCampFormData.location,
          date: campDateTime,
          description: editCampFormData.description,
          capacity: editCampFormData.capacity,
          maxDonorVolunteers: editCampFormData.maxDonorVolunteers,
          maxBloodBankVolunteers: editCampFormData.maxBloodBankVolunteers
        })
      });

      if (response.ok) {
        const updatedCamp = await response.json();
        setCamps(prev => prev.map(c => {
          if (c.id === editCampId) {
            return {
              ...c,
              name: updatedCamp.camp?.title || editCampFormData.name,
              location: updatedCamp.camp?.location || editCampFormData.location,
              date: updatedCamp.camp?.date || campDateTime,
              description: updatedCamp.camp?.description || editCampFormData.description,
              capacity: updatedCamp.camp?.capacity || parseInt(editCampFormData.capacity) || 50,
              maxDonorVolunteers: updatedCamp.camp?.maxDonorVolunteers || parseInt(editCampFormData.maxDonorVolunteers) || 10,
              maxBloodBankVolunteers: updatedCamp.camp?.maxBloodBankVolunteers || parseInt(editCampFormData.maxBloodBankVolunteers) || 5
            };
          }
          return c;
        }));
        
        showToast('Camp details updated successfully!', 'success');
        setEditCampModalOpen(false);
        setEditCampId(null);
        setEditCampFormData({ name: '', location: '', date: '', time: '', description: '', capacity: '50', maxDonorVolunteers: '10', maxBloodBankVolunteers: '5' });
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to update camp', 'error');
      }
    } catch (err) {
      showToast('Error updating camp', 'error');
    }
  };

  const openAbandonModal = (id: string, name: string) => {
    setAbandonCampData({ id, name, reason: '' });
    setAbandonCampModalOpen(true);
  };

  const confirmCampAbandon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abandonCampData.id || !abandonCampData.reason) return;
    
    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/camps/${abandonCampData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: abandonCampData.reason })
      });

      if (response.ok) {
        setCamps(prev => prev.filter(camp => camp.id !== abandonCampData.id));
        showToast('Camp successfully cancelled.', 'success');
        setAbandonCampModalOpen(false);
        setAbandonCampData({ id: '', name: '', reason: '' });
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to cancel camp', 'error');
      }
    } catch (err) {
      showToast('Error cancelling camp', 'error');
    }
  };

  const handleCompleteCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeCampId) return;

    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/camps/${completeCampId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setCamps(prev => prev.filter(camp => camp.id !== completeCampId));
        showToast('Camp marked as completed!', 'success');
        setCompleteCampModalOpen(false);
        setCompleteCampId(null);
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to complete camp', 'error');
      }
    } catch (err) {
      showToast('Error completing camp', 'error');
    }
  };

  const fetchAttendees = async (campId: string) => {
    try {
      setLoadingAttendees(true);
      setAttendeesModalOpen(true);
      setSelectedCampIdForAttendees(campId);
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/camps/${campId}/attendees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAttendeesData(await response.json());
      } else {
        showToast('Failed to fetch attendees', 'error');
      }
    } catch (err) {
      showToast('Error fetching attendees', 'error');
    } finally {
      setLoadingAttendees(false);
    }
  };

  const openProgressModal = (attendee: any, userType: 'donor' | 'bloodbank') => {
    setSelectedAttendee({ ...attendee, userType });
    if (attendeesData.progress) {
      const isCheckin = userType === 'bloodbank'
         ? attendeesData.progress.checkedInBloodBanks?.includes(attendee.id)
         : attendee.role === 'volunteer'
            ? attendeesData.progress.checkedInVolunteer?.includes(attendee.id)
            : attendeesData.progress.checkedInDonor?.includes(attendee.id);

      const isMedical = attendeesData.progress.medicalCheck?.includes(attendee.id);
      const isDonated = attendeesData.progress.ActuallyDonated?.includes(attendee.id);
      
      setTempProgress({ checkin: isCheckin || false, medical: isMedical || false, donated: isDonated || false });
    } else {
      setTempProgress({checkin: false, medical: false, donated: false});
    }
    setProgressModalOpen(true);
  };

  const handleTempProgressToggle = (step: 'checkin' | 'medical' | 'donated', newValue: boolean) => {
    setTempProgress(prev => ({ ...prev, [step]: newValue }));
  };

  const saveProgress = async () => {
    if (!selectedCampIdForAttendees || !selectedAttendee) return;
    try {
      const token = localStorage.getItem('liforce_userId');
      const response = await fetchWithAuth(`${API_URL}/camps/${selectedCampIdForAttendees}/attendees/${selectedAttendee.id}/progress`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: tempProgress, role: selectedAttendee.role, userType: selectedAttendee.userType })
      });

      if (response.ok) {
        showToast('Progress saved successfully!', 'success');
        setAttendeesData(prev => {
          if (!prev.progress) return prev;
          let checkinField = '';
          if (selectedAttendee.userType === 'bloodbank') checkinField = 'checkedInBloodBanks';
          else if (selectedAttendee.role === 'volunteer') checkinField = 'checkedInVolunteer';
          else checkinField = 'checkedInDonor';

          const newProgress = { ...prev.progress };
          const updateArr = (arrName: string, value: boolean | null) => {
             let arr = newProgress[arrName] || [];
             if (value === true && !arr.includes(selectedAttendee.id)) arr = [...arr, selectedAttendee.id];
             if (value === false) arr = arr.filter((id: string) => id !== selectedAttendee.id);
             newProgress[arrName] = arr;
          };

          updateArr(checkinField, tempProgress.checkin);
          updateArr('medicalCheck', tempProgress.medical);
          updateArr('ActuallyDonated', tempProgress.donated);

          return { ...prev, progress: newProgress };
        });
        setProgressModalOpen(false);
      } else {
        showToast('Failed to save progress', 'error');
      }
    } catch (err) {
      showToast('Error saving progress', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20 justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        <button 
          onClick={() => navigate('/dashboard/bloodbank')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-bold mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-text-primary">Manage Organized Camps</h1>
              <p className="text-sm text-text-secondary mt-1">View, edit, track attendees, and cancel your blood donation camps.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setCampModalOpen(true)} 
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-[#198E69] transition-all flex items-center gap-2"
            >
              <Users className="w-5 h-5" /> Organize New Camp
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camps.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-text-primary mb-1">No Camps Organized Yet</h3>
                <p className="text-sm text-text-secondary">Host your first blood drive to save more lives.</p>
              </div>
            ) : (
              camps.map(camp => {
                const isToday = new Date(camp.date).toDateString() === new Date().toDateString();
                return (
                <div key={camp.id} className="border border-border rounded-2xl p-5 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  {isToday && (
                    <div className="absolute top-4 right-4 flex h-3 w-3" title="Happening Today">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-lg text-text-primary mb-2 truncate pr-6" title={camp.name}>{camp.name}</h3>
                    <div className="space-y-1 mb-4">
                      <p className="text-xs text-text-secondary flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="line-clamp-2">{camp.location}</span>
                      </p>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(camp.date).toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="bg-[#FCEBEB] p-3 rounded-xl mb-4 border border-[#F5B7B1] flex justify-between items-center">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <Droplet className="w-3.5 h-3.5" /> RSVP Count
                      </span>
                      <span className="font-black text-lg text-primary">{camp.rsvps}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditCampId(camp.id);
                          const d = new Date(camp.date);
                          setEditCampFormData({
                            name: camp.name,
                            location: camp.location,
                            date: d.toISOString().split('T')[0],
                            time: d.toTimeString().split(' ')[0].slice(0, 5),
                            description: camp.description || '',
                            capacity: String(camp.capacity || 50),
                            maxDonorVolunteers: String(camp.maxDonorVolunteers || 10),
                            maxBloodBankVolunteers: String(camp.maxBloodBankVolunteers || 5)
                          });
                          setEditCampModalOpen(true);
                        }} 
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-text-primary text-sm font-bold rounded-xl transition-colors"
                      >
                        Edit Details
                      </button>
                      <button 
                        type="button" 
                        onClick={() => openAbandonModal(camp.id, camp.name)} 
                        className="flex-1 py-2 bg-[#FADBD8] hover:bg-red-200 text-critical text-sm font-bold rounded-xl transition-colors"
                      >
                        Cancel Camp
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => fetchAttendees(camp.id)} 
                        className="flex-1 py-2 bg-[#E8F5F1] hover:bg-[#A3E4D7] text-accent text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-4 h-4" /> Attendees List
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setCompleteCampId(camp.id);
                          setCompleteCampModalOpen(true);
                        }} 
                        className="flex-1 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        title="Mark Camp as Completed"
                      >
                        <CheckCircle className="w-4 h-4" /> Completed
                      </button>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      
      {/* Schedule Camp Modal */}
      <AnimatePresence>
        {campModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Schedule a Blood Camp</h3>
                <button type="button" onClick={() => setCampModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-6">Organise a blood drive and let nearby donors know automatically.</p>
              
              <form onSubmit={handleCampSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Camp Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mega Summer Blood Drive"
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                    value={campFormData.name}
                    onChange={(e) => setCampFormData({...campFormData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. XYZ Community Center"
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
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
                      min={new Date().toISOString().split('T')[0]}
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1" title="Total Attendees">Total Cap.</label>
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
                    <label className="block text-sm font-bold text-text-primary mb-1" title="Max Donor Volunteers">Donor Vol.</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                      value={campFormData.maxDonorVolunteers}
                      onChange={(e) => setCampFormData({...campFormData, maxDonorVolunteers: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1" title="Max Blood Bank Volunteers">Bank Vol.</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                      value={campFormData.maxBloodBankVolunteers}
                      onChange={(e) => setCampFormData({...campFormData, maxBloodBankVolunteers: e.target.value})}
                    />
                  </div>
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
                  className="w-full bg-primary text-white py-3 mt-4 rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                  Schedule Camp
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Camp Modal */}
      <AnimatePresence>
        {editCampModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Camp Details</h3>
                <button type="button" onClick={() => { setEditCampModalOpen(false); setEditCampId(null); }} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-6">Modify the details of your organized blood donation camp.</p>
              
              <form onSubmit={handleCampEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Camp Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                    value={editCampFormData.name}
                    onChange={(e) => setEditCampFormData({...editCampFormData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Location</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                    value={editCampFormData.location}
                    onChange={(e) => setEditCampFormData({...editCampFormData, location: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Date</label>
                    <input
                      type="date"
                      required
                      className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                      value={editCampFormData.date}
                      onChange={(e) => setEditCampFormData({...editCampFormData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Time</label>
                    <input
                      type="time"
                      required
                      className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                      value={editCampFormData.time}
                      onChange={(e) => setEditCampFormData({...editCampFormData, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Total Cap.</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                      value={editCampFormData.capacity}
                      onChange={(e) => setEditCampFormData({...editCampFormData, capacity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Donor Vol.</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                      value={editCampFormData.maxDonorVolunteers}
                      onChange={(e) => setEditCampFormData({...editCampFormData, maxDonorVolunteers: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Bank Vol.</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary"
                      value={editCampFormData.maxBloodBankVolunteers}
                      onChange={(e) => setEditCampFormData({...editCampFormData, maxBloodBankVolunteers: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Description</label>
                  <textarea
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-primary min-h-[100px] resize-y"
                    placeholder="Optional details about the camp..."
                    value={editCampFormData.description}
                    onChange={(e) => setEditCampFormData({...editCampFormData, description: e.target.value})}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 mt-4 rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Abandon Camp Modal */}
      <AnimatePresence>
        {abandonCampModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl border border-red-200"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-critical">Abandon Camp</h3>
                <button type="button" onClick={() => setAbandonCampModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Are you sure you want to abandon <strong>{abandonCampData.name}</strong>? This will notify all donors who have RSVP'd.
              </p>
              
              <form onSubmit={confirmCampAbandon}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-text-primary mb-1">Reason for Cancellation</label>
                  <textarea
                    required
                    className="w-full border border-border rounded-lg px-4 py-2 outline-none focus:border-critical min-h-[80px] resize-none"
                    placeholder="Briefly explain why..."
                    value={abandonCampData.reason}
                    onChange={(e) => setAbandonCampData({...abandonCampData, reason: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setAbandonCampModalOpen(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-text-primary font-bold rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-critical text-white font-bold rounded-lg hover:bg-red-600 transition-colors">Confirm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendees List Modal */}
      <AnimatePresence>
        {attendeesModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 max-w-2xl w-full shadow-xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Camp Attendees</h3>
                <button type="button" onClick={() => setAttendeesModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              {loadingAttendees ? (
                <div className="flex-grow flex items-center justify-center min-h-[300px]">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="flex border-b border-border mb-4 shrink-0">
                    <button
                      className={`py-2 px-4 font-bold ${activeAttendeesTab === 'donors' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                      onClick={() => setActiveAttendeesTab('donors')}
                    >
                      Donors ({attendeesData.donors.length})
                    </button>
                    <button
                      className={`py-2 px-4 font-bold ${activeAttendeesTab === 'bloodbanks' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                      onClick={() => setActiveAttendeesTab('bloodbanks')}
                    >
                      Blood Banks ({attendeesData.bloodBanks.length})
                    </button>
                  </div>

                  <div className="flex-grow overflow-y-auto min-h-[300px] pr-2 space-y-3">
                    {activeAttendeesTab === 'donors' && (
                      attendeesData.donors.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">No donors have RSVP'd yet.</p>
                      ) : (
                        attendeesData.donors.map(donor => (
                          <div key={donor.id} onClick={() => openProgressModal(donor, 'donor')} className="flex justify-between items-center p-3 border border-border rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                            <div>
                              <p className="font-bold text-text-primary flex items-center gap-2">
                                {donor.name}
                                {donor.role === 'donor' ? (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Donor</span>
                                ) : (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Volunteer</span>
                                )}
                              </p>
                              <p className="text-xs text-text-secondary">{donor.bloodGroup} | {new Date(donor.joinedAt).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${donor.id}`); }}
                              className="text-xs bg-white border border-border hover:border-primary text-text-primary hover:text-primary font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                              View
                            </button>
                          </div>
                        ))
                      )
                    )}

                    {activeAttendeesTab === 'bloodbanks' && (
                      attendeesData.bloodBanks.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">No blood banks have RSVP'd yet.</p>
                      ) : (
                        attendeesData.bloodBanks.map(bank => (
                          <div key={bank.id} onClick={() => openProgressModal(bank, 'bloodbank')} className="flex justify-between items-center p-3 border border-border rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                            <div>
                              <p className="font-bold text-text-primary flex items-center gap-2">
                                {bank.name}
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Volunteer</span>
                              </p>
                              <p className="text-xs text-text-secondary truncate max-w-[250px]">{bank.address}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/bank-profile/${bank.id}`); }}
                              className="text-xs bg-white border border-border hover:border-primary text-text-primary hover:text-primary font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                              View
                            </button>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Camp Modal */}
      <AnimatePresence>
        {completeCampModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl border border-primary/20"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-primary">Complete Camp</h3>
                <button type="button" onClick={() => { setCompleteCampModalOpen(false); setCompleteCampId(null); }} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-6">
                Are you sure you want to mark this camp as completed? It will be moved to your completed camps history and removed from active listings.
              </p>
              
              <form onSubmit={handleCompleteCamp}>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setCompleteCampModalOpen(false); setCompleteCampId(null); }} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-text-primary font-bold rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors">Confirm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Modal */}
      <AnimatePresence>
        {progressModalOpen && selectedAttendee && attendeesData.progress && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl border border-primary/20"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary truncate pr-4">Progress: {selectedAttendee.name}</h3>
                <button type="button" onClick={() => { setProgressModalOpen(false); setSelectedAttendee(null); }} className="text-gray-500 hover:text-gray-700 shrink-0">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              {(() => {
                const isCheckin = tempProgress.checkin;
                const isMedical = tempProgress.medical;
                const isDonated = tempProgress.donated;

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border border-border rounded-xl bg-gray-50">
                      <span className="font-bold text-text-primary">Checked In</span>
                      <div className="flex gap-3">
                        <button onClick={() => handleTempProgressToggle('checkin', true)} className={`p-2 rounded-full transition-colors ${isCheckin ? 'bg-green-100 text-green-600 shadow-sm' : 'bg-gray-200 text-gray-400 hover:bg-green-50'}`}><Check className="w-5 h-5"/></button>
                        <button onClick={() => handleTempProgressToggle('checkin', false)} className={`p-2 rounded-full transition-colors ${isCheckin === false || !isCheckin ? 'bg-red-100 text-red-600 shadow-sm' : 'bg-gray-200 text-gray-400 hover:bg-red-50'}`}><X className="w-5 h-5"/></button>
                      </div>
                    </div>
                    
                    {selectedAttendee.userType === 'donor' && selectedAttendee.role === 'donor' && (
                      <>
                        <div className={`flex justify-between items-center p-4 border border-border rounded-xl bg-gray-50 transition-opacity ${!isCheckin ? 'opacity-40 pointer-events-none' : ''}`}>
                          <span className="font-bold text-text-primary">Medical Check</span>
                          <div className="flex gap-3">
                            <button onClick={() => handleTempProgressToggle('medical', true)} className={`p-2 rounded-full transition-colors ${isMedical ? 'bg-green-100 text-green-600 shadow-sm' : 'bg-gray-200 text-gray-400 hover:bg-green-50'}`}><Check className="w-5 h-5"/></button>
                            <button onClick={() => handleTempProgressToggle('medical', false)} className={`p-2 rounded-full transition-colors ${isMedical === false || (!isMedical && isCheckin) ? 'bg-red-100 text-red-600 shadow-sm' : 'bg-gray-200 text-gray-400 hover:bg-red-50'}`}><X className="w-5 h-5"/></button>
                          </div>
                        </div>
                        
                        <div className={`flex justify-between items-center p-4 border border-border rounded-xl bg-gray-50 transition-opacity ${!isMedical ? 'opacity-40 pointer-events-none' : ''}`}>
                          <span className="font-bold text-text-primary">Actually Donated</span>
                          <div className="flex gap-3">
                            <button onClick={() => handleTempProgressToggle('donated', true)} className={`p-2 rounded-full transition-colors ${isDonated ? 'bg-green-100 text-green-600 shadow-sm' : 'bg-gray-200 text-gray-400 hover:bg-green-50'}`}><Check className="w-5 h-5"/></button>
                            <button onClick={() => handleTempProgressToggle('donated', false)} className={`p-2 rounded-full transition-colors ${isDonated === false || (!isDonated && isMedical) ? 'bg-red-100 text-red-600 shadow-sm' : 'bg-gray-200 text-gray-400 hover:bg-red-50'}`}><X className="w-5 h-5"/></button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="pt-4 border-t border-border mt-6">
                      <button 
                        onClick={saveProgress} 
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-sm"
                      >
                         Save Progress
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ViewMyCamps;
