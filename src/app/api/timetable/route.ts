import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────
// Timetable Scheduler: Constraint-Based Greedy Solver
// ──────────────────────────────────────────────────────────────
interface Slot {
  id: string;
  batchId: string;
  trainerId: string;
  roomId: string | null;
  day: string;
  startTime: string;
  endTime: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMinutes(s1) < timeToMinutes(e2) && timeToMinutes(e1) > timeToMinutes(s2);
}

function hasTrainerClash(slots: Slot[], trainerId: string, day: string, start: string, end: string, excludeSlotId?: string): boolean {
  return slots.some(s =>
    s.id !== excludeSlotId &&
    s.trainerId === trainerId &&
    s.day === day &&
    timesOverlap(start, end, s.startTime, s.endTime)
  );
}

function hasRoomClash(slots: Slot[], roomId: string | null, day: string, start: string, end: string, excludeSlotId?: string): boolean {
  if (!roomId) return false;
  return slots.some(s =>
    s.id !== excludeSlotId &&
    s.roomId === roomId &&
    s.day === day &&
    timesOverlap(start, end, s.startTime, s.endTime)
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const searchParams = req.nextUrl.searchParams;
    const trainerId = searchParams.get('trainerId') || '';
    const roomId = searchParams.get('roomId') || '';

    const [trainersRes, roomsRes] = await Promise.all([
      client.from('trainers').select('id, name'),
      client.from('rooms').select('id, name, capacity').order('name')
    ]);

    let slotsQuery = client
      .from('timetable_slots')
      .select(`
        id, day_of_week, start_time, end_time, is_active, notes,
        batches (
          id, name, mode, max_seats, online_seat_limit, status,
          courses ( id, name, code ),
          trainers ( id, name, availability ),
          rooms ( id, name, capacity )
        )
      `)
      .eq('is_active', 1);

    if (trainerId) {
      slotsQuery = slotsQuery.eq('trainer_id', trainerId);
    }
    if (roomId) {
      slotsQuery = slotsQuery.eq('room_id', roomId);
    }

    if (user.role === 'student') {
      const studentId = user.studentId || 's_001';
      const { data: enrollments } = await client
        .from('enrollments')
        .select('batch_id')
        .eq('student_id', studentId);

      const batchIds = (enrollments || []).map((e: any) => e.batch_id);
      if (batchIds.length > 0) {
        slotsQuery = slotsQuery.in('batch_id', batchIds);
      }
    }

    const { data: slotsData } = await slotsQuery;

    const slots = (slotsData || [])
      .filter((s: any) => !s.batches || s.batches.status !== 'completed')
      .map((s: any) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
        notes: s.notes,
        batch_id: s.batches?.id,
        batch_name: s.batches?.name || '',
        mode: s.batches?.mode || 'hybrid',
        max_seats: s.batches?.max_seats || 30,
        online_seat_limit: s.batches?.online_seat_limit || 30,
        course_id: s.batches?.courses?.id,
        course_name: s.batches?.courses?.name || '',
        course_code: s.batches?.courses?.code || '',
        trainer_id: s.batches?.trainers?.id,
        trainer_name: s.batches?.trainers?.name || '',
        availability: s.batches?.trainers?.availability || '{}',
        room_id: s.batches?.rooms?.id || null,
        room_name: s.batches?.rooms?.name || null,
        room_capacity: s.batches?.rooms?.capacity || null
      }));

    return NextResponse.json({
      slots,
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
      return NextResponse.json({ error: 'Forbidden: Students cannot re-plan timetables.' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'mark_unavailable') {
      return await handleMarkUnavailable(body, user);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleMarkUnavailable(body: any, user: any) {
  const client = getSupabase();
  if (!client) {
    return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
  }

  const { trainerId, day, startTime, endTime } = body;

  if (!trainerId || !day || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: allSlotsData } = await client
    .from('timetable_slots')
    .select('id, batch_id, trainer_id, room_id, day_of_week, start_time, end_time')
    .eq('is_active', 1);

  const existingSlots: Slot[] = (allSlotsData || []).map((s: any) => ({
    id: s.id,
    batchId: s.batch_id,
    trainerId: s.trainer_id,
    roomId: s.room_id,
    day: s.day_of_week,
    startTime: s.start_time,
    endTime: s.end_time
  }));

  const affectedSlots = existingSlots.filter(s =>
    s.trainerId === trainerId &&
    s.day === day &&
    timesOverlap(s.startTime, s.endTime, startTime, endTime)
  );

  if (affectedSlots.length === 0) {
    return NextResponse.json({
      message: 'No schedule conflicts found for this time window.',
      changes: [],
      affectedCount: 0
    });
  }

  const { data: allTrainers } = await client.from('trainers').select('*');
  const { data: allRooms } = await client.from('rooms').select('*');

  const changes: any[] = [];

  for (const slot of affectedSlots) {
    let alternativeTrainer = null;
    let alternativeRoom = slot.roomId;
    let reason = '';

    for (const trainer of (allTrainers || [])) {
      if (trainer.id === trainerId) continue;

      const avail = JSON.parse(trainer.availability || '{}') as Record<string, string[]>;
      const dayAvail = avail[day] || [];
      const isAvailable = dayAvail.some((range: string) => {
        const [rs, re] = range.split('-');
        return timeToMinutes(rs) <= timeToMinutes(slot.startTime) &&
               timeToMinutes(re) >= timeToMinutes(slot.endTime);
      });

      if (!isAvailable) continue;
      if (hasTrainerClash(existingSlots, trainer.id, day, slot.startTime, slot.endTime, slot.id)) continue;

      alternativeTrainer = trainer;
      reason = `Trainer ${trainer.name} is available ${day} ${slot.startTime}-${slot.endTime} and has no conflicts.`;
      break;
    }

    if (!alternativeTrainer) {
      changes.push({
        slotId: slot.id,
        originalDay: day,
        originalStart: slot.startTime,
        originalEnd: slot.endTime,
        action: 'could_not_replan',
        reason: 'No alternative trainer found. Manual intervention required.'
      });
      continue;
    }

    if (slot.roomId && hasRoomClash(existingSlots, slot.roomId, day, slot.startTime, slot.endTime, slot.id)) {
      for (const room of (allRooms || [])) {
        if (room.id === slot.roomId) continue;
        if (!hasRoomClash(existingSlots, room.id, day, slot.startTime, slot.endTime, slot.id)) {
          alternativeRoom = room.id;
          reason += ` Room ${room.name} was free.`;
          break;
        }
      }
    }

    await upsertToSupabase('timetable_slots', {
      id: slot.id,
      trainer_id: alternativeTrainer.id,
      room_id: alternativeRoom,
      notes: `Replanned: ${trainerId} unavailable ${day} ${startTime}-${endTime}. Assigned to ${alternativeTrainer.name}.`
    });

    const slotIdx = existingSlots.findIndex(s => s.id === slot.id);
    if (slotIdx >= 0) {
      existingSlots[slotIdx].trainerId = alternativeTrainer.id;
      existingSlots[slotIdx].roomId = alternativeRoom;
    }

    changes.push({
      slotId: slot.id,
      originalDay: day,
      originalStart: slot.startTime,
      originalEnd: slot.endTime,
      originalTrainer: trainerId,
      newTrainer: alternativeTrainer.name,
      newTrainerId: alternativeTrainer.id,
      originalRoom: slot.roomId,
      newRoom: alternativeRoom,
      action: 'reassigned',
      reason
    });
  }

  await upsertToSupabase('audit_log', {
    id: `aud_replan_${Date.now()}`,
    user_id: user.id || 'system',
    user_name: user.name || 'Scheduler',
    role: user.role || 'owner',
    action: 'timetable_replan',
    query: `Trainer ${trainerId} marked unavailable on ${day} ${startTime}-${endTime}`,
    result_summary: `Replanned ${changes.filter(c => c.action === 'reassigned').length} slot(s)`,
    status: 'success'
  });

  return NextResponse.json({
    message: `Timetable re-planned. ${changes.filter(c => c.action === 'reassigned').length} slot(s) reassigned.`,
    changes,
    affectedCount: affectedSlots.length
  });
}
