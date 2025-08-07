import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const appointmentId = searchParams.get('appointmentId');

    let query = supabase
      .from('appointment_logs')
      .select(`
        id,
        appointment_id,
        action,
        action_by,
        action_by_name,
        action_by_role,
        timestamp,
        appointment_date,
        appointment_time,
        trainer_id,
        trainer_name,
        user_id,
        user_name,
        user_email,
        product_id,
        notes,
        products (name)
      `);

    // Admin can see all logs, users can only see their own
    if (userRole !== 'admin' && userId) {
      query = query.or(`user_id.eq.${userId},action_by.eq.${userId}`);
    }

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }

    query = query.order('timestamp', { ascending: false });

    const { data: logs, error } = await query;

    if (error) throw error;

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Get appointment logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment logs' },
      { status: 500 }
    );
  }
}