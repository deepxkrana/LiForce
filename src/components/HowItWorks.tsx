import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, HeartHandshake, Trophy, AlertCircle } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('liforce_userId');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.id) {
          setIsLoggedIn(true);
        }
      } catch (e) {}
    }
  }, []);

  const steps = [
    {
      icon: isLoggedIn ? <AlertCircle className="h-8 w-8 text-primary" /> : <UserPlus className="h-8 w-8 text-primary" />,
      title: isLoggedIn ? 'Request for blood' : 'Register as a donor',
      description: isLoggedIn
        ? 'Post an emergency request in seconds. Specify the required blood group, hospital location, and urgency.'
        : 'Sign up in minutes. Tell us your blood group, location, and availability to help others.'
    },
    {
      icon: <HeartHandshake className="h-8 w-8 text-primary" />,
      title: 'Get matched instantly',
      description: 'Our smart algorithm connects you with nearby blood banks or patients in urgent need.'
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: 'Donate & earn rewards',
      description: 'Save a life and climb the leaderboard. Earn badges and rewards for your noble deeds.'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-20 bg-background overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">How LiForce works</h2>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-border z-0">
            <motion.div 
              initial={{ scaleX: 0, transformOrigin: 'left' }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-primary"
            />
          </div>

          {steps.map((step, index) => (
            <motion.div key={index} variants={item} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center mb-6 shadow-sm group-hover:border-primary group-hover:shadow-md transition-all">
                <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
                  {step.icon}
                </div>
              </div>
              <div className="absolute top-0 right-1/2 translate-x-12 -translate-y-2 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center border-4 border-background">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">{step.title}</h3>
              <p className="text-text-secondary leading-relaxed max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
