import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { format } from "date-fns";

const Payment = () => {
  const { showToast } = useUiFeedback();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState({
    _id: "",
    truck: {},
    pickup: {},
    dropoff: {},
    startTime: new Date(),
    endTime: new Date(),
    distanceKm: 0,
    price: 0,
    capacityTons: 0,
    status: "",
    paymentStatus: "",
    notes: "",
  });
  const [truckDetails, setTruckDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("esewa");
  const [processing, setProcessing] = useState(false);

  // Calculate derived values based on real booking data
  const baseFare =
    booking?.truck?.ratePerKm && booking?.distanceKm
      ? Math.round(booking.distanceKm * booking.truck.ratePerKm)
      : booking?.price || 0;
  const serviceFee = 0; // No service fee as requested
  const totalAmount = baseFare + serviceFee;

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axiosInstance.get(`/bookings/${bookingId}`);
        const bookingData = response.data.data;
        setBooking(bookingData);

        // Fetch full truck details if truck ID exists
        if (bookingData.truck?._id) {
          try {
            const truckResponse = await axiosInstance.get(
              `/trucks/${bookingData.truck._id}`,
            );
            setTruckDetails(truckResponse.data.data);
          } catch (truckError) {
            console.log("Could not fetch truck details:", truckError);
          }
        }
      } catch (error) {
        showToast("Failed to load booking details", "error");
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, showToast]);

  const handlePayment = async () => {
    if (!paymentMethod) {
      if (typeof showToast === 'function') {
        showToast("Please select a payment method", "error");
      }
      return;
    }

    setProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call the payment endpoint to process the payment
      const response = await axiosInstance.post(`/payments/${bookingId}`);
      
      // Update local state with the response data
      if (response.data.success && response.data.booking) {
        setBooking(response.data.booking);
        
        // Show success message
        if (typeof showToast === 'function') {
          showToast("Payment successful! Your booking is now confirmed.", "success");
        }
        
        // Redirect to booking details after a short delay
        setTimeout(() => {
          navigate(`/bookings/${bookingId}`, { 
            state: { 
              showToast: true,
              toastMessage: "Payment successful! Your booking is confirmed.",
              toastType: "success"
            } 
          });
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Payment processing failed');
      }
      
      // Redirect to booking details after a short delay
      setTimeout(() => {
        navigate(`/bookings/${bookingId}`, { 
          state: { 
            showToast: true,
            toastMessage: "Payment successful! Your booking is confirmed.",
            toastType: "success"
          } 
        });
      }, 1500);
      
    } catch (error) {
      console.error("Payment error:", error);
      showToast(
        error.response?.data?.message || 
        "Payment processing failed. Please try again.", 
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!booking?._id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 text-center">
          {/* Illustration/Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
            Booking Not Found
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 px-4">
            We couldn't locate the booking you're looking for. It may have been
            expired, cancelled, or moved to a different account.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-black text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-gray-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Try Refreshing
            </button>
          </div>

          {/* Support Note */}
          <div className="mt-8 pt-6 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Need help?{" "}
              <span className="text-black font-bold cursor-pointer hover:underline">
                Contact Support
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>

        <div className="text-left mb-6 sm:mb-8 sm:text-center">
          <div className="flex items-center gap-3 sm:justify-center">
            <div className="bg-gray-100 p-2 rounded-lg sm:hidden">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                Complete Payment
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Booking ID: {booking.bookingId || booking._id}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl shadow-gray-100 overflow-hidden sm:rounded-2xl mb-6 border border-gray-100">
          {/* Header Section */}
          <div className="px-5 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
              Booking Summary
            </h3>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${booking.status === "accepted" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800"}`}
              >
                {booking.status === "accepted"
                  ? "Confirmed"
                  : booking.status || "Pending"}
              </span>
              {booking.paymentStatus === "paid" && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-900 text-white uppercase tracking-tighter">
                  PAID
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Route Timeline Section */}
            <div className="relative mb-8 px-2">
              {/* The Connecting Line */}
              <div className="absolute left-[21px] top-8 bottom-8 w-0.5 border-l-2 border-dashed border-gray-200"></div>

              {/* Pickup */}
              <div className="relative flex gap-4 mb-8">
                <div className="z-10 w-10 h-10 rounded-full bg-gray-50 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0 text-gray-800">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
                    Pickup Point
                  </p>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">
                    {booking.pickup?.address || "N/A"}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {format(new Date(booking.startTime), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>

              {/* Drop-off */}
              <div className="relative flex gap-4">
                <div className="z-10 w-10 h-10 rounded-full bg-gray-50 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0 text-gray-800">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
                    Destination
                  </p>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">
                    {booking.dropoff?.address || "N/A"}
                  </h4>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 font-medium">
                      {format(new Date(booking.endTime), "MMM d, h:mm a")}
                    </p>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold italic">
                      ~{booking.estimatedDuration || "4"} hrs journey
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Truck Details Section (Compact Version) */}
            <div className="pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Selected Vehicle
                </h4>
                <span className="text-[10px] font-bold text-gray-400">
                  ID: {booking._id?.slice(-6)?.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <div className="w-16 h-16 rounded-lg bg-white p-1 shadow-sm flex-shrink-0">
                  <img
                    src={
                      truckDetails?.imageUrl ||
                      booking.truck?.imageUrl ||
                      "/fallback-truck.png"
                    }
                    className="w-full h-full object-cover rounded-md"
                    alt="Truck"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h5 className="text-sm font-bold text-gray-900 truncate">
                      {truckDetails?.title ||
                        booking.truck?.title ||
                        "Heavy Duty Truck"}
                    </h5>
                    <span className="text-xs font-bold text-gray-900">
                      NPR {truckDetails?.ratePerKm}/km
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 uppercase font-bold">
                        Capacity
                      </span>
                      <span className="text-[11px] font-bold text-gray-700">
                        {truckDetails?.capacityTons || "8"}T
                      </span>
                    </div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 uppercase font-bold">
                        Distance
                      </span>
                      <span className="text-[11px] font-bold text-gray-700">
                        {booking.distanceKm?.toFixed(1)}km
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl shadow-gray-100 rounded-2xl mb-8 border border-gray-100 overflow-hidden">
          {/* Header with Icon */}
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-black rounded-lg">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Fare Details
              </h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
              TAX INVOICE
            </span>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-4">
              {/* Base Fare Row */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Base Transportation
                  </span>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {booking.distanceKm?.toFixed(2) || "0"} km × NPR{" "}
                    {booking.truck?.ratePerKm ||
                      (booking.price / booking.distanceKm).toFixed(0) ||
                      "0"}
                    /km
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  NPR {baseFare.toLocaleString()}
                </span>
              </div>

              {/* Conditional Fees */}
              {booking.truck?.tollFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Toll & Road Charges
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    NPR {booking.truck.tollFee.toLocaleString()}
                  </span>
                </div>
              )}

              {booking.truck?.driverAllowance > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Driver Allowance
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    NPR {booking.truck.driverAllowance.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Additional Charges / Notes */}
              {booking.notes && (
                <div className="flex justify-between items-center p-2 bg-blue-50/50 rounded-lg border border-dashed border-blue-200">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM5.884 6.68a1 1 0 10-1.404-1.427l-.707.69a1 1 0 101.404 1.427l.707-.69zM15.816 5.253a1 1 0 00-1.404 1.427l.707.69a1 1 0 101.404-1.427l-.707-.69zM5 13a1 1 0 011-1h2a1 1 0 110 2H6a1 1 0 01-1-1zM11 13a1 1 0 110-2h2a1 1 0 110 2h-2z" />
                    </svg>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-tighter">
                      Additional Surcharge
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-700">
                    Included
                  </span>
                </div>
              )}

              {/* Total Section */}
              <div className="pt-5 mt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                      Grand Total
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs font-bold text-gray-900">
                        NPR
                      </span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">
                        {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center px-2 py-1 bg-green-50 rounded text-[10px] font-bold text-green-600 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                      PAYABLE NOW
                    </div>
                    <p className="text-[10px] text-gray-400 italic">
                      VAT inclusive (13%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl shadow-gray-100 rounded-2xl mb-8 border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-black rounded-lg">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Select Payment Method
            </h3>
          </div>

          <div className="p-6">
            <div className="grid gap-4">
              {/* eSewa Option */}
              <div
                className={`group relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "esewa"
                    ? "border-green-500 bg-green-50/30"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setPaymentMethod("esewa")}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${paymentMethod === "esewa" ? "bg-[#60bb46]" : "bg-gray-100"}`}
                  >
                    <span className="text-white font-serif italic text-3xl font-bold leading-none -mt-1">
                      e
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-bold ${paymentMethod === "esewa" ? "text-green-700" : "text-gray-900"}`}
                      >
                        eSewa Wallet
                      </span>
                      {paymentMethod === "esewa" && (
                        <div className="bg-green-500 rounded-full p-1">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Instant payment via eSewa secure gateway
                    </p>
                  </div>
                </div>
              </div>

              {/* Khalti Option */}
              <div
                className={`group relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "khalti"
                    ? "border-purple-600 bg-purple-50/30"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setPaymentMethod("khalti")}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${paymentMethod === "khalti" ? "bg-[#5c2d91]" : "bg-gray-100"}`}
                  >
                    <span className="text-white font-bold text-xl">K</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-bold ${paymentMethod === "khalti" ? "text-purple-700" : "text-gray-900"}`}
                      >
                        Khalti Wallet
                      </span>
                      {paymentMethod === "khalti" && (
                        <div className="bg-purple-600 rounded-full p-1">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Wallet, Banking, or ConnectIPS
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Transfer Option */}
              <div
                className={`group relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "bank"
                    ? "border-blue-600 bg-blue-50/30"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setPaymentMethod("bank")}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${paymentMethod === "bank" ? "bg-blue-600" : "bg-gray-100"}`}
                  >
                    <svg
                      className={`w-6 h-6 ${paymentMethod === "bank" ? "text-white" : "text-gray-400"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-bold ${paymentMethod === "bank" ? "text-blue-700" : "text-gray-900"}`}
                      >
                        Direct Bank Transfer
                      </span>
                      {paymentMethod === "bank" && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Manual verification (Contact Support)
                    </p>
                  </div>
                </div>

                {paymentMethod === "bank" && (
                  <div className="mt-4 ml-16 p-3 bg-white/60 rounded-lg border border-blue-100">
                    <p className="text-[11px] leading-relaxed text-blue-800">
                      <span className="font-bold block mb-1">
                        How it works:
                      </span>
                      1. Transfer the amount. <br />
                      2. Mention Booking ID as reference. <br />
                      3. Send screenshot to our WhatsApp.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl shadow-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Payment Summary
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Amount Display */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    Total Payable
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Final amount including VAT
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900 tracking-tighter">
                    NPR {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Section */}
              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={processing || booking.paymentStatus === 'paid'}
                  className={`relative w-full py-4 px-6 rounded-xl shadow-lg text-base font-bold text-white transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                    booking.paymentStatus === 'paid'
                      ? 'bg-green-600 cursor-default shadow-none'
                      : processing
                      ? 'bg-gray-400 cursor-not-allowed shadow-none'
                      : paymentMethod === 'esewa'
                      ? 'bg-[#60bb46] hover:bg-[#52a13b] shadow-gray-200'
                      : paymentMethod === 'khalti'
                      ? 'bg-[#5c2d91] hover:bg-[#4a2475] shadow-gray-200'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-gray-200'
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : booking.paymentStatus === 'paid' ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Payment Completed
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span>Confirm & Pay</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-4 py-2 opacity-60">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.597 9.29-6.518 11.771a1.259 1.259 0 01-1.482 0C6.097 16.29 3.5 11.947 3.5 7c0-.68.056-1.35.166-2.001zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      SSL Secured
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Verified Merchant
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 text-center px-4 leading-relaxed">
                  By clicking pay, you agree to our{" "}
                  <strong>Terms of Service</strong>. Your data is encrypted and
                  processed via secure gateways.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
