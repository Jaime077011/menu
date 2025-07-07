import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import {
  CogIcon,
  UserIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  BellIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface AdminProfile {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  restaurant: {
    id: string;
    name: string;
    subdomain: string;
    subscriptionStatus: string;
    trialEndsAt?: string;
    plan?: {
      name: string;
      price: number;
      currency: string;
    };
  };
  notifications?: {
    newOrders: boolean;
    orderUpdates: boolean;
    lowStock: boolean;
    billing: boolean;
    system: boolean;
  };
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileForm {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
}

export default function AdminSettings() {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Form states
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: ''
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    lowStock: true,
    billing: true,
    system: true
  });

  // Get dynamic subdomain URL
  const getSubdomainUrl = () => {
    if (typeof window === 'undefined') return '';
    const host = window.location.host;
    const protocol = window.location.protocol;
    if (adminProfile?.restaurant.subdomain) {
      return `${protocol}//${adminProfile.restaurant.subdomain}.${host.replace(/^[^.]+\./, '')}`;
    }
    return '';
  };

  // Load admin profile data
  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    try {
      // In a real app, this would come from session/auth
      const response = await fetch('/api/admin/profile');
      if (response.ok) {
        const data = await response.json();
        setAdminProfile(data.profile);
        setProfileForm({
          restaurantName: data.profile.restaurant?.name || '',
          ownerName: data.profile.ownerName || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          address: data.profile.address || ''
        });
        
        // Set notifications if available
        if (data.profile.notifications) {
          setNotifications(data.profile.notifications);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminProfile?.email || ''
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch('/api/admin/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminProfile?.email || ''
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        loadAdminProfile(); // Reload data
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setError('');
    setSaving(true);

    try {
      const response = await fetch('/api/admin/update-notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminProfile?.email || ''
        },
        body: JSON.stringify({ notifications }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Notification preferences updated successfully!');
        loadAdminProfile(); // Reload data
      } else {
        setError(data.error || 'Failed to update notification preferences');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
              <style jsx global>{`
        * {
          scrollbar-width: thin !important;
          scrollbar-color: #f97316 #111827 !important;
        }
        *::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        *::-webkit-scrollbar-track {
          background: #111827 !important;
          border-radius: 4px !important;
        }
        *::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #f97316, #eab308) !important;
          border-radius: 4px !important;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #ea580c, #ca8a04) !important;
        }
        html, body {
          color-scheme: dark !important;
        }
      `}</style>

        <AdminLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center animate-pulse">
                <CogIcon className="w-8 h-8 text-white" />
              </div>
              <div className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono text-lg`}>LOADING SETTINGS...</div>
            </div>
          </div>
        </AdminLayout>
      </>
    );
  }

  const tabs = [
    { id: 'profile', name: 'PROFILE', icon: UserIcon },
    { id: 'security', name: 'SECURITY', icon: ShieldCheckIcon },
    { id: 'restaurant', name: 'RESTAURANT', icon: BuildingStorefrontIcon },
    { id: 'notifications', name: 'NOTIFICATIONS', icon: BellIcon },
    { id: 'billing', name: 'BILLING', icon: CreditCardIcon }
  ];

  return (
    <>
      <Head>
        <title>🍽 Admin Settings - Restaurant Configuration</title>
      </Head>

      <style jsx global>{`
        * {
          scrollbar-width: thin !important;
          scrollbar-color: #f97316 #111827 !important;
        }
        *::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        *::-webkit-scrollbar-track {
          background: #111827 !important;
          border-radius: 4px !important;
        }
        *::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #f97316, #eab308) !important;
          border-radius: 4px !important;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #ea580c, #ca8a04) !important;
        }
        html, body {
          color-scheme: dark !important;
        }
      `}</style>

      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className={`text-3xl font-mono font-bold bg-gradient-to-r ${
                actualTheme === 'dark' 
                  ? 'from-white via-amber-200 to-orange-300' 
                  : 'from-gray-800 via-amber-600 to-orange-700'
              } bg-clip-text text-transparent`}>
                RESTAURANT SETTINGS
              </h1>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                System configuration and account management
              </p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-500/20 border border-green-400/30 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                  <CheckCircleIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-green-500 font-mono font-bold">{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mr-3">
                  <ExclamationTriangleIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-red-500 font-mono font-bold">{error}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-80">
              <nav className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-lg p-6`}>
                <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>SYSTEM MODULES</h3>
                <ul className="space-y-3">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => {
                            setActiveTab(tab.id);
                            setError('');
                            setSuccess('');
                          }}
                          className={`w-full text-left px-4 py-4 rounded-lg flex items-center space-x-3 transition-all duration-300 font-mono font-bold ${
                            activeTab === tab.id
                              ? `bg-gradient-to-r from-amber-600/20 to-orange-600/20 ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} border border-amber-600/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]`
                              : `${actualTheme === 'dark' ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'} border border-transparent`
                          }`}
                        >
                          <div className={`w-6 h-6 ${activeTab === tab.id ? 'text-amber-500' : (actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                            <IconComponent />
                          </div>
                          <span>{tab.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-lg shadow-xl`}>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>PROFILE CONFIGURATION</h2>
                    </div>
                    
                    <form onSubmit={handleProfileUpdate} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'} mb-3`}>
                            RESTAURANT NAME
                          </label>
                          <input
                            type="text"
                            value={profileForm.restaurantName}
                            onChange={(e) => setProfileForm({...profileForm, restaurantName: e.target.value})}
                            className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                            required
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'} mb-3`}>
                            OWNER NAME
                          </label>
                          <input
                            type="text"
                            value={profileForm.ownerName}
                            onChange={(e) => setProfileForm({...profileForm, ownerName: e.target.value})}
                            className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-3`}>
                            EMAIL ADDRESS
                          </label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                            required
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} mb-3`}>
                            PHONE NUMBER
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'} mb-3`}>
                          RESTAURANT ADDRESS
                        </label>
                        <textarea
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          rows={4}
                          className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                          placeholder="Enter your restaurant's full address"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-mono font-bold transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <ShieldCheckIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>SECURITY PROTOCOLS</h2>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Change Password */}
                      <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'} border rounded-lg p-6`}>
                        <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                          <LockClosedIcon className="w-5 h-5 mr-2 text-red-500" />
                          PASSWORD MANAGEMENT
                        </h3>
                        <form onSubmit={handlePasswordChange} className="space-y-6">
                          <div>
                            <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-3`}>
                              CURRENT PASSWORD
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? "text" : "password"}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'} pr-12`}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                {showPasswords.current ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-3`}>
                                NEW PASSWORD
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.new ? "text" : "password"}
                                  value={passwordForm.newPassword}
                                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                  className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'} pr-12`}
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  {showPasswords.new ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'} mb-3`}>
                                CONFIRM PASSWORD
                              </label>
                              <div className="relative">
                                <input
                                  type={showPasswords.confirm ? "text" : "password"}
                                  value={passwordForm.confirmPassword}
                                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                  className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 ${actualTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'} pr-12`}
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  {showPasswords.confirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={saving}
                              className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-lg font-mono font-bold transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? 'UPDATING...' : 'UPDATE PASSWORD'}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Security Status */}
                      <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-1">
                            <CheckCircleIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>ACCOUNT SECURED</p>
                            <p className="text-sm font-mono text-green-500 mt-2">Your account is protected with encrypted passwords and secure authentication protocols.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Restaurant Tab */}
                {activeTab === 'restaurant' && (
                  <div className="p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                        <BuildingStorefrontIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>RESTAURANT CONTROL CENTER</h2>
                    </div>
                    
                    {adminProfile && (
                      <div className="space-y-8">
                        <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'} border rounded-lg p-6`}>
                          <h3 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 text-lg`}>SYSTEM INFORMATION</h3>
                          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <dt className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'} mb-2`}>RESTAURANT NAME</dt>
                              <dd className={`text-lg font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{adminProfile.restaurant?.name || 'Not Set'}</dd>
                            </div>
                            <div>
                              <dt className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'} mb-2`}>SUBDOMAIN</dt>
                              <dd className={`text-lg font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {adminProfile.restaurant.subdomain}
                                {typeof window !== 'undefined' && (
                                  <span className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm ml-2`}>
                                    ({window.location.host})
                                  </span>
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-2`}>SUBSCRIPTION STATUS</dt>
                              <dd className="text-sm">
                                <span className={`inline-flex px-3 py-1 text-xs font-mono font-bold rounded-full ${
                                  adminProfile.restaurant.subscriptionStatus === 'TRIAL' 
                                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-400/30'
                                    : adminProfile.restaurant.subscriptionStatus === 'ACTIVE'
                                    ? 'bg-green-500/20 text-green-500 border border-green-400/30'
                                    : 'bg-red-500/20 text-red-500 border border-red-400/30'
                                }`}>
                                  {adminProfile.restaurant.subscriptionStatus}
                                </span>
                              </dd>
                            </div>
                            {adminProfile.restaurant.trialEndsAt && (
                              <div>
                                <dt className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} mb-2`}>TRIAL EXPIRES</dt>
                                <dd className={`text-lg font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {new Date(adminProfile.restaurant.trialEndsAt).toLocaleDateString()}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={() => router.push('/admin/menu')}
                            className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-700 hover:border-amber-600/50' : 'border-gray-200 hover:border-amber-600/50'} rounded-lg transition-all duration-300 text-left group`}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                                <DocumentTextIcon className="w-5 h-5 text-white" />
                              </div>
                              <h4 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>MENU MANAGEMENT</h4>
                            </div>
                            <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Configure menu items and categories</p>
                          </button>

                          <button
                            onClick={() => router.push('/admin/waiter-settings')}
                            className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-700 hover:border-orange-600/50' : 'border-gray-200 hover:border-orange-600/50'} rounded-lg transition-all duration-300 text-left group`}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-white" />
                              </div>
                              <h4 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AI WAITER SETTINGS</h4>
                            </div>
                            <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Configure AI personality and responses</p>
                          </button>

                          <button
                            onClick={() => router.push('/admin/qr-codes')}
                            className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-700 hover:border-green-500/50' : 'border-gray-200 hover:border-green-500/50'} rounded-lg transition-all duration-300 text-left group`}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                                <CogIcon className="w-5 h-5 text-white" />
                              </div>
                              <h4 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>QR CODE GENERATOR</h4>
                            </div>
                            <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Generate and manage table QR codes</p>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <BellIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>NOTIFICATION PROTOCOLS</h2>
                    </div>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>EMAIL NOTIFICATIONS</h3>
                        <div className="space-y-4">
                          {[
                            { id: 'newOrders', label: 'NEW ORDERS', description: 'Get notified when customers place new orders', color: 'amber' },
                            { id: 'orderUpdates', label: 'ORDER UPDATES', description: 'Notifications about order status changes', color: 'orange' },
                            { id: 'lowStock', label: 'LOW STOCK ALERTS', description: 'Alert when menu items are running low', color: 'yellow' },
                            { id: 'billing', label: 'BILLING & PAYMENTS', description: 'Updates about subscription and billing', color: 'green' },
                            { id: 'system', label: 'SYSTEM UPDATES', description: 'Important system and feature updates', color: 'red' }
                          ].map((notification) => (
                            <div key={notification.id} className={`flex items-start justify-between p-6 ${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'} border rounded-lg`}>
                              <div className="flex-1">
                                <h4 className={`font-mono font-bold text-${notification.color}-500 text-lg`}>{notification.label}</h4>
                                <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{notification.description}</p>
                              </div>
                              <label className="flex items-center ml-4">
                                <input
                                  type="checkbox"
                                  checked={notifications[notification.id as keyof typeof notifications]}
                                  onChange={(e) => setNotifications({
                                    ...notifications,
                                    [notification.id]: e.target.checked
                                  })}
                                  className={`h-5 w-5 text-amber-600 focus:ring-amber-600 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} rounded`}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button 
                          onClick={handleNotificationUpdate}
                          disabled={saving}
                          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg font-mono font-bold transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'SAVING...' : 'SAVE NOTIFICATION SETTINGS'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                  <div className="p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>BILLING & SUBSCRIPTION</h2>
                    </div>
                    
                    <div className="space-y-8">
                      {adminProfile && (
                        <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>CURRENT PLAN</h3>
                              <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                {adminProfile.restaurant.plan?.name || 
                                 (adminProfile.restaurant.subscriptionStatus === 'TRIAL' ? 'FREE TRIAL' : 
                                  adminProfile.restaurant.subscriptionStatus.replace('_', ' ').toUpperCase())}
                              </p>
                              {adminProfile.restaurant.trialEndsAt && (
                                <p className="text-sm font-mono text-amber-600 mt-2">
                                  TRIAL ENDS: {new Date(adminProfile.restaurant.trialEndsAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-mono font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                {adminProfile.restaurant.plan?.currency || '$'}
                                {adminProfile.restaurant.plan?.price || 
                                 (adminProfile.restaurant.subscriptionStatus === 'TRIAL' ? '0' : '29')}
                              </div>
                              <div className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>per month</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                          onClick={() => router.push('/admin/billing')}
                          className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-700 hover:border-amber-600/50' : 'border-gray-200 hover:border-amber-600/50'} rounded-lg transition-all duration-300 text-left group`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>VIEW INVOICES</h4>
                              <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Download and view billing history</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => router.push('/admin/upgrade')}
                          className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-700 hover:border-green-500/50' : 'border-gray-200 hover:border-green-500/50'} rounded-lg transition-all duration-300 text-left group`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg`}>UPGRADE PLAN</h4>
                              <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Unlock premium features and capabilities</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
} 