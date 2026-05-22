import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useOwnerData } from "../hooks/useOwnerData";
import axiosInstance from "../utils/axiosInstance";
import { useUiFeedback } from "../context/UiFeedbackContext";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import OwnerBookingCard from "../components/dashboard/owner/OwnerBookingCard";
import BookingDetailModal from "../components/BookingDetailModal";

const OwnerBookings = () => {
  // --- Hooks and State Management ---
  const { toast, confirm } = useUiFeedback();
  const { search } = useLocation();
  const { trucks, bookings, loading, refetch } = useOwnerData();

  // View States
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Handle bookingId from URL query params
  useEffect(() => {
    const params = new URLSearchParams(search);
    const bookingId = params.get('bookingId');
    
    if (bookingId && bookings.length > 0) {
      const booking = bookings.find(b => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
      }
    }
  }, [search, bookings]);

  // Search/Filter States
  const [bookingSearchTerm, setBookingSearchTerm] = useState("");
  const [bookingFilterStatus, setBookingFilterStatus] = useState("all");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;

  // --- Handlers ---

  // Sync truck availability based on booking statuses
  const syncTruckAvailability = useCallback(async () => {
    try {
      console.log('Syncing truck availability...');
      
      // Find all trucks with in_transit bookings
      const inTransitBookings = bookings.filter(b => b.status === "in_transit");
      const inTransitTruckIds = inTransitBookings.map(b => b.truck?._id).filter(Boolean);
      
      // Find all trucks with completed bookings
      const completedBookings = bookings.filter(b => b.status === "completed");
      const completedTruckIds = completedBookings.map(b => b.truck?._id).filter(Boolean);
      
      console.log('In transit truck IDs:', inTransitTruckIds);
      console.log('Completed truck IDs:', completedTruckIds);
      
      // Update trucks with in_transit bookings to be busy
      for (const truckId of inTransitTruckIds) {
        const truck = trucks.find(t => t._id === truckId);
        if (truck && truck.available) {
          console.log('Updating in-transit truck to busy:', truckId);
          await axiosInstance.put(`/owner/trucks/${truckId}`, { available: false });
        }
      }
      
      // Update trucks with completed bookings to be available (if not in other active bookings)
      for (const truckId of completedTruckIds) {
        const truck = trucks.find(t => t._id === truckId);
        const hasActiveBookings = bookings.some(b => 
          b.truck?._id === truckId && 
          ["pending", "accepted", "in_transit"].includes(b.status)
        );
        
        if (truck && !truck.available && !hasActiveBookings) {
          console.log('Updating completed truck to available:', truckId);
          await axiosInstance.put(`/owner/trucks/${truckId}`, { available: true });
        }
      }
      
      refetch();
      toast({
        type: "success",
        message: "Truck availability synchronized successfully",
      });
    } catch (error) {
      console.error('Error syncing truck availability:', error);
      toast({
        type: "error",
        message: "Failed to sync truck availability",
      });
    }
  }, [bookings, trucks, refetch, toast]);

  const handleUpdateBookingStatus = useCallback(async (bookingId, newStatus) => {
    try {
      // Find the booking to get the truck ID
      const booking = bookings.find(b => b._id === bookingId);
      const truckId = booking?.truck?._id;
      
      console.log('Updating booking status:', { bookingId, newStatus, truckId, currentStatus: booking?.status });
      
      // Update booking status
      await axiosInstance.put(`/owner/bookings/${bookingId}/status`, { status: newStatus });
      
      // If status is changing to in_transit, update truck availability to busy
      if (newStatus === "in_transit" && truckId) {
        console.log('Setting truck to busy:', truckId);
        await axiosInstance.put(`/owner/trucks/${truckId}`, { available: false });
      }
      
      // If status is changing to completed, update truck availability to available
      if (newStatus === "completed" && truckId) {
        console.log('Setting truck to available:', truckId);
        await axiosInstance.put(`/owner/trucks/${truckId}`, { available: true });
      }
      
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
  }, [bookings, refetch, toast]);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.truck?.title?.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
      booking.truck?.type?.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
      booking.customer?.name?.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
      booking.pickupLocation?.address?.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
      booking.dropoffLocation?.address?.toLowerCase().includes(bookingSearchTerm.toLowerCase());
    
    const matchesStatus =
      bookingFilterStatus === "all" ||
      booking.status === bookingFilterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const displayedBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [bookingSearchTerm, bookingFilterStatus]);

  // Calculate stats
  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    acceptedBookings: bookings.filter((b) => b.status === "accepted").length,
    inTransitBookings: bookings.filter((b) => b.status === "in_transit").length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
  };

  if (loading) {
    return <LoadingSpinner message="Loading your bookings..." />;
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Bookings
                  </h1>
                  <p className="text-md text-gray-600 mt-1">
                    Manage your truck booking requests and schedule
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Section */}
        <div className="bg-white rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-300/50 shadow-md transform transition-all duration-300 hover:scale-105">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Booking Overview
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="inline-flex p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 shadow-md">
                <div className="text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stats.pendingBookings}</p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">Pending</p>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="inline-flex p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 shadow-md">
                <div className="text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stats.acceptedBookings}</p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">Accepted</p>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="inline-flex p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 shadow-md">
                <div className="text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4-4a2 2 0 104 0" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stats.inTransitBookings}</p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">In Transit</p>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="inline-flex p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 shadow-md">
                <div className="text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stats.completedBookings}</p>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">Completed</p>
            </div>
          </div>
        </div>

        {/* Enhanced Bookings Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300">
          {/* Enhanced Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-300/50 shadow-md transform transition-all duration-300 hover:scale-105">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Bookings</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {displayedBookings.length} of {filteredBookings.length} bookings
                  </p>
                </div>
              </div>
              
              {/* Enhanced Sync Button */}
              <button
                onClick={syncTruckAvailability}
                className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center gap-2 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Truck Availability
              </button>
            </div>

            {/* Enhanced Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={bookingSearchTerm}
                  onChange={(e) => setBookingSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-500 hover:from-gray-100 hover:to-gray-50 hover:border-gray-400 transition-all duration-300 placeholder-gray-500 shadow-sm hover:shadow-md"
                />
              </div>
              <select
                value={bookingFilterStatus}
                onChange={(e) => setBookingFilterStatus(e.target.value)}
                className="px-4 py-3 text-sm border border-gray-300 rounded-xl bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-500 hover:from-gray-100 hover:to-gray-50 hover:border-gray-400 transition-all duration-300 appearance-none cursor-pointer shadow-sm hover:shadow-md [&_*]:text-gray-700 focus:[&_*]:text-gray-700 [&_*]:bg-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in-transit">In Transit</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Bookings List / Empty State */}
          <div className="p-6">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No bookings found</h3>
                <p className="text-sm text-gray-500">No bookings match the selected filter.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {displayedBookings.map((booking) => (
                    <OwnerBookingCard
                      key={booking._id}
                      booking={booking}
                      onStatusUpdate={handleUpdateBookingStatus}
                      onClick={() => setSelectedBooking(booking)}
                    />
                  ))}
                </div>
                
                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 font-medium">
                        Showing {indexOfFirstBooking + 1} to {Math.min(indexOfLastBooking, filteredBookings.length)} of {filteredBookings.length} bookings
                      </div>
                      <div className="flex items-center gap-2">
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
                        
                        {/* Enhanced Page numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => paginate(pageNumber)}
                                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                                  currentPage === pageNumber
                                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>
                        
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
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <BookingDetailModal
            bookingId={selectedBooking._id}
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onStatusUpdate={handleUpdateBookingStatus}
            userRole="owner"
          />
        )}
      </div>
    </div>
  );
};

export default OwnerBookings;
