import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      // No session cookie, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // For basic session check, we'll verify the session via API call
    // This avoids Edge Runtime compatibility issues with Supabase
    try {
      const authResponse = await fetch(new URL('/api/auth/me', request.url), {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      });
      
      if (!authResponse.ok) {
        // Invalid session, redirect to login
        const loginUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        // Clear the invalid session cookie
        response.cookies.delete('session');
        return response;
      }
      
      const authData = await authResponse.json();
      const user = authData.user;
      
      // Check role-based access for specific pages
      if (request.nextUrl.pathname === '/dashboard/appointments' && user.role !== 'admin') {
        // Only admins can access appointments page
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
      
      if (request.nextUrl.pathname === '/dashboard/users' && user.role !== 'admin') {
        // Only admins can access users page
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
      
      if (request.nextUrl.pathname === '/dashboard/settlement' && !['admin', 'trainer'].includes(user.role)) {
        // Only admins and trainers can access settlement page
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
      
      if (request.nextUrl.pathname === '/dashboard/trainer' && user.role !== 'trainer') {
        // Only trainers can access trainer page
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
      
    } catch (error) {
      console.error('Middleware authentication error:', error);
      // On error, redirect to login
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session');
      return response;
    }
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