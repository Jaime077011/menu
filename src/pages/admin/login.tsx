import { useState } from "react";
import { useRouter } from "next/router";
import { type GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import { useTheme } from "@/contexts/ThemeContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { actualTheme } = useTheme();

  // Removed dark mode enforcement that might interfere with form functionality

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login failed with status:", response.status, "Data:", data);
        setError(data.error || `Login failed (${response.status})`);
        return;
      }

      console.log("Login successful, redirecting to admin dashboard...");
      // Redirect to admin dashboard
      await router.push("/admin");
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>NEXUS AI - Admin Login</title>
        <meta name="description" content="Access your restaurant dashboard" />

      </Head>

      <div className={`min-h-screen overflow-hidden relative ${
        actualTheme === 'dark' 
          ? 'bg-black text-white' 
          : 'bg-white text-gray-900'
      }`}>
        {/* Theme-aware gradient backgrounds */}
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
        }`}></div>
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-tr from-amber-900/15 via-transparent to-orange-900/15'
            : 'bg-gradient-to-tr from-amber-100/30 via-transparent to-orange-100/30'
        }`}></div>
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-bl from-transparent via-red-900/8 to-transparent'
            : 'bg-gradient-to-bl from-transparent via-red-50/20 to-transparent'
        }`}></div>
        
        {/* Animated Gradient Orbs - Behind content */}
        <div className={`absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse z-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-amber-600/15 to-orange-600/15'
            : 'bg-gradient-to-r from-amber-400/20 to-orange-400/20'
        }`}></div>
        <div className={`absolute bottom-40 right-20 w-80 h-80 rounded-full blur-3xl opacity-20 animate-pulse z-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-red-600/15 to-amber-600/15'
            : 'bg-gradient-to-r from-red-400/25 to-amber-400/25'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-18 animate-pulse z-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-green-600/12 to-emerald-600/12'
            : 'bg-gradient-to-r from-green-400/15 to-emerald-400/15'
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

        <main className="relative z-20 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🍽</span>
                </div>
                <span className="font-mono font-bold text-3xl tracking-wider">NEXUS</span>
              </div>
              <h1 className={`text-3xl font-mono font-bold mb-2 ${
                actualTheme === 'dark' 
                  ? 'bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
              }`}>
                ADMIN LOGIN
              </h1>
              <p className={`font-mono text-sm ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Access your restaurant dashboard
              </p>
              <p className={`mt-2 text-sm font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Don't have an account?{' '}
                <Link href="/register" className={`transition-colors ${
                  actualTheme === 'dark' 
                    ? 'text-amber-400 hover:text-amber-300' 
                    : 'text-amber-600 hover:text-amber-700'
                }`}>
                  SIGN UP HERE
                </Link>
              </p>
            </div>

            {/* Login Form */}
            <div className={`backdrop-blur-sm rounded-2xl px-8 py-8 relative z-30 ${
              actualTheme === 'dark'
                ? 'bg-gray-900/50 border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]'
                : 'bg-white/70 border border-gray-200 shadow-[0_0_50px_rgba(0,0,0,0.1)]'
            }`}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className={`px-4 py-3 rounded-lg font-mono text-sm ${
                    actualTheme === 'dark'
                      ? 'bg-red-900/50 border border-red-400 text-red-300'
                      : 'bg-red-50 border border-red-300 text-red-800'
                  }`}>
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className={`block text-sm font-mono font-medium mb-2 ${
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                      actualTheme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="admin@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className={`block text-sm font-mono font-medium mb-2 ${
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                      actualTheme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className={`h-4 w-4 text-amber-600 focus:ring-amber-600 rounded ${
                        actualTheme === 'dark'
                          ? 'border-gray-600 bg-gray-900/50'
                          : 'border-gray-300 bg-white'
                      }`}
                    />
                    <label htmlFor="remember-me" className={`ml-2 block text-sm font-mono ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/admin/forgot-password" className={`transition-colors font-mono ${
                      actualTheme === 'dark'
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-amber-600 hover:text-amber-700'
                    }`}>
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-sm rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_30px_rgba(217,119,6,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </form>

              {/* Additional Links */}
              <div className={`mt-6 pt-6 border-t ${
                actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className="text-center">
                  <p className={`font-mono text-xs mb-4 ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Need help? Contact support
                  </p>
                  <div className="flex justify-center space-x-4 text-xs">
                    <Link href="/support" className={`transition-colors font-mono ${
                      actualTheme === 'dark'
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      SUPPORT
                    </Link>
                    <span className={actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'}>•</span>
                    <Link href="/privacy" className={`transition-colors font-mono ${
                      actualTheme === 'dark'
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      PRIVACY
                    </Link>
                    <span className={actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'}>•</span>
                    <Link href="/terms" className={`transition-colors font-mono ${
                      actualTheme === 'dark'
                        ? 'text-gray-500 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      TERMS
                    </Link>
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

// Redirect to admin dashboard if already logged in as admin
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);

  if (adminSession) {
    return {
      redirect: {
        destination: "/admin",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}; 