import { useState, useCallback, useEffect } from "react";
import { useOwnerData } from "../hooks/useOwnerData";
import axiosInstance from "../utils/axiosInstance";
import { useUiFeedback } from "../context/UiFeedbackContext";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import TruckCard from "../components/dashboard/owner/TruckCard";
import TruckFormModal from "../components/shared/TruckFormModal";
import OwnerStats from "../components/dashboard/owner/OwnerStats";

const OwnerMyFleet = () => {
  // --- Hooks and State Management ---
  const { toast, confirm } = useUiFeedback();
  const { trucks, loading, refetch } = useOwnerData();

  // View States
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);

  // Search/Filter States
  const [truckSearchTerm, setTruckSearchTerm] = useState("");
  const [truckFilterStatus, setTruckFilterStatus] = useState("all");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const trucksPerPage = 10;

  // Truck Form State
  const initialTruckForm = {
    title: "",
    type: "",
    capacityTons: "",
    ratePerKm: "",
    available: true,
    description: "",
    locationString: "",
    image: null,
    imagePreview: null,
    removeImage: false,
  };
  const [truckForm, setTruckForm] = useState(initialTruckForm);

  // --- Handlers ---

  const handleTruckFormChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setTruckForm(prev => ({
        ...prev,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : null,
        removeImage: false, // Reset removeImage when new file is selected
      }));
    } else {
      setTruckForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  }, []);

  const handleRemoveImage = () => {
    setTruckForm(prev => ({
      ...prev,
      image: null,
      imagePreview: null,
      removeImage: true
    }));
  };

  const handleTruckFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    let isEditing = !!editingTruck;

    try {
      const form = new FormData();
      // Append data
      if (truckForm.title) form.append('title', truckForm.title);
      if (truckForm.type) form.append('type', truckForm.type);
      if (truckForm.capacityTons) form.append('capacityTons', truckForm.capacityTons);
      if (truckForm.ratePerKm) form.append('ratePerKm', truckForm.ratePerKm);
      form.append('available', truckForm.available);
      if (truckForm.description) form.append('description', truckForm.description);
      if (truckForm.locationString) form.append('locationString', truckForm.locationString);
      
      if (truckForm.image) {
        form.append('image', truckForm.image);
      }
      
      // Add removeImage flag for editing
      if (isEditing && truckForm.removeImage) {
        form.append('removeImage', 'true');
      }
      
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditing) {
        await axiosInstance.put(`/owner/trucks/${editingTruck._id}`, form, config);
        toast({
          type: "success",
          message: "Truck updated successfully",
        });
      } else {
        await axiosInstance.post("/owner/trucks", form, config);
        toast({
          type: "success",
          message: "Truck added successfully",
        });
      }
      
      // Reset form and refetch data
      setTruckForm(initialTruckForm);
      setShowTruckForm(false);
      setEditingTruck(null);
      refetch();
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to save truck",
      });
    }
  }, [truckForm, editingTruck, toast, refetch]);

  // Filter trucks
  const filteredTrucks = trucks.filter((truck) => {
    const matchesSearch =
      truck.title?.toLowerCase().includes(truckSearchTerm.toLowerCase()) ||
      truck.type?.toLowerCase().includes(truckSearchTerm.toLowerCase()) ||
      truck.location?.address?.toLowerCase().includes(truckSearchTerm.toLowerCase());
    
    const matchesStatus =
      truckFilterStatus === "all" ||
      (truckFilterStatus === "available" && truck.available) ||
      (truckFilterStatus === "unavailable" && !truck.available);
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastTruck = currentPage * trucksPerPage;
  const indexOfFirstTruck = indexOfLastTruck - trucksPerPage;
  const displayedTrucks = filteredTrucks.slice(indexOfFirstTruck, indexOfLastTruck);
  const totalPages = Math.ceil(filteredTrucks.length / trucksPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [truckSearchTerm, truckFilterStatus]);

  const handleToggleAvailability = async (truckId) => {
    try {
      // Get current truck to determine new availability
      const truck = trucks.find(t => t._id === truckId);
      const newAvailability = !truck.available;
      
      // Update truck availability directly
      await axiosInstance.put(`/owner/trucks/${truckId}`, { available: newAvailability });
      refetch();
      toast({
        type: "success",
        message: `Truck marked as ${newAvailability ? 'available' : 'busy'}`,
      });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to update truck availability",
      });
    }
  };

  const handleEditTruck = (truck) => {
    setEditingTruck(truck);
    setTruckForm({
      title: truck.title || "",
      type: truck.type || "",
      capacityTons: truck.capacityTons || "",
      ratePerKm: truck.ratePerKm || "",
      available: truck.available || true,
      description: truck.description || "",
      locationString: truck.location?.address || "",
      image: null,
      imagePreview: truck.imageUrl || null,
      removeImage: false,
    });
    setShowTruckForm(true);
  };

  const handleDeleteTruck = async (truckId) => {
    const ok = await confirm({
      title: "Delete Truck",
      message: "Are you sure you want to delete this truck? This action cannot be undone.",
      confirmText: "Delete Truck",
      cancelText: "Cancel",
    });

    if (!ok) return;

    try {
      await axiosInstance.delete(`/owner/trucks/${truckId}`);
      refetch();
      toast({
        type: "success",
        message: "Truck deleted successfully",
      });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to delete truck",
      });
    }
  };

  const resetTruckForm = () => {
    setTruckForm(initialTruckForm);
    setEditingTruck(null);
  };

  // Calculate stats
  const stats = {
    totalTrucks: trucks.length,
    availableTrucks: trucks.filter((t) => t.available).length,
    unavailableTrucks: trucks.filter((t) => !t.available).length,
  };

  if (loading) {
    return <LoadingSpinner message="Loading your fleet..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Enhanced Header */}
        <div className="mb-8 lg:mb-10">
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border border-gray-300/50 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    My Fleet
                  </h1>
                  <p className="text-md text-gray-600 mt-1">
                    Manage your truck fleet and availability
                  </p>
                </div>
              </div>
              
              {/* Enhanced Primary Action Button */}
              <button
                onClick={() => {
                  resetTruckForm();
                  setShowTruckForm(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 active:from-gray-900 active:to-gray-950 font-bold shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap text-sm focus:outline-none focus:ring-4 focus:ring-gray-400/50 transform hover:scale-105 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Truck
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <OwnerStats stats={stats} showBookings={false} />

        {/* Enhanced My Fleet Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300">
          {/* Enhanced Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-300/50 shadow-md transform transition-all duration-300 hover:scale-105">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">My Fleet</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {displayedTrucks.length} of {filteredTrucks.length} trucks
                  </p>
                </div>
              </div>
              
              {/* Enhanced Available Badge */}
              {stats.availableTrucks > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-gray-700">
                    {stats.availableTrucks} Available
                  </span>
                </div>
              )}
            </div>

            {/* Enhanced Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search trucks..."
                  value={truckSearchTerm}
                  onChange={(e) => setTruckSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-500 hover:from-gray-100 hover:to-gray-50 hover:border-gray-400 transition-all duration-300 placeholder-gray-500 shadow-sm hover:shadow-md"
                />
              </div>
              <select
                value={truckFilterStatus}
                onChange={(e) => setTruckFilterStatus(e.target.value)}
                className="px-4 py-3 text-sm border border-gray-300 rounded-xl bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-white focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-500 hover:from-gray-100 hover:to-gray-50 hover:border-gray-400 transition-all duration-300 appearance-none cursor-pointer shadow-sm hover:shadow-md [&_*]:text-gray-700 focus:[&_*]:text-gray-700 [&_*]:bg-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {/* Truck List / Empty State */}
          <div className="p-6">
            {filteredTrucks.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No trucks found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or filter settings.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {displayedTrucks.map((truck) => (
                    <TruckCard
                      key={truck._id}
                      truck={truck}
                      onToggleAvailability={handleToggleAvailability}
                      onEdit={handleEditTruck}
                      onDelete={handleDeleteTruck}
                    />
                  ))}
                </div>
                
                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 font-medium">
                        Showing {indexOfFirstTruck + 1} to {Math.min(indexOfLastTruck, filteredTrucks.length)} of {filteredTrucks.length} trucks
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                            currentPage === 1 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                              : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                          }`}
                        >
                          Previous
                        </button>
                        
                        {/* Enhanced Page numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => paginate(pageNumber)}
                                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                                  currentPage === pageNumber
                                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                            currentPage === totalPages 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                              : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Truck Form Modal */}
        {showTruckForm && (
          <TruckFormModal
            isOpen={showTruckForm}
            onClose={() => {
              setShowTruckForm(false);
              resetTruckForm();
            }}
            onSubmit={handleTruckFormSubmit}
            formData={truckForm}
            onChange={handleTruckFormChange}
            editingTruck={editingTruck}
            isAdmin={false}
            onRemoveImage={handleRemoveImage}
          />
        )}
      </div>
    </div>
  );
};

export default OwnerMyFleet;
