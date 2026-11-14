import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased overflow-x-hidden">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative min-h-[calc(100vh-4rem)] bg-slate-50">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

