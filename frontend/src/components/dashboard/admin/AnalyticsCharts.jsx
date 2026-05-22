import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import VerifiedBadge from "../../../components/shared/VerifiedBadge";

const AnalyticsCharts = ({ analytics }) => {
  if (!analytics) return null;

  const COLORS = ["#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#f3f4f6", "#f9fafb"];

  const pieData = analytics.bookingsByStatus?.map((item) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1).replace("_", " "),
    value: item.count,
  })) || [];

  const monthData =
    analytics.bookingsByMonth
      ?.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        monthKey: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        bookings: item.count,
      }))
      .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year)) || [];

  const recentMonthData = monthData.slice(-6);
  const maxMonthly = Math.max(1, ...recentMonthData.map((m) => m.bookings || 0));

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Analytics</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 overflow-hidden">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Booking Status Distribution
          </h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={250} minWidth={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    isMobile
                      ? `${(percent * 100).toFixed(0)}%`
                      : `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={isMobile ? 70 : 80}
                  fill="#9ca3af"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: isMobile ? "12px" : "14px",
                    padding: "8px",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: isMobile ? "10px" : "12px",
                    paddingTop: "10px",
                  }}
                  iconSize={isMobile ? 8 : 10}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
              Monthly Bookings
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Last {recentMonthData.length} months</span>
            </div>
          </div>
          
          {recentMonthData.length === 0 ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-gray-500">No monthly booking data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMonthData.map((m, index) => {
                const percentage = Math.round(((m.bookings || 0) / maxMonthly) * 100);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const [year, month] = m.monthKey.split('-');
                const monthName = monthNames[parseInt(month) - 1];
                const shortYear = year.slice(-2);
                
                return (
                  <div key={m.monthKey} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-16 sm:w-20 flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-700">
                          {monthName} {shortYear}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full transition-all duration-500 ease-out group-hover:from-gray-600 group-hover:to-gray-800"
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                          </div>
                          {percentage > 10 && (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-16 text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{m.bookings}</p>
                        <p className="text-xs text-gray-500">
                          {m.bookings === 1 ? 'booking' : 'bookings'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-medium">Total Bookings</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {recentMonthData.reduce((sum, m) => sum + (m.bookings || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {Math.round(recentMonthData.reduce((sum, m) => sum + (m.bookings || 0), 0) / recentMonthData.length)} per month
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Fleet Owners */}
      {analytics.trucksPerOwner && analytics.trucksPerOwner.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 overflow-hidden">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Top Fleet Owners
          </h3>
          <div className="space-y-3">
            {analytics.trucksPerOwner.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Profile Picture with Verified Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                      {item._id?.profileImageUrl ? (
                        <img
                          src={item._id.profileImageUrl}
                          alt={item._id?.name || "Owner"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ display: item._id?.profileImageUrl ? 'none' : 'flex' }}
                      >
                        <span className="text-gray-700 font-bold text-sm">
                          {(item._id?.name || "O").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {/* Verified Badge - Scalloped design */}
                    {item._id?.verificationBadge && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerifiedBadge size={16} />
                      </div>
                    )}
                  </div>
                  
                  {/* Owner Name */}
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base truncate block">
                      {item._id?.name || "Unknown"}
                    </span>
                    {item._id?.companyName && (
                      <span className="text-xs text-gray-500 truncate block">
                        {item._id.companyName}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Truck Count Badge */}
                <span className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0">
                  {item.count} {item.count === 1 ? "truck" : "trucks"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Customers */}
      {analytics.bookingsPerCustomer && analytics.bookingsPerCustomer.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 overflow-hidden">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Top Customers by Bookings
          </h3>
          <div className="space-y-3">
            {analytics.bookingsPerCustomer.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Profile Picture with Verified Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                      {item._id?.profileImageUrl ? (
                        <img
                          src={item._id.profileImageUrl}
                          alt={item._id?.name || "Customer"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ display: item._id?.profileImageUrl ? 'none' : 'flex' }}
                      >
                        <span className="text-gray-700 font-bold text-sm">
                          {(item._id?.name || "C").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {/* Verified Badge - Scalloped design */}
                    {item._id?.verificationBadge && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerifiedBadge size={16} />
                      </div>
                    )}
                  </div>
                  
                  {/* Customer Name */}
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base truncate block">
                      {item._id?.name || "Unknown"}
                    </span>
                    {item._id?.email && (
                      <span className="text-xs text-gray-500 truncate block">
                        {item._id.email}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Booking Count Badge */}
                <span className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0">
                  {item.count} {item.count === 1 ? "booking" : "bookings"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;

