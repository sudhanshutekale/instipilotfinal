'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Loader2, 
  ShieldCheck, 
  Crown, 
  Eye, 
  X, 
  ExternalLink, 
  Check, 
  Filter, 
  Clock, 
  Building2, 
  GraduationCap, 
  Phone, 
  Mail, 
  Copy, 
  Sparkles, 
  Image as ImageIcon,
  Lock
} from 'lucide-react';

interface MatchedRecord {
  reference: string;
  amount: number;
  date: string;
  matchedStudentName?: string;
  matchedStudentId?: string;
  matchedEmiId?: string;
  confidence: number;
  status: 'matched' | 'unmatched' | 'suspicious';
  reason: string;
}

interface PaymentProof {
  id: string;
  student_id: string;
  emi_id: string;
  amount: number;
  reference: string;
  proof_image_url: string;
  payment_mode: string;
  notes?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  verified_by?: string;
  verified_by_name?: string;
  verified_at?: string;
  created_at: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_college?: string;
  installment_no: number;
  emi_due_date: string;
  emi_status: string;
  batch_name?: string;
  course_name?: string;
}

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState<'proofs' | 'csv'>('proofs');
  
  // Student Proofs state
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [proofFilter, setProofFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [currentRole, setCurrentRole] = useState<string>('owner');
  const [inspectingProof, setInspectingProof] = useState<PaymentProof | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingProof, setRejectingProof] = useState<PaymentProof | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // CSV Engine state
  const [csvData, setCsvData] = useState<MatchedRecord[]>([]);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  const fetchProofs = async () => {
    try {
      setProofsLoading(true);
      const res = await fetch('/api/reconciliation/proofs');
      if (res.ok) {
        const data = await res.json();
        setProofs(data.proofs || []);
        if (data.currentRole) setCurrentRole(data.currentRole);
      }
    } catch (e) {
      console.error('Failed to load proofs', e);
    } finally {
      setProofsLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleVerifyProof = async (proof: PaymentProof) => {
    setVerifyingId(proof.id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/reconciliation/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId: proof.id })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: data.message || `Payment proof for ${proof.student_name} verified!`, type: 'success' });
        if (inspectingProof?.id === proof.id) {
          setInspectingProof(null);
        }
        await fetchProofs();
      } else {
        setActionMessage({ text: data.error || 'Failed to verify proof', type: 'error' });
      }
    } catch (e: any) {
      setActionMessage({ text: e.message || 'Error occurred during verification', type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRejectProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProof || !rejectionReason.trim()) return;

    setActionMessage(null);
    try {
      const res = await fetch('/api/reconciliation/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId: rejectingProof.id, rejectionReason: rejectionReason.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: data.message || `Proof rejected for ${rejectingProof.student_name}`, type: 'success' });
        setRejectingProof(null);
        setRejectionReason('');
        if (inspectingProof?.id === rejectingProof.id) {
          setInspectingProof(null);
        }
        await fetchProofs();
      } else {
        setActionMessage({ text: data.error || 'Failed to reject proof', type: 'error' });
      }
    } catch (e: any) {
      setActionMessage({ text: e.message || 'Error occurred', type: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // CSV Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/['"]/g, ''));

      const refIdx = headers.findIndex(h => h.includes('ref') || h.includes('utr') || h.includes('txn'));
      const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('amt'));
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('sender'));

      const parsedRows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/['"]/g, ''));
        return {
          reference: cols[refIdx >= 0 ? refIdx : 0] || `TXN${Math.random().toString(36).slice(2)}`,
          amount: parseFloat(cols[amtIdx >= 0 ? amtIdx : 1]) || 0,
          date: cols[dateIdx >= 0 ? dateIdx : 2] || '2026-10-15',
          senderName: cols[nameIdx >= 0 ? nameIdx : 3] || ''
        };
      }).filter(r => r.amount > 0);

      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: parsedRows })
      });

      if (res.ok) {
        const result = await res.json();
        setCsvData(result.matches || []);
      }
    } catch (err) {
      console.error('CSV processing error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveCsv = async (record: MatchedRecord) => {
    if (!record.matchedEmiId || !record.matchedStudentId) return;
    setApproving(record.reference);
    try {
      await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: record.matchedStudentId,
          emiId: record.matchedEmiId,
          amount: record.amount,
          source: 'bank',
          reference: record.reference,
          notes: 'Auto-matched via CSV reconciliation'
        })
      });
      setCsvData(prev => prev.map(r =>
        r.reference === record.reference ? { ...r, status: 'matched' as const } : r
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(null);
    }
  };

  const filteredProofs = proofs.filter(p => {
    if (proofFilter === 'all') return true;
    return p.status === proofFilter;
  });

  const pendingCount = proofs.filter(p => p.status === 'pending').length;
  const verifiedCount = proofs.filter(p => p.status === 'verified').length;
  const isOwner = currentRole === 'owner';

  const matched = csvData.filter(r => r.status === 'matched');
  const unmatched = csvData.filter(r => r.status === 'unmatched');
  const suspicious = csvData.filter(r => r.status === 'suspicious');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Finance & Compliance Operations
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Audited Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Fee Reconciliation Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Reconcile payments across all intake channels. Student payment receipts are submitted directly via the Student Portal and verified by the Director before settlement.
          </p>
        </div>

        {/* Primary Engine Mode Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab('proofs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'proofs'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Student Payment Proofs</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 ml-1">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'csv'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Bank Statement CSV Matcher</span>
          </button>
        </div>
      </div>

      {/* Global Action Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            {actionMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:text-slate-900 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: STUDENT PAYMENT PROOFS (PHOTO VERIFICATION) */}
      {activeTab === 'proofs' && (
        <div className="space-y-6">
          {/* Owner Role Status Banner */}
          <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isOwner ? 'bg-blue-50 border border-blue-200 text-blue-600' : 'bg-slate-100 border border-slate-200 text-slate-500'
              }`}>
                {isOwner ? <Crown className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {isOwner ? 'Director / Owner Verification Authority' : 'Finance Review Mode (Read-Only Verification)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-semibold ${
                    isOwner ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {currentRole}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isOwner 
                    ? 'Payment photo proof upload is reserved for students. As the Director, inspect transaction screenshots and bank UTR below to settle fees.'
                    : 'Only the Director / Owner is authorized to verify and settle installments. Switch to Owner role to approve proofs.'}
                </p>
              </div>
            </div>

            {/* Verification Stats */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-lg font-bold text-amber-700">{pendingCount}</div>
                <div className="text-[10px] text-amber-700 uppercase font-semibold">Pending Review</div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-lg font-bold text-emerald-700">{verifiedCount}</div>
                <div className="text-[10px] text-emerald-700 uppercase font-semibold">Verified</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['all', 'pending', 'verified', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProofFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    proofFilter === filter
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter} {filter === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredProofs.length} proof{filteredProofs.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Proofs Grid / Cards */}
          {proofsLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <div className="text-xs text-slate-500">Loading student payment proofs...</div>
            </div>
          ) : filteredProofs.length === 0 ? (
            <div className="p-16 text-center rounded-xl border border-dashed border-slate-200 bg-white space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">No payment proofs matching this filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Students upload photo screenshots of their UPI or bank transfers directly via their student portal account.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProofs.map((proof) => {
                const isPending = proof.status === 'pending';
                const isVerified = proof.status === 'verified';
                const isRejected = proof.status === 'rejected';

                return (
                  <div
                    key={proof.id}
                    className="p-5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      {/* Card Header: Student & Status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                            {proof.student_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">
                              {proof.student_name}
                            </h3>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>{proof.course_name || 'Enrolled Course'}</span>
                              <span>&bull;</span>
                              <span className="font-semibold text-blue-600">Inst #{proof.installment_no}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                          isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isVerified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isPending && <Clock className="w-3.5 h-3.5" />}
                          {isVerified && <CheckCircle className="w-3.5 h-3.5" />}
                          {isRejected && <XCircle className="w-3.5 h-3.5" />}
                          {isPending ? 'Pending Review' : proof.status}
                        </span>
                      </div>

                      {/* Main Data & Photo Split */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        {/* Photo Thumbnail */}
                        <div 
                          onClick={() => setInspectingProof(proof)}
                          className="sm:col-span-1 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden relative group cursor-pointer aspect-[3/4] flex items-center justify-center"
                        >
                          {proof.proof_image_url ? (
                            <img
                              src={proof.proof_image_url}
                              alt={`Receipt proof for ${proof.student_name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                              <ImageIcon className="w-6 h-6" />
                              <span>No Photo</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium p-2 text-center">
                            <Eye className="w-5 h-5 text-blue-300" />
                            <span>Inspect Full Receipt</span>
                          </div>
                        </div>

                        {/* Financial & Transaction Breakdown */}
                        <div className="sm:col-span-2 space-y-2 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-semibold block">Claimed Payment Amount</span>
                            <span className="font-bold text-lg text-slate-900">
                              ₹{proof.amount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-semibold block">UPI UTR / Bank Reference</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-blue-700 font-semibold text-xs truncate">
                                {proof.reference}
                              </span>
                              <button
                                onClick={() => copyToClipboard(proof.reference)}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                                title="Copy UTR Reference"
                              >
                                {copiedRef === proof.reference ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
                            <div>
                              <span className="text-slate-500 block">Submitted:</span>
                              <span className="text-slate-800 font-medium">{proof.created_at.split(' ')[0]}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">EMI Due Date:</span>
                              <span className="text-slate-800 font-medium">{proof.emi_due_date}</span>
                            </div>
                          </div>

                          {proof.notes && (
                            <div className="pt-1 text-xs text-slate-600 italic">
                              &ldquo;{proof.notes}&rdquo;
                            </div>
                          )}

                          {isVerified && proof.verified_by_name && (
                            <div className="pt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verified by {proof.verified_by_name} ({proof.verified_at?.split(' ')[0]})</span>
                            </div>
                          )}

                          {isRejected && proof.rejection_reason && (
                            <div className="pt-1 text-xs text-rose-700 font-medium">
                              Rejection note: {proof.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setInspectingProof(proof)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect Receipt</span>
                      </button>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          {isOwner ? (
                            <>
                              <button
                                onClick={() => setRejectingProof(proof)}
                                className="py-1.5 px-3 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleVerifyProof(proof)}
                                disabled={verifyingId === proof.id}
                                className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                {verifyingId === proof.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Verify & Settle EMI</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                              <Lock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Owner Review Required</span>
                            </span>
                          )}
                        </div>
                      )}

                      {isVerified && (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>EMI Settled & Logged</span>
                        </span>
                      )}

                      {isRejected && (
                        <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected by Owner</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BANK STATEMENT CSV AUTO-MATCHER */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Bank / UPI CSV Statement Auto-Matcher
            </h3>
            <p className="text-xs text-slate-500">
              Upload an export statement from HDFC, ICICI, SBI or Razorpay/Paytm. The engine matches UTR reference codes and sender names against expected student installments.
            </p>
          </div>

          {/* Upload Zone */}
          <label className="cursor-pointer block">
            <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 bg-white hover:border-blue-400 transition-colors flex flex-col items-center gap-3 text-center shadow-xs">
              {processing ? (
                <div className="flex items-center gap-3 text-blue-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-medium">Parsing statement and matching transactions...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-slate-800 font-semibold">
                    {fileName ? `Uploaded Statement: ${fileName}` : 'Drop your bank/UPI CSV statement here or click to browse'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Expected columns: Reference/UTR, Amount, Date, Sender Name
                  </div>
                  <div className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors">
                    Select CSV File
                  </div>
                </>
              )}
            </div>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          {/* Quick Demo Statement */}
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => {
                const demoCsv = `Reference,Amount,Date,Sender Name\nUPI/HDFC/982731827419,11667,2026-10-15,Rohan G\nUPI/ICIC/471029481023,11667,2026-10-16,Ananya D\nUPI/SBI/UNKN99,5000,2026-10-15,Unknown Sender\nNEFT/ICIC/00293,23334,2026-10-13,Amit P\nUPI/GPY/827364,11250,2026-10-16,Kavita N`;
                const blob = new Blob([demoCsv], { type: 'text/csv' });
                const file = new File([blob], 'demo_statement.csv', { type: 'text/csv' });
                const dt = new DataTransfer();
                dt.items.add(file);
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input) {
                  Object.defineProperty(input, 'files', { value: dt.files, writable: false });
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }
                setFileName('demo_statement.csv');
                setProcessing(true);
                fetch('/api/reconciliation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    transactions: [
                      { reference: 'UPI/HDFC/982731827419', amount: 11667, date: '2026-10-15', senderName: 'Rohan G' },
                      { reference: 'UPI/ICIC/471029481023', amount: 11667, date: '2026-10-16', senderName: 'Ananya D' },
                      { reference: 'UPI/SBI/UNKN99', amount: 5000, date: '2026-10-15', senderName: 'Unknown Sender' },
                      { reference: 'NEFT/ICIC/00293', amount: 23334, date: '2026-10-13', senderName: 'Amit P' },
                      { reference: 'UPI/GPY/827364', amount: 11250, date: '2026-10-16', senderName: 'Kavita N' },
                    ]
                  })
                }).then(r => r.json()).then(d => { setCsvData(d.matches || []); setProcessing(false); });
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
            >
              &rarr; Load sample bank statement (5 transactions)
            </button>
          </div>

          {/* CSV Results Table */}
          {csvData.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Auto-Matched', count: matched.length + suspicious.filter(r => r.confidence > 70).length, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { label: 'Unmatched', count: unmatched.length, color: 'text-rose-700 bg-rose-50 border-rose-200' },
                  { label: 'Review Flagged', count: suspicious.filter(r => r.confidence <= 70).length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                ].map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${s.color} text-center`}>
                    <div className="text-2xl font-bold tracking-tight">{s.count}</div>
                    <div className="text-xs font-semibold uppercase mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Reference / UTR</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Matched Student</th>
                        <th className="py-3 px-4">Confidence</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 text-slate-700 text-xs font-mono">{row.reference}</td>
                          <td className="py-3 px-4 text-slate-900 font-bold">₹{row.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-slate-500">{row.date}</td>
                          <td className="py-3 px-4 text-slate-900 font-medium">{row.matchedStudentName || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 w-16">
                                <div
                                  className={`h-full rounded-full ${row.confidence >= 80 ? 'bg-emerald-500' : row.confidence >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${row.confidence}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-500 font-semibold">{row.confidence}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                              row.status === 'matched' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              row.status === 'suspicious' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {row.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {row.status !== 'matched' && row.matchedEmiId && (
                              <button
                                onClick={() => handleApproveCsv(row)}
                                disabled={approving === row.reference}
                                className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs"
                              >
                                {approving === row.reference ? 'Applying...' : 'Approve Match'}
                              </button>
                            )}
                            {row.status === 'unmatched' && !row.matchedEmiId && (
                              <span className="text-xs text-slate-400">Manual review</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: LIGHTBOX INSPECT PHOTO RECEIPT (HIGH RES VIEW) */}
      {inspectingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Student Payment Receipt — {inspectingProof.student_name}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    Installment #{inspectingProof.installment_no} &bull; ₹{inspectingProof.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingProof(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: High Res Image & Meta */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Display */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center min-h-[350px]">
                {inspectingProof.proof_image_url ? (
                  <img
                    src={inspectingProof.proof_image_url}
                    alt="Payment receipt proof"
                    className="max-h-[480px] w-auto object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="text-slate-400 text-xs">No image provided</div>
                )}
              </div>

              {/* Verification Details */}
              <div className="space-y-4 text-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Student & Enrollment</span>
                    <div className="font-bold text-slate-900 text-sm">{inspectingProof.student_name}</div>
                    <div className="text-slate-600">{inspectingProof.student_email} &bull; {inspectingProof.student_phone}</div>
                    <div className="text-slate-600">{inspectingProof.student_college || 'Engineering College'}</div>
                    <div className="text-blue-700 font-semibold text-xs pt-1 border-t border-slate-200">
                      {inspectingProof.course_name} ({inspectingProof.batch_name})
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Payment Breakdown</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Claimed Amount:</span>
                      <span className="text-slate-900 font-bold text-base">₹{inspectingProof.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">UPI Reference / UTR:</span>
                      <span className="text-blue-700 font-semibold">{inspectingProof.reference}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Submission Date:</span>
                      <span className="text-slate-800 font-medium">{inspectingProof.created_at}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="uppercase font-bold text-amber-700">{inspectingProof.status}</span>
                    </div>
                  </div>

                  {inspectingProof.notes && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs italic">
                      Student Remarks: &ldquo;{inspectingProof.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Owner Verification Action Inside Modal */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  {inspectingProof.status === 'pending' ? (
                    isOwner ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setRejectingProof(inspectingProof);
                          }}
                          className="flex-1 py-2.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors"
                        >
                          Reject Proof
                        </button>
                        <button
                          onClick={() => handleVerifyProof(inspectingProof)}
                          disabled={verifyingId === inspectingProof.id}
                          className="flex-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors w-full"
                        >
                          {verifyingId === inspectingProof.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Verify & Settle EMI</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-center text-slate-600 text-xs flex items-center justify-center gap-2 font-medium">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Director / Owner authorization required to verify receipt.</span>
                      </div>
                    )
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs font-semibold">
                      &check; This payment receipt has already been processed ({inspectingProof.status.toUpperCase()}).
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT PROOF MODAL */}
      {rejectingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Reject Payment Receipt
              </div>
              <button onClick={() => setRejectingProof(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide a clear reason for rejecting the receipt from <strong className="text-slate-900">{rejectingProof.student_name}</strong>. The student will be notified and can re-upload a valid photo receipt in their portal.
            </p>

            <form onSubmit={handleRejectProof} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-700 block mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR number not found in bank statement, or screenshot is blurry / amount mismatch."
                  className="w-full rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingProof(null)}
                  className="py-2 px-4 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
