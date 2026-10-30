'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Send, CheckCircle, XCircle, Phone, X, Filter } from 'lucide-react';

export default function OutboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/outbox/approve');
      if (res.status === 403) { setLoading(false); return; }
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, []);

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
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg.message_text)}`, '_blank');
        fetchMessages();
      }
    } catch (e) { console.error(e); }
    finally { setApprovingId(null); }
  };

  const filtered = filterStatus ? messages.filter(m => m.status === filterStatus) : messages;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
          Human-in-the-Loop Dispatch Queue
        </span>
        <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Messages Outbox
          <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {messages.filter(m => m.status === 'draft').length} Awaiting Approval
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          All drafted messages require staff approval before dispatch. No message is sent automatically without verification.
        </p>
      </div>

      <div className="flex gap-2 text-xs overflow-x-auto whitespace-nowrap pb-1">
        {['', 'draft', 'approved', 'sent', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`py-1.5 px-3.5 rounded-xl border font-medium transition-all ${
              filterStatus === s
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {s === '' ? 'All Messages' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'draft' && ` (${messages.filter(m => m.status === 'draft').length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading outbox records...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            No messages in this queue.
          </div>
        ) : (
          filtered.map((msg: any) => (
            <div
              key={msg.id}
              className={`p-5 rounded-2xl border shadow-xs ${
                msg.status === 'draft'
                  ? 'border-amber-200 bg-amber-50/40'
                  : msg.status === 'approved'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-slate-900">{msg.recipient_name}</span>
                    <span className="text-[11px] text-slate-500">{msg.recipient_phone}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase border ${
                      msg.status === 'draft'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : msg.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{msg.draft_reason}</div>
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0 font-medium">
                  via {msg.channel?.toUpperCase()}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap mb-3 shadow-xs">
                {msg.message_text}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Created by: {msg.created_by_role} &bull; {msg.created_at?.slice(0, 16)}</span>
                {msg.status === 'draft' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(msg)}
                      disabled={approvingId === msg.id}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{approvingId === msg.id ? 'Authorizing...' : 'Authorize & Send'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
