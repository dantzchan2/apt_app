// Simplified session validation for middleware (Edge Runtime compatible)
import { NextRequest } from 'next/server';

// Simple session validation that just checks if we have a valid-looking session token
// The full validation will happen in the API routes
export function hasValidSessionToken(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('session')?.value;
  
  if (!sessionToken) {
    return false;
  }
  
  // Basic format validation - should be a hex string of reasonable length
  if (sessionToken.length < 32 || !/^[a-f0-9]+$/i.test(sessionToken)) {
    return false;
  }
  
  return true;
}

// Extract user role from the session by making a simple fetch
// This is a fallback that should work in Edge Runtime
export async function getUserRoleFromSession(request: NextRequest): Promise<string | null> {
  try {
    // Make a lightweight request to get user info
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user?.role || null;
  } catch (error) {
    console.error('Failed to get user role:', error);
    return null;
  }
}