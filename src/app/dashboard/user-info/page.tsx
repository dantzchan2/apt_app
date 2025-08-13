'use client';

import { useState } from 'react';
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

export default function UserInfo() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const userData: UserData | null = user ? {
    ...user,
    points: user.total_points
  } : null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      alert('비밀번호가 성공적으로 변경되었습니다.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      alert(`비밀번호 변경 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    
    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      alert('계정이 성공적으로 삭제되었습니다. 로그인 페이지로 이동합니다.');
      
      // Logout and redirect to login
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      router.push('/login');
    } catch (error) {
      console.error('Account deletion error:', error);
      alert(`계정 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
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
        userData={userData} 
        title="사용자 정보" 
        currentPage="/dashboard/user-info"
      />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{userData.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{userData.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{userData.phone || '등록되지 않음'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {userData.role === 'user' ? '일반 사용자' : 
                 userData.role === 'trainer' ? '트레이너' : '관리자'}
              </p>
            </div>
            {userData.role === 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">보유 포인트</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{userData.points || 0} 포인트</p>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isChangingPassword}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isChangingPassword}
              />
              <p className="text-xs text-gray-500 mt-1">최소 6자 이상 입력해주세요.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isChangingPassword}
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>

        {/* Delete Account Section - Hidden for Admin */}
        {userData.role !== 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-400 p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">계정 삭제</h2>
            <p className="text-sm text-red-700 mb-4">
              계정을 삭제하면 구매한 포인트를 사용할 수 없습니다. 
              이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                계정 삭제
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-800">
                  정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingAccount ? '삭제 중...' : '예, 삭제합니다'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletingAccount}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}