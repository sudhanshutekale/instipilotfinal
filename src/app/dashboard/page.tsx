'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Layers, 
  UserCheck, 
  CreditCard, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  Send, 
  CheckCircle, 
  XCircle,
  Building,
  Video,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

const STATIC_TODAY_CLASSES = [
  { id: 'b_java_m1', batch_name: 'Java Fullstack Morning (Alpha)', course_name: 'Java Fullstack Development', start_time: '09:00', end_time: '11:00', mode: 'hybrid', enrolled_students: 15, max_seats: 20, room_name: 'Computer Lab Alpha', trainer_name: 'Vikram Malhotra' },
  { id: 'b_java_fast', batch_name: 'Java Sprint Fast-Track', course_name: 'Java Fullstack Development', start_time: '11:30', end_time: '13:30', mode: 'hybrid', enrolled_students: 10, max_seats: 15, room_name: 'Computer Lab Beta', trainer_name: 'Vikram Malhotra' },
  { id: 'b_py_m2', batch_name: 'Python Data Engineering', course_name: 'Python & Data Engineering', start_time: '14:00', end_time: '16:00', mode: 'online', enrolled_students: 12, max_seats: 18, room_name: 'Virtual Studio 1', trainer_name: 'Priya Nair' },
  { id: 'b_mern_e2', batch_name: 'Modern MERN & Cloud', course_name: 'MERN Stack Development', start_time: '18:00', end_time: '20:00', mode: 'hybrid', enrolled_students: 8, max_seats: 12, room_name: 'Computer Lab Alpha', trainer_name: 'Rahul Singh' },
];

