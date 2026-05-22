const StatsOverview = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Platform Statistics Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Platform Overview
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-50 rounded-lg mb-3">
              <div className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalUsers}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Users</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-50 rounded-lg mb-3">
              <div className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalTrucks}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Fleet Size</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-50 rounded-lg mb-3">
              <div className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalBookings}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Bookings</p>
          </div>
        </div>
      </div>

      {/* Booking Status Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Booking Status
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-50 rounded-lg mb-3">
              <div className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.pendingBookings}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Pending</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-50 rounded-lg mb-3">
              <div className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.activeBookings}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Active</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-50 rounded-lg mb-3">
              <div className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4-4a2 2 0 104 0" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.inTransitBookings || 0}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">In Transit</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-50 rounded-lg mb-3">
              <div className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalBookings - stats.pendingBookings - stats.activeBookings}+</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;

