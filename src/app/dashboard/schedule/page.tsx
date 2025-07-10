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
    setUserData(parsedUserData);
    
    // Load appointments from localStorage
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }
  }, []);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
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

    // Deduct point
    const updatedUserData = {
      ...userData,
      points: (userData.points || 0) - 1
    };
    setUserData(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));

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

  const getAvailableSlots = () => {
    if (!selectedDate || !selectedTrainer) return [];
    
    const timeSlots = generateTimeSlots();
    return timeSlots.filter(time => 
      isTimeSlotAvailable(selectedDate, time, selectedTrainer)
    );
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

    // Refund the point
    if (userData) {
      const updatedUserData = {
        ...userData,
        points: (userData.points || 0) + 1
      };
      setUserData(updatedUserData);
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
    }

    alert('Appointment cancelled successfully. Your point has been refunded.');
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Points: 
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {userData.points || 0}
                </span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setView('my-appointments')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'my-appointments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setView('book')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'book'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Book Appointment
          </button>
        </div>

        {view === 'my-appointments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              My Appointments
            </h2>
            
            {getMyAppointments().length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No appointments scheduled yet.
              </p>
            ) : (
              <div className="space-y-4">
                {getMyAppointments()
                  .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                  .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Training with {appointment.trainerName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'scheduled' 
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Book New Appointment
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Trainer
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {selectedDate && selectedTrainer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Time
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Hour
                      </label>
                      <select
                        value={selectedHour}
                        onChange={(e) => handleHourChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Minute
                      </label>
                      <select
                        value={selectedMinute}
                        onChange={(e) => handleMinuteChange(e.target.value)}
                        disabled={!selectedHour}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      No available time slots for {selectedHour}:00 hour.
                    </p>
                  )}
                  {getAvailableHours().length === 0 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      No available time slots for this date and trainer.
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime || !selectedTrainer || isBooking || (userData.points || 0) < 1}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md"
                >
                  {isBooking ? 'Booking...' : `Book Appointment (1 point)${selectedTime ? ` - ${selectedTime}` : ''}`}
                </button>
                {(userData.points || 0) < 1 && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
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