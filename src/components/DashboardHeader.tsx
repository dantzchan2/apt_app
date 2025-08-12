'use client';

import { useState, useEffect } from 'react';
import NavDrawer from './NavDrawer';

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
}

interface UserPointsData {
  totalPoints: number;
  pointsByDuration: {
    30: number;
    60: number;
  };
  expiringPoints: {
    total: number;
    byDuration: {
      30: number;
      60: number;
    };
    earliestExpiry?: string;
  };
}

interface DashboardHeaderProps {
  userData: UserData;
  title: string;
  currentPage: string;
  showPoints?: boolean;
  customUserInfo?: React.ReactNode;
}

export default function DashboardHeader({ 
  userData, 
  currentPage, 
  showPoints = false,
  customUserInfo 
}: DashboardHeaderProps) {
  const [userPoints, setUserPoints] = useState<UserPointsData | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);

  useEffect(() => {
    if (showPoints && (userData.role === 'user' || userData.role === 'admin')) {
      fetchUserPoints();
    }
  }, [showPoints, userData.role, userData.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserPoints = async () => {
    if (pointsLoading) return;
    
    setPointsLoading(true);
    try {
      const response = await fetch('/api/user-points', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data);
      } else {
        console.error('Failed to fetch user points');
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setPointsLoading(false);
    }
  };

  const getExpiringPointsWarning = () => {
    if (!userPoints?.expiringPoints || userData.role === 'trainer') return null;
    
    if (userPoints.expiringPoints.total === 0) return null;
    
    return {
      points: userPoints.expiringPoints.total,
      byDuration: userPoints.expiringPoints.byDuration,
      earliestExpiry: userPoints.expiringPoints.earliestExpiry
    };
  };

  const expiringWarning = getExpiringPointsWarning();

  const renderPointsDisplay = () => {
    if (!showPoints || (userData.role !== 'user' && userData.role !== 'admin')) {
      return null;
    }

    if (pointsLoading) {
      return (
        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
          로딩 중...
        </span>
      );
    }

    if (!userPoints) {
      return (
        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
          {userData.points || 0}pt
        </span>
      );
    }

    const { pointsByDuration } = userPoints;
    const hasPoints = pointsByDuration[30] > 0 || pointsByDuration[60] > 0;

    if (!hasPoints) {
      return (
        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
          0pt
        </span>
      );
    }

    return (
      <div className="ml-2 flex flex-wrap gap-1">
        {pointsByDuration[30] > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            30분 {pointsByDuration[30]}pt
          </span>
        )}
        {pointsByDuration[60] > 0 && (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
            60분 {pointsByDuration[60]}pt
          </span>
        )}
      </div>
    );
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
          <div className="flex items-center space-x-4">
            <NavDrawer userData={userData} currentPage={currentPage} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {expiringWarning && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                <span>⚠️</span>
                <span className="hidden sm:inline">
                  {expiringWarning.points}포인트 {expiringWarning.earliestExpiry ? new Date(expiringWarning.earliestExpiry).toLocaleDateString() : ''} 만료
                </span>
                <span className="sm:hidden">
                  {expiringWarning.points}pt {expiringWarning.earliestExpiry ? new Date(expiringWarning.earliestExpiry).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''} 만료
                </span>
              </div>
            )}
            <span className="text-black">
              {customUserInfo || (
                <>
                  <span className="hidden sm:inline">
                    안녕하세요, {userData.name}님!
                  </span>
                  <span className="sm:hidden">
                    안녕하세요, {userData.name.split(' ')[0]}님!
                  </span>
                  {renderPointsDisplay()}
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}