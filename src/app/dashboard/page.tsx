'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../components/DashboardHeader';

interface PointBatch {
  id: string;
  points: number;
  purchaseDate: string;
  expiryDate: string;
  originalPoints: number;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  points?: number;
  pointBatches?: PointBatch[];
  id: string;
}

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  trainerId: string;
  trainerName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
          
          // Initialize point batches if user doesn't have them yet (only for true legacy users)
          if (!parsedData.pointBatches && parsedData.points && typeof parsedData.points === 'number') {
            // Convert existing points to a single batch (for backward compatibility)
            const purchaseDate = new Date().toISOString();
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 6);
            
            const legacyBatch: PointBatch = {
              id: 'legacy-' + Date.now(),
              points: parsedData.points,
              purchaseDate: purchaseDate,
              expiryDate: expiryDate.toISOString(),
              originalPoints: parsedData.points
            };
            
            parsedData.pointBatches = [legacyBatch];
          }
          
          // Clean up expired batches and recalculate points
          if (parsedData.pointBatches) {
            const now = new Date();
            const validBatches = parsedData.pointBatches.filter((batch: PointBatch) => 
              new Date(batch.expiryDate) > now
            );
            
            const totalPoints = validBatches.reduce((sum: number, batch: PointBatch) => sum + batch.points, 0);
            
            parsedData.pointBatches = validBatches;
            parsedData.points = totalPoints;
            
            // Update localStorage with cleaned data
            localStorage.setItem('userData', JSON.stringify(parsedData));
          }
          
          setUserData(parsedData);

          // Load appointments
          const storedAppointments = localStorage.getItem('appointments');
          if (storedAppointments) {
            setAppointments(JSON.parse(storedAppointments));
          }

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


  const getUpcomingAppointments = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    return appointments.filter(appointment => {
      if (appointment.status !== 'scheduled') return false;

      const appointmentDate = appointment.date;
      const appointmentTime = appointment.time;

      if (appointmentDate > today) return true;
      if (appointmentDate === today && appointmentTime >= currentTime) return true;

      return false;
    }).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  };

  const getUserAppointments = () => {
    if (!userData) return [];
    return getUpcomingAppointments().filter(appointment =>
      userData.role === 'user' ? appointment.userId === userData.id : appointment.trainerId === userData.id
    );
  };

  const formatDateTime = (date: string, time: string) => {
    const appointmentDate = new Date(date + 'T' + time);
    return appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
      <DashboardHeader 
        userData={userData} 
        title="Dashboard" 
        currentPage="/dashboard" 
        showPoints={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Appointments Section for Users and Trainers */}
        {(userData.role === 'user' || userData.role === 'trainer') && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {userData.role === 'user' ? 'Your Upcoming Appointments' : 'Your Upcoming Training Sessions'}
                </h2>
              </div>
              <div className="p-6">
                {getUserAppointments().length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No upcoming {userData.role === 'user' ? 'appointments' : 'training sessions'} scheduled.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {getUserAppointments().slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">📅</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {userData.role === 'user' ? `Training with ${appointment.trainerName}` : `Session with ${appointment.userName}`}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDateTime(appointment.date, appointment.time)}
                            </p>
                            {userData.role === 'user' && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {appointment.userEmail}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Scheduled
                        </span>
                      </div>
                    ))}
                    {getUserAppointments().length > 5 && (
                      <div className="text-center pt-4">
                        <Link
                          href={userData.role === 'user' ? '/dashboard/schedule' : '/dashboard/trainer'}
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          View all {getUserAppointments().length} {userData.role === 'user' ? 'appointments' : 'sessions'}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Appointments Section for Admins */}
        {userData.role === 'admin' && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Scheduled Appointments ({getUpcomingAppointments().length})
                </h2>
              </div>
              <div className="p-6">
                {getUpcomingAppointments().length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No upcoming appointments scheduled.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {getUpcomingAppointments().slice(0, 10).map((appointment) => (
                      <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">📅</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {appointment.userName} → {appointment.trainerName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDateTime(appointment.date, appointment.time)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {appointment.userEmail}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Scheduled
                        </span>
                      </div>
                    ))}
                    {getUpcomingAppointments().length > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Showing 10 of {getUpcomingAppointments().length} upcoming appointments
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {(userData.role === 'user' || userData.role === 'admin') && (
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
          )}

          {(userData.role === 'user' || userData.role === 'admin') && (
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
          )}

          {(userData.role === 'trainer' || userData.role === 'admin') && (
            <Link href="/dashboard/trainer" className="block">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">💪</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Training Sessions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View and manage your appointments</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {userData.role === 'admin' && (
            <Link href="/dashboard/users" className="block">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Users</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View all users and assign trainer roles</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {userData.role === 'admin' && (
            <Link href="/dashboard/appointments" className="block">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">📋</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Logs</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View all appointment bookings and cancellations</p>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

    </div>
  );
}