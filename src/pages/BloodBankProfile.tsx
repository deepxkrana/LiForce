import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, ShieldCheck, Clock, Navigation } from 'lucide-react';
import { API_URL } from '../lib/api';

const BloodBankProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bankData, setBankData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBankData = async () => {
      try {
        // Just fetching public data doesn't strictly need auth, but we'll try fetching from find-blood endpoint equivalent or direct
        const response = await fetch(`${API_URL}/blood-banks/search?lat=0&lng=0&radius=1000000`);
        if (response.ok) {
          const banks = await response.json();
          const found = banks.find((b: any) => b.id === id);
          if (found) {
            setBankData(found);
          } else {
            // Fallback: If not found in search, it might be closed or far, this is a basic implementation
          }
        }
      } catch (err) {
        console.error('Failed to fetch blood bank profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBankData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20 text-center animate-pulse">
        <p className="mt-20 text-text-secondary">Loading Blood Bank Profile...</p>
      </div>
    );
  }

  if (!bankData) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20 text-center">
        <p className="mt-20 text-text-secondary">Blood Bank not found.</p>
        <button onClick={() => navigate('/find-blood')} className="text-primary mt-4 font-bold">Go to Find Blood</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <div className="flex-grow max-w-5xl mx-auto w-full px-4 py-8 lg:py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden relative"
        >
          {/* Cover Photo Area */}
          <div className="h-48 bg-gradient-to-r from-accent to-[#198E69] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>

          <div className="px-6 md:px-10 pb-10 relative">
            {/* Avatar */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end -mt-20 mb-6">
              <div className="relative">
                <div className="w-36 h-36 bg-white rounded-full p-1.5 shadow-lg border-4 border-background z-10 relative">
                  <div className="w-full h-full bg-[#E8F5F1] rounded-full flex items-center justify-center text-4xl font-bold text-accent overflow-hidden">
                    {bankData.name.charAt(0)}
                  </div>
                </div>
                {bankData.isVerified && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-md border-2 border-white" title="Verified Institution">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6 md:mt-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${bankData.latitude},${bankData.longitude}`, '_blank')}
                  className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-accent text-white font-bold rounded-xl hover:bg-[#198E69] transition-colors shadow-sm shadow-accent/20"
                >
                  <Navigation className="w-4 h-4 mr-2" /> Get Directions
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left mb-8 border-b border-border pb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center justify-center md:justify-start gap-2">
                {bankData.name}
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-text-secondary text-sm mb-4">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {bankData.address}</span>
              </div>
              
              {/* Status Badge */}
              <div className="flex justify-center md:justify-start">
                {bankData.isOpen ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Open Now
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Currently Closed
                  </span>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-border p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-text-primary mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Phone Number</p>
                      <p className="text-sm text-text-secondary">{bankData.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-4 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Email Address</p>
                      <p className="text-sm text-text-secondary">{bankData.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BloodBankProfile;
