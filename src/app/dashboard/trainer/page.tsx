'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  points?: number;
  id: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  trainerId: string;
  trainerName: string;
  userId: string;
  userName: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function TrainerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserData = localStorage.getItem('userData');
    
    if (authStatus !== 'true' || !storedUserData) {
      router.push('/login');
      return;
    }
    
    const parsedUserData = JSON.parse(storedUserData);
    if (parsedUserData.role !== 'trainer' && parsedUserData.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setUserData(parsedUserData);
    
    // Load appointments from localStorage
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }
    
    setIsLoading(false);
  }, []);

  const getMyAppointments = () => {
    if (!userData) return [];
    return appointments.filter(apt => apt.trainerId === userData.id);
  };

  const canCancelAppointment = (appointmentDate: string, appointmentTime: string) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    return appointmentDateTime >= twoHoursFromNow;
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? The client will be refunded their point.')) {
      return;
    }

    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    // Update appointment status to cancelled
    const updatedAppointments = appointments.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, status: 'cancelled' as const }
        : apt
    );
    
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

    // Refund the point to the user
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const updatedUsers = allUsers.map((user: UserData) => 
      user.id === appointment.userId 
        ? { ...user, points: (user.points || 0) + 1 }
        : user
    );
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

    // If the cancelled appointment was for the current user (admin), update their data too
    if (userData && userData.role === 'admin' && userData.id === appointment.userId) {
      const updatedUserData = {
        ...userData,
        points: (userData.points || 0) + 1
      };
      setUserData(updatedUserData);
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
    }

    alert('Appointment cancelled successfully. The client has been refunded their point.');
  };

  const markAsCompleted = (appointmentId: string) => {
    const updatedAppointments = appointments.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, status: 'completed' as const }
        : apt
    );
    
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    
    alert('Appointment marked as completed!');
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

  const myAppointments = getMyAppointments();
  const upcomingAppointments = myAppointments.filter(apt => 
    apt.status === 'scheduled' && 
    new Date(`${apt.date}T${apt.time}:00`) >= new Date()
  );
  const pastAppointments = myAppointments.filter(apt => 
    apt.status === 'completed' || 
    apt.status === 'cancelled' ||
    (apt.status === 'scheduled' && new Date(`${apt.date}T${apt.time}:00`) < new Date())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader 
        userData={userData} 
        title="My Training Sessions" 
        currentPage="/dashboard/trainer" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              Upcoming Sessions ({upcomingAppointments.length})
            </h2>
            
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No upcoming training sessions.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments
                  .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                  .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Training with {appointment.userName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(appointment.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {appointment.status}
                      </span>
                      {canCancelAppointment(appointment.date, appointment.time) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {new Date(`${appointment.date}T${appointment.time}:00`) <= new Date() && appointment.status === 'scheduled' && (
                        <button
                          onClick={() => markAsCompleted(appointment.id)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-3 h-3 bg-gray-500 rounded-full mr-3"></span>
              Past Sessions ({pastAppointments.length})
            </h2>
            
            {pastAppointments.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No past training sessions.
              </p>
            ) : (
              <div className="space-y-4">
                {pastAppointments
                  .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                  .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Training with {appointment.userName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(appointment.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'completed' 
                          ? 'bg-blue-100 text-blue-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status === 'scheduled' ? 'missed' : appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}