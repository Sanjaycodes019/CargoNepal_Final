import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../utils/socket';
import BookingDetailModal from './BookingDetailModal';

const NotificationBell = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 5;

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      initSocket(user.id);

      const socket = getSocket();
      if (socket) {
        // Join appropriate room based on user role
        if (user.role === 'admin') {
          socket.emit('join-admin-room', user.id);
        } else {
          socket.emit('join-room', user.id);
        }

        socket.on('booking_updated', (data) => {
          fetchNotifications();
        });

        socket.on('new_booking', (data) => {
          fetchNotifications();
        });

        socket.on('notification', (data) => {
          fetchNotifications();
        });

        socket.on('new_notification', (data) => {
          fetchNotifications();
        });
      }

      return () => {
        if (socket) {
          socket.off('booking_updated');
          socket.off('new_booking');
          socket.off('notification');
          socket.off('new_notification');
        }
      };
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    try {
      let endpoint;
      // Use appropriate endpoint based on user role
      if (user.role === 'admin') {
        endpoint = '/admin/notifications';
      } else if (user.role === 'owner') {
        endpoint = '/owner/notifications';
      } else if (user.role === 'customer') {
        endpoint = '/customer/notifications';
      } else {
        endpoint = '/notifications'; // fallback
      }

      const response = await axiosInstance.get(endpoint);
      let notificationsData;
      
      // Handle different response structures
      if (response.data.data && response.data.data.notifications) {
        // Owner and customer endpoints return { data: { notifications: [...] } }
        notificationsData = response.data.data.notifications;
      } else {
        // Admin endpoint returns { data: [...] }
        notificationsData = response.data.data || [];
      }
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      let endpoint;
      // Use appropriate endpoint based on user role
      if (user.role === 'admin') {
        endpoint = `/admin/notifications/${notificationId}/read`;
      } else if (user.role === 'owner') {
        endpoint = `/owner/notifications/${notificationId}/read`;
      } else if (user.role === 'customer') {
        endpoint = `/customer/notifications/${notificationId}/read`;
      } else {
        endpoint = `/notifications/${notificationId}/read`; // fallback
      }

      await axiosInstance.put(endpoint);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      let endpoint;
      // Use appropriate endpoint based on user role
      if (user.role === 'admin') {
        endpoint = '/admin/notifications/mark-all-read';
      } else if (user.role === 'owner') {
        endpoint = '/owner/notifications/mark-all-read';
      } else if (user.role === 'customer') {
        endpoint = '/customer/notifications/mark-all-read';
      } else {
        endpoint = '/notifications/mark-all-read'; // fallback
      }

      await axiosInstance.put(endpoint);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          fetchNotifications();
        }}
        className="relative p-2 text-gray-700 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 border border-gray-200 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Quick Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-gray-700 hover:text-gray-900 font-medium bg-white px-2 py-1 rounded border border-gray-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-600 text-sm font-medium">No notifications</p>
                </div>
              ) : (
                (() => {
                  const indexOfLastNotification = currentPage * notificationsPerPage;
                  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
                  const currentNotifications = notifications.slice(indexOfFirstNotification, indexOfLastNotification);
                  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

                  return currentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={async () => {
                      if (!notification.read) {
                        handleMarkAsRead(notification._id);
                      }
                      setShowDropdown(false);
                      
                      // Handle verification notifications
                      if (notification.type === 'verification_granted') {
                        console.log('[NOTIFICATION_DEBUG] Verification notification clicked:', {
                          actionUrl: notification.actionUrl,
                          userRole: user.role
                        });
                        
                        if (notification.actionUrl) {
                          console.log('[NOTIFICATION_DEBUG] Navigating to actionUrl:', notification.actionUrl);
                          navigate(notification.actionUrl);
                        } else {
                          // Fallback navigation based on user role - updated to use profile
                          if (user.role === 'owner') {
                            console.log('[NOTIFICATION_DEBUG] Fallback: navigating to owner profile');
                            navigate('/owner/profile');
                          } else if (user.role === 'customer') {
                            console.log('[NOTIFICATION_DEBUG] Fallback: navigating to customer profile');
                            navigate('/customer/profile');
                          } else {
                            console.log('[NOTIFICATION_DEBUG] Fallback: navigating to admin profile');
                            navigate('/admin/profile');
                          }
                        }
                        return;
                      }

                      // Handle review notification - navigate to truck detail page
                      if (notification.type === 'review' && notification.truckId) {
                        navigate(`/trucks/${notification.truckId}`);
                        return;
                      }
                      
                      // Handle payment notifications - navigate to booking details
                      if (notification.type === 'payment' && notification.relatedId) {
                        // Navigate to the booking details page with the booking ID
                        navigate(`/owner/bookings?bookingId=${notification.relatedId}`);
                        return;
                      }
                      
                      // Handle booking notifications
                      if (notification.type === 'booking' && notification.relatedId) {
                        setSelectedBookingId(notification.relatedId);
                        setShowBookingModal(true);
                      } else if (notification.type === 'booking') {
                        if (user.role === 'owner') {
                          navigate('/owner/bookings');
                        } else {
                          navigate('/customer/dashboard');
                        }
                      }

                      // Handle admin notifications
                      if (notification.type === 'user_register' || notification.type === 'truck_register') {
                        console.log('[NOTIF_DEBUG] Admin notification clicked:', {
                          type: notification.type,
                          actionUrl: notification.actionUrl,
                          relatedId: notification.relatedId,
                          _id: notification._id,
                          fullNotif: notification
                        });
                        
                        // Use actionUrl if available, same as AdminNotificationCenter
                        if (notification.actionUrl) {
                          console.log('[NOTIF_DEBUG] Navigating to actionUrl:', notification.actionUrl);
                          navigate(notification.actionUrl);
                        } else {
                          console.log('[NOTIF_DEBUG] No actionUrl, using fallback');
                          // Fallback navigation
                          if (notification.type === 'user_register') {
                            navigate('/admin/users');
                          } else if (notification.type === 'truck_register') {
                            navigate('/admin/fleet');
                          }
                        }
                      } else if (notification.type === 'contact_form') {
                        navigate('/admin/bookings'); // Admin can see contact submissions
                      }
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                      !notification.read ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.read ? 'bg-gray-700' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${
                          !notification.read ? 'text-gray-900 font-semibold' : 'text-gray-700 font-normal'
                        }`}>{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ));
                })()
              )}
              
              {/* Pagination Controls */}
              {notifications.length > notificationsPerPage && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600">
                      Page {currentPage} of {Math.ceil(notifications.length / notificationsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(notifications.length / notificationsPerPage)))}
                      disabled={currentPage === Math.ceil(notifications.length / notificationsPerPage)}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Booking Detail Modal */}
      {showBookingModal && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBookingId(null);
          }}
          onStatusUpdate={() => {
            fetchNotifications();
            setShowBookingModal(false);
            setSelectedBookingId(null);
          }}
          userRole={user?.role}
        />
      )}
    </div>
  );
};

export default NotificationBell;