// Modern Icon Components
const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0m-2 0l-2-2m2 2h2" />
  </svg>
);

const AvailableIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BusyIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookingIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PendingIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AcceptedIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TransitIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4-4a2 2 0 104 0" />
  </svg>
);

const CompletedIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Monochromatic color configurations
const colorConfig = {
  default: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'text-gray-600',
    value: 'text-gray-800'
  }
};

const ModernStatCard = ({ label, value, icon }) => {
  const colors = colorConfig.default;
  
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer`}>
      <div className={`inline-flex p-2 ${colors.bg} rounded-lg mb-3`}>
        <div className={colors.icon}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${colors.value} mb-1`}>{value}</p>
      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
};

const OwnerStats = ({ stats, showBookings = true }) => {
  // Debug logging for props
  console.log('OwnerStats received stats:', stats);
  console.log('OwnerStats inTransitBookings value:', stats?.inTransitBookings);
  
  return (
    <div className="space-y-6">
      {/* Fleet Overview - Modern Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
            <TruckIcon className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Fleet Overview
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ModernStatCard
            label="Total Trucks"
            value={stats.totalTrucks}
            icon={<TruckIcon className="w-5 h-5" />}
          />
          <ModernStatCard
            label="Available"
            value={stats.availableTrucks}
            icon={<AvailableIcon className="w-5 h-5" />}
          />
          <ModernStatCard
            label="Busy"
            value={stats.unavailableTrucks}
            icon={<BusyIcon className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Booking Status - Modern Card */}
      {showBookings && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
              <BookingIcon className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Booking Status
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ModernStatCard
              label="Pending" 
              value={stats.pendingBookings || 0}
              icon={<PendingIcon className="w-5 h-5" />}
            />
            <ModernStatCard
              label="Accepted" 
              value={stats.acceptedBookings || 0}
              icon={<AcceptedIcon className="w-5 h-5" />}
            />
            <ModernStatCard
              label="In Transit" 
              value={stats.inTransitBookings || 0}
              icon={<TransitIcon className="w-5 h-5" />}
            />
            <ModernStatCard
              label="Completed"
              value={stats.completedBookings || 0}
              icon={<CompletedIcon className="w-5 h-5" />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerStats;

