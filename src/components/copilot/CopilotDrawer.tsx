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
    <div className="text-xs text-slate-700 leading-relaxed space-y-1.5">
      {lines.map((line, idx) => {
        if (line.trim() === '---') {
          return <hr key={idx} className="border-slate-200 my-2.5" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-display font-semibold text-sm text-slate-900 pt-1">
              {formatInline(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-display font-bold text-sm text-slate-900 pt-1">
              {formatInline(line.slice(3))}
            </h3>
          );
        }
        if (line.includes('👉 *Ask:')) {
          const match = line.match(/👉 \*Ask: "(.*?)"\*/);
          if (match && onPromptClick) {
            return (
              <div key={idx} className="pl-1 py-1">
                <button
                  type="button"
                  onClick={() => onPromptClick(match[1])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all text-xs font-medium shadow-xs active:scale-95 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
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
          <div key={idx} className={line.startsWith('• ') ? 'pl-2 text-slate-800' : ''}>
            {formatInline(line)}
          </div>
        );
      })}
    </div>
  );
}

function formatInline(text: string) {
  const parts: (string | React.ReactNode)[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-slate-900">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-slate-800">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-blue-700">{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export default function CopilotDrawer({ isOpen, onClose, currentUser }: CopilotDrawerProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);
  const [approvedActionIds, setApprovedActionIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const suggestedQuestions: Record<UserRole, string[]> = {
    owner: [
      'Show me total revenue collected vs pending EMIs across all cohorts',
      'Which students missed more than 3 consecutive sessions this week?',
      'Draft WhatsApp warning notifications for students with overdue fees'
    ],
    counselor: [
      'List all active batches and current student enrollment numbers',
      'Show students with attendance below 75% in Weekday Evening batch',
      'Find contact details and guardian info for student Rahul Sharma'
    ],
    trainer: [
      'Show student attendance breakdown for my React & Node.js cohort',
      'List students who were marked late or absent in yesterday session',
      'Show upcoming class schedules and topic syllabus milestones'
    ],
    accounts: [
      'Show all overdue installments and unpaid course fees breakdown',
      'List verified UPI and bank transfer transactions received this week',
      'Show payment reference details and due dates for pending EMIs'
    ],
    student: [
      'Show my attendance percentage and past session check-in logs',
      'When is my next fee installment due and what is the amount?',
      'Show upcoming class schedule and recorded video session links'
    ]
  };

  const handleSend = async (questionText?: string) => {
    const query = questionText || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          role: currentUser.role,
          studentId: currentUser.studentId
        })
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.reply || (data.blocked ? data.error : 'No response received.'),
        sql: data.sql,
        data: data.data,
        actionPreview: data.actionPreview,
        blocked: data.blocked,
        blockedReason: data.blocked ? data.error : undefined,
        executionTimeMs: data.executionTimeMs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: 'An error occurred while connecting to the assistant. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAction = async (messageId: string, item: any) => {
    try {
      await fetch('/api/outbox/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item })
      });
      setApprovedActionIds((prev) => ({
        ...prev,
        [`${messageId}_${item.recipientPhone}`]: true
      }));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-slate-900">Institute Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Institutional Records &bull; Action Authorization &bull; Academic Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-slate-900 text-base mb-1">
                How can we assist you today?
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                Query student profiles, batch attendance velocity, and fee receivables with verified institutional policy boundaries for <span className="text-blue-700 font-semibold capitalize">{currentUser.role}</span>.
              </p>

              {/* Suggested Questions */}
              <div className="w-full text-left">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  Recommended Operational Inquiries
                </div>
                <div className="space-y-2">
                  {suggestedQuestions[currentUser.role]?.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between group shadow-xs"
                    >
                      <span className="line-clamp-2">{q}</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-2 transition-colors" />
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
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-xs text-white shadow-sm">
                    <p className="leading-relaxed">{msg.content}</p>
                    <span className="text-[9px] text-blue-100 mt-1 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                ) : (
                  /* Assistant Message */
                  <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-800 space-y-3 shadow-xs">
                    {/* Blocked Alert or Success */}
                    {msg.blocked ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-rose-900">Restricted by Role Permissions</div>
                          <div className="text-[11px] text-rose-700 mt-0.5">
                            {msg.blockedReason || msg.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <FormattedContent content={msg.content} onPromptClick={handleSend} />
                    )}

                    {/* Table of query results if available */}
                    {msg.data && msg.data.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Institutional Records ({msg.data.length})</span>
                          {msg.executionTimeMs && <span>{msg.executionTimeMs}ms</span>}
                        </div>
                        <div className="max-h-52 overflow-x-auto overflow-y-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                              <tr>
                                {Object.keys(msg.data[0]).map((key) => (
                                  <th key={key} className="px-3 py-1.5 font-semibold text-[10px]">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {msg.data.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50">
                                  {Object.values(row).map((val: any, cIdx) => (
                                    <td key={cIdx} className="px-3 py-1.5 text-slate-700 truncate max-w-[150px]">
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

                    {/* Action Preview Card */}
                    {msg.actionPreview && msg.actionPreview.items.length > 0 && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            Action Draft &bull; {msg.actionPreview.items.length} WhatsApp Messages
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                            Requires Authorization
                          </span>
                        </div>

                        <div className="space-y-2">
                          {msg.actionPreview.items.map((item, aIdx) => {
                            const isApproved = approvedActionIds[`${msg.id}_${item.recipientPhone}`];
                            return (
                              <div
                                key={aIdx}
                                className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-xs"
                              >
                                <div className="flex items-center justify-between font-medium text-slate-900">
                                  <span>{item.recipientName} ({item.recipientPhone})</span>
                                  {isApproved ? (
                                    <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Dispatched
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-medium">Pending Review</span>
                                  )}
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {item.messageText}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Reason: {item.reason}
                                </div>

                                {!isApproved && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      onClick={() => handleApproveAction(msg.id, item)}
                                      className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-xs"
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

                    {/* Collapsible SQL Query */}
                    {msg.sql && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                        <button
                          onClick={() => setExpandedSqlId(expandedSqlId === msg.id ? null : msg.id)}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <Database className="w-3.5 h-3.5 text-blue-600" />
                            Audited Read-Only Query
                          </span>
                          {expandedSqlId === msg.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {expandedSqlId === msg.id && (
                          <div className="p-3 bg-white border-t border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto whitespace-pre">
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
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 animate-pulse shadow-xs">
              <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                Reviewing institutional data and permissions...
              </div>
              <div className="h-3 bg-slate-100 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-slate-200 bg-white">
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
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors shadow-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-all shadow-xs"
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
