import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';
import { getSessionUser } from '../../../lib/session';

export async function GET() {
  try {
    // Require authentication
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For regular users, get their assigned trainer's type to filter products
    let trainerType = null;
    if (user.role === 'user') {
      const { data: assignedTrainer, error: trainerError } = await supabase
        .from('users')
        .select('trainer_type')
        .eq('id', user.assigned_trainer_id)
        .eq('role', 'trainer')
        .eq('is_active', true)
        .single();

      if (trainerError || !assignedTrainer) {
        return NextResponse.json(
          { error: 'Unable to find assigned trainer' },
          { status: 400 }
        );
      }
      
      trainerType = assignedTrainer.trainer_type;
    }

    // Build query with trainer type filter for regular users
    let query = supabase
      .from('products')
      .select('id, name, description, points, price, duration_minutes, trainer_type, display_order')
      .eq('is_active', true);

    // Filter products by trainer type for regular users
    if (user.role === 'user' && trainerType) {
      query = query.eq('trainer_type', trainerType);
    }

    const { data: products, error } = await query
      .order('display_order')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}