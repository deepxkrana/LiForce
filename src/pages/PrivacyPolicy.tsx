import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    icon: <Database className="w-5 h-5 text-primary" />,
    title: '1. Information We Collect',
    content: [
      'Personal identification: name, email address, phone number, and date of birth.',
      'Health-related data: blood group, last donation date, and medical eligibility status.',
      'Location data: city, pincode, and (optionally) GPS coordinates for real-time matching.',
      'Account activity: donation records, emergency requests, camp RSVPs, and reward points.',
    ],
  },
  {
    icon: <Eye className="w-5 h-5 text-primary" />,
    title: '2. How We Use Your Information',
    content: [
      'To match you with nearby blood banks, donors, or emergency requests in real time.',
      'To send real-time SOS notifications and appointment reminders.',
      'To maintain your donation history, reward points, and leaderboard ranking.',
      'To verify blood bank credentials and ensure platform safety.',
      'To improve our services through anonymised, aggregated analytics.',
    ],
  },
  {
    icon: <Lock className="w-5 h-5 text-primary" />,
    title: '3. Data Security',
    content: [
      'All passwords are hashed using industry-standard bcrypt encryption and are never stored in plain text.',
      'All API communications are secured using JSON Web Tokens (JWT) with server-side validation.',
      'Sensitive health data is never shared with third parties without your explicit consent.',
      'We conduct regular security audits and follow OWASP best practices.',
    ],
  },
  {
    icon: <UserCheck className="w-5 h-5 text-primary" />,
    title: '4. Your Rights',
    content: [
      'You may request a full export of your personal data at any time.',
      'You may request deletion of your account and all associated data by contacting us.',
      'You may opt out of non-critical notifications from your dashboard settings.',
      'You have the right to correct any inaccurate personal information in your profile.',
    ],
  },
  {
    icon: <Shield className="w-5 h-5 text-primary" />,
    title: '5. Third-Party Services',
    content: [
      'We use OpenStreetMap (via Leaflet) for location-based features — no account is required and your location data is not retained by this service.',
      'We do not use advertising SDKs or sell your data to marketing companies.',
      'Our backend infrastructure uses secure, managed cloud services with encryption at rest.',
    ],
  },
  {
    icon: <Mail className="w-5 h-5 text-primary" />,
    title: '6. Contact & Updates',
    content: [
      'This policy may be updated periodically. We will notify you of significant changes via email.',
      'For all privacy-related concerns or data requests, contact us at privacy@liforce.in.',
      'Last updated: May 2026.',
    ],
  },
];

const PrivacyPolicy: React.FC = () => (
  <div className="min-h-screen bg-background pt-24 pb-20">
    {/* Hero */}
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#962D22] to-[#6B1A12] py-20 px-4 text-white text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-2xl mx-auto"
      >
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-lg text-white/80 leading-relaxed">
          Your health data is sacred. Here's exactly how we collect, use, and protect your information on LiForce.
        </p>
      </motion.div>
    </div>

    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 space-y-6">

      {/* Intro banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-[#FFF5F5] to-[#FFF0EE] border border-primary/20 rounded-2xl p-5"
      >
        <p className="text-sm text-text-secondary leading-relaxed">
          LiForce ("we", "our", "us") is committed to protecting your privacy. This policy explains what data we collect when you use LiForce, how we use it, and your rights regarding your personal information. By using LiForce, you agree to this policy.
        </p>
      </motion.div>

      {/* Sections */}
      {sections.map((section, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
          className="bg-white rounded-2xl border border-border shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
              {section.icon}
            </div>
            <h2 className="font-black text-text-primary text-lg">{section.title}</h2>
          </div>
          <ul className="space-y-2">
            {section.content.map((point, j) => (
              <li key={j} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}

      <div className="text-center pt-4">
        <Link to="/" className="inline-block text-primary font-bold hover:underline text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
