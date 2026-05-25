import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, Mail, KeyRound } from 'lucide-react';
import { API_URL, fetchWithAuth } from '../lib/api';
import confetti from 'canvas-confetti';

const ForgotPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<'donor' | 'bloodbank'>(
    (searchParams.get('type') as 'donor' | 'bloodbank') || 'donor'
  );
  const [step, setStep] = useState<1 | 2>(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/auth/forgot-password/initiate`, {
        method: 'POST',
        body: JSON.stringify({ email, userType })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate password reset');
      }

      setStep(2); // Move to OTP step
      setSuccess('OTP sent to your email!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/auth/forgot-password/verify`, {
        method: 'POST',
        body: JSON.stringify({ email, code: otp, newPassword, userType })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Success
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1D9E75', '#E67E22', '#C0392B']
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <div className="flex-grow flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button 
              onClick={() => {setUserType('donor'); setStep(1); setError(''); setSuccess('');}}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${userType === 'donor' ? 'bg-primary-light text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-gray-50'}`}
            >
              Donor
            </button>
            <button 
              onClick={() => {setUserType('bloodbank'); setStep(1); setError(''); setSuccess('');}}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${userType === 'bloodbank' ? 'bg-primary-light text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-gray-50'}`}
            >
              Blood Bank
            </button>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Reset Password</h2>
            </div>
            
            <p className="text-text-secondary text-sm mb-6">
              {step === 1 ? 'Enter your registered email address to receive a verification code.' : 'Enter the 6-digit OTP code sent to your email and set a new password.'}
            </p>

            {error && (
              <div className="bg-[#FADBD8] text-critical p-3 rounded-lg text-sm font-medium mb-6 border border-[#F5B7B1]">
                {error}
              </div>
            )}
            
            {success && step === 2 && !error && (
              <div className="bg-[#D4EFDF] text-accent p-3 rounded-lg text-sm font-medium mb-6 border border-[#A9DFBF]">
                {success}
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
                    <label className="block text-sm font-bold text-text-primary mb-1">Registered Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors flex justify-center items-center mt-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending OTP...' : 'Send OTP'} <ArrowRight className="w-4 h-4 ml-2" />
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
                    <span className="text-sm text-primary-dark font-medium">OTP sent to {email}</span>
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
                  
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-emerald-600 transition-colors flex justify-center items-center mt-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'} <CheckCircle className="w-4 h-4 ml-2" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-full text-text-secondary text-sm font-medium py-2 hover:text-text-primary transition-colors"
                  >
                    Back to Email Step
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          
          <div className="bg-gray-50 border-t border-border p-4 text-center">
            <span className="text-sm text-text-secondary">Remember your password? </span>
            <Link to="/login" className="text-sm text-primary font-bold hover:underline">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
