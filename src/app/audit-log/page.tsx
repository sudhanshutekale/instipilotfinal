'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Filter, Search, Terminal, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ role: '', action: '', status: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role) params.set('role', filters.role);
      if (filters.action) params.set('action', filters.action);
      if (filters.status) params.set('status', filters.status);
      const res = await fetch(`/api/audit-log?${params.toString()}`);
      if (res.status === 403) {
        setError('Access Denied: Audit Log is strictly restricted to Owner/Director role.');
        setLoading(false);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [filters]);

  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50 text-center max-w-lg mx-auto space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900">Access Restricted</h3>
        <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
        <p className="text-xs text-slate-500">Switch to the Owner/Director role to access the Audit Log.</p>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (status === 'blocked') return <XCircle className="w-4 h-4 text-rose-600" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    return <Info className="w-4 h-4 text-slate-500" />;
  };

  const statusColors: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    blocked: 'bg-rose-50 text-rose-700 border-rose-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    error: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const actionLabels: Record<string, string> = {
    copilot_query: 'Copilot Query',
    copilot_blocked: 'Blocked Query',
    action_approved: 'Action Approved',
    action_rejected: 'Action Rejected',
    timetable_replan: 'Timetable Re-plan',
    login: 'Login',
    student_enrolled: 'Student Enrolled',
    create_batch: 'Batch Created',
    record_payment: 'Payment Recorded',
    system_init: 'System Init'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 block mb-1">
            Director Security & Compliance Trail
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            System Audit Log
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {logs.length} Events
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Every assistant query, blocked authorization attempt, approval, and administrative action recorded chronologically.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <select
          value={filters.role}
          onChange={(e) => setFilters({...filters, role: e.target.value})}
          className="py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
        >
          <option value="">All Roles</option>
          <option value="owner">Owner / Director</option>
          <option value="counselor">Counselor</option>
          <option value="trainer">Trainer</option>
          <option value="accounts">Accounts</option>
        </select>
        <select
          value={filters.action}
          onChange={(e) => setFilters({...filters, action: e.target.value})}
          className="py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
        >
          <option value="">All Actions</option>
          <option value="copilot_query">Copilot Queries</option>
          <option value="copilot_blocked">Blocked Attempts</option>
          <option value="action_approved">Approvals</option>
          <option value="timetable_replan">Timetable Re-plans</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="blocked">Blocked</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', val: logs.length, color: 'text-slate-900' },
          { label: 'Copilot Queries', val: logs.filter(l => l.action === 'copilot_query').length, color: 'text-blue-600' },
          { label: 'Blocked Attempts', val: logs.filter(l => l.status === 'blocked').length, color: 'text-rose-600' },
          { label: 'Approvals', val: logs.filter(l => l.action === 'action_approved').length, color: 'text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs text-center">
            <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.val}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Log Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User / Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Query / Context</th>
                <th className="py-3 px-4">Result Summary</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">Loading audit records...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">No audit events found matching filters.</td></tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                      {log.timestamp ? log.timestamp.slice(0, 16).replace('T', ' ') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-medium">{log.user_name || 'System'}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{log.role}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {actionLabels[log.action] || log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-[220px]">
                      <div className="truncate" title={log.query}>{log.query || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs max-w-[200px]">
                      <div className="truncate" title={log.result_summary}>{log.result_summary || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(log.status)}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusColors[log.status] || statusColors.error}`}>
                          {log.status?.toUpperCase()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
