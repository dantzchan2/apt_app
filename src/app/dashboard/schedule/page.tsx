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
}

interface Trainer {
  id: string;
  name: string;
  specialization: string;
}

const trainers: Trainer[] = [
  { id: 'trainer1', name: 'Sarah Johnson', specialization: 'Strength Training' },
  { id: 'trainer2', name: 'Mike Chen', specialization: 'Cardio & HIIT' },
  { id: 'trainer3', name: 'Emma Davis', specialization: 'Yoga & Flexibility' },
  { id: 'trainer4', name: 'David Wilson', specialization: 'CrossFit' }
];

export default function Schedule() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [view, setView] = useState<'book' | 'my-appointments'>('my-appointments');
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
  const deductPointFromBatches = (batches: PointBatch[], pointsToDeduct: number): PointBatch[] => {
    const sortedBatches = [...batches].sort((a, b) => 
      new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    );
    
    let remaining = pointsToDeduct;
    const updatedBatches: PointBatch[] = [];
    
    for (const batch of sortedBatches) {
      if (remaining <= 0) {
        updatedBatches.push(batch);
        continue;
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
    
    return updatedBatches;
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
      alert('You need at least 1 point to book an appointment!');
      return;
    }

    // Check if the selected date and time is in the past or too soon
    const now = new Date();
    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    if (appointmentDateTime <= now) {
      alert('Cannot book appointments in the past. Please select a future date and time.');
      return;
    }
    
    if (appointmentDateTime < oneHourFromNow) {
      alert('Appointments must be booked at least 1 hour in advance. Please select a later time.');
      return;
    }

    setIsBooking(true);

    const trainer = trainers.find(t => t.id === selectedTrainer);
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      date: selectedDate,
      time: selectedTime,
      trainerId: selectedTrainer,
      trainerName: trainer?.name || 'Unknown',
      userId: userData.id,
      userName: userData.name,
      status: 'scheduled'
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
      trainerName: trainer?.name || 'Unknown',
      userId: userData.id,
      userName: userData.name,
      userEmail: userData.email
    };

    // Save to appointment logs
    const existingLogs = JSON.parse(localStorage.getItem('appointmentLogs') || '[]');
    existingLogs.push(appointmentLog);
    localStorage.setItem('appointmentLogs', JSON.stringify(existingLogs));

    // Deduct point using FIFO (oldest first)
    const updatedBatches = deductPointFromBatches(userData.pointBatches || [], 1);
    const totalPoints = updatedBatches.reduce((sum, batch) => sum + batch.points, 0);
    
    const updatedUserData = {
      ...userData,
      pointBatches: updatedBatches,
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
    alert('Appointment booked successfully!');
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
    if (!confirm('Are you sure you want to cancel this appointment? You will get your point back.')) {
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

    alert('Appointment cancelled successfully. Your point has been refunded.');
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader 
        userData={userData} 
        title="Schedule" 
        currentPage="/dashboard/schedule" 
        customUserInfo={
          <>
            Points: 
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
            My Appointments
          </button>
          <button
            onClick={() => setView('book')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'book'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            Book Appointment
          </button>
        </div>

        {view === 'my-appointments' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              My Appointments
            </h2>
            
            {getMyAppointments().length === 0 ? (
              <p className="text-black text-center py-8">
                No appointments scheduled yet.
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
                        Training with {appointment.trainerName}
                      </p>
                      <p className="text-sm text-black">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'scheduled' 
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'completed'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'scheduled' && canCancelAppointment(appointment.date) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        >
                          Cancel
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
              Book New Appointment
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Select Trainer
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 "
                >
                  <option value="">Choose a trainer...</option>
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} - {trainer.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Select Date
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
                    Select Time
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-black mb-1">
                        Hour
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
                        Minute
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
                      No available time slots for {selectedHour}:00 hour.
                    </p>
                  )}
                  {getAvailableHours().length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      No available time slots for this date and trainer.
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
                  {isBooking ? 'Booking...' : `Book Appointment (1 point)${selectedTime ? ` - ${selectedTime}` : ''}`}
                </button>
                {(userData.points || 0) < 1 && (
                  <p className="mt-2 text-sm text-red-600">
                    You need at least 1 point to book an appointment. 
                    <Link href="/dashboard/purchase" className="ml-1 underline">
                      Purchase points here
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