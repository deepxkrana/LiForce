import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const Testimonials: React.FC = () => {
  const stories = [
    {
      quote: "My daughter needed O- blood during her surgery. LiForce connected us with 3 donors within 15 minutes. We are forever grateful.",
      author: "Anonymous recipient, Delhi",
    },
    {
      quote: "Finding AB- blood was a nightmare until a friend told me about LiForce. A donor travelled 10km at 2 AM to help my father.",
      author: "Anonymous recipient, Mumbai",
    },
    {
      quote: "The hospital blood bank was empty. LiForce's SOS feature saved my wife's life during childbirth. Thank you to the silent heroes.",
      author: "Anonymous recipient, Bangalore",
    }
  ];

  return (
    <section className="py-20 bg-primary-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Lives changed by LiForce</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="bg-surface p-8 rounded-2xl border border-[#F5B7B1] shadow-sm relative"
            >
              <Heart className="absolute top-8 left-8 h-8 w-8 text-[#F5B7B1] opacity-50" />
              <div className="pt-8">
                <p className="text-lg text-text-primary italic mb-6 leading-relaxed">
                  "{story.quote}"
                </p>
                <p className="text-sm font-semibold text-text-secondary">
                  — {story.author}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
