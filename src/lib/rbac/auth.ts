import { cookies } from 'next/headers';
import { UserRole } from './permissions';
import { AuthUser, DEMO_USERS } from './user-types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export type { UserRole };
export * from './user-types';

const SESSION_COOKIE_NAME = 'instipilot_session';

/**
 * Server-side helper to retrieve current authenticated user.
 * Defaults to 'owner' if no cookie is present, ensuring instant evaluation during dev/demo.
 */
export async function getSessionUser(): Promise<AuthUser> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decoded = sessionCookie.includes('%') ? decodeURIComponent(sessionCookie) : sessionCookie;
      const parsed = JSON.parse(decoded) as AuthUser;
      if (parsed && parsed.role && DEMO_USERS[parsed.role]) {
        const demo = DEMO_USERS[parsed.role];
        let name = parsed.name && parsed.name.trim().length > 0 ? parsed.name : demo.name;
        // Purge any stale "System Bot" from cookies
        if (name.toLowerCase().includes('system bot') || name.toLowerCase().includes('bot') || parsed.id === 'system') {
          name = parsed.role === 'owner' ? 'Priya Sharma (Director)' : demo.name;
        }
        return {
          id: parsed.id === 'system' ? (parsed.role === 'owner' ? 'u_owner' : `u_${parsed.role}`) : (parsed.id || `u_${parsed.role}`),
          name,
          email: parsed.id === 'system' ? demo.email : (parsed.email || demo.email),
          role: parsed.role,
          studentId: parsed.studentId || demo.studentId,
          avatarUrl: (parsed.avatarUrl && !parsed.id?.includes('system')) ? parsed.avatarUrl : demo.avatar
        };
      }
    } catch {
      // invalid cookie json
    }
  }

  // Default demo user fallback: Owner
  return {
    id: 'u_owner',
    name: DEMO_USERS.owner.name,
    email: DEMO_USERS.owner.email,
    role: 'owner',
    avatarUrl: DEMO_USERS.owner.avatar
  };
}

/**
 * Authenticates against Supabase database or demo accounts.
 */
export async function authenticateDemoUser(role: UserRole): Promise<AuthUser> {
  const demo = DEMO_USERS[role];
  if (!demo) {
    throw new Error(`Invalid role: ${role}`);
  }

  // Try Supabase for real user data
  if (isSupabaseConfigured()) {
    const client = getSupabase();
    if (client) {
      // 1. Directly target official user ID (e.g. 'u_owner', 'u_trainer')
      let { data: user } = await client
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('id', `u_${role}`)
        .maybeSingle();

      // 2. If not found by ID, find by role strictly excluding system/bot accounts
      if (!user) {
        const { data: fallbackUser } = await client
          .from('users')
          .select('id, name, email, role, avatar_url')
          .eq('role', role)
          .neq('id', 'system')
          .not('name', 'ilike', '%bot%')
          .not('name', 'ilike', '%system%')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();
        user = fallbackUser;
      }

      if (user && user.name && !user.name.toLowerCase().includes('bot') && !user.name.toLowerCase().includes('system')) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          studentId: role === 'student' ? (demo.studentId || 's_001') : undefined,
          avatarUrl: user.avatar_url || demo.avatar
        };
      }
    }
  }

  // Fallback to demo user
  return {
    id: `u_${role}`,
    name: demo.name,
    email: demo.email,
    role: demo.role,
    studentId: role === 'student' ? (demo.studentId || 's_001') : undefined,
    avatarUrl: demo.avatar
  };
}

/**
 * Authenticates directly by user ID from Supabase database.
 */
export async function authenticateUserById(userId: string): Promise<AuthUser> {
  // Try Supabase
  if (isSupabaseConfigured()) {
    const client = getSupabase();
    if (client) {
      const { data: user } = await client
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (user) {
        const demo = DEMO_USERS[user.role as UserRole];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          studentId: user.role === 'student' ? (demo?.studentId || 's_001') : undefined,
          avatarUrl: user.avatar_url || demo?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
        };
      }
    }
  }

  // Fallback: check if it matches a demo user pattern
  const roleFromId = userId.replace('u_', '') as UserRole;
  const demo = DEMO_USERS[roleFromId];
  if (demo) {
    return {
      id: userId,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      studentId: roleFromId === 'student' ? (demo.studentId || 's_001') : undefined,
      avatarUrl: demo.avatar
    };
  }

  throw new Error(`User not found: ${userId}`);
}
