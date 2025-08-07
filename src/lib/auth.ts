import bcrypt from 'bcrypt';
import { supabase } from './database';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  specialization?: string;
  total_points: number;
  memo?: string;
  is_active: boolean;
  created_at: Date;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, specialization, total_points, memo, is_active, created_at, password_hash')
      .eq('email', email)
      .eq('is_active', true)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      return null;
    }

    const user = users[0];
    
    // For demo purposes, allow "password" for specific demo accounts
    const isDemoAccount = ['admin@studiovit.com', 'sarah.johnson@studiovit.com', 'john.smith@email.com'].includes(email);
    
    let isValidPassword = false;
    if (isDemoAccount && password === 'password') {
      isValidPassword = true;
    } else if (user.password_hash) {
      isValidPassword = await verifyPassword(password, user.password_hash);
    }

    if (!isValidPassword) {
      return null;
    }

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, specialization, total_points, memo, is_active, created_at')
      .eq('id', id)
      .eq('is_active', true)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      return null;
    }

    return users[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};