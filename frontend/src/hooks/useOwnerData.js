import { useState, useEffect, useContext } from "react";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";

export const useOwnerData = () => {
  const { user } = useContext(AuthContext);
  const [trucks, setTrucks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [trucksRes, bookingsRes] = await Promise.all([
        axiosInstance.get("/owner/trucks"),
        axiosInstance.get("/owner/bookings"),
      ]);
      const trucksData = trucksRes.data.data || [];
      const bookingsData = bookingsRes.data.data || [];
      
      setTrucks(trucksData);
      setBookings(bookingsData);
      
      // Debug logging
      console.log('Owner Data - Trucks:', trucksData.map(t => ({ id: t._id, title: t.title, available: t.available })));
      console.log('Owner Data - Bookings:', bookingsData.map(b => ({ id: b._id, status: b.status, truckId: b.truck?._id })));
    } catch (error) {
      console.error("Error fetching owner data:", error);
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
        socket.on("new_booking", fetchData);
        socket.on("booking_updated", fetchData);

        return () => {
          if (socket) {
            socket.off("new_booking");
            socket.off("booking_updated");
          }
        };
      }
    }
  }, [user]);

  return { trucks, bookings, loading, error, refetch: fetchData };
};

