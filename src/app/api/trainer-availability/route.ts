import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';
import { authenticateRequest } from '../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    // User is authenticated, no further role restrictions for this endpoint
    
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!trainerId) {
      return NextResponse.json(
        { error: 'Trainer ID is required' },
        { status: 400 }
      );
    }

    // Build the query to get appointments for the trainer in the date range
    let query = supabase
      .from('appointments')
      .select('appointment_date, appointment_time, duration_minutes, status')
      .eq('trainer_id', trainerId)
      .eq('status', 'scheduled'); // Only show confirmed appointments as unavailable

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    const { data: appointments, error } = await query;

    if (error) throw error;

    // Transform to just return unavailable time slots without any user details
    const unavailableSlots = (appointments || []).map(apt => ({
      date: apt.appointment_date,
      time: apt.appointment_time?.substring(0, 5), // Remove seconds: HH:MM:SS -> HH:MM
      duration_minutes: apt.duration_minutes || 60,
      status: 'unavailable' // Generic status, no user details
    }));

    return NextResponse.json({ 
      trainerId,
      unavailableSlots,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Get trainer availability error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainer availability' },
      { status: 500 }
    );
  }
}