import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { useUiFeedback } from "../../../context/UiFeedbackContext";

const BookingsList = ({ bookings, trucks = [], onRefetch }) => {
  const { toast } = useUiFeedback();
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const trucksById = useMemo(() => {
    const map = new Map();
    (Array.isArray(trucks) ? trucks : []).forEach((t) => {
      if (t?._id) map.set(String(t._id), t);
    });
    return map;
  }, [trucks]);

  const handleEdit = (booking) => {
    setEditingBooking(booking._id);
    setEditForm({
      status: booking.status || "pending",
      paymentStatus: booking.paymentStatus || "pending",
      notes: booking.notes || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    try {
      // Find the current booking to get the truck ID and check status change
      const currentBooking = bookings.find(b => b._id === editingBooking);
      const truckId = currentBooking?.truck?._id;
      const oldStatus = currentBooking?.status;
      const newStatus = editForm.status;
      
      // Update booking
      await axiosInstance.put(`/admin/booking/${editingBooking}`, editForm);
      
      // Handle truck availability based on status change
      if (truckId && oldStatus !== newStatus) {
        // If status is changing to in_transit, update truck availability to busy
        if (newStatus === "in_transit") {
          await axiosInstance.put(`/admin/truck/${truckId}`, { available: false });
        }
        // If status is changing from in_transit to completed, update truck availability to available
        else if (oldStatus === "in_transit" && newStatus === "completed") {
          await axiosInstance.put(`/admin/truck/${truckId}`, { available: true });
        }
        // If status is changing from completed back to in_transit, update truck availability to busy
        else if (oldStatus === "completed" && newStatus === "in_transit") {
          await axiosInstance.put(`/admin/truck/${truckId}`, { available: false });
        }
      }
      
      if (onRefetch) onRefetch();
      setEditingBooking(null);
      setEditForm({});
      toast({ type: "success", message: "Booking updated successfully" });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to update booking",
      });
    }
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPaymentStatus]);

  // Filter and search
  const filteredBookings = useMemo(() => {
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    
    // Debug: Log all bookings and their statuses
    console.log('All bookings:', safeBookings.map(b => ({ id: b._id, status: b.status, truck: b.truck?.title })));

    return safeBookings.filter((booking) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        booking.truck?.title?.toLowerCase().includes(searchLower) ||
        booking.customer?.name?.toLowerCase().includes(searchLower) ||
        booking.owner?.name?.toLowerCase().includes(searchLower) ||
        booking.pickup?.address?.toLowerCase().includes(searchLower) ||
        booking.dropoff?.address?.toLowerCase().includes(searchLower) ||
        booking.status?.toLowerCase().includes(searchLower) ||
        booking._id?.toLowerCase().includes(searchLower);

      const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
      const matchesPaymentStatus =
        filterPaymentStatus === "all" || booking.paymentStatus === filterPaymentStatus;

      // Debug: Log filtering results
      console.log(`Booking ${booking._id}: status="${booking.status}", matchesStatus=${matchesStatus}, matchesPaymentStatus=${matchesPaymentStatus}`);

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  }, [bookings, searchTerm, filterStatus, filterPaymentStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIndex = (pageSafe - 1) * itemsPerPage;
  const displayedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
            Bookings{" "}
            <span className="text-gray-500 text-base sm:text-lg">({Array.isArray(bookings) ? bookings.length : 0})</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Showing {filteredBookings.length === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
          >
            <option value="all">All Payment</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {displayedBookings.map((booking) => (
          <BookingCard
            key={booking._id}
            booking={booking}
            trucksById={trucksById}
            isEditing={editingBooking === booking._id}
            editForm={editForm}
            onInputChange={handleInputChange}
            onEdit={() => handleEdit(booking)}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
          />
        ))}

        {displayedBookings.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 sm:p-12 text-center lg:col-span-2">
            <p className="text-sm sm:text-base text-gray-500">No bookings found</p>
          </div>
        )}
      </div>

      {filteredBookings.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={pageSafe}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};

const BookingCard = ({
  booking,
  trucksById,
  isEditing,
  editForm,
  onInputChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded((v) => !v);
  };

  const formatStatus = (status) => {
    if (!status) return "";
    return status.replaceAll("_", " ").toUpperCase();
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gray-900 text-white border-transparent";
      case "accepted":
        return "bg-white text-gray-900 border-gray-900";
      case "pending":
        return "bg-gray-50 text-gray-700 border-gray-300";
      case "cancelled":
        return "bg-white text-gray-400 border-gray-200";
      case "declined":
        return "bg-white text-gray-400 border-gray-200";
      case "in_transit":
        return "bg-white text-gray-900 border-gray-900 font-bold";
      default:
        return "bg-gray-50 text-gray-700 border-gray-300";
    }
  };

  const bookingIdShort = booking._id ? `#${booking._id.slice(-6).toUpperCase()}` : "";
  const pickupText = booking.pickup?.address || (booking.pickup ? `${booking.pickup.lat}, ${booking.pickup.lng}` : "Not set");
  const dropoffText = booking.dropoff?.address || (booking.dropoff ? `${booking.dropoff.lat}, ${booking.dropoff.lng}` : "Not set");

  const resolvedTruck = useMemo(() => {
    const bTruck = booking?.truck;
    if (!bTruck) return null;

    const truckId = typeof bTruck === "object" && bTruck !== null ? bTruck._id || bTruck.id : bTruck;
    if (!truckId) return bTruck;

    const lookup = trucksById?.get ? trucksById.get(String(truckId)) : null;
    if (!lookup) return bTruck;
    return {
      ...lookup,
      ...bTruck,
    };
  }, [booking?.truck, trucksById]);

  const truckTitle = resolvedTruck?.title || booking.truck?.title || "Truck";
  const truckType = resolvedTruck?.type || booking.truck?.type || "N/A";
  const truckRate = resolvedTruck?.ratePerKm ?? booking.truck?.ratePerKm;
  const truckImageUrl = resolvedTruck?.imageUrl;

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-200">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{bookingIdShort}</p>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase truncate leading-tight">
              {booking.truck?.title || "Vehicle"}
            </h3>
            <p className="text-xs text-gray-600 mt-1 truncate">
              {booking.customer?.name || "Customer"} • {booking.owner?.name || "Owner"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border border-gray-300 bg-gray-100 text-gray-800 uppercase tracking-wide">
              {formatStatus(booking.status) || "pending"}
            </span>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                booking.paymentStatus === "paid"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              {booking.paymentStatus === "paid" ? "Paid" : "Payment pending"}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Route</p>
            <p className="text-xs text-gray-900 mt-1 line-clamp-1">
              <span className="font-semibold">From:</span> {pickupText}
            </p>
            <p className="text-xs text-gray-900 mt-1 line-clamp-1">
              <span className="font-semibold">To:</span> {dropoffText}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Distance</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {booking.distanceKm ?? "-"} km
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price</p>
              <p className="text-sm font-bold text-gray-900 mt-1">₹{booking.price ?? "-"}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Status
            </p>
            <select
              name="status"
              value={editForm.status}
              onChange={onInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="in_transit">In Transit</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Payment Status
            </p>
            <select
              name="paymentStatus"
              value={editForm.paymentStatus}
              onChange={onInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Notes
            </p>
            <textarea
              name="notes"
              value={editForm.notes}
              onChange={onInputChange}
              rows="3"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
          <button
            onClick={onSaveEdit}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-all duration-200 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl shadow-gray-100 border border-gray-100 hover:shadow-2xl transition-all duration-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
              {truckImageUrl ? (
                <img
                  src={truckImageUrl}
                  alt={truckTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center bg-gray-50"
                style={{ display: truckImageUrl ? "none" : "flex" }}
              >
                <div className="w-10 h-10 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  {truckTitle}
                </h3>
                <span className="text-[10px] text-gray-500 font-bold tracking-wider">{bookingIdShort}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs font-medium text-gray-700">{truckType}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-xs font-medium text-gray-700">{(booking.capacityTons ?? booking.truck?.capacityTons) || "N/A"}T</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider border ${getStatusStyles(booking.status)}`}>
              {formatStatus(booking.status) || "PENDING"}
            </span>
            {booking.paymentStatus === "paid" && (
              <span className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-[10px] font-bold tracking-wider">
                PAID
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4">
        <div className="relative bg-gray-50 rounded-xl p-4 mb-4">
          <div className="absolute -top-2 left-4 bg-white px-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Route</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">FROM</div>
              <div className="text-sm font-medium text-gray-900 truncate">{pickupText || "—"}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">TO</div>
              <div className="text-sm font-medium text-gray-900 truncate">{dropoffText || "—"}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">AMOUNT</div>
            <div className="text-xl font-black text-gray-900 tracking-tight">₹{booking.price ?? "—"}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">DISTANCE</div>
            <div className="text-xl font-black text-gray-900 tracking-tight">{booking.distanceKm ?? "—"} km</div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium text-gray-500">
            {booking.createdAt ? (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(booking.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            ) : "-"}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold tracking-wider hover:bg-gray-800 transition-all duration-200 active:scale-95 shadow-sm"
            >
              EDIT BOOKING
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              aria-label={expanded ? "Collapse details" : "Expand details"}
            >
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 group-hover:text-gray-900 ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-3">
          {booking.notes && (
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-1">NOTES</div>
              <div className="text-xs text-gray-700 leading-relaxed">{booking.notes}</div>
            </div>
          )}

          {booking.customer && (booking.customer.email || booking.customer.phone) && (
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-2">CUSTOMER CONTACT</div>
              <div className="space-y-1.5">
                {booking.customer.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 truncate">{booking.customer.email}</span>
                  </div>
                )}
                {booking.customer.phone && (
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700">{booking.customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {booking.owner && (booking.owner.email || booking.owner.phone) && (
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-2">OWNER CONTACT</div>
              <div className="space-y-1.5">
                {booking.owner.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 truncate">{booking.owner.email}</span>
                  </div>
                )}
                {booking.owner.phone && (
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700">{booking.owner.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  const pageButtons = useMemo(() => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-xs sm:text-sm text-gray-600">
        Page <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
        <span className="font-semibold text-gray-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Prev
        </button>

        {pageButtons.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 text-xs sm:text-sm font-semibold rounded-lg border transition-all duration-200 ${
              p === currentPage
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default BookingsList;
