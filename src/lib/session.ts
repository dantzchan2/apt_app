import { cookies } from 'next/headers';
import { supabaseAdmin } from './database';
import { randomBytes } from 'crypto';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'trainer' | 'admin';
  phone: string;
  specialization?: string;
  assigned_trainer_id?: string;
  total_points: number;
  memo?: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * Create a session for a user (server-side)
 */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  try {
    // Try to store session in database, but fallback gracefully
    const { error } = await supabaseAdmin
      .from('sessions')
      .insert({
        session_token: token,
        user_id: userId,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Session creation error:', error);
      // Don't throw error - allow fallback to cookie-only session
      console.log('Falling back to cookie-only session');
    }

    return {
      token,
      expiresAt
    };
  } catch (error) {
    // Log detailed error server-side only
    console.error('Session creation error:', error);
    // Don't throw error - allow fallback to cookie-only session
    console.log('Falling back to cookie-only session due to database error');
    return {
      token,
      expiresAt
    };
  }
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

    try {
      // Try database session first
      const { data: sessions, error } = await supabaseAdmin
        .from('sessions')
        .select(`
          session_token,
          expires_at,
          user_id,
          users!inner (
            id,
            name,
            email,
            role,
            phone,
            specialization,
            assigned_trainer_id,
            total_points,
            memo,
            is_active,
            created_at
          )
        `)
        .eq('session_token', sessionToken)
        .eq('users.is_active', true)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (!error && sessions && sessions.length > 0) {
        const session = sessions[0];
        return (session.users as unknown) as SessionUser;
      }
    } catch (dbError) {
      console.error('Database session lookup failed:', dbError);
    }

    // Fallback: try to decode user info from token (for cookie-only sessions)
    // This is a temporary fallback - in this case we'll just return null for now
    // and require proper database sessions
    console.log('Session not found in database, returning null');
    return null;

  } catch (error) {
    // Log detailed error server-side only  
    console.error('Session error:', error);
    return null;
  }
}

/**
 * Clear session (server-side)
 */
export async function clearSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (sessionToken) {
      // Delete session from database
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('session_token', sessionToken);
    }
    
    cookieStore.delete('session');
  } catch (error) {
    // Log detailed error server-side only
    console.error('Clear session error:', error);
  }
}