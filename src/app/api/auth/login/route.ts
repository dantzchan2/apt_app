import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/auth';
import { createSession } from '../../../../lib/session';
import { checkRateLimit, getClientIP } from '../../../../lib/rate-limit';
import { requireCSRFProtection } from '../../../../lib/csrf-protection';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for login attempts
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, {
      maxAttempts: 5, // 5 attempts
      windowMs: 15 * 60 * 1000 // 15 minutes
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      );
    }

    // CSRF protection
    const csrfCheck = await requireCSRFProtection(request);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.error || 'CSRF protection failed' },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id);

    // Set HTTP-only cookie
    const response = NextResponse.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        specialization: user.specialization,
        total_points: user.total_points
      }
    });

    response.cookies.set('session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: session.expiresAt,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}