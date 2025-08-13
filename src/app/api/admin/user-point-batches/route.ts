import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/database';
import { getSessionUser } from '../../../../lib/session';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all point batches for the user (no filtering by trainer type for admin view)
    const { data: pointBatches, error } = await supabase
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
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('remaining_points', 0)
      .gt('expiry_date', new Date().toISOString())
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching point batches for admin:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user point batches' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      pointBatches: pointBatches || [],
      userId 
    });

  } catch (error) {
    console.error('Admin user point batches error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user point batches' },
      { status: 500 }
    );
  }
}