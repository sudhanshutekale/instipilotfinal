import { NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ status: 'error', message: 'Supabase not configured', timestamp: new Date().toISOString() }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ status: 'error', message: 'Supabase client unavailable', timestamp: new Date().toISOString() }, { status: 500 });
    }

    // Ping Supabase with a lightweight query
    const { error } = await client.from('students').select('id').limit(1);

    if (error) {
      return NextResponse.json({ status: 'error', db: 'disconnected', message: error.message, timestamp: new Date().toISOString() }, { status: 500 });
    }

    return NextResponse.json({ status: 'ok', db: 'supabase_connected', timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 });
  }
}
