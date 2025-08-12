import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black">Studio Vit</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
              >
                로그인
              </Link>
              <Link
                href="/login"
                className="bg-orange-600 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                시작하기
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Welcome Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black sm:text-5xl md:text-6xl mb-8">
              <span className="text-orange-600">PT Studio Vit</span>에
              오신 것을 환영합니다
            </h1>
            
            <div className="relative w-full mb-8">
              <Image
                src="/images/image_1.png"
                alt="Studio Vit Hero"
                width={1200}
                height={600}
                className="w-full h-auto rounded-lg shadow-lg"
                priority
              />
            </div>

            <div className="max-w-md mx-auto sm:flex sm:justify-center">
              <div className="rounded-md shadow">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-red-600 md:py-4 md:text-lg md:px-10"
                >
                  시작하기
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="#features"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  더 알아보기
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div id="features" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-black sm:text-4xl">
                기능
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                트레이닝 세션 예약과 관리에 필요한 모든 것
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-black mb-3">
                  전문 트레이너
                </h3>
                <p className="text-gray-600">
                  다양한 전문 분야의 인증된 트레이너와 세션을 예약하세요
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-black mb-3">
                  포인트 기반 시스템
                </h3>
                <p className="text-gray-600">
                  포인트를 구매하여 예약하는 유연하고 편리한 시스템
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-black mb-3">
                  유연한 스케줄링
                </h3>
                <p className="text-gray-600">
                  당신의 일정에 맞는 10분 단위 예약 시스템
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Meet Our Trainers Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-black sm:text-4xl">
                전문 트레이너를 만나보세요
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                당신의 피트니스 목표 달성을 도와줄 전문 인증 트레이너들
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto mb-4">
                  <Image
                    src="/images/trainer_1.png"
                    alt="Sarah Johnson - Strength & Conditioning Specialist"
                    width={300}
                    height={400}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                <h3 className="text-xl font-semibold text-black">Sarah Johnson</h3>
                <p className="text-gray-600 mt-2">근력 및 컨디셔닝 전문가</p>
                <p className="text-gray-500 text-sm mt-1">5년 이상 경력</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4">
                  <Image
                    src="/images/trainer_2.png"
                    alt="Mike Chen - Cardio & Endurance Coach"
                    width={300}
                    height={400}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                <h3 className="text-xl font-semibold text-black">Mike Chen</h3>
                <p className="text-gray-600 mt-2">유산소 및 지구력 코치</p>
                <p className="text-gray-500 text-sm mt-1">7년 이상 경력</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4">
                  <Image
                    src="/images/trainer_3.png"
                    alt="Emma Rodriguez - Yoga & Flexibility Expert"
                    width={300}
                    height={400}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                <h3 className="text-xl font-semibold text-black">Emma Rodriguez</h3>
                <p className="text-gray-600 mt-2">요가 및 유연성 전문가</p>
                <p className="text-gray-500 text-sm mt-1">6년 이상 경력</p>
              </div>
            </div>
          </div>
        </div>

        {/* Running Crew Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-black sm:text-4xl mb-8">
                러닝 크루에 합류하세요
              </h2>
              
              <div className="mb-8">
                <Image
                  src="/images/image_2.png"
                  alt="Studio Vit Running Crew"
                  width={800}
                  height={500}
                  className="w-full h-auto rounded-lg shadow-lg mx-auto"
                />
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-center">
                  <span className="text-orange-600 text-xl mr-3">🏃</span>
                  <span className="text-gray-700">매주 토요일 아침 그룹 러닝</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-orange-600 text-xl mr-3">🏆</span>
                  <span className="text-gray-700">월간 피트니스 챌린지 및 대회</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-orange-600 text-xl mr-3">👥</span>
                  <span className="text-gray-700">피트니스 애호가들의 따뜻한 커뮤니티</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="py-16 bg-orange-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-black sm:text-4xl mb-4">
              🎯 데모 시스템 체험해보기
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              다양한 역할의 테스트 계정으로 시스템을 체험해보세요
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                <h3 className="font-semibold text-red-700 mb-2">👑 관리자</h3>
                <p className="text-sm text-gray-600">전체 시스템 관리 및 모든 기능 접근</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="font-semibold text-blue-700 mb-2">💎 헤드 트레이너</h3>
                <p className="text-sm text-gray-600">프리미엄 트레이닝 서비스 제공</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <h3 className="font-semibold text-green-700 mb-2">🏃 일반 트레이너</h3>
                <p className="text-sm text-gray-600">표준 트레이닝 서비스 제공</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                ✨ 트레이너 배정 시스템 특징
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">👥</span>
                  <span>각 고객은 전담 트레이너 배정</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">💰</span>
                  <span>트레이너 타입별 차별화된 가격</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">🎯</span>
                  <span>개인 맞춤형 트레이닝 경험</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">🔒</span>
                  <span>배정된 트레이너와만 예약 가능</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                🚀 로그인 페이지에서 테스트 계정 확인하기
              </Link>
              <div className="text-sm text-gray-600">
                7개의 테스트 계정으로 다양한 사용자 경험을 체험해보세요
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Studio Vit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
