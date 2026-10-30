'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Sparkles, 
  Command, 
  ChevronDown, 
  LogOut, 
  UserCheck, 
  CreditCard, 
  GraduationCap, 
  Crown,
  Bell,
  Search,
  Check,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/rbac/permissions';
import { DEMO_USERS, AuthUser } from '@/lib/rbac/user-types';

interface NavbarProps {
  currentUser: AuthUser;
  onOpenCopilot: () => void;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
  onRoleChange?: (newUser: AuthUser) => void;
}

export default function Navbar({ 
  currentUser, 
  onOpenCopilot, 
  onToggleMobileNav, 
  isMobileNavOpen,
  onRoleChange
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const roleConfig = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.owner;

  // Handle Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCopilot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCopilot]);

  const switchRole = async (targetRole: UserRole) => {
    if (targetRole === currentUser.role) {
      setDropdownOpen(false);
      return;
    }

    setSwitching(true);
    setDropdownOpen(false);

    const demo = DEMO_USERS[targetRole];
    const newUser: AuthUser = {
      id: targetRole === 'student' ? 'u_student' : `u_${targetRole}`,
      name: demo.name,
      email: demo.email,
      role: targetRole,
      studentId: demo.studentId,
      avatarUrl: demo.avatar
    };

    // 1. Instantly set session cookie synchronously on client
    document.cookie = `instipilot_session=${encodeURIComponent(JSON.stringify(newUser))}; path=/; max-age=604800; SameSite=Lax`;

    // 2. Notify parent state for instant zero-lag UI reaction
    onRoleChange?.(newUser);

    // 3. Instant client route transition without full window reload
    if (targetRole === 'student') {
      router.push('/student-portal');
    } else if (pathname === '/student-portal') {
      router.push('/dashboard');
    }

    // 4. Background server sync & cache refresh
    try {
      await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      router.refresh();
    } catch (e) {
      console.error('Failed to sync role session', e);
    } finally {
      setSwitching(false);
    }
  };

  const roleIcons = {
    owner: <Crown className="w-4 h-4 text-emerald-600" />,
    counselor: <UserCheck className="w-4 h-4 text-blue-600" />,
    trainer: <GraduationCap className="w-4 h-4 text-indigo-600" />,
    accounts: <CreditCard className="w-4 h-4 text-amber-600" />,
    student: <BookOpen className="w-4 h-4 text-teal-600" />
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-2 -ml-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-blue-600" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link href={currentUser.role === 'student' ? '/student-portal' : '/dashboard'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-all">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                InstiPilot
              </span>
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-semibold -mt-1">
                Institute Operations
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-slate-500 group-hover:text-slate-700">
                Search students, batches, fees, or ask questions...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white rounded-md border border-slate-200 shadow-xs">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* User Role Switcher & Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Quick Search Mobile Button */}
          <button
            onClick={onOpenCopilot}
            className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Role Badge & Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left shadow-xs"
            >
              <div className="relative">
                <img
                  src={(currentUser.avatarUrl && !currentUser.id?.includes('system') && !currentUser.name?.toLowerCase().includes('bot'))
                    ? currentUser.avatarUrl
                    : (currentUser.role === 'owner' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')}
                  alt="User Profile"
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {(!currentUser.name || currentUser.name.toLowerCase().includes('bot') || currentUser.name.toLowerCase().includes('system') || currentUser.id === 'system')
                    ? (currentUser.role === 'owner' ? 'Priya Sharma (Director)' : 'Staff Member')
                    : currentUser.name}
                </span>
                <span className="text-[11px] text-blue-600 font-medium capitalize">
                  {roleConfig.displayName}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Role Switcher Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-900">Switch Role View</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Test role-based access for director, faculty, and student portals
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  {(Object.keys(DEMO_USERS) as UserRole[]).map((r) => {
                    const demo = DEMO_USERS[r];
                    const isCurrent = currentUser.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => switchRole(r)}
                        disabled={switching}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                            {roleIcons[r]}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{demo.name}</div>
                            <div className="text-[10px] text-slate-500">{ROLE_PERMISSIONS[r].displayName}</div>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1 px-2 text-[11px]">
                  <Link
                    href="/team"
                    onClick={() => setDropdownOpen(false)}
                    className="text-blue-600 hover:text-blue-700 flex items-center justify-between py-1 font-medium"
                  >
                    <span>Manage Staff & Faculty Accounts</span>
                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">RBAC</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Full Demo Login Page
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
