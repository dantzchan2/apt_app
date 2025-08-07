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
  userId: string;
  userName: string;
  userEmail?: string;
  trainerId: string;
  trainerName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  usedPointBatchId?: string;
  purchaseItemId?: string;
}

interface TrainerStats {
  trainerId: string;
  trainerName: string;
  totalAppointments: number;
  fulfilledAppointments: number;
  cancelledAppointments: number;
  fulfilledByProduct: {
    [purchaseItemId: string]: number;
  };
  cancelledByProduct: {
    [purchaseItemId: string]: number;
  };
}

const TRAINER_LIST = [
  { id: 'trainer1', name: 'Sarah Johnson', specialization: 'Strength & Conditioning' },
  { id: 'trainer2', name: 'Mike Chen', specialization: 'Cardio & Endurance' },
  { id: 'trainer3', name: 'Emma Rodriguez', specialization: 'Yoga & Flexibility' },
  { id: 'trainer4', name: 'Alex Thompson', specialization: 'CrossFit' },
  { id: 'trainer5', name: 'Lisa Park', specialization: 'Pilates' }
];

export default function MonthlySettlement() {
  const { user, isLoading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trainerStats, setTrainerStats] = useState<TrainerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadCSVData = async () => {
    try {
      const response = await fetch('/data/appointments.csv');
      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.trim().split('\n');
      
      const csvAppointments = lines.slice(1).map(line => {
        const values = line.split(',');
        const appointment: Appointment = {
          id: values[0],
          userId: values[1],
          userName: values[2],
          userEmail: values[3],
          trainerId: values[4],
          trainerName: values[5],
          date: values[6],
          time: values[7],
          status: values[8] as 'scheduled' | 'completed' | 'cancelled',
          usedPointBatchId: values[9] || undefined,
          purchaseItemId: values[10] || undefined
        };
        return appointment;
      });
      
      setAppointments(csvAppointments);
    } catch (error) {
      console.error('Error loading CSV data:', error);
      // Fallback to localStorage if CSV fails
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Check if user is admin or trainer
    if (user.role !== 'admin' && user.role !== 'trainer') {
      router.replace('/dashboard');
      return;
    }
    
    const userData = {
      ...user,
      points: user.total_points
    };
    setUserData(userData);

    // Load appointments from CSV
    loadCSVData();

    setIsLoading(false);
  }, [user, router]);

  useEffect(() => {
    const calculateTrainerStats = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Filter appointments for the current month
    const monthlyAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.getFullYear() === year && appointmentDate.getMonth() === month;
    });

    // Calculate stats for each trainer
    const stats = TRAINER_LIST.map(trainer => {
      const trainerAppointments = monthlyAppointments.filter(
        appointment => appointment.trainerId === trainer.id
      );

      const totalAppointments = trainerAppointments.length;
      const fulfilledAppointments = trainerAppointments.filter(
        appointment => appointment.status === 'completed'
      ).length;
      const cancelledAppointments = trainerAppointments.filter(
        appointment => appointment.status === 'cancelled'
      ).length;

      // Group fulfilled appointments by purchase product
      const fulfilledByProduct: { [key: string]: number } = {};
      const completedAppointments = trainerAppointments.filter(appointment => appointment.status === 'completed');
      
      completedAppointments.forEach(appointment => {
        const product = appointment.purchaseItemId || 'unknown';
        fulfilledByProduct[product] = (fulfilledByProduct[product] || 0) + 1;
      });

      // Group cancelled appointments by purchase product
      const cancelledByProduct: { [key: string]: number } = {};
      trainerAppointments
        .filter(appointment => appointment.status === 'cancelled')
        .forEach(appointment => {
          const product = appointment.purchaseItemId || 'unknown';
          cancelledByProduct[product] = (cancelledByProduct[product] || 0) + 1;
        });

      return {
        trainerId: trainer.id,
        trainerName: trainer.name,
        totalAppointments,
        fulfilledAppointments,
        cancelledAppointments,
        fulfilledByProduct,
        cancelledByProduct
      };
    });

    setTrainerStats(stats);
    };
    
    calculateTrainerStats();
  }, [appointments, currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleMonthChange = (month: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(month);
      return newDate;
    });
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setFullYear(year);
      return newDate;
    });
  };

  const getAvailableMonths = () => {
    return [
      { value: 0, label: '1월' },
      { value: 1, label: '2월' },
      { value: 2, label: '3월' },
      { value: 3, label: '4월' },
      { value: 4, label: '5월' },
      { value: 5, label: '6월' },
      { value: 6, label: '7월' },
      { value: 7, label: '8월' },
      { value: 8, label: '9월' },
      { value: 9, label: '10월' },
      { value: 10, label: '11월' },
      { value: 11, label: '12월' }
    ];
  };

  const getAvailableYears = () => {
    // Generate years from 2024 to 2026 (can adjust range as needed)
    const years = [];
    for (let year = 2024; year <= 2026; year++) {
      years.push({ value: year, label: year.toString() });
    }
    return years;
  };

  const formatMonthYear = (date: Date) => {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    return `${date.getFullYear()}년 ${monthNames[date.getMonth()]}`;
  };

  const getProductDisplayName = (itemId: string | undefined) => {
    if (!itemId) return '미확인';
    
    const productNames: { [key: string]: string } = {
      'starter': '스타터 (5포인트)',
      'basic': '베이직 (10포인트)',
      'premium': '프리미엄 (20포인트)',
      'pro': '프로 (50포인트)',
      'legacy': '레거시',
      'unknown': '미확인'
    };
    return productNames[itemId] || itemId.charAt(0).toUpperCase() + itemId.slice(1);
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

  if (!user || !userData || (userData.role !== 'admin' && userData.role !== 'trainer')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader 
        userData={userData} 
        title="월별 정산" 
        currentPage="/dashboard/settlement" 
        showPoints={false}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month and Year Selection */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-black">
              월별 정산
            </h1>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Month Dropdown */}
              <div className="flex items-center space-x-2">
                <label htmlFor="month-select" className="text-sm font-medium text-black">
                  월:
                </label>
                <select
                  id="month-select"
                  value={currentDate.getMonth()}
                  onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {getAvailableMonths().map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Dropdown */}
              <div className="flex items-center space-x-2">
                <label htmlFor="year-select" className="text-sm font-medium text-black">
                  년:
                </label>
                <select
                  id="year-select"
                  value={currentDate.getFullYear()}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {getAvailableYears().map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-white border border-orange-600 rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  title="이전 달"
                >
                  ←
                </button>

                <button
                  onClick={() => navigateMonth('next')}
                  className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-white border border-orange-600 rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  title="다음 달"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {trainerStats.every(stat => stat.totalAppointments === 0) ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-black mb-2">데이터 없음</h3>
              <p className="text-gray-500">
                {formatMonthYear(currentDate)}에 대한 예약이 없습니다
              </p>
              <p className="text-sm text-gray-400 mt-2">
                정산 데이터를 보려면 다른 월 또는 연도를 선택해보세요
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-black mb-2">총 예약</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {trainerStats.reduce((sum, stat) => sum + stat.totalAppointments, 0)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-black mb-2">완료된 예약</h3>
                <p className="text-3xl font-bold text-green-600">
                  {trainerStats.reduce((sum, stat) => sum + stat.fulfilledAppointments, 0)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-black mb-2">취소된 예약</h3>
                <p className="text-3xl font-bold text-red-600">
                  {trainerStats.reduce((sum, stat) => sum + stat.cancelledAppointments, 0)}
                </p>
              </div>
            </div>

              {/* Trainer Statistics Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-black">
                    트레이너 성과 - {formatMonthYear(currentDate)}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          트레이너
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          총 예약
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          완료
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          완료 (상품별)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          취소
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          취소 (상품별)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          성공률
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trainerStats.map((stat) => {
                        const successRate = stat.totalAppointments > 0
                          ? ((stat.fulfilledAppointments / stat.totalAppointments) * 100).toFixed(1)
                          : '0.0';

                      return (
                        <tr key={stat.trainerId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {stat.trainerName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-black">
                                  {stat.trainerName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {stat.totalAppointments}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {stat.fulfilledAppointments}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs space-y-1">
                              {Object.entries(stat.fulfilledByProduct).map(([product, count]) => (
                                <div key={product} className="flex items-center space-x-2">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    {getProductDisplayName(product)}
                                  </span>
                                  <span className="text-green-600 font-medium">{count}</span>
                                </div>
                              ))}
                              {Object.keys(stat.fulfilledByProduct).length === 0 && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            {stat.cancelledAppointments}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs space-y-1">
                              {Object.entries(stat.cancelledByProduct).map(([product, count]) => (
                                <div key={product} className="flex items-center space-x-2">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    {getProductDisplayName(product)}
                                  </span>
                                  <span className="text-red-600 font-medium">{count}</span>
                                </div>
                              ))}
                              {Object.keys(stat.cancelledByProduct).length === 0 && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${parseFloat(successRate) >= 80
                                ? 'bg-green-100 text-green-800'
                                : parseFloat(successRate) >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                              {successRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
        )}


      </div>
    </div>
  );
}