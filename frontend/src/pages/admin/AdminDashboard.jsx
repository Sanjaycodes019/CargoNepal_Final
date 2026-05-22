import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalTrucks: 0,
      totalBookings: 0,
      pendingVerifications: 0,
      pendingBookings: 0,
      acceptedBookings: 0,
      inTransitBookings: 0,
      unreadNotifications: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      verifiedTrucks: 0,
      unverifiedTrucks: 0,
    },
    recentActivity: [],
    notifications: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes, notificationsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/analytics'),
        axiosInstance.get('/admin/notifications')
      ]);

      const stats = statsRes.data?.data || {};
      const activity = activityRes.data?.data || {};
      const notifications = notificationsRes.data?.data || [];

      setDashboardData({
        stats: {
          totalUsers: stats.totalUsers || 0,
          totalTrucks: stats.totalTrucks || 0,
          totalBookings: stats.totalBookings || 0,
          pendingVerifications: stats.pendingVerifications || 0,
          pendingBookings: stats.pendingBookings || 0,
          acceptedBookings: stats.acceptedBookings || 0,
          inTransitBookings: stats.inTransitBookings || 0,
          unreadNotifications: stats.unreadNotifications || 0,
          verifiedUsers: stats.verifiedUsers || 0,
          unverifiedUsers: stats.unverifiedUsers || 0,
          verifiedTrucks: stats.verifiedTrucks || 0,
          unverifiedTrucks: stats.unverifiedTrucks || 0
        },
        recentActivity: activity.recentActivity || [],
        notifications: notifications || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/admin/notifications/${notificationId}/read`);
      // Update local state to mark as read
      setDashboardData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Admin Dashboard
                  </h1>
                  <p className="text-md text-gray-500 mt-1">
                    Platform overview & management controls
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div>
            <div className="space-y-6">
              {/* User Stats Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0H6V-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    User Statistics
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0H6V-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.totalUsers)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Users</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.verifiedUsers)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Verified Users</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H5.417c-1.54 0-2.502 1.667-2.502 5.496a1 1 0 00.858.983l1.414 1.414a1 1 0 001.414 0l1.414-1.414a1 1 0 00.858-.983 5.496V11.75c0-1.54 1.667-2.502 2.502H5.417C4.163 14.25 2.5 15.917 2.5 17.413v5.496c0 1.54-.962 2.502-2.502 2.502h13.856c1.54 0 2.502-.962 2.502-2.502z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.unverifiedUsers)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Unverified Users</p>
                  </div>
                </div>
              </div>

              {/* Truck Stats Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m3-1h1m1 1h1m-1 1v-3a1 1 0 011-1h2a1 1 0 011 1v3m-1 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Truck Statistics
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m3-1h1m1 1h1m-1 1v-3a1 1 0 011-1h2a1 1 0 011 1v3m-1 0h4" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.totalTrucks)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Trucks</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.verifiedTrucks)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Verified Trucks</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H5.417c-1.54 0-2.502 1.667-2.502 5.496a1 1 0 00.858.983l1.414 1.414a1 1 0 001.414 0l1.414-1.414a1 1 0 00.858-.983 5.496V11.75c0-1.54 1.667-2.502 2.502H5.417C4.163 14.25 2.5 15.917 2.5 17.413v5.496c0 1.54-.962 2.502-2.502 2.502h13.856c1.54 0 2.502-.962 2.502-2.502z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.unverifiedTrucks)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Unverified Trucks</p>
                  </div>
                </div>
              </div>

              {/* Booking Stats Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2zm0 9a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-7-2V-2a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Booking Statistics
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2zm0 9a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-7-2V-2a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.totalBookings)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.pendingBookings || 0)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Pending</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.acceptedBookings || 0)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Accepted</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4-4a2 2 0 104 0" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{formatNumber(dashboardData.stats.inTransitBookings || 0)}</p>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">In Transit</p>
                  </div>
                </div>
              </div>

              
              {/* Quick Actions / Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Quick Actions Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0H6V-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/admin/users')}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Manage Users
                    </button>
                    <button
                      onClick={() => navigate('/admin/fleet')}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Fleet
                    </button>
                    <button
                      onClick={() => navigate('/admin/bookings')}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View Bookings
                    </button>
                  </div>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Recent Activities</h3>
                    </div>
                  </div>

                  {/* Activities Section */}
                  <div className="space-y-3">
                    {dashboardData.recentActivity.length === 0 ? (
                      <div className="text-center py-8">
                        <h3 className="text-lg font-medium text-black mb-2">No recent activity</h3>
                        <p className="text-gray-600">Activity will appear here as users interact with system.</p>
                      </div>
                    ) : (
                      (() => {
                        const indexOfLastItem = currentPage * itemsPerPage;
                        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                        const currentItems = dashboardData.recentActivity.slice(indexOfFirstItem, indexOfLastItem);

                        return currentItems.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {activity.type === 'user' && (
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0H6V-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              )}
                              {activity.type === 'truck' && (
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {activity.type === 'booking' && (
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2zm0 9a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-2-2V-2a2 2 0 012-2z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-black">{activity.title}</p>
                              <p className="text-xs text-gray-500">{activity.description}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ));
                        })()
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {dashboardData.recentActivity.length > itemsPerPage && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50 mt-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-gray-600">
                          Page {currentPage} of {Math.ceil(dashboardData.recentActivity.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(
                            prev + 1, 
                            Math.ceil(dashboardData.recentActivity.length / itemsPerPage)
                          ))}
                          disabled={currentPage === Math.ceil(dashboardData.recentActivity.length / itemsPerPage)}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
