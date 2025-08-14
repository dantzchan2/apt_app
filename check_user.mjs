import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  // Check the user with head trainer
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role, specialization, total_points, memo, is_active, created_at, password_hash')
    .eq('email', 'user1@ptvit.com')
    .single();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('User details:', {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    specialization: user.specialization,
    total_points: user.total_points,
    memo: user.memo,
    is_active: user.is_active,
    created_at: user.created_at,
    has_password_hash: !!user.password_hash,
    password_hash_length: user.password_hash?.length || 0
  });
  
  // Check if password is correct by trying to compare manually
  if (user.password_hash) {
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare('password!', user.password_hash);
    console.log('Password validation result:', isValid);
  } else {
    console.log('No password hash found for user!');
  }
}

checkUser().then(() => process.exit(0));