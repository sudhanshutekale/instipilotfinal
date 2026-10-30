'use client';

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Send, 
  DollarSign, 
  X,
  Phone,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

export default function FeesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming' | 'payments'>('overdue');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState<any>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    source: 'upi',
    reference: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/fees');
      if (res.status === 403) {
        setError('Access Denied: Your role does not have authorization to view financial data.');
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
    fetchFees();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmi) return;
    setSavingPayment(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedEmi.student_id,
          emiId: selectedEmi.id,
          amount: parseFloat(paymentForm.amount || selectedEmi.amount),
          source: paymentForm.source,
          reference: paymentForm.reference || `UPI/VERIFY/${Date.now().toString().slice(-6)}`
        })
      });
      if (res.ok) {
        setShowPayModal(false);
        setSelectedEmi(null);
        fetchFees();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPayment(false);
    }
  };

  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50 text-center max-w-lg mx-auto space-y-3 shadow-xs">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="font-display text-lg font-bold text-rose-900">Access Restricted</h3>
        <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
        <div className="pt-2">
          <span className="text-[11px] text-slate-500">
            Switch to an Owner or Accounts role using the user profile menu to view financial reports.
          </span>
        </div>
      </div>
    );
  }

  const { summary, overdueEmis, upcomingEmis, recentPayments } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Financial Management & Collections
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Fees & Installments Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track fee schedules, monitor overdue installments, and record incoming payments.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-emerald-600">
            ₹{(summary?.totalCollected || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">Admission fees & recorded EMIs</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-rose-300 transition-all shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Overdue Installments</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-rose-600">
            ₹{(summary?.totalOverdue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">{overdueEmis?.length || 0} overdue payments pending</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-all shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Upcoming Dues</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-amber-600">
            ₹{(summary?.totalPending || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">Scheduled across all active cohorts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`py-2 px-3.5 rounded-xl transition-all border ${
            activeTab === 'overdue'
              ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold shadow-xs'
              : 'bg-white border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overdue Installments ({overdueEmis?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 px-3.5 rounded-xl transition-all border ${
            activeTab === 'upcoming'
              ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold shadow-xs'
              : 'bg-white border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Due This Week / Upcoming ({upcomingEmis?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-2 px-3.5 rounded-xl transition-all border ${
            activeTab === 'payments'
              ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
              : 'bg-white border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Payment History ({recentPayments?.length || 0})
        </button>
      </div>

      {/* Table Content */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading fee records...
          </div>
        ) : activeTab === 'overdue' ? (
          overdueEmis?.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              No overdue installments found. All accounts are up to date!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Installment #</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueEmis?.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {e.student_name}
                        <div className="text-[11px] text-slate-500 font-normal">{e.student_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{e.batch_name}</td>
                      <td className="py-3.5 px-4 text-slate-700">EMI #{e.installment_no}</td>
                      <td className="py-3.5 px-4 text-rose-600 font-semibold">{e.due_date}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold">₹{e.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedEmi(e);
                              setPaymentForm({ amount: String(e.amount), source: 'upi', reference: '' });
                              setShowPayModal(true);
                            }}
                            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
                          >
                            Record Payment
                          </button>
                          <a
                            href={`https://wa.me/${e.student_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Dear ${e.student_name}, this is a payment reminder from InstiPilot regarding your course installment of ₹${e.amount} which was due on ${e.due_date}. Please settle via UPI or contact accounts.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white text-slate-600 transition-colors shadow-xs"
                            title="WhatsApp Reminder"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'upcoming' ? (
          upcomingEmis?.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              No upcoming installments scheduled for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Installment #</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingEmis?.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {e.student_name}
                        <div className="text-[11px] text-slate-500 font-normal">{e.student_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{e.batch_name}</td>
                      <td className="py-3.5 px-4 text-slate-700">EMI #{e.installment_no}</td>
                      <td className="py-3.5 px-4 text-amber-700 font-semibold">{e.due_date}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold">₹{e.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEmi(e);
                            setPaymentForm({ amount: String(e.amount), source: 'upi', reference: '' });
                            setShowPayModal(true);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
                        >
                          Receive Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          recentPayments?.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              No recent payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.student_name}</td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-mono">{p.reference}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-blue-700 uppercase text-[10px] font-semibold">
                          {p.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{p.date}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-slate-900 font-display font-bold text-base">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">For {selectedEmi?.student_name}</p>
              </div>
              <button 
                onClick={() => setShowPayModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1.5 font-medium">Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1.5 font-medium">Payment Method</label>
                <select
                  value={paymentForm.source}
                  onChange={(e) => setPaymentForm({ ...paymentForm, source: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm / QR)</option>
                  <option value="bank">Bank IMPS / NEFT Transfer</option>
                  <option value="cash">Cash Receipt</option>
                  <option value="card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1.5 font-medium">Transaction Reference / UTR *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI/YESB/48192841"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors disabled:opacity-50"
                >
                  {savingPayment ? 'Verifying...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
