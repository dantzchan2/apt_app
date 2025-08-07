'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  points?: number;
  id: string;
}

interface PurchaseLog {
  purchase_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  product_id: string;
  datetime: string;
  price: number;
  points: number;
  product_name?: string;
  product_description?: string;
  payment_method?: string;
  payment_status?: string;
}

interface PurchaseStats {
  total_purchases: number;
  total_revenue: number;
  unique_customers: number;
  avg_purchase_value: number;
}

export default function PurchaseLogsPage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<PurchaseLog[]>([]);
  const [purchaseStats, setPurchaseStats] = useState<PurchaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserData = localStorage.getItem('userData');
    
    if (authStatus !== 'true' || !storedUserData) {
      router.push('/login');
      return;
    }
    
    const parsedUserData = JSON.parse(storedUserData);
    if (parsedUserData.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setCurrentUser(parsedUserData);
    
    // Load purchase logs from database
    loadPurchaseLogs(parsedUserData);
  }, []);

  const loadPurchaseLogs = async (userData: UserData) => {
    try {
      const response = await fetch(`/api/purchase-logs?userId=${userData.id}&userRole=${userData.role}`);
      const data = await response.json();
      
      if (response.ok) {
        setPurchaseLogs(data.purchases);
        setFilteredLogs(data.purchases);
        setPurchaseStats(data.stats);
      } else {
        console.error('Failed to load purchase logs:', data.error);
      }
    } catch (error) {
      console.error('Error loading purchase logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = purchaseLogs;

    // Search by user name, email, or purchase ID
    if (searchQuery.trim()) {
      filtered = filtered.filter(log =>
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.purchase_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by user
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.user_id === userFilter);
    }

    // Filter by purchase item
    if (itemFilter !== 'all') {
      filtered = filtered.filter(log => log.product_id === itemFilter);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(log => 
        new Date(log.datetime) >= new Date(startDate)
      );
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(log => 
        new Date(log.datetime) <= endDateTime
      );
    }

    // Sort by datetime (newest first)
    filtered.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    setFilteredLogs(filtered);
  }, [purchaseLogs, searchQuery, userFilter, itemFilter, startDate, endDate]);

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  const getTotalRevenue = () => {
    return filteredLogs.reduce((sum, log) => sum + log.price, 0);
  };

  const getUniqueUsers = () => {
    const uniqueUsers = Array.from(new Set(purchaseLogs.map(log => log.user_id)))
      .map(userId => {
        const log = purchaseLogs.find(l => l.user_id === userId);
        return { id: userId, name: log?.user_name || 'Unknown User' };
      });
    return uniqueUsers;
  };

  const getUniqueItems = () => {
    return Array.from(new Set(purchaseLogs.map(log => log.product_id)));
  };

  const getProductDisplayName = (log: PurchaseLog) => {
    if (log.product_name) {
      return `${log.product_name} (${log.points}포인트)`;
    }
    return log.product_id || '미확인';
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
        title="구매 로그" 
        currentPage="/dashboard/purchases" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">총 매출</h3>
                <p className="text-2xl font-bold text-green-600">
                  {purchaseStats ? formatPrice(Number(purchaseStats.total_revenue)) : formatPrice(getTotalRevenue())}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">총 구매건수</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {purchaseStats ? purchaseStats.total_purchases : filteredLogs.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">순 고객 수</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {purchaseStats ? purchaseStats.unique_customers : getUniqueUsers().length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-black">
              구매 로그 ({purchaseLogs.length}건 중 {filteredLogs.length}건)
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  검색
                </label>
                <input
                  type="text"
                  placeholder="사용자, 이메일, 구매 ID로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 "
                />
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  사용자
                </label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 "
                >
                  <option value="all">모든 사용자</option>
                  {getUniqueUsers().map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Item Filter */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  패키지
                </label>
                <select
                  value={itemFilter}
                  onChange={(e) => setItemFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 "
                >
                  <option value="all">모든 패키지</option>
                  {getUniqueItems().map((item) => {
                    const sampleLog = purchaseLogs.find(log => log.product_id === item);
                    const displayName = sampleLog ? getProductDisplayName(sampleLog) : item;
                    return (
                      <option key={item} value={item}>{displayName}</option>
                    );
                  })}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  날짜 범위
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300  rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500  text-sm"
                    placeholder="시작 날짜"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300  rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500  text-sm"
                    placeholder="종료 날짜"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    구매 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    패키지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    포인트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    가격
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    날짜 및 시간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-black">
                      검색 조건에 맞는 구매 로그가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.purchase_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-black">
                        {log.purchase_id.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-black">
                            {log.user_name}
                          </div>
                          <div className="text-sm text-black">
                            {log.user_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          {getProductDisplayName(log)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {log.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatPrice(log.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDateTime(log.datetime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}