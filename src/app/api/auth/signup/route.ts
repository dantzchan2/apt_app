import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/auth';
import { createSession } from '../../../../lib/session';
import { supabaseAdmin } from '../../../../lib/database';
import { checkRateLimit, getClientIP } from '../../../../lib/rate-limit';
import { requireCSRFProtection } from '../../../../lib/csrf-protection';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for signup attempts
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`signup-${clientIP}`, {
      maxAttempts: 3, // 3 signup attempts
      windowMs: 60 * 60 * 1000 // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many signup attempts. Please try again later.',
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

    const { name, email, phone, password, assignedTrainerId } = await request.json();

    if (!name || !email || !phone || !password || !assignedTrainerId) {
      return NextResponse.json(
        { error: 'All fields including trainer selection are required' },
        { status: 400 }
      );
    }

    // Password policy - more than 8 characters
    if (password.length <= 8) {
      return NextResponse.json(
        { error: 'Password must be more than 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      console.error('User check error:', checkError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate that the assigned trainer exists and is active
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('users')
      .select('id, name, trainer_type')
      .eq('id', assignedTrainerId)
      .eq('role', 'trainer')
      .eq('is_active', true)
      .single();

    if (trainerError || !trainer) {
      console.error('Trainer validation error:', trainerError);
      return NextResponse.json(
        { error: 'Invalid trainer selection' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with trainer assignment
    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        phone,
        password_hash: passwordHash,
        role: 'user',
        assigned_trainer_id: assignedTrainerId,
        total_points: 0,
        is_active: true
      })
      .select('id, name, email, phone, role, total_points, assigned_trainer_id')
      .single();

    if (createError || !user) {
      console.error('User creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
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
        total_points: user.total_points,
        assigned_trainer_id: user.assigned_trainer_id
      },
      trainer: {
        id: trainer.id,
        name: trainer.name,
        trainer_type: trainer.trainer_type
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}