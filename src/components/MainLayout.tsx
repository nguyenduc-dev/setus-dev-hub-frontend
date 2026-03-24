'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 font-sans selection:bg-indigo-500/20 antialiased">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Overlay (Mobile) / Side (Desktop) */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-[70] md:relative md:flex transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
          isMobileOpen ? "translate-x-0 shadow-2xl shadow-indigo-500/10" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          onCloseMobile={() => setIsMobileOpen(false)} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-6 md:hidden border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md shrink-0 z-40">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold tracking-tight text-white">SETUS HUB</span>
          </div>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Global Content Portal */}
        <main className={cn(
          "flex-1 overflow-y-auto scroll-smooth relative",
          "p-4 md:p-8 lg:p-12 xl:p-16",
          "transition-all duration-300"
        )}>
          <div className="max-w-[1600px] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
