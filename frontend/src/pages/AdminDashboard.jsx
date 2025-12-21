import { useState } from "react";
import { useAdminData } from "../hooks/useAdminData";
import axiosInstance from "../utils/axiosInstance";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { useUiFeedback } from "../context/UiFeedbackContext";
import StatsOverview from "../components/dashboard/admin/StatsOverview";
import AdminNotifications from "../components/admin/AdminNotifications";

const AdminDashboard = () => {
  const { toast, confirm } = useUiFeedback();
  const { stats, analytics, users, trucks, bookings, loading, refetch } = useAdminData();

  const handleDeleteUser = async (userId, role) => {
    const ok = await confirm({
      title: "Delete user",
      message: `Are you sure you want to delete this ${role}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!ok) {
      return;
    }
    try {
      await axiosInstance.delete(`/admin/user/${userId}?role=${role}`);
      refetch();
    } catch (error) {
      toast({
        type: "error",
        message: error.response?.data?.message || "Failed to delete user",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Dashboard..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1.5 sm:mb-2">
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Comprehensive platform management and analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <AdminNotifications />
            </div>
          </div>
        </div>

        {/* Overview Content - Default view */}
        <StatsOverview stats={stats} />
      </div>
    </div>
  );
};

export default AdminDashboard;
