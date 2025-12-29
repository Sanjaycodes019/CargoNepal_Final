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
      pending: 'bg-gray-100 text-gray-600 border-gray-300',
      accepted: 'bg-gray-100 text-gray-700 border-gray-300',
      declined: 'bg-gray-100 text-gray-600 border-gray-300',
      in_transit: 'bg-gray-100 text-gray-700 border-gray-300',
      completed: 'bg-gray-900 text-white border-gray-900',
    };
    return styles[status] || 'bg-gray-100 text-gray-600 border-gray-300';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-gray-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">Booking Details</h2>
            {booking && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Ref: {bookingId.slice(-8).toUpperCase()}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-black transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading...</p>
            </div>
          ) : !booking ? (
            <div className="text-center py-20">
              <p className="text-sm font-medium text-gray-500">Booking not found</p>
            </div>
          ) : (
            <>
              {/* Truck Profile Card */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {(() => { 
                    const imgSrc = booking.truck?.imageUrl || booking.truck?.image; 
                    return imgSrc ? (
                      <img
                        src={imgSrc}
                        alt="Truck"
                        className="w-full h-full object-cover"
                      />
                    ) : <TruckIcon className="w-6 h-6 text-gray-300" />;
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {booking.truck?.title || 'Heavy Load Truck'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusStyles(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                      {booking.paymentStatus === 'paid' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider bg-gray-900 text-white border-gray-900">
                          PAID
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {userRole === 'owner' ? 'Client' : 'Provider'}: 
                    <span className="text-gray-900 ml-1">
                      {userRole === 'owner' ? booking.customer?.name : (booking.owner?.name || 'Authorized Partner')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Route Timeline - Visual Pin Style */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Route Information</h4>
                <div className="relative flex flex-col gap-6 pl-2">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0 mt-1 w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Pickup</p>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{booking.pickup?.address || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0 mt-1 w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dropoff</p>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{booking.dropoff?.address || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Est. Distance</p>
                  <p className="text-lg font-black text-gray-900">
                    {booking.distanceKm || '0'} <span className="text-xs font-medium text-gray-500">km</span>
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Fare</p>
                  <p className="text-lg font-black text-gray-900">
                    ₹{booking.price?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {/* Truck Specs Grid */}
              {booking.truck && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Specifications</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <SpecItem label="Type" value={booking.truck.type || 'N/A'} />
                    <SpecItem label="Capacity" value={`${booking.truck.capacityTons || '0'} T`} />
                    <SpecItem label="Rate" value={`₹${booking.truck.ratePerKm || '0'}/km`} />
                  </div>
                </div>
              )}

              {/* Customer Instructions */}
              {booking.notes && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Special Instructions</p>
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">"{booking.notes}"</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && booking && (
          <div className="p-4 sm:p-6 bg-white border-t border-gray-100">
            {userRole === 'owner' && booking.status === 'pending' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Decline</span>
                </button>
              </div>
            )}

            {userRole === 'owner' && booking.status === 'accepted' && (
              <button
                onClick={() => handleStatusUpdate('in_transit')}
                disabled={updating}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Start Transit</span>
                  </>
                )}
              </button>
            )}

            {userRole === 'owner' && booking.status === 'in_transit' && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-3.5 h-3.5" />
                    <span>Mark as Delivered</span>
                  </>
                )}
              </button>
            )}

            {booking.status === 'completed' && userRole === 'customer' && (
              <button
                onClick={async () => {
                  // Logic for download as before...
                }}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Download Invoice</span>
              </button>
            )}
            
            {booking.status === 'completed' && userRole === 'owner' && (
              <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Successfully Delivered</span>
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
  <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
  </div>
);

/* --- Monochrome Icons --- */
const CloseIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>;
const PinIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TruckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1" /></svg>;
const DownloadIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const CheckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;

export default BookingDetailModal;