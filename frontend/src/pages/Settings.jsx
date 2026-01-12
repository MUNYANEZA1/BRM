import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, User, Bell, Shield, CreditCard, Globe, Printer, Check, X, AlertCircle } from 'lucide-react';
import { settingsAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    restaurantName: '',
    phone: '',
    address: '',
    currency: 'RWF',
    timezone: 'Africa/Kigali',
    taxRate: 18,
    serviceCharge: 10,
  });

  // Profile Settings State
  const [profileSettings, setProfileSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Security Settings State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getSettings();
        // API returns { success: true, data: settings }
        return response.data?.data || response.data;
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        return null;
      }
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch current user profile
  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user;
      } catch {
        return {};
      }
    },
  });

  // Update general settings mutation
  const updateGeneralMutation = useMutation({
    mutationFn: async (data) => {
      const response = await settingsAPI.updateSettings(data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('General settings saved successfully');
      // Invalidate and refetch settings cache
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // Update dashboard layout
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to save general settings');
      console.error(error);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Use the AuthContext's updateProfile method to update both localStorage and context state
      const result = await updateProfile(data);
      return result;
    },
    onSuccess: (data) => {
      // Invalidate userProfile query cache so all components see updated data
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
      console.error(error);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Password changed successfully');
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to change password');
      console.error(error);
    },
  });

  // Initialize settings from data
  useEffect(() => {
    if (settingsData) {
      setGeneralSettings(prev => ({
        ...prev,
        ...settingsData
      }));
    }
  }, [settingsData]);

  // Initialize profile from user data
  useEffect(() => {
    if (userProfile && Object.keys(userProfile).length > 0) {
      setProfileSettings({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile]);

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    updateGeneralMutation.mutate(generalSettings);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileSettings);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'printing', name: 'Printing', icon: Printer },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your restaurant settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                <p className="text-sm text-gray-600">Basic restaurant information and preferences</p>
              </div>
              <div className="card-content">
                {settingsLoading ? (
                  <LoadingSpinner />
                ) : !isAdminOrManager ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Access Restricted</h4>
                      <p className="text-yellow-700 text-sm">Only Admins and Managers can modify general restaurant settings. Please contact your manager for access.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleGeneralSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Restaurant Name
                        </label>
                        <input
                          type="text"
                          value={generalSettings.restaurantName}
                          onChange={(e) => setGeneralSettings({...generalSettings, restaurantName: e.target.value})}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={generalSettings.phone}
                          onChange={(e) => setGeneralSettings({...generalSettings, phone: e.target.value})}
                          className="input w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={generalSettings.address}
                        onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                        className="input w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select 
                          value={generalSettings.currency}
                          onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                          className="input w-full"
                        >
                          <option value="RWF">Rwandan Franc (RWF)</option>
                          <option value="USD">US Dollar (USD)</option>
                          <option value="EUR">Euro (EUR)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select 
                          value={generalSettings.timezone}
                          onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                          className="input w-full"
                        >
                          <option value="Africa/Kigali">Africa/Kigali</option>
                          <option value="UTC">UTC</option>
                          <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={generalSettings.taxRate}
                          onChange={(e) => setGeneralSettings({...generalSettings, taxRate: parseFloat(e.target.value)})}
                          step="0.01"
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Charge (%)
                        </label>
                        <input
                          type="number"
                          value={generalSettings.serviceCharge}
                          onChange={(e) => setGeneralSettings({...generalSettings, serviceCharge: parseFloat(e.target.value)})}
                          step="0.01"
                          className="input w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={updateGeneralMutation.isPending}
                        className="btn-primary flex items-center disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateGeneralMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
                <p className="text-sm text-gray-600">Manage your personal account information</p>
              </div>
              <div className="card-content">
                {userLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    {/* Current User Info Display */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current User</p>
                          <p className="text-lg font-semibold text-gray-900">{user?.fullName || 'N/A'}</p>
                          <p className="text-sm text-gray-600 capitalize">{user?.email} • {user?.role}</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileSettings.firstName}
                          onChange={(e) => setProfileSettings({...profileSettings, firstName: e.target.value})}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileSettings.lastName}
                          onChange={(e) => setProfileSettings({...profileSettings, lastName: e.target.value})}
                          className="input w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileSettings.email}
                        onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileSettings.phone}
                        onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                        className="input w-full"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="btn-primary flex items-center disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                <p className="text-sm text-gray-600">Configure how you receive notifications</p>
              </div>
              <div className="card-content">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Order Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">New Orders</p>
                          <p className="text-sm text-gray-500">Get notified when new orders are placed</p>
                        </div>
                        <input type="checkbox" defaultChecked className="toggle" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order Updates</p>
                          <p className="text-sm text-gray-500">Get notified when order status changes</p>
                        </div>
                        <input type="checkbox" defaultChecked className="toggle" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Inventory Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Low Stock Alerts</p>
                          <p className="text-sm text-gray-500">Get notified when items are running low</p>
                        </div>
                        <input type="checkbox" defaultChecked className="toggle" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Expiry Alerts</p>
                          <p className="text-sm text-gray-500">Get notified when items are about to expire</p>
                        </div>
                        <input type="checkbox" defaultChecked className="toggle" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">System Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">System Updates</p>
                          <p className="text-sm text-gray-500">Get notified about system updates and maintenance</p>
                        </div>
                        <input type="checkbox" className="toggle" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                          <p className="text-sm text-gray-500">Get notified about security-related events</p>
                        </div>
                        <input type="checkbox" defaultChecked className="toggle" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                  <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                </div>
                <div className="card-content">
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="input w-full"
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="input w-full"
                        placeholder="Enter new password (minimum 6 characters)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="input w-full"
                        placeholder="Confirm your new password"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={changePasswordMutation.isPending}
                        className="btn-primary flex items-center disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Security Status</h3>
                  <p className="text-sm text-gray-600">View your account security information</p>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Account Status</p>
                          <p className="text-sm text-gray-600">Your account is secure</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Password Last Changed</p>
                        <p className="text-sm text-gray-600">Keep your password strong and unique</p>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Verification</p>
                        <p className="text-sm text-gray-600">Your email is verified and active</p>
                      </div>
                      <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
                <p className="text-sm text-gray-600">Manage your subscription and billing details</p>
              </div>
              <div className="card-content">
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-green-900">Pro Plan</h4>
                        <p className="text-sm text-green-700">$99/month • Next billing: Oct 5, 2024</p>
                      </div>
                      <button className="btn-outline">
                        Manage Plan
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Payment Method</h4>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-500">Expires 12/25</p>
                          </div>
                        </div>
                        <button className="btn-outline">
                          Update
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Billing History</h4>
                    <div className="space-y-3">
                      {[
                        { date: 'Sep 5, 2024', amount: '$99.00', status: 'Paid' },
                        { date: 'Aug 5, 2024', amount: '$99.00', status: 'Paid' },
                        { date: 'Jul 5, 2024', amount: '$99.00', status: 'Paid' },
                      ].map((invoice, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invoice.date}</p>
                            <p className="text-sm text-gray-500">{invoice.amount}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              {invoice.status}
                            </span>
                            <button className="text-primary-600 hover:text-primary-900 text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'printing' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Printing Settings</h3>
                <p className="text-sm text-gray-600">Configure receipt and kitchen printing options</p>
              </div>
              <div className="card-content">
                <form className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Receipt Printer</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Printer Name
                        </label>
                        <select className="input w-full">
                          <option>Receipt Printer 1</option>
                          <option>Receipt Printer 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paper Size
                        </label>
                        <select className="input w-full">
                          <option>80mm</option>
                          <option>58mm</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Kitchen Printer</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Printer Name
                        </label>
                        <select className="input w-full">
                          <option>Kitchen Printer 1</option>
                          <option>Kitchen Printer 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto Print
                        </label>
                        <select className="input w-full">
                          <option>On Order Confirmation</option>
                          <option>On Order Creation</option>
                          <option>Manual Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Print Options</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <label className="text-sm text-gray-700">Print customer copy automatically</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <label className="text-sm text-gray-700">Print kitchen copy for dine-in orders</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <label className="text-sm text-gray-700">Print order summary at end of day</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

