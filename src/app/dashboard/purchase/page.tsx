'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import * as XLSX from 'xlsx';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  points?: number;
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserData = localStorage.getItem('userData');
    
    if (authStatus !== 'true' || !storedUserData) {
      router.push('/login');
      return;
    }
    
    const parsedUserData = JSON.parse(storedUserData);
    if (parsedUserData.role !== 'user' && parsedUserData.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setUserData(parsedUserData);
    
    // Load purchase logs
    const logs = JSON.parse(localStorage.getItem('purchaseLogs') || '[]');
    setPurchaseLogs(logs);
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
    
    // Also update the user in the allUsers list if it exists
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const updatedAllUsers = allUsers.map((user: UserData) => 
      user.id === userData.id ? updatedUserData : user
    );
    if (updatedAllUsers.some((user: UserData) => user.id === userData.id)) {
      localStorage.setItem('allUsers', JSON.stringify(updatedAllUsers));
    }
    
    // Log the purchase
    const purchaseLog: PurchaseLog = {
      purchase_id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userData.id,
      user_name: userData.name,
      user_email: userData.email,
      purchase_item_id: option.id,
      datetime: new Date().toISOString(),
      price: option.price,
      points: option.points
    };

    // Save to purchase logs
    const existingLogs = JSON.parse(localStorage.getItem('purchaseLogs') || '[]');
    existingLogs.push(purchaseLog);
    localStorage.setItem('purchaseLogs', JSON.stringify(existingLogs));
    
    setIsLoading(false);
    setSelectedOption(null);
    
    // Show success message (in a real app, you might use a toast notification)
    alert(`Successfully purchased ${option.points} points!`);
    
    // Refresh purchase logs
    const updatedLogs = JSON.parse(localStorage.getItem('purchaseLogs') || '[]');
    setPurchaseLogs(updatedLogs);
  };

  const downloadPurchaseLogs = () => {
    if (purchaseLogs.length === 0) {
      alert('No purchase logs found.');
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

    const ws = XLSX.utils.json_to_sheet(formattedLogs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Logs');
    
    const fileName = `purchase_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
      id: 'debug-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
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

    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    setUserData(updatedUserData);
    
    // Also update the user in the allUsers list if it exists
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const updatedAllUsers = allUsers.map((user: UserData) => {
      if (user.id === userData.id) {
        return {
          ...user,
          pointBatches: validBatches,
          points: totalPoints
        };
      }
      return user;
    });
    if (updatedAllUsers.some((user: UserData) => user.id === userData.id)) {
      localStorage.setItem('allUsers', JSON.stringify(updatedAllUsers));
    }
    
    // Log the debug purchase
    const purchaseLog: PurchaseLog = {
      purchase_id: 'debug-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userData.id,
      user_name: userData.name,
      user_email: userData.email,
      purchase_item_id: 'debug-expiring',
      datetime: new Date().toISOString(),
      price: 0,
      points: 3
    };

    // Save to purchase logs
    const existingLogs = JSON.parse(localStorage.getItem('purchaseLogs') || '[]');
    existingLogs.push(purchaseLog);
    localStorage.setItem('purchaseLogs', JSON.stringify(existingLogs));
    
    setIsLoading(false);
    
    // Refresh purchase logs
    const updatedLogs = JSON.parse(localStorage.getItem('purchaseLogs') || '[]');
    setPurchaseLogs(updatedLogs);
    
    alert('Debug purchase successful! Added 3 points that expire tomorrow.');
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
      <DashboardHeader 
        userData={userData} 
        title="Purchase Points" 
        currentPage="/dashboard/purchase" 
        customUserInfo={
          <>
            Current Points: 
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {userData.points || 0}
            </span>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Point Package
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Each point allows you to book one hour-long appointment with a trainer
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            ⚠️ Points expire after 6 months from purchase date
          </p>
          
          {/* Debug Purchase Button */}
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              🐛 Debug: Test Expiry Warning
            </h3>
            <button
              onClick={handleDebugPurchase}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add 3 Points Expiring Tomorrow'}
            </button>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              This will add points that expire tomorrow to test the warning system
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
              <p>Points expire 6 months after purchase date</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p>Oldest points are used first when booking appointments</p>
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

        {/* Purchase History Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Purchase History ({getUserPurchaseLogs().length} purchases)
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  {showLogs ? 'Hide' : 'Show'} Purchase History
                </button>
                {getUserPurchaseLogs().length > 0 && (
                  <button
                    onClick={downloadPurchaseLogs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    💰 Download Purchase Logs
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {showLogs && (
            <div className="p-6">
              {getUserPurchaseLogs().length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No purchase history found. Start by purchasing some points!
                </p>
              ) : (
                <div className="space-y-4">
                  {getUserPurchaseLogs().map((log) => (
                    <div key={log.purchase_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">$</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                            {log.purchase_item_id} Package
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateTime(log.datetime)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {log.purchase_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${log.price}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          +{log.points} points
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