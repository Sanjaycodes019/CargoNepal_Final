import { useAdminData } from "../../hooks/useAdminData";
import StatsOverview from "../../components/dashboard/admin/StatsOverview";

const AdminOverview = () => {
  const { stats, loading, error } = useAdminData();

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
          <h2 className="text-xl font-semibold mb-2">Error loading overview</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-1.5 sm:mb-2">
            Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Platform statistics and booking status overview
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={stats} />
      </div>
    </div>
  );
};

export default AdminOverview;
