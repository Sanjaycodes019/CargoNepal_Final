import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const LocationSuggestions = ({ 
  value, 
  onChange, 
  placeholder, 
  name,
  className = '',
  required = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const nominatimUrl = `${import.meta.env.VITE_NOMINATIM_API_URL}?format=json&q=${encodeURIComponent(query)}&countrycodes=NP&limit=5&addressdetails=1`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'CargoNepal/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Location search failed');
      }

      const data = await response.json();
      
      const formattedSuggestions = data.map(item => ({
        display_name: item.display_name,
        address: item.display_name.split(',').slice(0, 2).join(','),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village || '',
        district: item.address?.state_district || item.address?.state || ''
      })).filter(item => item.address);

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Create a synthetic event that matches the parent's expected format
    const syntheticEvent = {
      target: {
        name,
        value: inputValue
      }
    };
    
    onChange(syntheticEvent);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    const syntheticEvent = {
      target: {
        name,
        value: suggestion.address
      }
    };
    onChange(syntheticEvent);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 hover:bg-gray-100 hover:border-gray-300 transition-all ${className}`}
          required={required}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
        {!loading && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <MapPin className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.address}
                  </div>
                  {suggestion.city && suggestion.district && (
                    <div className="text-xs text-gray-500">
                      {suggestion.city}, {suggestion.district}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && value && value.length >= 2 && !loading && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500 text-sm">
            No locations found in Nepal. Try searching for major cities like Kathmandu, Pokhara, etc.
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSuggestions;