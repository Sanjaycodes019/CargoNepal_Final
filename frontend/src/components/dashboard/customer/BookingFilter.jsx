const BookingFilter = ({ statusFilter, onFilterChange, totalCount, filteredCount }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filter:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white text-sm"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">{filteredCount}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalCount}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingFilter;

