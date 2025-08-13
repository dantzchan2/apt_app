import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibedovvkyvgfsaetsdab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZWRvdnZreXZnZnNhZXRzZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwNDk4NCwiZXhwIjoyMDYyNjgwOTg0fQ.l9m24AXh0ppwtdKsh7Dy5djMrYcTT93hsir-QljjyVs';

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