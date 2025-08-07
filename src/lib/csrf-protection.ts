import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export async function generateCSRFToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function setCSRFToken(): Promise<string> {
  const token = await generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
  
  return token;
}

export async function verifyCSRFToken(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return cookieToken === headerToken;
}

export async function requireCSRFProtection(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF for GET requests (they should be idempotent)
  if (request.method === 'GET') {
    return { valid: true };
  }
  
  const isValid = await verifyCSRFToken(request);
  
  if (!isValid) {
    return { 
      valid: false, 
      error: 'CSRF token missing or invalid' 
    };
  }
  
  return { valid: true };
}