import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { ROLE_PERMISSIONS, UserRole } from '@/lib/rbac/permissions';
import { validateSqlQuery, executeSafeQuery } from '@/lib/rbac/query-guard';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────
// Mock LLM Responses (works without Gemini API)
// ─────────────────────────────────────────────
const MOCK_RESPONSES: { pattern: RegExp; response: any }[] = [
  {
    pattern: /java.*miss.*class|miss.*class.*java|miss.*3.*class|3.*miss/i,
    response: {
      sql: `SELECT s.id, s.name, s.phone, b.name as batch_name,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as missed_classes,
  e.due_date as emi_due_date, e.amount as emi_amount
FROM students s
JOIN enrollments en ON en.student_id = s.id
JOIN batches b ON b.id = en.batch_id
JOIN attendance a ON a.student_id = s.id AND a.batch_id = b.id
JOIN emi_installments e ON e.student_id = s.id AND e.status = 'pending'
WHERE b.id = 'b_java_m1'
GROUP BY s.id
HAVING missed_classes >= 3
ORDER BY missed_classes DESC`,
      explanation: `🎯 Found 2 high-risk students in the Java Fullstack Morning batch with ≥3 missed classes AND a pending EMI due this week:\n\n• **Rohan Gupta** — Missed 5 classes! EMI of ₹11,667 due Oct 19\n• **Ananya Deshmukh** — Missed 3 classes. EMI of ₹11,667 due Oct 18\n\nBoth students are at immediate dropout risk. WhatsApp reminder drafts are ready for approval below.`,
      action: {
        type: 'whatsapp_draft',
        items: [
          {
            studentId: 's_003',
            recipientName: 'Rohan Gupta',
            recipientPhone: '+91 9820033333',
            messageText: 'Hi Rohan 👋, InstiPilot Academy here.\n\nWe noticed you\'ve missed 5 recent classes in the Java Fullstack batch. Your trainer Vikram sir is available to help you catch up with recorded sessions.\n\nAlso, your course EMI of ₹11,667 is due on Oct 19th. Please settle via UPI or contact our accounts team.\n\nWe\'re here to support your journey! 🙏',
            reason: '5 missed classes in Java batch + EMI due Oct 19'
          },
          {
            studentId: 's_007',
            recipientName: 'Ananya Deshmukh',
            recipientPhone: '+91 9820077777',
            messageText: 'Hi Ananya 👋, InstiPilot Academy here.\n\nYou\'ve missed 3 recent Java Fullstack sessions. Lecture recordings are available on the portal — do check them out!\n\nReminder: Your installment of ₹11,667 is due tomorrow (Oct 18). Please clear via UPI/Bank transfer.\n\nReach out if you need academic support! 🚀',
            reason: '3 missed classes in Java batch + EMI due Oct 18'
          }
        ]
      }
    }
  },
  {
    pattern: /overdue|missed.*emi|consecutive.*emi|emi.*overdue/i,
    response: {
      sql: `SELECT s.id, s.name, s.phone, COUNT(e.id) as overdue_count, SUM(e.amount) as total_overdue
FROM students s
JOIN emi_installments e ON e.student_id = s.id
WHERE e.status = 'overdue'
GROUP BY s.id
HAVING overdue_count >= 1
ORDER BY overdue_count DESC, total_overdue DESC`,
      explanation: `💳 Found students with overdue installments:\n\n• **Amit Patel** — 2 CONSECUTIVE missed EMIs! Total overdue: ₹23,334.\n\nSeveral students in the AI/ML and MERN batches have 1 overdue EMI each. A bulk reminder batch has been drafted below.`,
      action: {
        type: 'whatsapp_draft',
        items: [
          {
            studentId: 's_012',
            recipientName: 'Amit Patel',
            recipientPhone: '+91 9820044444',
            messageText: 'Dear Amit, this is a formal notice from InstiPilot Academy Accounts.\n\nTwo consecutive course installments totalling ₹23,334 remain overdue. Please contact our accounts office today.\n\nWe\'re happy to discuss a flexible arrangement. 🙏',
            reason: '2 consecutive overdue EMIs — ₹23,334 total'
          }
        ]
      }
    }
  },
  {
    pattern: /risk|dropout|at.?risk|drop.*out/i,
    response: {
      sql: `SELECT s.id, s.name, s.phone, b.name as batch_name,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as missed_classes,
  COUNT(CASE WHEN e.status = 'overdue' THEN 1 END) as overdue_emis
FROM students s
JOIN enrollments en ON en.student_id = s.id
JOIN batches b ON b.id = en.batch_id
LEFT JOIN attendance a ON a.student_id = s.id AND a.batch_id = b.id
LEFT JOIN emi_installments e ON e.student_id = s.id
GROUP BY s.id
ORDER BY missed_classes DESC
LIMIT 5`,
      explanation: `🚨 **Top 5 Dropout-Risk Students** (Multi-factor Analysis):\n\n1. **Amit Patel** — 2 overdue EMIs + 5 absences\n2. **Sneha Verma** — 4 missed AI labs + overdue fee\n3. **Siddharth Kulkarni** — 6 Java absences\n4. **Kavita Nair** — 5 consecutive MERN absences\n5. **Rohan Gupta** — 5 absences + EMI due in 3 days\n\n**Recommended Action:** Initiate counselor outreach for all 5 within 24 hours.`,
      action: null
    }
  },
  {
    pattern: /trainer.*schedule|double.?book|clash|vikram/i,
    response: {
      sql: `SELECT t.name as trainer_name, b.name as batch_name, ts.day_of_week, ts.start_time, ts.end_time, r.name as room_name
FROM timetable_slots ts
JOIN trainers t ON t.id = ts.trainer_id
JOIN batches b ON b.id = ts.batch_id
LEFT JOIN rooms r ON r.id = ts.room_id
WHERE ts.trainer_id = 't_vikram'
ORDER BY ts.day_of_week, ts.start_time`,
      explanation: `⚠️ **Trainer Near Double-Booking Alert — Vikram Malhotra:**\n\nVikram is currently assigned to **3 batches on Mon/Wed/Fri**. The buffer between batch 1 and batch 2 is only **15 minutes** — insufficient for equipment reset.\n\nRecommend using the Timetable Re-planner to shift one batch to Room 202.`,
      action: null
    }
  },
  {
    pattern: /fee.*detail|show.*fee|payment.*detail|emi.*detail/i,
    response: {
      sql: null,
      explanation: null,
      blocked: true,
      blockedReason: `🛡️ **Access Blocked by InstiPilot RBAC Policy**\n\nYour current role does not have authorization to query financial tables (fee_plans, emi_installments, payments).\n\nTo access fee data, please switch to the **Accounts** or **Owner** role.`
    }
  },
  {
    pattern: /attendance.*summary|summary.*attendance|today.*class|class.*today/i,
    response: {
      sql: `SELECT b.name as batch_name, 
  COUNT(a.id) as total_sessions,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
FROM attendance a
JOIN batches b ON b.id = a.batch_id
GROUP BY b.id
ORDER BY present ASC`,
      explanation: `📊 **Attendance Summary Across All Active Batches:**\n\nAll batches are tracked with biometric + Zoom dual-verification. Current overall attendance rate is **89.2%**.\n\nFull breakdown is shown in the result table above.`,
      action: null
    }
  }
];

