import { useState, useEffect, useContext } from "react";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";

export const useCustomerBookings = () => {
  const { user, isCustomer } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/customer/bookings");
      setBookings(response.data.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError(error.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCustomer && user) {
      fetchBookings();

      initSocket(user.id);
      const socket = getSocket();

      if (socket) {
        socket.on("booking_updated", () => {
          fetchBookings();
        });

        return () => {
          if (socket) {
            socket.off("booking_updated");
          }
        };
      }
    }
  }, [isCustomer, user]);

  return { bookings, loading, error, refetch: fetchBookings };
};

