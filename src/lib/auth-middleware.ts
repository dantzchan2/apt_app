import { NextRequest } from 'next/server';
import { supabaseAdmin } from './database';

export interface AuthenticatedUser {
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

export interface AuthError {
  error: string;
  status: number;
}

export type AuthResult = 
  | { success: true; user: AuthenticatedUser }
  | { success: false; error: AuthError };

/**
 * Authenticates a user based on session cookie
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const sessionToken = request.cookies.get('session')?.value;
  
  if (!sessionToken) {
    return {
      success: false,
      error: { error: 'No session found', status: 401 }
    };
  }

  try {
    // Look up session in database and join with user
    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        session_token,
        expires_at,
        users!inner (
          id,
          name,
          email,
          phone,
          role,
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

    if (error) {
      // Log detailed error server-side only
      console.error('Database error during authentication:', error);
      return {
        success: false,
        error: { error: 'Authentication failed', status: 401 }
      };
    }

    if (!sessions || sessions.length === 0) {
      return {
        success: false,
        error: { error: 'Invalid or expired session', status: 401 }
      };
    }

    const user = (sessions[0].users as unknown) as AuthenticatedUser;
    return {
      success: true,
      user
    };
  } catch (error) {
    // Log detailed error server-side only
    console.error('Authentication error:', error);
    return {
      success: false,
      error: { error: 'Authentication failed', status: 500 }
    };
  }
}

/**
 * Checks if the user has the required role
 */
export function authorizeRole(user: AuthenticatedUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role);
}

/**
 * Checks if the user can access the resource (either they own it or are admin)
 */
export function authorizeResource(user: AuthenticatedUser, resourceUserId?: string): boolean {
  // Admins can access any resource
  if (user.role === 'admin') {
    return true;
  }
  
  // Users can only access their own resources
  if (resourceUserId) {
    return user.id === resourceUserId;
  }
  
  // If no specific resource user ID, allow access (for general endpoints)
  return true;
}