// ─────────────────────────────────────────────
// Supabase-based student lookup
// ─────────────────────────────────────────────
async function findStudentByQuery(question: string): Promise<{ type: 'single' | 'multiple'; student?: any; students?: any[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabase();
  if (!client) return null;

  const { data: allStudents } = await client.from('students').select('id, name, phone, email');
  if (!allStudents) return null;

  const qLower = question.toLowerCase().trim();

  // 1. Direct ID match
  const idMatch = qLower.match(/\b(s_\d{3,4})\b/i);
  if (idMatch) {
    const student = allStudents.find(s => s.id.toLowerCase() === idMatch[1].toLowerCase());
    if (student) return { type: 'single', student };
  }

  // 2. Phone number match
  const digits = question.replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    const phoneStudent = allStudents.find(s => (s.phone || '').replace(/[^0-9]/g, '').includes(digits));
    if (phoneStudent) return { type: 'single', student: phoneStudent };
  }

  // 3. Full name match
  const exactMatches = allStudents.filter(s => qLower.includes(s.name.toLowerCase()));
  if (exactMatches.length === 1) return { type: 'single', student: exactMatches[0] };
  if (exactMatches.length > 1) return { type: 'multiple', students: exactMatches };

  // 4. First/last name token match
  const commonWords = new Set(['show', 'tell', 'give', 'find', 'what', 'who', 'about', 'details', 'student', 'the', 'all', 'for', 'any', 'please', 'with', 'from', 'info', 'batch', 'course', 'class', 'attendance', 'fee', 'emi', 'status', 'record', 'me', 'is', 'a', 'in', 'of', 'and', 'or', 'to']);
  const words = qLower.split(/[^a-zA-Z0-9]+/).filter(w => w.length >= 3 && !commonWords.has(w));

  const candidateMap = new Map<string, any>();
  for (const s of allStudents) {
    const parts = s.name.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (parts.includes(w)) {
        candidateMap.set(s.id, s);
      }
    }
  }

  const candidateList = Array.from(candidateMap.values());
  if (candidateList.length === 1) return { type: 'single', student: candidateList[0] };
  if (candidateList.length > 1) return { type: 'multiple', students: candidateList };

  return null;
}

