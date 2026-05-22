import { useMemo, useEffect, useState } from "react";
import { useCustomerBookings } from "../hooks/useBookings";
import axiosInstance from "../utils/axiosInstance";
import { useUiFeedback } from "../context/UiFeedbackContext";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import DashboardHeader from "../components/dashboard/customer/DashboardHeader";
import BookingStatsCards from "../components/dashboard/customer/BookingStatsCards";
import BookingFilter from "../components/dashboard/customer/BookingFilter";
import BookingCard from "../components/dashboard/customer/BookingCard";

const Dashboard = () => {
  const { toast, confirm } = useUiFeedback();
  const { bookings, loading, refetch } = useCustomerBookings();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter bookings with enhanced search functionality
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    
    console.log('All bookings:', bookings);
    console.log('Search term:', searchTerm);
    
    // If search term is empty, return all bookings filtered by status only
    if (!searchTerm.trim()) {
      return bookings.filter((booking) => {
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        return matchesStatus;
      });
    }
    
    return bookings.filter((booking) => {
      const searchLower = searchTerm.toLowerCase();
      
      // Debug individual booking structure
      console.log('Booking structure:', booking);
      
      // Debug location fields specifically
      console.log('Pickup location:', booking.pickupLocation);
      console.log('Dropoff location:', booking.dropoffLocation);
      console.log('Pickup address:', booking.pickupLocation?.address);
      console.log('Dropoff address:', booking.dropoffLocation?.address);
      console.log('From field:', booking.from);
      console.log('To field:', booking.to);
      console.log('Direct pickup:', booking.pickup);
      console.log('Direct dropoff:', booking.dropoff);
      
      // Create searchable text from all available fields
      const searchableText = [
        // Truck info
        booking.truck?.title || '',
        booking.truck?.type || '',
        booking.truck?.brand || '',
        booking.truck?.model || '',
        
        // Location info - use the correct field names from actual data
        booking.pickup?.address || '', // Direct pickup address
        booking.dropoff?.address || '', // Direct dropoff address
        booking.pickupLocation?.address || '',
        booking.dropoffLocation?.address || '',
        booking.from || '',
        booking.to || '',
        
        // Owner info - more comprehensive
        booking.truck?.owner?.name || '',
        booking.truck?.owner?.firstName || '',
        booking.truck?.owner?.lastName || '',
        booking.ownerName || '',
        booking.owner?.name || '',
        booking.owner?.firstName || '',
        booking.owner?.lastName || '',
        booking.ownerId || '',
        
        // Booking info
        booking._id || '',
        booking.customerId || '',
        
        // Date info (convert to string)
        booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '',
        booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : '',
        booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : '',
        booking.dropoffDate ? new Date(booking.dropoffDate).toLocaleDateString() : '',
        booking.deliveryDate ? new Date(booking.deliveryDate).toLocaleDateString() : '',
      ].join(' ').toLowerCase();
      
      // Fallback: search through entire booking object as string
      const bookingAsText = JSON.stringify(booking).toLowerCase();
      const finalSearchableText = searchableText || bookingAsText;
      
      console.log('Searchable text:', searchableText);
      console.log('Final searchable text (with fallback):', finalSearchableText);
      
      const matchesSearch = finalSearchableText.includes(searchLower);
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      
      console.log(`Matches search: ${matchesSearch}, Matches status: ${matchesStatus}`);
      
      return matchesSearch && matchesStatus;
    });
  }, [statusFilter, bookings, searchTerm]);

  // Pagination logic
  const indexOfLastBooking = currentPage * itemsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
  const displayedBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleCancel = async (bookingId) => {
    const ok = await confirm({
      title: "Cancel booking",
      message: "Are you sure you want to cancel this booking?",
      confirmText: "Cancel booking",
      cancelText: "Keep",
    });

    if (!ok) {
      return;
    }

    try {
      await axiosInstance.put(`/customer/bookings/${bookingId}/cancel`);
      refetch();
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to cancel booking",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your bookings..." />;
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Customer Dashboard
                  </h1>
                  <p className="text-md text-gray-500 mt-1">
                    Manage your bookings and find trucks in one place.
                  </p>
                </div>
              </div>
              
              {/* Primary Action Button */}
              <a
                href="/customer/new-booking"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-gray-400/50"
              >
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Booking
              </a>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {bookings.length > 0 && (
          <>
            <BookingStatsCards bookings={bookings} />
            
            {/* Filter Section with Search */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by truck name, location, date, owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all placeholder-gray-400"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="in-transit">In Transit</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Filter Summary */}
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </div>
            </div>
          </>
        )}

        {/* Bookings Grid */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 mb-6">Create your first booking to get started</p>
            <a
              href="/customer/new-booking"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Booking
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {displayedBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onCancel={handleCancel}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {bookings.length > 0 && totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstBooking + 1} to {Math.min(indexOfLastBooking, filteredBookings.length)} of {filteredBookings.length} bookings
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          pageNum === currentPage
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
