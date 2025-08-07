import { NextRequest } from 'next/server';
import { supabase } from './database';

export interface AuthenticatedUser {
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
    // For demo, session token is the user email
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, specialization, total_points, memo, is_active, created_at')
      .eq('email', sessionToken)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Database error during authentication:', error);
      return {
        success: false,
        error: { error: 'Authentication failed', status: 401 }
      };
    }

    if (!users || users.length === 0) {
      return {
        success: false,
        error: { error: 'Invalid session', status: 401 }
      };
    }

    return {
      success: true,
      user: users[0] as AuthenticatedUser
    };
  } catch (error) {
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