import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Head from "next/head";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface AdminSession {
  email: string;
  restaurantName: string;
  restaurantId: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionDropdownOpen, setSubscriptionDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Check if user is authenticated by trying to access a protected endpoint
    fetch('/api/admin/session')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => {
        // Not authenticated, redirect to login
        router.push('/admin/login');
      });
  }, [router]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
      await router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      await router.push("/admin/login");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // Check if current path is subscription-related
  const isSubscriptionActive = ["/admin/subscription", "/admin/billing", "/admin/upgrade"].includes(router.pathname);

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/admin", 
      current: router.pathname === "/admin",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    { 
      name: "Menu", 
      href: "/admin/menu", 
      current: router.pathname === "/admin/menu",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: "Orders", 
      href: "/admin/orders", 
      current: router.pathname === "/admin/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    { 
      name: "Kitchen", 
      href: "/admin/kitchen", 
      current: router.pathname === "/admin/kitchen",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18v-18H3zm6 2v14M15 5v14M7 9h2m4 0h2M7 13h2m4 0h2" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
          <circle cx="12" cy="11" r="1" fill="currentColor" />
          <circle cx="12" cy="15" r="1" fill="currentColor" />
        </svg>
      )
    },
    { 
      name: "QR Codes", 
      href: "/admin/qr-codes", 
      current: router.pathname === "/admin/qr-codes",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
    },
    { 
      name: "Subscription", 
      href: "/admin/subscription", 
      current: isSubscriptionActive,
      hasDropdown: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      dropdownItems: [
        { name: "Overview", href: "/admin/subscription" },
        { name: "Billing & Usage", href: "/admin/billing" },
        { name: "Upgrade Plan", href: "/admin/upgrade" },
      ]
    },
    { 
      name: "Waiter Settings", 
      href: "/admin/waiter-settings", 
      current: router.pathname === "/admin/waiter-settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      name: "Settings", 
      href: "/admin/settings", 
      current: router.pathname === "/admin/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      )
    },
  ];

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        actualTheme === 'dark' 
          ? 'bg-black text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          <p className={`mt-2 font-mono ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>LOADING...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no session (redirect will happen)
  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} - NEXUS AI` : "NEXUS AI - Restaurant Admin"}</title>
        <meta name="description" content="Restaurant Admin Dashboard - Manage your restaurant with AI" />
      </Head>
      
      <div className={`min-h-screen flex overflow-hidden relative transition-colors duration-300 ${
        actualTheme === 'dark' 
          ? 'bg-black text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Multi-layered gradient background */}
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
            : 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200'
        }`}></div>
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-tr from-amber-900/15 via-transparent to-orange-900/15'
            : 'bg-gradient-to-tr from-amber-100/20 via-transparent to-orange-100/20'
        }`}></div>

        {/* Animated gradient orbs with staggered animations */}
        <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse z-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-amber-600/10 to-orange-600/10'
            : 'bg-gradient-to-r from-amber-400/15 to-orange-400/15'
        }`}></div>
        <div className={`absolute top-3/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse z-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-red-600/10 to-amber-600/10'
            : 'bg-gradient-to-r from-red-400/20 to-amber-400/20'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse z-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-green-600/15 to-emerald-600/15'
            : 'bg-gradient-to-r from-green-400/18 to-emerald-400/18'
        }`} style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle Grid Pattern */}
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]'
            : 'bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]'
        }`}></div>
        
        {/* Radial Gradient Overlay */}
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.08),transparent_50%)]'
            : 'bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.12),transparent_50%)]'
        }`}></div>
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-[radial-gradient(circle_at_70%_80%,rgba(180,83,9,0.06),transparent_50%)]'
            : 'bg-[radial-gradient(circle_at_70%_80%,rgba(180,83,9,0.08),transparent_50%)]'
        }`}></div>
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className={`relative border rounded-lg shadow-xl max-w-md w-full mx-4 ${
              actualTheme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 border border-red-500/30">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium font-mono ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>SIGN OUT</h3>
                    <p className={`mt-1 text-sm font-mono ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Are you sure you want to sign out of your admin account?
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 ${
                      actualTheme === 'dark'
                        ? 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
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
            <div className={`relative flex-1 flex flex-col max-w-xs w-full border-r ${
              actualTheme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200'
            }`}>
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
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-mono font-bold text-sm">🍽</span>
                    </div>
                    <h1 className={`text-lg font-bold font-mono ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {session?.restaurantName || "RESTAURANT ADMIN"}
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
                            onClick={() => setSubscriptionDropdownOpen(!subscriptionDropdownOpen)}
                            className={`group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md w-full text-left transition-all duration-300 ${
                              item.current
                                ? "bg-amber-600/20 text-amber-300 border-amber-600/30"
                                : actualTheme === 'dark'
                                  ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                          >
                            {item.icon}
                            <span className="ml-3 flex-1">{item.name}</span>
                            <svg 
                              className={`ml-3 h-5 w-5 transition-transform ${subscriptionDropdownOpen ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {subscriptionDropdownOpen && (
                            <div className="mt-1 space-y-1">
                              {item.dropdownItems?.map((dropdownItem) => (
                                <a
                                  key={dropdownItem.name}
                                  href={dropdownItem.href}
                                  className={`group flex items-center pl-11 pr-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300 ${
                                    router.pathname === dropdownItem.href
                                      ? "bg-orange-600/20 text-orange-300"
                                      : actualTheme === 'dark'
                                        ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                  }`}
                                >
                                  {dropdownItem.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <a
                          href={item.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300 ${
                            item.current
                              ? "bg-amber-600/20 text-amber-300"
                              : actualTheme === 'dark'
                                ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          {item.icon}
                          <span className="ml-3">{item.name}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
              <div className={`flex-shrink-0 flex border-t p-4 ${
                actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className="flex items-center w-full">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium font-mono truncate ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{session?.email || "Admin"}</p>
                    <p className={`text-xs font-mono ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>ADMINISTRATOR</p>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`ml-3 inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium font-mono rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 transition-all duration-300 ${
                      actualTheme === 'dark'
                        ? 'border-gray-700 text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white'
                        : 'border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900'
                    }`}
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
          <div className={`flex-1 flex flex-col min-h-0 border-r backdrop-blur-sm ${
            actualTheme === 'dark'
              ? 'border-gray-800 bg-gray-900/50'
              : 'border-gray-200 bg-white/50'
          }`}>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between flex-shrink-0 px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-mono font-bold text-sm">🍽</span>
                  </div>
                  <h1 className={`text-lg font-bold font-mono ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {session?.restaurantName || "RESTAURANT ADMIN"}
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
                          onClick={() => setSubscriptionDropdownOpen(!subscriptionDropdownOpen)}
                          className={`group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md w-full text-left transition-all duration-300 ${
                            item.current
                              ? actualTheme === 'dark'
                                ? "bg-amber-600/20 text-amber-300"
                                : "bg-amber-600/20 text-amber-600"
                              : actualTheme === 'dark'
                                ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                          }`}
                        >
                          {item.icon}
                          <span className="ml-3 flex-1">{item.name}</span>
                          <svg 
                            className={`ml-3 h-5 w-5 transition-transform ${subscriptionDropdownOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {subscriptionDropdownOpen && (
                          <div className="mt-1 space-y-1">
                            {item.dropdownItems?.map((dropdownItem) => (
                              <a
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className={`group flex items-center pl-11 pr-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300 ${
                                  router.pathname === dropdownItem.href
                                    ? actualTheme === 'dark'
                                      ? "bg-orange-600/20 text-orange-300"
                                      : "bg-orange-600/20 text-orange-600"
                                    : actualTheme === 'dark'
                                      ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                                      : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                                }`}
                              >
                                {dropdownItem.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <a
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium font-mono rounded-md transition-all duration-300 ${
                          item.current
                            ? actualTheme === 'dark'
                              ? "bg-amber-600/20 text-amber-300"
                              : "bg-amber-600/20 text-amber-600"
                            : actualTheme === 'dark'
                              ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                              : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                        }`}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </a>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            <div className={`flex-shrink-0 flex border-t p-4 ${
              actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center w-full">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium font-mono truncate ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{session?.email || "Admin"}</p>
                  <p className={`text-xs font-mono ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>ADMINISTRATOR</p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`ml-3 inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium font-mono rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 transition-all duration-300 ${
                    actualTheme === 'dark'
                      ? 'border-gray-700 text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white'
                      : 'border-gray-300 text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900'
                  }`}
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
          <div className={`sticky top-0 z-30 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 backdrop-blur-sm border-b flex justify-between items-center ${
            actualTheme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-white/50 border-gray-200'
          }`}>
            <button
              type="button"
              className={`-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-600 transition-all duration-300 ${
                actualTheme === 'dark'
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
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