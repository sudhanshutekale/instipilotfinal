import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (user.role === 'trainer' || user.role === 'counselor') {
      return NextResponse.json(
        { error: `Forbidden: Financial tables are blocked for ${user.role} role.` },
        { status: 403 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const studentId = user.role === 'student' ? (user.studentId || 's_001') : null;

    let overdueQuery = client
      .from('emi_installments')
      .select(`
        id, installment_no, due_date, amount, status,
        students ( id, name, phone ),
        fee_plans (
          courses ( name )
        )
      `)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true });

    let pendingQuery = client
      .from('emi_installments')
      .select(`
        id, installment_no, due_date, amount, status,
        students ( id, name, phone ),
        fee_plans (
          courses ( name )
        )
      `)
      .eq('status', 'pending')
      .order('due_date', { ascending: true });

    let paymentsQuery = client
      .from('payments')
      .select(`
        id, source, reference, amount, date, notes, status,
        students ( name, phone )
      `)
      .order('date', { ascending: false });

    if (studentId) {
      overdueQuery = overdueQuery.eq('student_id', studentId);
      pendingQuery = pendingQuery.eq('student_id', studentId);
      paymentsQuery = paymentsQuery.eq('student_id', studentId);
    } else {
      pendingQuery = pendingQuery.limit(30);
      paymentsQuery = paymentsQuery.limit(40);
    }

    const [overdueRes, pendingRes, paymentsRes, allPayments, allOverdue, allPending] = await Promise.all([
      overdueQuery,
      pendingQuery,
      paymentsQuery,
      client.from('payments').select('amount').eq('status', 'verified'),
      client.from('emi_installments').select('amount').eq('status', 'overdue'),
      client.from('emi_installments').select('amount').eq('status', 'pending')
    ]);

    const mapEmi = (e: any) => ({
      id: e.id,
      installment_no: e.installment_no,
      due_date: e.due_date,
      amount: e.amount,
      status: e.status,
      student_id: e.students?.id,
      student_name: e.students?.name,
      student_phone: e.students?.phone,
      batch_name: '',
      course_name: e.fee_plans?.courses?.name || ''
    });

    const mapPayment = (p: any) => ({
      id: p.id,
      source: p.source,
      reference: p.reference,
      amount: p.amount,
      date: p.date,
      notes: p.notes,
      status: p.status,
      student_name: p.students?.name,
      student_phone: p.students?.phone
    });

    const totalCollected = (allPayments.data || []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
    const totalOverdue = (allOverdue.data || []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
    const totalPending = (allPending.data || []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);

    return NextResponse.json({
      summary: { totalCollected, totalOverdue, totalPending },
      overdueEmis: (overdueRes.data || []).map(mapEmi),
      upcomingEmis: (pendingRes.data || []).map(mapEmi),
      recentPayments: (paymentsRes.data || []).map(mapPayment)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role === 'trainer' || user.role === 'counselor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { studentId, emiId, amount, source, reference, notes } = body;

    if (!studentId || !amount || !source || !reference) {
      return NextResponse.json({ error: 'Missing required payment details' }, { status: 400 });
    }

    const paymentId = `pay_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    await upsertToSupabase('payments', {
      id: paymentId,
      emi_id: emiId || null,
      student_id: studentId,
      source,
      reference,
      amount: Number(amount),
      date: today,
      notes: notes || 'Manual entry',
      status: 'verified'
    });

    if (emiId) {
      await upsertToSupabase('emi_installments', {
        id: emiId,
        status: 'paid',
        paid_date: today
      });
    }

    await upsertToSupabase('audit_log', {
      id: `aud_pay_${Date.now()}`,
      user_id: user.id || 'u_accounts',
      user_name: user.name || 'Accounts Manager',
      role: user.role || 'accounts',
      action: 'record_payment',
      query: `Recorded ₹${amount} (${source}) for student ${studentId}`,
      result_summary: `Reference: ${reference}`,
      status: 'success'
    });

    return NextResponse.json({ success: true, paymentId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
