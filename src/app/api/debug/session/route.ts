import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/database';
import { getSessionUser } from '../../../../lib/session';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    console.log('=== SESSION DEBUG ===');
    
    // Check if sessions table exists by trying to select from it
    let tablesError = null;
    let tableExists = false;
    
    try {
      const { error } = await supabaseAdmin
        .from('sessions')
        .select('count')
        .limit(0);
      tableExists = !error;
      tablesError = error;
    } catch (e) {
      tablesError = e;
    }

    console.log('Sessions table check:', { tableExists, tablesError });

    // Check cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    console.log('Session cookie:', sessionCookie);

    // Check current session
    const sessionUser = await getSessionUser();
    console.log('Current session user:', sessionUser);

    // Check sessions table contents
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('*');

    console.log('Sessions in database:', { sessions, sessionsError });

    return NextResponse.json({
      tableExists,
      sessionCookie: sessionCookie ? {
        value: sessionCookie.value?.substring(0, 16) + '...', // Only show first 16 chars for security
        name: sessionCookie.name
      } : null,
      currentUser: sessionUser,
      sessionsCount: sessions?.length || 0,
      sessionsData: sessions?.slice(0, 3).map(s => ({
        ...s,
        token: s.token?.substring(0, 16) + '...' // Truncate tokens for security
      })), // Show first 3 sessions for debugging
      errors: {
        tableError: tablesError,
        sessionsError: sessionsError
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}