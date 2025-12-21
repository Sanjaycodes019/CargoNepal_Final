// Modern Icon Components
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

const CompletedIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const InTransitIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0l-2-2m2 2h2" />
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

const BookingStatsCards = ({ bookings }) => {
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    inTransit: bookings.filter((b) => b.status === "in_transit").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  if (bookings.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
          <BookingIcon className="w-5 h-5 text-gray-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Booking Overview
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ModernStatCard
          label="Total Bookings"
          value={stats.total}
          icon={<BookingIcon className="w-5 h-5" />}
        />
        <ModernStatCard
          label="Pending" 
          value={stats.pending}
          icon={<PendingIcon className="w-5 h-5" />}
        />
        <ModernStatCard
          label="Accepted" 
          value={stats.accepted}
          icon={<AcceptedIcon className="w-5 h-5" />}
        />
        <ModernStatCard
          label="In Transit"
          value={stats.inTransit}
          icon={<InTransitIcon className="w-5 h-5" />}
        />
        <ModernStatCard
          label="Completed"
          value={stats.completed}
          icon={<CompletedIcon className="w-5 h-5" />}
        />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, focusClass = 'text-gray-700 border-gray-300' }) => (
  // Base card styling remains clean white background with subtle border/shadow
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex items-center space-x-3 transition-shadow hover:shadow-md">
    
    {/* Icon Container: Uses focusClass for text and border color, background is light gray */}
    <div className={`flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border ${focusClass.split(' ')[1]}`}>
      <svg
        className={`w-4 h-4 ${focusClass.split(' ')[0]}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {icon}
      </svg>
    </div>

    {/* Text Block: Value is dark, label is muted */}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-gray-900 truncate">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </div>
);

export default BookingStatsCards;