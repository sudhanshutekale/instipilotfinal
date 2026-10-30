'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Building, 
  Video, 
  CheckCircle, 
  AlertTriangle,
  X,
  Sparkles,
  Filter,
  PlayCircle,
  PauseCircle,
  Archive,
  Hourglass
} from 'lucide-react';

type StatusKey = 'all' | 'ongoing' | 'upcoming' | 'completed' | 'paused';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dotColor: string }> = {
  ongoing:   { label: 'Active',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dotColor: 'bg-emerald-500' },
  upcoming:  { label: 'Upcoming',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dotColor: 'bg-blue-500' },
  completed: { label: 'Completed', color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',   dotColor: 'bg-slate-400' },
  paused:    { label: 'Paused',    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dotColor: 'bg-amber-500' },
};

export default function BatchesPage() {
  const [data, setData] = useState<any>({ batches: [], courses: [], trainers: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusKey>('ongoing');
  const [showAddModal, setShowAddModal] = useState(false);
  const [clashNotification, setClashNotification] = useState<string | null>(null);

  const [newBatch, setNewBatch] = useState({
    courseId: 'c_java',
    trainerId: 't_vikram',
    roomId: 'room_1',
    name: 'Java Evening Cohort Pro 2',
    days: 'Mon,Wed,Fri',
    startTime: '14:00',
    endTime: '16:00',
    mode: 'hybrid',
    maxSeats: 30,
    onlineSeatLimit: 25
  });
  const [creating, setCreating] = useState(false);

  // Fetch ALL batches (unfiltered) so we can do client-side tab switching instantly
  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
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
    fetchBatches();
    // Check if navigated here with ?status=ongoing from dashboard KPI click
    const params = new URLSearchParams(window.location.search);
    const urlStatus = params.get('status') as StatusKey | null;
    if (urlStatus && ['all', 'ongoing', 'upcoming', 'completed', 'paused'].includes(urlStatus)) {
      setActiveFilter(urlStatus);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setClashNotification(null);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch)
      });
      const resJson = await res.json();
      if (res.ok) {
        if (resJson.clashWarning) {
          setClashNotification(resJson.clashWarning);
        }
        setShowAddModal(false);
        fetchBatches();
      } else {
        alert(resJson.error || 'Failed to create batch');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const allBatches: any[] = data.batches || [];

  // Build tab counts
  const counts = {
    all:       allBatches.length,
    ongoing:   allBatches.filter((b: any) => b.status === 'ongoing').length,
    upcoming:  allBatches.filter((b: any) => b.status === 'upcoming').length,
    completed: allBatches.filter((b: any) => b.status === 'completed').length,
    paused:    allBatches.filter((b: any) => b.status === 'paused').length,
  };

  const filteredBatches = activeFilter === 'all'
    ? allBatches
    : allBatches.filter((b: any) => b.status === activeFilter);

  const TABS: { key: StatusKey; label: string; icon: any }[] = [
    { key: 'all',       label: 'All Batches',  icon: Layers },
    { key: 'ongoing',   label: 'Active / Ongoing', icon: PlayCircle },
    { key: 'upcoming',  label: 'Upcoming',     icon: Hourglass },
    { key: 'completed', label: 'Completed',    icon: Archive },
    { key: 'paused',    label: 'Paused',       icon: PauseCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Academic Cohorts & Capacity
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Batches & Cohorts
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {counts.ongoing} Active
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {counts.all} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor room capacity, hybrid limits, and instructor assignments across all active cohorts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Batch
        </button>
      </div>

      {/* Clash Notification Banner */}
      {clashNotification && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start justify-between gap-3 text-xs text-amber-800 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900">Timetable Conflict Notice</div>
              <div className="mt-0.5">{clashNotification}</div>
            </div>
          </div>
          <Link
            href="/timetable"
            className="py-1 px-3 rounded-lg bg-amber-600 text-white text-[11px] font-medium hover:bg-amber-700 flex-shrink-0 shadow-xs"
          >
            Launch Re-planner
          </Link>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeFilter === key;
          const count = counts[key];
          if (key !== 'all' && count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`py-2 px-3.5 rounded-xl flex items-center gap-2 text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-52 rounded-2xl bg-white border border-slate-200 animate-pulse"></div>
          ))
        ) : filteredBatches.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              No {activeFilter === 'all' ? '' : activeFilter} batches found.
            </p>
          </div>
        ) : (
          filteredBatches.map((b: any) => {
            const occupancyPct = b.max_seats > 0 ? Math.round((b.enrolled_students / b.max_seats) * 100) : 0;
            const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG['upcoming'];
            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  {/* Top row: days + status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {b.days}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Status badge */}
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor} ${b.status === 'ongoing' ? 'animate-pulse' : ''}`}></span>
                        {statusCfg.label}
                      </span>
                      {/* Mode badge */}
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {b.mode}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {b.name}
                  </h3>
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                    <span>{b.course_name}</span>
                  </div>

                  {/* Timings and Room */}
                  <div className="space-y-1.5 mb-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-medium text-slate-700">{b.start_time} - {b.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px]">{b.room_name || 'Online Global Studio'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px]">Trainer: <span className="text-slate-900 font-medium">{b.trainer_name}</span></span>
                    </div>
                  </div>

                  {/* Seat Occupancy Meter */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Occupancy</span>
                      <span className={`font-semibold ${
                        occupancyPct >= 90 ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        {b.enrolled_students} / {b.max_seats} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancyPct >= 90 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href={`/attendance?batchId=${b.id}`}
                    className="text-blue-600 hover:text-blue-700 text-[11px] font-medium"
                  >
                    Attendance &rarr;
                  </Link>
                  <Link
                    href={`/recordings?batchId=${b.id}`}
                    className="text-slate-500 hover:text-slate-800 text-[11px] font-medium"
                  >
                    Recordings &rarr;
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-display font-bold text-base">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                Schedule New Batch
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Batch Title *</label>
                <input
                  type="text"
                  required
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  placeholder="e.g. Advanced Java Evening Sprint"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Course *</label>
                  <select
                    value={newBatch.courseId}
                    onChange={(e) => setNewBatch({ ...newBatch, courseId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    {data.courses?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Assigned Trainer *</label>
                  <select
                    value={newBatch.trainerId}
                    onChange={(e) => setNewBatch({ ...newBatch, trainerId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    {data.trainers?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Physical Room</label>
                  <select
                    value={newBatch.roomId}
                    onChange={(e) => setNewBatch({ ...newBatch, roomId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    {data.rooms?.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Delivery Mode *</label>
                  <select
                    value={newBatch.mode}
                    onChange={(e) => setNewBatch({ ...newBatch, mode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="hybrid">Hybrid (Classroom + Online)</option>
                    <option value="classroom">Classroom In-Person Only</option>
                    <option value="online">Online Virtual Studio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Days *</label>
                  <input
                    type="text"
                    required
                    value={newBatch.days}
                    onChange={(e) => setNewBatch({ ...newBatch, days: e.target.value })}
                    placeholder="Mon,Wed,Fri"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newBatch.startTime}
                    onChange={(e) => setNewBatch({ ...newBatch, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={newBatch.endTime}
                    onChange={(e) => setNewBatch({ ...newBatch, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                Institutional Safety Check: InstiPilot automatically validates trainer availability and room constraints upon submission.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition-all"
                >
                  {creating ? 'Scheduling...' : 'Save & Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
