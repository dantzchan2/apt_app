'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import * as XLSX from 'xlsx';

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

interface AppointmentLog {
  id: string;
  appointmentId: string;
  action: 'booked' | 'cancelled';
  actionBy: string;
  actionByName: string;
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
  productName?: string;
}

export default function AppointmentLogs() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [appointmentLogs, setAppointmentLogs] = useState<AppointmentLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AppointmentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<'all' | 'booked' | 'cancelled'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'trainer' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          router.push('/login');
          return;
        }
        
        const data = await response.json();
        const userData = data.user;
        
        if (userData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        
        setCurrentUser(userData);
        
        // Load appointment logs from database
        loadAppointmentLogs(userData);
      } catch (error) {
        console.error('Error getting current user:', error);
        router.push('/login');
      }
    };

    getCurrentUser();
  }, [router]);

  const loadAppointmentLogs = async (userData: UserData) => {
    try {
      // Admin should see all logs, so don't pass a specific userId
      const url = userData.role === 'admin' 
        ? '/api/appointment-logs' 
        : `/api/appointment-logs?userId=${userData.id}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        // Map database fields to component interface
        const mappedLogs = data.logs.map((log: {
          id: string;
          appointment_id: string;
          action: string;
          action_by: string;
          action_by_name: string;
          action_by_role: string;
          timestamp: string;
          appointment_date: string;
          appointment_time: string;
          trainer_id: string;
          trainer_name: string;
          user_id: string;
          user_name: string;
          user_email: string;
          used_point_batch_id?: string;
          product_id?: string;
          products?: { name: string } | null;
        }) => ({
          id: log.id,
          appointmentId: log.appointment_id,
          action: log.action,
          actionBy: log.action_by,
          actionByName: log.action_by_name,
          actionByRole: log.action_by_role,
          timestamp: log.timestamp,
          appointmentDate: log.appointment_date,
          appointmentTime: log.appointment_time,
          trainerId: log.trainer_id,
          trainerName: log.trainer_name,
          userId: log.user_id,
          userName: log.user_name,
          userEmail: log.user_email,
          usedPointBatchId: log.used_point_batch_id,
          purchaseItemId: log.product_id,
          productName: log.products?.name
        }));
        
        setAppointmentLogs(mappedLogs);
        setFilteredLogs(mappedLogs);
      } else {
        console.error('Failed to load appointment logs:', data.error);
      }
    } catch (error) {
      console.error('Error loading appointment logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = appointmentLogs;

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(log => log.actionByRole === roleFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actionByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by timestamp descending (most recent first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredLogs(filtered);
  }, [appointmentLogs, actionFilter, roleFilter, searchQuery]);

  const downloadAppointmentLogs = () => {
    if (filteredLogs.length === 0) {
      alert('예약 로그가 없습니다.');
      return;
    }

    const formattedLogs = filteredLogs.map(log => ({
      'Log ID': log.id,
      'Appointment ID': log.appointmentId,
      'Action': log.action,
      'Action By': log.actionByName,
      'Action By Role': log.actionByRole,
      'Purchase Product': log.productName || log.purchaseItemId || 'N/A',
      'Timestamp': new Date(log.timestamp).toLocaleString(),
      'Appointment Date': log.appointmentDate,
      'Appointment Time': log.appointmentTime,
      'Trainer': log.trainerName,
      'User': log.userName,
      'User Email': log.userEmail
    }));

    const ws = XLSX.utils.json_to_sheet(formattedLogs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointment Logs');
    
    const fileName = `appointment_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'booked':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader 
        userData={currentUser} 
        title="예약 로그" 
        currentPage="/dashboard/appointments" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">총 로그</h3>
                <p className="text-2xl font-bold text-orange-600">{appointmentLogs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">예약됨</h3>
                <p className="text-2xl font-bold text-green-600">
                  {appointmentLogs.filter(log => log.action === 'booked').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">취소됨</h3>
                <p className="text-2xl font-bold text-red-600">
                  {appointmentLogs.filter(log => log.action === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">필터링됨</h3>
                <p className="text-2xl font-bold text-purple-600">{filteredLogs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-black">
                예약 로그 ({appointmentLogs.length}건 중 {filteredLogs.length}건)
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadAppointmentLogs}
                  disabled={filteredLogs.length === 0}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📊 로그 다운로드
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div></div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="이름, 이메일로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 pl-10 pr-4 border border-gray-300  rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 "
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Action Filter */}
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value as 'all' | 'booked' | 'cancelled')}
                  className="px-4 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 "
                >
                  <option value="all">모든 액션</option>
                  <option value="booked">예약됨</option>
                  <option value="cancelled">취소됨</option>
                </select>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'trainer' | 'admin')}
                  className="px-4 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 "
                >
                  <option value="all">모든 역할</option>
                  <option value="user">사용자</option>
                  <option value="trainer">트레이너</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Mobile View - Card Layout */}
          <div className="block sm:hidden">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-black py-8">
                검색 조건에 맞는 예약 로그가 없습니다.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-black">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-black">
                        {log.userName} → {log.trainerName}
                      </div>
                      <div className="text-black dark:text-gray-400">
                        📅 {log.appointmentDate} at {log.appointmentTime}
                      </div>
                      <div className="text-black dark:text-gray-400">
                        👤 실행자: {log.actionByName} 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(log.actionByRole)}`}>
                          {log.actionByRole}
                        </span>
                      </div>
                      {log.action === 'booked' && (log.productName || log.purchaseItemId) && (
                        <div className="text-black dark:text-gray-400">
                          💳 구매 상품: 
                          <span className="ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {log.productName || getProductDisplayName(log.purchaseItemId)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop View - Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    액션
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    예약
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    실행자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    구매 상품
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    시간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-black">
                      검색 조건에 맞는 예약 로그가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          {log.userName} → {log.trainerName}
                        </div>
                        <div className="text-sm text-black">
                          {log.appointmentDate} at {log.appointmentTime}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          {log.actionByName}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(log.actionByRole)}`}>
                          {log.actionByRole}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                        {log.action === 'booked' && (log.productName || log.purchaseItemId) ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {log.productName || getProductDisplayName(log.purchaseItemId)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                        {formatDateTime(log.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="text-sm font-medium text-orange-800 mb-2">
            예약 로그 정보:
          </h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• 모든 예약 및 취소가 자동으로 기록됩니다</li>
            <li>• 누가 액션을 수행했는지 표시됩니다 (사용자, 트레이너, 관리자)</li>
            <li>• 필터를 사용하여 특정 액션, 역할 또는 이름으로 검색할 수 있습니다</li>
            <li>• 기록 보관을 위해 엑셀 파일로 로그를 다운로드할 수 있습니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}