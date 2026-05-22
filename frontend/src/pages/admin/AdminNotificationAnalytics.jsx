import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { AuthContext } from '../../context/AuthContext';

const AdminNotificationAnalytics = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalNotifications: 0,
    unreadNotifications: 0,
    readNotifications: 0,
    typeStats: [],
    priorityStats: [],
    dailyStats: [],
    weeklyStats: [],
    monthlyStats: [],
    responseTime: {
      average: 0,
      median: 0,
      fastest: 0,
      slowest: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7'); // days
  const [chartType, setChartType] = useState('type'); // type, priority, timeline

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [isAuthenticated, user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/notifications/analytics?days=${timeRange}`);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'new_owner': '#1F2937',
      'new_customer': '#374151',
      'new_truck': '#4B5563',
      'booking_updated': '#6B7280',
      'new_booking': '#9CA3AF',
      'payment_completed': '#D1D5DB',
      'payment_failed': '#000000',
      'new_review': '#4B5563',
      'review_reported': '#111827',
      'contact_form': '#6B7280',
      'system_alert': '#9CA3AF',
      'verification_request': '#374151',
      'verification_granted': '#1F2937',
      'verification_revoked': '#111827'
    };
    return colors[type] || '#6B7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#000000',
      'medium': '#4B5563',
      'low': '#9CA3AF'
    };
    return colors[priority] || '#6B7280';
  };

  const formatNumber = (num) => {
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Notification Analytics</h1>
          <p className="text-gray-600">Insights and trends for admin notifications</p>
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="1">Last24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>

              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="type">By Type</option>
                <option value="priority">By Priority</option>
                <option value="timeline">Timeline</option>
              </select>
            </div>

            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-black">{formatNumber(analytics.totalNotifications)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unread</p>
                    <p className="text-2xl font-bold text-black">{formatNumber(analytics.unreadNotifications)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Read</p>
                    <p className="text-2xl font-bold text-black">{formatNumber(analytics.readNotifications)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.responseTime.average}h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Type Distribution Chart */}
              {chartType === 'type' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Notifications by Type</h3>
                  <div className="space-y-3">
                    {analytics.typeStats.map((stat, index) => (
                      <div key={stat._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: getTypeColor(stat._id) }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {stat._id.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-bold text-black">{stat.count}</span>
                          <span className="text-sm text-gray-500">
                            {((stat.count / analytics.totalNotifications) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Distribution Chart */}
              {chartType === 'priority' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Notifications by Priority</h3>
                  <div className="space-y-3">
                    {analytics.priorityStats.map((stat, index) => (
                      <div key={stat._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: getPriorityColor(stat._id) }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {stat._id} Priority
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-bold text-gray-900">{stat.count}</span>
                          <span className="text-sm text-gray-500">
                            {((stat.count / analytics.totalNotifications) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Chart */}
              {chartType === 'timeline' && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-black mb-4">Notification Timeline</h3>
                  <div className="space-y-2">
                    {analytics.dailyStats.slice(0, 14).map((stat, index) => (
                      <div key={stat.date} className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 w-20">
                          {new Date(stat.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="bg-gray-800 h-6 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((stat.count / Math.max(...analytics.dailyStats.map(d => d.count))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-black w-8 text-right">
                          {stat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Response Time Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Response Time Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Average</p>
                  <p className="text-xl font-bold text-black">{analytics.responseTime.average}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Median</p>
                  <p className="text-xl font-bold text-black">{analytics.responseTime.median}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Fastest</p>
                  <p className="text-xl font-bold text-gray-800">{analytics.responseTime.fastest}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Slowest</p>
                  <p className="text-xl font-bold text-gray-700">{analytics.responseTime.slowest}h</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationAnalytics;
