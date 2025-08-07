import bcrypt from 'bcrypt';
import { query } from './database';

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
    const result = await query(
      'SELECT id, name, email, phone, role, specialization, total_points, memo, is_active, created_at, password_hash FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    
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
    const result = await query(
      'SELECT id, name, email, phone, role, specialization, total_points, memo, is_active, created_at FROM users WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};