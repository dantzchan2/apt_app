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
          <h3 className="text-sm font-medium text-black mb-3">데모 계정:</h3>
          <div className="space-y-3 text-sm text-black">
            <div className="border-l-4 border-red-500 pl-3">
              <p><strong>관리자:</strong> admin@studiovit.com / password</p>
              <p className="text-xs">포인트 구매, 예약, 트레이닝 세션 관리, 모든 사용자 관리 가능</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-3">
              <p><strong>트레이너:</strong> sarah.johnson@studiovit.com / password</p>
              <p className="text-xs">자신의 트레이닝 예약을 조회하고 취소할 수 있음</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-3">
              <p><strong>사용자:</strong> john.smith@email.com / password</p>
              <p className="text-xs">포인트 구매 및 예약 가능</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}