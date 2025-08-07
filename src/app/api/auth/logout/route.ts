import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '../../../../lib/session';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session')?.value;
    
    if (sessionToken) {
      // Delete session from database
      await clearSession();
    }
    
    // Clear the session cookie
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}