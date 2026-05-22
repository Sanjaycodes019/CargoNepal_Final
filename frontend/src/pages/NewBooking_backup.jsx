import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Weight, IndianRupee, Route, Sparkles } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import BookingMap from '../components/BookingMap';
import { useUiFeedback } from '../context/UiFeedbackContext';

const NewBooking = () => {
  const { isCustomer } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast, confirm } = useUiFeedback();

  const [formData, setFormData] = useState({
    pickup: { address: '' },
    dropoff: { address: '' },
    notes: '',
    requiredCapacity: ''
  });

  const [trucks, setTrucks] = useState([]);
  const [route, setRoute] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);

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

  const handleSearch = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!formData.pickup.address || !formData.dropoff.address || !formData.requiredCapacity) {
      toast({ type: 'error', message: 'Please fill pickup, dropoff & required capacity' });
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
      toast({
        type: 'error',
        message: error.response?.data?.message || 'Location not found. Re-check spelling.',
      });
    } finally {
      setSearching(false);
    }
  };

    const handleBookTruck = async (truck) => {
    const ok = await confirm({
      title: 'Confirm booking',
      message: `Confirm booking with ${truck.title}?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });
    if (!ok) return;
  
    if (!formData.requiredCapacity) {
      toast({ type: 'error', message: 'Required capacity is missing' });
      return;
    }
  
    setSubmitting(true);
    setSelectedTruck(truck._id);
  
    try {
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
        capacityTons: Number(formData.requiredCapacity) // auto fetched correctly
      });
    
      toast({ type: 'success', message: 'Booking request created successfully!' });
      navigate('/customer/dashboard');
    } catch (error) {
      toast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create booking',
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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Booking</h1>
          <p className="text-gray-600">Find trucks with capacity matching your needs</p>
        </div>

        {/* Booking Form */}
        <div className="bg-white border rounded-xl shadow-sm p-6 sm:p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  name="pickup.address"
                  placeholder="e.g., Kathmandu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  value={formData.pickup.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dropoff Location *
                </label>
                <input
                  type="text"
                  name="dropoff.address"
                  placeholder="e.g., Pokhara"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  value={formData.dropoff.address}
                  onChange={handleChange}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  value={formData.requiredCapacity}
                  onChange={handleChange}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Only trucks with capacity ≥ this value will be shown
                </p>
              </div>
            </div>

            <textarea
              name="notes"
              rows="3"
              placeholder="Cargo details / special requirements (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              value={formData.notes}
              onChange={handleChange}
            />

            <button
              type="submit"
              disabled={searching}
              className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
            >
              {searching ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching Available Trucks...
                </span>
              ) : (
                'Search Available Trucks'
              )}
            </button>
          </form>
        </div>

        {/* Route Summary */}
        {route && (
          <div className="bg-white border rounded-xl shadow-sm p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Route Summary</h2>

            <div className="flex justify-between bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200 mb-4">
              <span className="text-gray-600 font-medium">Total Trip Distance</span>
              <span className="text-2xl font-bold text-slate-900">{route.distance} km</span>
            </div>

            {route?.pickup?.lat && route?.dropoff?.lat && (
              <BookingMap 
                pickup={route.pickup} 
                dropoff={route.dropoff} 
                distance={route.distance} 
              />
            )}
          </div>
        )}

        {/* Trucks List */}
        {trucks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Available Trucks ({trucks.length})
                </h2>
                <p className="text-sm text-gray-500">
                  Sorted by best capacity match and proximity
                </p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {trucks.map((truck, index) => (
                <div
                  key={truck._id}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 hover:border-slate-200"
                >
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900"></div>

                  {/* Best Match Badge */}
                  {index === 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Best Match
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-5 p-5">

                    {/* Image */}
                    {truck.imageUrl && (
                      <div className="relative md:w-64 h-48 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={truck.imageUrl}
                          alt={truck.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Distance to Pickup Badge */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-700" />
                          <span className="text-sm font-semibold text-slate-900">
                            {truck.distanceToPickup} km away
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                          {truck.title}
                        </h3>
                        
                        {/* Capacity Match Indicator */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Capacity Match:</span>
                            <span className="font-semibold text-slate-900">
                              {truck.capacityTons} tons
                            </span>
                            {truck.capacityDifference !== undefined && (
                              <span className="text-xs text-green-600 font-medium">
                                (+{truck.capacityDifference.toFixed(1)} tons extra)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {/* Capacity */}
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                            <div className="p-1.5 bg-slate-900 rounded-md">
                              <Weight className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Capacity</p>
                              <p className="text-sm font-bold text-slate-900">{truck.capacityTons} tons</p>
                            </div>
                          </div>

                          {/* Trip Distance */}
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                            <div className="p-1.5 bg-slate-900 rounded-md">
                              <Route className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Trip Distance</p>
                              <p className="text-sm font-bold text-slate-900">{truck.tripDistance} km</p>
                            </div>
                          </div>

                          {/* Rate */}
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                            <div className="p-1.5 bg-slate-900 rounded-md">
                              <IndianRupee className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Rate per km</p>
                              <p className="text-sm font-bold text-slate-900">₹{truck.ratePerKm}</p>
                            </div>
                          </div>

                          {/* Estimated Price */}
                          <div className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg p-3 shadow-md">
                            <div className="p-1.5 bg-white/20 rounded-md">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-300 font-medium">Est. Cost</p>
                              <p className="text-sm font-bold text-white">₹{truck.estimatedPrice}</p>
                            </div>
                          </div>
                        </div>

                        {/* Owner Info (if available) */}
                        {truck.owner && (
                          <div className="text-xs text-gray-500 mb-3">
                            Owner: {truck.owner.name} {truck.owner.phone && `• ${truck.owner.phone}`}
                          </div>
                        )}
                      </div>

                      {/* Book Button */}
                      <button
                        onClick={() => handleBookTruck(truck)}
                        disabled={submitting && selectedTruck === truck._id}
                        className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-xl font-semibold hover:from-slate-800 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                      >
                        {submitting && selectedTruck === truck._id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Booking...</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            <span>Book This Truck</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No trucks found */}
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
