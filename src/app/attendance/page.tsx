'use client';

import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  Check, 
  X, 
  AlertCircle,
  Wifi,
  Building
} from 'lucide-react';

export default function AttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState('b_java_m1');
  const [selectedDate, setSelectedDate] = useState('2026-10-14');
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/attendance?batchId=${selectedBatch}&date=${selectedDate}`);
      if (res.status === 403) {
        setError('Access Denied: Accounts role is restricted from viewing granular biometric logs.');
        setLoading(false);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedBatch, selectedDate]);

  const handleMark = async (studentId: string, status: 'present' | 'absent' | 'late', mode: string) => {
    setUpdatingStudentId(studentId);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          batchId: selectedBatch,
          date: selectedDate,
          status,
          mode
        })
      });
      if (res.ok) {
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStudentId(null);
    }
  };

  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50 text-center max-w-lg mx-auto space-y-3 shadow-xs">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="font-display text-lg font-bold text-rose-900">Access Restricted (RBAC)</h3>
        <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
      </div>
    );
  }

  const { rows, batches } = data || {};
  const presentCount = rows?.filter((r: any) => r.attendance_status === 'present').length || 0;
  const absentCount = rows?.filter((r: any) => r.attendance_status === 'absent').length || 0;
  const lateCount = rows?.filter((r: any) => r.attendance_status === 'late').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Session Tracking & Check-in Records
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Attendance Register
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Record and review student attendance for each batch session with one-click marking.
          </p>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 sm:flex-initial">
            <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Select Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            >
              {batches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 sm:flex-initial">
            <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">Session Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Attendance Summary Counters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium">
          <div className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            Present: <span className="font-bold">{presentCount}</span>
          </div>
          <div className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
            Absent: <span className="font-bold">{absentCount}</span>
          </div>
          <div className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            Late: <span className="font-bold">{lateCount}</span>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[680px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Enrollment Mode</th>
                <th className="py-3 px-4">Check-in Time</th>
                <th className="py-3 px-4">Location / IP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Mark Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : rows?.map((r: any) => {
                const status = r.attendance_status || 'unmarked';
                const isUpdating = updatingStudentId === r.student_id;

                return (
                  <tr key={r.student_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {r.student_name}
                      <div className="text-[10px] text-slate-500 mt-0.5">{r.student_phone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 uppercase text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                        {r.preferred_mode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {r.check_in_time ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-medium text-slate-800">{r.check_in_time}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] truncate max-w-[200px]">
                      {r.ip_or_location || 'Campus Network'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                        status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : status === 'absent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : status === 'late'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleMark(r.student_id, 'present', r.checkin_mode || 'classroom')}
                          disabled={isUpdating}
                          className={`p-1.5 rounded-lg border text-xs transition-colors shadow-xs ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                          }`}
                          title="Mark Present"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleMark(r.student_id, 'late', r.checkin_mode || 'classroom')}
                          disabled={isUpdating}
                          className={`p-1.5 rounded-lg border text-xs transition-colors shadow-xs ${
                            status === 'late'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border-slate-200'
                          }`}
                          title="Mark Late"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleMark(r.student_id, 'absent', r.checkin_mode || 'classroom')}
                          disabled={isUpdating}
                          className={`p-1.5 rounded-lg border text-xs transition-colors shadow-xs ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200'
                          }`}
                          title="Mark Absent"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
