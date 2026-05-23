import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NotFound: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-background pt-20">
    <Navbar />
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-6xl font-bold text-primary mb-4">404</p>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Page not found</h1>
      <p className="text-text-secondary mb-8 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors"
        >
          Go home
        </Link>
        <Link
          to="/find-blood"
          className="px-6 py-3 rounded-lg border border-border font-bold text-text-primary hover:bg-gray-50 transition-colors"
        >
          Find blood
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default NotFound;
