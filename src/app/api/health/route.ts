import { NextResponse } from 'next/server';
import { query } from '../../../lib/database';

export async function GET() {
  try {
    // Test database connection
    const result = await query('SELECT 1 as test');
    
    // Count users by role
    const userCounts = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true
      GROUP BY role
      ORDER BY role
    `);

    return NextResponse.json({ 
      status: 'ok',
      database: 'connected',
      test_query: result.rows[0],
      user_counts: userCounts.rows
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}