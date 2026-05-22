import { useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { useUiFeedback } from "../../../context/UiFeedbackContext";
import VerifiedBadge from "../../../components/shared/VerifiedBadge";

const UserManagement = ({ users, onDeleteUser, onRefetch }) => {
  const { toast, confirm } = useUiFeedback();
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [currentPage, setCurrentPage] = useState({ owners: 1, customers: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;

  const handleUserClick = (user, role) => {
    setSelectedUser({ ...user, role });
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      companyName: user.companyName || "",
      experienceYears: user.experienceYears || "",
      bio: user.bio || "",
      verificationBadge: user.verificationBadge || false,
    });
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = { ...editForm };
      const originalVerificationStatus = selectedUser.verificationBadge;
      const newVerificationStatus = editForm.verificationBadge;

      // Remove verificationBadge from regular update data as it has its own endpoint
      const { verificationBadge, ...profileUpdateData } = updateData;
      
      if (profileUpdateData.experienceYears) {
        profileUpdateData.experienceYears = Number(profileUpdateData.experienceYears);
      }

      // Update profile data
      await axiosInstance.put(`/admin/user/${selectedUser._id}?role=${selectedUser.role}`, profileUpdateData);

      // Update verification status if changed
      if (originalVerificationStatus !== newVerificationStatus) {
        await axiosInstance.put(`/admin/verification-badge/${selectedUser._id}`, {
          role: selectedUser.role,
          verificationBadge: newVerificationStatus
        });
      }

      if (onRefetch) onRefetch();
      handleCloseModal();
      toast({ type: "success", message: "User updated successfully" });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to update user",
      });
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete user",
      message: `Are you sure you want to delete this ${selectedUser.role}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!ok) {
      return;
    }
    try {
      await axiosInstance.delete(`/admin/user/${selectedUser._id}?role=${selectedUser.role}`);
      if (onRefetch) onRefetch();
      handleCloseModal();
      toast({ type: "success", message: "User deleted successfully" });
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to delete user",
      });
    }
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Reset to page 1 when searching
    setCurrentPage({ owners: 1, customers: 1 });
  };

  const filterUsers = (users, searchTerm) => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phone && user.phone.toLowerCase().includes(term))
    );
  };

  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search users by name, email, or phone number..."
            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm sm:text-base"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage({ owners: 1, customers: 1 });
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Owners */}
      <UserSection
        title="Vehicle Owners"
        users={filterUsers(users.owners || [], searchTerm)}
        role="owner"
        onUserClick={handleUserClick}
        currentPage={currentPage.owners}
        onPageChange={(page) => setCurrentPage({ ...currentPage, owners: page })}
      />

      {/* Customers */}
      <UserSection
        title="Customers"
        users={filterUsers(users.customers || [], searchTerm)}
        role="customer"
        onUserClick={handleUserClick}
        currentPage={currentPage.customers}
        onPageChange={(page) => setCurrentPage({ ...currentPage, customers: page })}
      />

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          editForm={editForm}
          onInputChange={handleInputChange}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

const UserSection = ({ title, users, role, onUserClick, currentPage, onPageChange }) => {
  const itemsPerPage = 5;
  const paginatedUsers = paginate(users, currentPage);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          {title} <span className="text-slate-500 font-normal">({users.length})</span>
        </h3>
      </div>

      {/* Card Grid */}
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {paginatedUsers.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              role={role}
              onClick={() => onUserClick(user, role)}
            />
          ))}
        </div>

        {paginatedUsers.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No {title.toLowerCase()} found
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const UserCard = ({ user, role, onClick }) => {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    const n = Number(num);
    if (isNaN(n)) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)} K`;
    return n.toString();
  };

  const stats = user.stats || {};

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden group shadow-lg"
    >
      {/* Top Section - Profile Info */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-4 sm:px-5 py-4 sm:py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Enhanced Avatar with Profile Picture and Verified Badge */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-200 overflow-hidden">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.name || "User"}
                  className="w-full h-full object-cover brightness-110 contrast-105"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400"
                style={{ display: user.profileImageUrl ? 'none' : 'flex' }}
              >
                <span className="text-slate-700 font-bold text-lg sm:text-xl">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
            {/* Verified Badge - Scalloped design for all users */}
            {user.verificationBadge && (
              <div className="absolute -top-1 -right-1">
                <VerifiedBadge size={16} />
              </div>
            )}
          </div>

          {/* Enhanced Name and Location */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 uppercase truncate leading-tight">
                {user.name}
              </h4>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate leading-tight">
              {user.address ? user.address.split(',')[0] : "Location not set"}
            </p>
            {user.email && (
              <p className="text-[9px] sm:text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Enhanced Statistics */}
      <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-slate-200 bg-gradient-to-br from-white to-slate-50">
        <div className={`grid ${role === "owner" ? "grid-cols-3" : "grid-cols-3"} gap-2 sm:gap-3`}>
          {role === "owner" ? (
            <>
              <StatItem label="TRUCKS" value={formatNumber(stats.trucks)} />
              <StatItem label="BOOKINGS" value={formatNumber(stats.bookings)} />
              <StatItem 
                label="EXPERIENCE" 
                value={
                  user.experienceYears !== undefined && user.experienceYears !== null && user.experienceYears !== 0
                    ? `${user.experienceYears}Y`
                    : "N/A"
                } 
              />
            </>
          ) : (
            <>
              <StatItem label="BOOKINGS" value={formatNumber(stats.bookings)} />
              <StatItem 
                label="STATUS" 
                value={user.verificationBadge ? "Verified" : "Pending"} 
                isStatus={true}
                verified={user.verificationBadge}
                isOwner={false}
              />
              <StatItem label="MEMBER" value="Active" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, isStatus = false, verified = false, isOwner = false }) => (
  <div className="text-center">
    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-tight">
      {label}
    </p>
    {isStatus ? (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
        verified 
          ? isOwner 
            ? "bg-blue-100 text-blue-700 border border-blue-300" 
            : "bg-gray-100 text-gray-700 border border-gray-300"
          : "bg-slate-200 text-slate-600 border border-slate-300"
      }`}>
        {value}
      </span>
    ) : (
      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{value}</p>
    )}
  </div>
);

const UserDetailModal = ({ user, editForm, onInputChange, onSave, onDelete, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditing ? "Edit User" : "User Profile"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 lg:p-10">
          {isEditing ? (
            <EditUserForm
              user={user}
              editForm={editForm}
              onInputChange={onInputChange}
              onSave={() => {
                onSave();
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <UserDetailsView user={user} onEdit={() => setIsEditing(true)} onDelete={onDelete} />
          )}
        </div>
      </div>
    </div>
  );
};

const UserDetailsView = ({ user, onEdit, onDelete }) => {
  const formatDate = (date) => {
    if (!date) return "Not available";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Not available";
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "Not available";
    try {
      return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Not available";
    }
  };

  // Get real values from backend
  const getValue = (value, fallback = "Not provided") => {
    if (value === null || value === undefined || value === "") return fallback;
    return value;
  };

  const trucksCount = user.stats?.trucks !== undefined && user.stats.trucks !== null 
    ? user.stats.trucks.toString() 
    : "0";
  
  const bookingsCount = user.stats?.bookings !== undefined && user.stats.bookings !== null 
    ? user.stats.bookings.toString() 
    : "0";

  return (
    <div className="space-y-6">
      {/* Compact Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Compact Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name || "User"}
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
                  style={{ display: user.profileImageUrl ? 'none' : 'flex' }}
                >
                  <span className="text-slate-700 font-bold text-lg">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              {/* Compact Verified Badge - Scalloped design */}
              {user.verificationBadge && (
                <div className="absolute -bottom-1 -right-1">
                  <VerifiedBadge size={20} />
                </div>
              )}
            </div>

            {/* Compact User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-900 truncate">{getValue(user.name, "Unknown User")}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {user.role ? user.role.toUpperCase() : "User"}
                </span>
              </div>
              <p className="text-sm text-slate-600 truncate mb-2">{getValue(user.email)}</p>
              <div className="flex items-center gap-2">
                {user.role === 'owner' && user.experienceYears && user.experienceYears > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                    {user.experienceYears} {user.experienceYears === 1 ? 'Year' : 'Years'} Exp
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organized Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Information
            </h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-slate-500">Email</span>
              </div>
              <span className="text-sm text-slate-900 truncate ml-2">{getValue(user.email)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-xs font-medium text-slate-500">Phone</span>
              </div>
              <span className="text-sm text-slate-900">{getValue(user.phone, "Not provided")}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium text-slate-500">Address</span>
              </div>
              <span className="text-sm text-slate-900 text-right">{getValue(user.address, "Not provided")}</span>
            </div>
          </div>
        </div>

        {/* Professional Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Professional Details
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {user.role === "owner" ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-xs font-medium text-slate-500">Company</span>
                  </div>
                  <span className="text-sm text-slate-900">{getValue(user.companyName, "Not provided")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-500">Experience</span>
                  </div>
                  <span className="text-sm text-slate-900">
                    {user.experienceYears && user.experienceYears > 0
                      ? `${user.experienceYears} ${user.experienceYears === 1 ? 'Year' : 'Years'}`
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-500">Trucks</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{trucksCount}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-xs font-medium text-slate-500">Bookings</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{bookingsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Activity Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Activity
            </h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs font-medium text-slate-500">Total Bookings</span>
              </div>
              <span className="text-sm font-medium text-slate-900">{bookingsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-slate-500">Member Since</span>
              </div>
              <span className="text-sm text-slate-900">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-medium text-slate-500">Last Updated</span>
              </div>
              <span className="text-sm text-slate-900">{formatDate(user.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Bio Card (if available) */}
        {user.role === "owner" && user.bio && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Bio
              </h4>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-700 leading-relaxed">{getValue(user.bio)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={onEdit}
          className="flex-1 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
        >
          Edit Profile
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
        >
          Delete User
        </button>
      </div>
    </div>
  );
};

const EditUserForm = ({ user, editForm, onInputChange, onSave, onCancel }) => {
  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="Full Name" 
            name="name" 
            value={editForm.name || ""} 
            onChange={onInputChange}
            icon={
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={editForm.email || ""}
            onChange={onInputChange}
            icon={
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <FormField 
            label="Phone Number" 
            name="phone" 
            value={editForm.phone || ""} 
            onChange={onInputChange}
            icon={
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />
          <FormField
            label="Address"
            name="address"
            value={editForm.address || ""}
            onChange={onInputChange}
            icon={
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Professional Information Section (Owners Only) */}
      {user.role === "owner" && (
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Professional Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Company Name"
              name="companyName"
              value={editForm.companyName || ""}
              onChange={onInputChange}
              icon={
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <FormField
              label="Experience (Years)"
              name="experienceYears"
              type="number"
              min="0"
              max="50"
              value={editForm.experienceYears || ""}
              onChange={onInputChange}
              icon={
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <div className="md:col-span-2">
              <FormField
                label="Professional Bio"
                name="bio"
                type="textarea"
                value={editForm.bio || ""}
                onChange={onInputChange}
                icon={
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Verification Status Section */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Verification Status
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Account Verification</p>
            <p className="text-xs text-gray-500 mt-1">Toggle to verify or unverify this user's account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="verificationBadge"
              checked={editForm.verificationBadge || false}
              onChange={(e) => onInputChange({ target: { name: 'verificationBadge', value: e.target.checked } })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {editForm.verificationBadge ? 'Verified' : 'Not Verified'}
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={onSave}
          className="flex-1 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-all active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-slate-900 font-medium break-words leading-relaxed">{value}</p>
  </div>
);

const FormField = ({ label, name, type = "text", value, onChange, icon }) => {
  if (type === "textarea") {
    return (
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-3 pointer-events-none">
              {icon}
            </div>
          )}
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows="4"
            className={`w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white transition-all resize-none ${
              icon ? 'pl-10' : ''
            }`}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white transition-all ${
            icon ? 'pl-10' : ''
          }`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        Previous
      </button>
      <span className="px-4 py-2 text-sm font-semibold text-slate-700">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        Next
      </button>
    </div>
  );
};

const paginate = (items, page) => {
  const itemsPerPage = 5;
  const startIndex = (page - 1) * itemsPerPage;
  return items.slice(startIndex, startIndex + itemsPerPage);
};

export default UserManagement;
