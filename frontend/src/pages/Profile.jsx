import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import logger from '../utils/logger';
import CameraModal from '../components/CameraModal';
import VerifiedBadge from '../components/shared/VerifiedBadge';

// --- Profile Component (Main) ---

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    companyName: '',
    experienceYears: '',
    bio: '',
    profileImage: null,
    profileImagePreview: null,
  });
  const [stats, setStats] = useState({
    trucks: 0,
    bookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const isOwner = profileUser?.role === 'owner';
  const isCustomer = profileUser?.role === 'customer';

  // Existing logic for token check and loading profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    // ... (Existing loadProfile logic remains the same)
    try {
      setLoading(true);
      const meRes = await axiosInstance.get('/auth/me');
      const me = meRes.data?.data;

      if (!me) {
        setMessage({ type: 'error', text: 'Failed to load profile' });
        return;
      }

      setProfileUser(me);
      setFormData({
        name: me.name || '',
        phone: me.phone || '',
        address: me.address || '',
        companyName: me.companyName || '',
        experienceYears: me.experienceYears ?? '',
        bio: me.bio || '',
        profileImage: null,
        profileImagePreview: me.profileImageUrl || null,
      });

      await loadUserStats(me.role);
    } catch (error) {
      console.error('Error loading profile:', error);

      const status = error.response?.status;
      if (status === 401) {
        navigate('/login');
        return;
      }

      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (role) => {
    // ... (Existing loadUserStats logic remains the same)
    try {
      
      if (role === 'owner') {
        const [trucksRes, bookingsRes] = await Promise.all([
          axiosInstance.get('/owner/trucks'),
          axiosInstance.get('/owner/bookings'),
        ]);
        setStats({
          trucks: trucksRes.data.data?.length || 0,
          bookings: bookingsRes.data.data?.length || 0,
        });
      } else if (role === 'customer') {
        const bookingsRes = await axiosInstance.get('/customer/bookings');
        setStats({
          trucks: 0,
          bookings: bookingsRes.data.data?.length || 0,
        });
      } else {
        setStats({ trucks: 0, bookings: 0 });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
        [`${name}Preview`]: file ? URL.createObjectURL(file) : null,
      });
      // Update profileUser immediately to show the new image
      setProfileUser(prev => ({
        ...prev,
        profileImageUrl: file ? URL.createObjectURL(file) : prev?.profileImageUrl
      }));
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    // ... (Existing handleSubmit logic remains the same)
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      if (!isOwner && !isCustomer) {
        setMessage({ type: 'error', text: 'Profile updates are not available for this account type.' });
        return;
      }

      const endpoint = isOwner ? '/owner/profile' : '/customer/profile';

      const form = new FormData();
      form.append('name', formData.name);
      form.append('phone', formData.phone);
      form.append('address', formData.address);
      if (isOwner) {
        form.append('companyName', formData.companyName);
        form.append('experienceYears', formData.experienceYears);
        form.append('bio', formData.bio);
      }
      if (formData.profileImage) {
        form.append('profileImage', formData.profileImage);
      }

      const response = await axiosInstance.put(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        const updatedUser = { ...(profileUser || user || {}), ...response.data.data };
        logger.debug('Updated user from backend', { user: updatedUser });
        logger.debug('Profile image URL', { url: updatedUser.profileImageUrl });
        setProfileUser(updatedUser);
        updateUser(updatedUser);
        setIsEditing(false);
        
        // Update form data with new profile image URL
        setFormData(prev => ({
          ...prev,
          profileImage: null,
          profileImagePreview: response.data.data.profileImageUrl || null
        }));

        // Refresh from backend to ensure we display authoritative values
        setTimeout(async () => {
          await loadProfile();
        }, 300);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    // ... (Existing formatDate logic remains the same)
    if (!date) return 'Not available';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Not available';
    }
  };

  const handleDirectUpload = async (file) => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      if (!isOwner && !isCustomer) {
        setMessage({ type: 'error', text: 'Profile updates are not available for this account type.' });
        return;
      }

      const endpoint = isOwner ? '/owner/profile' : '/customer/profile';
      const form = new FormData();
      form.append('profileImage', file);

      const response = await axiosInstance.put(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        const updatedUser = { ...(profileUser || user || {}), ...response.data.data };
        logger.debug('Direct upload - Updated user from backend', { user: updatedUser });
        logger.debug('Direct upload - Profile image URL', { url: updatedUser.profileImageUrl });
        setProfileUser(updatedUser);
        updateUser(updatedUser);
        
        // Update form data with new profile image URL
        setFormData(prev => ({
          ...prev,
          profileImage: null,
          profileImagePreview: response.data.data.profileImageUrl || null
        }));
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile picture',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCapture = (blob) => {
    setCameraOpen(false);
    const file = new File([blob], `profile-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    handleDirectUpload(file);
  };

  const getValue = (value, fallback = 'Not provided') => {
    if (value === null || value === undefined || value === '') return fallback;
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-gray-500 border-t-black"></div>
          <p className="mt-4 text-sm font-medium text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Message Banner */}
        {message.text && (
          <div
            className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl border-2 transform transition-all duration-300 hover:scale-[1.02] ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200'
                : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200'
            }`}
          >
            <p className="font-bold text-sm flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {message.text}
            </p>
          </div>
        )}

        {/* Facebook-style Main Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden transform transition-all duration-500 hover:shadow-2xl">
          {/* Cover Photo Area - Enhanced Modern Design */}
          <div className="h-40 sm:h-56 w-full relative overflow-hidden group">
            {/* Enhanced multi-layer gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-600 to-purple-700"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
            
            {/* Animated geometric pattern overlay */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.8"/>
                    <circle cx="30" cy="30" r="2" fill="white" opacity="0.6"/>
                  </pattern>
                  <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8">
                      <animate attributeName="stop-color" values="#3B82F6;#8B5CF6;#3B82F6" dur="8s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8">
                      <animate attributeName="stop-color" values="#8B5CF6;#3B82F6;#8B5CF6" dur="8s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <rect width="100%" height="100%" fill="url(#animatedGradient)" opacity="0.3" />
              </svg>
            </div>
            
            {/* Enhanced animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-indigo-600/30 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent animate-pulse"></div>
            
            {/* Enhanced Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center px-4 transform transition-all duration-500 group-hover:scale-105">
                {/* Enhanced decorative lines */}
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-4 animate-pulse"></div>
                
                {/* Enhanced main title with icon */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="p-4 bg-white/15 backdrop-blur-md rounded-full border border-white/30 shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {isOwner ? (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-wide drop-shadow-lg">
                      {isOwner ? 'Fleet Owner' : 'Customer'}
                    </div>
                    <div className="text-xs sm:text-sm font-light opacity-90 tracking-widest uppercase drop-shadow">
                      {isOwner ? 'Transport Services' : 'Logistics Platform'}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced status badges */}
                <div className="flex items-center justify-center gap-4 mb-3">
                  {profileUser?.verificationBadge && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/25 backdrop-blur-sm rounded-full border border-green-400/40 shadow-lg transform transition-all duration-300 hover:scale-105">
                      <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-green-400/50 shadow-lg"></div>
                      <span className="text-xs font-semibold">Verified Account</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/25 backdrop-blur-sm rounded-full border border-blue-400/40 shadow-lg transform transition-all duration-300 hover:scale-105">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold">Active</span>
                  </div>
                </div>
                
                {/* Enhanced platform info */}
                <div className="text-xs opacity-80 font-light tracking-wide drop-shadow">
                  CargoNepal Platform • {isOwner ? 'Premium Services' : 'Standard Access'}
                </div>
                
                {/* Enhanced bottom decorative line */}
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent mx-auto mt-4 animate-pulse"></div>
              </div>
            </div>
            
            {/* Enhanced corner decorations */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 shadow-white/20 shadow-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 shadow-white/20 shadow-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 shadow-white/20 shadow-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 shadow-white/20 shadow-lg"></div>
            
            {/* Subtle overlay gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          {/* Profile Header & Info */}
          <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:pb-6 relative border-b border-gray-200">
            {/* Enhanced Profile Picture */}
            <div className="relative -mt-16 sm:-mt-24 w-28 h-28 sm:w-40 sm:h-40 mx-auto sm:mx-0 group">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-2xl ring-4 ring-white/50 overflow-hidden cursor-pointer"
                   onClick={(e) => {
                  console.log('Profile picture clicked in Profile.jsx', e);
                  e.preventDefault();
                  e.stopPropagation();
                  alert('Profile picture clicked!');
                  setShowProfileOptions(true);
                }}>
                {profileUser?.profileImageUrl ? (
                  <img
                    src={profileUser?.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <div
                  className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300"
                  style={{ display: profileUser?.profileImageUrl ? 'none' : 'flex' }}
                >
                  <span className="text-black font-extrabold text-3xl sm:text-4xl bg-white/80 rounded-full w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center shadow-inner">
                    {profileUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              {profileUser?.verificationBadge && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transform transition-all duration-300 hover:scale-110">
                  <VerifiedBadge size={24} />
                </div>
              )}
              {/* Clickable overlay */}
              <div 
                className="absolute inset-0 w-full h-full rounded-full cursor-pointer z-10"
                onClick={(e) => {
                  console.log('Overlay clicked in Profile.jsx', e);
                  e.preventDefault();
                  e.stopPropagation();
                  setShowProfileOptions(true);
                }}
              />
                                        </div>

            {/* Enhanced Name and Details */}
            <div className="sm:ml-44 mt-3 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-black truncate mb-2">
                {getValue(profileUser?.name, 'User Profile')}
              </h1>
              <p className="text-sm sm:text-base text-gray-700 font-normal mb-3">
                {getValue(profileUser?.email, 'No Email Provided')}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap sm:flex-nowrap">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-white border border-gray-600 uppercase tracking-wider shadow-lg">
                  {profileUser?.role?.toUpperCase() || 'USER'}
                </span>
                {profileUser?.verificationBadge && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full border border-green-200">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-green-700">Verified</span>
                  </div>
                )}
              </div>
            </div>

                      </div>

          {/* Profile Content - Enhanced Horizontal Layout */}
          <div className="p-6 sm:p-8 lg:p-10 space-y-8">
            {/* First Row - Intro and Statistics Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ProfileIntroCard user={profileUser} formatDate={formatDate} getValue={getValue} isOwner={isOwner} />
              <ProfileStatsCard stats={stats} isOwner={isOwner} profileUser={profileUser} />
            </div>

            {/* Second Row - Edit Form Only */}
            <div className="transform transition-all duration-300">
              {isEditing ? (
                <EditProfileForm
                  user={profileUser}
                  formData={formData}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                  submitting={submitting}
                  isOwner={isOwner}
                  setCameraOpen={setCameraOpen}
                />
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Hidden file input for profile image */}
        <input
          id="profileImageInput"
          type="file"
          accept="image/*"
          name="profileImage"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleDirectUpload(file);
            }
          }}
          className="hidden"
        />
        
        {/* Hidden camera input for mobile devices */}
        <input
          id="profileCameraInput"
          type="file"
          accept="image/*"
          name="profileCamera"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleDirectUpload(file);
            }
          }}
          className="hidden"
        />
        
        {/* Profile Options Modal */}
        {showProfileOptions && (
          <>
            {console.log('Rendering profile options modal in Profile.jsx, showProfileOptions:', showProfileOptions)}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-xl border border-gray-200/50 transform transition-all duration-200 scale-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Profile Picture</h3>
                <button
                  onClick={() => setShowProfileOptions(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowProfileOptions(false);
                    const input = document.getElementById('profileImageInput');
                    if (input) {
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleDirectUpload(file);
                        }
                        input.onchange = null;
                      };
                      input.click();
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 hover:shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload from Gallery
                </button>
                <button
                  onClick={() => {
                    setShowProfileOptions(false);
                    // Check if mobile device and use native camera, otherwise use camera modal
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    if (isMobile) {
                      // Use native camera on mobile devices
                      const cameraInput = document.getElementById('profileCameraInput');
                      if (cameraInput) {
                        cameraInput.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleDirectUpload(file);
                          }
                          cameraInput.onchange = null;
                        };
                        cameraInput.click();
                      }
                    } else {
                      // Use camera modal on desktop
                      setCameraOpen(true);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 hover:shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </button>
                <button
                  onClick={() => setShowProfileOptions(false)}
                  className="w-full px-3 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 hover:shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
          </>
        )}
        
        <CameraModal isOpen={cameraOpen} onCapture={handleCapture} onClose={() => setCameraOpen(false)} />
        
        {/* Enhanced Floating Action Button for Edit Profile */}
        {!isEditing && (profileUser?.role === 'owner' || profileUser?.role === 'customer') && (
          <button
            onClick={() => setIsEditing(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full shadow-2xl hover:from-gray-700 hover:to-gray-800 hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110 z-50"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              Edit Profile
            </span>
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 animate-ping opacity-20"></div>
          </button>
        )}
      </div>
    </div>
  );
};

// --- Sub-Components for Facebook-style Layout ---

const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-gray-300/70 group">
    <div className="p-6 border-b border-gray-100/80 bg-gradient-to-r from-gray-50 to-white">
      <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
        {title}
      </h3>
    </div>
    <div className="p-6 bg-gradient-to-b from-white to-gray-50/30">
      {children}
    </div>
  </div>
);

const ProfileIntroCard = ({ user, formatDate, getValue, isOwner }) => {
  return (
    <Card title="Intro">
      <div className="space-y-4 text-sm">
        {isOwner && user?.bio && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50 shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
            <p className="text-slate-700 leading-relaxed font-medium">
              {getValue(user.bio, 'A dedicated professional.')}
            </p>
          </div>
        )}
        {isOwner && user?.companyName && (
          <DetailField label="Company Name" value={getValue(user?.companyName)} icon="company" />
        )}
        {isOwner && user?.experienceYears && (
          <DetailField label="Experience" value={`${getValue(user?.experienceYears)} years`} icon="experience" />
        )}
        <DetailField label="Account Type" value={getValue(user?.role?.toUpperCase(), 'USER')} icon="user" />
        <DetailField label="Email" value={getValue(user?.email)} icon="mail" />
        <DetailField label="Phone" value={getValue(user?.phone)} icon="phone" />
        <DetailField label="Address" value={getValue(user?.address)} icon="location" />
        <DetailField label="Member Since" value={formatDate(user?.createdAt)} icon="calendar" />
      </div>
    </Card>
  );
};

const ProfileStatsCard = ({ stats, isOwner, profileUser }) => {
  return (
    <Card title="Statistics">
      <div className="flex flex-wrap gap-4">
        {isOwner && (
          <StatCard 
            label="Total Trucks" 
            value={stats.trucks.toString()}
            icon={
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            hasData={stats.trucks > 0}
            color="blue"
          />
        )}
        <StatCard 
          label="Total Bookings" 
          value={stats.bookings.toString()}
          icon={
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          hasData={stats.bookings > 0}
          color="purple"
        />
        <StatCard 
          label="Account Status" 
          value={profileUser?.verificationBadge ? 'Verified' : 'Pending'}
          icon={
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          hasData={true}
          color="green"
        />
      </div>
    </Card>
  );
};

const StatCard = ({ label, value, icon, color = "gray", hasData = true }) => {
  const colorClasses = {
    blue: 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300',
    purple: 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300',
    green: 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300',
    gray: 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-4 text-center hover:shadow-lg transition-all duration-300 flex-1 min-w-[140px] transform hover:scale-105 hover:-translate-y-1`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="flex-shrink-0 p-1.5 bg-white/70 rounded-lg">
          <div className="text-gray-600">
            {icon}
          </div>
        </div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      {!hasData && (
        <p className="text-xs text-gray-500 mt-2 font-medium">No data yet</p>
      )}
    </div>
  );
};

const DetailField = ({ label, value, icon }) => {
  const getIcon = (iconType) => {
    const icons = {
      user: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      mail: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      phone: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      location: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      calendar: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      company: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      experience: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
    return icons[iconType] || icons.user;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200/50 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:border-gray-300/70 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl border border-gray-200/50 flex items-center justify-center shadow-sm">
        {getIcon(icon)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
};

const EditProfileForm = ({
  user,
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  isOwner,
  setCameraOpen,
}) => {
  return (
    <Card title="Edit Profile">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200/50 shadow-sm">
          <h4 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={onChange}
              required
              icon={
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-100 cursor-not-allowed text-gray-700"
              icon={
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <FormField 
              label="Phone Number" 
              name="phone" 
              value={formData.phone} 
              onChange={onChange}
              icon={
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />
            <FormField
              label="Address"
              name="address"
              value={formData.address}
              onChange={onChange}
              icon={
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Professional Information Section (Owners Only) */}
        {isOwner && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Professional Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={onChange}
                icon={
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                value={formData.experienceYears}
                onChange={onChange}
                icon={
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <div className="sm:col-span-2">
                <FormField
                  label="Professional Bio"
                  name="bio"
                  type="textarea"
                  value={formData.bio}
                  onChange={onChange}
                  icon={
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50 shadow-sm">
          <h4 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Profile Picture
          </h4>
          <div className="space-y-6">
            <FormField
              name="profileImage"
              type="file"
              onChange={onChange}
              accept="image/*"
              capture="environment"
              icon={
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              }
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-bold hover:from-gray-100 hover:to-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Photo
              </button>
            </div>
            {formData.profileImagePreview && (
              <div className="mt-4">
                <div className="relative inline-block group">
                  <img 
                    src={formData.profileImagePreview} 
                    alt="Profile Preview" 
                    className="rounded-xl border-2 border-gray-300 w-full max-h-48 object-cover bg-white shadow-lg transform transition-all duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                    Preview
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Upload or take a clear profile photo. Max size 5MB.
            </p>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 text-sm font-bold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Card>
  );
};

const FormField = ({ label, name, type = 'text', value, onChange, required, disabled, className = '', icon }) => {
  const baseClasses = `w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 bg-white transition-all duration-200 hover:border-gray-400 hover:shadow-sm ${className}`;

  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          {label}
          {required && <span className="text-gray-600 ml-1">*</span>}
        </label>
        <div className="relative group">
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
            disabled={disabled}
            className={`${baseClasses} resize-none ${icon ? 'pl-10' : ''} focus:translate-y-[-1px]`}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          <div className="absolute bottom-1 left-1 right-1 h-0.5 bg-gradient-to-r from-gray-500 to-gray-600 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (type === 'file') {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          {label}
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            type="file"
            name={name}
            onChange={onChange}
            accept="image/*"
            capture="environment"
            className={`${baseClasses} ${icon ? 'pl-10' : ''} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gradient-to-r file:from-gray-500 file:to-gray-600 file:text-white hover:file:from-gray-600 hover:file:to-gray-700 file:shadow-md file:transition-all file:duration-200`}
          />
          <div className="absolute bottom-1 left-1 right-1 h-0.5 bg-gradient-to-r from-gray-500 to-gray-600 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
        {label}
        {required && <span className="text-gray-600 ml-1">*</span>}
      </label>
      <div className="relative group">
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
          required={required}
          disabled={disabled}
          className={`${baseClasses} ${icon ? 'pl-10' : ''} focus:translate-y-[-1px]`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <div className="absolute bottom-1 left-1 right-1 h-0.5 bg-gradient-to-r from-gray-500 to-gray-600 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
      </div>
    </div>
  );
};

export default Profile;