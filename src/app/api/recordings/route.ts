import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured, upsertToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
    const batchId = searchParams.get('batchId') || '';

    let recQuery = client
      .from('recordings')
      .select(`
        *,
        batches (
          id, name, mode,
          courses ( name ),
          trainers ( name )
        )
      `)
      .order('date', { ascending: false })
      .limit(50);

    if (batchId) {
      recQuery = recQuery.eq('batch_id', batchId);
    }

    if (user.role === 'student') {
      const studentId = user.studentId || 's_001';
      const { data: enrollments } = await client
        .from('enrollments')
        .select('batch_id')
        .eq('student_id', studentId);
      const batchIds = (enrollments || []).map((e: any) => e.batch_id);
      if (batchIds.length > 0) {
        recQuery = recQuery.in('batch_id', batchIds);
      }
    }

    const [recRes, batchesRes] = await Promise.all([
      recQuery,
      client.from('batches').select('id, name, course_id').order('name')
    ]);

    const formattedRecordings = (recRes.data || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      date: r.date,
      duration_minutes: r.duration_minutes,
      topic_tags: r.topic_tags,
      views_count: r.views_count,
      batch_id: r.batches?.id || r.batch_id,
      batch_name: r.batches?.name || '',
      mode: r.batches?.mode || 'hybrid',
      course_name: r.batches?.courses?.name || '',
      trainer_name: r.batches?.trainers?.name || ''
    }));

    return NextResponse.json({
      recordings: formattedRecordings,
      batches: batchesRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role === 'student') {
      return NextResponse.json({ error: 'Forbidden: Students cannot upload or publish class recordings.' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { batchId, title, url, date, durationMinutes, topicTags } = body;

    if (!batchId || !title || !url || !date) {
      return NextResponse.json({ error: 'Missing required recording fields.' }, { status: 400 });
    }

    const recordingId = `rec_${Date.now()}`;

    await upsertToSupabase('recordings', {
      id: recordingId,
      batch_id: batchId,
      title,
      url,
      date,
      duration_minutes: durationMinutes || 90,
      topic_tags: topicTags || '',
      views_count: 0
    });

    return NextResponse.json({ success: true, recordingId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
