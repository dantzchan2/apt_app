import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/database';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.error.status });
    }

    const authenticatedUser = authResult.user;
    
    // Set user as inactive instead of deleting
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', authenticatedUser.id);

    if (updateError) {
      throw updateError;
    }

    // Also deactivate all user's sessions to prevent further access
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authenticatedUser.id);

    if (sessionError) {
      console.error('Failed to deactivate sessions:', sessionError);
      // Don't fail the whole request if session deactivation fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account deactivated successfully' 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate account' },
      { status: 500 }
    );
  }
}