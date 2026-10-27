import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (user.role === 'accounts') {
      return NextResponse.json(
        { error: 'Forbidden: Accounts role is restricted from viewing detailed biometric and join logs.' },
        { status: 403 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const searchParams = req.nextUrl.searchParams;
    const batchId = searchParams.get('batchId') || 'b_java_m1';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const studentId = user.role === 'student' ? (user.studentId || 's_001') : null;

    const { data: batches } = await client.from('batches').select('id, name, mode').order('name');

    let enrollQuery = client
      .from('enrollments')
      .select(`
        preferred_mode,
        student_id,
        students ( id, name, phone )
      `)
      .eq('batch_id', batchId);

    if (studentId) {
      enrollQuery = enrollQuery.eq('student_id', studentId);
    }

    const { data: enrollments } = await enrollQuery;

    let attQuery = client
      .from('attendance')
      .select('id, student_id, mode, check_in_time, status, ip_or_location')
      .eq('batch_id', batchId)
      .eq('date', date);

    if (studentId) {
      attQuery = attQuery.eq('student_id', studentId);
    }

    const { data: attRecords } = await attQuery;

    const attMap = new Map();
    (attRecords || []).forEach((a: any) => {
      attMap.set(a.student_id, a);
    });

    const rows = (enrollments || []).map((en: any) => {
      const st = en.students || {};
      const att = attMap.get(st.id);
      return {
        student_id: st.id,
        student_name: st.name,
        student_phone: st.phone,
        preferred_mode: en.preferred_mode,
        attendance_id: att?.id || null,
        checkin_mode: att?.mode || null,
        check_in_time: att?.check_in_time || null,
        attendance_status: att?.status || null,
        ip_or_location: att?.ip_or_location || null
      };
    });

    return NextResponse.json({
      rows,
      batches: batches || [],
      selectedBatchId: batchId,
      selectedDate: date
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role === 'accounts' || user.role === 'student') {
      return NextResponse.json({ error: 'Forbidden: Attendance mark or override is restricted to academic staff.' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { studentId, batchId, date, status, mode } = body;

    if (!studentId || !batchId || !date || !status) {
      return NextResponse.json({ error: 'Missing required attendance fields' }, { status: 400 });
    }

    const checkInTime = status === 'absent' ? null : new Date().toLocaleTimeString('en-US', { hour12: false });
    const ipLocation = mode === 'online' ? 'Zoom WebSDK (IP: 49.36.12.8)' : 'Room Biometric Console 01';
    const attId = `att_${Date.now()}`;

    await upsertToSupabase('attendance', {
      id: attId,
      student_id: studentId,
      batch_id: batchId,
      date,
      mode: mode || 'classroom',
      check_in_time: checkInTime,
      status,
      ip_or_location: ipLocation
    });

    return NextResponse.json({ success: true, status, checkInTime });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
