import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const productId = searchParams.get('productId');

    let query = supabase
      .from('purchase_logs')
      .select(`
        purchase_id,
        user_id,
        user_name,
        user_email,
        product_id,
        points,
        price,
        datetime,
        payment_method,
        payment_status,
        products (name, description)
      `);

    // Admin can see all purchases, users can only see their own
    if (userRole !== 'admin' && userId) {
      query = query.eq('user_id', userId);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    query = query.order('datetime', { ascending: false });

    const { data: purchases, error } = await query;

    if (error) throw error;

    // Basic stats - just count purchases for now
    const stats = {
      total_purchases: purchases?.length || 0,
      total_revenue: purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0,
      unique_customers: new Set(purchases?.map(p => p.user_id)).size || 0,
      avg_purchase_value: purchases?.length ? (purchases.reduce((sum, p) => sum + (p.price || 0), 0) / purchases.length) : 0
    };

    return NextResponse.json({ 
      purchases: purchases || [],
      stats
    });
  } catch (error) {
    console.error('Get purchase logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase logs' },
      { status: 500 }
    );
  }
}