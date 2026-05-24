import React from 'react';
import { motion } from 'framer-motion';
import { Bot, BellRing, Trophy, MapPin, Tent, HeartHandshake } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Bot className="h-6 w-6 text-primary" />,
      title: 'AI eligibility checker',
      description: 'Check your donation eligibility instantly via our smart chatbot before booking an appointment.'
    },
    {
      icon: <BellRing className="h-6 w-6 text-primary" />,
      title: 'Real-time alerts',
      description: 'Receive SMS, Push & WhatsApp notifications for urgent blood requirements nearby.'
    },
    {
      icon: <Trophy className="h-6 w-6 text-primary" />,
      title: 'Gamification',
      description: 'Unlock unique badges, climb the city leaderboard, and maintain your donation streak.'
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      title: 'Smart geo-matching',
      description: 'Our system matches you with the closest blood bank needing your specific blood type.'
    },
    {
      icon: <Tent className="h-6 w-6 text-primary" />,
      title: 'Community Camps',
      description: 'Discover upcoming blood donation drives in your city and manage your attendance easily.'
    },
    {
      icon: <HeartHandshake className="h-6 w-6 text-primary" />,
      title: 'Recipient stories',
      description: 'Read anonymous thank-you messages from people whose lives were saved by donors like you.'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-20 bg-surface border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Everything you need, in one platform</h2>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={item}
              whileHover={{ y: -4, borderColor: '#FCEBEB' }}
              className="p-8 rounded-2xl bg-background border border-border transition-all hover:shadow-md group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
