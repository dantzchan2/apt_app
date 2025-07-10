'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  name: string;
  email: string;
  role: 'user' | 'trainer';
  points?: number;
  id: string;
}

interface PurchaseOption {
  id: string;
  points: number;
  price: number;
  popular?: boolean;
}

const purchaseOptions: PurchaseOption[] = [
  { id: 'basic', points: 5, price: 25 },
  { id: 'standard', points: 10, price: 45, popular: true },
  { id: 'premium', points: 20, price: 80 },
  { id: 'deluxe', points: 50, price: 180 }
];

export default function Purchase() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserData = localStorage.getItem('userData');
    
    if (authStatus !== 'true' || !storedUserData) {
      router.push('/login');
      return;
    }
    
    const parsedUserData = JSON.parse(storedUserData);
    if (parsedUserData.role !== 'user') {
      router.push('/dashboard');
      return;
    }
    
    setUserData(parsedUserData);
  }, []);

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

    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    setUserData(updatedUserData);
    setIsLoading(false);
    setSelectedOption(null);
    
    // Show success message (in a real app, you might use a toast notification)
    alert(`Successfully purchased ${option.points} points!`);
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Points</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Current Points: 
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {userData.points || 0}
                </span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Point Package
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Each point allows you to book one hour-long appointment with a trainer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {purchaseOptions.map((option) => (
            <div
              key={option.id}
              className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
                option.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {option.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                  {option.id}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {option.points}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">points</span>
                </div>
                <div className="mb-6">
                  <span className="text-2xl font-bold text-green-600">${option.price}</span>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ${(option.price / option.points).toFixed(2)} per point
                  </div>
                </div>
                
                <button
                  onClick={() => handlePurchase(option)}
                  disabled={isLoading && selectedOption === option.id}
                  className={`w-full py-3 px-4 rounded-md font-medium text-sm transition-colors ${
                    option.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading && selectedOption === option.id 
                    ? 'Processing...' 
                    : 'Purchase'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How Points Work
          </h3>
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p>Each point allows you to book one 1-hour appointment</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p>Points never expire</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p>Appointments can be scheduled at 10-minute intervals</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p>Cancel appointments up to 24 hours before to get your point back</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}