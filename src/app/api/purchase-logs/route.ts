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
    
    // Users can see their own purchase logs, admins and trainers can see all purchase logs
    if (!authorizeRole(authenticatedUser, ['admin', 'trainer', 'user'])) {
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

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    const authenticatedUser = authResult.user;
    
    // Only users and admins can make purchases
    if (!authorizeRole(authenticatedUser, ['user', 'admin'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions to make purchases' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product details including trainer_type
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, points, price, trainer_type')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // For regular users, validate they can only purchase products for their assigned trainer type
    if (authenticatedUser.role === 'user') {
      // Get user's assigned trainer type
      const { data: assignedTrainer, error: trainerError } = await supabase
        .from('users')
        .select('trainer_type')
        .eq('id', authenticatedUser.assigned_trainer_id)
        .eq('role', 'trainer')
        .eq('is_active', true)
        .single();

      if (trainerError || !assignedTrainer) {
        return NextResponse.json(
          { error: 'Unable to find assigned trainer information' },
          { status: 400 }
        );
      }

      // Validate trainer type matches
      if (product.trainer_type !== assignedTrainer.trainer_type) {
        return NextResponse.json(
          { error: 'You can only purchase products for your assigned trainer type' },
          { status: 400 }
        );
      }
    }

    // Create purchase log
    const { data: purchaseLog, error: purchaseError } = await supabase
      .from('purchase_logs')
      .insert({
        user_id: authenticatedUser.id,
        user_name: authenticatedUser.name,
        user_email: authenticatedUser.email,
        product_id: product.id,
        points: product.points,
        price: product.price,
        payment_method: 'demo', // In a real app, this would come from payment processor
        payment_status: 'completed'
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Purchase log error:', purchaseError);
      return NextResponse.json(
        { error: 'Failed to create purchase log' },
        { status: 500 }
      );
    }

    // Create point batch
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months from now

    const { data: pointBatch, error: batchError } = await supabase
      .from('point_batches')
      .insert({
        user_id: authenticatedUser.id,
        product_id: product.id,
        original_points: product.points,
        remaining_points: product.points,
        purchase_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        price_paid: product.price
      })
      .select()
      .single();

    if (batchError) {
      console.error('Point batch error:', batchError);
      return NextResponse.json(
        { error: 'Failed to create point batch' },
        { status: 500 }
      );
    }

    // The total_points will be automatically updated by the database trigger

    return NextResponse.json({
      success: true,
      purchase: purchaseLog,
      pointBatch: pointBatch,
      product: product
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}