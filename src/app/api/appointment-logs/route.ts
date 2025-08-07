import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const appointmentId = searchParams.get('appointmentId');

    let queryText = `
      SELECT 
        al.id,
        al.appointment_id,
        al.action,
        al.action_by,
        al.action_by_name,
        al.action_by_role,
        al.timestamp,
        al.appointment_date,
        al.appointment_time,
        al.trainer_id,
        al.trainer_name,
        al.user_id,
        al.user_name,
        al.user_email,
        al.product_id,
        al.notes,
        p.name as product_name
      FROM appointment_logs al
      LEFT JOIN products p ON al.product_id = p.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    // Admin can see all logs, users can only see their own
    if (userRole !== 'admin' && userId) {
      params.push(userId);
      queryText += ` AND (al.user_id = $${params.length} OR al.action_by = $${params.length})`;
    }

    if (appointmentId) {
      params.push(appointmentId);
      queryText += ` AND al.appointment_id = $${params.length}`;
    }

    queryText += ` ORDER BY al.timestamp DESC`;

    const result = await query(queryText, params);

    return NextResponse.json({ logs: result.rows });
  } catch (error) {
    console.error('Get appointment logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment logs' },
      { status: 500 }
    );
  }
}