'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '../../../components/DashboardHeader';
import { useAuth } from '../../../hooks/useAuth';

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
  date: string;
  time: string;
  trainerId: string;
  trainerName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  usedPointBatchId?: string;
  purchaseItemId?: string;
}

// interface AppointmentLog {
//   id: string;
//   appointmentId: string;
//   action: 'booked' | 'cancelled';
//   actionBy: string; // user ID who performed the action
//   actionByName: string; // name of who performed the action
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

// interface Trainer {
//   id: string;
//   name: string;
//   specialization: string;
// }

// Hardcoded trainers for now - TODO: Load from database
const hardcodedTrainers = [
  { id: '11111111-1111-4111-a111-111111111111', name: 'Sarah Johnson', specialization: 'Strength & Conditioning' },
  { id: '22222222-2222-4222-a222-222222222222', name: 'Mike Chen', specialization: 'Cardio & Endurance' },
  { id: '33333333-3333-4333-a333-333333333333', name: 'Emma Rodriguez', specialization: 'Yoga & Flexibility' },
  { id: '44444444-4444-4444-a444-444444444444', name: 'Alex Thompson', specialization: 'CrossFit' },
  { id: '55555555-5555-4555-a555-555555555555', name: 'Lisa Park', specialization: 'Pilates' }
];

