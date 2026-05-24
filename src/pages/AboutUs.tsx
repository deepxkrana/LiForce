import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Heart, Users, Shield, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs: React.FC = () => {
  const values = [
    {
      icon: <Heart className="w-6 h-6 text-primary" />,
      title: 'Compassion First',
      description: 'Every decision we make is driven by empathy for patients, donors, and blood bank staff working to save lives.',
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: 'Speed & Reliability',
      description: 'In emergencies, every second matters. Our platform is built for real-time matching and instant SOS alerts.',
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: 'Trust & Safety',
      description: 'We handle your health data with the utmost care. Verified blood banks, encrypted data, and transparent operations.',
    },
    {
      icon: <Globe className="w-6 h-6 text-primary" />,
      title: 'Community Power',
      description: 'LiForce thrives because of its community — thousands of donors and banks working together to build a blood-safe India.',
    },
  ];

  const stats = [
    { value: '3+', label: 'Registered Donors' },
    { value: '2+', label: 'Partner Blood Banks' },
    { value: '3+', label: 'Lives Impacted' },
    { value: '30 min', label: 'Avg. Response Time' },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#962D22] to-[#6B1A12] py-24 px-4 text-white text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.08),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Droplet className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">About LiForce</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            We bridge the gap between blood donors, recipients, and blood banks across India — ensuring the right blood reaches the right person at the right time.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
        >
          <div>
            <h2 className="text-3xl font-black text-text-primary mb-4">Our Mission</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              LiForce was founded with one goal: to make blood donation effortless, transparent, and impactful. India faces a chronic shortage of safe blood — millions of units are needed annually, yet a significant portion goes unfulfilled due to poor coordination.
            </p>
            <p className="text-text-secondary leading-relaxed">
              We're changing that by connecting a verified network of donors, hospitals, and blood banks on a single real-time platform — so no life is lost because of a logistics failure.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border shadow-sm p-5 text-center">
                <p className="text-3xl font-black text-primary">{stat.value}</p>
                <p className="text-sm text-text-secondary mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-black text-text-primary mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border shadow-sm p-6 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">{v.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12 bg-gradient-to-r from-[#FFF5F5] to-[#FFF0EE] border border-primary/20 rounded-2xl p-8 text-center"
        >
          <Users className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-black text-text-primary mb-3">Built by Students, for Humanity</h2>
          <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
            LiForce is a student-led initiative, developed as part of an academic project with a mission to make a real difference. We believe technology, combined with compassion, can solve some of India's most pressing healthcare challenges.
          </p>
        </motion.div>

        <div className="text-center">
          <Link to="/" className="inline-block text-primary font-bold hover:underline text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
