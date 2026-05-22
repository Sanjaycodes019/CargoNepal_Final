import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link } from "react-router-dom";
import { Truck, MapPin, Star, Calendar, Clock, IndianRupee, Route, Filter, Search, X, ChevronDown, Loader2, Phone, Mail, CheckCircle, Activity } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import BookingMap from '../components/BookingMap';
import LocationSuggestions from '../components/LocationSuggestions';
import { useUiFeedback } from '../context/UiFeedbackContext';
import VerifiedBadge from '../components/shared/VerifiedBadge';
import logger from '../utils/logger.js';

// Fuzzy search function for typo tolerance
const getFuzzyMatch = (searchTerm, text) => {
  // Simple Levenshtein distance implementation
  const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };
  
  const distance = getLevenshteinDistance(searchTerm, text);
  const threshold = Math.max(2, Math.floor(searchTerm.length * 0.3));
  return distance <= threshold;
};

// Get unique truck types from data
const getUniqueTruckTypes = (trucks) => {
  const types = [...new Set(trucks.map(truck => truck.type).filter(Boolean))];
  return types.sort();
};

// API-based location suggestions using Nominatim (like Uber)
const fetchLocationSuggestions = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=NP&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CargoNepal/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Location search failed');
    }
    
    const data = await response.json();
    return data.map(place => ({
      name: place.display_name.split(',')[0],
      fullName: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      description: place.display_name,
      type: place.type,
      importance: place.importance || 0
    }));
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
};

