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
  memo?: string;
}

interface Product {
  id: string;
  name: string;
  duration_minutes: number;
  trainer_type: 'trainer' | 'head_trainer';
  points: number;
  price: number;
}

interface UserPointBatch {
  id: string;
  product_id: string;
  remaining_points: number;
  original_points: number;
  purchase_date: string;
  expiry_date: string;
}


export default function UsersManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userPointBatches, setUserPointBatches] = useState<{ [userId: string]: UserPointBatch[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'trainer' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [memoText, setMemoText] = useState('');
  const [showMemoPopup, setShowMemoPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    const userData = {
      ...user,
      points: user.total_points,
      pointBatches: []
    };
    setCurrentUser(userData);
    
    // Load users, products, and point data from database via API
    fetchUsers();
    fetchProducts();
    
    setIsLoading(false);
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to hardcoded users if API fails
      const defaultUsers: UserData[] = [
        {
          name: 'Admin User',
          email: 'admin@aptapp.com',
          phone: '0123456789',
          role: 'admin',
          points: 100,
          pointBatches: [{
            id: 'default-admin',
            points: 100,
            purchaseDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            originalPoints: 100
          }],
          id: 'admin123',
          memo: ''
        },
        {
          name: 'Sarah Johnson',
          email: 'trainer@aptapp.com',
          phone: '0987654321',
          role: 'trainer',
          id: 'trainer1',
          memo: ''
        },
        {
          name: 'Mike Chen',
          email: 'trainer2@aptapp.com',
          phone: '0555123456',
          role: 'trainer',
          id: 'trainer2',
          memo: ''
        },
        {
          name: 'Emma Davis',
          email: 'trainer3@aptapp.com',
          phone: '0777888999',
          role: 'trainer',
          id: 'trainer3',
          memo: ''
        },
        {
          name: 'David Wilson',
          email: 'trainer4@aptapp.com',
          phone: '0444555666',
          role: 'trainer',
          id: 'trainer4',
          memo: ''
        },
        {
          name: 'Regular User',
          email: 'user@aptapp.com',
          phone: '0111222333',
          role: 'user',
          points: 15,
          pointBatches: [
            {
              id: 'expiring-batch',
              points: 5,
              purchaseDate: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 5 months ago
              expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
              originalPoints: 5
            },
            {
              id: 'default-user',
              points: 10,
              purchaseDate: new Date().toISOString(),
              expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
              originalPoints: 10
            }
          ],
          id: 'user123',
          memo: ''
        },
        {
          name: 'Jane Doe',
          email: 'jane@aptapp.com',
          phone: '0999888777',
          role: 'user',
          points: 5,
          pointBatches: [{
            id: 'default-jane',
            points: 5,
            purchaseDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            originalPoints: 5
          }],
          id: 'user456',
          memo: ''
        },
        {
          name: 'John Smith',
          email: 'john@aptapp.com',
          phone: '0666333111',
          role: 'user',
          points: 15,
          pointBatches: [{
            id: 'default-john',
            points: 15,
            purchaseDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            originalPoints: 15
          }],
          id: 'user789',
          memo: ''
        }
      ];

      setAllUsers(defaultUsers);
      setFilteredUsers(defaultUsers);
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
      } else {
        console.error('Failed to fetch products:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUserPointBatches = async (userId: string) => {
    try {
      // For admin view, we'll call a different endpoint that gets all user point batches
      const response = await fetch('/api/admin/user-point-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.pointBatches || [];
      } else {
        console.error('Failed to fetch user point batches:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('Error fetching user point batches:', error);
      return [];
    }
  };

  useEffect(() => {
    let filtered = allUsers;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery.replace(/[^\d]/g, ''))
      );
    }

    setFilteredUsers(filtered);
  }, [allUsers, roleFilter, searchQuery]);

  // Fetch point batches for all users when products and users are loaded
  useEffect(() => {
    const loadUserPointBatches = async () => {
      if (products.length === 0 || allUsers.length === 0) return;
      
      const batchPromises = allUsers
        .filter(user => user.role === 'user')
        .map(async (user) => {
          const batches = await fetchUserPointBatches(user.id);
          return { userId: user.id, batches };
        });
      
      const results = await Promise.all(batchPromises);
      const batchMap: { [userId: string]: UserPointBatch[] } = {};
      
      results.forEach(result => {
        batchMap[result.userId] = result.batches;
      });
      
      setUserPointBatches(batchMap);
    };

    loadUserPointBatches();
  }, [products, allUsers]);

  const handleRoleChange = (userId: string, newRole: 'user' | 'trainer' | 'admin') => {
    if (userId === currentUser?.id && newRole !== 'admin') {
      alert('자신의 관리자 역할은 변경할 수 없습니다!');
      return;
    }

    const updatedUsers = allUsers.map(user => 
      user.id === userId 
        ? { ...user, role: newRole }
        : user
    );
    
    setAllUsers(updatedUsers);
    
    // If the updated user is the current user, update their session data
    if (userId === currentUser?.id) {
      const updatedCurrentUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedCurrentUser);
    }
    
    alert(`사용자 역할이 ${newRole === 'user' ? '사용자' : newRole === 'trainer' ? '트레이너' : '관리자'}로 성공적으로 변경되었습니다!`);
  };

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    setMemoText(user.memo || '');
    setShowMemoPopup(true);
  };

  const handleMemoSave = () => {
    if (!selectedUser) return;
    
    const updatedUsers = allUsers.map(user => 
      user.id === selectedUser.id 
        ? { ...user, memo: memoText }
        : user
    );
    
    setAllUsers(updatedUsers);
    setFilteredUsers(updatedUsers.filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        return user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
               user.phone.includes(searchQuery.replace(/[^\d]/g, ''));
      }
      return true;
    }));
    
    setShowMemoPopup(false);
    setSelectedUser(null);
    setMemoText('');
    
    alert('메모가 성성적으로 저장되었습니다!');
  };

  const handleMemoCancel = () => {
    setShowMemoPopup(false);
    setSelectedUser(null);
    setMemoText('');
  };

  const downloadUserData = () => {
    const userData = allUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      Role: user.role,
      Points: user.role === 'trainer' ? 'N/A' : (user.points || 0),
      Memo: user.memo || ''
    }));

    const fileName = `user_data_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(userData, fileName);
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

  const getRoleCount = (role: 'user' | 'trainer' | 'admin') => {
    return allUsers.filter(user => user.role === role).length;
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

  const renderUserPoints = (user: UserData) => {
    if (user.role === 'trainer') {
      return <span className="text-gray-500">N/A</span>;
    }

    const userBatches = userPointBatches[user.id] || [];
    const totalPoints = userBatches.reduce((sum, batch) => sum + batch.remaining_points, 0);

    if (userBatches.length === 0) {
      return <span className="text-gray-500">0</span>;
    }

    // Group batches by product for display
    const batchesByProduct: { [productId: string]: { points: number; count: number } } = {};
    
    userBatches.forEach(batch => {
      if (!batchesByProduct[batch.product_id]) {
        batchesByProduct[batch.product_id] = { points: 0, count: 0 };
      }
      batchesByProduct[batch.product_id].points += batch.remaining_points;
      batchesByProduct[batch.product_id].count += 1;
    });

    return (
      <div className="space-y-1">
        <div className="font-medium text-black">{totalPoints} 포인트</div>
        <div className="text-xs space-y-1">
          {Object.entries(batchesByProduct).map(([productId, data]) => (
            <div key={productId} className="flex items-center space-x-1">
              <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                {getProductDisplayName(productId)}
              </span>
              <span className="text-blue-600 font-medium text-xs">{data.points}</span>
            </div>
          ))}
        </div>
      </div>
    );
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

  if (!user || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader 
        userData={currentUser} 
        title="사용자 관리" 
        currentPage="/dashboard/users" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">👤</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">일반 사용자</h3>
                <p className="text-2xl font-bold text-orange-600">{getRoleCount('user')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">💪</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">트레이너</h3>
                <p className="text-2xl font-bold text-orange-600">{getRoleCount('trainer')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">👑</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-black">관리자</h3>
                <p className="text-2xl font-bold text-red-600">{getRoleCount('admin')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-black">
                전체 사용자 ({allUsers.length}명 중 {filteredUsers.length}명)
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadUserData}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  📊 사용자 데이터 다운로드
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
                    placeholder="이름, 이메일, 전화번호로 검색..."
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
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    포인트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-black">
                      검색 조건에 맞는 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-black">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black">
                            <button
                              onClick={() => handleUserClick(user)}
                              className="text-orange-600 hover:text-orange-800 hover:underline transition-colors"
                            >
                              {user.name}
                            </button>
                            {user.id === currentUser.id && (
                              <span className="ml-2 text-xs text-gray-500">(본인)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {renderUserPoints(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'trainer' | 'admin')}
                        disabled={user.id === currentUser.id}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300  rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500  disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="user">사용자</option>
                        <option value="trainer">트레이너</option>
                        <option value="admin">관리자</option>
                      </select>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              역할 관리 안내:
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• <strong>사용자</strong>는 포인트를 구매하고 예약할 수 있습니다</li>
              <li>• <strong>트레이너</strong>는 자신의 트레이닝 세션을 보고 취소할 수 있습니다 (포인트 불필요)</li>
              <li>• <strong>관리자</strong>는 사용자 관리를 포함한 모든 권한을 가집니다</li>
              <li>• 보안상의 이유로 자신의 관리자 역할은 변경할 수 없습니다</li>
            </ul>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-medium text-orange-800 mb-2">
              내보내기 기능:
            </h3>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• <strong>사용자 데이터</strong>는 이름, 이메일, 역할, 포인트, 메모를 포함합니다</li>
              <li>• 파일은 CSV (.csv) 형식으로 다운로드됩니다</li>
              <li>• 파일명에 현재 날짜가 포함되어 쉽게 정리할 수 있습니다</li>
              <li>• 구매 로그는 포인트 구매 페이지에서 다운로드할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Memo Popup */}
      {showMemoPopup && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-black">
                {selectedUser.name} 메모
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  메모:
                </label>
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500  resize-none"
                  placeholder="이 사용자에 대한 메모를 입력하세요..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleMemoCancel}
                  className="px-4 py-2 text-sm font-medium text-black bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleMemoSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}