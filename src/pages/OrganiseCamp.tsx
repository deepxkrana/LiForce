import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_URL } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { 
  Calendar, 
  MapPin, 
  User, 
  ArrowLeft, 
  Clock, 
  FileText, 
  Sparkles, 
  CheckCircle 
} from 'lucide-react';

const OrganiseCamp: React.FC = () => {
  const [title, setTitle] = useState('');
  const [campDate, setCampDate] = useState('');
  const [campTime, setCampTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('liforce_token');
    const role = localStorage.getItem('liforce_role');

    // Protect Route
    if (!token || role !== 'bloodbank') {
      showToast('Access restricted: Only verified blood banks can organise camps.', 'error');
      navigate('/login');
      return;
    }

    setIsPageLoading(false);
  }, [navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a camp title.', 'error');
      return;
    }
    if (!campDate || !campTime) {
      showToast('Please specify camp date and time.', 'error');
      return;
    }
    if (!location.trim()) {
      showToast('Please specify camp location.', 'error');
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('liforce_token');
    const combinedDateTime = new Date(`${campDate}T${campTime}`);

    try {
      const res = await fetch(`${API_URL}/camps/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          date: combinedDateTime.toISOString(),
          location,
          description: description.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to organise camp');
      }

      showToast('🎪 Blood camp organized successfully! Notification broadcasted to all active donors.', 'success');
      navigate('/dashboard/bloodbank');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <Navbar />
      
      <div className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-bold mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-border p-8 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent to-[#5DADE2]"></div>
              
              <h2 className="text-3xl font-extrabold text-text-primary mb-2 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-accent shrink-0" /> Organise Blood Camp
              </h2>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                Provide public details below to launch a new community blood donation drive. All registered donors will be notified in real-time about your event.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Camp Title */}
                <div>
                  <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent" /> Camp Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Mega Community Blood Drive"
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-accent text-text-primary"
                  />
                </div>

                {/* Scheduling Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-accent" /> Camp Date
                    </label>
                    <input
                      type="date"
                      value={campDate}
                      onChange={(e) => setCampDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-accent text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-accent" /> Start Time
                    </label>
                    <input
                      type="time"
                      value={campTime}
                      onChange={(e) => setCampTime(e.target.value)}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-accent text-text-primary"
                    />
                  </div>
                </div>

                {/* Location Address */}
                <div>
                  <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-accent" /> Camp Location Address
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="e.g. Sector 17 Plaza, Near Fountain, Chandigarh"
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-accent text-text-primary"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-extrabold text-text-primary mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-accent" /> Camp Description & Notes
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Provide details about incentives, requirements, snacks, or special guests..."
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background outline-none transition-all focus:border-accent resize-none text-text-primary"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-accent text-white font-extrabold shadow-lg hover:bg-[#198E69] transition-all disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Organise Camp Now
                    </>
                  )}
                </button>

              </form>
            </motion.div>
          </div>

          {/* Guidelines/Features Side */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Features Highlight */}
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-md relative overflow-hidden">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-3">
                  <CheckCircle className="w-5 h-5 text-accent" /> Why organise a camp?
                </h3>
                
                <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
                  <div>
                    <h4 className="font-extrabold text-text-primary text-sm mb-1">📢 Instant Broadcaster</h4>
                    <p>Dispatches real-time WebSocket alerts to all eligible blood donors in the platform, maximizing participation.</p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-text-primary text-sm mb-1">⚡ Simple RSVP Tracking</h4>
                    <p>Donors can directly sign up or RSVP to join your organized camp in the community tab.</p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-text-primary text-sm mb-1">❤️ Lifesaving Network</h4>
                    <p>Strengthen local community engagement and replenish vital blood reserves in your repository.</p>
                  </div>
                </div>
              </div>

              {/* Quick Checklist */}
              <div className="bg-accent/5 border border-accent/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-accent mb-3 flex items-center gap-1.5">
                  📋 Camp Preparation Tip
                </h3>
                <ul className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">•</span>
                    Set up comfortable donation beds and recovery rest stations.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">•</span>
                    Arrange fresh juices, energy drinks, and light healthy snacks for donor recovery.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">•</span>
                    Prepare digital donor sign-in kiosks to capture quick statistics.
                  </li>
                </ul>
              </div>

            </motion.div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrganiseCamp;