async function buildStudentResponse(student: any, role: UserRole) {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabase();
  if (!client) return null;

  const sId = student.id;

  const [enrRes, attRes, emiRes] = await Promise.all([
    client.from('enrollments').select(`
      batch_id,
      batches ( id, name, days, start_time, end_time, mode,
        courses ( name, code, duration_weeks, total_fee ),
        trainers ( name, phone ),
        rooms ( name )
      )
    `).eq('student_id', sId).limit(1).maybeSingle(),
    client.from('attendance').select('status').eq('student_id', sId),
    role !== 'trainer' ? client.from('emi_installments').select('installment_no, amount, due_date, status').eq('student_id', sId).order('installment_no') : Promise.resolve({ data: [] })
  ]);

  const enr: any = enrRes.data;
  const batch = Array.isArray(enr?.batches) ? enr?.batches[0] : enr?.batches;
  const course = Array.isArray(batch?.courses) ? batch?.courses[0] : batch?.courses;
  const trainer = Array.isArray(batch?.trainers) ? batch?.trainers[0] : batch?.trainers;
  const room = Array.isArray(batch?.rooms) ? batch?.rooms[0] : batch?.rooms;

  const attList = attRes.data || [];
  const totalSessions = attList.length;
  const presentSessions = attList.filter((a: any) => a.status === 'present').length;
  const absentSessions = attList.filter((a: any) => a.status === 'absent').length;
  const attPct = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

  const emis: any[] = emiRes?.data || [];
  const overdueEmis = emis.filter(e => e.status === 'overdue');
  const overdueEmi = overdueEmis.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

  let feeSection = '';
  if (role !== 'trainer') {
    const emiListText = emis.map(e => `  • Installment #${e.installment_no}: ₹${e.amount?.toLocaleString('en-IN')} (Due: ${e.due_date}) — **${e.status.toUpperCase()}**`).join('\n');
    feeSection = `\n\n💳 **Fee & EMI Breakdown**:\n• Overdue Amount: **${overdueEmi > 0 ? `🚨 ₹${overdueEmi.toLocaleString('en-IN')}` : 'None (₹0)'}**\n\n**Installment Schedule**:\n${emiListText || '  • No installments configured'}`;
  } else {
    feeSection = `\n\n🛡️ **Financial Data Hidden**\n*Financial ledger & EMI balances are hidden for Trainer session per RBAC policy.*`;
  }

  let riskBadge = '🟢 Low Risk';
  if (absentSessions >= 4 || overdueEmi > 0) riskBadge = '🔴 High Dropout Risk';
  else if (absentSessions >= 2) riskBadge = '🟡 Moderate Warning';

  let action = null;
  if (absentSessions >= 2 || overdueEmi > 0) {
    action = {
      type: 'whatsapp_draft',
      items: [{
        studentId: sId,
        recipientName: student.name,
        recipientPhone: student.phone,
        messageText: `Hi ${student.name.split(' ')[0]} 👋, InstiPilot Academic Office here.\n\nWe noticed you've missed ${absentSessions} classes.${overdueEmi > 0 ? ` Also, your pending course fee of ₹${overdueEmi.toLocaleString('en-IN')} is overdue.` : ''}\n\nPlease reach out if you need any support! 🚀`,
        reason: `${absentSessions} missed classes${overdueEmi > 0 ? ` + ₹${overdueEmi.toLocaleString('en-IN')} overdue` : ''}`
      }]
    };
  }

  const explanation = `### 🧑‍🎓 Student Dossier: **${student.name}** [${riskBadge}]
**ID**: \`${sId}\` | **Contact**: ${student.phone} | ${student.email}

---

📚 **Academic Enrollment**:
• **Course**: ${course?.name || 'N/A'} (\`${course?.code || 'N/A'}\`)
• **Batch**: **${batch?.name || 'N/A'}** | **Faculty**: ${trainer?.name || 'N/A'}
• **Timings**: \`${batch?.days || 'N/A'}\` at \`${batch?.start_time || 'N/A'} - ${batch?.end_time || 'N/A'}\`
• **Room**: ${room?.name || 'N/A'}

---

📊 **Attendance**: **${attPct}%** (${presentSessions} Present, **${absentSessions} Absent** / ${totalSessions} total)${feeSection}

---

⚡ **Quick Actions**:
• 📄 **[Download Certificate PDF](/api/certificates/generate?studentId=${sId})**
• 💬 **Retention Action**: ${action ? 'WhatsApp follow-up draft created for approval in Outbox.' : 'Student standing is in good order.'}`;

  const sql = `SELECT s.id, s.name, s.phone, s.email, s.status, b.name as batch_name, c.name as course_name
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
WHERE s.id = '${sId}'`;

  return { sql, explanation, action };
}

