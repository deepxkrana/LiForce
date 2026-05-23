import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowRight, CheckCircle, Mail, Hospital } from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_URL } from '../lib/api';

const BloodBankRegistration: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    licenseNumber: '',
    phone: '',
    address: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, userType: 'bloodbank' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate registration');
      }

      if (data.devOtp) {
        setOtp(data.devOtp);
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData,
          code: otp,
          userType: 'bloodbank'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      localStorage.setItem('liforce_token', data.token);
      localStorage.setItem('liforce_role', 'bloodbank');

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C0392B', '#1D9E75', '#E67E22']
      });

      setTimeout(() => navigate('/dashboard/bloodbank'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center p-4 py-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface w-full max-w-xl rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="bg-primary px-8 py-6 flex items-center">
            <div className="bg-white/20 p-3 rounded-xl mr-4 border border-white/30">
              <Hospital className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">Register Blood Bank</h2>
              <p className="text-primary-light text-sm mt-1">Join the LiForce network</p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-[#FADBD8] text-critical p-3 rounded-lg text-sm font-medium mb-6 border border-[#F5B7B1]">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleInitiate} 
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Organization Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="Red Cross Blood Center"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-1">Email (For Login & Alerts)</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                        placeholder="contact@bloodcenter.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-1">Password</label>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-1">Govt License Number</label>
                      <input 
                        type="text" 
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                        placeholder="BB-12345-DL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Full Address</label>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="Street, Sector, City, Pincode"
                      rows={2}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors flex justify-center items-center mt-6 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Continue to Email Verification'} <ArrowRight className="w-4 h-4 ml-2" />
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
                  <div className="bg-primary-light p-4 rounded-xl flex items-center mb-4 border border-[#F5B7B1]">
                    <Mail className="w-5 h-5 text-primary mr-3 shrink-0" />
                    <span className="text-sm text-primary-dark font-medium">OTP sent to {formData.email}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">6-Digit OTP</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 text-center tracking-widest text-xl font-mono rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="000000"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-emerald-600 transition-colors flex justify-center items-center mt-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Account...' : 'Verify & Register'} <CheckCircle className="w-4 h-4 ml-2" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-full text-text-secondary text-sm font-medium py-2 hover:text-text-primary transition-colors"
                  >
                    Back to Form
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          
          <div className="bg-gray-50 border-t border-border p-4 text-center">
            <span className="text-sm text-text-secondary">Already have an account? </span>
            <Link to="/login" className="text-sm text-primary font-bold hover:underline">
              Login here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BloodBankRegistration;
