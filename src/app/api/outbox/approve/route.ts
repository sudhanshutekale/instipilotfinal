import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (user.role === 'trainer') {
      return NextResponse.json({ error: 'Trainers cannot dispatch outbox messages.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, studentId, recipientPhone, recipientName, messageText, draftReason, channel } = body;

    let msgId = id || `msg_${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Persist to Supabase Cloud
    if (isSupabaseConfigured()) {
      if (id) {
        await upsertToSupabase('messages_outbox', {
          id,
          status: 'approved',
          approved_by: user.id || 'u_owner',
          approved_at: nowIso
        });
      } else {
        await upsertToSupabase('messages_outbox', {
          id: msgId,
          student_id: studentId || null,
          recipient_phone: recipientPhone,
          recipient_name: recipientName || 'Student',
          channel: channel || 'whatsapp',
          message_text: messageText,
          draft_reason: draftReason || 'Approved via Copilot or Dashboard',
          status: 'approved',
          created_by_role: user.role,
          approved_by: user.id || 'u_owner',
          approved_at: nowIso
        });
      }

      await upsertToSupabase('audit_log', {
        id: `aud_approve_${Date.now()}`,
        user_id: user.id || 'u_owner',
        user_name: user.name || 'Staff',
        role: user.role || 'counselor',
        action: 'action_approved',
        query: `Approved WhatsApp message to ${recipientName || 'Student'} (${recipientPhone || 'N/A'})`,
        result_summary: `Message: ${(messageText || 'Outbox message approved').slice(0, 80)}...`,
        status: 'success'
      });
    }

    return NextResponse.json({ success: true, msgId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (user.role === 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        const { data, error } = await client
          .from('messages_outbox')
          .select(`
            *,
            students ( name )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          const messages = data.map((o: any) => ({
            ...o,
            student_name_linked: o.students?.name || null
          }));
          return NextResponse.json({ messages });
        }
      }
    }

    return NextResponse.json({ messages: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
