'use client';

import { useState, useEffect, useCallback } from 'react';
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
  purchaseItemId?: string; // This is actually the product_id from the database
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

interface Product {
  id: string;
  name: string;
  duration_minutes: number;
  trainer_type: 'trainer' | 'head_trainer';
  points: number;
  price: number;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  is_active: boolean;
  created_at: string;
}

export default function MonthlySettlement() {
  const { user, isLoading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trainerStats, setTrainerStats] = useState<TrainerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadCSVData = useCallback(async () => {
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
      // Fallback to API if CSV fails
      await fetchAppointments();
    }
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/trainers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const fetchedTrainers = data.trainers || [];
        setTrainers(fetchedTrainers);
        console.log('Loaded trainers for settlement:', fetchedTrainers);
      } else {
        console.error('Failed to fetch trainers:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const fetchedProducts = data.products || [];
        setProducts(fetchedProducts);
        console.log('Loaded products for settlement:', fetchedProducts);
      } else {
        console.error('Failed to fetch products:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('Settlement page - raw appointments data:', data);
        const transformedAppointments = (data.appointments || []).map((apt: Record<string, unknown>) => ({
          id: apt.id,
          userId: apt.user_id,
          userName: apt.user_name,
          userEmail: apt.user_email,
          trainerId: apt.trainer_id,
          trainerName: apt.trainer_name,
          date: apt.appointment_date || apt.date,
          time: (apt.appointment_time || apt.time)?.toString().substring(0, 5), // Remove seconds
          status: apt.status,
          usedPointBatchId: apt.used_point_batch_id,
          purchaseItemId: apt.product_id // Fixed: use product_id instead of purchase_item_id
        }));
        console.log('Settlement page - transformed appointments:', transformedAppointments);
        setAppointments(transformedAppointments);
      } else {
        console.error('Failed to fetch appointments for settlement:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
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

    // Load trainers, products, and appointments
    fetchTrainers();
    fetchProducts();
    fetchAppointments(); // Use API instead of CSV

    setIsLoading(false);
  }, [user, router, loadCSVData]);

  useEffect(() => {
    const calculateTrainerStats = () => {
      if (trainers.length === 0) {
        console.log('No trainers loaded yet, skipping stats calculation');
        return;
      }
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      console.log(`Calculating stats for ${year}-${month + 1} (${formatMonthYear(currentDate)})`);
      console.log('Total appointments available:', appointments.length);
      
      // Filter appointments for the current month
      const monthlyAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        const matches = appointmentDate.getFullYear() === year && appointmentDate.getMonth() === month;
        if (appointments.length < 10) { // Only log for small datasets to avoid spam
          console.log(`Appointment ${appointment.date} (${appointmentDate.getFullYear()}-${appointmentDate.getMonth() + 1}) matches ${year}-${month + 1}:`, matches);
        }
        return matches;
      });
      console.log(`Found ${monthlyAppointments.length} appointments for current month`);

      // Calculate stats for each trainer
      const stats = trainers.map(trainer => {
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
      console.log('Calculated trainer stats:', stats);
    };
    
    calculateTrainerStats();
  }, [appointments, trainers, currentDate]);

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

  const handleBulkAutoComplete = async () => {
    if (!confirm('지난 예약들을 자동으로 완료 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch('/api/appointments/auto-complete', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cutoffTime: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to auto-complete appointments');
      }

      const result = await response.json();
      alert(`성공적으로 ${result.updatedCount}건의 예약이 완료 처리되었습니다.`);
      
      // Refresh the data to show updated statistics
      fetchAppointments();
    } catch (error) {
      console.error('Bulk auto-complete error:', error);
      alert(`자동 완료 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  const getProductDisplayName = (itemId: string | undefined) => {
    if (!itemId) return '미확인';
    
    // Find the actual product by ID
    const product = products.find(p => p.id === itemId);
    
    if (product) {
      const trainerTypeText = product.trainer_type === 'head_trainer' ? '헤드 트레이너' : '일반 트레이너';
      const durationText = product.duration_minutes === 30 ? '30분' : '60분';
      return `${trainerTypeText} ${durationText} (${product.points}포인트)`;
    }
    
    // Fallback to old mapping for legacy data
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
        {/* Admin Actions */}
        {userData?.role === 'admin' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-3">관리자 작업</h3>
            <button
              onClick={handleBulkAutoComplete}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              지난 예약 자동 완료 처리
            </button>
            <p className="text-xs text-blue-700 mt-2">
              현재 시간 이전의 모든 &quot;scheduled&quot; 예약을 &quot;completed&quot;로 일괄 변경합니다.
            </p>
          </div>
        )}
        
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-yellow-800 mb-2">🐛 Settlement Debug Info</h3>
            <div className="text-xs space-y-1 text-yellow-700">
              <p>User: {userData?.name} ({userData?.email}) - Role: {userData?.role}</p>
              <p>Total Trainers Loaded: {trainers.length}</p>
              <p>Total Products Loaded: {products.length}</p>
              <p>Total Appointments Loaded: {appointments.length}</p>
              <p>Current Month: {formatMonthYear(currentDate)}</p>
              <p>Trainer Stats Calculated: {trainerStats.length}</p>
            </div>
            {trainers.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-yellow-800 cursor-pointer">View Loaded Trainers</summary>
                <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                  {JSON.stringify(trainers, null, 2)}
                </pre>
              </details>
            )}
            {products.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-yellow-800 cursor-pointer">View Loaded Products</summary>
                <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                  {JSON.stringify(products, null, 2)}
                </pre>
              </details>
            )}
            {appointments.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-yellow-800 cursor-pointer">View Loaded Appointments (first 3)</summary>
                <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                  {JSON.stringify(appointments.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
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