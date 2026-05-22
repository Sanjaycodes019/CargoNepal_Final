import { useAdminData } from "../../hooks/useAdminData";
import BookingsList from "../../components/dashboard/admin/BookingsList";

const AdminBookings = () => {
  const { bookings, trucks, loading, error, refetch } = useAdminData();

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
          <h2 className="text-xl font-semibold mb-2">Error loading bookings</h2>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Bookings Management
                  </h1>
                  <p className="text-md text-gray-500 mt-1">
                    Manage and monitor all platform bookings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Bookings Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{bookings?.length || 0}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Bookings</p>
          </div>

          {/* Pending Bookings Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">
              {bookings?.filter(b => b.status === 'pending').length || 0}
            </p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Pending</p>
          </div>

          {/* Accepted Bookings Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">
              {bookings?.filter(b => b.status === 'accepted').length || 0}
            </p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Accepted</p>
          </div>

          {/* In Transit Bookings Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m3-1h1m1 1h1m-1 1v-3a1 1 0 011-1h2a1 1 0 011 1v3m-1 0h4" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">
              {bookings?.filter(b => b.status === 'in_transit').length || 0}
            </p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">In Transit</p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <BookingsList bookings={bookings} trucks={trucks} onRefetch={refetch} />
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
