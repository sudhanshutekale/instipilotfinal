'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  CalendarClock, 
  CreditCard, 
  UserCheck, 
  Video, 
  Send, 
  FileSpreadsheet, 
  ShieldAlert,
  FileCode2,
  Lock,
  Sparkles,
  UserCog,
  X,
  GraduationCap
} from 'lucide-react';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/rbac/permissions';
import { AuthUser } from '@/lib/rbac/user-types';

interface SidebarProps {
  currentUser: AuthUser;
  onOpenCopilot: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  CalendarClock: <CalendarClock className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  UserCheck: <UserCheck className="w-4 h-4" />,
  Video: <Video className="w-4 h-4" />,
  Send: <Send className="w-4 h-4" />,
  FileSpreadsheet: <FileSpreadsheet className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
  FileCode2: <FileCode2 className="w-4 h-4" />,
  UserCog: <UserCog className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />
};

export default function Sidebar({ currentUser, onOpenCopilot, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const roleConfig = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.owner;

  const isOwner = !currentUser.role || currentUser.role === 'owner';
  const cleanUserName = (!currentUser.name || currentUser.name.toLowerCase().includes('bot') || currentUser.name.toLowerCase().includes('system') || currentUser.id === 'system')
    ? (isOwner ? 'Priya Sharma (Director)' : 'Staff Member')
    : currentUser.name;
  const cleanUserAvatar = (currentUser.avatarUrl && !currentUser.id?.includes('system') && !currentUser.name?.toLowerCase().includes('bot'))
    ? currentUser.avatarUrl
    : (isOwner ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100');

  return (
    <>
      {/* Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] bg-command-darkest border-r border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-300">
            {/* Header with App Logo & Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-neon-cyan">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-display font-bold text-sm text-white">InstiPilot</span>
                  <div className="text-[10px] font-mono text-cyan-400">INSTITUTE ERP</div>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation items list */}
            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <div className="px-3 mb-2 text-[10px] uppercase font-mono tracking-wider text-slate-500">
                Navigation & Operations
              </div>
              {roleConfig.navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                      {iconMap[item.icon] || <LayoutDashboard className="w-4 h-4" />}
                    </span>
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-neon-cyan"></span>
                    )}
                  </Link>
                );
              })}

              {/* AI Copilot Callout */}
              <div className="pt-4 px-1">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 via-violet-950/20 to-slate-900 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    AI Ops Copilot
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                    Instant schema-aware intelligence with human approval guards.
                  </p>
                  <button
                    onClick={() => {
                      onCloseMobile?.();
                      onOpenCopilot();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-xs font-medium hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-neon-cyan"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Launch Copilot
                  </button>
                </div>
              </div>
            </div>

            {/* User Profile & Role Security Footprint */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <img
                  src={cleanUserAvatar}
                  alt={cleanUserName}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {cleanUserName}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono capitalize truncate">
                    {roleConfig.displayName}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-mono uppercase text-slate-400">
                    <Lock className="w-2.5 h-2.5 text-cyan-400" />
                    RBAC Guard
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400">ACTIVE</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate" title={roleConfig.description}>
                  {roleConfig.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Aside */}
      <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-slate-800/80 bg-command-darkest/95 backdrop-blur-xl h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] uppercase font-mono tracking-wider text-slate-500">
          Navigation & Operations
        </div>

        {roleConfig.navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                {iconMap[item.icon] || <LayoutDashboard className="w-4 h-4" />}
              </span>
              <span>{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-neon-cyan"></span>
              )}
            </Link>
          );
        })}

        {/* AI Copilot Quick Callout */}
        <div className="pt-4 px-1">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 via-violet-950/20 to-slate-900 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              AI Ops Copilot
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
              Instant schema-aware intelligence with human approval guards.
            </p>
            <button
              onClick={onOpenCopilot}
              className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-xs font-medium hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-neon-cyan"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Launch Copilot
            </button>
          </div>
        </div>
      </div>

      {/* Role Security Footprint */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <img
            src={cleanUserAvatar}
            alt={cleanUserName}
            className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {cleanUserName}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono capitalize truncate">
              {roleConfig.displayName}
            </div>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-mono uppercase text-slate-400">
              <Lock className="w-2.5 h-2.5 text-cyan-400" />
              RBAC Guard
            </span>
            <span className="text-[9px] font-mono text-emerald-400">ACTIVE</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate" title={roleConfig.description}>
            {roleConfig.description}
          </div>
        </div>
      </div>
    </aside>
  </>
  );
}
