'use client';

import NavDrawer from './NavDrawer';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'trainer' | 'admin';
  points?: number;
  id: string;
}

interface DashboardHeaderProps {
  userData: UserData;
  title: string;
  currentPage: string;
  showPoints?: boolean;
  customUserInfo?: string;
}

export default function DashboardHeader({ 
  userData, 
  title, 
  currentPage, 
  showPoints = false,
  customUserInfo 
}: DashboardHeaderProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <NavDrawer userData={userData} currentPage={currentPage} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300">
              {customUserInfo || (
                <>
                  {currentPage === '/dashboard' ? `Welcome ${userData.name}!` : userData.name}
                  {showPoints && (userData.role === 'user' || userData.role === 'admin') && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {userData.points || 0} points
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