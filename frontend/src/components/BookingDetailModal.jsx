import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { getSocket } from '../utils/socket';
import { useUiFeedback } from '../context/UiFeedbackContext';

const BookingDetailModal = ({ bookingId, isOpen, onClose, onStatusUpdate, userRole }) => {
  const { toast, confirm } = useUiFeedback();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) fetchBooking();
  }, [isOpen, bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      if (userRole === 'owner') {
        const response = await axiosInstance.get(`/owner/bookings/${bookingId}`);
        setBooking(response.data.data || null);
      } else {
        const response = await axiosInstance.get('/customer/bookings');
        const bookingData = response.data.data.find(b => b._id === bookingId);
        setBooking(bookingData || null);
      }
    } catch (error) {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    const statusMessages = {
      accepted: 'accept',
      declined: 'decline',
      in_transit: 'mark as in transit',
      completed: 'mark as completed'
    };
    const message = statusMessages[status] || status;
    const ok = await confirm({
      title: 'Update booking status',
      message: `Are you sure you want to ${message} this booking?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    try {
      setUpdating(true);
      const response = await axiosInstance.put(`/owner/bookings/${bookingId}/status`, { status });
      if (response.data.success) {
        const socket = getSocket();
        if (socket) socket.emit('refresh_bookings');
        await fetchBooking();
        if (onStatusUpdate) onStatusUpdate();
        const msg = status === 'completed'
          ? 'Trip marked as completed!'
          : `Booking ${status} successfully!`;
        toast({ type: 'success', message: msg });
      }
    } catch (error) {
      toast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update status',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusStyles = (status) => {
    const styles = {
      pending: 'bg-gray-50 text-gray-500 border-gray-200',
      accepted: 'bg-gray-100 text-gray-700 border-gray-200',
      declined: 'bg-white text-gray-400 border-gray-200',
      in_transit: 'bg-gray-800 text-white border-transparent',
      completed: 'bg-gray-900 text-white border-transparent',
    };
    return styles[status] || 'bg-gray-50 text-gray-500 border-gray-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Booking Details</h2>
            {booking && <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">Ref: {bookingId.slice(-8).toUpperCase()}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
               <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
               <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Loading...</p>
            </div>
          ) : !booking ? (
            <div className="text-center py-20">
               <p className="text-sm font-medium text-gray-400">Booking not found</p>
            </div>
          ) : (
            <>
              {/* Truck Profile Card */}
              <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                  {(() => { 
                    const imgSrc = booking.truck?.imageUrl || booking.truck?.image; 
                    return imgSrc ? (
                      <img
                        src={imgSrc}
                        alt="Truck"
                        className="w-full h-full object-cover grayscale-[20%]"
                      />
                    ) : <TruckIcon className="w-6 h-6 text-gray-300" />;
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[15px] font-semibold text-gray-800 truncate">
                      {booking.truck?.title || 'Heavy Load Truck'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium border uppercase tracking-wider ${getStatusStyles(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {userRole === 'owner' ? 'Client' : 'Provider'}: 
                    <span className="text-gray-800 ml-1">
                      {userRole === 'owner' ? booking.customer?.name : (booking.owner?.name || 'Authorized Partner')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Route Timeline - Visual Pin Style */}
              <div className="space-y-4 px-1">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Route Information</h4>
                <div className="relative flex flex-col gap-6 ml-2">
                  <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-gray-100"></div>
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <PinIcon className="w-3.5 h-3.5 text-gray-300 mt-1 bg-white" />
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 leading-none">Pickup</p>
                      <p className="text-[13px] font-medium text-gray-700 leading-snug">{booking.pickup?.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative z-10">
                    <PinIcon className="w-3.5 h-3.5 text-gray-800 mt-1 bg-white" />
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 leading-none">Dropoff</p>
                      <p className="text-[13px] font-medium text-gray-700 leading-snug">{booking.dropoff?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Est. Distance</p>
                  <p className="text-lg font-semibold text-gray-800">{booking.distanceKm} <span className="text-xs text-gray-400 font-normal">km</span></p>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Fare</p>
                  <p className="text-lg font-semibold text-gray-800">₹{booking.price?.toLocaleString()}</p>
                </div>
              </div>

              {/* Truck Specs Grid */}
              {booking.truck && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Specifications</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <SpecItem label="Type" value={booking.truck.type} />
                    <SpecItem label="Capacity" value={`${booking.truck.capacityTons || '0'} T`} />
                    <SpecItem label="Base Rate" value={`₹${booking.truck.ratePerKm}/km`} />
                  </div>
                </div>
              )}

              {/* Customer Instructions */}
              {booking.notes && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Instructions</p>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium italic">"{booking.notes}"</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && booking && (
          <div className="p-5 bg-white border-t border-gray-100">
            {userRole === 'owner' && booking.status === 'pending' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={updating}
                  className="px-6 py-2.5 bg-gray-800 text-white rounded-lg font-medium text-xs hover:bg-black transition-all disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Accept Booking'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={updating}
                  className="px-6 py-2.5 bg-white text-gray-500 border border-gray-200 rounded-lg font-medium text-xs hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            )}

            {userRole === 'owner' && booking.status === 'accepted' && (
              <button
                onClick={() => handleStatusUpdate('in_transit')}
                disabled={updating}
                className="w-full px-6 py-2.5 bg-gray-800 text-white rounded-lg font-medium text-xs hover:bg-black transition-all"
              >
                {updating ? 'Updating...' : 'Start Transit Trip'}
              </button>
            )}

            {userRole === 'owner' && booking.status === 'in_transit' && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="w-full px-6 py-2.5 bg-gray-800 text-white rounded-lg font-medium text-xs hover:bg-black transition-all"
              >
                Confirm Completion
              </button>
            )}

            {booking.status === 'completed' && userRole === 'customer' && (
              <button
                onClick={async () => {
                   // Logic for download as before...
                }}
                className="w-full px-6 py-2.5 bg-gray-800 text-white rounded-lg font-medium text-xs hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                Download PDF Invoice
              </button>
            )}
            
            {booking.status === 'completed' && userRole === 'owner' && (
              <div className="flex items-center justify-center gap-2 py-2 text-gray-400">
                <CheckIcon className="w-4 h-4" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Trip Successfully Delivered</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Internal Modular Components --- */

const SpecItem = ({ label, value }) => (
  <div className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
    <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">{label}</p>
    <p className="text-[11px] font-semibold text-gray-700 truncate">{value || 'N/A'}</p>
  </div>
);

/* --- Monochrome Icons --- */
const CloseIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>;
const PinIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TruckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1" /></svg>;
const DownloadIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const CheckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;

export default BookingDetailModal;