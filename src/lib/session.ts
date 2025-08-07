import { cookies } from 'next/headers';
import { supabase } from './database';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'trainer' | 'admin';
  phone: string;
  specialization?: string;
  total_points: number;
  memo?: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * Create a session for a user (server-side)
 */
export async function createSession(userEmail: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // For now, we'll use a simple token that's just the user email
  // In production, you would generate a proper session token and store it in a sessions table
  return {
    token: userEmail, // Using email as token for demo
    expiresAt
  };
}

/**
 * Get current session user (server-side)
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // For demo, token is the user email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', sessionToken)
      .eq('is_active', true)
      .limit(1);

    if (error || !users || users.length === 0) {
      return null;
    }

    return users[0] as SessionUser;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

/**
 * Clear session (server-side)
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}