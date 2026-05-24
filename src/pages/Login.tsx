import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { API_URL } from '../lib/api';

const Login: React.FC = () => {
  const [userType, setUserType] = useState<'donor' | 'bloodbank'>('donor');
  const [step, setStep] = useState<1 | 2>(1); // 1: Email/Pass, 2: OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('liforce_token');
    const role = localStorage.getItem('liforce_role');
    if (token && role) {
      navigate(role === 'bloodbank' ? '/dashboard/bloodbank' : '/dashboard/donor', { replace: true });
    }
  }, [navigate]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      if (data.devOtp) {
        setOtp(data.devOtp);
      }

      setStep(2); // Move to OTP step
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
      const res = await fetch(`${API_URL}/auth/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, userType })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Save token and role
      localStorage.setItem('liforce_token', data.token);
      localStorage.setItem('liforce_role', userType);

      // Redirect
      if (userType === 'donor') navigate('/dashboard/donor');
      else navigate('/dashboard/bloodbank');
      
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
              onClick={() => {setUserType('donor'); setStep(1); setError('');}}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${userType === 'donor' ? 'bg-primary-light text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-gray-50'}`}
            >
              Donor Login
            </button>
            <button 
              onClick={() => {setUserType('bloodbank'); setStep(1); setError('');}}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${userType === 'bloodbank' ? 'bg-primary-light text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-gray-50'}`}
            >
              Blood Bank Login
            </button>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
            <p className="text-text-secondary text-sm mb-6">
              {step === 1 ? 'Enter your credentials to access your account.' : 'Check your terminal (or email) for the 6-digit OTP code.'}
            </p>

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
                    <label className="block text-sm font-bold text-text-primary mb-1">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors flex justify-center items-center mt-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Login'} <ArrowRight className="w-4 h-4 ml-2" />
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
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-emerald-600 transition-colors flex justify-center items-center mt-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Login'} <CheckCircle className="w-4 h-4 ml-2" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-full text-text-secondary text-sm font-medium py-2 hover:text-text-primary transition-colors"
                  >
                    Back to Login
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          
          <div className="bg-gray-50 border-t border-border p-4 text-center">
            <span className="text-sm text-text-secondary">Don't have an account? </span>
            <Link to="/register" className="text-sm text-primary font-bold hover:underline">
              Register here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
