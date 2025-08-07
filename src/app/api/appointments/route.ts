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
        appointment_time, status, product_id, notes,
        products (name, points)
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
      trainerName, 
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

    // Insert the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        trainer_id: trainerId,
        trainer_name: trainerName,
        appointment_date: date,
        appointment_time: time,
        status: 'scheduled',
        product_id: productId,
        notes: notes
      })
      .select('id')
      .single();

    if (appointmentError) throw appointmentError;

    const appointmentId = appointment.id;

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
        product_id: productId
      });

    if (logError) {
      console.error('Failed to log appointment action:', logError);
      // Don't fail the whole request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      appointmentId: appointmentId 
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}