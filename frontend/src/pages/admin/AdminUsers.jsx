import { useAdminData } from "../../hooks/useAdminData";
import UserManagement from "../../components/dashboard/admin/UserManagement";
import { useState, useEffect } from "react";

const AdminUsers = () => {
  const { users, loading, error, refetch } = useAdminData();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalCustomers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    totalBookings: 0,
  });

  // Calculate stats whenever users data changes
  useEffect(() => {
    if (users) {
      const owners = users.owners || [];
      const customers = users.customers || [];
      const allUsers = [...owners, ...customers];
      
      setStats({
        totalUsers: allUsers.length,
        totalOwners: owners.length,
        totalCustomers: customers.length,
        verifiedUsers: allUsers.filter(user => user.verificationBadge).length,
        unverifiedUsers: allUsers.filter(user => !user.verificationBadge).length,
        totalBookings: allUsers.reduce((total, user) => total + (user.stats?.bookings || 0), 0),
      });
    }
  }, [users]);

  const handleDeleteUser = async (userId, role) => {
    // This would need to be implemented with actual delete logic
    console.log('Delete user:', userId, role);
    // For now, just refetch the data
    refetch();
  };

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
          <h2 className="text-xl font-semibold mb-2">Error loading users</h2>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    User Management
                  </h1>
                  <p className="text-md text-gray-500 mt-1">
                    Manage platform customers & owners
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalUsers}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Users</p>
          </div>

          {/* Vehicle Owners Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalOwners}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Vehicle Owners</p>
          </div>

          {/* Customers Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.totalCustomers}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Customers</p>
          </div>

          {/* Verified Users Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="inline-flex p-2 bg-gray-100 rounded-lg mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 012.212 2.212 3.42 3.42 0 01.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 01-.806 1.946 3.42 3.42 0 01-2.212 2.212 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-2.212-2.212 3.42 3.42 0 01-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 01.806-1.946 3.42 3.42 0 012.212-2.212z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{stats.verifiedUsers}</p>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Verified Users</p>
          </div>
        </div>

        {/* User Management */}
        <UserManagement 
          users={users} 
          onDeleteUser={handleDeleteUser} 
          onRefetch={refetch} 
        />
      </div>
    </div>
  );
};

export default AdminUsers;
