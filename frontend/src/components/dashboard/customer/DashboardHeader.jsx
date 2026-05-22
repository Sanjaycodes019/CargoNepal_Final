const DashboardHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
            My Bookings
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Track and manage your cargo transportation
          </p>
        </div>
        <a
          href="/customer/new-booking"
          className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all text-sm sm:text-base whitespace-nowrap"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Booking
        </a>
      </div>
    </div>
  );
};

export default DashboardHeader;

