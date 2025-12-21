import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Weight, IndianRupee, Route, Sparkles, Phone, Mail, CheckCircle, Clock, Calendar } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import BookingMap from '../components/BookingMap';
import LocationSuggestions from '../components/LocationSuggestions';
import { useUiFeedback } from '../context/UiFeedbackContext';
import VerifiedBadge from '../components/shared/VerifiedBadge';
import logger from '../utils/logger.js';

const NewBooking = () => {
  const { isCustomer } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast, confirm } = useUiFeedback();

  const [formData, setFormData] = useState({
    pickup: { address: '' },
    dropoff: { address: '' },
    notes: '',
    requiredCapacity: '',
    startTime: '',
    endTime: ''
  });

  const [trucks, setTrucks] = useState([]);
  const [route, setRoute] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictCheck, setConflictCheck] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pickup.address") {
      setFormData({ ...formData, pickup: { address: value } });
    } else if (name === "dropoff.address") {
      setFormData({ ...formData, dropoff: { address: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Check for booking conflicts
  const checkConflicts = async (startTime, endTime) => {
    if (!selectedTruck?._id || !startTime || !endTime) return;

    setCheckingConflicts(true);
    setConflictCheck(null);

    try {
      // Convert to ISO strings for API
      const startISO = new Date(startTime).toISOString();
      const endISO = new Date(endTime).toISOString();

      const response = await axiosInstance.get('/api/bookings/check-conflicts', {
        params: { 
          truckId: selectedTruck._id, 
          startTime: startISO, 
          endTime: endISO 
        }
      });

      if (response.data.success) {
        setConflictCheck(response.data.data);
        logger.component('NewBooking', 'info', 'Conflict check completed', { 
          hasConflict: response.data.data.hasConflict,
          truckId: selectedTruck._id,
          startTime: startISO,
          endTime: endISO
        });
      }
    } catch (error) {
      logger.error('Conflict check failed', { error, truckId: selectedTruck._id, startTime, endTime });
      toast({ type: 'error', message: 'Failed to check availability' });
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Auto-check conflicts when time or truck changes
  React.useEffect(() => {
    if (selectedTruck && formData.startTime && formData.endTime) {
      const timeoutId = setTimeout(() => {
        checkConflicts(selectedTruck._id, formData.startTime, formData.endTime);
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTruck, formData.startTime, formData.endTime]);

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
      'bagmati', 'province', 'district', 'marg', 'bazar', 'chowk', 'tol',
      'thamel', 'new road', 'baneshwor', 'kuleshwor', 'kalanki', 'koteshwor'
    ];
    
    // Also accept if it's a general location that could be in Nepal
    const generalIndicators = [
      'road', 'street', 'area', 'market', 'gate', 'chowk', 'bazar', 'marg', 'nagar'
    ];
    
    // Accept any text longer than 3 chars as fallback, but show warning
    const isLongEnough = locationLower.length > 3;
    
    const isNepalLocation = nepalIndicators.some(keyword => locationLower.includes(keyword)) ||
                           generalIndicators.some(keyword => locationLower.includes(keyword)) ||
                           isLongEnough;
    
    return isNepalLocation;
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!formData.pickup.address || !formData.dropoff.address || !formData.requiredCapacity) {
      toast({ type: 'error', message: 'Please fill pickup, dropoff & required capacity' });
      return;
    }

    // Validate Nepal locations
    if (!validateNepalLocation(formData.pickup.address)) {
      toast({ type: 'error', message: 'Pickup location must be in Nepal' });
      return;
    }
    
    if (!validateNepalLocation(formData.dropoff.address)) {
      toast({ type: 'error', message: 'Dropoff location must be in Nepal' });
      return;
    }

    setSearching(true);
    setTrucks([]);
    setRoute(null);

    try {
      // Send search request to backend
      const response = await axiosInstance.post('/customer/search-trucks', {
        pickup: { address: formData.pickup.address },
        dropoff: { address: formData.dropoff.address },
        requiredCapacity: Number(formData.requiredCapacity)
      });

      // Trucks and route received directly from backend
      const trucks = response.data?.data?.trucks || [];
      const route = response.data?.data?.route || null;

      console.log('Received trucks:', trucks.length);
      console.log('Required capacity:', formData.requiredCapacity);

      setTrucks(trucks);
      setRoute(route);

    } catch (error) {
      console.error('Search error:', error);
      
      // Enhanced error handling for geocoding failures
      let errorMessage = 'Location not found. Re-check spelling.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // If it's a geocoding error, provide helpful suggestions
        if (errorMessage.includes('Location not found') || errorMessage.includes('Failed to geocode')) {
          errorMessage += '\n\nTry: "Kathmandu, Nepal", "Pokhara, Nepal", or specific areas like "Thamel, Kathmandu"';
        }
      }
      
      toast({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setSearching(false);
    }
  };

    const handleBookTruck = async (truck) => {
    // Check if there are conflicts before booking
    if (conflictCheck && conflictCheck.hasConflict) {
      toast({ type: 'error', message: 'Cannot book truck due to scheduling conflicts. Please choose a different time slot.' });
      return;
    }

    // Validate time fields
    if (!formData.startTime || !formData.endTime) {
      toast({ type: 'error', message: 'Please select start and end times for your booking.' });
      return;
    }

    // Validate time logic
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    const now = new Date();

    if (startDate <= now) {
      toast({ type: 'error', message: 'Start time must be in the future.' });
      return;
    }

    if (endDate <= startDate) {
      toast({ type: 'error', message: 'End time must be after start time.' });
      return;
    }

    const ok = await confirm({
      title: 'Confirm booking',
      message: `Confirm booking with ${truck.title}?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    setSelectedTruck(truck._id);
    setSubmitting(true);

    try {
      console.log('Making booking request to /bookings');
      console.log('Request data:', {
        truckId: truck._id,
        pickup: {
          address: formData.pickup.address,
          lat: route?.pickup?.lat,
          lng: route?.pickup?.lng
        },
        dropoff: {
          address: formData.dropoff.address,
          lat: route?.dropoff?.lat,
          lng: route?.dropoff?.lng
        },
        notes: formData.notes,
        capacityTons: Number(formData.requiredCapacity),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString()
      });
      
      await axiosInstance.post('/bookings', {
        truckId: truck._id,
        pickup: {
          address: formData.pickup.address,
          lat: route?.pickup?.lat,
          lng: route?.pickup?.lng
        },
        dropoff: {
          address: formData.dropoff.address,
          lat: route?.dropoff?.lat,
          lng: route?.dropoff?.lng
        },
        notes: formData.notes,
        capacityTons: Number(formData.requiredCapacity),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString()
      });
    
      toast({ type: 'success', message: 'Booking request created successfully!' });
      navigate('/customer/dashboard');
    } catch (error) {
      console.error('Booking request failed:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      toast({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Failed to create booking',
      });
    } finally {
      setSubmitting(false);
      setSelectedTruck(null);
    }
  };

  if (!isCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-10 text-center max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please login as a customer to create a booking.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-all shadow-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
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
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-black tracking-tight">
                    Create New Booking
                  </h1>
                  <p className="text-md text-gray-500 mt-1">
                    Find trucks with capacity matching your needs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Booking Details
            </h3>
          </div>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pickup Location *
                </label>
                <LocationSuggestions
                  value={formData.pickup.address}
                  onChange={handleChange}
                  placeholder="e.g., Kathmandu, Pokhara, Lalitpur"
                  name="pickup.address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dropoff Location *
                </label>
                <LocationSuggestions
                  value={formData.dropoff.address}
                  onChange={handleChange}
                  placeholder="e.g., Pokhara, Biratnagar, Birgunj"
                  name="dropoff.address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Required Capacity (tons) *
                </label>
                <input
                  type="number"
                  name="requiredCapacity"
                  placeholder="e.g., 20"
                  min="1"
                  step="0.1"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all"
                  value={formData.requiredCapacity}
                  onChange={handleChange}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Only trucks with capacity ≥ this value will be shown
                </p>
              </div>
            </div>

            {/* Time-based booking fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all"
                  value={formData.startTime}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  When you need the truck (supports multi-day trips)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all"
                  value={formData.endTime}
                  onChange={handleChange}
                  min={formData.startTime || new Date().toISOString().slice(0, 16)}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Estimated completion time (supports multi-day trips up to 7 days)
                </p>
              </div>
            </div>

            {/* Conflict Check Display */}
            {checkingConflicts && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-blue-700">Checking availability...</span>
                </div>
              </div>
            )}

            {conflictCheck && (
              <div className={`rounded-xl p-4 ${conflictCheck.hasConflict ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-start gap-3">
                  {conflictCheck.hasConflict ? (
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
                            <p className="text-xs text-red-600 font-medium">Conflicting bookings:</p>
                            {conflictCheck.conflicts.map((conflict, index) => (
                              <div key={index} className="text-xs text-red-600 mt-1">
                                • {new Date(conflict.startTime).toLocaleString()} - {new Date(conflict.endTime).toLocaleString()} ({conflict.status})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 text-green-600 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-green-800">Time Slot Available</h4>
                        <p className="text-sm text-green-700 mt-1">{conflictCheck.message}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                rows="3"
                placeholder="Cargo details / special requirements"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all resize-none"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-gray-400/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {searching ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching Available Trucks...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Available Trucks
                </>
              )}
            </button>
          </form>
        </div>

        {/* Route Summary */}
        {route && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Route Summary
              </h3>
            </div>

            <div className="flex justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <span className="text-gray-600 font-medium">Total Trip Distance</span>
              <span className="text-2xl font-bold text-gray-800">{route.distance} km</span>
            </div>

            {route?.pickup?.lat && route?.dropoff?.lat && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <BookingMap 
                  pickup={route.pickup} 
                  dropoff={route.dropoff} 
                  distance={route.distance} 
                  onRouteCalculated={(routeData) => {
                    console.log('Route calculated:', routeData);
                    // Update the route with route-based distance if available
                    if (routeData.isRouteDistance) {
                      setRoute(prev => ({
                        ...prev,
                        distance: routeData.distance,
                        isRouteDistance: routeData.isRouteDistance,
                        durationMinutes: routeData.durationMinutes
                      }));
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Trucks List */}
        {trucks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0l-2-2m2 2h2" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Available Trucks ({trucks.length})
              </h3>
            </div>
            
            {/* Truck Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trucks.map((truck, index) => (
  <div
    key={truck._id}
    className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full"
    role="button"
    tabIndex={0}
    onClick={() => navigate(`/trucks/${truck._id}`)}
    onKeyPress={e => { if (e.key === 'Enter') navigate(`/trucks/${truck._id}`); }}
  >
    {/* Top Section - Truck Info */}
    <div className="bg-slate-50 px-3 sm:px-4 pt-2 pb-2 sm:pb-2 relative">
      {/* Distance Badge - Top Right */}
      {truck.distanceToPickup !== undefined && (
        <div className="absolute z-10 top-1 right-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 text-white rounded-full shadow-sm">
            <Route className="w-3 h-3" />
            <span className="text-[9px] font-semibold">
              {truck.distanceToPickup} KM
            </span>
          </div>
        </div>
      )}
      <div className="flex items-start gap-2 sm:gap-3 pr-14">
        {/* Truck Image/Avatar - Bigger */}
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border-2 border-gray-300 shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
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
            <div
              className="w-full h-full flex items-center justify-center bg-slate-200"
              style={{ display: truck.imageUrl ? "none" : "flex" }}
            >
              <svg
                className="w-9 h-9 sm:w-10 sm:h-10 text-slate-500"
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
          {/* Verified Badge - Black Star for Truck */}
          <div className="absolute -top-1 -right-1">
            <VerifiedBadge size={20} color="#1F2937" />
          </div>
        </div>
        {/* Title and Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1 leading-tight line-clamp-2">
            {truck.title}
          </h4>
          {/* Location */}
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-slate-500 truncate">
              {truck.location?.address ? truck.location.address.split(',')[0] : "Location not set"}
            </p>
          </div>
          {/* Best Match Badge - Below Location */}
          {index === 0 && (
            <div className="flex items-center gap-1 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700 shadow-sm">
                Best Match
              </span>
            </div>
          )}
          {/* Rating - Below Location */}
          {truck.averageRating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.round(truck.averageRating) ? 'text-black' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {truck.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({truck.totalReviews || 0})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Bottom Section - Statistics & Details */}
    <div className="px-3 sm:px-4 py-2 border-t border-slate-100 flex flex-col items-center justify-center mt-1">
      <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-1 text-center items-center justify-items-center w-full max-w-xs mx-auto">
        <div className="text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 leading-snug">TYPE</span>
          <div className="text-[11px] font-bold text-slate-900 truncate leading-snug">{truck.type?.toUpperCase() || "N/A"}</div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 leading-snug">STATUS</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 min-w-[44px] justify-center rounded-full text-[9px] sm:text-[10px] font-semibold ${truck.enhancedStatus?.statusType === 'available' ? "bg-slate-100 text-slate-700 border border-slate-300" : truck.enhancedStatus?.statusType === 'booked' ? "bg-blue-100 text-blue-700 border border-blue-300" : truck.enhancedStatus?.statusType === 'owner_off' ? "bg-orange-100 text-orange-700 border border-orange-300" : "bg-slate-200 text-slate-600 border border-slate-300"}`}>{truck.enhancedStatus?.status?.toUpperCase() || (truck.available ? "AVAILABLE" : "BUSY")}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 leading-snug">CAPACITY</span>
          <div className="text-[11px] font-bold text-slate-900 truncate leading-snug">{truck.capacityTons ? `${truck.capacityTons}T` : "N/A"}</div>
        </div>
      </div>
      {/* Extra Details from NewBooking */}
      <div className="w-full grid grid-cols-2 gap-3 my-2">
        <div className="flex flex-col items-center bg-slate-50 rounded-lg p-2">
          <span className="text-xs text-slate-500 font-medium">Trip Distance</span>
          <span className="text-sm font-bold text-slate-900">{truck.tripDistance} km</span>
        </div>
        <div className="flex flex-col items-center bg-slate-50 rounded-lg p-2">
          <span className="text-xs text-slate-500 font-medium">Est. Cost</span>
          <span className="text-sm font-bold text-slate-900">₹{truck.estimatedPrice}</span>
        </div>
      </div>
      {/* Owner Information - Organized & Beautiful */}
      {truck.owner && (
        <div className="pt-2 border-t border-slate-100 w-full mt-2">
          <div className="flex items-center gap-3">
            {/* Owner Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                {truck.owner.profileImageUrl ? (
                  <img
                    src={truck.owner.profileImageUrl}
                    alt="Owner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full flex items-center justify-center bg-slate-600"
                  style={{ display: truck.owner.profileImageUrl ? 'none' : 'flex' }}
                >
                  <span className="text-white font-bold text-sm">
                    {truck.owner.name?.charAt(0)?.toUpperCase() || 'O'}
                  </span>
                </div>
              </div>
              {/* Verified Badge - Blue Star for Owner */}
              <div className="absolute bottom-0 right-0">
                <VerifiedBadge size={16} color="#1D9BF0" />
              </div>
            </div>
            
            {/* Owner Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate leading-tight mb-1">
                {truck.owner.name || "Unknown"}
              </p>
              <div className="flex flex-col gap-1">
                {truck.owner.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{truck.owner.phone}</span>
                  </div>
                )}
                {truck.owner.email && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{truck.owner.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Book Button - Smaller */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleBookTruck(truck);
        }}
        disabled={submitting && selectedTruck === truck._id}
        className="w-full py-2 mt-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-lg font-semibold hover:from-slate-800 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group text-sm"
      >
        {submitting && selectedTruck === truck._id ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Booking...</span>
          </>
        ) : (
          <>
            <span>Book Now</span>
          </>
        )}
      </button>
    </div>
  </div>
))}
            </div>
          </div>
        )}
        {route && trucks.length === 0 && !searching && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-sm p-10 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trucks Found</h3>
              <p className="text-gray-600 mb-4">
                No trucks with capacity <strong>{formData.requiredCapacity} tons</strong> are available for this route.
              </p>
              <p className="text-sm text-gray-500">
                Try adjusting your capacity requirement or check back later.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewBooking;
