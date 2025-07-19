'use client';

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
  const getExpiringPointsWarning = () => {
    if (!userData?.pointBatches || userData.role === 'trainer') return null;
    
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const expiringBatches = userData.pointBatches.filter(batch => 
      new Date(batch.expiryDate) <= twoWeeksFromNow
    );
    
    if (expiringBatches.length === 0) return null;
    
    const expiringPoints = expiringBatches.reduce((sum, batch) => sum + batch.points, 0);
    
    return {
      points: expiringPoints,
      earliestExpiry: expiringBatches.reduce((earliest, batch) => 
        new Date(batch.expiryDate) < new Date(earliest.expiryDate) ? batch : earliest
      ).expiryDate
    };
  };

  const expiringWarning = getExpiringPointsWarning();

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
                  {expiringWarning.points} points expiring {new Date(expiringWarning.earliestExpiry).toLocaleDateString()}
                </span>
                <span className="sm:hidden">
                  {expiringWarning.points} pts exp {new Date(expiringWarning.earliestExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            <span className="text-black">
              {customUserInfo || (
                <>
                  <span className="hidden sm:inline">
                    Welcome, {userData.name}!
                  </span>
                  <span className="sm:hidden">
                    Welcome, {userData.name.split(' ')[0]}!
                  </span>
                  {showPoints && (userData.role === 'user' || userData.role === 'admin') && (
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      {userData.points || 0} pts
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}