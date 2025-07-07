import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { api } from "@/utils/api";
import { useTheme } from '@/contexts/ThemeContext';

export default function SuperAdminSetup() {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if setup is required
  const { data: setupRequired, isLoading: checkingSetup } = api.superAdmin.isSetupRequired.useQuery();

  // Redirect if setup is not required
  useEffect(() => {
    if (setupRequired === false) {
      void router.push("/super-admin/login");
    }
  }, [setupRequired, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/super-admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, confirmPassword, name: name || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setError(data.details.map((d: any) => d.message).join(", "));
        } else {
          setError(data.error || "Setup failed");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        void router.push("/super-admin/login");
      }, 3000);
    } catch (error) {
      console.error("Setup error:", error);
      setError("An error occurred during setup");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-50 to-blue-100'} flex items-center justify-center p-4`}>
        <div className={`max-w-md w-full ${actualTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-xl shadow-2xl p-8 text-center`}>
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">✅</span>
          </div>
          <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
            Setup Complete!
          </h1>
          <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Super admin account created successfully.
          </p>
          <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Super Admin Setup - Restaurant Platform</title>
        <meta name="description" content="Create your first super admin account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} flex items-center justify-center p-4`}>
        <div className={`max-w-md w-full ${actualTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-xl shadow-2xl p-8`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🚀</span>
            </div>
            <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
              Super Admin Setup
            </h1>
            <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Create your first super admin account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Name (Optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 border ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                placeholder="Enter password (min 8 characters)"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border ${actualTheme === 'dark' ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white py-3 px-4 rounded-lg hover:from-amber-700 hover:to-orange-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Creating Account..." : "Create Super Admin"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              This will create the first super admin account for platform management
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 