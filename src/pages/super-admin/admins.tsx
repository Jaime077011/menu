import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { type GetServerSideProps } from "next";
import { api } from "@/utils/api";
import { getSuperAdminSessionFromCookies } from "@/utils/superAdminAuth";
import { SuperAdminRole, getRoleDisplayName, getRoleDescription, hasPermission, getRoleColor } from "@/utils/roles";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useTheme } from '@/contexts/ThemeContext';

interface SuperAdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface Props {
  user: SuperAdminUser;
}

export default function SuperAdminManagement({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<SuperAdminRole>(SuperAdminRole.SUPPORT_ADMIN);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch super admins
  const { data: adminsData, isLoading, error: adminsError, refetch } = api.superAdmin.getAllSuperAdmins.useQuery({
    page,
    limit: 10,
  });

  // Debug logging
  React.useEffect(() => {
    if (adminsData) {
      console.log("Admin data received:", adminsData);
    }
    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
    }
  }, [adminsData, adminsError]);

  // Create super admin mutation
  const createMutation = api.superAdmin.createSuperAdmin.useMutation({
    onSuccess: () => {
      setSuccess("Super admin created successfully!");
      setError("");
      setShowCreateForm(false);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = api.superAdmin.toggleSuperAdminStatus.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setRole(SuperAdminRole.SUPPORT_ADMIN);
    setError("");
    setSuccess("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    createMutation.mutate({
      email,
      password,
      name: name || undefined,
      role,
    });
  };

  const handleToggleStatus = (adminId: string, currentStatus: boolean) => {
    if (adminId === user.id && currentStatus) {
      setError("Cannot deactivate your own account");
      return;
    }

    toggleStatusMutation.mutate({
      superAdminId: adminId,
      isActive: !currentStatus,
    });
  };

  return (
    <SuperAdminLayout user={user} title="Super Admin Management">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">👑</span>
            <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
              SUPER ADMIN MANAGEMENT
            </h1>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Platform Administrator Control</p>
        </div>

        {/* Alerts */}
        {(error || adminsError) && (
          <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg font-mono text-sm backdrop-blur-sm">
            {error || adminsError?.message || "An error occurred"}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/50 border border-green-400 text-green-300 px-4 py-3 rounded-lg font-mono text-sm backdrop-blur-sm">
            {success}
          </div>
        )}

        {/* Quick Actions */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">⚡</span>
            </div>
            <h3 className="text-lg font-mono font-bold text-amber-400">QUICK ACTIONS</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push("/super-admin")}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-2 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              ← DASHBOARD
            </button>
            <button
              onClick={() => router.push("/super-admin/restaurants")}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-4 py-2 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              RESTAURANTS
            </button>
            <button
              onClick={() => router.push("/super-admin/analytics")}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-4 py-2 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(234,88,12,0.3)]"
            >
              ANALYTICS
            </button>
          </div>
        </div>

        {/* Create New Admin Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Administrator List</h2>
            <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-sm`}>Manage platform administrators</p>
          </div>
          {hasPermission(user.role, "canManageAdmins") && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-6 py-3 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              {showCreateForm ? "CANCEL" : "+ CREATE ADMIN"}
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
              <h3 className="text-lg font-mono font-bold text-green-300">CREATE NEW SUPER ADMIN</h3>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    CONFIRM PASSWORD *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    ROLE *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as SuperAdminRole)}
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white/50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                    required
                  >
                    <option value={SuperAdminRole.SUPPORT_ADMIN}>
                      {getRoleDisplayName(SuperAdminRole.SUPPORT_ADMIN)} - {getRoleDescription(SuperAdminRole.SUPPORT_ADMIN)}
                    </option>
                    <option value={SuperAdminRole.SUPER_ADMIN}>
                      {getRoleDisplayName(SuperAdminRole.SUPER_ADMIN)} - {getRoleDescription(SuperAdminRole.SUPER_ADMIN)}
                    </option>
                  </select>
                  <p className={`mt-2 text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                    {role === SuperAdminRole.SUPPORT_ADMIN && "Limited access: Can help customers but cannot manage plans or billing"}
                    {role === SuperAdminRole.SUPER_ADMIN && "Full access: Complete platform management and administration"}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`px-6 py-3 ${actualTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-all duration-300 font-mono text-sm`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? "CREATING..." : "CREATE ADMIN"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins List */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/50'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-md flex items-center justify-center">
                <span className="text-white text-xs">👑</span>
              </div>
              <h3 className="text-lg font-mono font-bold text-amber-400">CURRENT SUPER ADMINISTRATORS</h3>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>LOADING ADMINISTRATORS...</p>
            </div>
          ) : !adminsData?.superAdmins || adminsData.superAdmins.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">👤</div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-lg mb-2`}>NO ADMINISTRATORS FOUND</p>
              <p className={`${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono text-sm`}>
                {hasPermission(user.role, "canManageAdmins") 
                  ? "Click 'CREATE ADMIN' to add the first administrator"
                  : "No administrators are currently configured"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${actualTheme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100/50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      ADMINISTRATOR
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      ROLE
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      STATUS
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      CREATED
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${actualTheme === 'dark' ? 'divide-gray-800/50' : 'divide-gray-200/50'}`}>
                  {adminsData.superAdmins.map((admin) => (
                    <tr key={admin.id} className={`${actualTheme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-lg">👤</span>
                          </div>
                          <div>
                            <div className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {admin.name || "No Name"}
                            </div>
                            <div className="text-sm text-amber-400 font-mono">
                              {admin.email}
                            </div>
                            {admin.id === user.id && (
                              <div className="text-xs text-green-400 font-mono">
                                (YOU)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-mono font-bold rounded-full ${getRoleColor(admin.role).bg} ${getRoleColor(admin.role).text} border ${getRoleColor(admin.role).border}`}>
                          {getRoleDisplayName(admin.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-mono font-bold rounded-full ${
                          admin.isActive
                            ? "bg-green-500/20 text-green-500 border border-green-400/30"
                            : "bg-red-500/20 text-red-500 border border-red-400/30"
                        }`}>
                          {admin.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono space-x-2">
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                          disabled={toggleStatusMutation.isPending || (admin.id === user.id && admin.isActive)}
                          className={`${
                            admin.isActive
                              ? "text-red-400 hover:text-red-300"
                              : "text-green-400 hover:text-green-300"
                          } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {admin.isActive ? "DEACTIVATE" : "ACTIVATE"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {adminsData?.pagination && (
            <div className={`px-6 py-4 border-t ${actualTheme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/50'} flex items-center justify-between`}>
              <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, adminsData.pagination.total)} of {adminsData.pagination.total} administrators
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  PREV
                </button>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-400/30 rounded font-mono text-sm">
                  {page} of {adminsData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= adminsData.pagination.pages}
                  className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
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

    // Check if user has permission to manage admins
    if (!hasPermission(session.role, "canManageAdmins")) {
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
          name: session.name,
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