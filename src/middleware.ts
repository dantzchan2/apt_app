import { NextRequest, NextResponse } from 'next/server';
import { hasValidSessionToken } from './lib/middleware-auth';

export async function middleware(request: NextRequest) {
  // Only protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Use simple session token validation (Edge Runtime compatible)
    if (!hasValidSessionToken(request)) {
      // No valid session cookie, redirect to login
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      // Clear any invalid session cookie
      response.cookies.delete('session');
      return response;
    }
    
    // The basic session token validation above is sufficient to protect routes
    // Individual pages will handle role-specific access control
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};