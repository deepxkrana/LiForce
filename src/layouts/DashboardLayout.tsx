import React from 'react';
import Navbar from '../components/Navbar';

export interface SidebarItem {
  name: string;
  id: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems?: SidebarItem[];
  activeSection?: string;
  onSectionChange?: (id: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
