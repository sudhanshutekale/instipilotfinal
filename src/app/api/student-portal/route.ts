import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const studentId = user.studentId || 's_001';

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const [
      stRes,
      enrRes,
      attRes,
      feeRes,
      emiRes,
      payRes,
      proofRes
    ] = await Promise.all([
      client.from('students').select('*').eq('id', studentId).single(),
      client.from('enrollments').select(`
        id, preferred_mode, enrolled_at, batch_id,
        batches (
          id, name, days, start_time, end_time, mode, start_date, end_date,
          courses ( id, code, name, duration_weeks, total_fee ),
          trainers ( name, email, phone ),
          rooms ( name, type )
        )
      `).eq('student_id', studentId).limit(1).maybeSingle(),
      client.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      client.from('fee_plans').select('*').eq('student_id', studentId).limit(1).maybeSingle(),
      client.from('emi_installments').select('*').eq('student_id', studentId).order('installment_no', { ascending: true }),
      client.from('payments').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      client.from('payment_proofs').select('*').eq('student_id', studentId).order('created_at', { ascending: false })
    ]);

    if (!stRes.data) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    const student = stRes.data;
    const enr: any = enrRes.data;
    const batch = Array.isArray(enr?.batches) ? enr?.batches[0] : enr?.batches;
    const course = Array.isArray(batch?.courses) ? batch?.courses[0] : batch?.courses;
    const trainer = Array.isArray(batch?.trainers) ? batch?.trainers[0] : batch?.trainers;
    const room = Array.isArray(batch?.rooms) ? batch?.rooms[0] : batch?.rooms;

    const attendanceLogs = attRes.data || [];
    const totalAtt = attendanceLogs.length;
    const presentAtt = attendanceLogs.filter((a: any) => a.status === 'present').length;
    const absentAtt = attendanceLogs.filter((a: any) => a.status === 'absent').length;
    const lateAtt = attendanceLogs.filter((a: any) => a.status === 'late').length;
    const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    let schedule: any[] = [];
    let recordings: any[] = [];

    if (batch?.id) {
      const [schedRes, recRes] = await Promise.all([
        client.from('timetable_slots').select('id, day_of_week, start_time, end_time, room_id, notes').eq('batch_id', batch.id),
        client.from('recordings').select('*').eq('batch_id', batch.id).order('date', { ascending: false }).limit(6)
      ]);
      schedule = (schedRes.data || []).map((s: any) => ({
        id: s.id,
        day: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        room_id: s.room_id,
        topic: s.notes
      }));
      recordings = recRes.data || [];
    }

    return NextResponse.json({
      student,
      enrollment: enr ? {
        enrollment_id: enr.id,
        preferred_mode: enr.preferred_mode,
        enrolled_at: enr.enrolled_at,
        batch_id: batch?.id,
        batch_name: batch?.name,
        days: batch?.days,
        start_time: batch?.start_time,
        end_time: batch?.end_time,
        batch_mode: batch?.mode,
        start_date: batch?.start_date,
        end_date: batch?.end_date,
        course_id: course?.id,
        course_code: course?.code,
        course_name: course?.name,
        duration_weeks: course?.duration_weeks,
        total_fee: course?.total_fee,
        trainer_name: trainer?.name,
        trainer_email: trainer?.email,
        trainer_phone: trainer?.phone,
        room_name: room?.name,
        room_type: room?.type
      } : null,
      attendance: {
        rate: attRate,
        totalSessions: totalAtt,
        present: presentAtt,
        absent: absentAtt,
        late: lateAtt,
        recentLogs: attendanceLogs.slice(0, 15)
      },
      financials: {
        feePlan: feeRes.data || null,
        installments: emiRes.data || [],
        payments: payRes.data || [],
        proofs: proofRes.data || []
      },
      schedule,
      recordings,
      assignments: []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
