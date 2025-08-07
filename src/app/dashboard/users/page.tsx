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
  memo?: string;
}


export default function UsersManagement() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'trainer' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [memoText, setMemoText] = useState('');
  const [showMemoPopup, setShowMemoPopup] = useState(false);
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
    
    // Initialize users list if it doesn't exist or needs update
    const storedUsers = localStorage.getItem('allUsers');
    const dataVersion = localStorage.getItem('usersDataVersion');
    const currentVersion = '2.2'; // Update this to force refresh
    
    // Clear localStorage completely for this version to ensure clean state
    if (dataVersion !== currentVersion) {
      localStorage.removeItem('allUsers');
      localStorage.removeItem('userData');
      localStorage.removeItem('usersDataVersion');
    }
    
    if (!storedUsers || dataVersion !== currentVersion) {
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
      localStorage.setItem('allUsers', JSON.stringify(defaultUsers));
      localStorage.setItem('usersDataVersion', currentVersion);
      setAllUsers(defaultUsers);
      setFilteredUsers(defaultUsers);
      
      // Also update the current user's data in localStorage if they match
      const currentUserData = localStorage.getItem('userData');
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData);
        const matchingUser = defaultUsers.find(user => user.id === currentUser.id);
        if (matchingUser) {
          localStorage.setItem('userData', JSON.stringify(matchingUser));
        }
      }
    } else {
      const users = JSON.parse(storedUsers);
      // Add memo field and point batches to existing users if they don't exist
      const usersWithUpdatedFields = users.map((user: UserData) => {
        const updatedUser = {
          ...user,
          memo: user.memo || ''
        };
        
        // Initialize point batches if user doesn't have them yet (but only if they don't already exist)
        if (!updatedUser.pointBatches && updatedUser.points && !user.pointBatches) {
          const purchaseDate = new Date().toISOString();
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 6);
          
          const legacyBatch: PointBatch = {
            id: 'legacy-' + Date.now() + '-' + user.id,
            points: updatedUser.points,
            purchaseDate: purchaseDate,
            expiryDate: expiryDate.toISOString(),
            originalPoints: updatedUser.points
          };
          
          updatedUser.pointBatches = [legacyBatch];
        }
        
        // Clean up expired batches and recalculate points
        if (updatedUser.pointBatches) {
          const now = new Date();
          const validBatches = updatedUser.pointBatches.filter((batch: PointBatch) => 
            new Date(batch.expiryDate) > now
          );
          
          const totalPoints = validBatches.reduce((sum: number, batch: PointBatch) => sum + batch.points, 0);
          
          updatedUser.pointBatches = validBatches;
          updatedUser.points = totalPoints;
        }
        
        return updatedUser;
      });
      
      // Update localStorage with cleaned data
      localStorage.setItem('allUsers', JSON.stringify(usersWithUpdatedFields));
      
      setAllUsers(usersWithUpdatedFields);
      setFilteredUsers(usersWithUpdatedFields);
    }
    
    setIsLoading(false);
  }, []);

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
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    
    // If the updated user is the current user, update their session data
    if (userId === currentUser?.id) {
      const updatedCurrentUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedCurrentUser);
      localStorage.setItem('userData', JSON.stringify(updatedCurrentUser));
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
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    
    setShowMemoPopup(false);
    setSelectedUser(null);
    setMemoText('');
    
    alert('메모가 성공적으로 저장되었습니다!');
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

    const ws = XLSX.utils.json_to_sheet(userData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    
    const fileName = `user_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
                      {user.role === 'trainer' ? 'N/A' : (user.points || 0)}
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
              <li>• 파일은 엑셀 (.xlsx) 형식으로 다운로드됩니다</li>
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