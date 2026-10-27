import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/rbac/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Audit Log is restricted to Owner/Director role only.' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role') || '';
    const action = searchParams.get('action') || '';
    const status = searchParams.get('status') || '';

    let query = client
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (role) query = query.eq('role', role);
    if (action) query = query.eq('action', action);
    if (status) query = query.eq('status', status);

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
