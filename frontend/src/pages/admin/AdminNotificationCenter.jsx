import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { AuthContext } from '../../context/AuthContext';

const AdminNotificationCenter = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    read: 'all',
    dateRange: '7',
    search: ''
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchNotifications();
    }
  }, [isAuthenticated, user, filters, pagination.page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.read !== 'all') params.append('read', filters.read);
      if (filters.dateRange !== 'all') params.append('days', filters.dateRange);
      if (filters.search.trim()) params.append('search', filters.search.trim());
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await axiosInstance.get(`/admin/notifications?${params.toString()}`);
      setNotifications(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/admin/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put('/admin/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotifications = async (notificationIds) => {
    try {
      const deletePromises = notificationIds.map(id => 
        axiosInstance.delete(`/admin/notifications/${id}`)
      );
      await Promise.all(deletePromises);
      setNotifications(prev => 
        prev.filter(n => !notificationIds.includes(n._id))
      );
      setLoading(false);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'bg-gray-800',
      'medium': 'bg-gray-600',
      'low': 'bg-gray-400'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPriorityTextColor = (priority) => {
    const colors = {
      'high': 'text-white',
      'medium': 'text-white',
      'low': 'text-black'
    };
    return colors[priority] || 'text-white';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'new_owner': '○',
      'new_customer': '○',
      'new_truck': '◆',
      'truck_updated': '◇',
      'truck_deleted': '✕',
      'new_booking': '□',
      'booking_cancelled': '✕',
      'booking_updated': '◈',
      'payment_completed': '◉',
      'payment_failed': '◉',
      'new_review': '★',
      'review_reported': '★',
      'verification_request': '□',
      'verification_granted': '✓',
      'verification_revoked': '✕',
      'contact_form': '◉',
      'system_alert': '△',
      'maintenance': '◇'
    };
    return icons[type] || '○';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-3 bg-gray-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502H5.417c-1.54 0-2.502 1.667-2.502 5.496a1 1 0 00.858.983l1.414 1.414a1 1 0 001.414 0l1.414-1.414a1 1 0 00.858-.983 5.496V11.75c0-1.54 1.667-2.502 2.502H5.417C4.163 14.25 2.5 15.917 2.5 17.413v5.496c0 1.54-.962 2.502-2.502 2.502h13.856c1.54 0 2.502-.962 2.502-2.502z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Notification Management Center
                  </h1>
                  <p className="text-md text-gray-500 mt-1">
                    Comprehensive control and analysis of all system notifications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Advanced Filters
              </h3>
            </div>
            <button
              onClick={() => setFilters({
                type: 'all',
                priority: 'all',
                read: 'all',
                dateRange: '7',
                search: ''
              })}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium bg-gray-50 px-3 py-1.5 rounded border border-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
          <div className="border-t border-gray-100 pt-6">
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-2">Search Notifications</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by message or type..."
                  className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white"
              >
                <option value="all">All Types</option>
                <option value="booking">Booking</option>
                <option value="system">System</option>
                <option value="payment">Payment</option>
                <option value="review">Review</option>
                <option value="new_truck">New Truck</option>
                <option value="new_owner">New Owner</option>
                <option value="new_customer">New Customer</option>
                <option value="verification_request">Verification Request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.read}
                onChange={(e) => setFilters(prev => ({ ...prev, read: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white"
              >
                <option value="all">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white"
              >
                <option value="1">Last 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
          </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Quick Actions
              </h3>
            </div>
            
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all shadow-sm hover:shadow-md"
            >
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-3 bg-gray-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
              <p className="text-sm text-gray-600 font-medium">Try adjusting your filters to see more notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`group relative p-4 sm:p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                    !notification.read ? 'bg-gray-50 border-l-4 border-l-gray-600' : 'bg-white border-l-4 border-l-transparent'
                  }`}
                  onClick={async () => {
                    if (!notification.read) {
                      await handleMarkAsRead(notification._id);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`text-base leading-tight ${
                              !notification.read ? 'text-gray-900 font-bold' : 'text-gray-700 font-semibold'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className={`inline-flex items-center px-3 py-1 text-xs rounded-full font-medium ${
                              notification.priority === 'high' 
                                ? 'bg-gray-900 text-white' 
                                : notification.priority === 'medium'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              {notification.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed line-clamp-2 ${
                            !notification.read ? 'text-gray-800 font-medium' : 'text-gray-600 font-normal'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="px-3 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition-colors font-medium"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {notification.type.replace(/_/g, ' ')}
                          </span>
                          {notification.actionUrl && (
                            <button
                              onClick={() => navigate(notification.actionUrl)}
                              className="text-black hover:text-gray-700 underline font-medium transition-colors"
                            >
                              View Details →
                            </button>
                          )}
                        </div>
                        <button
                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => {
                            const element = document.getElementById(`notification-full-${notification._id}`);
                            element.classList.toggle('hidden');
                          }}
                        >
                          See more
                        </button>
                      </div>
                      
                      <div id={`notification-full-${notification._id}`} className="hidden mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
                        <p className="mb-2"><strong>Full Message:</strong> {notification.message}</p>
                        <p><strong>Created:</strong> {new Date(notification.createdAt).toLocaleString()}</p>
                        {notification.actionUrl && (
                          <p className="mt-2">
                            <a href={notification.actionUrl} className="text-black hover:text-gray-700 underline">
                              Take Action →
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} notifications
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          pageNum === pagination.page
                            ? 'bg-gray-800 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationCenter;
