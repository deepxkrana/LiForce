import React from 'react';
import { Link } from 'react-router-dom';

interface StaticPageProps {
  title: string;
  children: React.ReactNode;
}

const StaticPage: React.FC<StaticPageProps> = ({ title, children }) => (
  <div className="min-h-screen flex flex-col bg-background pt-20">
        <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">{title}</h1>
      <div className="prose prose-neutral max-w-none text-text-secondary space-y-4 leading-relaxed">
        {children}
      </div>
      <Link
        to="/"
        className="inline-block mt-10 text-primary font-bold hover:underline"
      >
        ← Back to home
      </Link>
    </main>
      </div>
);

export default StaticPage;
