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
                Login
              </Link>
              <Link
                href="/login"
                className="bg-orange-600 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
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
              Welcome to{" "}
              <span className="text-orange-600">Studio Vit</span>
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
                  Get Started
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="#features"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div id="features" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-black sm:text-4xl">
                Features
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Everything you need to book and manage your training sessions
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-black mb-3">
                  Professional Trainers
                </h3>
                <p className="text-gray-600">
                  Book sessions with certified trainers across various specializations
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-black mb-3">
                  Point-Based System
                </h3>
                <p className="text-gray-600">
                  Purchase points to book appointments - flexible and convenient
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-black mb-3">
                  Flexible Scheduling
                </h3>
                <p className="text-gray-600">
                  Book appointments at 10-minute intervals that fit your schedule
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
                Meet Our Expert Trainers
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Professional certified trainers ready to help you achieve your fitness goals
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
                <p className="text-gray-600 mt-2">Strength & Conditioning Specialist</p>
                <p className="text-gray-500 text-sm mt-1">5+ years experience</p>
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
                <p className="text-gray-600 mt-2">Cardio & Endurance Coach</p>
                <p className="text-gray-500 text-sm mt-1">7+ years experience</p>
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
                <p className="text-gray-600 mt-2">Yoga & Flexibility Expert</p>
                <p className="text-gray-500 text-sm mt-1">6+ years experience</p>
              </div>
            </div>
          </div>
        </div>

        {/* Running Crew Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-black sm:text-4xl mb-8">
                Join Our Running Crew
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
                  <span className="text-gray-700">Weekly group runs every Saturday morning</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-orange-600 text-xl mr-3">🏆</span>
                  <span className="text-gray-700">Monthly fitness challenges and competitions</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-orange-600 text-xl mr-3">👥</span>
                  <span className="text-gray-700">Supportive community of fitness enthusiasts</span>
                </div>
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
