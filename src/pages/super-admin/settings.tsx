import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { type GetServerSideProps } from "next";
import { api } from "@/utils/api";
import { getSuperAdminSessionFromCookies } from "@/utils/superAdminAuth";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useTheme } from '@/contexts/ThemeContext';
import { hasPermission } from '@/utils/roles';

interface SuperAdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface Props {
  user: SuperAdminUser;
}

interface PlatformSettings {
  platformName: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  maxRestaurantsPerAdmin: number;
  maxMenuItemsPerRestaurant: number;
  sessionTimeoutHours: number;
  supportEmail: string;
  platformDescription: string;
  apiRateLimitPerMinute: number;
  enableAuditLogging: boolean;
}

export default function PlatformSettings({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Default settings (in a real app, these would come from database)
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: "Restaurant AI Platform",
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxRestaurantsPerAdmin: 5,
    maxMenuItemsPerRestaurant: 100,
    sessionTimeoutHours: 168, // 7 days
    supportEmail: "support@restaurant.ai",
    platformDescription: "AI-powered restaurant menu management system",
    apiRateLimitPerMinute: 60,
    enableAuditLogging: true,
  });

  const handleInputChange = (field: keyof PlatformSettings, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
    setError("");
  };

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, you would save to database via tRPC
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess("Platform settings saved successfully!");
      setUnsavedChanges(false);
      setError("");
    } catch (err) {
      setError("Failed to save settings. Please try again.");
      setSuccess("");
    }
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      setSettings({
        platformName: "Restaurant AI Platform",
        maintenanceMode: false,
        allowNewRegistrations: true,
        maxRestaurantsPerAdmin: 5,
        maxMenuItemsPerRestaurant: 100,
        sessionTimeoutHours: 168,
        supportEmail: "support@restaurant.ai",
        platformDescription: "AI-powered restaurant menu management system",
        apiRateLimitPerMinute: 60,
        enableAuditLogging: true,
      });
      setUnsavedChanges(true);
      setSuccess("");
      setError("");
    }
  };

  return (
    <SuperAdminLayout user={user} title="Platform Settings">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">⚙️</span>
            <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
              RESTAURANT PLATFORM SETTINGS
            </h1>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>System Configuration & Preferences</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg font-mono text-sm backdrop-blur-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/50 border border-green-400 text-green-300 px-4 py-3 rounded-lg font-mono text-sm backdrop-blur-sm">
            {success}
          </div>
        )}

        {unsavedChanges && (
          <div className="bg-yellow-900/50 border border-yellow-400 text-yellow-300 px-4 py-3 rounded-lg font-mono text-sm backdrop-blur-sm">
            ⚠️ You have unsaved changes. Don't forget to save your settings.
          </div>
        )}

        {/* General Settings */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">🔧</span>
            </div>
            <h3 className="text-lg font-mono font-bold text-amber-400">GENERAL SETTINGS</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-mono font-bold text-amber-400 mb-2">
                PLATFORM NAME
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleInputChange("platformName", e.target.value)}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                placeholder="Restaurant AI Platform"
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold text-amber-400 mb-2">
                SUPPORT EMAIL
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                placeholder="support@restaurant.ai"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-mono font-bold text-amber-400 mb-2">
                PLATFORM DESCRIPTION
              </label>
              <textarea
                value={settings.platformDescription}
                onChange={(e) => handleInputChange("platformDescription", e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono resize-none`}
                placeholder="AI-powered restaurant menu management system"
              />
            </div>
          </div>
        </div>

        {/* System Limits */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
            <h3 className="text-lg font-mono font-bold text-orange-400">SYSTEM LIMITS</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-mono font-bold text-orange-400 mb-2">
                MAX RESTAURANTS PER ADMIN
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxRestaurantsPerAdmin}
                onChange={(e) => handleInputChange("maxRestaurantsPerAdmin", parseInt(e.target.value) || 1)}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 font-mono`}
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold text-orange-400 mb-2">
                MAX MENU ITEMS PER RESTAURANT
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={settings.maxMenuItemsPerRestaurant}
                onChange={(e) => handleInputChange("maxMenuItemsPerRestaurant", parseInt(e.target.value) || 10)}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 font-mono`}
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold text-orange-400 mb-2">
                API RATE LIMIT (PER MINUTE)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={settings.apiRateLimitPerMinute}
                onChange={(e) => handleInputChange("apiRateLimitPerMinute", parseInt(e.target.value) || 10)}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 font-mono`}
              />
            </div>

            <div>
              <label className="block text-sm font-mono font-bold text-orange-400 mb-2">
                SESSION TIMEOUT (HOURS)
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={settings.sessionTimeoutHours}
                onChange={(e) => handleInputChange("sessionTimeoutHours", parseInt(e.target.value) || 1)}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 font-mono`}
              />
              <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1 font-mono`}>
                Current: {settings.sessionTimeoutHours} hours ({Math.round(settings.sessionTimeoutHours / 24)} days)
              </p>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-r from-red-600 to-red-700 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">🔒</span>
            </div>
            <h3 className="text-lg font-mono font-bold text-red-400">SECURITY & ACCESS</h3>
          </div>
          
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 ${actualTheme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100/30'} rounded-lg`}>
              <div>
                <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>MAINTENANCE MODE</h4>
                <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                  Prevent new users from accessing the platform
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600`}></div>
              </label>
            </div>

            <div className={`flex items-center justify-between p-4 ${actualTheme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100/30'} rounded-lg`}>
              <div>
                <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>ALLOW NEW REGISTRATIONS</h4>
                <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                  Allow new restaurant admins to register
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowNewRegistrations}
                  onChange={(e) => handleInputChange("allowNewRegistrations", e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}></div>
              </label>
            </div>

            <div className={`flex items-center justify-between p-4 ${actualTheme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100/30'} rounded-lg`}>
              <div>
                <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>ENABLE AUDIT LOGGING</h4>
                <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                  Log all administrative actions for security
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAuditLogging}
                  onChange={(e) => handleInputChange("enableAuditLogging", e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600`}></div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>SAVE CHANGES</h3>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                Apply your configuration changes to the platform
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleResetSettings}
                className={`px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-700'} border rounded-lg font-mono text-sm transition-all duration-300`}
              >
                🔄 RESET TO DEFAULTS
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={!unsavedChanges}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
                  unsavedChanges
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                    : `${actualTheme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                }`}
              >
                💾 SAVE SETTINGS
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-green-700 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">📈</span>
            </div>
            <h3 className="text-lg font-mono font-bold text-green-400">SYSTEM STATUS</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-400 font-mono">PLATFORM STATUS</p>
                  <p className="text-lg font-bold text-green-300 font-mono">
                    {settings.maintenanceMode ? "MAINTENANCE" : "OPERATIONAL"}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${settings.maintenanceMode ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
              </div>
            </div>

            <div className="bg-amber-900/20 border border-amber-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-400 font-mono">REGISTRATIONS</p>
                  <p className="text-lg font-bold text-amber-300 font-mono">
                    {settings.allowNewRegistrations ? "ENABLED" : "DISABLED"}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${settings.allowNewRegistrations ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
            </div>

            <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400 font-mono">AUDIT LOGGING</p>
                  <p className="text-lg font-bold text-orange-300 font-mono">
                    {settings.enableAuditLogging ? "ACTIVE" : "INACTIVE"}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${settings.enableAuditLogging ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const cookies = context.req.headers.cookie || "";
  
  try {
    const session = await getSuperAdminSessionFromCookies(cookies);
    
    if (!session) {
      return {
        redirect: {
          destination: "/super-admin/login",
          permanent: false,
        },
      };
    }

    // Check if user has permission to manage settings
    if (!hasPermission(session.role, "canManageSettings")) {
      return {
        redirect: {
          destination: "/super-admin?access=denied",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: {
          id: session.id,
          email: session.email,
          name: session.name || null,
          role: session.role,
        },
      },
    };
  } catch (error) {
    console.error("Super admin session verification error:", error);
    return {
      redirect: {
        destination: "/super-admin/login",
        permanent: false,
      },
    };
  }
}; 