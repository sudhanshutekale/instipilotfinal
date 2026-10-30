'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  GraduationCap, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Building2,
  BookOpen
} from 'lucide-react';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/rbac/permissions';
import { DEMO_USERS } from '@/lib/rbac/user-types';

export default function LoginPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  const handleQuickLogin = async (role: UserRole) => {
    setLoadingRole(role);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        if (role === 'student') {
          router.push('/student-portal');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRole(null);
    }
  };

  const roleCards = [
    {
      role: 'owner' as UserRole,
      title: 'Director / Owner',
      name: 'Priya Sharma',
      badge: 'Executive Oversight',
      icon: <Crown className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      description: 'Comprehensive visibility across finances, batch scheduling, student retention, outbox dispatch, and staff accounts.',
      permissions: ['Complete institute administrative access', 'Timetable Re-plan & Clash Resolution', 'Full Fee Collections & Audit Log']
    },
    {
      role: 'counselor' as UserRole,
      title: 'Academic Counselor',
      name: 'Rajesh Rao',
      badge: 'Student Retention',
      icon: <UserCheck className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50 text-blue-700',
      description: 'Attendance tracking, dropout risk radar, class recordings, and drafting approved WhatsApp outreach to guardians.',
      permissions: ['Students & Batch Attendance Records', 'WhatsApp Outreach Drafting', 'Strict Zero-Access to Fee Ledger']
    },
    {
      role: 'trainer' as UserRole,
      title: 'Technical Faculty',
      name: 'Vikram Malhotra',
      badge: 'Classroom Delivery',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      color: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      description: 'Daily timetable, lecture recordings, classroom/online attendance rosters, and student evaluations.',
      permissions: ['Assigned Batches & Student Rosters', 'Mark Session Attendance & Upload Recordings', 'Never Sees Financial Data']
    },
    {
      role: 'accounts' as UserRole,
      title: 'Finance & Accounts',
      name: 'Neha Joshi',
      badge: 'Fee Collections & EMIs',
      icon: <CreditCard className="w-5 h-5 text-amber-600" />,
      color: 'border-amber-200 bg-amber-50 text-amber-700',
      description: 'Fee installments, overdue EMI alerts, bank statement reconciliation, verified payment receipts, and reminders.',
      permissions: ['Fee Plans, EMIs & Payment Entry', 'Bank Statement CSV Auto-Matcher', 'No Internal Attendance Rosters']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              InstiPilot
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Enterprise
              </span>
            </h1>
            <p className="text-xs text-slate-500">Institute Operations & Student Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Role-Based Access Control (RBAC)
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 mb-4 font-semibold shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Academy & Training Institute Management
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
            Manage your institute with <br className="hidden sm:block" />
            <span className="text-blue-600">
              precision, clarity & ease.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            InstiPilot unifies batches, attendance tracking, installment collections, and guardian communications on a clean, reliable, and secure platform.
          </p>
        </div>

        {/* 4 Demo Roles Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Select a Role for Instant Evaluation
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              No credentials required &bull; Pre-loaded sandbox institute
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roleCards.map((rc) => {
              const isLoading = loadingRole === rc.role;
              return (
                <div
                  key={rc.role}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    {/* Header with Icon and Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        {rc.icon}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${rc.color}`}>
                        {rc.role.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-display text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {rc.title}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mb-3">{rc.name}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {rc.description}
                    </p>

                    {/* Key Capabilities */}
                    <div className="space-y-1.5 mb-5 border-t border-slate-100 pt-3">
                      {rc.permissions.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Login CTA */}
                  <button
                    onClick={() => handleQuickLogin(rc.role)}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white shadow-xs"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        <span>Enter as {rc.role}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Callout Strip */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Enforced Role-Based Security</div>
              <div className="text-[11px] text-slate-500">
                Trainers cannot access fees. Accounts cannot view internal attendance records. Verified via database policy checks.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">
              Database: SQLite WAL
            </span>
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-emerald-700">
              Status: Live & Verified
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500 shadow-xs">
        InstiPilot &bull; Training Institute Operations & Student Management System
      </footer>
    </div>
  );
}
