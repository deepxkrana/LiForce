import React from 'react';
import UrgentSOSBanner from '../components/UrgentSOSBanner';
import HeroSection from '../components/HeroSection';
import ImpactStatsBar from '../components/ImpactStatsBar';
import LiveBloodAvailability from '../components/LiveBloodAvailability';
import HowItWorks from '../components/HowItWorks';
import FeaturesSection from '../components/FeaturesSection';
import LeaderboardPreview from '../components/LeaderboardPreview';
import Testimonials from '../components/Testimonials';
import CTABanner from '../components/CTABanner';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
            <div className="pt-20 flex flex-col flex-grow">
      <UrgentSOSBanner />
      <main className="flex-grow">
        <HeroSection />
        <ImpactStatsBar />
        <LiveBloodAvailability />
        <HowItWorks />
        <FeaturesSection />
        <LeaderboardPreview />
        <Testimonials />
        <CTABanner />
      </main>
            </div>
    </div>
  );
};

export default Home;
