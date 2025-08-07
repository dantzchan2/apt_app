'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import { exportToCSV } from '../../../lib/csv-export';
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

interface PurchaseOption {
  id: string;
  points: number;
  price: number;
  popular?: boolean;
}

interface PurchaseLog {
  purchase_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  purchase_item_id: string;
  datetime: string;
  price: number;
  points: number;
}

const purchaseOptions: PurchaseOption[] = [
  { id: 'basic', points: 5, price: 25 },
  { id: 'standard', points: 10, price: 45, popular: true },
  { id: 'premium', points: 20, price: 80 },
  { id: 'deluxe', points: 50, price: 180 }
];

export default function Purchase() {
  const { user, isLoading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'user' && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    const userData = {
      ...user,
      points: user.total_points,
      pointBatches: []
    };
    setUserData(userData);
    
    // Load purchase logs from API
    fetchPurchaseLogs();
  }, [user, router]);

  const fetchPurchaseLogs = async () => {
    try {
      const response = await fetch('/api/purchase-logs', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPurchaseLogs(data.purchases || []);
      } else {
        console.error('Failed to fetch purchase logs');
      }
    } catch (error) {
      console.error('Error fetching purchase logs:', error);
    }
  };

  const handlePurchase = async (option: PurchaseOption) => {
    if (!userData) return;
    
    setIsLoading(true);
    setSelectedOption(option.id);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update user points
    const updatedUserData = {
      ...userData,
      points: (userData.points || 0) + option.points
    };

    // Update local state (TODO: update in database via API)
    setUserData(updatedUserData);
    
    // TODO: Save purchase log via API
    // await fetch('/api/purchase-logs', { method: 'POST', ... })
    
    setIsLoading(false);
    setSelectedOption(null);
    
    // Show success message (in a real app, you might use a toast notification)
    alert(`${option.points} 포인트를 성공적으로 구매했습니다!`);
    
    // Refresh purchase logs from API
    await fetchPurchaseLogs();
  };

  const downloadPurchaseLogs = () => {
    if (purchaseLogs.length === 0) {
      alert('구매 내역이 없습니다.');
      return;
    }

    const formattedLogs = purchaseLogs.map(log => ({
      'Purchase ID': log.purchase_id,
      'User ID': log.user_id,
      'User Name': log.user_name,
      'User Email': log.user_email,
      'Package': log.purchase_item_id,
      'Date & Time': new Date(log.datetime).toLocaleString(),
      'Price ($)': log.price,
      'Points': log.points
    }));

    const fileName = `purchase_logs_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(formattedLogs, fileName);
  };

  const getUserPurchaseLogs = () => {
    if (!userData) return [];
    return purchaseLogs.filter(log => log.user_id === userData.id).sort((a, b) => 
      new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );
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

  const handleDebugPurchase = async () => {
    if (!userData) return;
    
    setIsLoading(true);

    // Create debug point batch that expires tomorrow
    const purchaseDate = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1); // Expires tomorrow
    
    const debugPointBatch: PointBatch = {
      id: 'debug-' + Date.now().toString() + Math.random().toString(36).substring(2, 11),
      points: 3,
      purchaseDate: purchaseDate,
      expiryDate: expiryDate.toISOString(),
      originalPoints: 3
    };

    // Update user data with new point batch
    const currentBatches = userData.pointBatches || [];
    const updatedBatches = [...currentBatches, debugPointBatch];
    
    // Remove expired batches
    const now = new Date();
    const validBatches = updatedBatches.filter(batch => new Date(batch.expiryDate) > now);
    
    // Calculate total points
    const totalPoints = validBatches.reduce((sum, batch) => sum + batch.points, 0);
    
    const updatedUserData = {
      ...userData,
      pointBatches: validBatches,
      points: totalPoints
    };

    // Update local state (TODO: update in database via API) 
    setUserData(updatedUserData);
    
    // TODO: Log the debug purchase via API
    // await fetch('/api/purchase-logs', { method: 'POST', ... })
    
    setIsLoading(false);
    
    // Refresh purchase logs from API
    await fetchPurchaseLogs();
    
    alert('디버그 구매가 완료되었습니다! 내일 만료되는 3포인트가 추가되었습니다.');
  };

  if (authLoading) {
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
        title="포인트 구매" 
        currentPage="/dashboard/purchase" 
        customUserInfo={
          <>
            보유 포인트: 
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              {userData.points || 0}
            </span>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-black mb-4">
            포인트 패키지를 선택하세요
          </h2>
          <p className="text-lg text-black">
            1 포인트로 트레이너와 1시간 세션을 예약할 수 있습니다
          </p>
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ 포인트는 구매일로부터 6개월 후 만료됩니다
          </p>
          
          {/* Debug Purchase Button */}
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              🐛 디버그: 만료 경고 테스트
            </h3>
            <button
              onClick={handleDebugPurchase}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? '추가 중...' : '내일 만료되는 3포인트 추가'}
            </button>
            <p className="text-xs text-red-600 mt-1">
              경고 시스템 테스트를 위해 내일 만료되는 포인트를 추가합니다
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {purchaseOptions.map((option) => (
            <div
              key={option.id}
              className={`relative bg-white rounded-lg shadow-md p-6 ${
                option.popular ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              {option.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    가장 인기
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-black mb-2 capitalize">
                  {option.id}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-black">
                    {option.points}
                  </span>
                  <span className="text-black ml-1">포인트</span>
                </div>
                <div className="mb-6">
                  <span className="text-2xl font-bold text-green-600">${option.price}</span>
                  <div className="text-sm text-black mt-1">
                    포인트당 ${(option.price / option.points).toFixed(2)}
                  </div>
                </div>
                
                <button
                  onClick={() => handlePurchase(option)}
                  disabled={isLoading && selectedOption === option.id}
                  className={`w-full py-3 px-4 rounded-md font-medium text-sm transition-colors ${
                    option.popular
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-black'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading && selectedOption === option.id 
                    ? '처리 중...' 
                    : '구매하기'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            포인트 사용 방법
          </h3>
          <div className="space-y-3 text-black">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p>각 포인트로 1시간 세션을 예약할 수 있습니다</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
              <p>포인트는 구매일로부터 6개월 후 만료됩니다</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p>예약 시 가장 오래된 포인트부터 사용됩니다</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p>10분 단위로 예약 시간을 선택할 수 있습니다</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p>24시간 전까지 취소하면 포인트가 환불됩니다</p>
            </div>
          </div>
        </div>

        {/* Purchase History Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-black">
                구매 내역 ({getUserPurchaseLogs().length}건)
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  구매 내역 {showLogs ? '숨기기' : '보기'}
                </button>
                {getUserPurchaseLogs().length > 0 && (
                  <button
                    onClick={downloadPurchaseLogs}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    💰 구매 내역 다운로드
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {showLogs && (
            <div className="p-6">
              {getUserPurchaseLogs().length === 0 ? (
                <p className="text-black text-center py-8">
                  구매 내역이 없습니다. 포인트를 구매해보세요!
                </p>
              ) : (
                <div className="space-y-4">
                  {getUserPurchaseLogs().map((log) => (
                    <div key={log.purchase_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">$</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-black capitalize">
                            {log.purchase_item_id} 패키지
                          </h4>
                          <p className="text-sm text-black">
                            {formatDateTime(log.datetime)}
                          </p>
                          <p className="text-xs text-black">
                            ID: {log.purchase_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${log.price}
                        </div>
                        <div className="text-sm text-black">
                          +{log.points} 포인트
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}