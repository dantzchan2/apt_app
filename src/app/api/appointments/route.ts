import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';
import { authenticateRequest, authorizeResource } from '../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    const authenticatedUser = authResult.user;
    
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const trainerId = searchParams.get('trainerId');
    const date = searchParams.get('date');

    // Verify resource access (only check if requestedUserId is provided)
    if (requestedUserId && !authorizeResource(authenticatedUser, requestedUserId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    let query = supabase
      .from('appointments')
      .select(`
        id, user_id, user_name, user_email, 
        trainer_id, trainer_name, appointment_date, 
        appointment_time, duration_minutes, status, product_id, notes,
        products (name, points, duration_minutes)
      `);

    // Apply user-based filtering based on role
    if (authenticatedUser.role === 'admin') {
      // Admins can see all appointments, apply filters as requested
      if (requestedUserId) {
        query = query.eq('user_id', requestedUserId);
      }
      if (trainerId) {
        query = query.eq('trainer_id', trainerId);
      }
    } else if (authenticatedUser.role === 'trainer') {
      // Trainers can see appointments they're involved in
      query = query.eq('trainer_id', authenticatedUser.id);
    } else {
      // Regular users can only see their own appointments
      query = query.eq('user_id', authenticatedUser.id);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    query = query.order('appointment_date', { ascending: false })
                 .order('appointment_time', { ascending: false });

    const { data: appointments, error } = await query;

    if (error) throw error;

    return NextResponse.json({ appointments: appointments || [] });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    const authenticatedUser = authResult.user;
    
    const { 
      userId, 
      userName, 
      userEmail, 
      trainerId, 
      date, 
      time, 
      productId,
      notes 
    } = await request.json();

    // Verify the user can only create appointments for themselves (unless admin)
    if (authenticatedUser.role !== 'admin' && userId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'Can only create appointments for yourself' },
        { status: 403 }
      );
    }

    // For regular users, validate they can only book with their assigned trainer
    if (authenticatedUser.role === 'user') {
      if (authenticatedUser.assigned_trainer_id !== trainerId) {
        return NextResponse.json(
          { error: 'You can only book appointments with your assigned trainer' },
          { status: 400 }
        );
      }
    }

    // Look up trainer name from database
    const { data: trainer, error: trainerError } = await supabase
      .from('users')
      .select('name, specialization')
      .eq('id', trainerId)
      .eq('role', 'trainer')
      .single();

    if (trainerError || !trainer) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    const trainerName = trainer.name;

    // Get user's available point batches with product duration info (FIFO - oldest first)
    const { data: pointBatches, error: batchError } = await supabase
      .from('point_batches')
      .select(`
        id, product_id, remaining_points, purchase_date,
        products (duration_minutes)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('remaining_points', 0)
      .gt('expiry_date', new Date().toISOString())
      .order('purchase_date', { ascending: true });

    if (batchError) {
      return NextResponse.json(
        { error: 'Failed to fetch point batches' },
        { status: 500 }
      );
    }

    if (!pointBatches || pointBatches.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient points available' },
        { status: 400 }
      );
    }

    // Find a batch that matches the requested product (if specified)
    let selectedBatch;
    if (productId) {
      // Look for a batch with matching product ID first
      selectedBatch = pointBatches.find(batch => batch.product_id === productId);
      
      if (!selectedBatch) {
        return NextResponse.json(
          { error: 'No available points for the requested session type' },
          { status: 400 }
        );
      }
    } else {
      // Fallback: Use the oldest available batch (FIFO)
      selectedBatch = pointBatches[0];
    }

    const usedPointBatchId = selectedBatch.id;
    const usedProductId = selectedBatch.product_id;
    const durationMinutes = (selectedBatch as { products?: { duration_minutes?: number } }).products?.duration_minutes || 60;

    // Deduct 1 point from the selected batch atomically
    const { data: updatedBatch, error: updateError } = await supabase.rpc(
      'decrement_point_batch',
      {
        batch_id: usedPointBatchId,
        decrement_amount: 1
      }
    );

    if (updateError) {
      console.error('Failed to deduct point for booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to deduct points: ' + updateError.message },
        { status: 500 }
      );
    }

    if (!updatedBatch || updatedBatch.length === 0) {
      return NextResponse.json(
        { error: 'Point batch not found or insufficient points' },
        { status: 400 }
      );
    }

    // Check for existing appointments at this time slot (including duration conflicts)
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('id, status, user_id, appointment_time, duration_minutes')
      .eq('trainer_id', trainerId)
      .eq('appointment_date', date);
      
    // Helper function to convert time string to minutes since midnight
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Check for time range conflicts with proper duration consideration
    const conflictingAppointments = existingAppointments?.filter(apt => {
      if (apt.status !== 'scheduled') return false;
      
      const existingStart = timeToMinutes(apt.appointment_time);
      const existingEnd = existingStart + (apt.duration_minutes || 60);
      const newStart = timeToMinutes(time);
      const newEnd = newStart + durationMinutes;
      
      // Check for any overlap between time ranges
      return !(newEnd <= existingStart || newStart >= existingEnd);
    }) || [];

    if (checkError) {
      console.error('Error checking existing appointment:', checkError);
      return NextResponse.json(
        { error: 'Failed to check appointment availability' },
        { status: 500 }
      );
    }

    // Check if there's a conflicting appointment
    if (conflictingAppointments && conflictingAppointments.length > 0) {
      const conflictingApt = conflictingAppointments[0];
      const conflictStart = conflictingApt.appointment_time;
      const conflictDuration = conflictingApt.duration_minutes || 60;
      return NextResponse.json(
        { error: `Time slot conflicts with existing ${conflictDuration}min appointment at ${conflictStart}` },
        { status: 409 }
      );
    }

    // Check if there's a cancelled appointment we can reuse (to avoid unique constraint)
    const cancelledAppointment = existingAppointments?.find(apt => apt.status === 'cancelled');
    
    let appointmentId;

    if (cancelledAppointment) {
      // Reuse the cancelled appointment by updating it
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          status: 'scheduled',
          duration_minutes: durationMinutes,
          product_id: usedProductId,
          used_point_batch_id: usedPointBatchId,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', cancelledAppointment.id)
        .select('id')
        .single();
      
      if (updateError) throw updateError;
      appointmentId = updatedAppointment.id;
    } else {
      // Create new appointment
      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          trainer_id: trainerId,
          trainer_name: trainerName,
          appointment_date: date,
          appointment_time: time,
          duration_minutes: durationMinutes,
          status: 'scheduled',
          product_id: usedProductId,
          used_point_batch_id: usedPointBatchId,
          notes: notes
        })
        .select('id')
        .single();
      
      if (appointmentError) throw appointmentError;
      appointmentId = newAppointment.id;
    }

    // appointmentId is already set above

    // Log the booking action
    const { error: logError } = await supabase
      .from('appointment_logs')
      .insert({
        appointment_id: appointmentId,
        action: 'booked',
        action_by: userId,
        action_by_name: userName,
        action_by_role: 'user',
        appointment_date: date,
        appointment_time: time,
        trainer_id: trainerId,
        trainer_name: trainerName,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        product_id: usedProductId,
        used_point_batch_id: usedPointBatchId
      });

    if (logError) {
      console.error('Failed to log appointment action:', logError);
      // Don't fail the whole request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      appointmentId: appointmentId,
      usedPointBatchId: usedPointBatchId,
      productId: usedProductId,
      trainerName: trainerName,
      pointsDeducted: 1
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
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

    const authenticatedUser = authResult.user;
    
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Appointment ID and status are required' },
        { status: 400 }
      );
    }

    // Get the appointment to verify ownership and get details for refund
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify the user can cancel this appointment (only their own unless admin)
    if (authenticatedUser.role !== 'admin' && appointment.user_id !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'Can only cancel your own appointments' },
        { status: 403 }
      );
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: status })
      .eq('id', id);

    if (updateError) throw updateError;

    // If cancelling, refund the point by updating the point batch
    if (status === 'cancelled' && appointment.used_point_batch_id) {
      // Use atomic increment to avoid race conditions
      const { data: updatedBatch, error: refundError } = await supabase.rpc(
        'increment_point_batch', 
        { 
          batch_id: appointment.used_point_batch_id,
          increment_amount: 1
        }
      );

      if (refundError) {
        console.error('Critical: Failed to refund point for appointment', appointment.id, ':', refundError);
        // Fail the entire operation if point refund fails
        return NextResponse.json(
          { error: 'Failed to refund points. Cancellation aborted.' },
          { status: 500 }
        );
      }

      if (!updatedBatch || updatedBatch.length === 0) {
        console.error('Critical: Point batch not found for refund:', appointment.used_point_batch_id);
        return NextResponse.json(
          { error: 'Point batch not found. Cancellation aborted.' },
          { status: 404 }
        );
      }

      console.log('Point refund successful:', {
        appointmentId: appointment.id,
        batchId: appointment.used_point_batch_id,
        newRemainingPoints: updatedBatch[0].remaining_points
      });
    }

    // Log the cancellation action
    const { error: logError } = await supabase
      .from('appointment_logs')
      .insert({
        appointment_id: id,
        action: 'cancelled',
        action_by: authenticatedUser.id,
        action_by_name: authenticatedUser.name,
        action_by_role: authenticatedUser.role,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        trainer_id: appointment.trainer_id,
        trainer_name: appointment.trainer_name,
        user_id: appointment.user_id,
        user_name: appointment.user_name,
        user_email: appointment.user_email,
        product_id: appointment.product_id,
        used_point_batch_id: appointment.used_point_batch_id
      });

    if (logError) {
      console.error('Failed to log cancellation action:', logError);
      // Don't fail the whole request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment cancelled successfully',
      appointmentId: id,
      status: status
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}