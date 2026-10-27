import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Only student role (or owner simulating) can upload payment proof
    if (user.role !== 'student' && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Payment photo proof upload is restricted to students only.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentId, emiId, amount, reference, proofImageUrl, paymentMode, notes } = body;

    if (!studentId || !emiId || !amount || !reference || !proofImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, emiId, amount, reference, and proof photo are required.' },
        { status: 400 }
      );
    }

    // Security check: Student can only upload proof for their own studentId
    if (user.role === 'student' && user.studentId && user.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only upload payment proofs for your own student record.' },
        { status: 403 }
      );
    }

    const proofId = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Persist to Supabase Cloud
    if (isSupabaseConfigured()) {
      await upsertToSupabase('payment_proofs', {
        id: proofId,
        student_id: studentId,
        emi_id: emiId,
        amount: Number(amount),
        reference,
        proof_image_url: proofImageUrl,
        payment_mode: paymentMode || 'upi',
        notes: notes || '',
        status: 'pending'
      });

      await upsertToSupabase('audit_log', {
        id: `aud_${Date.now()}`,
        user_id: user.id || studentId,
        user_name: user.name || 'Student',
        role: user.role || 'student',
        action: 'STUDENT_UPLOAD_PAYMENT_PROOF',
        result_summary: `Student uploaded payment photo proof for Installment ${emiId} (₹${Number(amount)?.toLocaleString('en-IN')}, UTR: ${reference})`,
        status: 'success'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment proof photo submitted successfully. Awaiting Director/Owner verification in the Fee Reconciliation Engine.',
      proofId
    });
  } catch (error: any) {
    console.error('Error submitting payment proof:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
