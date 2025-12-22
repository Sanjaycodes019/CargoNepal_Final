import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import CameraModal from '../../components/CameraModal';
import VerifiedBadge from '../../components/shared/VerifiedBadge';

const AdminProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    profileImage: null,
    profileImagePreview: null,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrucks: 0,
    totalBookings: 0,
    activeBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
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
        email: me.email || '',
        profileImage: null,
        profileImagePreview: me.profileImageUrl || null,
      });

      await loadAdminStats();
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

  const loadAdminStats = async () => {
    try {
      const statsRes = await axiosInstance.get('/admin/stats');
      const adminStats = statsRes.data?.data;
      
      setStats({
        totalUsers: adminStats.totalUsers || 0,
        totalTrucks: adminStats.totalTrucks || 0,
        totalBookings: adminStats.totalBookings || 0,
        activeBookings: adminStats.activeBookings || 0,
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
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
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('phone', formData.phone);
      form.append('address', formData.address);
      if (formData.profileImage) {
        form.append('profileImage', formData.profileImage);
      }

      const response = await axiosInstance.put('/admin/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        const updatedUser = { ...(profileUser || user || {}), ...response.data.data };
        setProfileUser(updatedUser);
        updateUser(updatedUser);
        setIsEditing(false);
        
        setFormData(prev => ({
          ...prev,
          profileImage: null,
          profileImagePreview: response.data.data.profileImageUrl || null
        }));

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

  const handleDirectUpload = async (file) => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const form = new FormData();
      form.append('profileImage', file);

      const response = await axiosInstance.put('/admin/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        const updatedUser = { ...(profileUser || user || {}), ...response.data.data };
        setProfileUser(updatedUser);
        updateUser(updatedUser);
        
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

  const formatDate = (date) => {
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

  const getValue = (value, fallback = 'Not provided') => {
    if (value === null || value === undefined || value === '') return fallback;
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-gray-500 border-t-black"></div>
          <p className="mt-4 text-sm font-medium text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-3 sm:py-5 lg:py-7">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Message Banner */}
        {message.text && (
          <div
            className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-gray-100 text-black border-gray-300'
                : 'bg-gray-200 text-black border-gray-400'
            }`}
          >
            <p className="font-semibold text-sm">{message.text}</p>
          </div>
        )}

        {/* Main Container */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Cover Photo Area - Advanced Design */}
          <div className="h-40 sm:h-56 w-full relative overflow-hidden">
            {/* Multi-layer gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            
            {/* Geometric pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-transparent to-gray-600/20 animate-pulse"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center px-4">
                {/* Top decorative line */}
                <div className="w-20 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-4"></div>
                
                {/* Main title with icon */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-wide">System Administrator</div>
                    <div className="text-xs sm:text-sm font-light opacity-90 tracking-widest uppercase">Management System</div>
                  </div>
                </div>
                
                {/* Status badges */}
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Verified Account</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-gray-500/20 backdrop-blur-sm rounded-full border border-gray-400/30">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium">Admin Level</span>
                  </div>
                </div>
                
                {/* Platform info */}
                <div className="text-xs opacity-75 font-light">
                  CargoNepal Management Platform • Enterprise Edition
                </div>
                
                {/* Bottom decorative line */}
                <div className="w-20 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mt-4"></div>
              </div>
            </div>
            
            {/* Corner decorations */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/20"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/20"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/20"></div>
          </div>

          {/* Profile Header & Info */}
          <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:pb-6 relative border-b border-gray-200">
            {/* Profile Picture */}
            <div className="relative -mt-16 sm:-mt-24 w-28 h-28 sm:w-40 sm:h-40 mx-auto sm:mx-0 group">
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-lg ring-4 ring-gray-100 overflow-hidden cursor-pointer"
                   onClick={() => setShowProfileOptions(true)}>
                {profileUser?.profileImageUrl ? (
                  <img
                    src={profileUser?.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <div
                  className="w-full h-full flex items-center justify-center bg-gray-200"
                  style={{ display: profileUser?.profileImageUrl ? 'none' : 'flex' }}
                >
                  <span className="text-black font-extrabold text-3xl sm:text-4xl">
                    {profileUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
              {/* Admin Badge - Scalloped design */}
              <div className="absolute -bottom-1 -right-1">
                <VerifiedBadge size={24} />
              </div>
              {/* Edit Profile Picture Overlay */}
              {isEditing && (
                <div className="absolute inset-0 w-full h-full rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                     onClick={(e) => {
                       e.stopPropagation();
                       document.getElementById('profileImageInput')?.click();
                     }}>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name and Details */}
            <div className="sm:ml-44 mt-3 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-black truncate">
                {getValue(profileUser?.name, 'Administrator')}
              </h1>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* First Row - Intro and Statistics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminIntroCard user={profileUser} formatDate={formatDate} getValue={getValue} />
              <AdminStatsCard stats={stats} profileUser={profileUser} />
            </div>

            {/* Edit Form */}
            <div>
              {isEditing ? (
                <EditAdminProfileForm
                  user={profileUser}
                  formData={formData}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                  submitting={submitting}
                  setCameraOpen={setCameraOpen}
                />
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Hidden file input */}
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
                    // Try mobile camera input first, fallback to camera modal
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
                    } else {
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
        )}
        
        <CameraModal isOpen={cameraOpen} onCapture={handleCapture} onClose={() => setCameraOpen(false)} />
        
        {/* Floating Action Button for Edit Profile */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Edit Profile
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

// Helper Components
const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
    <div className="p-6 border-b border-gray-100">
      <h3 className="text-lg font-black text-black tracking-tight">{title}</h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const AdminIntroCard = ({ user, formatDate, getValue }) => {
  return (
    <Card title="Administrator Information">
      <div className="space-y-3 text-sm">
        <DetailField label="Account Type" value="SYSTEM ADMINISTRATOR" icon="shield" />
        <DetailField label="Email" value={getValue(user?.email)} icon="mail" />
        <DetailField label="Phone" value={getValue(user?.phone)} icon="phone" />
        <DetailField label="Address" value={getValue(user?.address)} icon="location" />
        <DetailField label="Admin Since" value={formatDate(user?.createdAt)} icon="calendar" />
      </div>
    </Card>
  );
};

const AdminStatsCard = ({ stats, profileUser }) => {
  return (
    <Card title="Platform Statistics">
      <div className="flex flex-wrap gap-3">
        <StatCard 
          label="Total Users" 
          value={stats.totalUsers.toString()}
          icon={
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          hasData={stats.totalUsers > 0}
        />
        <StatCard 
          label="Total Trucks" 
          value={stats.totalTrucks.toString()}
          icon={
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          hasData={stats.totalTrucks > 0}
        />
        <StatCard 
          label="Total Bookings" 
          value={stats.totalBookings.toString()}
          icon={
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          hasData={stats.totalBookings > 0}
        />
        <StatCard 
          label="Active Bookings" 
          value={stats.activeBookings.toString()}
          icon={
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          hasData={stats.activeBookings > 0}
        />
      </div>
    </Card>
  );
};

const StatCard = ({ label, value, icon, hasData = true }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 text-center hover:shadow-sm transition-all duration-200 flex-1 min-w-[120px]">
      <div className="flex items-center justify-center gap-2 mb-1">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-lg font-black text-black">{value}</p>
      {!hasData && (
        <p className="text-xs text-gray-500 mt-1">No data yet</p>
      )}
    </div>
  );
};

const DetailField = ({ label, value, icon }) => {
  const getIcon = (iconType) => {
    const icons = {
      shield: (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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
    };
    return icons[iconType] || icons.shield;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200">
      <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg border border-gray-300 flex items-center justify-center">
        {getIcon(icon)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
};

const EditAdminProfileForm = ({
  user,
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  setCameraOpen,
}) => {
  return (
    <Card title="Edit Administrator Profile">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Profile Picture Section */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Profile Picture
          </h4>
          <div className="space-y-4">
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
                onClick={() => {
                  // Try mobile camera input first, fallback to camera modal
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
                  } else {
                    setCameraOpen(true);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Photo
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
};

const FormField = ({ label, name, value, onChange, type = 'text', disabled = false, className = '', required = false, icon, ...props }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent ${icon ? 'pl-10' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default AdminProfile;
