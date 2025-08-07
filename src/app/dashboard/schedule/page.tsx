'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../../components/DashboardHeader';

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

interface AppointmentLog {
  id: string;
  appointmentId: string;
  action: 'booked' | 'cancelled';
  actionBy: string; // user ID who performed the action
  actionByName: string; // name of who performed the action
  actionByRole: 'user' | 'trainer' | 'admin';
  timestamp: string;
  appointmentDate: string;
  appointmentTime: string;
  trainerId: string;
  trainerName: string;
  userId: string;
  userName: string;
  userEmail: string;
  usedPointBatchId?: string;
  purchaseItemId?: string;
}

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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [view, setView] = useState<'book' | 'my-appointments'>('my-appointments');
  // const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserData = localStorage.getItem('userData');
    
    if (authStatus !== 'true' || !storedUserData) {
      router.push('/login');
      return;
    }
    
    const parsedUserData = JSON.parse(storedUserData);
    
    // Initialize point batches if user doesn't have them yet
    if (!parsedUserData.pointBatches && parsedUserData.points) {
      // Convert existing points to a single batch (for backward compatibility)
      const purchaseDate = new Date().toISOString();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      
      const legacyBatch: PointBatch = {
        id: 'legacy-' + Date.now(),
        points: parsedUserData.points,
        purchaseDate: purchaseDate,
        expiryDate: expiryDate.toISOString(),
        originalPoints: parsedUserData.points
      };
      
      parsedUserData.pointBatches = [legacyBatch];
    }
    
    // Clean up expired batches and recalculate points
    if (parsedUserData.pointBatches) {
      const now = new Date();
      const validBatches = parsedUserData.pointBatches.filter((batch: PointBatch) => 
        new Date(batch.expiryDate) > now
      );
      
      const totalPoints = validBatches.reduce((sum: number, batch: PointBatch) => sum + batch.points, 0);
      
      parsedUserData.pointBatches = validBatches;
      parsedUserData.points = totalPoints;
      
      // Update localStorage with cleaned data
      localStorage.setItem('userData', JSON.stringify(parsedUserData));
    }
    
    setUserData(parsedUserData);
    
    // Load appointments from localStorage
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }
  }, []);

  // Helper function to deduct points using FIFO (oldest first)
  const deductPointFromBatches = (batches: PointBatch[], pointsToDeduct: number): { 
    updatedBatches: PointBatch[], 
    usedBatchId: string | null,
    purchaseItemId: string | null 
  } => {
    const sortedBatches = [...batches].sort((a, b) => 
      new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    );
    
    let remaining = pointsToDeduct;
    const updatedBatches: PointBatch[] = [];
    let usedBatchId: string | null = null;
    let purchaseItemId: string | null = null;
    
    for (const batch of sortedBatches) {
      if (remaining <= 0) {
        updatedBatches.push(batch);
        continue;
      }
      
      // Track the first batch we use points from
      if (remaining === pointsToDeduct && batch.points > 0) {
        usedBatchId = batch.id;
        // Extract purchase item from batch ID or use a default mapping
        purchaseItemId = extractPurchaseItemFromBatch(batch);
      }
      
      if (batch.points <= remaining) {
        // Use entire batch
        remaining -= batch.points;
        // Don't add this batch as it's completely used
      } else {
        // Use partial batch
        updatedBatches.push({
          ...batch,
          points: batch.points - remaining
        });
        remaining = 0;
      }
    }
    
    return { updatedBatches, usedBatchId, purchaseItemId };
  };

  // Helper function to extract purchase item from batch
  const extractPurchaseItemFromBatch = (batch: PointBatch): string => {
    // Try to extract from batch ID patterns
    if (batch.id.includes('legacy')) return 'legacy';
    if (batch.id.includes('starter')) return 'starter';
    if (batch.id.includes('basic')) return 'basic';
    if (batch.id.includes('premium')) return 'premium';
    if (batch.id.includes('pro')) return 'pro';
    
    // Map based on original points (common package sizes)
    switch (batch.originalPoints) {
      case 5: return 'starter';
      case 10: return 'basic';
      case 20: return 'premium';
      case 50: return 'pro';
      default: return 'unknown';
    }
  };

  // Helper function to refund points to the most recent valid batch
  const refundPointToBatches = (batches: PointBatch[]): PointBatch[] => {
    const now = new Date();
    const validBatches = batches.filter(batch => new Date(batch.expiryDate) > now);
    
    if (validBatches.length === 0) {
      // Create a new batch if no valid batches exist
      const refundDate = new Date().toISOString();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      
      return [...batches, {
        id: 'refund-' + Date.now(),
        points: 1,
        purchaseDate: refundDate,
        expiryDate: expiryDate.toISOString(),
        originalPoints: 1
      }];
    }
    
    // Add to most recent valid batch
    const sortedBatches = [...validBatches].sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );
    
    const mostRecentBatch = sortedBatches[0];
    
    return batches.map(batch => 
      batch.id === mostRecentBatch.id 
        ? { ...batch, points: batch.points + 1 }
        : batch
    );
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

    // Deduct point using FIFO (oldest first) and get tracking info
    const deductionResult = deductPointFromBatches(userData.pointBatches || [], 1);
    
    // TODO: Fetch trainer name from database
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      date: selectedDate,
      time: selectedTime,
      trainerId: selectedTrainer,
      trainerName: 'Unknown', // TODO: Get from database
      userId: userData.id,
      userName: userData.name,
      status: 'scheduled',
      usedPointBatchId: deductionResult.usedBatchId || undefined,
      purchaseItemId: deductionResult.purchaseItemId || undefined
    };

    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

    // Log the appointment booking
    const appointmentLog: AppointmentLog = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      appointmentId: newAppointment.id,
      action: 'booked',
      actionBy: userData.id,
      actionByName: userData.name,
      actionByRole: userData.role,
      timestamp: new Date().toISOString(),
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      trainerId: selectedTrainer,
      trainerName: 'Unknown', // TODO: Get from database
      userId: userData.id,
      userName: userData.name,
      userEmail: userData.email,
      usedPointBatchId: deductionResult.usedBatchId || undefined,
      purchaseItemId: deductionResult.purchaseItemId || undefined
    };

    // Save to appointment logs
    const existingLogs = JSON.parse(localStorage.getItem('appointmentLogs') || '[]');
    existingLogs.push(appointmentLog);
    localStorage.setItem('appointmentLogs', JSON.stringify(existingLogs));

    // Use the deduction result from earlier
    const totalPoints = deductionResult.updatedBatches.reduce((sum, batch) => sum + batch.points, 0);
    
    const updatedUserData = {
      ...userData,
      pointBatches: deductionResult.updatedBatches,
      points: totalPoints
    };
    setUserData(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    
    // Also update the user in the allUsers list if it exists
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const updatedAllUsers = allUsers.map((user: UserData) => 
      user.id === userData.id ? updatedUserData : user
    );
    if (updatedAllUsers.some((user: UserData) => user.id === userData.id)) {
      localStorage.setItem('allUsers', JSON.stringify(updatedAllUsers));
    }

    setIsBooking(false);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedHour('');
    setSelectedMinute('');
    setSelectedTrainer('');
    alert('예약이 성공적으로 완료되었습니다!');
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

    // Update appointment status to cancelled
    const updatedAppointments = appointments.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, status: 'cancelled' as const }
        : apt
    );
    
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

    // Refund the point - add to most recent batch that hasn't expired
    if (userData) {
      // Log the appointment cancellation
      const appointmentLog: AppointmentLog = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        appointmentId: appointmentId,
        action: 'cancelled',
        actionBy: userData.id,
        actionByName: userData.name,
        actionByRole: userData.role,
        timestamp: new Date().toISOString(),
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        trainerId: appointment.trainerId,
        trainerName: appointment.trainerName,
        userId: appointment.userId,
        userName: appointment.userName,
        userEmail: userData.email
      };

      // Save to appointment logs
      const existingLogs = JSON.parse(localStorage.getItem('appointmentLogs') || '[]');
      existingLogs.push(appointmentLog);
      localStorage.setItem('appointmentLogs', JSON.stringify(existingLogs));
      const refundedBatches = refundPointToBatches(userData.pointBatches || []);
      const totalPoints = refundedBatches.reduce((sum, batch) => sum + batch.points, 0);
      
      const updatedUserData = {
        ...userData,
        pointBatches: refundedBatches,
        points: totalPoints
      };
      setUserData(updatedUserData);
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      // Also update the user in the allUsers list if it exists
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
      const updatedAllUsers = allUsers.map((user: UserData) => 
        user.id === userData.id ? updatedUserData : user
      );
      if (updatedAllUsers.some((user: UserData) => user.id === userData.id)) {
        localStorage.setItem('allUsers', JSON.stringify(updatedAllUsers));
      }
    }

    alert('예약이 성공적으로 취소되었습니다. 포인트가 환불되었습니다.');
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-black">로딩 중...</p>
        </div>
      </div>
    );
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