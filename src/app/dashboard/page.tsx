'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '../../components/DashboardHeader';
import { useAuth } from '../../hooks/useAuth';



interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  trainerId: string;
  trainerName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (user) {
      // Load appointments from API
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match frontend interface
        const transformedAppointments = (data.appointments || []).map((apt: Record<string, unknown>) => ({
          id: apt.id,
          userId: apt.user_id,
          userName: apt.user_name,
          userEmail: apt.user_email,
          trainerId: apt.trainer_id,
          trainerName: apt.trainer_name,
          date: apt.appointment_date || apt.date,
          time: apt.appointment_time || apt.time,
          status: apt.status
        }));
        setAppointments(transformedAppointments);
      } else {
        console.error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };


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
    if (!user) return [];
    return getUpcomingAppointments().filter(appointment =>
      user.role === 'user' ? appointment.userId === user.id : appointment.trainerId === user.id
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-black">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <DashboardHeader 
        userData={{
          ...user,
          points: user.total_points,
          pointBatches: []
        }} 
        title="대시보드" 
        currentPage="/dashboard" 
        showPoints={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Appointments Section for Users and Trainers */}
        {(user.role === 'user' || user.role === 'trainer') && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-black">
                  {user.role === 'user' ? '예정된 예약' : '예정된 트레이닝 세션'}
                </h2>
              </div>
              <div className="p-6">
                {getUserAppointments().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    예정된 {user.role === 'user' ? '예약이' : '트레이닝 세션이'} 없습니다.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {getUserAppointments().slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">📅</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-black">
                              {user.role === 'user' ? `${appointment.trainerName} 트레이너와 PT` : `${appointment.userName}님과 세션`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(appointment.date, appointment.time)}
                            </p>
                            {user.role === 'user' && (
                              <p className="text-xs text-gray-500">
                                {appointment.userEmail}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          예약됨
                        </span>
                      </div>
                    ))}
                    {getUserAppointments().length > 5 && (
                      <div className="text-center pt-4">
                        <Link
                          href={user.role === 'user' ? '/dashboard/schedule' : '/dashboard/trainer'}
                          className="text-orange-600 hover:text-red-600 text-sm font-medium"
                        >
                          전체 {getUserAppointments().length}개 {user.role === 'user' ? '예약' : '세션'} 보기
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
        {user.role === 'admin' && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-black">
                  전체 예약 일정 ({getUpcomingAppointments().length})
                </h2>
              </div>
              <div className="p-6">
                {getUpcomingAppointments().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    예정된 예약이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {getUpcomingAppointments().slice(0, 10).map((appointment) => (
                      <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">📅</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-black">
                              {appointment.userName} → {appointment.trainerName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(appointment.date, appointment.time)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {appointment.userEmail}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          예약됨
                        </span>
                      </div>
                    ))}
                    {getUpcomingAppointments().length > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-gray-500 text-sm">
                          전체 {getUpcomingAppointments().length}개 중 10개 표시
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
          {(user.role === 'user' || user.role === 'admin') && (
            <Link href="/dashboard/schedule" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-black">예약 스케줄</h3>
                    <p className="text-sm text-gray-600">트레이너와 예약을 잡아보세요</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {(user.role === 'user' || user.role === 'admin') && (
            <Link href="/dashboard/purchase" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">$</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-black">포인트 구매</h3>
                    <p className="text-sm text-gray-600">예약을 위한 포인트를 구매하세요</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {(user.role === 'trainer' || user.role === 'admin') && (
            <Link href="/dashboard/trainer" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">💪</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-black">내 트레이닝 세션</h3>
                    <p className="text-sm text-gray-600">예약을 확인하고 관리하세요</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {user.role === 'admin' && (
            <Link href="/dashboard/users" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-black">사용자 관리</h3>
                    <p className="text-sm text-gray-600">모든 사용자를 보고 트레이너 권한을 부여하세요</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {user.role === 'admin' && (
            <Link href="/dashboard/appointments" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">📋</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-black">예약 로그</h3>
                    <p className="text-sm text-gray-600">모든 예약과 취소 내역을 확인하세요</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {user.role === 'admin' && (
            <Link href="/dashboard/settlement" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-black">월별 정산</h3>
                    <p className="text-sm text-gray-600">트레이너 실적과 월별 통계를 확인하세요</p>
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