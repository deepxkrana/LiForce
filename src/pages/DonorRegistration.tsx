import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Shield, CheckCircle, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';
import { useToast } from '../components/ToastProvider';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  age: z.string().refine((val) => parseInt(val) >= 18 && parseInt(val) <= 65, { message: "Age must be between 18 and 65 to donate" }),
  gender: z.string().refine(val => ["Male", "Female", "Other"].includes(val), "Please select a gender"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  
  bloodGroup: z.string().min(1, "Please select your blood group"),
  lastDonation: z.string().optional(),
  neverDonated: z.boolean(),
  healthConditions: z.array(z.string()),
  currentMedications: z.boolean(),
  
  availability: z.boolean(),
  notifications: z.array(z.string()),
  maxDistance: z.number().min(1).max(50),
  profileVisibility: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Medical Info' },
  { id: 3, title: 'Preferences' },
  { id: 4, title: 'Verification' }
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const HEALTH_CONDITIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'None of the above'];

const DonorRegistration: React.FC = () => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formDataCache, setFormDataCache] = useState<FormData | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      healthConditions: [],
      notifications: ['SMS', 'Email'],
      maxDistance: 10,
      availability: true,
      profileVisibility: true,
      neverDonated: false,
    },
    mode: "onChange"
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate as any);
    
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ['fullName', 'age', 'gender', 'phone', 'email', 'password', 'city', 'pincode'];
      case 2: return ['bloodGroup', 'lastDonation', 'neverDonated', 'healthConditions', 'currentMedications'];
      case 3: return ['availability', 'notifications', 'maxDistance', 'profileVisibility'];
      default: return [];
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      console.log("Initiating registration:", data);
      
      const regRes = await fetch(`${API_URL}/auth/register/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, userType: 'donor' }),
      });

      if (!regRes.ok) {
        const errorData = await regRes.json();
        throw new Error(errorData.error || 'Failed to initiate registration');
      }
      
      const successData = await regRes.json();
      if (successData.devOtp) {
        setOtp(successData.devOtp);
      }
      
      setFormDataCache(data);
      setCurrentStep(4); // Move to OTP step
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.error("Initiation Error:", error);
      showToast('Registration initiation failed: ' + error.message, 'error');
    }
  };

  const verifyOTP = async () => {
    if (!formDataCache || !otp) return;
    
    try {
      setIsLoading(true);
      
      // Complete Registration
      const regRes = await fetch(`${API_URL}/auth/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formDataCache.email,
          code: otp,
          password: formDataCache.password,
          name: formDataCache.fullName,
          bloodGroup: formDataCache.bloodGroup,
          userType: 'donor'
        })
      });

      const data = await regRes.json();
      if (!regRes.ok) throw new Error(data.error || 'Invalid OTP');
      
      if (data.token) {
        localStorage.setItem('liforce_token', data.token);
        localStorage.setItem('liforce_role', 'donor');
        
        // Update additional profile details (Donor Service)
        await fetch(`${API_URL}/donors/me`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
          },
          body: JSON.stringify({
            phone: formDataCache.phone,
            city: formDataCache.city,
            maxTravelDistanceKm: formDataCache.maxDistance,
            notificationsEnabled: formDataCache.notifications.length > 0
          })
        });
      }
      
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C0392B', '#1D9E75', '#E67E22']
      });

      setIsSuccess(true);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      console.error("Registration Error:", error);
      showToast('Verification failed: ' + error.message, 'error');
    }
  };


  const bloodGroup = watch('bloodGroup');
  const neverDonated = watch('neverDonated');
  const healthConditions = watch('healthConditions');
  const notifications = watch('notifications');
  const maxDistance = watch('maxDistance');
  const availability = watch('availability');
  const profileVisibility = watch('profileVisibility');

  const toggleArrayItem = (field: 'healthConditions' | 'notifications', item: string) => {
    const currentArray = watch(field) || [];
    if (currentArray.includes(item)) {
      setValue(field, currentArray.filter(i => i !== item));
    } else {
      if (field === 'healthConditions' && item === 'None of the above') {
        setValue(field, ['None of the above']);
      } else if (field === 'healthConditions' && currentArray.includes('None of the above')) {
        setValue(field, [item]);
      } else {
        setValue(field, [...currentArray, item]);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Navbar />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface p-10 rounded-2xl border border-border shadow-lg text-center max-w-lg w-full mt-20"
        >
          <div className="w-20 h-20 bg-[#E8F5F1] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-4">Registration Complete!</h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Thank you for registering as a donor. You are now part of India's largest blood donation network. Your willingness to help can save lives.
          </p>
          <div className="bg-primary-light p-4 rounded-xl mb-8 flex items-center text-left">
            <div className="bg-primary p-3 rounded-full text-white mr-4">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-primary-dark">New Badge Unlocked!</p>
              <p className="text-sm text-primary">"The Initiator" - Welcome to the family.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard/donor" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors">
              Go to my Dashboard
            </Link>
            <Link to="/" className="w-full bg-white border border-border text-text-primary font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <Navbar />
      
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-10">
        
        {/* Left Column - Form */}
        <div className="flex-grow lg:w-2/3 bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Register as a donor</h1>
          <p className="text-text-secondary mb-8">Join the community and start saving lives today.</p>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-border -z-10 -translate-y-1/2 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              ></div>
              
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-surface transition-colors duration-300 ${
                    currentStep >= step.id ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${currentStep >= step.id ? 'text-primary' : 'text-text-secondary'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Full Name</label>
                      <input 
                        {...register('fullName')} 
                        className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                        placeholder="John Doe"
                      />
                      {errors.fullName && <p className="text-critical text-xs mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-text-primary mb-2">Age</label>
                        <input 
                          type="number"
                          {...register('age')} 
                          className={`w-full px-4 py-3 rounded-lg border ${errors.age ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                          placeholder="25"
                        />
                        {errors.age && <p className="text-critical text-xs mt-1">{errors.age.message}</p>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-text-primary mb-2">Gender</label>
                        <select 
                          {...register('gender')}
                          className={`w-full px-4 py-3 rounded-lg border ${errors.gender ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.gender && <p className="text-critical text-xs mt-1">{errors.gender.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Phone Number</label>
                      <input 
                        {...register('phone')} 
                        className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                        placeholder="+91 98765 43210"
                      />
                      {errors.phone && <p className="text-critical text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Email Address</label>
                      <input 
                        type="email"
                        {...register('email')} 
                        className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                        placeholder="john@example.com"
                      />
                      {errors.email && <p className="text-critical text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Password</label>
                      <input 
                        type="password"
                        {...register('password')} 
                        className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                        placeholder="••••••••"
                      />
                      {errors.password && <p className="text-critical text-xs mt-1">{errors.password.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">City</label>
                      <input 
                        {...register('city')} 
                        className={`w-full px-4 py-3 rounded-lg border ${errors.city ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                        placeholder="e.g. Chandigarh"
                      />
                      {errors.city && <p className="text-critical text-xs mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Pincode</label>
                      <input 
                        {...register('pincode')} 
                        className={`w-full px-4 py-3 rounded-lg border ${errors.pincode ? 'border-critical' : 'border-border focus:border-primary'} bg-background outline-none transition-colors`}
                        placeholder="e.g. 160012"
                      />
                      {errors.pincode && <p className="text-critical text-xs mt-1">{errors.pincode.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-3">Your Blood Group</label>
                    <div className="grid grid-cols-4 gap-3">
                      {BLOOD_GROUPS.map(bg => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setValue('bloodGroup', bg, { shouldValidate: true })}
                          className={`py-3 rounded-lg border-2 font-bold transition-all ${
                            bloodGroup === bg 
                              ? 'bg-primary border-primary text-white' 
                              : 'bg-background border-border text-text-secondary hover:border-primary'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                    {errors.bloodGroup && <p className="text-critical text-xs mt-2">{errors.bloodGroup.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Last Donation Date</label>
                      <input 
                        type="date"
                        disabled={neverDonated}
                        {...register('lastDonation')} 
                        className={`w-full px-4 py-3 rounded-lg border border-border bg-background outline-none transition-colors ${neverDonated ? 'opacity-50 cursor-not-allowed' : 'focus:border-primary'}`}
                      />
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          {...register('neverDonated')}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                        />
                        <span className="ml-2 font-medium text-text-primary">I have never donated blood</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-3">Health Conditions (Check all that apply)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {HEALTH_CONDITIONS.map(condition => (
                        <label key={condition} className="flex items-center p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-gray-50 transition-colors">
                          <input 
                            type="checkbox"
                            checked={healthConditions.includes(condition)}
                            onChange={() => toggleArrayItem('healthConditions', condition)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                          />
                          <span className="ml-3 font-medium text-text-primary">{condition}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary-light p-4 rounded-xl border border-[#F5B7B1] flex items-start">
                    <input 
                      type="checkbox" 
                      id="meds"
                      {...register('currentMedications')}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    <label htmlFor="meds" className="ml-3 text-sm text-text-primary leading-relaxed cursor-pointer font-medium">
                      I am currently taking prescription medications (antibiotics, blood thinners, etc.) that might affect my eligibility.
                    </label>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                    <div>
                      <h4 className="font-bold text-text-primary">Donation Availability</h4>
                      <p className="text-sm text-text-secondary">Are you currently available to be contacted for donation?</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={availability}
                          onChange={(e) => setValue('availability', e.target.checked)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${availability ? 'bg-accent' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${availability ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <div className={`ml-3 text-sm font-bold ${availability ? 'text-accent' : 'text-text-secondary'}`}>
                        {availability ? 'Available' : 'Unavailable'}
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-3">Notification Preferences</label>
                    <div className="flex flex-wrap gap-3">
                      {['SMS', 'Email', 'WhatsApp', 'Push'].map(notif => (
                        <button
                          key={notif}
                          type="button"
                          onClick={() => toggleArrayItem('notifications', notif)}
                          className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                            notifications.includes(notif)
                              ? 'bg-primary-light border-primary text-primary-dark'
                              : 'bg-white border-border text-text-secondary hover:border-gray-300'
                          }`}
                        >
                          {notif}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-bold text-text-primary">Maximum Travel Distance</label>
                      <span className="text-sm font-bold text-primary">{maxDistance} km</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      value={maxDistance}
                      onChange={(e) => setValue('maxDistance', parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                    <div>
                      <h4 className="font-bold text-text-primary">Profile Visibility</h4>
                      <p className="text-sm text-text-secondary">Allow your anonymous stats to appear on the leaderboard</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={profileVisibility}
                          onChange={(e) => setValue('profileVisibility', e.target.checked)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${profileVisibility ? 'bg-primary' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${profileVisibility ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <div className={`ml-3 text-sm font-bold ${profileVisibility ? 'text-primary' : 'text-text-secondary'}`}>
                        {profileVisibility ? 'Public' : 'Private'}
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center py-4">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">Verify your Email</h3>
                    <p className="text-text-secondary">We sent a 6-digit OTP to <span className="font-bold text-primary">{formDataCache?.email}</span></p>
                  </div>
                  
                  <div className="max-w-xs mx-auto">
                    <label className="block text-sm font-bold text-text-primary mb-2">Enter OTP</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full px-4 py-4 text-center tracking-widest text-2xl font-mono rounded-lg border border-border focus:border-primary bg-background outline-none transition-colors"
                      placeholder="000000"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-10 pt-6 border-t border-border flex justify-between">
              {currentStep > 1 && currentStep < 4 ? (
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="px-6 py-3 rounded-lg border border-border text-text-primary font-bold hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" /> Back
                </button>
              ) : (
                <div></div> // Empty div to maintain flex spacing
              )}
              
              {currentStep < 3 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center shadow-sm"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              ) : currentStep === 3 ? (
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 rounded-lg bg-accent text-white font-bold hover:bg-emerald-600 transition-colors flex items-center shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Complete Form'} <CheckCircle className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={verifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="px-8 py-3 w-full justify-center rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Register'} <CheckCircle className="h-5 w-5 ml-2" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-8">
            <h3 className="text-xl font-bold text-text-primary mb-6">Why donate?</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 mt-1">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-text-primary">Save up to 3 lives</h4>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">A single pint of blood can be separated into red cells, plasma, and platelets.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-[#E8F5F1] flex items-center justify-center flex-shrink-0 mt-1">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-text-primary">Free health check</h4>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">Before every donation, you'll receive a mini physical and blood tests.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-[#FEF5E7] flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-text-primary">Emergency support</h4>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">Registered donors get priority assistance when their family members need blood.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h3 className="text-lg font-bold mb-4">You'll earn this badge after your first donation!</h3>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex flex-col items-center text-center backdrop-blur-sm">
              <Trophy className="h-12 w-12 text-yellow-400 mb-3" />
              <h4 className="font-bold text-lg">Lifesaver Initiate</h4>
              <p className="text-xs text-primary-light mt-1">Given to those who took the first step to save lives.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorRegistration;
