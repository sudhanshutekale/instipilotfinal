'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Database,
  ExternalLink,
  RotateCcw,
  Terminal,
  MessageSquare
} from 'lucide-react';
import { AuthUser } from '@/lib/rbac/user-types';
import { ROLE_PERMISSIONS, UserRole } from '@/lib/rbac/permissions';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  data?: any[];
  actionPreview?: {
    type: 'whatsapp_draft' | 'status_update';
    items: {
      recipientName: string;
      recipientPhone: string;
      messageText: string;
      reason: string;
      studentId?: string;
    }[];
  };
  blocked?: boolean;
  blockedReason?: string;
  executionTimeMs?: number;
  timestamp: string;
}

function FormattedContent({ 
  content, 
  onPromptClick 
}: { 
  content: string; 
  onPromptClick?: (prompt: string) => void;
}) {
  const lines = content.split('\n');
  return (
    <div className="text-xs text-slate-300 leading-relaxed space-y-1">
      {lines.map((line, idx) => {
        if (line.trim() === '---') {
          return <hr key={idx} className="border-surface-border my-2.5" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-display font-semibold text-sm text-brand-200 pt-1">
              {formatInline(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-display font-bold text-sm text-white pt-1">
              {formatInline(line.slice(3))}
            </h3>
          );
        }
        if (line.includes('👉 *Ask:')) {
          const match = line.match(/👉 \*Ask: "(.*?)"\*/);
          if (match && onPromptClick) {
            return (
              <div key={idx} className="pl-2 py-1">
                <button
                  type="button"
                  onClick={() => onPromptClick(match[1])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-brand-300 hover:bg-surface-hover hover:text-white transition-all text-xs font-medium shadow-subtle active:scale-95 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
                  <span>{match[1]}</span>
                </button>
              </div>
            );
          }
        }
        if (line.trim().length === 0) {
          return <div key={idx} className="h-1" />;
        }
        return (
          <div key={idx} className={line.startsWith('• ') ? 'pl-2 text-slate-200' : ''}>
            {formatInline(line)}
          </div>
        );
      })}
    </div>
  );
}

function formatInline(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      parts.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand-300 hover:text-brand-200 underline underline-offset-2 font-medium transition-colors"
        >
          {match[2]}
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      );
    } else if (match[4]) {
      parts.push(
        <code key={key++} className="font-mono bg-surface-darkest px-1.5 py-0.5 rounded border border-surface-border text-brand-200 text-[11px]">
          {match[4]}
        </code>
      );
    } else if (match[5]) {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {match[5]}
        </strong>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function CopilotDrawer({ isOpen, onClose, currentUser }: CopilotDrawerProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);
  const [approvedActionIds, setApprovedActionIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roleConfig = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.owner;

  // Suggested questions based on active role
  const suggestedQuestions: Record<UserRole, string[]> = {
    owner: [
      "Show all details of student Aarav Gupta",
      "Tell me about student Rohan Gupta",
      "Which students in the Java batch have missed 3 or more classes and have an EMI due this week?",
      "Who are the top 5 students most at risk of dropping out?",
      "Are any trainers near double-booking or have conflicting batch hours?"
    ],
    counselor: [
      "Tell me about student Rohan Gupta",
      "Which students in Java Fullstack have missed more than 3 classes?",
      "Draft an encouraging check-in WhatsApp for students with recent absences.",
      "Show class attendance summary for this week across all ongoing batches."
    ],
    trainer: [
      "Details of student Aarav Gupta",
      "Show attendance summary for my Java Morning batch.",
      "List students who haven't submitted the Spring Boot assignment.",
      "What is my timetable schedule for this week?"
    ],
    accounts: [
      "Fee details of student Aarav Gupta",
      "List all pending and overdue EMIs due in the next 7 days.",
      "Show total fee collected this month grouped by payment method (UPI vs Bank).",
      "Which students have consecutive overdue installments?"
    ],
    student: [
      "What is my current attendance percentage and recent logs?",
      "When is my next fee installment due and how do I pay?",
      "What is my class schedule and timetable for this week?",
      "How do I access recordings and assignments for my batch?"
    ]
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || loading) return;

    const userMsgId = `msg_user_${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend }),
      });

      const result = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: result.explanation || result.error || 'No explanation returned.',
        sql: result.sql,
        data: result.data,
        actionPreview: result.actionPreview,
        blocked: result.blocked,
        blockedReason: result.blockedReason,
        executionTimeMs: result.executionTimeMs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...newMessages, assistantMsg]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `Connection error: ${err.message}`,
          blocked: true,
          blockedReason: 'Failed to contact copilot backend service.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAction = async (msgId: string, actionItem: any) => {
    try {
      const res = await fetch('/api/outbox/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: actionItem.studentId,
          recipientPhone: actionItem.recipientPhone,
          recipientName: actionItem.recipientName,
          messageText: actionItem.messageText,
          draftReason: actionItem.reason,
          channel: 'whatsapp'
        })
      });

      if (res.ok) {
        setApprovedActionIds(prev => ({ ...prev, [`${msgId}_${actionItem.recipientPhone}`]: true }));
        // Open wa.me link simulation
        const cleanPhone = actionItem.recipientPhone.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(actionItem.messageText)}`;
        window.open(waUrl, '_blank');
      }
    } catch (e) {
      console.error('Failed to approve action', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to dismiss on desktop */}
      <div className="hidden sm:block flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full sm:max-w-xl h-full bg-surface-darkest border-l border-surface-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between bg-surface-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">Operations Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-950/80 text-brand-300 border border-brand-800/50 uppercase tracking-wide">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Institutional Records &bull; Action Authorization &bull; Academic Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-3 shadow-subtle">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-white text-base mb-1">
                How can we assist you today?
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                Query student profiles, batch attendance velocity, and fee receivables with verified institutional policy boundaries for <span className="text-brand-300 font-medium capitalize">{currentUser.role}</span>.
              </p>

              {/* Suggested Questions */}
              <div className="w-full text-left">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-brand-400" />
                  Recommended Operational Inquiries
                </div>
                <div className="space-y-2">
                  {suggestedQuestions[currentUser.role]?.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="w-full text-left p-3 rounded-xl bg-surface-card border border-surface-border text-xs text-slate-300 hover:text-white hover:border-brand-500/40 hover:bg-surface-hover transition-all flex items-center justify-between group shadow-subtle"
                    >
                      <span className="line-clamp-2">{q}</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 flex-shrink-0 ml-2 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* User Message */}
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-xs text-white shadow-subtle">
                    <p className="leading-relaxed">{msg.content}</p>
                    <span className="text-[9px] text-brand-200 mt-1 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                ) : (
                  /* Assistant Message */
                  <div className="w-full rounded-2xl border border-surface-border bg-surface-card p-4 text-xs text-slate-200 space-y-3 shadow-subtle">
                    {/* Blocked Alert or Success */}
                    {msg.blocked ? (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-rose-200">Restricted by Role Permissions</div>
                          <div className="text-[11px] text-rose-300/90 mt-0.5">
                            {msg.blockedReason || msg.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <FormattedContent content={msg.content} onPromptClick={handleSend} />
                    )}

                    {/* Table of query results if available */}
                    {msg.data && msg.data.length > 0 && (
                      <div className="rounded-xl border border-surface-border bg-surface-darkest overflow-hidden">
                        <div className="px-3 py-1.5 bg-surface-card border-b border-surface-border flex items-center justify-between text-[10px] text-slate-400">
                          <span>Institutional Records ({msg.data.length})</span>
                          {msg.executionTimeMs && <span>{msg.executionTimeMs}ms</span>}
                        </div>
                        <div className="max-h-52 overflow-x-auto overflow-y-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-surface-card/60 text-slate-400 border-b border-surface-border font-medium">
                              <tr>
                                {Object.keys(msg.data[0]).map((key) => (
                                  <th key={key} className="px-3 py-1.5 font-medium text-[10px]">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                              {msg.data.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-surface-hover/50">
                                  {Object.values(row).map((val: any, cIdx) => (
                                    <td key={cIdx} className="px-3 py-1.5 text-slate-300 truncate max-w-[150px]">
                                      {val !== null && val !== undefined ? String(val) : '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Action Preview Card (Human-in-the-Loop) */}
                    {msg.actionPreview && msg.actionPreview.items.length > 0 && (
                      <div className="rounded-xl border border-brand-500/30 bg-brand-950/20 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                            <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                            Action Draft &bull; {msg.actionPreview.items.length} WhatsApp Messages
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800/40">
                            Requires Authorization
                          </span>
                        </div>

                        <div className="space-y-2">
                          {msg.actionPreview.items.map((item, aIdx) => {
                            const isApproved = approvedActionIds[`${msg.id}_${item.recipientPhone}`];
                            return (
                              <div
                                key={aIdx}
                                className="p-3 rounded-xl bg-surface-darkest border border-surface-border text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between font-medium text-slate-200">
                                  <span>{item.recipientName} ({item.recipientPhone})</span>
                                  {isApproved ? (
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                                      <CheckCircle className="w-3 h-3" /> Dispatched
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium">Pending Review</span>
                                  )}
                                </div>
                                <div className="p-2.5 rounded-lg bg-surface-card border border-surface-border text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {item.messageText}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Reason: {item.reason}
                                </div>

                                {!isApproved && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      onClick={() => handleApproveAction(msg.id, item)}
                                      className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-subtle"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Authorize & Send
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Collapsible Verified SQL Query */}
                    {msg.sql && (
                      <div className="rounded-xl border border-surface-border bg-surface-darkest overflow-hidden">
                        <button
                          onClick={() => setExpandedSqlId(expandedSqlId === msg.id ? null : msg.id)}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 hover:bg-surface-hover transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <Database className="w-3.5 h-3.5 text-brand-400" />
                            Audited Read-Only Query
                          </span>
                          {expandedSqlId === msg.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {expandedSqlId === msg.id && (
                          <div className="p-3 bg-black/40 border-t border-surface-border font-mono text-[11px] text-brand-200 overflow-x-auto whitespace-pre">
                            {msg.sql}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                      <span>InstiPilot Core Security: Read-Only Access</span>
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="p-4 rounded-2xl border border-surface-border bg-surface-card space-y-2 animate-pulse shadow-subtle">
              <div className="flex items-center gap-2 text-xs text-brand-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
                Reviewing institutional data and permissions...
              </div>
              <div className="h-3 bg-surface-hover rounded w-3/4"></div>
              <div className="h-3 bg-surface-hover rounded w-1/2"></div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-surface-border bg-surface-card/60 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask assistant as ${currentUser.role}...`}
              className="flex-1 bg-surface-darkest border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 transition-all shadow-subtle"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Press Esc to close</span>
            <span>Zero Mutation Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
}
