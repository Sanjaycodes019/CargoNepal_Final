import { useState, useCallback, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
// --- Custom Imports (Assuming these exist in your project) ---
import { useOwnerData } from "../hooks/useOwnerData";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import BookingDetailModal from "../components/BookingDetailModal";
import OwnerStats from "../components/dashboard/owner/OwnerStats";
import TruckCard from "../components/dashboard/owner/TruckCard";
import OwnerBookingCard from "../components/dashboard/owner/OwnerBookingCard";
import TruckFormModal from "../components/shared/TruckFormModal";

const OwnerDashboard = () => {
  // --- Hooks and State Management ---
  const { toast, confirm } = useUiFeedback();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { trucks, bookings, loading, refetch } = useOwnerData();

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 5;
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // View States
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);

  // Search/Filter States (for stats overview only)
  const [truckSearchTerm, setTruckSearchTerm] = useState("");
  const [truckFilterStatus, setTruckFilterStatus] = useState("all");

  // --- Notification Handlers ---
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const response = await axiosInstance.get('/owner/notifications');
      setNotifications(response.data.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/owner/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Pagination logic
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Truck Form State
  const initialTruckForm = {
    title: "",
    type: "",
    capacityTons: "",
    ratePerKm: "",
    available: true,
    description: "",
    locationString: "",
    image: null,
    imagePreview: null, // For displaying image before upload
  };
  const [truckForm, setTruckForm] = useState(initialTruckForm);

  // --- Handlers ---

  const handleTruckFormChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setTruckForm(prev => ({
        ...prev,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : null,
      }));
    } else {
      setTruckForm(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  }, []);

  const resetTruckForm = () => {
    setTruckForm(initialTruckForm);
    setEditingTruck(null);
    setShowTruckForm(false);
  };

  const handleTruckFormSubmit = async (e) => {
    e.preventDefault();
    let isEditing = !!editingTruck;

    try {
      const form = new FormData();
      // Append data
      if (truckForm.title) form.append('title', truckForm.title);
      if (truckForm.type) form.append('type', truckForm.type);
      if (truckForm.capacityTons) form.append('capacityTons', truckForm.capacityTons);
      if (truckForm.ratePerKm) form.append('ratePerKm', truckForm.ratePerKm);
      form.append('available', truckForm.available);
      if (truckForm.description) form.append('description', truckForm.description);
      if (truckForm.locationString) form.append('locationString', truckForm.locationString);
      
      if (truckForm.image) {
        form.append('image', truckForm.image);
      }
      
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditing) {
        await axiosInstance.put(`/owner/trucks/${editingTruck._id}`, form, config);
      } else {
        await axiosInstance.post("/owner/trucks", form, config);
      }

      resetTruckForm();
      refetch();
      toast({
        type: "success",
        message: `Truck ${isEditing ? 'updated' : 'added'} successfully!`,
      });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} truck.`,
      });
    }
  };

  const handleEditTruck = (truck) => {
    setEditingTruck(truck);
    setTruckForm({
      title: truck.title || "",
      type: truck.type || "",
      capacityTons: truck.capacityTons?.toString() || "",
      ratePerKm: truck.ratePerKm?.toString() || "",
      available: truck.available,
      description: truck.description || "",
      locationString: truck.location?.address || "",
      image: null,
      imagePreview: truck.imageUrl || null,
    });
    setShowTruckForm(true);
  };

  const handleToggleAvailability = async (truckId) => {
    try {
      await axiosInstance.put(`/owner/trucks/${truckId}/toggle`);
      refetch();
      toast({
        type: "success",
        message: "Truck availability updated.",
      });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to toggle availability",
      });
    }
  };

  const handleDeleteTruck = async (truckId) => {
    const ok = await confirm({
      title: "Delete Truck",
      message: "Are you sure you want to permanently delete this truck? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      // Assuming 'confirm' utility handles danger styling internally
    });

    if (!ok) return;

    try {
      await axiosInstance.delete(`/owner/trucks/${truckId}`);
      refetch();
      toast({
        type: "success",
        message: "Truck deleted successfully.",
      });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to delete truck",
      });
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
  const confirmMessage = {
    accepted: "Accept this booking?",
    declined: "Decline this booking?",
    in_transit: "Mark this booking as in transit?",
    completed: "Mark this trip as completed?",
  };

  const ok = await confirm({
    title: "Update Booking Status",
    message: confirmMessage[status] || `Update booking status to ${status}?`,
    confirmText: "Confirm",
    cancelText: "Cancel",
  });
  if (!ok) return;

  try {
    // Find booking to get truck ID
    const booking = bookings.find(b => b._id === bookingId);
    const truckId = booking?.truck?._id;
    
    console.log('OwnerDashboard updating booking status:', { bookingId, status, truckId, currentStatus: booking?.status });

    const response = await axiosInstance.put(`/owner/bookings/${bookingId}/status`, { status });
    if (response.data.success) {
      // Fetch booking details to get truckId and dropoff
      const bookingRes = await axiosInstance.get(`/owner/bookings/${bookingId}`);
      const booking = bookingRes.data.data;
      
      // 1. If accepted or in_transit, mark truck as busy
      if ((status === "accepted" || status === "in_transit") && booking.truck?._id) {
        console.log('OwnerDashboard setting truck to busy:', booking.truck._id);
        await axiosInstance.put(`/owner/trucks/${booking.truck._id}`, { available: false });
      }
      // 2. If completed, mark free and update location
      if (status === "completed" && booking.truck?._id && booking.dropoff?.address) {
        console.log('OwnerDashboard setting truck to available:', booking.truck._id);
        await axiosInstance.put(`/owner/trucks/${booking.truck._id}`, { available: true, locationString: booking.dropoff.address });
      }
      refetch();
      setSelectedBooking(null);
      toast({
        type: "success",
        message: `Booking ${status} successfully`,
      });
    }
  } catch (error) {
    toast({
      type: "error",
      message: error.response?.data?.message || "Failed to update booking status",
    });
  }
};

  // --- Data Processing for View and Statistics ---

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." size="lg" />;
  }

  // Calculate Stats
  const stats = {
    totalTrucks: trucks.length,
    availableTrucks: trucks.filter((t) => t.available).length,
    unavailableTrucks: trucks.filter((t) => !t.available).length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    acceptedBookings: bookings.filter((b) => b.status === "accepted").length,
    inTransitBookings: bookings.filter((b) => b.status === "in_transit").length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
  };

  // Debug logging for stats
  console.log('Owner Dashboard Stats:', stats);
  console.log('Bookings with status:', bookings.map(b => ({ id: b._id, status: b.status })));

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Enhanced Header */}
        <div className="mb-8 lg:mb-10">
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border border-gray-300/50 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Fleet Owner Dashboard
                  </h1>
                  <p className="text-md text-gray-600 mt-1">
                    Manage your fleet and bookings in one place.
                  </p>
                </div>
              </div>
              
              {/* Enhanced Primary Action Button */}
              <button
                onClick={() => {
                  resetTruckForm();
                  setShowTruckForm(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 active:from-gray-900 active:to-gray-950 font-bold shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-gray-400/50 transform hover:scale-105 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Truck
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {/* OwnerStats component will use the grayscale palette internally */}
        <OwnerStats stats={stats} />

        {/* Quick Actions / Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Enhanced Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-300/50 shadow-md transform transition-all duration-300 hover:scale-105">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  console.log('Add New Truck button clicked');
                  resetTruckForm();
                  setShowTruckForm(true);
                  console.log('showTruckForm set to true');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Truck
              </button>
              <Link
                to="/owner/my-fleet"
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Manage Fleet
              </Link>
              <Link
                to="/owner/bookings"
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View All Bookings
              </Link>
            </div>
          </div>

          {/* Enhanced Recent Activity Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-300/50 shadow-md transform transition-all duration-300 hover:scale-105">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    // Mark all as read functionality
                    notifications.forEach(notification => {
                      if (!notification.read) {
                        handleMarkAsRead(notification._id);
                      }
                    });
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="space-y-3">
              {notificationsLoading ? (
                <div className="text-center py-6">
                  <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-500 font-medium">Loading notifications...</p>
                </div>
              ) : currentNotifications.length > 0 ? (
                currentNotifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`flex items-start justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      notification.read 
                        ? 'bg-gradient-to-r from-gray-50 to-white border border-gray-200' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300'
                    } hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5`}
                    onClick={async () => {
                      if (!notification.read) {
                        await handleMarkAsRead(notification._id);
                      }
                      
                      // Handle review notification - navigate to truck detail page
                      if (notification.type === 'review' && notification.truckId) {
                        navigate(`/trucks/${notification.truckId}`);
                        return;
                      }
                      
                      // Handle booking notifications
                      if (notification.type === 'booking' && notification.relatedId) {
                        setSelectedBookingId(notification.relatedId);
                        setShowBookingModal(true);
                      } else if (notification.type === 'booking' || notification.type === 'payment') {
                        if (user.role === 'owner') {
                          navigate('/owner/bookings');
                        } else {
                          navigate('/customer/dashboard');
                        }
                      } else if (notification.type === 'truck' && notification.truckId) {
                        navigate('/owner/my-fleet');
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 transition-all duration-300 ${
                        notification.read ? 'bg-gray-400' : 'bg-gray-600 animate-pulse'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm transition-all duration-300 ${
                          notification.read 
                            ? 'text-gray-600' 
                            : 'text-gray-900 font-bold'
                        }`}>
                          {notification.title || notification.message}
                        </p>
                        {notification.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      {!notification.read && (
                        <div className="w-2.5 h-2.5 bg-gray-700 rounded-full flex-shrink-0 animate-pulse"></div>
                      )}
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Notifications will appear here</p>
                </div>
              )}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 font-medium px-3 py-1 bg-gray-50 rounded-lg border border-gray-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showTruckForm && (
          <>
            {console.log('Modal should be rendering, showTruckForm:', showTruckForm)}
            <TruckFormModal
              isOpen={showTruckForm}
              onClose={() => {
                console.log('Modal close called');
                setShowTruckForm(false);
                resetTruckForm();
              }}
              onSubmit={(e) => {
                console.log('Form submit called', e);
                handleTruckFormSubmit(e);
              }}
              formData={truckForm}
              onChange={(e) => {
                console.log('Form change called', e.target.name, e.target.value);
                handleTruckFormChange(e);
              }}
              editingTruck={editingTruck}
            />
          </>
        )}

        {/* Booking Detail Modal */}
        {showBookingModal && selectedBookingId && (
          <BookingDetailModal
            bookingId={selectedBookingId}
            isOpen={showBookingModal}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedBookingId(null);
            }}
            onStatusUpdate={async (bookingId, newStatus) => {
              try {
                await axiosInstance.put(`/owner/bookings/${bookingId}/status`, { status: newStatus });
                refetch();
                toast({
                  type: "success",
                  message: `Booking ${newStatus} successfully`,
                });
              } catch (error) {
                toast({
                  type: "error",
                  message: error.response?.data?.message || "Failed to update booking status",
                });
              }
            }}
            userRole="owner"
          />
        )}
      </div>

      {/* Tailwind CSS for Custom Scrollbar (Grayscale) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6; /* Light gray track */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; /* Medium gray thumb */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; /* Darker gray on hover */
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboard;