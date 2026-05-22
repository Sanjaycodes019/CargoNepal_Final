import { useAdminData } from "../../hooks/useAdminData";
import FleetManagement from "../../components/dashboard/admin/FleetManagement";
import { useState, useEffect } from "react";

const AdminFleet = () => {
  const { trucks, loading, error, refetch } = useAdminData();
  const [stats, setStats] = useState({
    totalTrucks: 0,
    availableTrucks: 0,
    unavailableTrucks: 0,
    verifiedTrucks: 0,
    unverifiedTrucks: 0,
    totalCapacity: 0,
  });

  // Calculate stats whenever trucks data changes
  useEffect(() => {
    if (trucks) {
      const truckList = trucks || [];
      
      setStats({
        totalTrucks: truckList.length,
        availableTrucks: truckList.filter(truck => truck.available).length,
        unavailableTrucks: truckList.filter(truck => !truck.available).length,
        verifiedTrucks: truckList.filter(truck => truck.isVerified).length,
        unverifiedTrucks: truckList.filter(truck => !truck.isVerified).length,
        totalCapacity: truckList.reduce((total, truck) => total + (truck.capacityTons || 0), 0),
      });
    }
  }, [trucks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading fleet</h2>
          <p>{error}</p>
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
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Fleet Management
                  </h1>
                  <p className="text-md text-gray-500 mt-1">
                    Manage and monitor all trucks in the platform fleet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Trucks Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalTrucks}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Trucks</p>
          </div>

          {/* Available Trucks Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.availableTrucks}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Available</p>
          </div>

          {/* Verified Trucks Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 012.212 2.212 3.42 3.42 0 01.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 01-.806 1.946 3.42 3.42 0 01-2.212 2.212 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-2.212-2.212 3.42 3.42 0 01-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 01.806-1.946 3.42 3.42 0 012.212-2.212z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.verifiedTrucks}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Verified Trucks</p>
          </div>

          {/* Unverified Trucks Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.unverifiedTrucks}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Unverified Trucks</p>
          </div>
        </div>

        {/* Fleet Management */}
        <FleetManagement trucks={trucks} onRefetch={refetch} />
      </div>
    </div>
  );
};

export default AdminFleet;
