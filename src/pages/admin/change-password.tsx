import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';

export default function ChangePassword() {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Head>
        <title>Change Password - Admin Dashboard</title>
      </Head>

      <AdminLayout>
        <div className="max-w-md mx-auto">
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-xl rounded-lg p-8 border backdrop-blur-sm`}>
            <div className="text-center mb-6">
              <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Change Password</h1>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                Update your admin account password
              </p>
            </div>

            {success && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-500 font-medium">
                    Password changed successfully! Redirecting...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-500">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className={`w-full px-3 py-2 border ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className={`w-full px-3 py-2 border ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className={`flex-1 ${actualTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} py-2 px-4 rounded-lg font-medium transition-all duration-300`}
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <h3 className="font-medium text-yellow-500 mb-2">Password Requirements:</h3>
              <ul className="text-sm text-yellow-500 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Include a mix of letters, numbers, and symbols</li>
                <li>• Avoid using personal information</li>
                <li>• Don't reuse old passwords</li>
              </ul>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
} 