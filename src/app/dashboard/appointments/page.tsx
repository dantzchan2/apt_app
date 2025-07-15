'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../components/DashboardHeader';
import * as XLSX from 'xlsx';

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

interface AppointmentLog {
  id: string;
  appointmentId: string;
  action: 'booked' | 'cancelled';
  actionBy: string;
  actionByName: string;
  actionByRole: 'user' | 'trainer' | 'admin';
  timestamp: string;
  appointmentDate: string;
  appointmentTime: string;
  trainerId: string;
  trainerName: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export default function AppointmentLogs() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [appointmentLogs, setAppointmentLogs] = useState<AppointmentLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AppointmentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<'all' | 'booked' | 'cancelled'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'trainer' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserData = localStorage.getItem('userData');
    
    if (authStatus !== 'true' || !storedUserData) {
      router.push('/login');
      return;
    }
    
    const parsedUserData = JSON.parse(storedUserData);
    if (parsedUserData.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setCurrentUser(parsedUserData);
    
    // Load appointment logs
    const storedLogs = localStorage.getItem('appointmentLogs');
    if (storedLogs) {
      const logs = JSON.parse(storedLogs);
      setAppointmentLogs(logs);
      setFilteredLogs(logs);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let filtered = appointmentLogs;

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(log => log.actionByRole === roleFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actionByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by timestamp descending (most recent first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredLogs(filtered);
  }, [appointmentLogs, actionFilter, roleFilter, searchQuery]);

  const downloadAppointmentLogs = () => {
    if (filteredLogs.length === 0) {
      alert('No appointment logs found.');
      return;
    }

    const formattedLogs = filteredLogs.map(log => ({
      'Log ID': log.id,
      'Appointment ID': log.appointmentId,
      'Action': log.action,
      'Action By': log.actionByName,
      'Action By Role': log.actionByRole,
      'Timestamp': new Date(log.timestamp).toLocaleString(),
      'Appointment Date': log.appointmentDate,
      'Appointment Time': log.appointmentTime,
      'Trainer': log.trainerName,
      'User': log.userName,
      'User Email': log.userEmail
    }));

    const ws = XLSX.utils.json_to_sheet(formattedLogs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointment Logs');
    
    const fileName = `appointment_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'booked':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-orange-100 text-orange-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader 
        userData={currentUser} 
        title="Appointment Logs" 
        currentPage="/dashboard/appointments" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Logs</h3>
                <p className="text-2xl font-bold text-blue-600">{appointmentLogs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Booked</h3>
                <p className="text-2xl font-bold text-green-600">
                  {appointmentLogs.filter(log => log.action === 'booked').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancelled</h3>
                <p className="text-2xl font-bold text-red-600">
                  {appointmentLogs.filter(log => log.action === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtered</h3>
                <p className="text-2xl font-bold text-purple-600">{filteredLogs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Appointment Logs ({filteredLogs.length} of {appointmentLogs.length})
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadAppointmentLogs}
                  disabled={filteredLogs.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📊 Download Logs
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div></div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Action Filter */}
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value as 'all' | 'booked' | 'cancelled')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Actions</option>
                  <option value="booked">Booked</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'trainer' | 'admin')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="trainer">Trainers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Mobile View - Card Layout */}
          <div className="block sm:hidden">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No appointment logs found matching your search criteria.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.userName} → {log.trainerName}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        📅 {log.appointmentDate} at {log.appointmentTime}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        👤 Action by: {log.actionByName} 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(log.actionByRole)}`}>
                          {log.actionByRole}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop View - Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Appointment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No appointment logs found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.userName} → {log.trainerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {log.appointmentDate} at {log.appointmentTime}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.actionByName}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(log.actionByRole)}`}>
                          {log.actionByRole}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(log.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Appointment Logging Information:
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• All appointment bookings and cancellations are automatically logged</li>
            <li>• Logs show who performed the action (user, trainer, or admin)</li>
            <li>• Use filters to find specific actions, roles, or search by names</li>
            <li>• Download logs as Excel files for record keeping</li>
          </ul>
        </div>
      </main>
    </div>
  );
}