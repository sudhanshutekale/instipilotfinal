import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    if (user.role === 'student' || user.role === 'trainer' || user.role === 'counselor') {
      return NextResponse.json({ error: 'Forbidden: Access restricted to Owner and Finance team' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const { data, error } = await client
      .from('payment_proofs')
      .select(`
        *,
        students ( id, name, email, phone, college ),
        emi_installments (
          id, installment_no, due_date, status,
          fee_plans (
            courses ( name )
          )
        ),
        users!payment_proofs_verified_by_fkey ( name )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const proofs = (data || []).map((p: any) => ({
      id: p.id,
      student_id: p.student_id,
      emi_id: p.emi_id,
      amount: p.amount,
      reference: p.reference,
      proof_image_url: p.proof_image_url,
      payment_mode: p.payment_mode,
      notes: p.notes,
      status: p.status,
      rejection_reason: p.rejection_reason,
      verified_by: p.verified_by,
      verified_at: p.verified_at,
      created_at: p.created_at,
      student_name: p.students?.name,
      student_email: p.students?.email,
      student_phone: p.students?.phone,
      student_college: p.students?.college,
      installment_no: p.emi_installments?.installment_no,
      emi_due_date: p.emi_installments?.due_date,
      emi_status: p.emi_installments?.status,
      course_name: p.emi_installments?.fee_plans?.courses?.name || '',
      verified_by_name: p.users?.name || null
    }));

    const pendingCount = proofs.filter(p => p.status === 'pending').length;
    const verifiedCount = proofs.filter(p => p.status === 'verified').length;
    const rejectedCount = proofs.filter(p => p.status === 'rejected').length;

    return NextResponse.json({
      proofs,
      stats: {
        total: proofs.length,
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount
      },
      currentRole: user.role
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
