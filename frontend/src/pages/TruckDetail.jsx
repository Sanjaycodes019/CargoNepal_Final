import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, Truck, MapPin, Star, Route, Filter, Search, X, ChevronDown, Loader2, Phone, Mail, Activity } from "lucide-react";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../context/AuthContext";
import BookingMap from "../components/BookingMap";
import LocationSuggestions from "../components/LocationSuggestions";
import { useUiFeedback } from "../context/UiFeedbackContext";
import VerifiedBadge from "../components/shared/VerifiedBadge";
import logger from "../utils/logger.js";

// DetailField component for displaying label-value pairs - matching AdminVerification.jsx
const DetailField = ({ label, value }) => (
  <div className="relative group">
    {/* Main content container - more compact */}
    <div className="relative bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-200">
      {/* Label with reduced spacing and contrast */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-0.5 h-3 bg-gray-500 rounded-full"></div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
          {label}
        </p>
      </div>

      {/* Value with more compact typography */}
      <p className="text-xs font-bold text-gray-900 leading-tight break-words">
        {value}
      </p>
    </div>
  </div>
);

// CheckCircle SVG component for verified badges
const CheckCircle = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const TruckReviews = ({ truckId, onReviewAdded }) => {
  const { isOwner } = useContext(AuthContext);
  const { toast, confirm } = useUiFeedback();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/reviews/truck/${truckId}`);
      setReviews(response.data.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [truckId]);

  useEffect(() => {
    if (onReviewAdded) {
      fetchReviews();
    }
  }, [onReviewAdded]);

  const handleDeleteReview = async (reviewId) => {
    const ok = await confirm({
      title: "Delete review",
      message: "Are you sure you want to delete this review?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;

    try {
      await axiosInstance.delete(`/reviews/${reviewId}`);
      fetchReviews();
      if (onReviewAdded) onReviewAdded();
      toast({ type: "success", message: "Review deleted" });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to delete review",
      });
    }
  };

  if (loading) return null;

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const hasMore = currentPage < totalPages;

  const handleSeeMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        Customer Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h3>
      {reviews.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-100">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-gray-600">
            No reviews yet. Be the first to review this truck!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {currentReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-lg shadow-md p-3 border border-gray-100 hover:shadow-lg transition-shadow relative"
              >
                {isOwner && (
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600 transition-colors p-1"
                    title="Delete review"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="relative w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-300">
                        {review.customer?.profileImageUrl ? (
                          <img
                            src={review.customer.profileImageUrl}
                            alt={review.customer?.name || "Customer"}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {(review.customer?.name || "A")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Verified Badge for Customer */}
                        {review.customer?.verificationBadge && (
                          <div className="absolute -bottom-1 -right-1 z-10">
                            <VerifiedBadge size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="font-semibold text-slate-900 text-sm">
                        {review.customer?.name || "Anonymous"}
                      </p>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? "text-black" : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-sm font-medium text-slate-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-slate-700 mt-2 leading-relaxed text-xs">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              {/* See More Button */}
              {hasMore && (
                <button
                  onClick={handleSeeMore}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
                >
                  See More ({reviews.length - indexOfLastReview} more)
                </button>
              )}

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                      currentPage === index + 1
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>

              {/* Review Count Info */}
              <p className="text-xs text-slate-500">
                Showing {indexOfFirstReview + 1}-
                {Math.min(indexOfLastReview, reviews.length)} of{" "}
                {reviews.length} reviews
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// TruckRatingSummary component for displaying rating summary
const TruckRatingSummary = ({ truckId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/reviews/truck/${truckId}`);
      setReviews(response.data.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (truckId) {
      fetchReviews();
    }
  }, [truckId]);

  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const averageRating = calculateAverageRating(reviews);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  if (!averageRating) {
    return (
      <div className="text-center py-4">
        <div className="flex items-center justify-center mb-2">
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No ratings yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Be the first to rate this truck!
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-6 h-6 ${
                i < Math.floor(averageRating)
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {averageRating}
          </div>
          <div className="text-sm text-gray-500">
            {reviews.length} {reviews.length === 1 ? "rating" : "ratings"}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm text-gray-600">Average Rating</div>
        <div className="text-xs text-gray-500 mt-1">
          Based on customer reviews
        </div>
      </div>
    </div>
  );
};

// TruckRatingSmall component for displaying small black star rating
const TruckRatingSmall = ({ truckId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/reviews/truck/${truckId}`);
      setReviews(response.data.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (truckId) {
      fetchReviews();
    }
  }, [truckId]);

  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const averageRating = calculateAverageRating(reviews);

  if (loading || !averageRating) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${
              i < Math.floor(averageRating)
                ? "text-black fill-current"
                : "text-gray-300"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-medium text-gray-700">{averageRating}</span>
      <span className="text-xs text-gray-500">({reviews.length})</span>
    </div>
  );
};

const TruckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCustomer, isOwner } = useContext(AuthContext);
  const { toast } = useUiFeedback();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    pickup: { address: "" },
    dropoff: { address: "" },
    capacityTons: "",
    notes: "",
    startTime: "",
    endTime: "",
  });
  const [route, setRoute] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const routeCalculationTimeout = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [reviewAdded, setReviewAdded] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictCheck, setConflictCheck] = useState(null);

  useEffect(() => {
    fetchTruck();
    if (isCustomer) {
      fetchCustomerBookings();
    }
  }, [id, isCustomer]);

  const fetchCustomerBookings = async () => {
    try {
      const response = await axiosInstance.get("/customer/bookings");
      console.log('Fetched customer bookings:', response.data.data);
      
      // Filter bookings for this truck that are completed
      const truckBookings = response.data.data.filter(booking => {
        const isThisTruck = booking.truck?._id === id || booking.truck?._id?._id === id;
        const isCompleted = booking.status === 'completed';
        console.log('Booking check:', { 
          bookingId: booking._id, 
          truckId: booking.truck?._id, 
          currentTruckId: id, 
          isThisTruck, 
          isCompleted 
        });
        return isThisTruck && isCompleted;
      });
      
      console.log('Filtered completed bookings for this truck:', truckBookings);
      setCustomerBookings(truckBookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      toast({
        type: "error",
        message: "Failed to load your booking history. Please refresh the page to try again.",
      });
    }
  };

  const fetchTruck = async () => {
    try {
      const response = await axiosInstance.get(`/trucks/${id}`);
      setTruck(response.data.data);
    } catch (error) {
      console.error("Error fetching truck:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate route for booking using OSRM directly
  const calculateRoute = async (pickup, dropoff) => {
    if (!pickup || !dropoff) return;
    
    try {
      // Get coordinates for both locations using backend geocoding
      const pickupResponse = await axiosInstance.get(`/utils/geocode?location=${encodeURIComponent(pickup)}`);
      const dropoffResponse = await axiosInstance.get(`/utils/geocode?location=${encodeURIComponent(dropoff)}`);
      
      if (!pickupResponse.data.success || !dropoffResponse.data.success) {
        console.log('Could not get coordinates for route calculation');
        return;
      }
      
      const pickupCoords = {
        lat: pickupResponse.data.data.lat,
        lng: pickupResponse.data.data.lng
      };
      const dropoffCoords = {
        lat: dropoffResponse.data.data.lat,
        lng: dropoffResponse.data.data.lng
      };
      
      // Call OSRM directly
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropoffCoords.lng},${dropoffCoords.lat}?overview=full&geometries=geojson&steps=true`,
        {
          headers: {
            'User-Agent': 'CargoNepal/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];
          setRoute({
            pickup: pickupCoords,
            dropoff: dropoffCoords,
            distance: routeData.distance / 1000, // Convert meters to km
            duration: routeData.duration / 60, // Convert seconds to minutes
            geometry: routeData.geometry
          });
          console.log('Route calculated successfully:', {
            distance: routeData.distance / 1000,
            duration: routeData.duration / 60
          });
        }
      }
    } catch (error) {
      console.log('Route calculation failed:', error);
    }
  };

  const handleBookingDataChange = (e) => {
    const { name, value } = e.target;
    if (name === "pickup.address") {
      setBookingData({ ...bookingData, pickup: { address: value } });
      // Debounced route calculation when both pickup and dropoff are available
      if (bookingData.dropoff.address && value.length >= 3 && bookingData.dropoff.address.length >= 3) {
        // Clear existing timeout
        if (routeCalculationTimeout.current) {
          clearTimeout(routeCalculationTimeout.current);
        }
        // Set new timeout for route calculation
        routeCalculationTimeout.current = setTimeout(() => {
          calculateRoute(value, bookingData.dropoff.address);
        }, 1000); // 1 second debounce
      }
    } else if (name === "dropoff.address") {
      setBookingData({ ...bookingData, dropoff: { address: value } });
      // Debounced route calculation when both pickup and dropoff are available
      if (bookingData.pickup.address && bookingData.pickup.address.length >= 3 && value.length >= 3) {
        // Clear existing timeout
        if (routeCalculationTimeout.current) {
          clearTimeout(routeCalculationTimeout.current);
        }
        // Set new timeout for route calculation
        routeCalculationTimeout.current = setTimeout(() => {
          calculateRoute(bookingData.pickup.address, value);
        }, 1000); // 1 second debounce
      }
    } else {
      setBookingData({ ...bookingData, [name]: value });
    }
  };

  // Validate Nepal location - more flexible validation
  const validateNepalLocation = (location) => {
    if (!location || typeof location !== 'string') return false;
    
    // Since we're using Nominatim API with countrycodes=NP, 
    // we'll do a basic check for common Nepal indicators
    const locationLower = location.toLowerCase();
    
    // Check for any Nepal-specific indicators
    const nepalIndicators = [
      'nepal', 'kathmandu', 'pokhara', 'lalitpur', 'bhaktapur', 'biratnagar', 'birgunj',
      'dharan', 'butwal', 'nepalgunj', 'hetauda', 'janakpur', 'dhangadhi',
      'itahari', 'triyuga', 'chitwan', 'bharatpur', 'lumbini', 'patan',
      'bagmati', 'province', 'district', 'marg', 'bazar', 'chowk', 'tol'
    ];
    
    // Also accept if it's a general location that could be in Nepal
    const generalIndicators = [
      'road', 'street', 'area', 'market', 'gate', 'chowk', 'bazar', 'marg'
    ];
    
    return nepalIndicators.some(keyword => locationLower.includes(keyword)) ||
           generalIndicators.some(keyword => locationLower.includes(keyword)) ||
           locationLower.length > 2; // Accept any text longer than 2 chars as fallback
  };

  const calculateDistance = async () => {
    if (!bookingData.pickup.address || !bookingData.dropoff.address) {
      toast({
        type: "error",
        message: "Please provide both pickup and dropoff locations",
      });
      return;
    }

    // Validate Nepal locations
    if (!validateNepalLocation(bookingData.pickup.address)) {
      toast({
        type: "error",
        message: "Pickup location must be in Nepal",
      });
      return;
    }
    
    if (!validateNepalLocation(bookingData.dropoff.address)) {
      toast({
        type: "error",
        message: "Dropoff location must be in Nepal",
      });
      return;
    }
    setCalculating(true);
    try {
      const response = await axiosInstance.post("/utils/bookings/calculate", {
        pickup: { address: bookingData.pickup.address },
        dropoff: { address: bookingData.dropoff.address },
        ratePerKm: truck.ratePerKm,
      });
      setEstimatedPrice(response.data.data);
      setPickupCoords(response.data.data.pickupCoords);
      setDropoffCoords(response.data.data.dropoffCoords);
    } catch (error) {
      toast({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to calculate distance. Please check location names.",
      });
    } finally {
      setCalculating(false);
    }
  };

  // Check for booking conflicts
  const checkConflicts = async (startTime, endTime) => {
    if (!truck?._id || !startTime || !endTime) return;

    setCheckingConflicts(true);
    setConflictCheck(null);

    try {
      // Convert to ISO strings for API
      const startISO = new Date(startTime).toISOString();
      const endISO = new Date(endTime).toISOString();

      const response = await axiosInstance.get(
        "/bookings/check-conflicts",
        {
          params: {
            truckId: truck._id,
            startTime: startISO,
            endTime: endISO,
          },
        },
      );

      if (response.data.success) {
        setConflictCheck(response.data.data);
        logger.component("TruckDetail", "info", "Conflict check completed", {
          hasConflict: response.data.data.hasConflict,
          truckId: truck._id,
          startTime: startISO,
          endTime: endISO,
        });
      }
    } catch (error) {
      logger.error("Conflict check failed", {
        error,
        truckId: truck._id,
        startTime,
        endTime,
      });
      toast({ type: "error", message: "Failed to check availability" });
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Auto-check conflicts when time changes
  useEffect(() => {
    if (bookingData.startTime && bookingData.endTime) {
      const timeoutId = setTimeout(() => {
        checkConflicts(bookingData.startTime, bookingData.endTime);
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [bookingData.startTime, bookingData.endTime, truck?._id]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!isCustomer) {
      toast({ type: "error", message: "Please login as a customer to book" });
      navigate("/login");
      return;
    }
    if (!bookingData.capacityTons || Number(bookingData.capacityTons) <= 0) {
      toast({
        type: "error",
        message: "Please provide a valid required capacity in tons.",
      });
      return;
    }

    // Check if required capacity exceeds truck capacity
    if (truck.capacityTons && Number(bookingData.capacityTons) > Number(truck.capacityTons)) {
      toast({
        type: "error",
        message: `Required capacity (${bookingData.capacityTons} tons) exceeds truck capacity (${truck.capacityTons} tons). Please reduce the required capacity.`,
      });
      return;
    }

    // Check if there are conflicts before booking
    if (conflictCheck && conflictCheck.hasConflict) {
      toast({
        type: "error",
        message:
          "Cannot book truck due to scheduling conflicts. Please choose a different time slot.",
      });
      return;
    }

    // Validate time fields
    if (!bookingData.startTime || !bookingData.endTime) {
      toast({
        type: "error",
        message: "Please select start and end times for your booking.",
      });
      return;
    }

    // Validate time logic
    const startDate = new Date(bookingData.startTime);
    const endDate = new Date(bookingData.endTime);
    const now = new Date();

    if (startDate <= now) {
      toast({ type: "error", message: "Start time must be in the future." });
      return;
    }

    if (endDate <= startDate) {
      toast({ type: "error", message: "End time must be after start time." });
      return;
    }

    setSubmitting(true);
    try {
      // Get coordinates for pickup and dropoff if not available
      let finalPickupCoords = pickupCoords;
      let finalDropoffCoords = dropoffCoords;
      
      // If coordinates are not available, geocode the addresses
      if (!finalPickupCoords || !finalPickupCoords.lat || !finalPickupCoords.lng) {
        try {
          // Use backend geocoding endpoint
          const geocodeResponse = await axiosInstance.get(`/utils/geocode?location=${encodeURIComponent(bookingData.pickup.address)}`);
          if (geocodeResponse.data.success && geocodeResponse.data.data) {
            finalPickupCoords = {
              lat: geocodeResponse.data.data.lat,
              lng: geocodeResponse.data.data.lng
            };
          }
        } catch (error) {
          console.error('Geocoding pickup failed:', error);
          toast({ type: 'error', message: 'Unable to get pickup location coordinates. Please check the pickup address.' });
          setSubmitting(false);
          return;
        }
      }
      
      if (!finalDropoffCoords || !finalDropoffCoords.lat || !finalDropoffCoords.lng) {
        try {
          // Use backend geocoding endpoint
          const geocodeResponse = await axiosInstance.get(`/utils/geocode?location=${encodeURIComponent(bookingData.dropoff.address)}`);
          if (geocodeResponse.data.success && geocodeResponse.data.data) {
            finalDropoffCoords = {
              lat: geocodeResponse.data.data.lat,
              lng: geocodeResponse.data.data.lng
            };
          }
        } catch (error) {
          console.error('Geocoding dropoff failed:', error);
          toast({ type: 'error', message: 'Unable to get dropoff location coordinates. Please check the dropoff address.' });
          setSubmitting(false);
          return;
        }
      }
      
      // Validate that we have coordinates
      if (!finalPickupCoords || !finalPickupCoords.lat || !finalPickupCoords.lng) {
        toast({ type: 'error', message: 'Unable to get pickup location coordinates. Please check the pickup address.' });
        setSubmitting(false);
        return;
      }
      
      if (!finalDropoffCoords || !finalDropoffCoords.lat || !finalDropoffCoords.lng) {
        toast({ type: 'error', message: 'Unable to get dropoff location coordinates. Please check the dropoff address.' });
        setSubmitting(false);
        return;
      }

      const response = await axiosInstance.post("/bookings", {
        truckId: id,
        pickup: { 
          address: bookingData.pickup.address,
          lat: finalPickupCoords.lat,
          lng: finalPickupCoords.lng
        },
        dropoff: { 
          address: bookingData.dropoff.address,
          lat: finalDropoffCoords.lat,
          lng: finalDropoffCoords.lng
        },
        capacityTons: Number(bookingData.capacityTons),
        notes: bookingData.notes,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });
      toast({
        type: "success",
        message: "Booking request created successfully!",
      });
      setShowBookingModal(false);
      navigate("/customer/dashboard");
    } catch (error) {
      console.error('Booking submission error:', {
        error: error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.message || 
                          'Failed to create booking';
      
      toast({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-slate-900"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading truck details...
          </p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-sm sm:max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Truck Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The truck you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/trucks"
            className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
          >
            Browse All Trucks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/trucks"
          className="inline-flex items-center text-slate-900 hover:text-slate-700 font-medium mb-6 transition-colors text-sm"
        >
          <svg
            className="w-4 h-4 mr-2"
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
          Back to Trucks
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
            Truck Details
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            View complete information and book this vehicle
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Profile Header - Compact */}
          <div className="relative bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Truck Image - Compact */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-4 border-white shadow-lg ring-2 ring-slate-100 overflow-hidden">
                  {truck.imageUrl ? (
                    <img
                      src={truck.imageUrl}
                      alt={truck.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  {/* Fallback Icon */}
                  <div
                    className="w-full h-full flex items-center justify-center bg-slate-200"
                    style={{ display: truck.imageUrl ? "none" : "flex" }}
                  >
                    <svg
                      className="w-8 h-8 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                </div>
                {/* Verified Badge - Black star for Truck - Show only if truck has verification badge */}
                {truck.isVerified && (
                  <div className="absolute -bottom-1 -right-1">
                    <VerifiedBadge size={24} color="#000000" />
                  </div>
                )}
              </div>

              {/* Name and Info - Compact */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {truck.title || "Truck"}
                  </h2>
                </div>
                {/* Rating Display - Small Black Stars */}
                <div className="flex items-center justify-center sm:justify-start mt-3">
                  <TruckRatingSmall truckId={truck._id} />
                </div>
              </div>
            </div>
          </div>

          {/* Content - Compact */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Truck Details Section */}
            <div className="bg-slate-50/30 rounded-xl p-4 sm:p-5 border border-slate-200/40 shadow-sm mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <DetailField
                  label="TYPE"
                  value={truck.type?.toUpperCase() || "N/A"}
                />
                <DetailField
                  label="STATUS"
                  value={
                    truck.enhancedStatus?.status ||
                    (truck.available ? "AVAILABLE" : "BUSY")
                  }
                />
                <DetailField
                  label="CAPACITY"
                  value={truck.capacityTons ? `${truck.capacityTons}T` : "N/A"}
                />
                <DetailField
                  label="LOCATION"
                  value={truck.location?.address?.toUpperCase() || "N/A"}
                />
              </div>
              {truck.description && (
                <div className="mt-4">
                  <DetailField label="DESCRIPTION" value={truck.description} />
                </div>
              )}
            </div>

            {/* Owner Information Section - Compact */}
            {truck.owner && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                  {/* Owner Photo */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-200 border border-gray-300 shadow-md overflow-hidden">
                      {truck.owner.profileImageUrl ? (
                        <img
                          src={truck.owner.profileImageUrl}
                          alt={truck.owner.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center rounded-full text-gray-900 text-sm font-bold"
                        style={{
                          display: truck.owner.profileImageUrl
                            ? "none"
                            : "flex",
                        }}
                      >
                        {truck.owner.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    {/* Verified Badge */}
                    {truck.owner.verificationBadge && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerifiedBadge size={16} />
                      </div>
                    )}
                  </div>

                  {/* Owner Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {truck.owner.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-700">
                      {/* Column 1: Email */}
                      <div className="space-y-1">
                        {truck.owner.email && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="truncate">
                              {truck.owner.email}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Phone */}
                      <div className="space-y-1">
                        {truck.owner.phone && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493 1.498a1 1 0 00.684-.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"
                              />
                            </svg>
                            <span>{truck.owner.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isCustomer && truck.available && (
                <button
                  onClick={() => {
                  console.log('Opening booking modal');
                  setShowBookingModal(true);
                }}
                  className="flex-1 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
                >
                  Request Booking
                </button>
              )}
              {isCustomer && (
                <button
                  onClick={() => {
                    if (customerBookings.length > 0) {
                      setShowReviewModal(true);
                    } else {
                      toast({
                        type: "error",
                        message:
                          "You need to complete a booking first to write a review.",
                      });
                    }
                  }}
                  className={`px-5 py-2.5 border-2 ${
                    customerBookings.length > 0
                      ? "border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                      : "border-slate-300 text-slate-400 cursor-not-allowed"
                  } rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95`}
                  disabled={customerBookings.length === 0}
                >
                  Write a Review
                </button>
              )}
            </div>
            {isCustomer && customerBookings.length === 0 && (
              <p className="mt-2 text-xs text-slate-500 text-center sm:text-left">
                Complete a booking to review this truck
              </p>
            )}

            {/* Reviews Section */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <TruckReviews truckId={truck._id} onReviewAdded={reviewAdded} />
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <>
            {console.log('Rendering booking modal, showBookingModal:', showBookingModal)}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl max-w-xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Request Booking
                </h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleSubmitBooking}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Pickup Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Pickup Location <span className="text-red-600">*</span>
                  </label>
                  <LocationSuggestions
                    value={bookingData.pickup.address}
                    onChange={handleBookingDataChange}
                    placeholder="e.g., Kathmandu, Pokhara, Lalitpur"
                    name="pickup.address"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter any location in Nepal
                  </p>
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Dropoff Location <span className="text-red-600">*</span>
                  </label>
                  <LocationSuggestions
                    value={bookingData.dropoff.address}
                    onChange={handleBookingDataChange}
                    placeholder="e.g., Pokhara, Biratnagar, Birgunj"
                    name="dropoff.address"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter any location in Nepal
                  </p>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Required Capacity (in tons){" "}
                    <span className="text-red-600">*</span>
                    <span className="text-xs text-slate-500 ml-2">
                      (Max: {truck.capacityTons} tons)
                    </span>
                  </label>
                  <input
                    type="number"
                    name="capacityTons"
                    placeholder={`e.g., ${Math.min(1, truck.capacityTons || 1)}`}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={bookingData.capacityTons}
                    onChange={handleBookingDataChange}
                    required
                    min="0.1"
                    step="0.1"
                    max={truck.capacityTons || 999}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the weight you want to transport (cannot exceed truck capacity)
                  </p>
                </div>

                {/* Time-based booking fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Time <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      value={bookingData.startTime}
                      onChange={handleBookingDataChange}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      When you need the truck (supports multi-day trips)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      End Time <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      value={bookingData.endTime}
                      onChange={handleBookingDataChange}
                      min={
                        bookingData.startTime ||
                        new Date().toISOString().slice(0, 16)
                      }
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Estimated completion time (supports multi-day trips up to
                      7 days)
                    </p>
                  </div>
                </div>

                {/* Conflict Check Display */}
                {checkingConflicts && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-blue-700">
                        Checking availability...
                      </span>
                    </div>
                  </div>
                )}

                {conflictCheck && (
                  <div className={`rounded-lg p-4 ${
                    !truck ? 'bg-blue-50 border border-blue-200' : 
                    conflictCheck.hasConflict ? 'bg-red-50 border border-red-200' : 
                    'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {!truck ? (
                        <>
                          <div className="w-5 h-5 text-blue-600 mt-0.5">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-800">Time Slot Selected</h4>
                            <p className="text-sm text-blue-700 mt-1">{conflictCheck.message}</p>
                          </div>
                        </>
                      ) : conflictCheck.hasConflict ? (
                        <>
                          <div className="w-5 h-5 text-red-600 mt-0.5">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-800">Booking Conflict Detected</h4>
                            <p className="text-sm text-red-700 mt-1">{conflictCheck.message}</p>
                            {conflictCheck.conflicts.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-red-600 font-medium">
                                  Conflicting bookings:
                                </p>
                                {conflictCheck.conflicts.map(
                                  (conflict, index) => (
                                    <div
                                      key={index}
                                      className="text-xs text-red-600 mt-1"
                                    >
                                      •{" "}
                                      {new Date(
                                        conflict.startTime,
                                      ).toLocaleString()}{" "}
                                      -{" "}
                                      {new Date(
                                        conflict.endTime,
                                      ).toLocaleString()}{" "}
                                      ({conflict.status})
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 text-green-600 mt-0.5">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-green-800">
                              Time Slot Available
                            </h4>
                            <p className="text-sm text-green-700 mt-1">
                              {conflictCheck.message}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Calculate Button */}
                <button
                  type="button"
                  onClick={calculateDistance}
                  disabled={calculating}
                  className="w-full px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {calculating ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Calculating...
                    </span>
                  ) : (
                    "Calculate Distance & Price"
                  )}
                </button>

                {/* Route Summary */}
                {route && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-800">Route Distance</p>
                      <p className="font-bold text-gray-700">
                        {route.distance.toFixed(1)} km
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <p className="font-semibold text-gray-800">Estimated Duration</p>
                      <p className="font-bold text-gray-700">
                        {Math.round(route.duration)} minutes
                      </p>
                    </div>
                  </div>
                )}

                {/* Estimated Price */}
                {estimatedPrice && (
                  <div className="bg-green-50 border border-green-200 p-3 sm:p-5 rounded-lg text-xs sm:text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-green-800">Distance</p>
                      <p className="font-bold text-green-700">
                        {estimatedPrice.distanceKm} km
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <p className="font-semibold text-green-800">
                        Estimated Price
                      </p>
                      <p className="font-bold text-green-700">
                        Rs. {estimatedPrice.estimatedPrice}
                      </p>
                    </div>
                  </div>
                )}

                {/* Map */}
                {pickupCoords && dropoffCoords && (
                  <div className="mt-3">
                    <BookingMap
                      pickup={pickupCoords}
                      dropoff={dropoffCoords}
                      distance={estimatedPrice?.distanceKm}
                      onRouteCalculated={(routeData) => {
                        console.log('Route calculated:', routeData);
                        // Update the estimated price with route-based distance if available
                        if (routeData.isRouteDistance && estimatedPrice) {
                          setEstimatedPrice(prev => ({
                            ...prev,
                            distanceKm: routeData.distance,
                            isRouteDistance: routeData.isRouteDistance,
                            durationMinutes: routeData.durationMinutes
                          }));
                        }
                      }}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Notes{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 resize-none"
                    value={bookingData.notes}
                    onChange={handleBookingDataChange}
                    placeholder="Any special instructions or requirements..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !estimatedPrice}
                    className="flex-1 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Submit Booking"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          </>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <ReviewModal
            truckId={truck._id}
            bookings={customerBookings}
            onClose={() => setShowReviewModal(false)}
            onReviewAdded={() => {
              setReviewAdded((prev) => prev + 1);
              setShowReviewModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

const ReviewModal = ({ truckId, bookings, onClose, onReviewAdded }) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchReviews();
  }, [truckId]);

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/reviews/truck/${truckId}`);
      setReviews(response.data.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking || rating === 0) {
      setMessage({
        type: "error",
        text: "Please select a booking and provide a rating",
      });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await axiosInstance.post("/reviews", {
        bookingId: selectedBooking,
        truckId: truckId,
        rating: rating,
        comment: comment || undefined,
      });
      setMessage({ type: "success", text: "Review submitted successfully!" });
      setSelectedBooking("");
      setRating(0);
      setComment("");
      fetchReviews();
      setTimeout(() => {
        onReviewAdded();
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to submit review",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Write a Review
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Review Form - Left Side */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-4">
                Your Review
              </h4>
              {message.text && (
                <div
                  className={`mb-4 p-3 rounded-lg border ${
                    message.type === "success"
                      ? "bg-slate-100 text-slate-800 border-slate-300"
                      : "bg-slate-200 text-slate-800 border-slate-400"
                  }`}
                >
                  <p className="font-medium text-sm">{message.text}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Booking <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={selectedBooking}
                    onChange={(e) => setSelectedBooking(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                    required
                  >
                    <option value="">Choose a completed booking...</option>
                    {bookings.map((booking) => (
                      <option key={booking._id} value={booking._id}>
                        {booking.pickup?.address || "N/A"} →{" "}
                        {booking.dropoff?.address || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Rating <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="focus:outline-none"
                      >
                        <svg
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? "text-black"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm font-medium text-slate-600">
                        {rating}/5
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Comment{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white resize-none"
                    placeholder="Share your experience..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || rating === 0 || !selectedBooking}
                  className="w-full px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>

            {/* Previous Reviews - Right Side */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-4">
                Previous Reviews ({reviews.length})
              </h4>
              {loadingReviews ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-900"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200">
                  <p className="text-slate-500 text-sm">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-300">
                            {review.customer?.profileImageUrl ? (
                              <img
                                src={review.customer.profileImageUrl}
                                alt={review.customer?.name || "Customer"}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display =
                                      "flex";
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {(review.customer?.name || "A")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}
                            {/* Verified Badge for Customer */}
                            {review.customer?.verificationBadge && (
                              <div className="absolute -bottom-1 -right-1 z-10">
                                <VerifiedBadge size={12} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {review.customer?.name || "Anonymous"}
                            </p>
                            <div className="flex items-center mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating
                                      ? "text-black"
                                      : "text-gray-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckDetail;
