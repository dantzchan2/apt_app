import { NextResponse } from 'next/server';
import { query } from '../../../lib/database';

export async function GET() {
  try {
    const result = await query(`
      SELECT id, name, email, phone, specialization, is_active, created_at
      FROM users 
      WHERE role = 'trainer' AND is_active = true
      ORDER BY name
    `);

    return NextResponse.json({ trainers: result.rows });
  } catch (error) {
    console.error('Get trainers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainers' },
      { status: 500 }
    );
  }
}