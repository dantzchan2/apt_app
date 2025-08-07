import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';

export async function GET() {
  try {
    // Test Supabase connection with a simple query
    const { error: testError } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);

    if (testError) throw testError;

    // Get all users and group by role manually (since Supabase doesn't support GROUP BY in select)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('role')
      .eq('is_active', true);

    if (usersError) throw usersError;

    // Group users by role
    const roleCounts = (allUsers || []).reduce((acc: Record<string, number>, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const userCounts = Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count
    }));

    return NextResponse.json({ 
      status: 'ok',
      database: 'connected',
      supabase: 'working',
      user_counts: userCounts
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