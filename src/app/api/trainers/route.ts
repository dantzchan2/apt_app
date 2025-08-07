import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';
import { getSessionUser } from '../../../lib/session';

export async function GET() {
  try {
    // Require authentication
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: trainers, error } = await supabase
      .from('users')
      .select('id, name, email, phone, specialization, is_active, created_at')
      .eq('role', 'trainer')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ trainers: trainers || [] });
  } catch (error) {
    console.error('Get trainers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}