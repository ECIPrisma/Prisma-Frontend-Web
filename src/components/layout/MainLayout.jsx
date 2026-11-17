import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased overflow-x-hidden">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} isSidebarOpen={sidebarOpen} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto relative min-h-[calc(100vh-4rem)] bg-slate-50 w-full min-w-0">
          <div className="relative z-10 w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

