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
  trainerId: string;
  trainerName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  usedPointBatchId?: string;
  purchaseItemId?: string;
}

// interface AppointmentLog {
//   id: string;
//   appointmentId: string;
//   action: 'booked' | 'cancelled';
//   actionBy: string;
//   actionByName: string;
//   actionByRole: 'user' | 'trainer' | 'admin';
//   timestamp: string;
//   appointmentDate: string;
//   appointmentTime: string;
//   trainerId: string;
//   trainerName: string;
//   userId: string;  
//   userName: string;
//   userEmail: string;
//   usedPointBatchId?: string;
//   purchaseItemId?: string;
// }

export default function TrainerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'trainer' && user.role !== 'admin') {
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
        console.log('Trainer appointments response:', data);
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
          usedPointBatchId: apt.used_point_batch_id,
          purchaseItemId: apt.purchase_item_id
        }));
        console.log('Processed trainer appointments:', transformedAppointments);
        setAppointments(transformedAppointments);
      } else {
        console.error('Failed to fetch trainer appointments:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

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
    if (!confirm('정말로 이 예약을 취소하시겠습니까? 고객에게 포인트가 환불됩니다.')) {
      return;
    }

    try {
      // Call API to cancel appointment
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: appointmentId,
          status: 'cancelled'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel appointment');
      }

      // Refresh appointments from server
      await fetchAppointments();

      alert('예약이 성공적으로 취소되었습니다. 고객에게 포인트가 환불되었습니다.');
    } catch (error) {
      console.error('Cancellation error:', error);
      alert(`취소 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  const markAsCompleted = async (appointmentId: string) => {
    try {
      // Call API to mark appointment as completed
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: appointmentId,
          status: 'completed'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark appointment as completed');
      }

      // Refresh appointments from server
      await fetchAppointments();

      alert('예약이 완료로 처리되었습니다!');
    } catch (error) {
      console.error('Mark completed error:', error);
      alert(`완료 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  const markAsNoShow = async (appointmentId: string) => {
    if (!confirm('정말로 이 예약을 노쇼로 처리하시겠습니까? 고객에게 포인트는 환불되지 않습니다.')) {
      return;
    }

    try {
      // Call API to mark appointment as no-show
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: appointmentId,
          status: 'no_show'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark appointment as no-show');
      }

      // Refresh appointments from server
      await fetchAppointments();

      alert('예약이 노쇼로 처리되었습니다. 고객에게 포인트는 환불되지 않습니다.');
    } catch (error) {
      console.error('Mark no-show error:', error);
      alert(`노쇼 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    }
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
    (apt.status === 'scheduled' && new Date(`${apt.date}T${apt.time}:00`) < new Date())
  );

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader 
        userData={userData} 
        title="내 트레이닝 세션" 
        currentPage="/dashboard/trainer" 
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
                예정된 트레이닝 세션이 없습니다.
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
                        {appointment.userName} 회원과 트레이닝
                      </p>
                      <p className="text-sm text-black dark:text-gray-400">
                        {new Date(appointment.date).toLocaleDateString('ko-KR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'scheduled' 
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : appointment.status === 'no_show'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status === 'scheduled' 
                          ? '예약됨' 
                          : appointment.status === 'completed' 
                          ? '완료됨' 
                          : appointment.status === 'no_show'
                          ? '노쇼'
                          : '취소됨'
                        }
                      </span>
                      {canCancelAppointment(appointment.date, appointment.time) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        >
                          취소
                        </button>
                      )}
                      {new Date(`${appointment.date}T${appointment.time}:00`) <= new Date() && appointment.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => markAsCompleted(appointment.id)}
                            className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors"
                          >
                            완료 처리
                          </button>
                          <button
                            onClick={() => markAsNoShow(appointment.id)}
                            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                          >
                            노쇼 처리
                          </button>
                        </>
                      )}
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
                지난 트레이닝 세션이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {pastAppointments
                  .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                  .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black">
                        {appointment.userName} 회원과 트레이닝
                      </p>
                      <p className="text-sm text-black dark:text-gray-400">
                        {new Date(appointment.date).toLocaleDateString('ko-KR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'completed' 
                          ? 'bg-blue-100 text-blue-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : appointment.status === 'no_show'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status === 'scheduled' 
                          ? '미참석' 
                          : appointment.status === 'completed' 
                          ? '완료됨' 
                          : appointment.status === 'no_show'
                          ? '노쇼'
                          : '취소됨'
                        }
                      </span>
                      {appointment.status === 'completed' && (
                        <button
                          onClick={() => markAsNoShow(appointment.id)}
                          className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                        >
                          노쇼로 변경
                        </button>
                      )}
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