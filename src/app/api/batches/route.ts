import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { 
  getSupabase, 
  isSupabaseConfigured, 
  upsertToSupabase, 
  deleteFromSupabase 
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const searchParams = req.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    let batchQuery = client.from('batches').select(`
      *,
      courses ( id, name, code, duration_weeks ),
      trainers ( id, name, phone, email ),
      rooms ( id, name, capacity ),
      enrollments ( id )
    `);

    // Apply status filter
    if (activeOnly) {
      batchQuery = batchQuery.eq('status', 'ongoing');
    } else if (statusFilter) {
      batchQuery = batchQuery.eq('status', statusFilter);
    }

    batchQuery = batchQuery.order('start_time', { ascending: true });

    const [coursesRes, trainersRes, roomsRes, batchesRes] = await Promise.all([
      client.from('courses').select('id, name, code'),
      client.from('trainers').select('id, name, specializations, email'),
      client.from('rooms').select('id, name, capacity'),
      batchQuery
    ]);

    let batchList = (batchesRes.data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      days: b.days,
      start_time: b.start_time,
      end_time: b.end_time,
      mode: b.mode,
      online_seat_limit: b.online_seat_limit,
      max_seats: b.max_seats,
      status: b.status,
      start_date: b.start_date,
      end_date: b.end_date,
      course_id: b.courses?.id || b.course_id,
      course_name: b.courses?.name || '',
      course_code: b.courses?.code || '',
      duration_weeks: b.courses?.duration_weeks || 12,
      trainer_id: b.trainers?.id || b.trainer_id,
      trainer_name: b.trainers?.name || '',
      trainer_phone: b.trainers?.phone || '',
      room_id: b.rooms?.id || b.room_id,
      room_name: b.rooms?.name || null,
      room_capacity: b.rooms?.capacity || null,
      enrolled_students: b.enrollments?.length || 0
    }));

    if (user.role === 'trainer') {
      batchList = batchList.filter((b: any) => b.trainer_id === user.id || b.trainer_name?.includes(user.name));
    }

    return NextResponse.json({
      batches: batchList,
      courses: coursesRes.data || [],
      trainers: trainersRes.data || [],
      rooms: roomsRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role === 'student') {
      return NextResponse.json({ error: 'Forbidden: Students cannot schedule or create batches.' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { courseId, trainerId, roomId, name, days, startTime, endTime, mode, maxSeats, onlineSeatLimit } = body;

    if (!courseId || !trainerId || !name || !days || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required batch fields.' }, { status: 400 });
    }

    const batchId = `b_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    const dayArray = days.split(',').map((d: string) => d.trim());
    const validSeatLimit = Math.max(1, Number(onlineSeatLimit) || 30);

    await upsertToSupabase('batches', {
      id: batchId,
      course_id: courseId,
      trainer_id: trainerId,
      room_id: roomId || null,
      name,
      days,
      start_time: startTime,
      end_time: endTime,
      mode: mode || 'hybrid',
      online_seat_limit: validSeatLimit,
      max_seats: maxSeats || 30,
      status: 'upcoming',
      start_date: today,
      end_date: endDate
    });

    const slots = dayArray.map((day: string) => ({
      id: `slot_${Date.now()}_${day}`,
      batch_id: batchId,
      trainer_id: trainerId,
      room_id: roomId || null,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      is_active: 1,
      notes: 'Regular Schedule'
    }));
    await upsertToSupabase('timetable_slots', slots);

    await upsertToSupabase('audit_log', {
      id: `aud_batch_${Date.now()}`,
      user_id: user.id || 'u_owner',
      user_name: user.name || 'Admin',
      role: user.role || 'owner',
      action: 'create_batch',
      query: `Created batch ${name} with days ${days} (${startTime}-${endTime})`,
      result_summary: `Batch ID: ${batchId}`,
      status: 'success'
    });

    return NextResponse.json({ success: true, batchId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
