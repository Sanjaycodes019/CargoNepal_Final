import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import VerifiedBadge from '../../shared/VerifiedBadge';

const TruckCard = ({ truck, onToggleAvailability, onEdit, onDelete }) => {
  const locationName = truck.location?.address ? truck.location.address.split(",")[0] : "Location N/A";
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const averageRating = calculateAverageRating(reviews);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/reviews/truck/${truck._id}`);
        setReviews(response.data.data || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    if (truck._id) fetchReviews();
  }, [truck._id]);

  return (
    <div 
      className="bg-white rounded-xl border-0 hover:border-0 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 w-full max-w-lg cursor-pointer overflow-hidden group shadow-2xl"
      onClick={() => navigate(`/trucks/${truck._id}`)}
    >
      {/* Top Identity Section */}
      <div className="p-5 flex gap-4">
        {/* Profile Image Container */}
        <div className="flex-shrink-0 relative">
          <div className="w-28 h-28 rounded-full bg-gray-50 border-2 border-gray-100 relative shadow-md overflow-hidden">
            {truck.imageUrl ? (
              <img
                src={truck.imageUrl}
                alt={truck.title}
                className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full"
              style={{ display: truck.imageUrl ? "none" : "flex" }}
            >
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9" />
              </svg>
            </div>
          </div>
          
          {/* Verified Badge - Anchored to Image Only */}
          {truck.isVerified && (
            <div className="absolute -top-1 -right-1 drop-shadow-sm">
              <VerifiedBadge size={23} color="#000000" />
            </div>
          )}
        </div>

        {/* Core Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold text-gray-900 truncate leading-tight">
                {truck.title || "Unknown Truck"}
              </h3>
              <div className="mt-1">
                <span className="text-[10px] font-medium text-gray-400 tracking-tight uppercase">
                  #{truck._id?.slice(-6)?.toUpperCase() || "ID"}
                </span>
              </div>
            </div>
            
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
              truck.enhancedStatus?.statusType === 'available' 
                ? "bg-white text-gray-700 border-gray-200"
                : "bg-gray-900 text-white border-transparent"
            }`}>
              {truck.enhancedStatus?.status || (truck.available ? "Available" : "Busy")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" />
            </svg>
            <span className="text-xs font-bold text-gray-900">{truck.type || "Container Body"}</span>
          </div>

          {/* Black & White Rating Stars */}
          {averageRating && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-3.5 h-3.5 ${i < Math.floor(averageRating) ? 'text-gray-900 fill-current' : 'text-gray-200'}`} 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-900 ml-0.5">{averageRating}</span>
              <span className="text-[10px] text-gray-500">({reviews.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Divider Section */}
      <div className="px-5 py-3.5 bg-gray-50/70 border-y border-gray-100 grid grid-cols-3 gap-2">
        <StatCell value={`${truck.capacityTons || 0}T`} label="Capacity" />
        <StatCell value={`₹${truck.ratePerKm || 0}`} label="Rate /km" />
        <StatCell value={locationName} label="Base" />
      </div>

      {/* Description */}
      {truck.description && (
        <div className="px-5 py-4">
          <p className="text-xs text-gray-600 font-bold leading-relaxed line-clamp-2">
            {truck.description}
          </p>
        </div>
      )}

      {/* Actions Footer */}
      <div className="px-5 py-3.5 flex items-center justify-between border-t border-gray-100 bg-white" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(truck._id);
          }}
          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(truck)}
            className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleAvailability(truck._id)}
            className="px-4 py-1.5 text-xs font-bold text-white bg-gray-900 rounded-lg hover:bg-black transition-colors"
          >
            {truck.available ? "Mark Busy" : "Mark Available"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCell = ({ value, label }) => (
  <div className="min-w-0">
    <p className="text-[13px] font-bold text-gray-900 truncate">{value}</p>
    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider truncate">{label}</p>
  </div>
);

export default TruckCard;