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
    
    // Check if user has permission to view purchase logs
    if (!authorizeRole(authenticatedUser, ['admin', 'trainer'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    // Verify resource access (only check if requestedUserId is provided)
    if (requestedUserId && !authorizeResource(authenticatedUser, requestedUserId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

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

    // Admin can see all purchases, others can only see their own
    if (authenticatedUser.role !== 'admin') {
      query = query.eq('user_id', authenticatedUser.id);
    } else if (requestedUserId) {
      // Admin can filter by specific user
      query = query.eq('user_id', requestedUserId);
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