export default function Schedule() {
  const { user, isLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [view, setView] = useState<'book' | 'my-appointments'>('my-appointments');

  useEffect(() => {
    if (!user) return;
    
    // Convert user from auth to userData format
    const parsedUserData = {
      ...user,
      points: user.total_points,
      pointBatches: [] as PointBatch[]
    };
    
    setUserData(parsedUserData);
    
    // Load appointments from API
    fetchAppointments();
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
          status: apt.status,
          usedPointBatchId: apt.used_point_batch_id,
          purchaseItemId: apt.purchase_item_id
        }));
        setAppointments(transformedAppointments);
      } else {
        console.error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };



  const generateHours = () => {
    const hours = [];
    for (let hour = 6; hour < 22; hour++) {
      hours.push(hour.toString().padStart(2, '0'));
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let minute = 0; minute < 60; minute += 10) {
      minutes.push(minute.toString().padStart(2, '0'));
    }
    return minutes;
  };

  const isTimeSlotAvailable = (date: string, time: string, trainerId: string) => {
    // Check if slot is already booked
    const isBooked = appointments.some(apt => 
      apt.date === date && 
      apt.time === time && 
      apt.trainerId === trainerId &&
      apt.status !== 'cancelled'
    );
    
    if (isBooked) return false;
    
    // Check if the time slot is in the past or too soon (1 hour advance required)
    const now = new Date();
    const slotDateTime = new Date(`${date}T${time}:00`);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return slotDateTime >= oneHourFromNow;
  };

  const handleBookAppointment = async () => {
    if (!userData || !selectedDate || !selectedTime || !selectedTrainer) return;
    
    if ((userData.points || 0) < 1) {
      alert('예약하려면 최소 1포인트가 필요합니다!');
      return;
    }

    // Check if the selected date and time is in the past or too soon
    const now = new Date();
    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    if (appointmentDateTime <= now) {
      alert('과거 시간으로는 예약할 수 없습니다. 미래 날짜와 시간을 선택해주세요.');
      return;
    }
    
    if (appointmentDateTime < oneHourFromNow) {
      alert('예약은 최소 1시간 전에 해야 합니다. 더 늦은 시간을 선택해주세요.');
      return;
    }

    setIsBooking(true);
    
    try {
      // Create appointment via API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: userData.id,
          userName: userData.name,
          userEmail: userData.email,
          trainerId: selectedTrainer,
          date: selectedDate,
          time: selectedTime,
          notes: 'Appointment booking'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      // Refresh appointments from server
      await fetchAppointments();

      // Update user points in local state (subtract 1 point)
      const updatedUserData = {
        ...userData,
        points: (userData.points || 0) - 1
      };
      setUserData(updatedUserData);

      alert('예약이 성공적으로 완료되었습니다!');
    } catch (error) {
      console.error('Booking error:', error);
      alert(`예약 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsBooking(false);
      setSelectedDate('');
      setSelectedTime('');
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedTrainer('');
    }
  };

  const getMyAppointments = () => {
    if (!userData) return [];
    return appointments.filter(apt => apt.userId === userData.id);
  };


  const getAvailableHours = () => {
    if (!selectedDate || !selectedTrainer) return generateHours();
    
    const availableHours = [];
    const hours = generateHours();
    
    for (const hour of hours) {
      // Check if any minute slot is available for this hour
      const hasAvailableMinute = generateMinutes().some(minute => {
        const time = `${hour}:${minute}`;
        return isTimeSlotAvailable(selectedDate, time, selectedTrainer);
      });
      
      if (hasAvailableMinute) {
        availableHours.push(hour);
      }
    }
    
    return availableHours;
  };

  const getAvailableMinutes = () => {
    if (!selectedDate || !selectedTrainer || !selectedHour) return generateMinutes();
    
    const minutes = generateMinutes();
    return minutes.filter(minute => {
      const time = `${selectedHour}:${minute}`;
      return isTimeSlotAvailable(selectedDate, time, selectedTrainer);
    });
  };

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    setSelectedMinute('');
    setSelectedTime('');
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);
    if (selectedHour && minute) {
      const time = `${selectedHour}:${minute}`;
      setSelectedTime(time);
    }
  };

  const canCancelAppointment = (appointmentDate: string) => {
    const today = new Date();
    const appointment = new Date(appointmentDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    appointment.setHours(0, 0, 0, 0);
    
    // Can cancel if appointment is in the future (not today or past)
    return appointment.getTime() > today.getTime();
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('정말로 이 예약을 취소하시겠습니까? 포인트가 환불됩니다.')) {
      return;
    }

    // Find the appointment
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    try {
      // Update appointment status via API
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

      // Refund the point in local state (add 1 point back)
      if (userData) {
        const updatedUserData = {
          ...userData,
          points: (userData.points || 0) + 1
        };
        setUserData(updatedUserData);
      }

      alert('예약이 성공적으로 취소되었습니다. 포인트가 환불되었습니다.');
    } catch (error) {
      console.error('Cancellation error:', error);
      alert(`취소 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    }
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

  if (!user || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader 
        userData={userData} 
        title="예약 관리" 
        currentPage="/dashboard/schedule" 
        customUserInfo={
          <>
            포인트: 
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              {userData.points || 0}
            </span>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setView('my-appointments')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'my-appointments'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            내 예약
          </button>
          <button
            onClick={() => setView('book')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'book'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            예약하기
          </button>
        </div>

        {view === 'my-appointments' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              내 예약 현황
            </h2>
            
            {getMyAppointments().length === 0 ? (
              <p className="text-black text-center py-8">
                예약된 세션이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {getMyAppointments()
                  .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                  .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-lg gap-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black">
                        {appointment.trainerName} 트레이너와 세션
                      </p>
                      <p className="text-sm text-black">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'scheduled' 
                          ? 'bg-gray-100 text-gray-800'
                          : appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status === 'scheduled' ? '예약됨' : appointment.status === 'completed' ? '완료됨' : '취소됨'}
                      </span>
                      {appointment.status === 'scheduled' && canCancelAppointment(appointment.date) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'book' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              새 예약하기
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  트레이너 선택
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 "
                >
                  <option value="">트레이너를 선택해주세요...</option>
                  {hardcodedTrainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} - {trainer.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  날짜 선택
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300  rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 "
                />
              </div>

              {selectedDate && selectedTrainer && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    시간 선택
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-black mb-1">
                        시
                      </label>
                      <select
                        value={selectedHour}
                        onChange={(e) => handleHourChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300  rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 "
                      >
                        <option value="">--</option>
                        {getAvailableHours().map(hour => (
                          <option key={hour} value={hour}>
                            {hour}:00
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-black mb-1">
                        분
                      </label>
                      <select
                        value={selectedMinute}
                        onChange={(e) => handleMinuteChange(e.target.value)}
                        disabled={!selectedHour}
                        className="w-full px-3 py-2 border border-gray-300  rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500  disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">--</option>
                        {selectedHour && getAvailableMinutes().map(minute => (
                          <option key={minute} value={minute}>
                            :{minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedHour && getAvailableMinutes().length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      {selectedHour}:00 시간대에 예약 가능한 시간이 없습니다.
                    </p>
                  )}
                  {getAvailableHours().length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      선택한 날짜와 트레이너에게 예약 가능한 시간이 없습니다.
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime || !selectedTrainer || isBooking || (userData.points || 0) < 1}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md"
                >
                  {isBooking ? '예약 중...' : `예약하기 (1 포인트)${selectedTime ? ` - ${selectedTime}` : ''}`}
                </button>
                {(userData.points || 0) < 1 && (
                  <p className="mt-2 text-sm text-red-600">
                    예약하려면 최소 1포인트가 필요합니다. 
                    <Link href="/dashboard/purchase" className="ml-1 underline">
                      포인트 구매하기
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}