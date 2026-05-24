import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';
import { API_URL } from '../lib/api';

interface StatCounterProps {
  endValue: number;
  label: string;
  suffix?: string;
  duration?: number;
}

const StatCounter: React.FC<StatCounterProps> = ({ endValue, label, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      let animationFrame: number;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // easeOutQuart
        const easeOut = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOut * endValue));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
        }
      };

      animationFrame = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, endValue, duration]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-border shadow-sm">
      <span className="text-3xl md:text-4xl font-bold text-primary mb-2">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-sm md:text-base font-medium text-text-secondary text-center">
        {label}
      </span>
    </div>
  );
};

const ImpactStatsBar: React.FC = () => {
  const [stats, setStats] = useState({
    donors: 0,
    bloodbanks: 0,
    donations: 0,
    avgResponseTime: 30
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-12 bg-background border-y border-[#F5B7B1]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <StatCounter endValue={stats.donors} label="Registered donors" />
          <StatCounter endValue={stats.bloodbanks} label="Partner blood banks" />
          <StatCounter endValue={stats.donations} label="Donations completed" />
          <StatCounter endValue={stats.avgResponseTime} suffix=" min" label="Avg. response time" />
        </div>
      </div>
    </section>
  );
};

export default ImpactStatsBar;
