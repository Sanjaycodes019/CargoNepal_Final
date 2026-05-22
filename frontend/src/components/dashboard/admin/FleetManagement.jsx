import { useState } from "react";
import { MapPin, Phone, Mail, CheckCircle, Activity } from "lucide-react";
import TruckFormModal from "../../shared/TruckFormModal";
import axiosInstance from "../../../utils/axiosInstance";
import { useUiFeedback } from "../../../context/UiFeedbackContext";
import VerifiedBadge from "../../../components/shared/VerifiedBadge";

const FleetManagement = ({ trucks, onRefetch }) => {
  // Debug: Log truck data to verify isVerified field
  console.log('FleetManagement - Trucks data:', trucks);
  if (trucks && trucks.length > 0) {
    console.log('FleetManagement - First truck structure:', trucks[0]);
    console.log('FleetManagement - First truck isVerified:', trucks[0].isVerified);
  }
  const { toast, confirm } = useUiFeedback();
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [displayCount, setDisplayCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVerification, setFilterVerification] = useState("all");

  const handleTruckClick = (truck) => {
    setSelectedTruck(truck);
    setEditForm({
      title: truck.title || "",
      type: truck.type || "",
      capacityTons: truck.capacityTons || "",
      ratePerKm: truck.ratePerKm || "",
      description: truck.description || "",
      locationString: truck.location?.address || "",
      image: null,
      imagePreview: truck.imageUrl ? truck.imageUrl : null,
      isVerified: truck.isVerified || false,
    });
  };

  const handleCloseModal = () => {
    setSelectedTruck(null);
    setEditForm({});
  };

  const handleSaveEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const originalVerificationStatus = selectedTruck.isVerified;
      const newVerificationStatus = editForm.isVerified;

      const form = new FormData();
      if (editForm.title) form.append('title', editForm.title);
      if (editForm.type) form.append('type', editForm.type);
      if (editForm.capacityTons) form.append('capacityTons', editForm.capacityTons);
      if (editForm.ratePerKm) form.append('ratePerKm', editForm.ratePerKm);
      form.append('available', editForm.available);
      if (editForm.description) form.append('description', editForm.description);
      if (editForm.locationString) form.append('locationString', editForm.locationString);
      
      // Only append image if a new one is selected
      if (editForm.image && editForm.image instanceof File) {
        form.append('image', editForm.image);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      await axiosInstance.put(`/admin/truck/${selectedTruck._id}`, form, config);

      // Update verification status if changed
      if (originalVerificationStatus !== newVerificationStatus) {
        await axiosInstance.put(`/admin/verify-truck/${selectedTruck._id}`, {
          isVerified: newVerificationStatus
        });
      }

      if (onRefetch) onRefetch();
      handleCloseModal();
      toast({ type: "success", message: "Truck updated successfully" });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to update truck",
      });
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete truck",
      message: "Are you sure you want to delete this truck?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!ok) {
      return;
    }
    try {
      await axiosInstance.delete(`/admin/truck/${selectedTruck._id}`);
      if (onRefetch) onRefetch();
      handleCloseModal();
      toast({ type: "success", message: "Truck deleted successfully" });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to delete truck",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files && files[0] ? files[0] : null;
      
      if (file) {
        setEditForm(prev => ({
          ...prev,
          image: file,
          imagePreview: URL.createObjectURL(file),
        }));
      } else {
        setEditForm(prev => ({
          ...prev,
          image: null,
          imagePreview: null,
        }));
      }
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Filter and search
  const filteredTrucks = trucks.filter((truck) => {
    const matchesSearch =
      truck.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.location?.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "available" && truck.available) ||
      (filterStatus === "unavailable" && !truck.available);

    const matchesVerification =
      filterVerification === "all" ||
      (filterVerification === "verified" && truck.isVerified) ||
      (filterVerification === "unverified" && !truck.isVerified);

    return matchesSearch && matchesFilter && matchesVerification;
  });

  const displayedTrucks = filteredTrucks.slice(0, displayCount);
  const hasMore = filteredTrucks.length > displayCount;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search by title, type, owner, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {displayedTrucks.map((truck) => (
          <TruckCard key={truck._id} truck={truck} onClick={() => handleTruckClick(truck)} />
        ))}
      </div>

      {displayedTrucks.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-600">No vehicles found</p>
        </div>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setDisplayCount(displayCount + 5)}
            className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-900 text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95"
          >
            See More
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTruck && (
        <TruckFormModal
          isOpen={!!selectedTruck}
          onClose={handleCloseModal}
          onSubmit={handleSaveEdit}
          formData={editForm}
          onChange={handleInputChange}
          editingTruck={selectedTruck}
          isAdmin={true}
        />
      )}
    </div>
  );
};

