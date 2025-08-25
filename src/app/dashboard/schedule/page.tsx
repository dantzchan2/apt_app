'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardHeader, { DashboardHeaderRef } from '../../../components/DashboardHeader';
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

interface UserPointsData {
  totalPoints: number;
  pointsByDuration: {
    30: number;
    60: number;
  };
  batchesByDuration: {
    30: { id: string; product_id: string; remaining_points: number; [key: string]: unknown }[];
    60: { id: string; product_id: string; remaining_points: number; [key: string]: unknown }[];
  };
  expiringPoints: {
    total: number;
    byDuration: {
      30: number;
      60: number;
    };
    earliestExpiry?: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  points: number;
  price: number;
  duration_minutes: number;
  display_order: number;
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

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  trainer_type: 'trainer' | 'head_trainer';
  is_active: boolean;
  created_at: string;
}

// Helper functions for calendar functionality
const getDaysOfWeek = (startDate: Date) => {
  const days = [];
  const start = new Date(startDate);
  // Start from Monday (getDay() returns 0 for Sunday, 1 for Monday, etc.)
  const dayOfWeek = start.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days to Monday
  start.setDate(start.getDate() - daysFromMonday);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour < 22; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const formatDayName = (date: Date) => {
  return date.toLocaleDateString('ko-KR', { weekday: 'short' });
};

const formatDayNumber = (date: Date) => {
  return date.getDate();
};

const isAppointmentCompleted = (date: string, time: string) => {
  const now = new Date();
  const appointmentDateTime = new Date(`${date}T${time}:00`);
  return appointmentDateTime < now;
};

export default function Schedule() {
  const { user, isLoading } = useAuth();
  const headerRef = useRef<DashboardHeaderRef>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPoints, setUserPoints] = useState<UserPointsData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [isBooking, setIsBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, time: string} | null>(null);
  const [, setSelectedDuration] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDurationSelection, setShowDurationSelection] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [trainerAppointments, setTrainerAppointments] = useState<Appointment[]>([]);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<{date: string, time: string, duration_minutes?: number}[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Convert user from auth to userData format
    const parsedUserData = {
      ...user,
      points: user.total_points,
      pointBatches: [] as PointBatch[]
    };
    
    setUserData(parsedUserData);
    
    // Load trainers, appointments, user points, and products from API
    fetchTrainers();
    fetchAllAppointments();
    fetchUserPoints();
    fetchProducts();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Fetch appointments when trainer or week changes
    if (userData && selectedTrainer) {
      fetchAllAppointments();
    }
  }, [selectedTrainer, currentWeekStart, userData]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserPoints = async () => {
    try {
      const response = await fetch('/api/user-points', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data);
      } else {
        console.error('Failed to fetch user points');
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/trainers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const fetchedTrainers = data.trainers || [];
        
        // Filter trainers based on user role
        let availableTrainers = fetchedTrainers;
        if (userData?.role === 'user' && user?.assigned_trainer_id) {
          // For regular users, only show their assigned trainer
          availableTrainers = fetchedTrainers.filter((trainer: Trainer) => trainer.id === user.assigned_trainer_id);
        } else {
          // For admins/trainers, sort by trainer_type (head_trainer first)
          availableTrainers = fetchedTrainers.sort((a: Trainer, b: Trainer) => {
            if (a.trainer_type === 'head_trainer' && b.trainer_type !== 'head_trainer') return -1;
            if (b.trainer_type === 'head_trainer' && a.trainer_type !== 'head_trainer') return 1;
            return a.name.localeCompare(b.name);
          });
        }
        
        setTrainers(availableTrainers);
        
        // Set the appropriate trainer as default
        if (availableTrainers.length > 0 && !selectedTrainer) {
          if (userData?.role === 'user' && user?.assigned_trainer_id) {
            // For regular users, automatically select their assigned trainer
            setSelectedTrainer(user.assigned_trainer_id);
          } else {
            // For admins/trainers, select the first available trainer
            setSelectedTrainer(availableTrainers[0].id);
          }
        }
        
        console.log('Loaded trainers:', availableTrainers);
      } else {
        console.error('Failed to fetch trainers:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const fetchAllAppointments = async () => {
    if (!userData || !selectedTrainer) {
      console.log('Skipping appointment fetch - missing userData or selectedTrainer');
      return;
    }
    
    try {
      // Fetch user's own appointments (all trainers)
      const userResponse = await fetch('/api/appointments', {
        credentials: 'include'
      });
      
      let userAppts: Appointment[] = [];
      if (userResponse.ok) {
        const userResponseData = await userResponse.json();
        console.log('Raw user appointments response:', userResponseData);
        userAppts = (userResponseData.appointments || []).map((apt: Record<string, unknown>) => ({
          id: apt.id,
          userId: apt.user_id,
          userName: apt.user_name,
          userEmail: apt.user_email,
          trainerId: apt.trainer_id,
          trainerName: apt.trainer_name,
          date: apt.appointment_date || apt.date,
          time: (apt.appointment_time || apt.time)?.toString().substring(0, 5), // Remove seconds: HH:MM:SS -> HH:MM
          duration_minutes: apt.duration_minutes || 60,
          status: apt.status,
          usedPointBatchId: apt.used_point_batch_id,
          purchaseItemId: apt.purchase_item_id
        }));
        console.log('Processed user appointments:', userAppts);
        userAppts.forEach((apt, index) => {
          console.log(`Appointment ${index + 1}:`, {
            id: apt.id,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            trainerName: apt.trainerName
          });
        });
      } else {
        console.error('Failed to fetch user appointments:', userResponse.status, await userResponse.text());
      }
      
      let trainerAppts: Appointment[] = [];
      
      let unavailableSlotsList: {date: string, time: string, duration_minutes?: number}[] = [];
      
      // Fetch trainer availability for all users (shows unavailable slots without details)
      if (userData.role === 'admin' || userData.role === 'trainer') {
        // Admins and trainers can see full appointment details
        const trainerResponse = await fetch(`/api/appointments?trainerId=${selectedTrainer}`, {
          credentials: 'include'
        });
        
        if (trainerResponse.ok) {
          const trainerData = await trainerResponse.json();
          console.log('Raw trainer appointments response:', trainerData);
          trainerAppts = (trainerData.appointments || []).map((apt: Record<string, unknown>) => ({
            id: apt.id,
            userId: apt.user_id,
            userName: apt.user_name,
            userEmail: apt.user_email,
            trainerId: apt.trainer_id,
            trainerName: apt.trainer_name,
            date: apt.appointment_date || apt.date,
            time: (apt.appointment_time || apt.time)?.toString().substring(0, 5), // Remove seconds: HH:MM:SS -> HH:MM
            duration_minutes: apt.duration_minutes || 60,
            status: apt.status,
            usedPointBatchId: apt.used_point_batch_id,
            purchaseItemId: apt.purchase_item_id
          }));
          console.log('Processed trainer appointments:', trainerAppts);
        } else {
          console.error('Failed to fetch trainer appointments:', trainerResponse.status, await trainerResponse.text());
        }
      } else {
        // Regular users only see unavailable slots (no details)
        const weekStart = getWeekDays()[0];
        const weekEnd = getWeekDays()[6];

        if (!selectedTrainer) {
          console.log('No trainer selected, skipping availability fetch');
          return;
        }

        const availabilityResponse = await fetch(`/api/trainer-availability?trainerId=${selectedTrainer}&startDate=${formatDateForAPI(weekStart)}&endDate=${formatDateForAPI(weekEnd)}`, {
          credentials: 'include'
        });
        
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          console.log('Trainer availability response:', availabilityData);
          unavailableSlotsList = availabilityData.unavailableSlots || [];
        } else {
          console.error('Failed to fetch trainer availability:', availabilityResponse.status, await availabilityResponse.text());
        }
      }
      
      setUserAppointments(userAppts);
      setTrainerAppointments(trainerAppts);
      setUnavailableSlots(unavailableSlotsList);
      setAppointments([...userAppts, ...trainerAppts]); // Combined for compatibility
      
      console.log('Fetched appointments:', {
        userAppointments: userAppts.length,
        trainerAppointments: trainerAppts.length,
        unavailableSlots: unavailableSlotsList.length,
        userRole: userData?.role,
        selectedTrainer
      });
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Calendar helper functions
  const getWeekDays = () => {
    return getDaysOfWeek(currentWeekStart);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const isTimeSlotAvailable = (date: string, time: string) => {
    // Function to check if an appointment time conflicts with a time slot
    const isTimeInSlot = (appointmentTime: string, slotTime: string, appointmentDuration: number = 60) => {
      if (appointmentTime === slotTime) return true;
      
      // Check if appointment overlaps with the 30-minute slot window
      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const [aptHour, aptMin] = appointmentTime.split(':').map(Number);
      
      const slotStart = slotHour * 60 + slotMin;
      const slotEnd = slotStart + 30; // Calendar slots are always 30 minutes
      const aptStart = aptHour * 60 + aptMin;
      const aptEnd = aptStart + appointmentDuration; // Appointment duration varies
      
      // Check for any overlap between appointment time range and slot time range
      return !(aptEnd <= slotStart || aptStart >= slotEnd);
    };
    
    // Check if user has conflict at this time (any trainer) - always prevent this
    const hasUserConflict = userAppointments.some(apt => 
      apt.date === date && 
      isTimeInSlot(apt.time, time, apt.duration_minutes || 60) && 
      apt.userId === userData?.id &&
      apt.status !== 'cancelled'
    );
    
    if (hasUserConflict) return false;
    
    // Check trainer availability based on user role
    if (userData?.role === 'admin' || userData?.role === 'trainer') {
      // Admins and trainers check full appointment details
      const isTrainerBooked = trainerAppointments.some(apt => 
        apt.date === date && 
        isTimeInSlot(apt.time, time, apt.duration_minutes || 60) && 
        apt.trainerId === selectedTrainer &&
        apt.status !== 'cancelled'
      );
      
      if (isTrainerBooked) return false;
    } else {
      // Regular users check unavailable slots
      const isSlotUnavailable = unavailableSlots.some(slot => 
        slot.date === date && 
        isTimeInSlot(slot.time, time, slot.duration_minutes || 60)
      );
      
      if (isSlotUnavailable) return false;
    }
    
    // Check if the time slot is in the past or too soon (1 hour advance required)
    const now = new Date();
    const slotDateTime = new Date(`${date}T${time}:00`);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return slotDateTime >= oneHourFromNow;
  };

  const isTimeSlotInPast = (date: string, time: string) => {
    const now = new Date();
    const slotDateTime = new Date(`${date}T${time}:00`);
    return slotDateTime < now;
  };

  const getSlotAppointment = (date: string, time: string) => {
    // Function to check if an appointment time conflicts with a time slot
    const isTimeInSlot = (appointmentTime: string, slotTime: string, appointmentDuration: number = 60) => {
      if (appointmentTime === slotTime) return true;
      
      // Check if appointment overlaps with the 30-minute slot window
      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const [aptHour, aptMin] = appointmentTime.split(':').map(Number);
      
      const slotStart = slotHour * 60 + slotMin;
      const slotEnd = slotStart + 30; // Calendar slots are always 30 minutes
      const aptStart = aptHour * 60 + aptMin;
      const aptEnd = aptStart + appointmentDuration; // Appointment duration varies
      
      // Check for any overlap between appointment time range and slot time range
      return !(aptEnd <= slotStart || aptStart >= slotEnd);
    };
    
    // Debug: log what we're searching for
    if (userAppointments.length > 0 && date === formatDateForAPI(getWeekDays()[1]) && time === '08:00') {
      console.log('Searching for slot:', { searchDate: date, searchTime: time });
      console.log('User appointments to search:', userAppointments.map(apt => ({ 
        date: apt.date, 
        time: apt.time, 
        status: apt.status,
        userId: apt.userId,
        currentUserId: userData?.id,
        matchesDate: apt.date === date,
        matchesTime: isTimeInSlot(apt.time, time, apt.duration_minutes || 60)
      })));
    }
    
    // Always check for user's appointment first (any trainer)
    const userApt = userAppointments.find(apt => 
      apt.date === date && 
      isTimeInSlot(apt.time, time, apt.duration_minutes || 60) && 
      apt.userId === userData?.id &&
      apt.status !== 'cancelled'
    );
    
    if (userApt) {
      console.log('Found user appointment:', { date, time, appointment: userApt });

      // Check if appointment should be auto-completed (past appointment time)
      const isCompleted = userApt.status === 'completed' || isAppointmentCompleted(date, userApt.time);

      return {
        type: 'user',
        appointment: {
          ...userApt,
          status: isCompleted ? 'completed' : userApt.status
        }
      };
    }
    
    // Check for trainer availability based on user role
    if (userData?.role === 'admin' || userData?.role === 'trainer') {
      // Admins and trainers see full appointment details
      const trainerApt = trainerAppointments.find(apt => 
        apt.date === date && 
        isTimeInSlot(apt.time, time, apt.duration_minutes || 60) && 
        apt.trainerId === selectedTrainer &&
        apt.status !== 'cancelled'
      );
      
      if (trainerApt) {
        console.log('Found trainer appointment:', { date, time, appointment: trainerApt });
        return { type: 'trainer', appointment: trainerApt };
      }
    } else {
      // Regular users only see unavailable slots (no details)
      const unavailableSlot = unavailableSlots.find(slot => 
        slot.date === date && 
        isTimeInSlot(slot.time, time, slot.duration_minutes || 60)
      );
      
      if (unavailableSlot) {
        console.log('Found unavailable slot:', { date, time, slot: unavailableSlot });
        return { 
          type: 'unavailable', 
          appointment: {
            id: 'unavailable',
            userId: 'unknown',
            userName: 'Unknown',
            userEmail: '',
            trainerId: selectedTrainer,
            trainerName: 'Unknown',
            date: date,
            time: time,
            duration_minutes: 60,
            status: 'unavailable' as const,
            usedPointBatchId: '',
            purchaseItemId: ''
          }
        };
      }
    }
    
    return null;
  };

  const isSecondHalfOf60MinuteSlot = (date: string, time: string) => {
    // Check if this slot is the second half of a 60-minute appointment
    const [hours, minutes] = time.split(':').map(Number);
    const currentSlotMinutes = hours * 60 + minutes;
    
    // Check if there's a 60-minute appointment that started 30 minutes earlier
    const earlierSlotMinutes = currentSlotMinutes - 30;
    const earlierHours = Math.floor(earlierSlotMinutes / 60);
    const earlierMinutes = earlierSlotMinutes % 60;
    const earlierTime = `${earlierHours.toString().padStart(2, '0')}:${earlierMinutes.toString().padStart(2, '0')}`;
    
    const earlierSlot = getSlotAppointment(date, earlierTime);
    return earlierSlot && 
           (earlierSlot.appointment.duration_minutes === 60) && 
           (earlierSlot.appointment.time === earlierTime);
  };

  const handleSlotClick = (date: string, time: string) => {
    if (!userData) return;
    
    // Block booking for admin users - they can only view appointments
    if (userData.role === 'admin') {
      const slot = getSlotAppointment(date, time);
      if (slot && (slot.type === 'user' || slot.type === 'trainer')) {
        // Show appointment details for admin viewing only
        const appointment = slot.appointment;
        const statusText = appointment.status === 'completed' ? '완료됨' : 
                          appointment.status === 'cancelled' ? '취소됨' : 
                          appointment.status === 'no_show' ? '노쇼' : '예약됨';
        alert(`${appointment.userName}님의 ${appointment.trainerName} 트레이너와의 예약\n상태: ${statusText}\n시간: ${appointment.time} (${appointment.duration_minutes || 60}분)`);
      }
      return;
    }
    
    const slot = getSlotAppointment(date, time);
    
    if (slot && slot.type === 'user') {
      // Check if appointment is completed or no-show
      if (slot.appointment.status === 'completed') {
        alert('이미 완료된 예약입니다.');
        return;
      }
      
      if (slot.appointment.status === 'no_show') {
        alert('노쇼 처리된 예약입니다.');
        return;
      }

      // User's own appointment - offer to cancel
      if (canCancelAppointment(date)) {
        if (confirm('이 예약을 취소하시겠습니까? 포인트가 환불됩니다.')) {
          handleCancelAppointment(slot.appointment.id);
        }
      } else {
        alert('예약 취소는 예약 시간 24시간 전까지만 가능합니다.');
      }
      return;
    }
    
    if (slot && slot.type === 'trainer') {
      // Trainer is busy - show info (for admins/trainers)
      alert(`${slot.appointment.trainerName} 트레이너가 이미 예약되어 있습니다.`);
      return;
    }
    
    if (slot && slot.type === 'unavailable') {
      // Slot is unavailable (for regular users) - no details shown
      alert('이 시간대는 예약이 불가능합니다.');
      return;
    }
    
    // Available slot - check available points and show appropriate popup
    if (isTimeSlotAvailable(date, time)) {
      setSelectedSlot({ date, time });
      checkPointsAndShowBookingPopup();
    }
  };

  const checkPointsAndShowBookingPopup = () => {
    if (!userPoints) {
      alert('포인트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const { pointsByDuration } = userPoints;
    const has30MinPoints = pointsByDuration[30] > 0;
    const has60MinPoints = pointsByDuration[60] > 0;

    // If no points at all
    if (!has30MinPoints && !has60MinPoints) {
      alert('예약하려면 포인트가 필요합니다!');
      return;
    }

    // Find products that match user's available point batches
    const getAvailableProductForDuration = (duration: number) => {
      if (!userPoints?.batchesByDuration) return null;
      
      const batches = userPoints.batchesByDuration[duration as 30 | 60];
      if (!batches || batches.length === 0) return null;
      
      // Get the product ID from the first available batch
      const productId = batches[0].product_id;
      return products.find(p => p.id === productId) || null;
    };

    // If only one type of points available, skip duration selection
    if (has30MinPoints && !has60MinPoints) {
      const product = getAvailableProductForDuration(30);
      if (product) {
        setSelectedDuration(30);
        setSelectedProduct(product);
        setShowConfirmation(true);
      } else {
        alert('30분 세션 상품 정보를 찾을 수 없습니다.');
      }
    } else if (has60MinPoints && !has30MinPoints) {
      const product = getAvailableProductForDuration(60);
      if (product) {
        setSelectedDuration(60);
        setSelectedProduct(product);
        setShowConfirmation(true);
      } else {
        alert('60분 세션 상품 정보를 찾을 수 없습니다.');
      }
    } else {
      // Both types of points available - show duration selection
      setShowDurationSelection(true);
    }
  };

  const handleDurationSelect = (duration: number) => {
    // Find the product that matches user's available point batches for this duration
    const getAvailableProductForDuration = (duration: number) => {
      if (!userPoints?.batchesByDuration) return null;
      
      const batches = userPoints.batchesByDuration[duration as 30 | 60];
      if (!batches || batches.length === 0) return null;
      
      // Get the product ID from the first available batch
      const productId = batches[0].product_id;
      return products.find(p => p.id === productId) || null;
    };
    
    const product = getAvailableProductForDuration(duration);
    if (product) {
      setSelectedDuration(duration);
      setSelectedProduct(product);
      setShowDurationSelection(false);
      setShowConfirmation(true);
    } else {
      alert(`${duration}분 세션 상품 정보를 찾을 수 없습니다.`);
    }
  };

  const handleConfirmBooking = () => {
    if (selectedSlot && selectedProduct) {
      setShowConfirmation(false);
      handleBookAppointment(selectedSlot.date, selectedSlot.time, selectedProduct.id);
    }
  };

  const handleCancelBooking = () => {
    setShowDurationSelection(false);
    setShowConfirmation(false);
    setSelectedSlot(null);
    setSelectedDuration(null);
    setSelectedProduct(null);
  };

  const handleBookAppointment = async (date: string, time: string, productId: string) => {
    if (!userData || !selectedTrainer) return;
    
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
          date: date,
          time: time,
          productId: productId,
          notes: 'Calendar booking'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      // Refresh appointments and user points from server
      await fetchAllAppointments();
      await fetchUserPoints();
      
      // Refresh header points display
      await headerRef.current?.refreshPoints();

      alert('예약이 성공적으로 완료되었습니다!');
    } catch (error) {
      console.error('Booking error:', error);
      alert(`예약 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsBooking(false);
      setSelectedSlot(null);
    }
  };

  const getMyAppointments = () => {
    return userAppointments;
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
      await fetchAllAppointments();
      
      // Refresh user points and header display
      await fetchUserPoints();
      await headerRef.current?.refreshPoints();

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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        ref={headerRef}
        userData={userData} 
        title="예약 관리" 
        currentPage="/dashboard/schedule" 
        showPoints={true}
      />

      <main className="max-w-7xl mx-auto px-1 sm:px-4 py-4">
        {/* Trainer Selection - Hidden for regular users */}
        {userData && userData.role !== 'user' && (
          <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              트레이너 선택
            </label>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              disabled={trainers.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {trainers.length === 0 ? (
                <option value="">트레이너 로딩 중...</option>
              ) : (
                trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} - {trainer.specialization}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
        
        {/* Assigned Trainer Display - Show for regular users */}
        {userData && userData.role === 'user' && trainers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              담당 트레이너
            </label>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {trainers[0]?.name?.charAt(0) || 'T'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{trainers[0]?.name}</h3>
                <p className="text-sm text-gray-600">{trainers[0]?.specialization}</p>
              </div>
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek('prev')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              ← 이전 주
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {getWeekDays()[0].toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-sm text-gray-600">
                {getWeekDays()[0].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - {getWeekDays()[6].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              다음 주 →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {trainers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">트레이너 정보를 불러오는 중...</p>
          </div>
        ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Sticky Days Header */}
          <div className="sticky top-0 z-10 grid grid-cols-8 border-b border-gray-200 bg-white shadow-sm">
            <div className="sticky left-0 z-20 px-1 py-3 text-xs font-medium text-gray-500 text-center bg-gray-50 border-r border-gray-200">
              시간
            </div>
            {getWeekDays().map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
              const isSaturday = dayOfWeek === 6;
              const isSunday = dayOfWeek === 0;
              
              // Determine colors based on day of week
              let dayNameColor = 'text-gray-700';
              let dayNumberColor = 'text-gray-900';
              
              if (isToday) {
                dayNameColor = 'text-orange-600';
                dayNumberColor = 'text-orange-600';
              } else if (isSaturday) {
                dayNameColor = 'text-blue-600';
                dayNumberColor = 'text-blue-600';
              } else if (isSunday) {
                dayNameColor = 'text-red-600';
                dayNumberColor = 'text-red-600';
              }
              
              return (
                <div key={index} className={`px-1 py-3 text-center border-l border-gray-200 ${
                  isToday ? 'bg-orange-50' : 'bg-gray-50'
                }`}>
                  <div className={`text-xs font-medium ${dayNameColor}`}>
                    {formatDayName(day)}
                  </div>
                  <div className={`text-sm font-bold mt-1 ${dayNumberColor}`}>
                    {formatDayNumber(day)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrollable Time Slots Grid */}
          <div className="relative max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {generateTimeSlots().map((timeSlot, timeIndex) => (
              <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-100">
                {/* Sticky Time Label */}
                <div className="sticky left-0 z-5 px-2 py-3 text-xs text-gray-500 bg-gray-50 border-r border-gray-200 text-center font-medium">
                  {timeSlot}
                </div>
                
                {/* Day Columns */}
                {getWeekDays().map((day, dayIndex) => {
                  const dateStr = formatDateForAPI(day);
                  const slotData = getSlotAppointment(dateStr, timeSlot);
                  const isAvailable = isTimeSlotAvailable(dateStr, timeSlot);
                  const isInPast = isTimeSlotInPast(dateStr, timeSlot);
                  const isUserAppointment = slotData?.type === 'user';
                  const isCompletedAppointment = isUserAppointment && slotData?.appointment.status === 'completed';
                  const isNoShowAppointment = isUserAppointment && slotData?.appointment.status === 'no_show';
                  const isTrainerBusy = slotData?.type === 'trainer';
                  const isUnavailable = slotData?.type === 'unavailable';
                  const isSlotBooking = selectedSlot?.date === dateStr && selectedSlot?.time === timeSlot;
                  
                  // Check if this is the second half of a 60-minute slot
                  const isSecondHalf = isSecondHalfOf60MinuteSlot(dateStr, timeSlot);
                  
                  // For second half slots, show only background color but no content
                  if (isSecondHalf) {
                    return (
                      <div
                        key={`${dayIndex}-${timeIndex}`}
                        className="relative px-1 py-3 border-l border-gray-200 transition-colors min-h-[48px] bg-gray-300 cursor-not-allowed"
                      >
                        {/* Empty - this is part of a 60-minute appointment above */}
                      </div>
                    );
                  }
                  
                  
                  return (
                    <div
                      key={`${dayIndex}-${timeIndex}`}
                      className={`relative px-1 py-3 border-l border-gray-200 transition-colors min-h-[48px] ${
                        isCompletedAppointment
                          ? 'bg-blue-100 cursor-default'
                          : isNoShowAppointment
                          ? 'bg-orange-100 cursor-default'
                          : isUserAppointment
                          ? 'bg-green-100 hover:bg-green-200 cursor-pointer'
                          : isTrainerBusy
                            ? 'bg-gray-500 cursor-default'
                            : isUnavailable
                              ? 'bg-gray-500 cursor-not-allowed'
                              : isInPast
                                ? 'bg-gray-400 cursor-not-allowed'
                          : isAvailable
                          ? 'bg-white hover:bg-orange-50 cursor-pointer'
                                  : 'bg-gray-500 cursor-not-allowed'
                      } ${
                        isSlotBooking ? 'bg-orange-200' : ''
                      }`}
                      onClick={() => handleSlotClick(dateStr, timeSlot)}
                    >
                      {slotData && (
                        <div className={`text-xs p-1 rounded text-center leading-tight ${
                          isCompletedAppointment
                            ? 'bg-blue-600 text-white font-medium'
                            : isNoShowAppointment
                            ? 'bg-orange-600 text-white font-medium'
                            : isUserAppointment
                            ? 'bg-green-600 text-white'
                            : isUnavailable
                              ? 'bg-gray-600 text-white font-medium'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {isCompletedAppointment
                            ? `완료 (${slotData.appointment.duration_minutes || 60}분)`
                            : isNoShowAppointment
                            ? `노쇼 (${slotData.appointment.duration_minutes || 60}분)`
                            : isUserAppointment
                              ? `${slotData.appointment.trainerName} (${slotData.appointment.duration_minutes || 60}분)`
                            : isUnavailable
                            ? '예약됨'
                                : `${slotData?.appointment.userName?.split(' ')[0] || '예약됨'} (${slotData?.appointment.duration_minutes || 60}분)`
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Legend and Instructions */}
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">예약 가이드</h3>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-dashed border-orange-300 rounded"></div>
              <span className="text-gray-600">예약 가능 - 탭하여 예약</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">내 예약 - 탭하여 취소</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span className="text-gray-600">완료된 예약</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 rounded"></div>
              <span className="text-gray-600">노쇼 처리된 예약</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-700 rounded"></div>
              <span className="text-gray-600">
                {(userData?.role === 'admin' || userData?.role === 'trainer')
                  ? '다른 고객 예약'
                  : '예약 불가 시간'
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-black rounded"></div>
              <span className="text-gray-600">지난 시간</span>
            </div>
          </div>
          
          {userData?.role === 'user' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                💡 일반 사용자는 예약 불가 시간대만 표시되며, 고객 정보는 비공개입니다. 회색 슬롯은 다른 고객이 예약한 시간입니다.
              </p>
            </div>
          )}
          
          {(userData.points || 0) < 1 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                예약하려면 최소 1포인트가 필요합니다. 
                <Link href="/dashboard/purchase" className="ml-1 underline font-medium">
                  포인트 구매하기
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-yellow-800 mb-2">🐛 Debug Info</h3>
            <div className="text-xs space-y-1 text-yellow-700">
              <p>User: {userData?.name} ({userData?.email}) - Role: {userData?.role}</p>
              <p>User Appointments: {userAppointments.length}</p>
              <p>Total Trainers: {trainers.length}</p>
              <p>Trainer Appointments: {trainerAppointments.length}</p>
              <p>Unavailable Slots: {unavailableSlots.length}</p>
              <p>Selected Trainer: {trainers.find(t => t.id === selectedTrainer)?.name}</p>
              <p>Current Week: {getWeekDays()[0].toLocaleDateString()} - {getWeekDays()[6].toLocaleDateString()}</p>
              <p>Week Days (API format): {getWeekDays().map(d => formatDateForAPI(d)).join(', ')}</p>
            </div>
            {userAppointments.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-yellow-800 cursor-pointer">View Raw Appointments</summary>
                <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                  {JSON.stringify(userAppointments.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* My Appointments Summary */}
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">내 예약 현황 ({getMyAppointments().length}건)</h3>
          {getMyAppointments().length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              예약된 세션이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {getMyAppointments()
                .filter(apt => apt.status === 'scheduled')
                .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                .slice(0, 3)
                .map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.trainerName} 트레이너
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(appointment.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })} {appointment.time}
                    </p>
                  </div>
                  {canCancelAppointment(appointment.date) && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                    >
                      취소
                    </button>
                  )}
                </div>
              ))}
              {getMyAppointments().filter(apt => apt.status === 'scheduled').length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{getMyAppointments().filter(apt => apt.status === 'scheduled').length - 3}건 더 있음
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Full Page Loading Overlay */}
      {isBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">예약 처리 중...</p>
            <p className="text-sm text-gray-600 mt-2">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* Duration Selection Popup */}
      {showDurationSelection && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              세션 시간을 선택하세요
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {new Date(selectedSlot.date).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })} {selectedSlot.time}
            </p>
            
            <div className="space-y-3">
              {userPoints && userPoints.pointsByDuration[30] > 0 && (
                <button
                  onClick={() => handleDurationSelect(30)}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">30분 세션</div>
                      <div className="text-sm text-gray-600">1포인트 사용</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600 font-medium">
                        {userPoints.pointsByDuration[30]}개 보유
                      </div>
                    </div>
                  </div>
                </button>
              )}
              
              {userPoints && userPoints.pointsByDuration[60] > 0 && (
                <button
                  onClick={() => handleDurationSelect(60)}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">60분 세션</div>
                      <div className="text-sm text-gray-600">1포인트 사용</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-orange-600 font-medium">
                        {userPoints.pointsByDuration[60]}개 보유
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {showConfirmation && selectedSlot && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              예약을 확인해주세요
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">트레이너:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {trainers.find(t => t.id === selectedTrainer)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">날짜:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedSlot.date).toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">시간:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedSlot.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">세션 시간:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedProduct.duration_minutes}분
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">사용 포인트:</span>
                    <span className="text-sm font-medium text-orange-600">
                      1포인트
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• 예약은 24시간 전까지 취소 가능합니다</p>
                <p>• 취소 시 포인트가 환불됩니다</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {isBooking ? '예약 중...' : '예약 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}