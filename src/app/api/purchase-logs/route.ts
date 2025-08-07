import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let queryText = `
      SELECT 
        pl.purchase_id,
        pl.user_id,
        pl.user_name,
        pl.user_email,
        pl.product_id,
        pl.points,
        pl.price,
        pl.datetime,
        pl.payment_method,
        pl.payment_status,
        p.name as product_name,
        p.description as product_description
      FROM purchase_logs pl
      LEFT JOIN products p ON pl.product_id = p.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    // Admin can see all purchases, users can only see their own
    if (userRole !== 'admin' && userId) {
      params.push(userId);
      queryText += ` AND pl.user_id = $${params.length}`;
    }

    if (productId) {
      params.push(productId);
      queryText += ` AND pl.product_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      queryText += ` AND pl.datetime >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      queryText += ` AND pl.datetime <= $${params.length}`;
    }

    queryText += ` ORDER BY pl.datetime DESC`;

    const result = await query(queryText, params);

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_purchases,
        SUM(pl.price) as total_revenue,
        COUNT(DISTINCT pl.user_id) as unique_customers,
        AVG(pl.price) as avg_purchase_value
      FROM purchase_logs pl
      WHERE pl.payment_status = 'completed'
      ${userRole !== 'admin' && userId ? `AND pl.user_id = '${userId}'` : ''}
    `;

    const statsResult = await query(statsQuery);

    return NextResponse.json({ 
      purchases: result.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get purchase logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase logs' },
      { status: 500 }
    );
  }
}