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
        if (parsed) {
          if (parsed.name?.toLowerCase().includes('bot') || parsed.name?.toLowerCase().includes('system') || parsed.id === 'system') {
            parsed.name = 'Priya Sharma (Director)';
            parsed.id = 'u_owner';
            parsed.avatarUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';
            document.cookie = `instipilot_session=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=604800; SameSite=Lax`;
          }
          setClientUser(parsed);
        }
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
        <div className="h-24 bg-white rounded-2xl border border-slate-200"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200"></div>
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
      </div>
    );
  }

  const rawUser = data?.user || clientUser;
  const isOwner = !rawUser?.role || rawUser?.role === 'owner';
  let cleanName = rawUser?.name;
  if (!cleanName || cleanName.toLowerCase().includes('bot') || cleanName.toLowerCase().includes('system') || rawUser?.id === 'system') {
    cleanName = isOwner ? 'Priya Sharma (Director)' : 'Staff Member';
  }

  const user = {
    id: rawUser?.id === 'system' ? 'u_owner' : (rawUser?.id || 'u_owner'),
    name: cleanName,
    role: rawUser?.role || 'owner',
    email: rawUser?.id === 'system' ? 'owner@instipilot.com' : (rawUser?.email || 'owner@instipilot.com'),
    avatarUrl: (rawUser?.avatarUrl && !rawUser?.id?.includes('system')) ? rawUser.avatarUrl : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  };
  const displayName = user.name;
  const kpis = data?.kpis;
  const alerts = data?.alerts;
  const dualRiskStudents = alerts?.dualRiskStudents || [];
  const pendingOutbox = alerts?.outboxPending || [];
  const isFinancialRole = user?.role === 'owner' || user?.role === 'accounts';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner — Crisp Executive Overview */}
      <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={user?.avatarUrl || (user?.role === 'owner' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')}
                alt={displayName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="Active Session"></span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                  Academic Operations Central
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center flex-wrap gap-2.5">
                <span>Welcome back, {displayName}</span>
                {user?.role === 'owner' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Director & Head of Institute
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Role: <span className="text-blue-700 font-semibold uppercase">{user?.role || 'owner'}</span> &bull; 
                {user?.role === 'trainer' && ' Direct schedule, attendance rosters, and student logs.'}
                {user?.role === 'counselor' && ' Monitoring attendance retention signals & parent communications.'}
                {user?.role === 'accounts' && ' Tracking tuition fees, installments, and payment reconciliations.'}
                {(!user?.role || user?.role === 'owner') && ' Institutional command oversight across all batches, faculty, and finances.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2.5 text-xs font-medium shadow-xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row — Crisp White Elevated Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Active Students */}
        <Link 
          href="/students"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all block cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enrolled Students</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {kpis?.activeStudents ?? '—'}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> 100% Active Profiles
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-blue-600" />
          </div>
        </Link>

        {/* KPI 2: Active Batches */}
        <Link 
          href="/batches?status=ongoing" 
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all block cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ongoing Batches</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {kpis?.activeBatches ?? '—'}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>5 Campus & Virtual Rooms</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-indigo-600" />
          </div>
        </Link>

        {/* KPI 3: Attendance Rate */}
        <Link 
          href="/attendance"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all block cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class Attendance</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {kpis?.attendanceRate ?? 88}%
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Combined Lab + Remote</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600" />
          </div>
        </Link>

        {/* KPI 4: Fee Collections or Academic Health */}
        {isFinancialRole ? (
          <Link 
            href="/fees"
            className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md transition-all block cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fee Collections</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-100 transition-colors">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
              ₹{(kpis?.feeTotalCollected || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-amber-700 flex items-center justify-between">
              <span>{kpis?.overdueEmiCount || 0} installments overdue</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-amber-600" />
            </div>
          </Link>
        ) : (
          <Link
            href="/students"
            className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-400 hover:shadow-md transition-all block cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Academic Health</span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-purple-100 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-extrabold text-emerald-600 mb-2 tracking-tight">
              Healthy
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>{kpis?.activeStudents ?? 0} active student profiles</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-purple-600" />
            </div>
          </Link>
        )}
      </div>

      {/* Operational Attention Required Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <h3 className="font-display text-base font-bold text-slate-900 tracking-tight">
              Operational Priority Notices
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Attendance thresholds & installment due dates
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Notice 1: Multiple Absences */}
          {(user?.role === 'owner' || user?.role === 'counselor') && (
            <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-semibold text-rose-800">
                      Attendance Retention Advisory
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    Action Needed
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Students with 3+ Missed Sessions this Week
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Students who missed multiple sessions require counselor outreach to provide catch-up lecture recordings and prevent dropouts.
                </p>

                <div className="space-y-2 mb-4">
                  {dualRiskStudents.length > 0 ? dualRiskStudents.map((st: any) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {st.name}
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            {st.missed_classes} missed
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Course fee due: <span className="text-slate-700 font-medium">₹{(st.due_amount || st.emi_amount)?.toLocaleString('en-IN')}</span> &bull; {st.due_date || st.emi_due_date}
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${st.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${st.name}, this is from InstiPilot Academy office. We noticed you missed recent classes in the batch. Please let us know if you need any academic assistance or guidance regarding your course.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </a>
                    </div>
                  )) : (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 text-center">
                      No high-risk attendance flags at this time.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-3 border-t border-rose-200 flex items-center justify-between">
                <span>Rohan Gupta (5 missed) &bull; Ananya Deshmukh (3 missed)</span>
                <Link href="/outbox" className="text-blue-600 hover:text-blue-700 font-medium">Review Outbox &rarr;</Link>
              </div>
            </div>
          )}

          {/* Notice 2: Overdue Installments */}
          {(user?.role === 'owner' || user?.role === 'accounts') && (
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">
                      Fee Clearance Notice
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Accounts Review
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Students with Consecutive Missed Installments
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Accounts advisory: Follow up with students on pending second installment payment to prevent access disruption.
                </p>

                <div className="space-y-2 mb-4">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        Amit Patel
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          2 cycles overdue
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Course: Python Engineering &bull; Balance: <span className="text-amber-800 font-semibold">₹23,334</span>
                      </div>
                    </div>

                    <Link
                      href="/fees"
                      className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <span>Review EMIs</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-3 border-t border-amber-200 flex items-center justify-between">
                <span>Amit Patel (Python Cohort 4 &bull; ₹23,334 overdue)</span>
                <Link href="/fees" className="text-amber-700 hover:text-amber-800 font-medium">Finance Portal &rarr;</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Today's Classes & Attendance Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Today's Lectures & Batch Schedule
            </h3>
            <Link
              href="/batches"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              All Batches <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STATIC_TODAY_CLASSES.map((b: any) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {b.start_time} - {b.end_time}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      b.mode === 'hybrid'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : b.mode === 'online'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {b.mode}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-900 mb-1">{b.batch_name}</h4>
                  <div className="text-xs text-slate-500 mb-3">
                    {b.course_name}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {b.enrolled_students} / {b.max_seats} seats
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {b.room_name || 'Virtual Studio'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Trainer: <span className="text-slate-800 font-medium">{b.trainer_name}</span></span>
                  <Link
                    href={`/attendance?batchId=${b.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Attendance &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Attendance Trend Chart & Outbox Queue */}
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Attendance Trend
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Rolling average over past 8 sessions</p>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={STATIC_ATTENDANCE_CHART}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="present" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Human Approvals Queue */}
          {user?.role !== 'trainer' && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    Dispatch Approval Queue
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Parent and student WhatsApp dispatches</p>
                </div>
                <Link href="/outbox" className="text-xs text-blue-600 hover:underline font-medium">
                  View All ({pendingOutbox.length})
                </Link>
              </div>

              <div className="space-y-2.5">
                {pendingOutbox.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No pending messages waiting for authorization
                  </div>
                ) : (
                  pendingOutbox.map((msg: any) => (
                    <div
                      key={msg.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{msg.recipient_name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          msg.status === 'draft' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {msg.status?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {msg.message_text}
                      </p>
                      
                      {msg.status === 'draft' && (
                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            WhatsApp &bull; {msg.recipient_phone}
                          </span>
                          <button
                            onClick={() => handleApprove(msg)}
                            disabled={approvingId === msg.id}
                            className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {approvingId === msg.id ? 'Sending...' : 'Authorize & Send'}
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
