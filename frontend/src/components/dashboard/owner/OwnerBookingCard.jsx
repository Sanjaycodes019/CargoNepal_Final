import React from 'react';

const OwnerBookingCard = ({ booking, onStatusUpdate, onClick }) => {
  const imgSrc = booking.truck?.imageUrl;
  
  const formatStatus = (status) => {
    if (!status) return "";
    return status.replaceAll("_", " ").toUpperCase();
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gradient-to-r from-gray-800 to-gray-900 text-white border-transparent shadow-md";
      case "accepted":
        return "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 border-gray-400 shadow-sm";
      case "pending":
        return "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border-amber-300 shadow-sm";
      case "declined":
        return "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 shadow-sm";
      case "in_transit":
        return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-blue-300 shadow-sm";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 shadow-sm";
    }
  };

  const bookingIdShort = booking._id ? `#${booking._id.slice(-6).toUpperCase()}` : "";
  const pickupText = booking.pickup?.address || "N/A";
  const dropoffText = booking.dropoff?.address || "N/A";
  const dateText = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      }) : "-";
  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-0 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group shadow-2xl"
      onClick={onClick}
    >
      {/* Enhanced Header Section */}
      <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Enhanced Truck Image */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
              {imgSrc && imgSrc.trim() !== '' ? (
                <img
                  src={imgSrc}
                  alt={booking.truck?.title || "Truck"}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
                style={{ display: imgSrc && imgSrc.trim() !== '' ? "none" : "flex" }}
              >
                <TruckIcon className="w-6 h-6 text-gray-500" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-gray-900 truncate">
                  {booking.truck?.title || "Unknown Truck"}
                </h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter bg-gray-100 px-1.5 py-0.5 rounded">{bookingIdShort}</span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium truncate mt-0.5">
                Client: {booking.customer?.name || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider transition-all duration-300 ${getStatusStyles(booking.status)}`}>
              {formatStatus(booking.status) || "PENDING"}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Route Section with Better Contrast */}
      <div className="px-5 py-4 bg-white border-b border-gray-100">
        <div className="relative flex flex-col gap-4">
          {/* Vertical Line connecting pins */}
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-200 to-gray-200"></div>
          
          <div className="flex items-start gap-3 relative z-10 group">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-gray-500 group-hover:bg-blue-600 transition-colors"></div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-none mb-1.5">Pickup</p>
              <p className="text-[13px] font-medium text-gray-800 truncate">{pickupText}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 relative z-10 group">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-red-600 transition-colors"></div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-none mb-1.5">Dropoff</p>
              <p className="text-[13px] font-medium text-gray-800 truncate">{dropoffText}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Matching Design Detail Modal */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <StatBox label="Distance" value={`${booking.distanceKm ?? "-"} km`} />
          <StatBox label="Total Price" value={`₹${booking.price ?? "-"}`} />
          <StatBox label="Capacity" value={(booking.capacityTons ?? booking.truck?.capacityTons) ? `${booking.capacityTons ?? booking.truck?.capacityTons}T` : "-"} />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 text-gray-400">
           <CalendarIcon className="w-3 h-3" />
           <span className="text-[10px] font-medium uppercase">{dateText}</span>
        </div>

        <div className="flex items-center gap-2">
          {booking.status === "pending" && (
            <>
              <button
                onClick={() => onStatusUpdate(booking._id, "accepted")}
                className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors shadow-sm"
              >
                Accept
              </button>
              <button
                onClick={() => onStatusUpdate(booking._id, "declined")}
                className="px-4 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
            </>
          )}

          {booking.status === "accepted" && (
            <button
              onClick={() => onStatusUpdate(booking._id, "in_transit")}
              disabled={booking.paymentStatus !== 'paid'}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                booking.paymentStatus === 'paid'
                  ? 'bg-gray-800 text-white hover:bg-black'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              {booking.paymentStatus === 'paid' ? 'Start Trip' : 'Awaiting Payment'}
            </button>
          )}

          {booking.status === "in_transit" && (
            <button
              onClick={() => onStatusUpdate(booking._id, "completed")}
              className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
            >
              Complete Trip
            </button>
          )}
          
          {booking.status === "completed" && (
             <div className="flex items-center gap-1 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                <CheckIcon className="w-3 h-3" />
                <span>Finished</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- Helper Components for Consistency --- */

const StatBox = ({ label, value }) => (
  <div className="bg-white rounded-lg p-2 border border-gray-100">
    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tight mb-0.5">{label}</p>
    <p className="text-xs font-medium text-gray-800 truncate">{value}</p>
  </div>
);

/* --- Design Icons (Monochrome Modal Style) --- */
const PinIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TruckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1" /></svg>;
const CalendarIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CheckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;

export default OwnerBookingCard;