// Geolocation utility functions using Nominatim API (matching backend logic)
const geocodeLocation = async (locationName) => {
  try {
    // Use backend endpoint with Nominatim API (exact same as backend)
    const response = await axiosInstance.get(`/utils/geocode?location=${encodeURIComponent(locationName)}`);
    
    if (response.data.success && response.data.data) {
      return {
        lat: response.data.data.lat,
        lng: response.data.data.lng
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};

// Fast Haversine distance for initial filtering (no API calls)
const getHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) ** 2 + 
    Math.cos(lat1 * Math.PI / 180) * 
    Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Trucks = () => {
  const { user } = useContext(AuthContext);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    pickup: { address: '' },
    dropoff: { address: '' },
    notes: '',
    requiredCapacity: '',
    startTime: '',
    endTime: ''
  });
  
  // Additional booking states
  const [submitting, setSubmitting] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictCheck, setConflictCheck] = useState(null);
  const [route, setRoute] = useState(null);
  
  // Advanced search and filter states
  const [sortBy, setSortBy] = useState("newest");
  const [locationSearch, setLocationSearch] = useState("");
  const [truckType, setTruckType] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  
  // Multi-select filters
  const [selectedTruckTypes, setSelectedTruckTypes] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [minRating, setMinRating] = useState("");
  const [availabilityDates, setAvailabilityDates] = useState({ start: "", end: "" });
  
  // Smart search states
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTruckTypeDropdown, setShowTruckTypeDropdown] = useState(false);
  
  // Geolocation states
  const [searchLocationCoords, setSearchLocationCoords] = useState(null);
  const [truckDistances, setTruckDistances] = useState({});
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  
  // Refs for debouncing
  const locationSearchTimeout = useRef(null);
  const routeCalculationTimeout = useRef(null);
  
  const { toast } = useUiFeedback();

  // Check for booking conflicts
  const checkConflicts = async (startTime, endTime) => {
    if (!selectedTruck?._id || !startTime || !endTime) return;
    
    // Check if user is authenticated
    if (!user) {
      console.log('No user found in auth context');
      toast({ type: 'error', message: 'Please login to check availability' });
      return;
    }

    console.log('Checking conflicts with user:', user);
    console.log('Selected truck:', selectedTruck);

    setCheckingConflicts(true);
    setConflictCheck(null);

    try {
      // Convert to ISO strings for API
      const startISO = new Date(startTime).toISOString();
      const endISO = new Date(endTime).toISOString();

      console.log('Making conflict check request:', {
        truckId: selectedTruck._id,
        startTime: startISO,
        endTime: endISO
      });

      const response = await axiosInstance.get('/bookings/check-conflicts', {
        params: { 
          truckId: selectedTruck._id, 
          startTime: startISO, 
          endTime: endISO 
        }
      });

      if (response.data.success) {
        setConflictCheck(response.data.data);
        logger.component('Trucks', 'info', 'Conflict check completed', { 
          hasConflict: response.data.data.hasConflict,
          truckId: selectedTruck._id,
          startTime: startISO,
          endTime: endISO
        });
      }
    } catch (error) {
      console.error('Conflict check error details:', {
        error: error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        truckId: selectedTruck._id,
        startTime,
        endTime
      });
      logger.error('Conflict check failed', { error, truckId: selectedTruck._id, startTime, endTime });
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.message || 
                          'Failed to check availability';
      
      toast({ type: 'error', message: errorMessage });
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Auto-check conflicts when time or truck changes
  useEffect(() => {
    if (bookingForm.startTime && bookingForm.endTime) {
      const timeoutId = setTimeout(() => {
        if (selectedTruck) {
          // Check specific truck availability
          checkConflicts(bookingForm.startTime, bookingForm.endTime);
        } else {
          // Show time validation message without truck selection
          setCheckingConflicts(false);
          setConflictCheck({
            hasConflict: false,
            message: 'Time slot selected. Please select a truck to check availability.',
            conflicts: []
          });
        }
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTruck, bookingForm.startTime, bookingForm.endTime]);

  // Additional effect: check conflicts immediately when truck is selected and times are already set
  useEffect(() => {
    if (selectedTruck && bookingForm.startTime && bookingForm.endTime && !conflictCheck) {
      // Immediate check when truck is selected with existing times
      checkConflicts(bookingForm.startTime, bookingForm.endTime);
    }
  }, [selectedTruck]);

  // Calculate route for booking using OSRM directly
  const calculateRoute = async (pickup, dropoff) => {
    if (!pickup || !dropoff) return;
    
    try {
      // Get coordinates for both locations
      const pickupCoords = await geocodeLocation(pickup);
      const dropoffCoords = await geocodeLocation(dropoff);
      
      if (!pickupCoords || !dropoffCoords) {
        console.log('Could not get coordinates for route calculation');
        return;
      }
      
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
          const route = data.routes[0];
          setRoute({
            pickup: pickupCoords,
            dropoff: dropoffCoords,
            distance: route.distance / 1000, // Convert meters to km
            duration: route.duration / 60, // Convert seconds to minutes
            geometry: route.geometry
          });
          console.log('Route calculated successfully:', {
            distance: route.distance / 1000,
            duration: route.duration / 60
          });
        }
      }
    } catch (error) {
      console.log('Route calculation failed:', error);
    }
  };

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('truckSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save search to history
  const saveToSearchHistory = (term) => {
    if (term && term.length > 2) {
      const updatedHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10);
      setSearchHistory(updatedHistory);
      localStorage.setItem('truckSearchHistory', JSON.stringify(updatedHistory));
    }
  };

  // Generate search suggestions based on trucks
  const generateSearchSuggestions = (term) => {
    if (!term || term.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = new Set();
    trucks.forEach(truck => {
      // Add title suggestions
      if (truck.title && truck.title.toLowerCase().includes(term.toLowerCase())) {
        suggestions.add(truck.title);
      }
      // Add type suggestions
      if (truck.type && truck.type.toLowerCase().includes(term.toLowerCase())) {
        suggestions.add(truck.type);
      }
      // Add description keywords
      if (truck.description) {
        const words = truck.description.split(' ');
        words.forEach(word => {
          if (word.toLowerCase().includes(term.toLowerCase()) && word.length > 2) {
            suggestions.add(word);
          }
        });
      }
    });

    setSearchSuggestions(Array.from(suggestions).slice(0, 8));
  };

  // Generate location suggestions with exact matching (Uber-style)
  const generateLocationSuggestions = async (term) => {
    // Require minimum 3 characters and validate input
    if (!term || term.length < 3 || !/^[a-zA-Z\s]+$/.test(term.trim())) {
      setLocationSuggestions([]);
      return;
    }

    // Prevent random words - check if it could be a location
    const suspiciousWords = ['hello', 'world', 'test', 'random', 'asdf', 'xyz', 'abc', '123', 'qwerty'];
    const isSuspicious = suspiciousWords.some(word => term.toLowerCase().includes(word));
    
    if (isSuspicious) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const suggestions = await fetchLocationSuggestions(term);
      
      // Filter and sort results - exact matches first
      const searchTerm = term.toLowerCase().trim();
      const validSuggestions = suggestions
        .filter(suggestion => 
          suggestion.lat && 
          suggestion.lng && 
          suggestion.name && 
          suggestion.name.length > 1
        )
        .sort((a, b) => {
          // Exact match priority
          const aExact = a.name.toLowerCase() === searchTerm;
          const bExact = b.name.toLowerCase() === searchTerm;
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Then by importance
          return (b.importance || 0) - (a.importance || 0);
        })
        .slice(0, 5);

      setLocationSuggestions(validSuggestions);
    } catch (error) {
      console.error('Error generating location suggestions:', error);
      setLocationSuggestions([]);
    }
  };

  // Handle search term change with suggestions
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    generateSearchSuggestions(value);
    setShowSuggestions(true);
  };

  // Handle location search change with suggestions (Uber-style)
  const handleLocationChange = (value) => {
    setLocationSearch(value);
    setShowSuggestions(true);
    
    // Clear existing timeout
    if (locationSearchTimeout.current) {
      clearTimeout(locationSearchTimeout.current);
    }
    
    // Debounce API call
    locationSearchTimeout.current = setTimeout(() => {
      generateLocationSuggestions(value);
    }, 300); // Quick debounce for suggestions
  };

  // Select search suggestion
  const selectSearchSuggestion = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    saveToSearchHistory(suggestion);
  };

  // Select location suggestion and trigger distance calculation
  const selectLocationSuggestion = async (suggestion) => {
    // Handle both old string format and new API object format
    let locationName;
    if (typeof suggestion === 'string') {
      locationName = suggestion;
    } else if (suggestion && suggestion.name) {
      locationName = suggestion.name;
    } else {
      return;
    }

    setLocationSearch(locationName);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    
    // Clear timeout
    if (locationSearchTimeout.current) {
      clearTimeout(locationSearchTimeout.current);
    }

    // Calculate distances only after selection
    await calculateDistancesForLocation(locationName);
  };

  // Separate function for distance calculation (optimized for speed)
  const calculateDistancesForLocation = async (locationName) => {
    if (!locationName || !trucks.length) {
      setSearchLocationCoords(null);
      setTruckDistances({});
      setIsCalculatingDistances(false);
      return;
    }

    setIsCalculatingDistances(true);

    try {
      // Get coordinates for selected location
      const coords = await geocodeLocation(locationName);
      if (!coords) {
        setSearchLocationCoords(null);
        setTruckDistances({});
        toast({
          message: "Location not found. Please check the spelling and try again.",
          type: "error"
        });
        return;
      }

      setSearchLocationCoords(coords);

      // FAST APPROACH: Use Haversine for initial filtering (instant)
      const distances = {};
      const trucksWithValidLocation = [];
      
      trucks.forEach(truck => {
        let truckLat = truck.location?.coordinates?.[1]; // latitude is second element
        let truckLng = truck.location?.coordinates?.[0]; // longitude is first element
        
        if (truckLat && truckLng) {
          // Use fast Haversine distance (no API call)
          const distance = getHaversineDistance(
            coords.lat, coords.lng,
            truckLat, truckLng
          );
          distances[truck._id] = Math.round(distance * 100) / 100;
          trucksWithValidLocation.push(truck);
        }
      });

      setTruckDistances(distances);
      
      // Show success message
      if (trucksWithValidLocation.length > 0) {
        toast({
          message: `Found ${trucksWithValidLocation.length} trucks near ${locationName}`,
          type: "success"
        });
      }

      // OPTIONAL: Get OSRM distances for top 5 trucks only (background)
      setTimeout(async () => {
        const topTrucks = trucksWithValidLocation
          .sort((a, b) => distances[a._id] - distances[b._id])
          .slice(0, 5);
        
        for (const truck of topTrucks) {
          try {
            const response = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${coords.lng},${coords.lat};${truck.location.lng},${truck.location.lat}?overview=full`,
              {
                headers: {
                  'User-Agent': 'CargoNepal/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.routes && data.routes.length > 0) {
                const routeDistance = data.routes[0].distance / 1000;
                setTruckDistances(prev => ({
                  ...prev,
                  [truck._id]: Math.round(routeDistance * 100) / 100
                }));
              }
            }
          } catch (error) {
            // Keep Haversine distance if OSRM fails
            console.log(`OSRM failed for truck ${truck._id}, keeping Haversine`);
          }
        }
      }, 1000); // Start after 1 second

    } catch (error) {
      console.error('Error calculating distances:', error);
      toast({
        message: "Failed to calculate distances. Please try again.",
        type: "error"
      });
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close search suggestions
      if (showSuggestions && 
          !event.target.closest('.location-suggestions-container') &&
          !event.target.closest('[data-truck-type-dropdown]')) {
        setShowSuggestions(false);
      }
      
      // Close truck type dropdown
      if (showTruckTypeDropdown && 
          !event.target.closest('[data-truck-type-dropdown]')) {
        setShowTruckTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions, showTruckTypeDropdown]);

  // Multi-select truck type handlers
  const handleTruckTypeToggle = (type) => {
    setSelectedTruckTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setLocationSearch("");
    setSelectedTruckTypes([]);
    setPriceRange({ min: "", max: "" });
    setMinRating("");
    setAvailabilityDates({ start: "", end: "" });
    setMinCapacity("");
    setTruckType("");
    setFilterStatus("all");
    setSortBy("newest");
    setSearchLocationCoords(null);
    setTruckDistances({});
  };

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setLoading(true);
        
        // Build query parameters for availability dates
        const params = new URLSearchParams();
        if (availabilityDates.start) params.append('availableFrom', availabilityDates.start);
        if (availabilityDates.end) params.append('availableUntil', availabilityDates.end);
        
        const url = params.toString() ? `/trucks?${params.toString()}` : '/trucks';
        const response = await axiosInstance.get(url);
        setTrucks(response.data.data || []);
      } catch (error) {
        console.error("Error fetching trucks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, [availabilityDates.start, availabilityDates.end]);

  const filteredTrucks = trucks.filter((truck) => {
    // Only show trucks with valid location coordinates when location search is active
    const hasValidLocation = truck.location?.lat && truck.location?.lng;
    
    // Basic search (name, type, description) - with fuzzy matching
    const matchesSearch = searchTerm === "" || 
      truck.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Fuzzy search - check if search term is close to truck title
      (searchTerm.length > 2 && truck.title && getFuzzyMatch(searchTerm.toLowerCase(), truck.title.toLowerCase()));
    
    // Location search logic - if active, require valid coordinates OR address match
    const matchesLocation = !locationSearch || 
      (hasValidLocation && truckDistances[truck._id] !== undefined) || // Has calculated distance
      truck.location?.address?.toLowerCase().includes(locationSearch.toLowerCase()); // Address matches
    
    // If location search is active but truck has no valid coordinates, exclude it
    if (locationSearch && !hasValidLocation) {
      return false;
    }
    
    // Multi-select truck type filter
    const matchesType = selectedTruckTypes.length === 0 || 
      selectedTruckTypes.some(type => truck.type?.toLowerCase().includes(type.toLowerCase()));
    
    // Price range filter
    const truckPrice = truck.ratePerKm || 25;
    const matchesPrice = (!priceRange.min || truckPrice >= Number(priceRange.min)) &&
                        (!priceRange.max || truckPrice <= Number(priceRange.max));
    
    // Rating-based filter
    const truckRating = truck.averageRating || 0;
    const matchesRating = !minRating || truckRating >= Number(minRating);
    
    // Minimum capacity filter - ensure valid comparison
    const matchesCapacity = !minCapacity || 
      (truck.capacityTons && !isNaN(truck.capacityTons) && Number(truck.capacityTons) >= Number(minCapacity));
    
    // Availability date range filter
    const matchesAvailability = (!availabilityDates.start && !availabilityDates.end) ||
      (!truck.availableFrom && !truck.availableUntil) || // If truck has no availability dates, show it
      (truck.availableFrom && truck.availableUntil &&
       (!availabilityDates.start || new Date(truck.availableFrom) <= new Date(availabilityDates.start)) &&
       (!availabilityDates.end || new Date(truck.availableUntil) >= new Date(availabilityDates.end))) ||
      // Handle cases where truck has only one of the dates
      (truck.availableFrom && !truck.availableUntil &&
       (!availabilityDates.start || new Date(truck.availableFrom) <= new Date(availabilityDates.start))) ||
      (!truck.availableFrom && truck.availableUntil &&
       (!availabilityDates.end || new Date(truck.availableUntil) >= new Date(availabilityDates.end)));
    
    // Status filter using enhanced status
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "available" && (truck.enhancedStatus?.available || truck.available)) ||
                         (filterStatus === "unavailable" && !(truck.enhancedStatus?.available || truck.available));
    
    // Apply all filters
    return matchesSearch && matchesType && matchesPrice && matchesRating && 
           matchesCapacity && matchesAvailability && matchesStatus && matchesLocation;
  });

  // Apply smart sorting based on location search and distance (matching backend best match logic)
  const sortedTrucks = [...filteredTrucks].sort((a, b) => {
    // If location search is active and distances are calculated, apply backend best match algorithm
    if (locationSearch && truckDistances[a._id] !== undefined && truckDistances[b._id] !== undefined) {
      // Backend best match logic: capacityWeight = 10, distanceWeight = 1
      const capacityWeight = 10;  // Prioritize closer capacity match
      const distanceWeight = 1;   // Secondary priority
      
      // Calculate capacity difference (how much more than required)
      const aCapacityDiff = minCapacity ? Math.max(0, (a.capacityTons || 0) - Number(minCapacity)) : 0;
      const bCapacityDiff = minCapacity ? Math.max(0, (b.capacityTons || 0) - Number(minCapacity)) : 0;
      
      // Calculate match scores using backend formula
      const aMatchScore = (aCapacityDiff * capacityWeight) + (truckDistances[a._id] * distanceWeight);
      const bMatchScore = (bCapacityDiff * capacityWeight) + (truckDistances[b._id] * distanceWeight);
      
      return aMatchScore - bMatchScore; // Lower score = better match (matching backend)
    }
    
    // Otherwise use selected sort option
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "near_location":
        // Fallback to address-based sorting if no distance available
        if (locationSearch && a.location?.address && b.location?.address) {
          const aLocation = a.location.address.toLowerCase();
          const bLocation = b.location.address.toLowerCase();
          const searchLocation = locationSearch.toLowerCase();
          const aScore = aLocation.includes(searchLocation) ? 1 : 0;
          const bScore = bLocation.includes(searchLocation) ? 1 : 0;
          if (aScore !== bScore) return bScore - aScore;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const displayedTrucks = sortedTrucks.slice(0, displayCount);
  const hasMore = sortedTrucks.length > displayCount;

  const handleBookNow = (truck) => {
    setSelectedTruck(truck);
    setConflictCheck(null); // Clear previous conflict checks
    setCheckingConflicts(false); // Reset checking state
    setBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setBookingModalOpen(false);
    setSelectedTruck(null);
    setBookingForm({
      pickup: { address: '' },
      dropoff: { address: '' },
      notes: '',
      requiredCapacity: '',
      startTime: '',
      endTime: ''
    });
    setConflictCheck(null);
    setRoute(null);
    
    // Clear route calculation timeout
    if (routeCalculationTimeout.current) {
      clearTimeout(routeCalculationTimeout.current);
    }
  };

  const handleBookingFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "pickup.address") {
      setBookingForm({ ...bookingForm, pickup: { address: value } });
      // Debounced route calculation when both pickup and dropoff are available
      if (bookingForm.dropoff.address && value.length >= 3 && bookingForm.dropoff.address.length >= 3) {
        // Clear existing timeout
        if (routeCalculationTimeout.current) {
          clearTimeout(routeCalculationTimeout.current);
        }
        // Set new timeout for route calculation
        routeCalculationTimeout.current = setTimeout(() => {
          calculateRoute(value, bookingForm.dropoff.address);
        }, 1000); // 1 second debounce
      }
    } else if (name === "dropoff.address") {
      setBookingForm({ ...bookingForm, dropoff: { address: value } });
      // Debounced route calculation when both pickup and dropoff are available
      if (bookingForm.pickup.address && bookingForm.pickup.address.length >= 3 && value.length >= 3) {
        // Clear existing timeout
        if (routeCalculationTimeout.current) {
          clearTimeout(routeCalculationTimeout.current);
        }
        // Set new timeout for route calculation
        routeCalculationTimeout.current = setTimeout(() => {
          calculateRoute(bookingForm.pickup.address, value);
        }, 1000); // 1 second debounce
      }
    } else {
      setBookingForm({ ...bookingForm, [name]: value });
    }
  };

  // Validate Nepal location - very flexible validation
  const validateNepalLocation = (location) => {
    if (!location || typeof location !== 'string') return false;
    
    // Remove extra whitespace and check if there's actual content
    const trimmedLocation = location.trim();
    if (trimmedLocation.length < 2) return false;
    
    // For now, accept any location with reasonable length
    // The backend will handle proper geocoding validation
    return true;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTruck) return;

    console.log('Booking form data:', bookingForm);
    console.log('Selected truck:', selectedTruck);

    // Validate Nepal locations
    if (!validateNepalLocation(bookingForm.pickup.address)) {
      console.log('Pickup validation failed:', bookingForm.pickup.address);
      toast({ type: 'error', message: 'Pickup location must be in Nepal' });
      return;
    }
    
    if (!validateNepalLocation(bookingForm.dropoff.address)) {
      console.log('Dropoff validation failed:', bookingForm.dropoff.address);
      toast({ type: 'error', message: 'Dropoff location must be in Nepal' });
      return;
    }

    // Check if there are conflicts before booking
    if (conflictCheck && conflictCheck.hasConflict) {
      toast({ type: 'error', message: 'Cannot book truck due to scheduling conflicts. Please choose a different time slot.' });
      return;
    }

    // Validate time fields
    if (!bookingForm.startTime || !bookingForm.endTime) {
      console.log('Time validation failed:', { startTime: bookingForm.startTime, endTime: bookingForm.endTime });
      toast({ type: 'error', message: 'Please select start and end times for your booking.' });
      return;
    }

    // Validate time logic
    const startDate = new Date(bookingForm.startTime);
    const endDate = new Date(bookingForm.endTime);
    const now = new Date();

    if (startDate <= now) {
      toast({ type: 'error', message: 'Start time must be in the future.' });
      return;
    }

    if (endDate <= startDate) {
      toast({ type: 'error', message: 'End time must be after start time.' });
      return;
    }

    setSubmitting(true);

    try {
      // Get coordinates for pickup and dropoff if not available from route
      let pickupCoords = route?.pickup;
      let dropoffCoords = route?.dropoff;
      
      console.log('Initial coords:', { pickupCoords, dropoffCoords });
      
      // If route coordinates are not available, geocode the addresses
      if (!pickupCoords || !pickupCoords.lat || !pickupCoords.lng) {
        console.log('Geocoding pickup:', bookingForm.pickup.address);
        pickupCoords = await geocodeLocation(bookingForm.pickup.address);
        console.log('Pickup coords result:', pickupCoords);
      }
      
      if (!dropoffCoords || !dropoffCoords.lat || !dropoffCoords.lng) {
        console.log('Geocoding dropoff:', bookingForm.dropoff.address);
        dropoffCoords = await geocodeLocation(bookingForm.dropoff.address);
        console.log('Dropoff coords result:', dropoffCoords);
      }
      
      // Validate that we have coordinates
      if (!pickupCoords || !pickupCoords.lat || !pickupCoords.lng) {
        console.log('Pickup coords validation failed:', pickupCoords);
        toast({ type: 'error', message: 'Unable to get pickup location coordinates. Please check the pickup address.' });
        setSubmitting(false);
        return;
      }
      
      if (!dropoffCoords || !dropoffCoords.lat || !dropoffCoords.lng) {
        console.log('Dropoff coords validation failed:', dropoffCoords);
        toast({ type: 'error', message: 'Unable to get dropoff location coordinates. Please check the dropoff address.' });
        setSubmitting(false);
        return;
      }

      console.log('Final booking data:', {
        truckId: selectedTruck._id,
        pickup: {
          address: bookingForm.pickup.address,
          coordinates: {
            lat: pickupCoords.lat,
            lng: pickupCoords.lng
          }
        },
        dropoff: {
          address: bookingForm.dropoff.address,
          coordinates: {
            lat: dropoffCoords.lat,
            lng: dropoffCoords.lng
          }
        }
      });

      await axiosInstance.post('/bookings', {
        truckId: selectedTruck._id,
        pickup: {
          address: bookingForm.pickup.address,
          lat: pickupCoords.lat,
          lng: pickupCoords.lng
        },
        dropoff: {
          address: bookingForm.dropoff.address,
          lat: dropoffCoords.lat,
          lng: dropoffCoords.lng
        },
        notes: bookingForm.notes,
        capacityTons: Number(bookingForm.requiredCapacity),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString()
      });

      toast({
        message: "Booking created successfully!",
        type: "success"
      });

      handleCloseBookingModal();
    } catch (error) {
      toast({
        message: error.response?.data?.message || "Failed to create booking",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-slate-900"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading trucks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Enhanced Header */}
        <div className="mb-8 lg:mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Available Trucks
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
                Connect with trusted truck owners across Nepal. Find the perfect vehicle for your cargo transportation needs.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-4">
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Available</p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">
                      {filteredTrucks.filter(t => (t.enhancedStatus?.available || t.available)).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Trucks</p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{filteredTrucks.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Search Trucks</h3>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Main Search with Suggestions */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-medium">
                Search by name, type, description...
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, type, description..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 placeholder-gray-400"
                />
              </div>
              
              {/* Search Suggestions */}
              {showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchSuggestions.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500 font-medium mb-2">Suggestions</p>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectSearchSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchHistory.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-2">Recent Searches</p>
                      {searchHistory.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => selectSearchSuggestion(item)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Clock className="w-3 h-3 mr-2 inline text-gray-400" />
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Search with Auto-complete */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-medium tracking-tight">
                  Near Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {isCalculatingDistances && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="e.g., Kathmandu, Pokhara..."
                    value={locationSearch}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    // Remove onBlur to keep suggestions visible for selection
                    className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 placeholder-gray-400 ${
                      isCalculatingDistances ? 'pr-12' : ''
                    }`}
                  />
                </div>
                {isCalculatingDistances && (
                  <p className="text-xs text-gray-500 mt-1">
                    Calculating distances...
                  </p>
                )}
                {locationSearch && locationSearch.length < 3 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Enter at least 3 characters to search location
                  </p>
                )}
                
                {/* Location Suggestions */}
                {locationSuggestions.length > 0 && (
                  <div className="location-suggestions-container absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => {
                      const isExactMatch = suggestion.name.toLowerCase() === locationSearch.toLowerCase().trim();
                      return (
                        <button
                          key={index}
                          onClick={() => selectLocationSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="font-medium text-gray-900">
                                  {suggestion.name || suggestion}
                                </span>
                                {isExactMatch && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                    Exact
                                  </span>
                                )}
                                {suggestion.importance && suggestion.importance > 0.5 && !isExactMatch && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 ml-5 line-clamp-2">
                                {suggestion.description || suggestion.fullName}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Multi-select Truck Types */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-medium tracking-tight">
                  Truck Types
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowTruckTypeDropdown(!showTruckTypeDropdown)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 text-left flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {selectedTruckTypes.length > 0 
                        ? `${selectedTruckTypes.length} types selected`
                        : 'Select truck types'
                      }
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {/* Truck Type Selection Dropdown */}
                  {showTruckTypeDropdown && (
                    <div className="relative z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4" data-truck-type-dropdown>
                      <p className="text-sm font-medium text-gray-700 mb-3">Select Truck Types:</p>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {getUniqueTruckTypes(trucks).map((type) => (
                          <label key={type} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedTruckTypes.includes(type)}
                              onChange={() => handleTruckTypeToggle(type)}
                              className="rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="text-sm text-gray-700">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-medium tracking-tight">
                  Price Range (per km)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 placeholder-gray-400 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 placeholder-gray-400 text-sm"
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-medium tracking-tight">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 text-sm"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            </div>

            {/* Additional Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Minimum Capacity */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-medium tracking-tight">
                  Minimum Capacity (tons)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 placeholder-gray-400 text-sm"
                />
              </div>

              {/* Availability Dates */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-medium tracking-tight">
                  Available From
                </label>
                <input
                  type="date"
                  value={availabilityDates.start}
                  onChange={(e) => setAvailabilityDates(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-medium tracking-tight">
                  Available Until
                </label>
                <input
                  type="date"
                  value={availabilityDates.end}
                  onChange={(e) => setAvailabilityDates(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Sort Results</h3>
            </div>
            <span className="text-sm text-gray-500">
              {filteredTrucks.length} trucks found
            </span>
          </div>
          
          <div className="mt-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={!!locationSearch}
              className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-gray-50 focus:bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-500 appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="near_location">Near Location</option>
              {locationSearch && (
                <option value="best_match">Best Match</option>
              )}
            </select>
            {locationSearch && (
              <p className="text-xs text-gray-500 mt-1">
                Auto-sorted by distance and best match algorithm
              </p>
            )}
          </div>
        </div>

        {/* Availability Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Availability</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={filterStatus === "all"}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mr-2 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm text-gray-700 font-medium">All Trucks</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="available"
                checked={filterStatus === "available"}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mr-2 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm text-gray-700 font-medium">Available Only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="unavailable"
                checked={filterStatus === "unavailable"}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mr-2 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm text-gray-700 font-medium">Unavailable Only</span>
            </label>
          </div>
        </div>

        {/* Truck Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{displayedTrucks.length}</span> of <span className="font-semibold text-gray-900">{sortedTrucks.length}</span> trucks
            </div>
            {(searchTerm || locationSearch || truckType || minCapacity || filterStatus !== "all") && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-slate-600 hover:text-slate-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Truck Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTrucks.map((truck) => (
            <TruckCard 
              key={truck._id} 
              truck={truck} 
              onBookNow={handleBookNow} 
              distance={truckDistances[truck._id]}
              showDistanceBadge={!!locationSearch}
            />
          ))}
        </div>

        {displayedTrucks.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trucks found</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search terms or filters" 
                : "No trucks are available at the moment"}
            </p>
            {(searchTerm || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setDisplayCount(displayCount + 6)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Load More Trucks
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Showing {displayedTrucks.length} of {filteredTrucks.length} trucks
            </p>
          </div>
        )}

        {/* Booking Modal */}
        {bookingModalOpen && selectedTruck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Book Truck</h2>
                  <button
                    onClick={handleCloseBookingModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    {selectedTruck.imageUrl ? (
                      <img
                        src={selectedTruck.imageUrl}
                        alt={selectedTruck.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-300 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedTruck.title}</h3>
                      <p className="text-sm text-gray-600">{selectedTruck.type} • {selectedTruck.capacityTons} tons</p>
                      <p className="text-sm font-medium text-gray-900">NPR {selectedTruck.ratePerKm}/km</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pickup Location *
                      </label>
                      <LocationSuggestions
                        value={bookingForm.pickup.address}
                        onChange={handleBookingFormChange}
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
                        value={bookingForm.dropoff.address}
                        onChange={handleBookingFormChange}
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
                        value={bookingForm.requiredCapacity}
                        onChange={handleBookingFormChange}
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Max capacity: {selectedTruck.capacityTons} tons
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
                        value={bookingForm.startTime}
                        onChange={handleBookingFormChange}
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
                        value={bookingForm.endTime}
                        onChange={handleBookingFormChange}
                        min={bookingForm.startTime || new Date().toISOString().slice(0, 16)}
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
                    <div className={`rounded-xl p-4 ${
                      !selectedTruck ? 'bg-blue-50 border border-blue-200' : 
                      conflictCheck.hasConflict ? 'bg-red-50 border border-red-200' : 
                      'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {!selectedTruck ? (
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

                  {/* Route Summary */}
                  {route && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <Route className="w-5 h-5 text-gray-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Route Summary</h4>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600 font-medium">Total Trip Distance</span>
                        <span className="text-xl font-bold text-gray-800">{route.distance} km</span>
                      </div>
                      
                      {/* Route Map */}
                      {route?.pickup?.lat && route?.dropoff?.lat && (
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
                      )}
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
                      value={bookingForm.notes}
                      onChange={handleBookingFormChange}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseBookingModal}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || (conflictCheck && conflictCheck.hasConflict)}
                      className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      {submitting ? (
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
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatItem = ({ label, value, isStatus = false, available = false, enhancedStatus = null }) => {
  const getStatusStyle = (statusType) => {
    switch (statusType) {
      case 'available':
        return "bg-white text-gray-900 border-gray-300";
      case 'booked':
        return "bg-gray-800 text-white border-transparent";
      case 'owner_off':
        return "bg-gray-700 text-white border-transparent";
      case 'pending':
        return "bg-gray-600 text-white border-transparent";
      case 'owner_busy':
      case 'busy':
      default:
        return "bg-gray-900 text-white border-transparent";
    }
  };

  return (
    <div className="text-center">
      <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-snug">
        {label}
      </p>
      {isStatus ? (
        <span className={`inline-flex items-center px-1.5 py-0.5 min-w-[44px] justify-center rounded-full text-[9px] sm:text-[10px] font-semibold border ${
          getStatusStyle(enhancedStatus?.statusType)
        }`}>
          {value}
        </span>
      ) : (
        <div className="text-[11px] font-bold text-slate-700 truncate leading-snug">{value}</div>
      )}
    </div>
  );
};

const TruckCard = ({ truck, onBookNow, distance, showDistanceBadge }) => {
  const [enhancedStatus, setEnhancedStatus] = useState(null);

  // Fetch enhanced status from API
  useEffect(() => {
    const fetchEnhancedStatus = async () => {
      try {
        const response = await axiosInstance.get(`/bookings/truck-status/${truck._id}`);
        setEnhancedStatus(response.data.data);
      } catch (error) {
        console.error("Error fetching enhanced status:", error);
        
        // Fallback to basic status
        const fallbackStatus = {
          status: truck.available ? "Available" : "Busy",
          statusType: truck.available ? "available" : "booked",
          available: truck.available
        };
        setEnhancedStatus(fallbackStatus);
      }
    };

    if (truck._id) {
      fetchEnhancedStatus();
    }
  }, [truck._id, truck.available]);

  // Use enhanced status from API or fallback
  const currentStatus = enhancedStatus || (truck.available ? 
    { status: 'Available', statusType: 'available' } : 
    { status: 'Busy', statusType: 'booked' });

  return (
    <div className="bg-white rounded-2xl border-0 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden group shadow-2xl relative">
      {/* Distance Badge - Top Right - Only show when location search is active */}
      {showDistanceBadge && distance !== undefined && distance !== null && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-white border border-gray-100 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 text-gray-900">
            <Route className="w-3 h-3 text-blue-500" />
            {distance} km away
          </div>
        </div>
      )}
      
      {/* Top Section - Truck Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-5 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Truck Image/Avatar */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-lg transition-all duration-200 hover:shadow-xl overflow-hidden">
              {truck.imageUrl ? (
                <img
                  src={truck.imageUrl}
                  alt={truck.title}
                  className="w-full h-full object-cover brightness-110 contrast-105"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400"
                style={{ display: truck.imageUrl ? "none" : "flex" }}
              >
                <svg
                  className="w-8 h-8 sm:w-9 sm:h-9 text-gray-700"
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
            {/* Verified Badge - Black Scalloped Star for Truck */}
            {truck.isVerified && (
              <div className="absolute -top-1 -right-1">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  aria-label="Verified Truck"
                >
                  {/* 12-pointed scalloped star badge - black color */}
                  <path
                    d="M12 2
                       L13.8 3.8
                       L16.2 3.2
                       L17.5 5.5
                       L20 6.2
                       L19.2 8.8
                       L21 11
                       L19.2 13.2
                       L20 15.8
                       L17.5 16.5
                       L16.2 18.8
                       L13.8 18.2
                       L12 20
                       L10.2 18.2
                       L7.8 18.8
                       L6.5 16.5
                       L4 15.8
                       L4.8 13.2
                       L3 11
                       L4.8 8.8
                       L4 6.2
                       L6.5 5.5
                       L7.8 3.2
                       L10.2 3.8
                       Z"
                    fill="#000000"
                  />
                  {/* Smaller check mark positioned lower */}
                  <path
                    d="M8.5 11.5
                       L10.5 13.5
                       L15 9"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Title and Location */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1 leading-snug line-clamp-2 tracking-tight">
              {truck.title || 'Unnamed Truck'}
            </h4>
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-4 h-4 text-gray-800 flex-shrink-0" />
              <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                {truck.location?.address ? truck.location.address.split(',')[0] : "Location not set"}
              </p>
            </div>
            {/* Rating Display */}
            {truck.averageRating > 0 && (
              <div className="flex items-center gap-1.5 mb-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(truck.averageRating) ? 'text-gray-900' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  {truck.averageRating.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-gray-700 leading-tight">
                  ({truck.totalReviews || 0})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Statistics */}
      <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-gray-100 bg-gradient-to-br from-white to-gray-50">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-1 text-center items-center justify-items-center w-full max-w-xs mx-auto">
          <StatItem 
            label={"TYPE"} 
            value={truck.type?.toUpperCase() || "N/A"} 
          />
          <StatItem 
            label={"STATUS"} 
            value={currentStatus.status?.toUpperCase() || 'BUSY'} 
            isStatus={true}
            available={currentStatus.available}
            enhancedStatus={currentStatus}
          />
          <StatItem 
            label={"CAPACITY"} 
            value={truck.capacityTons ? `${truck.capacityTons}T` : "N/A"} 
          />
        </div>

        {/* Truck Description */}
        {truck.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-700 font-bold line-clamp-2 leading-relaxed tracking-wide">
                {truck.description}
              </p>
          </div>
        )}

        {/* Enhanced Owner Section */}
        <div className="pt-1 border-t border-gray-100 w-full mt-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1 text-left leading-tight">
            Owner
          </p>
          <div className="flex items-center gap-1.5 text-left border border-gray-100 rounded-md p-1.5 bg-gray-50">
            {/* Owner Profile with Badges */}
            <div className="relative">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white shadow-md">
                {truck.owner?.profileImageUrl ? (
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
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {truck.owner?.name?.charAt(0)?.toUpperCase() || 'O'}
                    </span>
                  </div>
                )}
              </div>
              {/* Status Badge - Verified Only */}
              <div className="absolute -top-0.5 -right-0.5">
                {/* Verified Badge - Scalloped design - Show only if owner has verification badge */}
                {truck.owner?.verificationBadge && (
                  <VerifiedBadge size={12} />
                )}
              </div>
            </div>
            
            {/* Owner Details with Icons */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-700 truncate leading-tight mb-0.5">
                {truck.owner?.name || "Unknown"}
              </p>
              <div className="space-y-0.5">
                {truck.owner?.phone && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600">
                    <Phone className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{truck.owner.phone}</span>
                  </div>
                )}
                {truck.owner?.email && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600">
                    <Mail className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{truck.owner.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <Link
            to={`/trucks/${truck._id}`}
            className="flex-1 py-2 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium text-center leading-tight"
          >
            View Details
          </Link>
          <button
            onClick={() => onBookNow(truck)}
            disabled={!currentStatus.available}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors text-sm font-medium leading-tight ${
              currentStatus.available 
                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentStatus.available ? 'Book Now' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Trucks;