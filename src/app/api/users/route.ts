import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';
import { authenticateRequest, authorizeRole } from '../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    // Only admins can access user management
    if (!authorizeRole(authResult.user, ['admin'])) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, specialization, total_points, memo, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    // Only admins can modify users
    if (!authorizeRole(authResult.user, ['admin'])) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required' },
        { status: 400 }
      );
    }

    // Update user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}