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
    
    // Check if request body contains any user ID parameters
    const requestBody = await request.json().catch(() => ({})); // Handle empty body
    
    // Security: Users can only delete their own account
    // No user ID is accepted from request to prevent privilege escalation
    if (requestBody.userId || requestBody.id) {
      return NextResponse.json(
        { error: 'Cannot specify user ID - users can only delete their own account' },
        { status: 403 }
      );
    }
    
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

    // Sessions will be invalidated by the logout call on the frontend
    // No need to manually update sessions table here

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