import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from '@/contexts/ThemeContext';
import { hasPermission, getRoleColor, getRoleDisplayName } from '@/utils/roles';
import { api } from '@/utils/api';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export default function SuperAdminLayout({ children, title, user }: SuperAdminLayoutProps) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [subscriptionDropdownOpen, setSubscriptionDropdownOpen] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Add null check for user
  if (!user) {
    return (
      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING USER SESSION...</p>
        </div>
      </div>
    );
  }

  // Fetch current user permissions from database
  const { data: userPermissions, isLoading: permissionsLoading } = api.rolePermissions.getCurrentUserPermissions.useQuery();

  // Show loading while permissions are being fetched
  if (permissionsLoading) {
    return (
      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING PERMISSIONS...</p>
        </div>
      </div>
    );
  }

  // Helper function to check permissions using database data
  const checkPermission = (permission: string): boolean => {
    if (!userPermissions?.permissions) {
      return hasPermission(user.role, permission as any);
    }
    return userPermissions.permissions[permission as keyof typeof userPermissions.permissions] || false;
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/super-admin/logout", {
        method: "POST",
      });
      await router.push("/super-admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      await router.push("/super-admin/login");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // Check if current path is subscription-related
  const isSubscriptionActive = router.pathname.startsWith("/super-admin/subscriptions");
  
  // Check if current path is AI-related
  const isAiActive = router.pathname === "/super-admin/waiter-templates" || router.pathname === "/super-admin/knowledge";

  // Build navigation based on user permissions
  const allNavigation = [
    { 
      name: "Dashboard", 
      href: "/super-admin", 
      current: router.pathname === "/super-admin",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      requiresPermission: null, // Always show dashboard
    },
    { 
      name: "Restaurants", 
      href: "/super-admin/restaurants", 
      current: router.pathname === "/super-admin/restaurants",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      requiresPermission: "canManageRestaurants",
    },
    { 
      name: "Super Admins", 
      href: "/super-admin/admins", 
      current: router.pathname === "/super-admin/admins",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      requiresPermission: "canManageAdmins",
    },
    { 
      name: "AI Management", 
      href: "/super-admin/waiter-templates", 
      current: isAiActive,
      hasDropdown: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      dropdownItems: [
        { name: "Personality Templates", href: "/super-admin/waiter-templates", requiresPermission: "canManageTemplates" },
        { name: "Knowledge Library", href: "/super-admin/knowledge", requiresPermission: "canManageKnowledge" },
      ],
      requiresPermission: null, // Show if user has access to any dropdown item
    },
    { 
      name: "Subscriptions", 
      href: "/super-admin/subscriptions", 
      current: isSubscriptionActive,
      hasDropdown: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      dropdownItems: [
        { name: "Overview", href: "/super-admin/subscriptions", requiresPermission: "canViewBilling" },
        { name: "Plans Management", href: "/super-admin/subscriptions/plans", requiresPermission: "canManagePlans" },
        { name: "Restaurant Subscriptions", href: "/super-admin/subscriptions/restaurants", requiresPermission: "canViewBilling" },
        { name: "Analytics & Reports", href: "/super-admin/subscriptions/analytics", requiresPermission: "canViewBilling" },
      ],
      requiresPermission: "canViewBilling",
    },
    { 
      name: "Analytics", 
      href: "/super-admin/analytics", 
      current: router.pathname === "/super-admin/analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
        </svg>
      ),
      requiresPermission: "canViewAnalytics",
    },
    { 
      name: "Role Permissions", 
      href: "/super-admin/role-permissions", 
      current: router.pathname === "/super-admin/role-permissions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      requiresPermission: "canManageAdmins",
    },
    { 
      name: "Settings", 
      href: "/super-admin/settings", 
      current: router.pathname === "/super-admin/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      requiresPermission: "canManageSettings",
    },
  ];

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter(item => {
    // Always show items that don't require permission
    if (!item.requiresPermission) {
      // For dropdown items, check if user has access to any dropdown item
      if (item.hasDropdown && item.dropdownItems) {
        return item.dropdownItems.some(dropdownItem => 
          !dropdownItem.requiresPermission || checkPermission(dropdownItem.requiresPermission)
        );
      }
      return true;
    }
    
    // Check if user has required permission
    return checkPermission(item.requiresPermission);
  }).map(item => {
    // Filter dropdown items based on permissions
    if (item.hasDropdown && item.dropdownItems) {
      return {
        ...item,
        dropdownItems: item.dropdownItems.filter(dropdownItem => 
          !dropdownItem.requiresPermission || checkPermission(dropdownItem.requiresPermission)
        )
      };
    }
    return item;
  });

  return (
    <>
      <Head>
        <title>{title ? `${title} - 👑 Restaurant Super Admin` : "👑 Restaurant Super Admin"}</title>
        <meta name="description" content="Restaurant Super Admin Dashboard - Platform Administration" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar { 
              width: 8px !important; 
              height: 8px !important; 
            }
            html::-webkit-scrollbar-track, body::-webkit-scrollbar-track, *::-webkit-scrollbar-track { 
              background: ${actualTheme === 'dark' ? '#111827' : '#f3f4f6'} !important; 
              border-radius: 10px !important; 
            }
            html::-webkit-scrollbar-thumb, body::-webkit-scrollbar-thumb, *::-webkit-scrollbar-thumb { 
              background: linear-gradient(135deg, #f97316, #eab308) !important; 
              border-radius: 10px !important; 
            }
            * { scrollbar-color: #f97316 ${actualTheme === 'dark' ? '#111827' : '#f3f4f6'} !important; }
          `
        }} />
      </Head>
      
      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} flex overflow-hidden relative`}>
        {/* Multi-layered gradient background */}
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'}`}></div>
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-tr from-orange-900/20 via-transparent to-amber-900/20' : 'bg-gradient-to-tr from-orange-500/10 via-transparent to-amber-500/10'}`}></div>
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-bl from-transparent via-red-900/10 to-transparent' : 'bg-gradient-to-bl from-transparent via-red-500/5 to-transparent'}`}></div>
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-transparent via-gray-900/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-100/30 to-transparent'}`}></div>
        
        {/* Animated gradient orbs with staggered animations */}
        <div className={`absolute top-1/4 left-1/4 w-72 h-72 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-orange-600/10 to-amber-600/10' : 'bg-gradient-to-r from-orange-400/15 to-amber-400/15'} rounded-full blur-3xl opacity-30 animate-pulse z-0`}></div>
        <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-red-600/10 to-orange-600/10' : 'bg-gradient-to-r from-red-400/15 to-orange-400/15'} rounded-full blur-3xl opacity-25 animate-pulse z-0`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-green-600/15 to-emerald-600/15' : 'bg-gradient-to-r from-green-400/20 to-emerald-400/20'} rounded-full blur-3xl opacity-20 animate-pulse z-0`} style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle Grid Pattern */}
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)]'} bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]`}></div>
        
        {/* Radial Gradient Overlay */}
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.1),transparent_50%)]' : 'bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.08),transparent_50%)]'}`}></div>
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-[radial-gradient(circle_at_70%_80%,rgba(234,179,8,0.08),transparent_50%)]' : 'bg-[radial-gradient(circle_at_70%_80%,rgba(234,179,8,0.06),transparent_50%)]'}`}></div>
        
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className={`relative ${actualTheme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg shadow-xl max-w-md w-full mx-4`}>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 border border-red-500/30">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>SIGN OUT</h3>
                    <p className={`mt-1 text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                      Are you sure you want to sign out of your super admin account?
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium font-mono ${actualTheme === 'dark' ? 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700' : 'text-gray-700 bg-gray-200 border-gray-300 hover:bg-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600`}
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={loggingOut}
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium font-mono text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-md hover:from-red-400 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300"
                    onClick={handleSignOut}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        SIGNING OUT...
                      </>
                    ) : (
                      'SIGN OUT'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className={`relative flex-1 flex flex-col max-w-xs w-full ${actualTheme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r`}>
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-600"
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center justify-between px-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-black font-mono font-bold text-sm">👑</span>
                    </div>
                    <h1 className={`text-xl font-bold font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      SUPER ADMIN
                    </h1>
                  </div>
                  <div className="ml-2">
                    <ThemeToggle variant="icon-only" />
                  </div>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      {item.hasDropdown ? (
                        <div>
                          <button
                            onClick={() => {
                              if (item.name === "Subscriptions") {
                                setSubscriptionDropdownOpen(!subscriptionDropdownOpen);
                              } else if (item.name === "AI Management") {
                                setAiDropdownOpen(!aiDropdownOpen);
                              }
                            }}
                            className={`${
                              item.current
                                ? "bg-amber-600/20 text-amber-400 border-amber-600/30"
                                : actualTheme === 'dark' 
                                  ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            } group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md w-full text-left transition-all duration-300`}
                          >
                            {item.icon}
                            <span className="ml-3 flex-1">{item.name}</span>
                            <svg 
                              className={`ml-3 h-5 w-5 transition-transform ${
                                (item.name === "Subscriptions" && subscriptionDropdownOpen) || 
                                (item.name === "AI Management" && aiDropdownOpen) ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {((item.name === "Subscriptions" && subscriptionDropdownOpen) || 
                            (item.name === "AI Management" && aiDropdownOpen)) && (
                            <div className="mt-1 space-y-1">
                              {item.dropdownItems?.map((dropdownItem) => (
                                <Link
                                  key={dropdownItem.name}
                                  href={dropdownItem.href}
                                  className={`${
                                    router.pathname === dropdownItem.href
                                      ? "bg-orange-600/20 text-orange-400"
                                      : actualTheme === 'dark'
                                        ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                  } group flex items-center pl-11 pr-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300`}
                                >
                                  {dropdownItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`${
                            item.current
                              ? "bg-amber-600/20 text-amber-400"
                              : actualTheme === 'dark'
                                ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          } group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300`}
                        >
                          {item.icon}
                          <span className="ml-3">{item.name}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
              <div className={`flex-shrink-0 flex ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} border-t p-4`}>
                <div className="flex items-center w-full">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{user?.name || user?.email || 'Unknown User'}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-mono font-medium ${getRoleColor(user?.role || '').bg} ${getRoleColor(user?.role || '').text} border ${getRoleColor(user?.role || '').border}`}>
                        {getRoleDisplayName(user?.role || '')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`ml-3 inline-flex items-center px-3 py-2 border ${actualTheme === 'dark' ? 'border-gray-700 text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900'} shadow-sm text-sm leading-4 font-medium font-mono rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 transition-all duration-300`}
                    title="Sign Out"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20">
          <div className={`flex-1 flex flex-col min-h-0 ${actualTheme === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'} border-r backdrop-blur-sm`}>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between flex-shrink-0 px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-black font-mono font-bold text-sm">👑</span>
                  </div>
                  <h1 className={`text-xl font-bold font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    SUPER ADMIN
                  </h1>
                </div>
                <div className="ml-2">
                  <ThemeToggle variant="icon-only" />
                </div>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.hasDropdown ? (
                      <div>
                        <button
                          onClick={() => {
                            if (item.name === "Subscriptions") {
                              setSubscriptionDropdownOpen(!subscriptionDropdownOpen);
                            } else if (item.name === "AI Management") {
                              setAiDropdownOpen(!aiDropdownOpen);
                            }
                          }}
                          className={`${
                            item.current
                              ? "bg-amber-600/20 text-amber-400"
                              : actualTheme === 'dark'
                                ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          } group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md w-full text-left transition-all duration-300`}
                        >
                          {item.icon}
                          <span className="ml-3 flex-1">{item.name}</span>
                          <svg 
                            className={`ml-3 h-5 w-5 transition-transform ${
                              (item.name === "Subscriptions" && subscriptionDropdownOpen) || 
                              (item.name === "AI Management" && aiDropdownOpen) ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {((item.name === "Subscriptions" && subscriptionDropdownOpen) || 
                          (item.name === "AI Management" && aiDropdownOpen)) && (
                          <div className="mt-1 space-y-1">
                            {item.dropdownItems?.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className={`${
                                  router.pathname === dropdownItem.href
                                    ? "bg-orange-600/20 text-orange-400"
                                    : actualTheme === 'dark'
                                      ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                } group flex items-center pl-11 pr-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300`}
                              >
                                {dropdownItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`${
                          item.current
                            ? "bg-amber-600/20 text-amber-400"
                            : actualTheme === 'dark'
                              ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        } group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300`}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            <div className={`flex-shrink-0 flex ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} border-t p-4`}>
              <div className="flex items-center w-full">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{user?.name || user?.email || 'Unknown User'}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-mono font-medium ${getRoleColor(user?.role || '').bg} ${getRoleColor(user?.role || '').text} border ${getRoleColor(user?.role || '').border}`}>
                      {getRoleDisplayName(user?.role || '')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`ml-3 inline-flex items-center px-3 py-2 border ${actualTheme === 'dark' ? 'border-gray-700 text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900'} shadow-sm text-sm leading-4 font-medium font-mono rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 transition-all duration-300`}
                  title="Sign Out"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1 relative z-10">
          {/* Top bar for mobile */}
          <div className={`sticky top-0 z-30 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 ${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border-b flex justify-between items-center`}>
            <button
              type="button"
              className={`-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md ${actualTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-600 transition-all duration-300`}
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="pr-4">
              <ThemeToggle variant="icon-only" />
            </div>
          </div>
          
          {/* Main content area */}
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
} 