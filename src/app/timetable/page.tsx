'use client';

import React, { useEffect, useState } from 'react';
import { 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  X, 
  RefreshCw,
  Sparkles,
  User,
  Building,
  Clock,
  Layers
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COURSE_COLORS: Record<string, string> = {
  'c_java': 'bg-amber-50 border-amber-200 text-amber-900',
  'c_pydata': 'bg-blue-50 border-blue-200 text-blue-900',
  'c_mern': 'bg-sky-50 border-sky-200 text-sky-900',
  'c_aiml': 'bg-indigo-50 border-indigo-200 text-indigo-900',
  'c_iot': 'bg-rose-50 border-rose-200 text-rose-900',
  'c_dbms': 'bg-emerald-50 border-emerald-200 text-emerald-900',
};

const DEFAULT_COLOR = 'bg-slate-50 border-slate-200 text-slate-800';

export default function TimetablePage() {
  const [data, setData] = useState<any>({ slots: [], trainers: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [showUnavailModal, setShowUnavailModal] = useState(false);
  const [replanResult, setReplanResult] = useState<any>(null);
  const [replanning, setReplanning] = useState(false);

  const [unavailForm, setUnavailForm] = useState({
    trainerId: 't_vikram',
    day: 'Mon',
    startTime: '08:00',
    endTime: '10:00'
  });

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTrainer) params.set('trainerId', filterTrainer);
      if (filterRoom) params.set('roomId', filterRoom);
      const res = await fetch(`/api/timetable?${params.toString()}`);
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
    fetchTimetable();
  }, [filterTrainer, filterRoom]);

  const handleReplan = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplanning(true);
    setReplanResult(null);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_unavailable', ...unavailForm })
      });
      if (res.ok) {
        const result = await res.json();
        setReplanResult(result);
        fetchTimetable();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplanning(false);
    }
  };

  // Build a grid: days × time-blocks
  const slotsByDay: Record<string, any[]> = {};
  for (const day of DAYS) {
    slotsByDay[day] = data.slots.filter((s: any) => s.day_of_week === day);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Clash-Free Session Allocations
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Weekly Timetable Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic constraint solver ensures zero trainer clashes and room capacity compliance.
          </p>
        </div>
        <button
          onClick={() => { setShowUnavailModal(true); setReplanResult(null); }}
          className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-xs"
        >
          <X className="w-4 h-4" />
          Mark Trainer Unavailable & Re-Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <select
          value={filterTrainer}
          onChange={(e) => setFilterTrainer(e.target.value)}
          className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
        >
          <option value="">All Trainers</option>
          {data.trainers?.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
        >
          <option value="">All Rooms</option>
          {data.rooms?.map((r: any) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button
          onClick={fetchTimetable}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries({
          'Java Fullstack': 'c_java',
          'Python Data Eng': 'c_pydata',
          'MERN Stack': 'c_mern',
          'AI / ML': 'c_aiml',
          'IoT & Embedded': 'c_iot',
          'Database Eng': 'c_dbms',
        }).map(([label, key]) => (
          <span key={key} className={`px-2.5 py-1 rounded-lg border font-medium ${COURSE_COLORS[key]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Weekly Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
        <div className="grid grid-cols-7 min-w-[900px]">
          {DAYS.map((day) => (
            <div key={day} className="border-r border-slate-200 last:border-r-0">
              {/* Day header */}
              <div className="text-center py-2.5 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600 tracking-wider">
                {day}
              </div>

              {/* Slots for this day */}
              <div className="p-2 space-y-2 min-h-[280px]">
                {loading ? (
                  <div className="space-y-1.5 animate-pulse">
                    {[1, 2].map(i => (
                      <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
                    ))}
                  </div>
                ) : slotsByDay[day].length === 0 ? (
                  <div className="h-16 flex items-center justify-center text-[11px] text-slate-400">
                    No sessions
                  </div>
                ) : (
                  slotsByDay[day].map((slot: any) => {
                    const color = COURSE_COLORS[slot.course_id] || DEFAULT_COLOR;
                    return (
                      <div
                        key={slot.id}
                        className={`p-2.5 rounded-xl border text-[11px] shadow-xs hover:shadow-md transition-all ${color}`}
                      >
                        <div className="font-semibold text-xs leading-tight mb-1">{slot.batch_name}</div>
                        <div className="flex items-center gap-1 text-[10px] opacity-80">
                          <Clock className="w-2.5 h-2.5" />
                          {slot.start_time}–{slot.end_time}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] opacity-80 mt-0.5">
                          <User className="w-2.5 h-2.5" />
                          {slot.trainer_name}
                        </div>
                        {slot.room_name && (
                          <div className="flex items-center gap-1 text-[10px] opacity-75 mt-0.5">
                            <Building className="w-2.5 h-2.5" />
                            {slot.room_name}
                          </div>
                        )}
                        <div className="text-[9px] mt-1 font-semibold uppercase opacity-70">
                          {slot.mode}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unavailable Modal */}
      {showUnavailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-display font-bold text-base">
                <X className="w-4 h-4 text-rose-600" />
                Mark Trainer Unavailable
              </div>
              <button onClick={() => setShowUnavailModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!replanResult ? (
              <form onSubmit={handleReplan} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                  Marking a trainer unavailable will trigger the constraint-based re-planner. All affected sessions in the selected window will be reassigned to a qualified, clash-free alternative trainer and room.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Trainer *</label>
                    <select
                      value={unavailForm.trainerId}
                      onChange={(e) => setUnavailForm({ ...unavailForm, trainerId: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    >
                      {data.trainers?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Day *</label>
                    <select
                      value={unavailForm.day}
                      onChange={(e) => setUnavailForm({ ...unavailForm, day: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">From Time *</label>
                    <input
                      type="time"
                      value={unavailForm.startTime}
                      onChange={(e) => setUnavailForm({ ...unavailForm, startTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Until Time *</label>
                    <input
                      type="time"
                      value={unavailForm.endTime}
                      onChange={(e) => setUnavailForm({ ...unavailForm, endTime: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button type="button" onClick={() => setShowUnavailModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={replanning}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-2 shadow-xs transition-colors"
                  >
                    {replanning ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        Re-Planning...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Trigger Re-Plan
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Re-plan Results */
              <div className="space-y-4 text-xs">
                <div className={`p-3 rounded-xl border ${
                  replanResult.changes?.some((c: any) => c.action === 'reassigned')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="font-semibold mb-0.5">Re-Plan Complete</div>
                  <div className="text-[11px]">{replanResult.message}</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Changes Explanation (Audit Trail)
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {replanResult.changes?.map((ch: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{ch.batchName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            ch.action === 'reassigned'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {ch.action === 'reassigned' ? 'REASSIGNED' : 'UNRESOLVED'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                          <span>{ch.originalDay} {ch.originalStart}–{ch.originalEnd}</span>
                          {ch.newTrainer && (
                            <>
                              <ArrowRight className="w-3 h-3 text-blue-600" />
                              <span className="text-blue-700 font-medium">→ {ch.newTrainer}</span>
                            </>
                          )}
                        </div>
                        {ch.reason && (
                          <div className="text-[11px] text-slate-500 italic">{ch.reason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => { setShowUnavailModal(false); setReplanResult(null); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => setReplanResult(null)}
                    className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                  >
                    Re-Plan Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
