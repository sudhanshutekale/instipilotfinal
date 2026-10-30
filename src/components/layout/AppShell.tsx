'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Layers, Sparkles, Menu, UserCheck, Video } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import CopilotDrawer from '../copilot/CopilotDrawer';
import { AuthUser } from '@/lib/rbac/user-types';

interface AppShellProps {
  currentUser: AuthUser;
  children: React.ReactNode;
}

export default function AppShell({ currentUser, children }: AppShellProps) {
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<AuthUser>(currentUser);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sync with server prop when it updates
  useEffect(() => {
    setActiveUser(currentUser);
  }, [currentUser]);

  // Close mobile navigation drawer whenever route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // If on login page, don't show navigation shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const isStudent = activeUser.role === 'student';
  const homeHref = isStudent ? '/student-portal' : '/dashboard';
  const isHomeActive = pathname === homeHref || (isStudent && pathname === '/dashboard');
  
  const secondTabHref = isStudent ? '/attendance' : '/students';
  const isSecondTabActive = pathname.startsWith(secondTabHref);

  const fourthTabHref = isStudent ? '/recordings' : '/batches';
  const isFourthTabActive = pathname.startsWith(fourthTabHref);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={activeUser}
        onOpenCopilot={() => setCopilotOpen(true)}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={mobileNavOpen}
        onRoleChange={(newUser) => setActiveUser(newUser)}
      />

      {/* Main Workspace with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentUser={activeUser}
          onOpenCopilot={() => setCopilotOpen(true)}
          isMobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        <Link
          href={homeHref}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors ${
            isHomeActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>{isStudent ? 'Portal' : 'Home'}</span>
        </Link>

        <Link
          href={secondTabHref}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors ${
            isSecondTabActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isStudent ? <UserCheck className="w-4 h-4 mb-0.5" /> : <Users className="w-4 h-4 mb-0.5" />}
          <span>{isStudent ? 'Attendance' : 'Students'}</span>
        </Link>

        {/* Elevated Assistant Launcher */}
        <button
          onClick={() => setCopilotOpen(true)}
          className="flex flex-col items-center justify-center -mt-4 group"
          aria-label="Open Assistant"
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-transform border border-blue-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-slate-600 mt-1">Copilot</span>
        </button>

        <Link
          href={fourthTabHref}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors ${
            isFourthTabActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isStudent ? <Video className="w-4 h-4 mb-0.5" /> : <Layers className="w-4 h-4 mb-0.5" />}
          <span>{isStudent ? 'Recordings' : 'Batches'}</span>
        </Link>

        <button
          onClick={() => setMobileNavOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors ${
            mobileNavOpen ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Toggle full menu"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Slide-in Operations Copilot Drawer */}
      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentUser={activeUser}
      />
    </div>
  );
}
