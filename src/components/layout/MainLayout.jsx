import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] relative overflow-x-hidden">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative min-h-[calc(100vh-4rem)]">
          <div 
            className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ 
              backgroundImage: "url('/fondo_prisma_red.jpg')",
              backgroundAttachment: 'fixed'
            }}
          />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
