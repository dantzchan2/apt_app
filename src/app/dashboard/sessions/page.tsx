'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import { useAuth } from '../../../hooks/useAuth';

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
  duration_minutes?: number;
  trainerId: string;
  trainerName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  usedPointBatchId?: string;
  purchaseItemId?: string;
}

export default function UserSessions() {
  const { user, isLoading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'user') {
      router.push('/dashboard');
      return;
    }
    
    const userData = {
      ...user,
      points: user.total_points
    };
    setUserData(userData);
    
    // Load appointments from API
    fetchAppointments();
    
    setIsLoading(false);
  }, [user, router]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('User appointments response:', data);
        const transformedAppointments = (data.appointments || []).map((apt: Record<string, unknown>) => ({
          id: apt.id,
          userId: apt.user_id,
          userName: apt.user_name,
          userEmail: apt.user_email,
          trainerId: apt.trainer_id,
          trainerName: apt.trainer_name,
          date: apt.appointment_date || apt.date,
          time: (apt.appointment_time || apt.time)?.toString().substring(0, 5), // Remove seconds: HH:MM:SS -> HH:MM
          status: apt.status,
          duration_minutes: apt.duration_minutes,
          usedPointBatchId: apt.used_point_batch_id,
          purchaseItemId: apt.purchase_item_id
        }));
        console.log('Processed user appointments:', transformedAppointments);
        setAppointments(transformedAppointments);
      } else {
        console.error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const getMyAppointments = () => {
    if (!userData) return [];
    return appointments.filter(apt => apt.userId === userData.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">완료</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">취소</span>;
      case 'no_show':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">노쇼</span>;
      case 'scheduled':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">예정</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    return ` (${minutes}분)`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-black">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
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
    apt.status === 'no_show' ||
    (apt.status === 'scheduled' && new Date(`${apt.date}T${apt.time}:00`) < new Date())
  );

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader 
        userData={userData} 
        title="내 세션 기록" 
        currentPage="/dashboard/sessions" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-yellow-800 mb-2">🐛 Debug Info</h3>
            <div className="text-xs space-y-1 text-yellow-700">
              <p>User: {userData?.name} ({userData?.email}) - Role: {userData?.role}</p>
              <p>User ID: {userData?.id}</p>
              <p>Total Appointments Fetched: {appointments.length}</p>
              <p>My Appointments (filtered): {myAppointments.length}</p>
              <p>Upcoming: {upcomingAppointments.length}, Past: {pastAppointments.length}</p>
            </div>
            {appointments.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-yellow-800 cursor-pointer">View Raw Appointments</summary>
                <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                  {JSON.stringify(appointments.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
        <div className="space-y-8">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              예정된 세션 ({upcomingAppointments.length}건)
            </h2>
            
            {upcomingAppointments.length === 0 ? (
              <p className="text-black dark:text-gray-400 text-center py-8">
                예정된 세션이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments
                  .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                  .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black">
                        {appointment.trainerName} 트레이너
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(appointment.date)} {appointment.time}{formatDuration(appointment.duration_minutes)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
              <span className="w-3 h-3 bg-gray-500 rounded-full mr-3"></span>
              지난 세션 ({pastAppointments.length}건)
            </h2>
            
            {pastAppointments.length === 0 ? (
              <p className="text-black dark:text-gray-400 text-center py-8">
                지난 세션 기록이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {pastAppointments
                  .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                  .map((appointment) => {
                    const isCompleted = appointment.status === 'completed';
                    const isCancelled = appointment.status === 'cancelled';
                    const isNoShow = appointment.status === 'no_show';
                    const isPastScheduled = appointment.status === 'scheduled' && new Date(`${appointment.date}T${appointment.time}:00`) < new Date();
                    
                    let bgColor = 'bg-gray-50';
                    let borderColor = 'border-gray-200';
                    
                    if (isCompleted) {
                      bgColor = 'bg-green-50';
                      borderColor = 'border-green-200';
                    } else if (isCancelled) {
                      bgColor = 'bg-red-50';
                      borderColor = 'border-red-200';
                    } else if (isNoShow) {
                      bgColor = 'bg-orange-50';
                      borderColor = 'border-orange-200';
                    }
                    
                    return (
                      <div
                        key={appointment.id}
                        className={`flex justify-between items-center p-4 ${bgColor} rounded-lg border ${borderColor}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-black">
                            {appointment.trainerName} 트레이너
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(appointment.date)} {appointment.time}{formatDuration(appointment.duration_minutes)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(isPastScheduled ? 'completed' : appointment.status)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              세션 통계
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{myAppointments.length}</p>
                <p className="text-sm text-gray-600">총 세션</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {pastAppointments.filter(apt => apt.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">완료된 세션</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {pastAppointments.filter(apt => apt.status === 'cancelled').length}
                </p>
                <p className="text-sm text-gray-600">취소된 세션</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {pastAppointments.filter(apt => apt.status === 'no_show').length}
                </p>
                <p className="text-sm text-gray-600">노쇼 세션</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}