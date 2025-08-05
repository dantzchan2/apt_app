'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  points?: number;
  id: string;
}

interface NavDrawerProps {
  userData: UserData;
  currentPage?: string;
}

export default function NavDrawer({ userData, currentPage }: NavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    setIsOpen(false);
    router.push('/');
  };

  const navigationItems = [
    {
      name: '대시보드',
      href: '/dashboard',
      icon: '🏠',
      roles: ['user', 'trainer', 'admin'],
    },
    {
      name: '포인트 구매',
      href: '/dashboard/purchase',
      icon: '$',
      roles: ['user', 'admin'],
    },
    {
      name: '예약 스케줄',
      href: '/dashboard/schedule',
      icon: '📅',
      roles: ['user', 'admin'],
    },
    {
      name: '내 트레이닝 세션',
      href: '/dashboard/trainer',
      icon: '💪',
      roles: ['trainer', 'admin'],
    },
    {
      name: '사용자 관리',
      href: '/dashboard/users',
      icon: '👥',
      roles: ['admin'],
    },
    {
      name: '예약 로그',
      href: '/dashboard/appointments',
      icon: '📋',
      roles: ['admin'],
    },
    {
      name: '월별 정산',
      href: '/dashboard/settlement',
      icon: '📊',
      roles: ['admin'],
    },
  ];

  const filteredNavItems = navigationItems.filter(item =>
    item.roles.includes(userData.role)
  );

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="네비게이션 메뉴 열기"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">메뉴</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="네비게이션 메뉴 닫기"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">{userData.name}</p>
                <p className="text-xs text-gray-500">{userData.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs capitalize">
                    {userData.role}
                  </span>
                  {(userData.role === 'user' || userData.role === 'admin') && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      {userData.points || 0} 포인트
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {filteredNavItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === item.href
                        ? 'bg-orange-100 text-orange-800'
                        : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}