async function buildMultipleStudentsResponse(students: any[]) {
  const summaryRows = students.slice(0, 8).map(s =>
    `• **${s.name}** (\`${s.id}\`) — ${s.phone}`
  ).join('\n');

  const studentIds = students.slice(0, 8).map(s => `'${s.id}'`).join(',');
  const sql = `SELECT s.id, s.name, s.phone, s.email
FROM students s
WHERE s.id IN (${studentIds})
LIMIT 10`;

  return {
    sql,
    explanation: `### 🔍 Multiple Students Matched (${students.length} found)\n\nPlease specify which student:\n\n${summaryRows}\n\n---\n*Tip: Use exact full name or ID (e.g. \`s_001\`) for full details.*`,
    action: null
  };
}

function getMockResponse(question: string, role: UserRole) {
  if (role === 'trainer' && /fee|emi|payment|amount|installment/i.test(question)) {
    return {
      sql: null,
      explanation: null,
      blocked: true,
      blockedReason: `🛡️ **RBAC Policy Block — Trainer Role**\n\nFinancial tables are never accessible to Trainer sessions per InstiPilot Zero-Trust RBAC design.`
    };
  }

  for (const mock of MOCK_RESPONSES) {
    if (mock.pattern.test(question)) {
      return mock.response;
    }
  }

  return {
    sql: `SELECT s.name, s.phone, s.status, s.join_date, b.name as batch_name
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
WHERE s.status = 'active'
ORDER BY s.join_date DESC
LIMIT 10`,
    explanation: `I analyzed your question and fetched the 10 most recently enrolled active students. For more specific queries, try typing a student's name, batch name, or ask about attendance/EMI status.`,
    action: null
  };
}

async function callGeminiAPI(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  throw new Error('Could not parse JSON from LLM response');
}

function buildRoleAwarePrompt(question: string, role: UserRole): string {
  const config = ROLE_PERMISSIONS[role];
  const allowedTables = config.allowedTables;

  const SCHEMA_MAP: Record<string, string> = {
    users: `users(id, name, email, role)`,
    students: `students(id, name, email, phone, guardian_name, guardian_phone, city, college, join_date, status)`,
    courses: `courses(id, code, name, description, duration_weeks, total_fee)`,
    batches: `batches(id, course_id, trainer_id, room_id, name, days, start_time, end_time, mode, status)`,
    trainers: `trainers(id, user_id, name, email, phone, specializations)`,
    rooms: `rooms(id, name, capacity, type)`,
    enrollments: `enrollments(id, student_id, batch_id, preferred_mode, status)`,
    fee_plans: `fee_plans(id, student_id, course_id, total_amount, down_payment, num_installments)`,
    emi_installments: `emi_installments(id, fee_plan_id, student_id, installment_no, due_date, amount, status)`,
    payments: `payments(id, emi_id, student_id, source, reference, amount, date, status)`,
    attendance: `attendance(id, student_id, batch_id, date, mode, status)`,
    recordings: `recordings(id, batch_id, title, url, date, duration_minutes, topic_tags)`,
    timetable_slots: `timetable_slots(id, batch_id, trainer_id, room_id, day_of_week, start_time, end_time)`,
    messages_outbox: `messages_outbox(id, student_id, recipient_phone, recipient_name, message_text, status)`,
    audit_log: `audit_log(id, user_id, user_name, role, action, query, result_summary, status)`
  };

  const roleSchema = allowedTables
    .filter(t => SCHEMA_MAP[t])
    .map(t => SCHEMA_MAP[t])
    .join('\n');

  return `You are InstiPilot AI Copilot — a read-only SQL analytics assistant for an Indian training institute. 

ROLE: ${role} (${config.displayName})
FORBIDDEN TABLES: ${config.forbiddenTables.join(', ') || 'none'}

ALLOWED DATABASE SCHEMA:
${roleSchema}

RULES:
1. Generate ONLY a single SELECT statement. No INSERT/UPDATE/DELETE/DROP/ALTER.
2. No SQL comments (-- or /* */).
3. Only use tables from the allowed schema above.
4. Always include a LIMIT clause (max 50 rows).

QUESTION: ${question}

Return ONLY valid JSON:
{
  "sql": "SELECT ... LIMIT 50",
  "explanation": "Plain English summary (2-4 sentences, use markdown)",
  "action": null
}`;
}

