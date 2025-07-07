import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useTheme } from '@/contexts/ThemeContext';

export default function SuperAdminLogin() {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Removed dark mode enforcement that might interfere with form functionality

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting super admin login with:", { email, password: password.length + ' chars' });
      
      const response = await fetch("/api/super-admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response status:", response.status);
      console.log("Login response data:", data);

      if (!response.ok) {
        console.error("Login failed with status:", response.status, "Data:", data);
        setError(data.error || "Login failed");
        return;
      }

      console.log("Login successful, redirecting to super admin dashboard...");
      // Redirect to dashboard (cookie is set automatically)
      await router.push("/super-admin");
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login: " + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>NEXUS AI - Super Admin Login</title>
        <meta name="description" content="Super Admin Access - Platform Administration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

      </Head>

      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} overflow-hidden relative`}>
        {/* Same gradient background as other pages */}
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'}`}></div>
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-tr from-amber-900/15 via-transparent to-orange-900/15' : 'bg-gradient-to-tr from-amber-500/10 via-transparent to-orange-500/10'}`}></div>
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-bl from-transparent via-red-900/8 to-transparent' : 'bg-gradient-to-bl from-transparent via-red-500/5 to-transparent'}`}></div>
        
        {/* Animated Gradient Orbs - Behind content */}
        <div className={`absolute top-20 left-20 w-96 h-96 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-amber-600/15 to-orange-600/15' : 'bg-gradient-to-r from-amber-400/20 to-orange-400/20'} rounded-full blur-3xl opacity-25 animate-pulse z-0`}></div>
        <div className={`absolute bottom-40 right-20 w-80 h-80 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-red-600/15 to-amber-600/15' : 'bg-gradient-to-r from-red-400/20 to-amber-400/20'} rounded-full blur-3xl opacity-20 animate-pulse z-0`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-green-600/12 to-emerald-600/12' : 'bg-gradient-to-r from-green-400/15 to-emerald-400/15'} rounded-full blur-3xl opacity-18 animate-pulse z-0`} style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle Grid Pattern */}
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)]'} bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]`}></div>
        
        {/* Radial Gradient Overlay */}
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.08),transparent_50%)]' : 'bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.06),transparent_50%)]'}`}></div>
        <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-[radial-gradient(circle_at_70%_80%,rgba(180,83,9,0.06),transparent_50%)]' : 'bg-[radial-gradient(circle_at_70%_80%,rgba(180,83,9,0.04),transparent_50%)]'}`}></div>

        <main className="relative z-20 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">👑</span>
                </div>
                <span className={`font-mono font-bold text-3xl tracking-wider ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>NEXUS</span>
              </div>
              <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-300' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-700'} bg-clip-text text-transparent mb-2`}>
                SUPER ADMIN
              </h1>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-sm`}>
                Platform Administration Access
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <span className={`text-xs ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono`}>👑</span>
                <span className={`text-xs ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono`}>ELEVATED PRIVILEGES</span>
                <span className={`text-xs ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono`}>👑</span>
              </div>
            </div>

            {/* Login Form */}
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-2xl px-8 py-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-30`}>
              <form onSubmit={handleSubmit} className="space-y-6 relative z-40">
                {error && (
                  <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg font-mono text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className={`block text-sm font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono relative z-50`}
                    placeholder="superadmin@nexus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className={`block text-sm font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Master Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono relative z-50`}
                    placeholder="Enter master password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-sm rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_30px_rgba(217,119,6,0.35)] disabled:opacity-50 disabled:cursor-not-allowed relative z-50"
                >
                  {isLoading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
                </button>
              </form>

              {/* Security Notice */}
              <div className={`mt-6 pt-6 border-t ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="text-center">
                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-xs mb-4`}>
                    🔒 SECURE ADMIN ACCESS 🔒
                  </p>
                  <div className="flex justify-center space-x-4 text-xs">
                    <span className={`${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono`}>ENCRYPTED</span>
                    <span className={`${actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                    <span className={`${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono`}>MONITORED</span>
                    <span className={`${actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                    <span className={`${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono`}>AUDITED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 