const STATIC_ATTENDANCE_CHART = [
  { date: 'Oct 9', present: 52 },
  { date: 'Oct 10', present: 55 },
  { date: 'Oct 13', present: 48 },
  { date: 'Oct 14', present: 58 },
  { date: 'Oct 15', present: 53 },
  { date: 'Oct 16', present: 60 },
  { date: 'Oct 17', present: 57 },
  { date: 'Oct 20', present: 61 },
];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [clientUser, setClientUser] = useState<any>(null);

  useEffect(() => {
    try {
      const match = document.cookie.match(/instipilot_session=([^;]+)/);
      if (match && match[1]) {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        if (parsed) setClientUser(parsed);
      }
    } catch {}
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const handleFocus = () => fetchDashboard();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleApprove = async (msg: any) => {
    setApprovingId(msg.id);
    try {
      const res = await fetch('/api/outbox/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msg.id,
          studentId: msg.student_id,
          recipientPhone: msg.recipient_phone,
          recipientName: msg.recipient_name,
          messageText: msg.message_text,
          draftReason: msg.draft_reason,
          channel: msg.channel
        })
      });
      if (res.ok) {
        const cleanPhone = msg.recipient_phone.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg.message_text)}`;
        window.open(waUrl, '_blank');
        fetchDashboard();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-900/80 rounded-2xl border border-slate-800"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-900/80 rounded-2xl border border-slate-800"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-900/80 rounded-2xl border border-slate-800"></div>
      </div>
    );
  }

  const user = data?.user || clientUser || {
    name: 'Priya Sharma',
    role: 'owner',
    email: 'owner@instipilot.com',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  };
  const displayName = user?.name || (user?.role === 'owner' ? 'Priya Sharma' : 'Staff');
  const kpis = data?.kpis;
  const alerts = data?.alerts;
  const dualRiskStudents = alerts?.dualRiskStudents || [];
  const pendingOutbox = alerts?.outboxPending || [];
  const isFinancialRole = user?.role === 'owner' || user?.role === 'accounts';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome & Mission Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-violet-950/30 backdrop-blur-xl shadow-glass">
        <div className="flex items-center gap-3.5">
          <div className="relative flex-shrink-0">
            <img
              src={user?.avatarUrl || (user?.role === 'owner' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')}
              alt={displayName}
              className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-400/40 shadow-neon-cyan"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                Operations Live Radar &bull; Academic Year 2026-27
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center flex-wrap gap-2">
              <span>Welcome back, {displayName}</span>
              {user?.role === 'owner' && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm">
                  Owner & Director
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Role: <span className="text-cyan-300 font-semibold uppercase">{user?.role || 'owner'}</span> &bull; 
              {user?.role === 'trainer' && ' Showing your pedagogical sessions and student rosters.'}
              {user?.role === 'counselor' && ' Monitoring student attendance anomalies & intervention alerts.'}
              {user?.role === 'accounts' && ' Tracking EMI collections, payments, and bank reconciliation.'}
              {(!user?.role || user?.role === 'owner') && ' Master command center with full institutional oversight.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row — All fully interactive navigation buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Students Button */}
        <Link 
          href="/students"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono tracking-wider">Active Students</span>
            <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-white mb-1">
            {kpis?.activeStudents ?? '—'}
          </div>
          <div className="text-[11px] text-cyan-400 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" /> 100% verified enrollments
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-cyan-400" />
          </div>
        </Link>

        {/* KPI 2: Active Batches Button */}
        <Link 
          href="/batches?status=ongoing" 
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 hover:bg-slate-900/90 transition-all block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono tracking-wider">Active Batches</span>
            <div className="p-2 rounded-xl bg-violet-950/60 text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-white mb-1">
            {kpis?.activeBatches ?? '—'}
          </div>
          <div className="text-[11px] text-violet-300 font-mono flex items-center justify-between">
            <span>Across 5 physical & virtual labs</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-violet-400" />
          </div>
        </Link>

        {/* KPI 3: Attendance Rate Button */}
        <Link 
          href="/attendance"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono tracking-wider">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-white mb-1">
            {kpis?.attendanceRate ?? 88}%
          </div>
          <div className="text-[11px] text-emerald-400/90 font-mono flex items-center justify-between">
            <span className="text-slate-400">Classroom + Zoom combined</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-400" />
          </div>
        </Link>

        {/* KPI 4: Fee Collections / Academic Health Button */}
        {isFinancialRole ? (
          <Link 
            href="/fees"
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 hover:bg-slate-900/90 transition-all block cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase font-mono tracking-wider">Fee Collections</span>
              <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-white mb-1">
              ₹{(kpis?.feeTotalCollected || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-amber-400 font-mono flex items-center justify-between">
              <span>{kpis?.overdueEmiCount || 0} overdue &bull; ₹{(kpis?.overdueEmiAmount || 0).toLocaleString('en-IN')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-amber-400" />
            </div>
          </Link>
        ) : (
          <Link
            href="/students"
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all block cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase font-mono tracking-wider">Academic Health</span>
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold text-emerald-400 mb-1">
              Optimal
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>{kpis?.activeStudents ?? 0} enrolled students active</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-cyan-400" />
            </div>
          </Link>
        )}
      </div>

      {/* Critical Operational Risk Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            <h3 className="font-display text-base font-bold text-white">
              Critical Institutional Signals & Early Warnings
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Triggered automatically from DB pattern detection
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Signal 1: Java Batch 3+ Absences & EMI Due */}
          {(user?.role === 'owner' || user?.role === 'counselor') && (
            <div className="p-5 rounded-2xl border border-rose-500/40 bg-rose-950/20 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-xs font-mono font-bold text-rose-300 uppercase">
                      High Drop-off Probability Signal
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Java Batch Alert
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">
                  Students with ≥ 3 Missed Classes AND EMI Due This Week
                </h4>
                <p className="text-xs text-slate-300/90 leading-relaxed mb-4">
                  Correlated absenteeism with impending payment due-dates indicates immediate dropout risk.
                </p>

                <div className="space-y-2 mb-4">
                  {dualRiskStudents.length > 0 ? dualRiskStudents.map((st: any) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {st.name}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/60">
                            {st.missed_classes} classes missed
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          EMI Due: <span className="text-amber-400 font-mono">{st.due_date || st.emi_due_date}</span> &bull; ₹{(st.due_amount || st.emi_amount)?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${st.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${st.name}, this is from InstiPilot Academy. We noticed you missed recent classes in the Java batch. Please let us know if you need any academic assistance or guidance regarding your course.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Phone className="w-3 h-3" />
                        Outreach
                      </a>
                    </div>
                  )) : (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 text-center">
                      No high-risk students detected at this time.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-rose-900/40 flex items-center justify-between">
                <span>Rohan Gupta (5 missed) &bull; Ananya Deshmukh (3 missed)</span>
                <span className="text-cyan-400">Target for Copilot Drafting</span>
              </div>
            </div>
          )}

          {/* Signal 2: Consecutive Missed EMIs */}
          {(user?.role === 'owner' || user?.role === 'accounts') && (
            <div className="p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                      Financial Default Risk Alert
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    2+ Overdue EMIs
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">
                  Students with Consecutive Missed Installments
                </h4>
                <p className="text-xs text-slate-300/90 leading-relaxed mb-4">
                  Account flag: Student has missed two consecutive payment cycles. Lab and recording access review recommended.
                </p>

                <div className="space-y-2 mb-4">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        Amit Patel
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                          2 overdue cycles
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Batch: Python Cohort 4 &bull; Total Pending: <span className="text-rose-400 font-mono font-bold">₹23,334</span>
                      </div>
                    </div>

                    <Link
                      href="/fees"
                      className="py-1 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      Inspect EMIs
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-amber-900/40 flex items-center justify-between">
                <span>Amit Patel (Python Cohort 4 &bull; ₹23,334 overdue)</span>
                <span className="text-amber-400">Notice Pending</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Today's Classes & Attendance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Live Institute Schedule & Batches
            </h3>
            <Link
              href="/batches"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              All Batches <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {STATIC_TODAY_CLASSES.map((b: any) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {b.start_time} - {b.end_time}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      b.mode === 'hybrid'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                        : b.mode === 'online'
                        ? 'bg-violet-950 text-violet-400 border border-violet-500/30'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {b.mode}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-white mb-1">{b.batch_name}</h4>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                    <span>{b.course_name}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {b.enrolled_students} / {b.max_seats} seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {b.room_name || 'Virtual Studio'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Trainer: <span className="text-slate-200">{b.trainer_name}</span></span>
                  <Link
                    href={`/attendance?batchId=${b.id}`}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium"
                  >
                    Attendance &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Attendance Trend Chart & Outbox Approvals */}
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Attendance Velocity
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Past 8 sessions</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={STATIC_ATTENDANCE_CHART}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="present" stroke="#00F0FF" fillOpacity={1} fill="url(#colorPresent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Human Approvals Queue */}
          {user?.role !== 'trainer' && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  Action Outbox Queue
                </h4>
                <Link href="/outbox" className="text-xs text-cyan-400 hover:underline">
                  All ({pendingOutbox.length})
                </Link>
              </div>

              <div className="space-y-2.5">
                {pendingOutbox.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No pending draft messages in queue
                  </div>
                ) : (
                  pendingOutbox.map((msg: any) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{msg.recipient_name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          msg.status === 'draft' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' : 'bg-emerald-950 text-emerald-400'
                        }`}>
                          {msg.status?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {msg.message_text}
                      </p>
                      
                      {msg.status === 'draft' && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">
                            WhatsApp &bull; {msg.recipient_phone}
                          </span>
                          <button
                            onClick={() => handleApprove(msg)}
                            disabled={approvingId === msg.id}
                            className="py-1 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {approvingId === msg.id ? 'Sending...' : 'Approve & Send'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
