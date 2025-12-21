import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { useUiFeedback } from "../../../context/UiFeedbackContext";

const BookingCard = ({ booking, onCancel, onRefresh }) => {
  const { toast } = useUiFeedback();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setExpanded((v) => !v);
  };

  const formatStatus = (status) => {
    if (!status) return "";
    return status.replaceAll("_", " ").toUpperCase();
  };

  const handlePayment = (e) => {
    e.stopPropagation();
    navigate(`/payments/${booking._id}`);
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await axiosInstance.get(`/bookings/${booking._id}/invoice`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ type: "error", message: "Failed to download invoice" });
    }
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gray-900 text-white border-gray-900";
      case "accepted":
        return "bg-white text-gray-900 border-gray-900";
      case "in_transit":
        return "bg-gray-900 text-white border-gray-900";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "cancelled":
        return "bg-white text-gray-500 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Truck Image */}
            <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
              {booking.truck?.imageUrl ? (
                <img
                  src={booking.truck.imageUrl}
                  alt={booking.truck?.title || "Truck"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center bg-gray-100"
                style={{ display: booking.truck?.imageUrl ? "none" : "flex" }}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>

            {/* Title & Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {booking.truck?.title || "Truck"}
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">
                  #{booking._id?.slice(-6)?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{booking.truck?.type || "N/A"}</span>
                <span>•</span>
                <span>{(booking.capacityTons ?? booking.truck?.capacityTons) || "N/A"}T</span>
                {booking.owner?.name && (
                  <>
                    <span>•</span>
                    <span className="truncate">{booking.owner.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2.5 py-1 rounded text-[10px] font-semibold border ${getStatusStyles(booking.status)}`}>
              {formatStatus(booking.status) || "PENDING"}
            </span>
            {booking.paymentStatus === "paid" && (
              <span className="px-2.5 py-1 rounded bg-black text-white text-[10px] font-semibold">
                PAID
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Route & Key Stats */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-500 font-medium mb-1">FROM</div>
            <div className="text-xs font-medium text-gray-900 truncate">{booking.pickup?.address || "N/A"}</div>
          </div>
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex-1 min-w-0 text-right">
            <div className="text-[10px] text-gray-500 font-medium mb-1">TO</div>
            <div className="text-xs font-medium text-gray-900 truncate">{booking.dropoff?.address || "N/A"}</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded px-3 py-2 border border-gray-100">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">AMOUNT</div>
            <div className="text-sm font-bold text-gray-900">₹{booking.price ?? "-"}</div>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2 border border-gray-100">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">DISTANCE</div>
            <div className="text-sm font-bold text-gray-900">{booking.distanceKm ?? "-"} km</div>
          </div>
          <div className="bg-gray-50 rounded px-3 py-2 border border-gray-100">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">RATE/KM</div>
            <div className="text-sm font-bold text-gray-900">₹{booking.truck?.ratePerKm ?? "-"}</div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-US", { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : "-"}
          </div>

          <div className="flex items-center gap-2">
            {/* Pay Now Button */}
            {booking.status === "accepted" && booking.paymentStatus !== "paid" && (
              <button
                onClick={handlePayment}
                className="px-3 py-1.5 bg-black text-white rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
              >
                Pay Now
              </button>
            )}

            {/* Download Invoice Button */}
            {booking.status === "completed" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadInvoice();
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice
              </button>
            )}

            {/* Cancel Button */}
            {(booking.status === "pending" || booking.status === "accepted") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(booking._id);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {/* Expand Button */}
            <button
              onClick={toggleExpanded}
              className="p-1.5 hover:bg-white rounded transition-colors"
            >
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} 
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

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-3">
          {/* Booked On */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Booked On</span>
            <span className="font-medium text-gray-900">
              {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-US", { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              }) : "-"}
            </span>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-1">NOTES</div>
              <div className="text-xs text-gray-700 leading-relaxed">{booking.notes}</div>
            </div>
          )}

          {/* Owner Contact */}
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

export default BookingCard;