const TruckCard = ({ truck, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden group shadow-lg"
    >
      {/* Top Section - Truck Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-5 py-4 sm:py-5 border-b border-gray-200">
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
                  className="w-8 h-8 sm:w-9 sm:h-9 text-gray-600"
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
            {/* Verified Badge - Black Scalloped Star for Truck - Show only if truck is verified */}
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
  <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1 leading-snug line-clamp-2">
  {truck.title}
</h4>
<div className="flex items-center gap-1 mb-2">
  <MapPin className="w-4 h-4 text-gray-700 flex-shrink-0" />
  <p className="text-sm font-medium text-gray-700 truncate">
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
          className={`w-4 h-4 ${i < Math.round(truck.averageRating) ? 'text-gray-800' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-sm font-bold text-gray-800">
      {truck.averageRating.toFixed(1)}
    </span>
    <span className="text-sm font-medium text-gray-600">
      ({truck.totalReviews || 0})
    </span>
  </div>
)}
</div>
        </div>
      </div>

      {/* Bottom Section - Statistics */}
      <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-gray-200 bg-gradient-to-br from-white to-gray-50">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-1 text-center items-center justify-items-center w-full max-w-xs mx-auto">
  <StatItem 
    label={"TYPE"} 
    value={truck.type?.toUpperCase() || "N/A"} 
  />
  <StatItem 
    label={"STATUS"} 
    value={truck.enhancedStatus?.status || (truck.available ? "AVAILABLE" : "BUSY")} 
    isStatus={true}
    available={truck.available}
    enhancedStatus={truck.enhancedStatus}
  />
  <StatItem 
    label={"CAPACITY"} 
    value={truck.capacityTons ? `${truck.capacityTons}T` : "N/A"} 
  />
</div>

{/* Truck Description */}
{truck.description && (
  <div className="mt-3 pt-3 border-t border-gray-200">
    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
      {truck.description}
    </p>
  </div>
)}
{/* Enhanced Owner Section */}
<div className="pt-1 border-t border-slate-200 w-full mt-1">
  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-left">
    Owner
  </p>
  <div className="flex items-center gap-1.5 text-left border border-slate-100 rounded-md p-1.5 bg-slate-50">
    {/* Owner Profile with Badges */}
    <div className="relative">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white shadow-sm">
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
      </div>
    </div>
  );
};

const StatItem = ({ label, value, isStatus = false, available = false, enhancedStatus = null }) => (
  <div className="text-center">
    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-snug">
      {label}
    </p>
    {isStatus ? (
      <span className={`inline-flex items-center px-1.5 py-0.5 min-w-[44px] justify-center rounded-full text-[9px] sm:text-[10px] font-semibold ${
        enhancedStatus?.statusType === 'available' 
          ? "bg-white text-gray-900 border-gray-300" 
          : "bg-gray-900 text-white border-transparent"
      }`}>
        {value}
      </span>
    ) : (
      <div className="text-[11px] font-bold text-slate-700 truncate leading-snug">{value}</div>
    )}
  </div>
);

const TruckDetailModal = ({ truck, editForm, onInputChange, onSave, onDelete, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Truck" : "Truck Details"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl font-bold w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 lg:p-10">
          {isEditing ? (
            <EditTruckForm
              truck={truck}
              editForm={editForm}
              onInputChange={onInputChange}
              onSave={() => {
                onSave();
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <TruckDetailsView truck={truck} onEdit={() => setIsEditing(true)} onDelete={onDelete} />
          )}
        </div>
      </div>
    </div>
  );
};

const TruckDetailsView = ({ truck, onEdit, onDelete }) => {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Profile Header - Enhanced */}
      <div className="relative bg-white rounded-2xl p-5 sm:p-7 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Truck Image - Enhanced */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-200 flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden">
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
                className="w-full h-full flex items-center justify-center bg-gray-200"
                style={{ display: truck.imageUrl ? "none" : "flex" }}
              >
                <svg
                  className="w-12 h-12 text-gray-500"
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
            {truck.available && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-black rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Name and Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mb-2">
              <h4 className="text-2xl sm:text-3xl font-bold text-gray-900">{truck.title || "Truck"}</h4>
            </div>
            <p className="text-sm sm:text-base text-gray-600 break-all mb-3">
              {truck.location?.address || "Location not specified"}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  truck.available
                    ? "bg-black text-white border border-black"
                    : "bg-white text-gray-900 border border-gray-300"
                }`}
              >
                {truck.available ? "Available" : "Unavailable"}
              </span>
              {truck.type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                  {truck.type}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Truck Details Section */}
      <div className="bg-gray-50 rounded-2xl p-5 sm:p-7 border border-gray-200">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">
          Truck Details
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <DetailField label="Title" value={truck.title || "Not specified"} />
          <DetailField label="Type" value={truck.type || "Not specified"} />
          <DetailField label="Owner" value={truck.owner?.name || "Unknown"} />
          <DetailField label="Location" value={truck.location?.address || "Not specified"} />
          <DetailField
            label="Capacity"
            value={truck.capacityTons ? `${truck.capacityTons} tons` : "Not specified"}
          />
          <DetailField label="Rate per KM" value={`₹${truck.ratePerKm || "N/A"}`} />
          {truck.description && (
            <div className="md:col-span-2">
              <DetailField label="Description" value={truck.description} />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="flex-1 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-900 text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95"
        >
          Edit Truck
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-5 py-3 bg-white text-black rounded-xl border border-black hover:bg-black hover:text-white text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95"
        >
          Delete Truck
        </button>
      </div>
    </div>
  );
};

const EditTruckForm = ({ truck, editForm, onInputChange, onSave, onCancel }) => {
  return (
    <div className="space-y-6">
      {/* Truck Image Preview */}
      {editForm.imageUrl && (
        <div className="relative h-48 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
          <img
            src={editForm.imageUrl}
            alt="Truck preview"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <FormField
          label="Title"
          name="title"
          value={editForm.title}
          onChange={onInputChange}
        />
        <FormField label="Type" name="type" value={editForm.type} onChange={onInputChange} />
        <FormField
          label="Location"
          name="locationString"
          value={editForm.locationString}
          onChange={onInputChange}
          placeholder="Enter location address"
        />
        <FormField
          label="Capacity (Tons)"
          name="capacityTons"
          type="number"
          value={editForm.capacityTons}
          onChange={onInputChange}
        />
        <FormField
          label="Rate per KM (₹)"
          name="ratePerKm"
          type="number"
          value={editForm.ratePerKm}
          onChange={onInputChange}
        />
        <FormField
          label="Image URL"
          name="imageUrl"
          type="url"
          value={editForm.imageUrl}
          onChange={onInputChange}
          placeholder="https://example.com/truck.jpg"
        />
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={editForm.description}
            onChange={onInputChange}
            rows="4"
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white transition resize-none"
          />
        </div>
              </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onSave}
          className="flex-1 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-900 text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-5 py-3 border border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const DetailField = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-gray-900 font-medium break-words leading-relaxed">{value}</p>
  </div>
);

const FormField = ({ label, name, type = "text", value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white transition"
    />
  </div>
);

export default FleetManagement;
