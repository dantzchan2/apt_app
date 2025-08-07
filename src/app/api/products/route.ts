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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}