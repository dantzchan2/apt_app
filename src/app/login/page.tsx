'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const quickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('password!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get CSRF token first
      const csrfResponse = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        setError('Failed to get security token');
        setIsLoading(false);
        return;
      }
      
      const { csrfToken } = await csrfResponse.json();

      // Make login request with CSRF token
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful, cookie is set by the server
        router.push('/dashboard');
      } else {
        setError(data.error || '잘못된 이메일 또는 비밀번호입니다');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-bold text-black">Studio Vit</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-black">
            계정에 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-black">
            아래 데모 계정으로 다양한 사용자 유형을 체험해보세요
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white text-black"
                placeholder="이메일을 입력하세요"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white text-black"
                placeholder="비밀번호를 입력하세요"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link href="/signup" className="text-sm text-orange-600 hover:text-orange-500">
              계정이 없으신가요? 회원가입
            </Link>
            <div>
              <Link href="/" className="text-sm text-black hover:text-gray-700">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </form>
        
        <div className="mt-6 p-4 bg-orange-50 rounded-lg">
          <h3 className="text-sm font-medium text-black mb-3">데모 계정 (비밀번호: password!):</h3>
          <div className="space-y-3 text-sm text-black">
            {/* Admin Account */}
            <div className="border-l-4 border-red-500 pl-3 flex justify-between items-center">
              <div>
                <p><strong>관리자:</strong> admin@ptvit.com</p>
                <p className="text-xs">전체 시스템 관리, 모든 사용자/트레이너/예약 관리</p>
              </div>
              <button 
                onClick={() => quickLogin('admin@ptvit.com')}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                선택
              </button>
            </div>
            
            {/* Trainer Accounts */}
            <div className="border-l-4 border-blue-500 pl-3 flex justify-between items-center">
              <div>
                <p><strong>헤드 트레이너:</strong> head@ptvit.com</p>
                <p className="text-xs">Head Trainer Kim - 프리미엄 개인 트레이닝</p>
              </div>
              <button 
                onClick={() => quickLogin('head@ptvit.com')}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                선택
              </button>
            </div>
            <div className="border-l-4 border-green-500 pl-3 flex justify-between items-center">
              <div>
                <p><strong>일반 트레이너:</strong> trainer@ptvit.com</p>
                <p className="text-xs">Trainer Lee - 일반 피트니스</p>
              </div>
              <button 
                onClick={() => quickLogin('trainer@ptvit.com')}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                선택
              </button>
            </div>
            <div className="border-l-4 border-green-500 pl-3 flex justify-between items-center">
              <div>
                <p><strong>일반 트레이너:</strong> trainer2@ptvit.com</p>
                <p className="text-xs">Trainer Park - 웨이트 트레이닝</p>
              </div>
              <button 
                onClick={() => quickLogin('trainer2@ptvit.com')}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                선택
              </button>
            </div>
            
            {/* User Accounts */}
            <div className="border-l-4 border-purple-500 pl-3 flex justify-between items-center">
              <div>
                <p><strong>헤드 트레이너 고객:</strong> user-head@ptvit.com</p>
                <p className="text-xs">Head Trainer Kim 전담 → 프리미엄 가격 상품만 구매 가능</p>
              </div>
              <button 
                onClick={() => quickLogin('user-head@ptvit.com')}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
              >
                선택
              </button>
            </div>
            <div className="border-l-4 border-orange-500 pl-3 flex justify-between items-center">
              <div>
                <p><strong>일반 고객 1:</strong> user1@ptvit.com</p>
                <p className="text-xs">Trainer Lee 전담 → 일반 가격 상품만 구매 가능</p>
              </div>
              <button 
                onClick={() => quickLogin('user1@ptvit.com')}
                className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
              >
                선택
              </button>
            </div>
            <div className="border-l-4 border-orange-500 pl-3 flex justify-between items-center">
              <div>
                <p><strong>일반 고객 2:</strong> user2@ptvit.com</p>
                <p className="text-xs">Trainer Park 전담 → 일반 가격 상품만 구매 가능</p>
              </div>
              <button 
                onClick={() => quickLogin('user2@ptvit.com')}
                className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
              >
                선택
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>💡 트레이너 배정 시스템:</strong> 각 사용자는 회원가입 시 배정받은 트레이너와만 예약할 수 있으며, 
              해당 트레이너 타입(헤드/일반)에 맞는 상품만 구매 가능합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}