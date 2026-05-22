import { useState } from "react";
import { useAdminData } from "../../hooks/useAdminData";
import AnalyticsCharts from "../../components/dashboard/admin/AnalyticsCharts";

const AdminAnalytics = () => {
  const { analytics, loading, error, refetch } = useAdminData();
  const [timeRange, setTimeRange] = useState('7days');

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
          <h2 className="text-xl font-semibold mb-2">Error loading analytics</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-1.5 sm:mb-2">
            Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Comprehensive insights into platform performance and user activity
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-black">Time Range</h3>
            <div className="flex gap-2">
              {['7days', '30days', '90days', '1year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === '7days' && 'Last 7 Days'}
                  {range === '30days' && 'Last 30 Days'}
                  {range === '90days' && 'Last 90 Days'}
                  {range === '1year' && 'Last Year'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts analytics={analytics} timeRange={timeRange} />
      </div>
    </div>
  );
};

export default AdminAnalytics;