// ─────────────────────────────────────────────
// Main Copilot Route Handler
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const { question } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    const useMock = process.env.MOCK_LLM === 'true' || !process.env.GEMINI_API_KEY;
    let llmResponse: any;

    // Enforce student isolation
    if (user.role === 'student') {
      const studentId = user.studentId || 's_001';
      const studentMatch = await findStudentByQuery(question);
      if (studentMatch) {
        const targetStudent = studentMatch.type === 'single' ? studentMatch.student : studentMatch.students?.[0];
        if (targetStudent && targetStudent.id !== studentId) {
          return NextResponse.json({
            blocked: true,
            blockedReason: `🛡️ **Access Denied**\n\nAs a student, you can only view your own records.`,
            explanation: `🛡️ **Access Denied**\n\nAs a student, you can only view your own records.`
          });
        }
      }

      // Build student's own dossier
      if (isSupabaseConfigured()) {
        const client = getSupabase();
        if (client) {
          const { data: meStudent } = await client.from('students').select('id, name, phone, email').eq('id', studentId).single();
          if (meStudent) {
            llmResponse = await buildStudentResponse(meStudent, 'student');
          }
        }
      }
    } else {
      const studentMatch = await findStudentByQuery(question);
      if (studentMatch) {
        if (studentMatch.type === 'single' && studentMatch.student) {
          llmResponse = await buildStudentResponse(studentMatch.student, user.role);
        } else if (studentMatch.type === 'multiple' && studentMatch.students) {
          llmResponse = await buildMultipleStudentsResponse(studentMatch.students);
        }
      }
    }

    if (!llmResponse) {
      if (useMock) {
        llmResponse = getMockResponse(question, user.role);
      } else {
        try {
          const prompt = buildRoleAwarePrompt(question, user.role);
          llmResponse = await callGeminiAPI(prompt);
        } catch (apiError) {
          console.warn('Gemini API error, falling back to mock:', apiError);
          llmResponse = getMockResponse(question, user.role);
        }
      }
    }

    if (llmResponse?.blocked) {
      // Log blocked attempt to Supabase
      if (isSupabaseConfigured()) {
        await upsertToSupabase('audit_log', {
          id: `aud_blk_${Date.now()}`,
          user_id: user.id,
          user_name: user.name,
          role: user.role,
          action: 'copilot_blocked',
          query: question,
          result_summary: llmResponse.blockedReason || 'Role-based access denied',
          status: 'blocked'
        }).catch(() => {});
      }

      return NextResponse.json({
        blocked: true,
        blockedReason: llmResponse.blockedReason,
        explanation: llmResponse.blockedReason
      });
    }

    // Validate and execute the SQL
    const sqlResult = llmResponse?.sql
      ? await executeSafeQuery(llmResponse.sql, user, question)
      : null;

    if (sqlResult?.blocked) {
      return NextResponse.json({
        blocked: true,
        blockedReason: sqlResult.blockedReason,
        explanation: sqlResult.blockedReason
      });
    }

    // Save draft messages to outbox if action present
    if (llmResponse?.action?.items?.length > 0 && isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        for (const item of llmResponse.action.items) {
          const { data: existingDraft } = await client
            .from('messages_outbox')
            .select('id')
            .eq('student_id', item.studentId)
            .eq('status', 'draft')
            .limit(1);

          if (!existingDraft || existingDraft.length === 0) {
            await upsertToSupabase('messages_outbox', {
              id: `msg_ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              student_id: item.studentId,
              recipient_phone: item.recipientPhone,
              recipient_name: item.recipientName,
              channel: 'whatsapp',
              message_text: item.messageText,
              draft_reason: item.reason,
              status: 'draft',
              created_by_role: user.role
            }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({
      sql: sqlResult?.executedSql || llmResponse?.sql,
      explanation: llmResponse?.explanation,
      data: sqlResult?.data || [],
      rowCount: sqlResult?.rowCount || 0,
      actionPreview: llmResponse?.action,
      executionTimeMs: sqlResult?.executionTimeMs,
      usedMock: useMock
    });

  } catch (err: any) {
    console.error('Copilot error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
