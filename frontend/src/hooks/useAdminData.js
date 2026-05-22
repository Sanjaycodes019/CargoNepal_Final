import { useState, useEffect, useContext } from "react";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";

export const useAdminData = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState({ owners: [], customers: [], admins: [] });
  const [trucks, setTrucks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, analyticsRes, usersRes, trucksRes, bookingsRes] =
        await Promise.all([
          axiosInstance.get("/admin/stats"),
          axiosInstance.get("/admin/analytics"),
          axiosInstance.get("/admin/users"),
          axiosInstance.get("/admin/trucks"),
          axiosInstance.get("/admin/bookings"),
        ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data);
      setTrucks(trucksRes.data.data);
      // Debug: Log trucks API response
      console.log('useAdminData - Trucks API response:', trucksRes.data.data);
      if (trucksRes.data.data && trucksRes.data.data.length > 0) {
        console.log('useAdminData - First truck from API:', trucksRes.data.data[0]);
        console.log('useAdminData - First truck isVerified from API:', trucksRes.data.data[0].isVerified);
      }
      setBookings(bookingsRes.data.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setError(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (user) {
      initSocket(user.id);
      const socket = getSocket();

      if (socket) {
        socket.on("admin_booking_updated", fetchData);
        socket.on("booking_updated", fetchData);

        return () => {
          if (socket) {
            socket.off("admin_booking_updated");
            socket.off("booking_updated");
          }
        };
      }
    }
  }, [user]);

  return {
    stats,
    analytics,
    users,
    trucks,
    bookings,
    loading,
    error,
    refetch: fetchData,
  };
};

