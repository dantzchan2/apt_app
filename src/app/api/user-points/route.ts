import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';
import { getSessionUser } from '../../../lib/session';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Determine which user's points to fetch
    const targetUserId = requestedUserId || user.id;

    // Only allow admins to view other users' points, or users viewing their own points
    if (targetUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // For regular users, get their assigned trainer type to filter point batches
    let assignedTrainerType = null;
    if (user.role === 'user' || (user.role === 'admin' && targetUserId !== user.id)) {
      const { data: userWithTrainer, error: userError } = await supabase
        .from('users')
        .select(`
          assigned_trainer_id,
          users!assigned_trainer_id (trainer_type)
        `)
        .eq('id', targetUserId)
        .eq('role', 'user')
        .single();

      if (userError || !userWithTrainer || !userWithTrainer.users) {
        return NextResponse.json(
          { error: 'Unable to find user trainer assignment' },
          { status: 400 }
        );
      }

      assignedTrainerType = (userWithTrainer.users as { trainer_type?: string })?.trainer_type;
    }

    // Get user's point batches with product duration information and trainer type filtering
    let query = supabase
      .from('point_batches')
      .select(`
        id,
        product_id,
        remaining_points,
        original_points,
        purchase_date,
        expiry_date,
        is_active,
        products (
          id,
          name,
          duration_minutes,
          points,
          price,
          trainer_type
        )
      `)
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .gt('remaining_points', 0)
      .gt('expiry_date', new Date().toISOString());

    // Filter by trainer type for regular users
    if (assignedTrainerType) {
      query = query.eq('products.trainer_type', assignedTrainerType);
    }

    const { data: pointBatches, error } = await query.order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching point batches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user points' },
        { status: 500 }
      );
    }

    // Group points by session duration
    const pointsByDuration = {
      30: 0,  // 30-minute session points
      60: 0   // 60-minute session points
    };

    const batchesByDuration = {
      30: [] as typeof pointBatches,
      60: [] as typeof pointBatches
    };

    pointBatches?.forEach(batch => {
      const duration = (batch.products as { duration_minutes?: number })?.duration_minutes || 60;
      const points = batch.remaining_points || 0;
      
      if (duration === 30) {
        pointsByDuration[30] += points;
        batchesByDuration[30].push(batch);
      } else if (duration === 60) {
        pointsByDuration[60] += points;
        batchesByDuration[60].push(batch);
      }
    });

    // Calculate total points
    const totalPoints = pointsByDuration[30] + pointsByDuration[60];

    // Get expiring points information for each duration
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const expiringPointsByDuration = {
      30: 0,
      60: 0
    };

    let earliestExpiry: string | null = null;

    pointBatches?.forEach(batch => {
      const expiryDate = new Date(batch.expiry_date);
      if (expiryDate <= twoWeeksFromNow) {
        const duration = (batch.products as { duration_minutes?: number })?.duration_minutes || 60;
        const points = batch.remaining_points || 0;
        
        if (duration === 30) {
          expiringPointsByDuration[30] += points;
        } else if (duration === 60) {
          expiringPointsByDuration[60] += points;
        }

        if (!earliestExpiry || expiryDate < new Date(earliestExpiry)) {
          earliestExpiry = batch.expiry_date;
        }
      }
    });

    const totalExpiringPoints = expiringPointsByDuration[30] + expiringPointsByDuration[60];

    return NextResponse.json({
      userId: targetUserId,
      totalPoints,
      pointsByDuration,
      batchesByDuration,
      expiringPoints: {
        total: totalExpiringPoints,
        byDuration: expiringPointsByDuration,
        earliestExpiry
      },
      summary: {
        total30MinPoints: pointsByDuration[30],
        total60MinPoints: pointsByDuration[60],
        totalActiveBatches: pointBatches?.length || 0
      }
    });

  } catch (error) {
    console.error('Get user points error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}