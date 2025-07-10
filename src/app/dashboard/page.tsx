'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  name: string;
  email: string;
  role: 'user' | 'trainer';
  points?: number;
  id: string;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Prevent running on server side
    if (typeof window === 'undefined') return;
    
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserData = localStorage.getItem('userData');
    
    console.log('Dashboard - authStatus:', authStatus);
    console.log('Dashboard - storedUserData:', storedUserData);
    
    if (authStatus === 'true') {
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          console.log('Dashboard - parsed user data:', parsedData);
          setUserData(parsedData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userData');
          router.replace('/login');
        }
      } else {
        console.log('Dashboard - No user data found, redirecting to login');
        localStorage.removeItem('isAuthenticated');
        router.replace('/login');
      }
    } else {
      console.log('Dashboard - Not authenticated, redirecting to login');
      setIsLoading(false);
      router.replace('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" suppressHydrationWarning>
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ScheduleApp</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Welcome {userData.name}!
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {userData.points || 0} points
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/purchase" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">$</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Points</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Buy points to schedule appointments</p>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/schedule" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule Appointments</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Book appointments with trainers</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}