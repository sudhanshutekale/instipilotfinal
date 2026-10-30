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
    owner: <Crown className="w-4 h-4 text-emerald-400" />,
    counselor: <UserCheck className="w-4 h-4 text-cyan-400" />,
    trainer: <GraduationCap className="w-4 h-4 text-violet-400" />,
    accounts: <CreditCard className="w-4 h-4 text-amber-400" />,
    student: <BookOpen className="w-4 h-4 text-blue-400" />
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/70 bg-surface-darkest/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-2 -ml-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-brand-400" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link href={currentUser.role === 'student' ? '/student-portal' : '/dashboard'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-subtle group-hover:shadow-brand transition-all">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-brand-200 transition-colors">
                InstiPilot
              </span>
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-medium -mt-1">
                Academy ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Global Smart Command Search Bar */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:border-brand-500/50 hover:bg-slate-900 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors" />
              <span className="text-slate-400 group-hover:text-slate-200">
                Search students, batches, fees, or ask assistant...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-800/90 rounded-md border border-slate-700">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* User Role Switcher & Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Quick Assistant Mobile Button */}
          <button
            onClick={onOpenCopilot}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Search & Assistant"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Role Badge & Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-left"
            >
              <div className="relative">
                <img
                  src={(currentUser.avatarUrl && !currentUser.id?.includes('system') && !currentUser.name?.toLowerCase().includes('bot'))
                    ? currentUser.avatarUrl
                    : (currentUser.role === 'owner' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')}
                  alt="User Profile"
                  className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-command-darkest"></span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {(!currentUser.name || currentUser.name.toLowerCase().includes('bot') || currentUser.name.toLowerCase().includes('system') || currentUser.id === 'system')
                    ? (currentUser.role === 'owner' ? 'Priya Sharma (Director)' : 'Staff Member')
                    : currentUser.name}
                </span>
                <span className="text-[11px] text-brand-400 font-medium capitalize">
                  {roleConfig.displayName}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Role Switcher Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-surface-card border border-surface-border shadow-2xl p-2 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-surface-border">
                  <div className="text-xs font-semibold text-slate-200">Switch Role View</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Preview permission views for director, faculty, and student portals
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
                            ? 'bg-brand-500/15 text-brand-200 border border-brand-500/30'
                            : 'text-slate-300 hover:bg-surface-hover hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            {roleIcons[r]}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{demo.name}</div>
                            <div className="text-[10px] text-slate-400">{ROLE_PERMISSIONS[r].displayName}</div>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-brand-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-surface-border flex flex-col gap-1 px-2 text-[11px]">
                  <Link
                    href="/team"
                    onClick={() => setDropdownOpen(false)}
                    className="text-brand-400 hover:text-brand-300 flex items-center justify-between py-1 font-medium"
                  >
                    <span>Manage Staff & Faculty Accounts</span>
                    <span className="text-[10px] font-mono bg-brand-950/80 text-brand-300 px-1.5 py-0.5 rounded border border-brand-800/60">RBAC</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="text-slate-400 hover:text-white flex items-center gap-1.5 py-1"
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
