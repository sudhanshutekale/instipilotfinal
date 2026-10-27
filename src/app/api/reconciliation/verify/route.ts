import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();

    // STRICT OWNER CHECK: Only the Director/Owner can verify student photo proofs
    if (user.role !== 'owner') {
      return NextResponse.json(
        { 
          error: 'Forbidden: Only the Institute Director / Owner is authorized to verify and approve student payment proofs.' 
        }, 
        { status: 403 }
      );
    }

    const body = await req.json();
    const { proofId } = body;

    if (!proofId) {
      return NextResponse.json({ error: 'Missing proofId' }, { status: 400 });
    }

    let proof: any = null;

    // Fetch proof from Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        const { data } = await client
          .from('payment_proofs')
          .select(`
            *,
            students ( id, name, email ),
            emi_installments ( id, installment_no )
          `)
          .eq('id', proofId)
          .single();

        if (data) {
          proof = {
            ...data,
            student_name: data.students?.name,
            student_email: data.students?.email,
            installment_no: data.emi_installments?.installment_no
          };
        }
      }
    }

    if (!proof) {
      return NextResponse.json({ error: 'Payment proof not found' }, { status: 404 });
    }

    if (proof.status === 'verified') {
      return NextResponse.json({ error: 'This payment proof has already been verified by the Owner.' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const paymentId = `pay_verified_${Date.now()}`;

    // Persist to Supabase Cloud
    if (isSupabaseConfigured()) {
      await upsertToSupabase('payment_proofs', {
        id: proof.id,
        status: 'verified',
        verified_by: user.id || 'u_owner',
        verified_at: nowIso,
        rejection_reason: null
      });

      await upsertToSupabase('emi_installments', {
        id: proof.emi_id,
        status: 'paid',
        paid_date: today
      });

      await upsertToSupabase('payments', {
        id: paymentId,
        emi_id: proof.emi_id,
        student_id: proof.student_id,
        source: proof.payment_mode || 'upi',
        reference: proof.reference,
        amount: proof.amount,
        date: today,
        notes: `Owner verified photo proof (UTR: ${proof.reference})`,
        status: 'verified'
      });

      await upsertToSupabase('audit_log', {
        id: `aud_${Date.now()}`,
        user_id: user.id || 'u_owner',
        user_name: user.name || 'Owner',
        role: 'owner',
        action: 'OWNER_VERIFIED_PAYMENT_PROOF',
        result_summary: `Owner verified photo proof for ${proof.student_name} (Installment #${proof.installment_no}, ₹${proof.amount?.toLocaleString('en-IN')}, UTR: ${proof.reference})`,
        status: 'success'
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payment proof for ${proof.student_name} (₹${proof.amount?.toLocaleString('en-IN')}) successfully verified and settled by Owner!`,
      proofId: proof.id
    });
  } catch (error: any) {
    console.error('Error verifying payment proof:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
