import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { AuthContext } from '../../context/AuthContext';

const AdminNotificationSettings = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    emailTypes: {
      new_user: true,
      new_truck: true,
      booking_updates: true,
      reviews: true,
      contact_forms: true,
      system_alerts: true
    },
    pushNotifications: true,
    pushTypes: {
      new_user: true,
      new_truck: true,
      booking_updates: true,
      reviews: true,
      contact_forms: true,
      system_alerts: true
    },
    autoMarkAsRead: {
      after_hours: 24, // hours
      low_priority: true,
      system_notifications: true
    },
    batchNotifications: true,
    maxNotificationsPerHour: 10,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchSettings();
    }
  }, [isAuthenticated, user]);

  const fetchSettings = async () => {
    try {
      const response = await axiosInstance.get('/admin/notification-settings');
      if (response.data.success) {
        setSettings(response.data.data || settings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await axiosInstance.put('/admin/notification-settings', settings);
      if (response.data.success) {
        // Show success message
        alert('Notification settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (category, field) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  const handleValueChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleGlobalToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Notification Settings</h1>
          <p className="text-gray-600">Configure how you receive notifications and alerts</p>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Email Notifications</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Enable Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <button
                onClick={() => handleGlobalToggle('emailNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.emailNotifications && (
              <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-4">
                {Object.entries(settings.emailTypes).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <button
                      onClick={() => handleToggle('emailTypes', key)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        value ? 'bg-gray-800' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Push Notifications</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Enable Push Notifications</h3>
                <p className="text-sm text-gray-600">Receive real-time notifications in browser</p>
              </div>
              <button
                onClick={() => handleGlobalToggle('pushNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushNotifications ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.pushNotifications && (
              <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-4">
                {Object.entries(settings.pushTypes).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <button
                      onClick={() => handleToggle('pushTypes', key)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        value ? 'bg-gray-800' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Mark as Read */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Auto-Mark as Read</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">After Hours</h3>
                  <p className="text-sm text-gray-600">Automatically mark notifications as read after</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.autoMarkAsRead.after_hours}
                    onChange={(e) => handleValueChange('autoMarkAsRead', 'after_hours', parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-black"
                  />
                  <span className="text-sm text-gray-600">hours</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Low Priority</h3>
                  <p className="text-sm text-gray-600">Auto-mark low priority notifications as read</p>
                </div>
                <button
                  onClick={() => handleToggle('autoMarkAsRead', 'low_priority')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.autoMarkAsRead.low_priority ? 'bg-gray-800' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.autoMarkAsRead.low_priority ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">System Notifications</h3>
                  <p className="text-sm text-gray-600">Auto-mark system notifications as read</p>
                </div>
                <button
                  onClick={() => handleToggle('autoMarkAsRead', 'system_notifications')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.autoMarkAsRead.system_notifications ? 'bg-gray-800' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.autoMarkAsRead.system_notifications ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Rate Limiting</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Batch Notifications</h3>
                  <p className="text-sm text-gray-600">Group similar notifications together</p>
                </div>
                <button
                  onClick={() => handleGlobalToggle('batchNotifications')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.batchNotifications ? 'bg-gray-800' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.batchNotifications ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Max Notifications Per Hour</h3>
                  <p className="text-sm text-gray-600">Limit notifications to prevent spam</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxNotificationsPerHour}
                    onChange={(e) => handleGlobalToggle('maxNotificationsPerHour', parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Quiet Hours</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800">Enable Quiet Hours</h3>
                <p className="text-sm text-gray-600">Pause notifications during specific hours</p>
              </div>
              <button
                onClick={() => handleToggle('quietHours', 'enabled')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.quietHours.enabled ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.quietHours.enabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.quietHours.enabled && (
              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => handleValueChange('quietHours', 'start', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => handleValueChange('quietHours', 'end', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;
