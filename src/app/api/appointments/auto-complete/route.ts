import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/database';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request - only admins can run bulk operations
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    const authenticatedUser = authResult.user;
    
    if (authenticatedUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can perform bulk appointment updates' },
        { status: 403 }
      );
    }

    // Get optional cutoff parameter (default to current time)
    const { cutoffTime } = await request.json().catch(() => ({}));
    const cutoff = cutoffTime ? new Date(cutoffTime) : new Date();

    // Lightweight update: Only update scheduled appointments that are past due
    // Using indexed columns (status, appointment_date, appointment_time) for efficiency
    const { data: updatedAppointments, error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'scheduled') // Only scheduled appointments
      .lt('appointment_date', cutoff.toISOString().split('T')[0]) // Date is before today
      .select('id, appointment_date, appointment_time, user_id, user_name, user_email, trainer_id, trainer_name, product_id, used_point_batch_id');

    if (updateError) {
      throw updateError;
    }

    // Also update appointments from today that have passed their time
    const { data: todayUpdatedAppointments, error: todayUpdateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'scheduled')
      .eq('appointment_date', cutoff.toISOString().split('T')[0]) // Today's date
      .lt('appointment_time', cutoff.toTimeString().split(' ')[0]) // Time has passed
      .select('id, appointment_date, appointment_time, user_id, user_name, user_email, trainer_id, trainer_name, product_id, used_point_batch_id');

    if (todayUpdateError) {
      throw todayUpdateError;
    }

    const totalUpdated = (updatedAppointments || []).length + (todayUpdatedAppointments || []).length;
    const allUpdatedAppointments = [...(updatedAppointments || []), ...(todayUpdatedAppointments || [])];

    // Log the bulk operation
    const { error: logError } = await supabase
      .from('appointment_logs')
      .insert(
        allUpdatedAppointments.map(apt => ({
          appointment_id: apt.id,
          action: 'completed',
          action_by: authenticatedUser.id,
          action_by_name: authenticatedUser.name,
          action_by_role: authenticatedUser.role,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          trainer_id: apt.trainer_id,
          trainer_name: apt.trainer_name,
          user_id: apt.user_id,
          user_name: apt.user_name,
          user_email: apt.user_email || '',
          product_id: apt.product_id,
          used_point_batch_id: apt.used_point_batch_id,
          notes: 'Auto-completed via bulk operation'
        }))
      );

    if (logError) {
      console.error('Failed to log bulk completion:', logError);
      // Don't fail the whole operation if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully auto-completed ${totalUpdated} past appointments`,
      updatedCount: totalUpdated,
      cutoffTime: cutoff.toISOString(),
      updatedAppointments: allUpdatedAppointments
    });
  } catch (error) {
    console.error('Auto-complete appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-complete appointments' },
      { status: 500 }
    );
  }
}