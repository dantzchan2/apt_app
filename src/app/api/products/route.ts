import { NextResponse } from 'next/server';
import { query } from '../../../lib/database';

export async function GET() {
  try {
    const result = await query(`
      SELECT id, name, description, points, price, display_order
      FROM products 
      WHERE is_active = true
      ORDER BY display_order, name
    `);

    return NextResponse.json({ products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}