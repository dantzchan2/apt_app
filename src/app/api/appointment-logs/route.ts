import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';
import { authenticateRequest, authorizeRole, authorizeResource } from '../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    const authenticatedUser = authResult.user;
    
    // Check if user has permission to view appointment logs
    if (!authorizeRole(authenticatedUser, ['admin', 'trainer'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const appointmentId = searchParams.get('appointmentId');

    // Verify resource access
    if (requestedUserId && !authorizeResource(authenticatedUser, requestedUserId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

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

    // Admin can see all logs, trainers can see logs related to their appointments, 
    // users can only see their own logs
    if (authenticatedUser.role === 'admin') {
      // Admins can see all logs - no additional filters needed
    } else if (authenticatedUser.role === 'trainer') {
      // Trainers can see logs for appointments they're involved in
      query = query.or(`trainer_id.eq.${authenticatedUser.id},action_by.eq.${authenticatedUser.id}`);
    } else {
      // Regular users can only see their own logs
      query = query.or(`user_id.eq.${authenticatedUser.id},action_by.eq.${authenticatedUser.id}`);
    }

    // Filter by specific appointment if requested
    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }

    // Filter by specific user if requested (and authorized)
    if (requestedUserId && authenticatedUser.role === 'admin') {
      query = query.eq('user_id', requestedUserId);
    }

    query = query.order('timestamp', { ascending: false });

    const { data: logs, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Get appointment logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment logs' },
      { status: 500 }
    );
  }
}