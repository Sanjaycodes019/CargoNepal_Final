import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const BookingMap = ({ pickup, dropoff, distance, onRouteCalculated }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [lastProcessedCoords, setLastProcessedCoords] = useState(null);

  // Fetch real route from OSRM
  const fetchRoute = async (pickupCoords, dropoffCoords) => {
    setRouteLoading(true);
    setRouteError(null);
    
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropoffCoords.lng},${dropoffCoords.lat}?overview=full&geometries=geojson&steps=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return data.routes[0];
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Route fetch error:', error);
      setRouteError('Unable to calculate driving route. Showing direct line.');
      return null;
    } finally {
      setRouteLoading(false);
    }
  };

  // Calculate Haversine distance as fallback
  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    // Check if we have valid coordinates
    const hasValidPickup = pickup && typeof pickup.lat === 'number' && typeof pickup.lng === 'number';
    const hasValidDropoff = dropoff && typeof dropoff.lat === 'number' && typeof dropoff.lng === 'number';
    
    if (!mapRef.current || !hasValidPickup || !hasValidDropoff) return;

    // Create a unique key for the current coordinates to detect actual changes
    const currentCoordsKey = `${pickup.lat},${pickup.lng}-${dropoff.lat},${dropoff.lng}`;
    
    // Skip if coordinates haven't actually changed
    if (lastProcessedCoords === currentCoordsKey) return;
    
    // Update the last processed coordinates
    setLastProcessedCoords(currentCoordsKey);

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2],
        10
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers and lines
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add pickup marker
    const pickupMarker = L.marker([pickup.lat, pickup.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(mapInstanceRef.current);
    pickupMarker.bindPopup('<b>Pickup</b><br>' + (pickup.address || 'Pickup Location')).openPopup();

    // Add dropoff marker
    const dropoffMarker = L.marker([dropoff.lat, dropoff.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(mapInstanceRef.current);
    dropoffMarker.bindPopup('<b>Dropoff</b><br>' + (dropoff.address || 'Dropoff Location'));

    // Fetch and display route
    const addRouteToMap = async () => {
      const route = await fetchRoute(pickup, dropoff);
      
      if (route && route.geometry) {
        // Draw the actual route path
        const routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
        
        const routeLine = L.polyline(routeCoordinates, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(mapInstanceRef.current);
        
        // Fit map to show route
        const group = new L.FeatureGroup([pickupMarker, dropoffMarker, routeLine]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
        
        // Calculate actual route distance and pass to parent
        const routeDistanceKm = (route.distance / 1000).toFixed(2);
        const routeDurationMinutes = Math.round(route.duration / 60);
        
        console.log(`Route distance: ${routeDistanceKm} km, Duration: ${routeDurationMinutes} minutes`);
        
        // Pass route data back to parent component
        if (onRouteCalculated) {
          onRouteCalculated({
            distance: parseFloat(routeDistanceKm),
            duration: routeDurationMinutes,
            isRouteDistance: true,
            routeData: route
          });
        }
      } else {
        // Fallback to direct line if routing fails
        const directLine = L.polyline(
          [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
          { color: '#ef4444', weight: 3, opacity: 0.7, dashArray: '10, 10' }
        ).addTo(mapInstanceRef.current);
        
        const group = new L.FeatureGroup([pickupMarker, dropoffMarker, directLine]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
        
        // Calculate fallback Haversine distance
        const fallbackDistance = haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        
        // Pass fallback data back to parent
        if (onRouteCalculated) {
          onRouteCalculated({
            distance: parseFloat(fallbackDistance.toFixed(2)),
            duration: null,
            isRouteDistance: false,
            routeData: null
          });
        }
      }
    };
    
    addRouteToMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });
      }
    };
  }, [pickup, dropoff, lastProcessedCoords]);

  // Check if we have valid coordinates
  const hasValidPickup = pickup && typeof pickup.lat === 'number' && typeof pickup.lng === 'number';
  const hasValidDropoff = dropoff && typeof dropoff.lat === 'number' && typeof dropoff.lng === 'number';

  if (!hasValidPickup || !hasValidDropoff) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">
            {pickup?.address && dropoff?.address 
              ? "Calculating route coordinates..." 
              : "Enter pickup and dropoff locations to see map"}
          </p>
          {!hasValidPickup && pickup?.address && (
            <p className="text-xs text-orange-600">Finding coordinates for: {pickup.address}</p>
          )}
          {!hasValidDropoff && dropoff?.address && (
            <p className="text-xs text-orange-600">Finding coordinates for: {dropoff.address}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-gray-700">Route Preview</h4>
        <div className="flex items-center space-x-2">
          {routeLoading && (
            <div className="flex items-center text-xs text-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              Calculating route...
            </div>
          )}
          {distance && (
            <span className="text-sm text-indigo-600 font-medium">{distance} km</span>
          )}
        </div>
      </div>
      <div ref={mapRef} className="h-64 rounded-lg border border-gray-300 relative z-10" style={{ zIndex: 1 }} />
      <div className="mt-2 flex items-center justify-center space-x-6 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Pickup</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Dropoff</span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-blue-500 mr-2"></div>
          <span>Driving Route</span>
        </div>
        {routeError && (
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-red-500 mr-2" style={{borderStyle: 'dashed'}}></div>
            <span className="text-orange-600">Direct Line</span>
          </div>
        )}
      </div>
      {routeError && (
        <div className="mt-2 text-xs text-orange-600 text-center">
          {routeError}
        </div>
      )}
    </div>
  );
};

export default BookingMap;

