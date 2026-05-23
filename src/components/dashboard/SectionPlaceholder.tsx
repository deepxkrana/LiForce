import React from 'react';

interface SectionPlaceholderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({ title, description, children }) => (
  <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
    <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
    <p className="text-text-secondary mb-6">{description}</p>
    {children}
  </div>
);

export default SectionPlaceholder;
