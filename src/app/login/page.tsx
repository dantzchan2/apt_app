'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Demo authentication - in a real app, this would call an API
    let userData = null;
    
    if (email === 'admin@aptapp.com' && password === 'password') {
      userData = {
        name: 'Admin User',
        email: 'admin@aptapp.com',
        role: 'admin' as const,
        points: 100,
        id: 'admin123'
      };
    } else if (email === 'trainer@aptapp.com' && password === 'password') {
      userData = {
        name: 'Sarah Johnson',
        email: 'trainer@aptapp.com',
        role: 'trainer' as const,
        id: 'trainer1'
      };
    } else if (email === 'user@aptapp.com' && password === 'password') {
      userData = {
        name: 'Regular User',
        email: 'user@aptapp.com',
        role: 'user' as const,
        points: 10,
        id: 'user123'
      };
    }
    
    if (userData) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
      router.push('/dashboard');
    } else {
      setError('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-bold text-black">Studio Vit</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-black">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-black">
            Try different user types with demo credentials below
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white text-black"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white text-black"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link href="/signup" className="text-sm text-orange-600 hover:text-orange-500">
              Don&apos;t have an account? Sign up
            </Link>
            <div>
              <Link href="/" className="text-sm text-black hover:text-gray-700">
                Back to home
              </Link>
            </div>
          </div>
        </form>
        
        <div className="mt-6 p-4 bg-orange-50 rounded-lg">
          <h3 className="text-sm font-medium text-black mb-3">Demo Credentials:</h3>
          <div className="space-y-3 text-sm text-black">
            <div className="border-l-4 border-red-500 pl-3">
              <p><strong>Admin:</strong> admin@aptapp.com / password</p>
              <p className="text-xs">Can purchase points, book appointments, manage training sessions, and manage all users</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-3">
              <p><strong>Trainer:</strong> trainer@aptapp.com / password</p>
              <p className="text-xs">Can view and cancel their training appointments</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-3">
              <p><strong>User:</strong> user@aptapp.com / password</p>
              <p className="text-xs">Can purchase points and book appointments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}