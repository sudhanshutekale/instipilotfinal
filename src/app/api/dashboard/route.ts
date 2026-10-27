import { NextResponse } from 'next/server';
import { getSessionUser, DEMO_USERS } from '@/lib/rbac/auth';
import { UserRole } from '@/lib/rbac/permissions';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const client = getSupabase();
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable.' }, { status: 500 });
    }

    const [
      stCountRes,
      batchCountRes,
      paySumRes,
      overdueStatsRes,
      attStatsRes,
      outboxRes
    ] = await Promise.all([
      client.from('students').select('id', { count: 'exact' }),
      client.from('batches').select('id', { count: 'exact' }).eq('status', 'ongoing'),
      client.from('payments').select('amount').eq('status', 'verified'),
      client.from('emi_installments').select('amount').eq('status', 'overdue'),
      client.from('attendance').select('status'),
      client.from('messages_outbox').select('*').eq('status', 'draft').order('created_at', { ascending: false }).limit(5)
    ]);

    const studentCount = typeof stCountRes.count === 'number' ? stCountRes.count : (stCountRes.data?.length ?? 0);
    const batchCount = typeof batchCountRes.count === 'number' ? batchCountRes.count : (batchCountRes.data?.length ?? 0);

    let feeTotalCollected = 0;
    let overdueEmiAmount = 0;
    let overdueEmiCount = 0;
    const upcomingEmiCount = 0;

    if (user.role === 'owner' || user.role === 'accounts') {
      feeTotalCollected = (paySumRes.data || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
      overdueEmiCount = (overdueStatsRes.data || []).length;
      overdueEmiAmount = (overdueStatsRes.data || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
    }

    const totalAtt = (attStatsRes.data || []).length;
    const presentAtt = (attStatsRes.data || []).filter((a: any) => a.status === 'present').length;
    const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 88;

    const dualRiskStudents = [
      {
        id: 's_003',
        name: 'Rohan Gupta',
        phone: '+91 9820033333',
        batch_name: 'Java Fullstack Morning (Alpha)',
        missed_classes: 5,
        due_amount: 11250,
        due_date: '2026-10-19',
        risk_tag: 'High Dropout & Default Risk'
      },
      {
        id: 's_007',
        name: 'Ananya Deshmukh',
        phone: '+91 9820077777',
        batch_name: 'Java Fullstack Morning (Alpha)',
        missed_classes: 3,
        due_amount: 11667,
        due_date: '2026-10-18',
        risk_tag: 'Attendance & Fee Alert'
      }
    ];

    const userRole = (user.role || 'owner') as UserRole;
    const demo = DEMO_USERS[userRole] || DEMO_USERS.owner;
    let userName = (user.name && user.name.trim().length > 0) ? user.name : demo.name;
    if (userName.toLowerCase().includes('system bot') || userName.toLowerCase().includes('bot') || user.id === 'system') {
      userName = userRole === 'owner' ? 'Priya Sharma (Director)' : demo.name;
    }

    return NextResponse.json({
      user: {
        id: (user.id === 'system' ? (userRole === 'owner' ? 'u_owner' : `u_${userRole}`) : (user.id || `u_${userRole}`)),
        name: userName,
        role: userRole,
        email: user.id === 'system' ? demo.email : (user.email || demo.email),
        avatarUrl: (user.avatarUrl && !user.id?.includes('system')) ? user.avatarUrl : demo.avatar
      },
      kpis: {
        activeStudents: studentCount,
        activeBatches: batchCount,
        attendanceRate: attendancePct,
        feeTotalCollected,
        overdueEmiAmount,
        overdueEmiCount,
        upcomingEmiCount
      },
      alerts: {
        dualRiskStudents: (user.role === 'owner' || user.role === 'counselor') ? dualRiskStudents : [],
        outboxPending: outboxRes.data || []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
