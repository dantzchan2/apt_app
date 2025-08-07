import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';

export async function GET() {
  try {
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
      { error: 'Failed to fetch trainers' },
      { status: 500 }
    );
  }
}