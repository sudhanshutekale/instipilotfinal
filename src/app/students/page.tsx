'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  X, 
  Download,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  Edit3,
  Shield,
  Check,
  AlertCircle,
  UserCheck
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [filterRiskOnly, setFilterRiskOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  // Edit Student Form State
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '+91 ',
    guardianName: '',
    guardianPhone: '+91 ',
    city: 'Pune',
    college: '',
    batchId: 'b_java_m1'
  });
  const [savingStudent, setSavingStudent] = useState(false);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      if (res.ok) {
        const json = await res.json();
        setAvailableBatches(json.batches || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedBatch) params.set('batchId', selectedBatch);

      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStudents(json.students || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedBatch]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudent(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ text: `Successfully enrolled ${newStudent.name}!`, type: 'success' });
        setShowAddModal(false);
        setNewStudent({
          name: '',
          email: '',
          phone: '+91 ',
          guardianName: '',
          guardianPhone: '+91 ',
          city: 'Pune',
          college: '',
          batchId: 'b_java_m1'
        });
        fetchStudents();
      } else {
        setStatusMessage({ text: data.error || 'Failed to enroll student', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setSavingStudent(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent)
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ text: data.message || `Successfully updated ${editingStudent.name}!`, type: 'success' });
        setEditingStudent(null);
        fetchStudents();
      } else {
        setStatusMessage({ text: data.error || 'Failed to update student', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadCertificate = async (student: any) => {
    setGeneratingCertId(student.id);
    try {
      const res = await fetch(`/api/certificates/generate?studentId=${student.id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `InstiPilot_Certificate_${student.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingCertId(null);
    }
  };

  const filteredStudents = filterRiskOnly
    ? students.filter(s => s.riskScore >= 70)
    : students;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Institutional Enrollment & Profiles
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Students & Roster
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {students.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive academic records, attendance history, fee installments, and student advisories.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Status Message Alert */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-xs ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, phone, city..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="">All Batches</option>
            {availableBatches.length > 0 ? (
              availableBatches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))
            ) : (
              <>
                <option value="b_java_m1">Java Morning (Alpha)</option>
                <option value="b_java_fast">Java Fast-Track</option>
                <option value="b_java_e1">Java Evening Pro</option>
                <option value="b_py_m2">Python Data Eng</option>
                <option value="b_mern_e2">Modern MERN</option>
                <option value="b_ai_w2">Weekend AI/ML</option>
                <option value="b_iot_m3">IoT Hardware Lab</option>
                <option value="b_dbms_w1">Database Global</option>
              </>
            )}
          </select>
        </div>

        {/* Risk Filter Chip */}
        <button
          onClick={() => setFilterRiskOnly(!filterRiskOnly)}
          className={`py-2 px-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
            filterRiskOnly
              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${filterRiskOnly ? 'text-rose-600' : 'text-slate-400'}`} />
          High Attendance Risk Only (Score ≥ 70)
        </button>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student & Contact</th>
                <th className="py-3 px-4">Batch & Course</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Fee / EMI Status</th>
                <th className="py-3 px-4">Dropout Risk Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading student rosters...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const attRate = st.total_attendance_sessions > 0
                    ? Math.round((st.present_sessions / st.total_attendance_sessions) * 100)
                    : 100;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{st.phone}</span> &bull; <span>{st.city}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                          {st.email}
                        </div>
                        {/* Guardian Name Display */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-700">
                          <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            Guardian
                          </span>
                          <span className="font-medium text-slate-800">
                            {st.guardian_name ? (
                              st.guardian_name
                            ) : (
                              <span className="text-slate-400 italic">Not set</span>
                            )}
                          </span>
                          {st.guardian_phone && (
                            <span className="text-slate-500 text-[10px]">
                              ({st.guardian_phone})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{st.batch_name}</div>
                        <div className="text-[11px] text-blue-600 mt-0.5">{st.course_name}</div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-xs ${
                            attRate >= 80 ? 'text-emerald-600' : attRate >= 60 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {attRate}%
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({st.present_sessions}/{st.total_attendance_sessions} classes)
                          </span>
                        </div>
                        {st.absent_sessions > 0 && (
                          <div className="text-[10px] text-rose-600 mt-0.5">
                            {st.absent_sessions} absences logged
                          </div>
                        )}
                      </td>

                      {/* Fee / EMI Status */}
                      <td className="py-3.5 px-4 text-xs">
                        {st.overdue_emi_count > 0 ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                              {st.overdue_emi_count} Overdue (₹{st.overdue_emi_amount?.toLocaleString('en-IN')})
                            </span>
                          </div>
                        ) : st.next_emi_date ? (
                          <div className="text-slate-700 text-[11px]">
                            Next: <span className="text-amber-700 font-medium">{st.next_emi_date}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-semibold">Settled</span>
                        )}
                      </td>

                      {/* Dropout Risk Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            st.riskScore >= 75
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : st.riskScore >= 40
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {st.riskScore}/100
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 uppercase">
                            {st.riskScore >= 75 ? 'Critical' : st.riskScore >= 40 ? 'Moderate' : 'Low'}
                          </span>
                        </div>
                        {st.riskReasons && st.riskReasons.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1 max-w-[220px] truncate" title={st.riskReasons.join('; ')}>
                            {st.riskReasons[0]}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Student & Guardian Name Button */}
                          <button
                            onClick={() => setEditingStudent({
                              id: st.id,
                              name: st.name,
                              email: st.email,
                              phone: st.phone,
                              guardianName: st.guardian_name || '',
                              guardianPhone: st.guardian_phone || '',
                              city: st.city || 'Pune',
                              college: st.college || '',
                              status: st.status || 'active',
                              batchId: st.batch_id || 'b_java_m1'
                            })}
                            className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white text-slate-600 transition-colors shadow-xs"
                            title="Edit Student & Guardian Info"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Outreach WhatsApp */}
                          <a
                            href={`https://wa.me/${st.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${st.name}, this is from InstiPilot Academy regarding your ${st.course_name} batch. Please connect with your academic mentor for updates.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-600 transition-colors shadow-xs"
                            title="Send WhatsApp Message"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Generate Certificate */}
                          <button
                            onClick={() => handleDownloadCertificate(st)}
                            disabled={generatingCertId === st.id}
                            className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-600 transition-colors shadow-xs"
                            title="Download Verified Course Certificate (PDF)"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-display font-bold text-base">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                Enroll New Student
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="e.g. Yash Vardhan"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="yash@example.com"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Phone (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">City</label>
                  <input
                    type="text"
                    value={newStudent.city}
                    onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })}
                    placeholder="Pune"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={newStudent.guardianName}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                    placeholder="Mr. Suresh Vardhan"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={newStudent.guardianPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Assign Initial Batch *</label>
                <select
                  value={newStudent.batchId}
                  onChange={(e) => setNewStudent({ ...newStudent, batchId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  {availableBatches.length > 0 ? (
                    availableBatches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="b_java_m1">Java Fullstack Morning (Alpha)</option>
                      <option value="b_java_fast">Java Sprint Fast-Track</option>
                      <option value="b_java_e1">Java Evening Pro</option>
                      <option value="b_py_m2">Python Data Engineering</option>
                      <option value="b_mern_e2">Modern MERN & Cloud</option>
                      <option value="b_ai_w2">Weekend AI/ML Masterclass</option>
                      <option value="b_iot_m3">Embedded Systems & IoT Lab</option>
                      <option value="b_dbms_w1">Database Engineering Global</option>
                    </>
                  )}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                Enrollment plan: Creates student profile, registers initial installment schedule, and assigns student to the batch roster.
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
                  disabled={savingStudent}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition-all"
                >
                  {savingStudent ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student & Guardian Name Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-display font-bold text-base">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Edit3 className="w-4 h-4" />
                </div>
                Edit Student Profile & Guardian Records
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Student Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.phone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">City</label>
                  <input
                    type="text"
                    value={editingStudent.city}
                    onChange={(e) => setEditingStudent({ ...editingStudent, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* GUARDIAN SECTION */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Guardian Information (Emergency & Fee Contact)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Guardian Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mr. Ramesh Gupta"
                      value={editingStudent.guardianName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, guardianName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white border border-blue-200 text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Guardian Phone (WhatsApp)</label>
                    <input
                      type="text"
                      placeholder="+91 98200 00000"
                      value={editingStudent.guardianPhone}
                      onChange={(e) => setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Cohort Batch</label>
                  <select
                    value={editingStudent.batchId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, batchId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    {availableBatches.length > 0 ? (
                      availableBatches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="b_java_m1">Java Morning (Alpha)</option>
                        <option value="b_java_fast">Java Fast-Track</option>
                        <option value="b_java_e1">Java Evening Pro</option>
                        <option value="b_py_m2">Python Data Eng</option>
                        <option value="b_mern_e2">Modern MERN</option>
                        <option value="b_ai_w2">Weekend AI/ML</option>
                        <option value="b_iot_m3">IoT Hardware Lab</option>
                        <option value="b_dbms_w1">Database Global</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Enrollment Status</label>
                  <select
                    value={editingStudent.status}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="active">Active Enrolled</option>
                    <option value="completed">Completed / Graduated</option>
                    <option value="dropped">Dropout / Inactive</option>
                    <option value="on-leave">Medical / Academic Leave</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-all"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Student Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
