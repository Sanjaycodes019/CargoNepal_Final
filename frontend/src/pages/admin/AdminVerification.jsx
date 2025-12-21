import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import VerifiedBadge from '../../components/shared/VerifiedBadge';

// DetailField component for displaying label-value pairs - matching TruckDetails.jsx
const DetailField = ({ label, value }) => (
  <div className="relative group">
    {/* Main content container - more compact */}
    <div className="relative bg-white border border-slate-200/40 rounded-lg p-2.5 shadow-xs hover:shadow-sm transition-all duration-200 hover:border-slate-200/60">
      {/* Label with reduced spacing and contrast */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-0.5 h-3 bg-slate-400/60 rounded-full"></div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </p>
      </div>
      
      {/* Value with more compact typography */}
      <p className="text-xs font-medium text-slate-700 leading-tight break-words">
        {value}
      </p>
    </div>
  </div>
);

const AdminVerification = () => {
  const { userType, userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useUiFeedback();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userType, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      let endpoint;
      switch (userType) {
        case 'owner':
          endpoint = `/admin/owners/${userId}`;
          break;
        case 'customer':
          endpoint = `/admin/customers/${userId}`;
          break;
        case 'truck':
          endpoint = `/admin/trucks/${userId}`;
          break;
        default:
          throw new Error('Invalid user type');
      }

      const response = await axiosInstance.get(endpoint);
      setUser(response.data.data);

      // Fetch trucks if it's an owner
      if (userType === 'owner') {
        const trucksResponse = await axiosInstance.get(`/admin/trucks?owner=${userId}`);
        setTrucks(trucksResponse.data.data || []);
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch details';
      
      // Create specific error messages based on user type
      if (userType === 'truck') {
        errorMessage = 'Failed to fetch truck details';
      } else if (userType === 'owner') {
        errorMessage = 'Failed to fetch owner details';
      } else if (userType === 'customer') {
        errorMessage = 'Failed to fetch customer details';
      }
      
      // Add more specific error information if available
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found`;
        } else if (error.response.status === 403) {
          errorMessage = `Access denied to ${userType} details`;
        } else if (error.response.status === 500) {
          errorMessage = `Server error while fetching ${userType} details`;
        }
      } else if (error.request) {
        errorMessage = `Network error - Unable to fetch ${userType} details`;
      }
      
      toast({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async () => {
    try {
      setUpdating(true);
      let newVerificationStatus;
      
      if (userType === 'truck') {
        // For trucks, toggle truck verification
        newVerificationStatus = !user.isVerified;
        await axiosInstance.put(`/admin/verify-truck/${userId}`);
        setUser(prev => ({ ...prev, isVerified: newVerificationStatus }));
      } else {
        // For owners/customers, toggle verification badge
        newVerificationStatus = !user.verificationBadge;
        await axiosInstance.put(`/admin/verification-badge/${userId}`, {
          role: userType,
          verificationBadge: newVerificationStatus
        });
        setUser(prev => ({ ...prev, verificationBadge: newVerificationStatus }));
      }
      
      toast({
        type: 'success',
        message: `Verification ${newVerificationStatus ? 'granted' : 'revoked'} successfully`
      });
    } catch (error) {
      let errorMessage = 'Failed to update verification status';
      
      // Create specific error messages based on user type
      if (userType === 'truck') {
        errorMessage = 'Failed to update truck verification status';
      } else if (userType === 'owner') {
        errorMessage = 'Failed to update owner verification status';
      } else if (userType === 'customer') {
        errorMessage = 'Failed to update customer verification status';
      }
      
      // Add more specific error information if available
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found for verification update`;
        } else if (error.response.status === 403) {
          errorMessage = `Access denied to update ${userType} verification`;
        } else if (error.response.status === 500) {
          errorMessage = `Server error while updating ${userType} verification`;
        }
      } else if (error.request) {
        errorMessage = `Network error - Unable to update ${userType} verification`;
      }
      
      toast({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert to 12-hour format, 0 becomes 12
    
    return `${month}/${day}/${year} ${displayHours}:${minutes}${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-black">
            {userType === 'truck' ? 'Truck not found' : 'User not found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {userType === 'truck' 
              ? 'The truck you\'re looking for doesn\'t exist or has been removed.'
              : 'The user you\'re looking for doesn\'t exist or has been removed.'
            }
          </p>
          <button
            onClick={() => navigate('/admin/notifications')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Notifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/notifications')}
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
          Back to Notifications
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1">
            {userType === 'truck' ? 'Truck Verification' : userType === 'owner' ? 'Owner Verification' : 'Customer Verification'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            {userType === 'truck' ? 'Review truck details and verification status' : userType === 'owner' ? 'Review owner details and verification status' : 'Review customer details and verification status'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900"></div>
              <p className="mt-4 text-lg font-medium text-slate-700">
                Loading {userType === 'truck' ? 'truck' : userType === 'owner' ? 'owner' : 'customer'} details...
              </p>
            </div>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center py-20">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-sm sm:max-w-md">
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
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                {userType === 'truck' ? 'Truck Not Found' : userType === 'owner' ? 'Owner Not Found' : 'Customer Not Found'}
              </h2>
              <p className="text-slate-600 mb-4">
                {userType === 'truck' ? 'The truck you\'re looking for doesn\'t exist or has been removed.' : userType === 'owner' ? 'The owner you\'re looking for doesn\'t exist or has been removed.' : 'The customer you\'re looking for doesn\'t exist or has been removed.'}
              </p>
              <button
                onClick={() => navigate('/admin/notifications')}
                className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
              >
                Browse All {userType === 'truck' ? 'Trucks' : userType === 'owner' ? 'Owners' : 'Customers'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Profile Header - Enhanced */}
              <div className="relative bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-6 sm:px-8 lg:px-10 py-8 sm:py-10 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Profile Image */}
                  <div className="relative">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-4 border-white shadow-xl ring-4 ring-slate-100 overflow-hidden">
                      {userType === 'truck' ? (
                        user.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt={user.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display = "flex";
                            }}
                          />
                        ) : null
                      ) : (
                        user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling.style.display = "flex";
                            }}
                          />
                        ) : null
                      )}
                      <div
                        className="w-full h-full flex items-center justify-center bg-slate-200"
                        style={{ display: (userType === 'truck' ? user.imageUrl : user.profileImageUrl) ? "none" : "flex" }}
                      >
                        {userType === 'truck' ? (
                          <svg
                            className="w-12 h-12 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4m6 0V4m0 0l4 4m-4-4l4 4"
                            />
                          </svg>
                        ) : (
                          <div className="text-2xl font-bold text-slate-500">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Verified Badge */}
                    {(userType === 'truck' ? user.isVerified : user.verificationBadge) && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                        <VerifiedBadge size={24} color={userType === 'truck' ? "#000000" : "#1D9BF0"} />
                      </div>
                    )}
                  </div>

                  {/* Name and Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mb-2">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {userType === 'truck' ? (user.title || "Truck") : user.name || "User"}
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 break-all mb-2">
                      {userType === 'truck' ? (user.location?.address || "Location not specified") : user.email}
                    </p>
                    
                    {/* Address for users (customer/owner) */}
                    {userType !== 'truck' && user.address && (
                      <p className="text-sm text-slate-600 break-all mb-3">
                        {user.address}
                      </p>
                    )}
                    
                    {/* Rating for trucks */}
                    {userType === 'truck' && user.averageRating > 0 && (
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < Math.round(user.averageRating) ? 'text-black' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-black">
                          {user.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          ({user.totalReviews || 0})
                        </span>
                      </div>
                    )}
                    {userType === 'truck' && user.averageRating <= 0 && (
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className="w-3 h-3 text-gray-300"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-black">
                          Not Rated
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          (0 reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 lg:p-10">
                {/* Dynamic Content Based on User Type */}
                {userType === 'truck' ? (
                  /* Truck Specific Content */
                  <div>
                    {/* Truck Details Section - Ultra Compact */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                      <div className="flex justify-between items-center">
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm flex-1 mr-2 min-w-0">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m3-1h1m1 1h1m-1 1v-3a1 1 0 011-1h2a1 1 0 011 1v3m-1 0h4" />
                              </svg>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</p>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate" title={user.type || "N/A"}>
                              {user.type || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm flex-1 mx-2 min-w-0">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4 8l4-4m0 0v12m0 0l4-4m-4 4l-4-4m6 0V4m0 0l4 4m-4-4l4 4" />
                              </svg>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Capacity</p>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate" title={user.capacityTons ? `${user.capacityTons} ton` : "N/A"}>
                              {user.capacityTons ? `${user.capacityTons} ton` : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm flex-1 ml-2 min-w-0">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate" title={user.location?.address || "N/A"}>
                              {user.location?.address || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {user.description && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                        <div className="text-left">
                          <p className="text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</p>
                          <p className="text-sm text-gray-900">{user.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Owner Information Section - Compact */}
                    {user.owner && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                        <div className="flex items-center gap-3">
                          {/* Owner Photo */}
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-200 border border-gray-300 shadow-sm overflow-hidden">
                              {user.owner.profileImageUrl ? (
                                <img
                                  src={user.owner.profileImageUrl}
                                  alt={user.owner.name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div className="w-full h-full flex items-center justify-center rounded-full text-gray-700 text-sm font-bold" style={{ display: user.owner.profileImageUrl ? 'none' : 'flex' }}>
                                {user.owner.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            {/* Verified Badge */}
                            {user.owner.verificationBadge && (
                              <div className="absolute -bottom-1 -right-1">
                                <VerifiedBadge size={16} />
                              </div>
                            )}
                          </div>
                          
                          {/* Owner Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {user.owner.name}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                              {/* Column 1: Company and Email */}
                              <div className="space-y-1">
                                {user.owner.companyName && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="truncate">{user.owner.companyName}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="truncate">{user.owner.email}</span>
                                </div>
                              </div>
                              
                              {/* Column 2: Experience and Phone */}
                              <div className="space-y-1">
                                {user.owner.experienceYears && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{user.owner.experienceYears} years</span>
                                  </div>
                                )}
                                {user.owner.phone && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493 1.498a1 1 0 00.684-.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                                    </svg>
                                    <span>{user.owner.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : userType === 'owner' ? (
                  /* Owner Specific Content - AdminDashboard Styling */
                  <div>
                    {/* Row 1 - Stats: Total Trucks, Total Bookings, Joined Date */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                        <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg border border-gray-200">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-sm font-bold text-gray-700 uppercase tracking-wide">
                          Owner Statistics
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0m-2 0l-2-2m2 2h2" />
                            </svg>
                          </div>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1">{user.totalTrucks || '0'}</p>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Trucks</p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                          </div>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1">{user.totalBookings || '0'}</p>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Bookings</p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-800 mb-1">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            }) : "N/A"}
                          </p>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Joined Date</p>
                        </div>
                      </div>
                    </div>

                    {/* Row 2 - Contact: Phone, Address */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                        <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg border border-gray-200">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-sm font-bold text-gray-700 uppercase tracking-wide">
                          Contact Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493 1.498a1 1 0 00.684-.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                            </svg>
                          </div>
                          <p className="text-xs sm:text-sm md:text-sm font-bold text-gray-800 mb-1">{user.phone || "N/A"}</p>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Phone</p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-xs sm:text-sm md:text-sm font-bold text-gray-800 mb-1 truncate">{user.address || "N/A"}</p>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Address</p>
                        </div>
                      </div>
                    </div>

                    {/* Row 3 - Company, Experience, Description */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                        <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg border border-gray-200">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-sm font-bold text-gray-700 uppercase tracking-wide">
                          Professional Details
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <p className="text-xs sm:text-sm md:text-sm font-bold text-gray-800 mb-1 truncate">{user.companyName || "N/A"}</p>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Company</p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-xs sm:text-sm md:text-sm font-bold text-gray-800 mb-1">{user.experienceYears ? `${user.experienceYears} Year${user.experienceYears > 1 ? 's' : ''}` : "N/A"}</p>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Experience</p>
                        </div>
                      </div>

                      {/* Description - Full Width */}
                      {user.description && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="inline-flex p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h4 className="text-xs sm:text-sm md:text-sm font-bold text-gray-700 uppercase tracking-wide">Description</h4>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{user.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Customer Specific Content - Same layout as truck */
                  <div>
                    {/* Customer Details Section - Ultra Compact */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                      <div className="flex justify-between items-center">
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm flex-1 mr-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493 1.498a1 1 0 00.684-.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                              </svg>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate" title={user.phone || "N/A"}>
                              {user.phone || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm flex-1 mx-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</p>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate" title={formatDate(user.createdAt)}>
                              {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm flex-1 ml-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2zm0 9a2 2 0 002 2V2a2 2 0 01-2 2H9a2 2 0 01-2-2V-2a2 2 0 012-2z" />
                              </svg>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bookings</p>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate" title={user.totalBookings || '0'}>
                              {user.totalBookings || '0'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {user.averageRating && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                        <div className="text-left">
                          <p className="text-xs font-semibold text-gray-500 mb-1">RATING</p>
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= Math.floor(user.averageRating)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900 ml-1">
                              {user.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({user.totalReviews || 0} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Actions - Ultra Compact */}
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm5-4a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Verification
                    </h5>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                        {(userType === 'truck' ? user.isVerified : user.verificationBadge) ? (
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-gray-900">
                          {(userType === 'truck' ? user.isVerified : user.verificationBadge) ? "Verified" : "Not Verified"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(userType === 'truck' ? user.isVerified : user.verificationBadge) 
                            ? "Approved for service"
                            : "Pending verification"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={toggleVerification}
                      disabled={updating}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        updating
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : (userType === 'truck' ? user.isVerified : user.verificationBadge)
                          ? 'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {updating ? (
                        <span className="flex items-center">
                          <svg className="animate-spin h-2.5 w-2.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8v4a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v-4a2 2 0 01-2-2h12a2 2 0 012 2z"></path>
                          </svg>
                          Updating...
                        </span>
                      ) : (userType === 'truck' ? user.isVerified : user.verificationBadge) ? (
                        <span className="flex items-center">
                          <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Revoke
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L5 21l4-4l4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Verify
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;
