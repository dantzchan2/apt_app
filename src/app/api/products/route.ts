import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/database';

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, points, price, display_order')
      .eq('is_active', true)
      .order('display_order')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}