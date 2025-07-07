import { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { getSuperAdminSessionFromCookies } from "@/utils/superAdminAuth";
import { api } from "@/utils/api";
import { SuperAdminRole, getRoleDisplayName, getRoleColor, type RolePermissions } from "@/utils/roles";
import { useTheme } from '@/contexts/ThemeContext';

interface RolePermissionsPageProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

interface PermissionInfo {
  key: keyof RolePermissions;
  label: string;
  description: string;
}

export default function RolePermissionsPage({ user }: RolePermissionsPageProps) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [pendingPermissions, setPendingPermissions] = useState<RolePermissions | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all role permissions
  const { data: rolePermissions, refetch: refetchPermissions } = api.rolePermissions.getAll.useQuery();
  
  // Fetch available permissions
  const { data: availablePermissions } = api.rolePermissions.getAvailablePermissions.useQuery();

  // Mutations
  const upsertPermissionsMutation = api.rolePermissions.upsert.useMutation({
    onSuccess: () => {
      setSuccess("Role permissions updated successfully!");
      setError("");
      void refetchPermissions();
      setEditingRole(null);
      setPendingPermissions(null);
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const resetToDefaultMutation = api.rolePermissions.resetToDefault.useMutation({
    onSuccess: () => {
      setSuccess("Role permissions reset to default successfully!");
      setError("");
      void refetchPermissions();
      setEditingRole(null);
      setPendingPermissions(null);
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const deletePermissionsMutation = api.rolePermissions.delete.useMutation({
    onSuccess: () => {
      setSuccess("Custom permissions deleted successfully!");
      setError("");
      void refetchPermissions();
      setEditingRole(null);
      setPendingPermissions(null);
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const handleEditRole = (role: string) => {
    const existing = rolePermissions?.find(rp => rp.role === role);
    if (existing) {
      setPendingPermissions(existing.permissions);
    } else {
      // Set default permissions for new role
      const defaultPermissions: RolePermissions = {
        canManageAdmins: role === SuperAdminRole.SUPER_ADMIN,
        canManageRestaurants: true,
        canManageSubscriptions: true,
        canManagePlans: role === SuperAdminRole.SUPER_ADMIN,
        canViewAnalytics: true,
        canViewBilling: role === SuperAdminRole.SUPER_ADMIN,
        canManageSettings: role === SuperAdminRole.SUPER_ADMIN,
        canManageTemplates: role === SuperAdminRole.SUPER_ADMIN,
        canManageKnowledge: true,
      };
      setPendingPermissions(defaultPermissions);
    }
    setEditingRole(role);
  };

  const handleSavePermissions = () => {
    if (!editingRole || !pendingPermissions) return;

    upsertPermissionsMutation.mutate({
      role: editingRole as SuperAdminRole,
      permissions: pendingPermissions,
    });
  };

  const handleResetToDefault = (role: string) => {
    resetToDefaultMutation.mutate({ role });
  };

  const handleDeletePermissions = (role: string) => {
    deletePermissionsMutation.mutate({ role });
  };

  const handlePermissionToggle = (permissionKey: keyof RolePermissions) => {
    if (!pendingPermissions) return;

    setPendingPermissions({
      ...pendingPermissions,
      [permissionKey]: !pendingPermissions[permissionKey],
    });
  };

  const getPermissionsForRole = (role: string): RolePermissions | null => {
    return rolePermissions?.find(rp => rp.role === role)?.permissions || null;
  };

  const roles = Object.values(SuperAdminRole).filter(role => role !== SuperAdminRole.SUPER_ADMIN);
  const permissions = availablePermissions?.permissions || [];

  return (
    <SuperAdminLayout user={user} title="Role Permissions Management">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">🛡️</span>
            <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
              ROLE PERMISSIONS MANAGEMENT
            </h1>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Configure permissions for user roles (Super Admin roles protected)</p>
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
              onClick={() => router.push("/super-admin/admins")}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-4 py-2 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              ADMINISTRATORS
            </button>
            <button
              onClick={() => router.push("/super-admin/analytics")}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-4 py-2 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(234,88,12,0.3)]"
            >
              ANALYTICS
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Role Configuration</h2>
            <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-sm`}>Manage permissions for editable roles. Changes take effect immediately.</p>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {roles.map((role) => {
            const currentPermissions = getPermissionsForRole(role);
            const isEditing = editingRole === role;
            const roleColor = getRoleColor(role);
            const hasCustomPermissions = currentPermissions !== null;

            return (
              <div
                key={role}
                className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-mono font-medium ${roleColor.bg} ${roleColor.text} ${roleColor.border} border`}
                    >
                      {getRoleDisplayName(role)}
                    </div>
                    {hasCustomPermissions && (
                      <div className="inline-flex items-center rounded-full bg-green-500/20 text-green-400 border border-green-400/30 px-2 py-1 text-xs font-mono font-medium">
                        CUSTOM
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-3 py-1 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      >
                        EDIT
                      </button>
                      {hasCustomPermissions && (
                        <>
                          <button
                            onClick={() => handleResetToDefault(role)}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white px-3 py-1 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                          >
                            RESET
                          </button>
                          <button
                            onClick={() => handleDeletePermissions(role)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white px-3 py-1 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                          >
                            DELETE
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isEditing && pendingPermissions ? (
                  <div className="space-y-4">
                    <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/30 border-gray-300'} border rounded-lg p-4`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-xs">✏️</span>
                        </div>
                        <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>EDITING PERMISSIONS</h4>
                      </div>
                      <div className="grid gap-3">
                        {permissions.map((permission) => (
                          <div
                            key={permission.key}
                            className={`flex items-start gap-3 rounded-lg border ${actualTheme === 'dark' ? 'border-gray-700 bg-gray-800/20' : 'border-gray-200 bg-white/20'} p-3 hover:bg-opacity-30 transition-all duration-200`}
                          >
                            <input
                              type="checkbox"
                              id={`${role}-${permission.key}`}
                              checked={pendingPermissions[permission.key as keyof RolePermissions]}
                              onChange={() => handlePermissionToggle(permission.key as keyof RolePermissions)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`${role}-${permission.key}`}
                                className={`block text-sm font-mono font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} cursor-pointer`}
                              >
                                {permission.label}
                              </label>
                              <p className={`mt-1 text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSavePermissions}
                        disabled={upsertPermissionsMutation.isPending}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-6 py-3 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {upsertPermissionsMutation.isPending ? "SAVING..." : "💾 SAVE CHANGES"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingRole(null);
                          setPendingPermissions(null);
                          setError("");
                        }}
                        className={`px-6 py-3 ${actualTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-all duration-300 font-mono text-sm`}
                      >
                        ❌ CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs">🔐</span>
                      </div>
                      <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>CURRENT PERMISSIONS</h4>
                    </div>
                    <div className="grid gap-2">
                      {permissions.map((permission) => {
                        const hasPermission = currentPermissions?.[permission.key as keyof RolePermissions] ?? false;
                        return (
                          <div
                            key={permission.key}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-mono transition-all duration-200 ${
                              hasPermission
                                ? "bg-green-500/20 text-green-400 border border-green-400/30"
                                : "bg-red-500/20 text-red-400 border border-red-400/30"
                            }`}
                          >
                            <div
                              className={`h-3 w-3 rounded-full ${
                                hasPermission ? "bg-green-500" : "bg-red-500"
                              } shadow-[0_0_8px_rgba(34,197,94,0.4)]`}
                            />
                            <span className="font-medium flex-1">{permission.label}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                              hasPermission 
                                ? "bg-green-500/30 text-green-300" 
                                : "bg-red-500/30 text-red-300"
                            }`}>
                              {hasPermission ? "✅ ALLOWED" : "❌ DENIED"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Important Notes */}
        <div className={`${actualTheme === 'dark' ? 'bg-yellow-900/30 border-yellow-600/40' : 'bg-yellow-50/50 border-yellow-300/50'} backdrop-blur-sm border rounded-xl p-6`}>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} mb-3`}>IMPORTANT SECURITY NOTES</h3>
              <ul className={`space-y-2 text-sm ${actualTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'} font-mono`}>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">🔄</span>
                  <span>Changes take effect <strong>immediately</strong> for all users with the modified role</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">🗑️</span>
                  <span>Deleting custom permissions will revert to <strong>default system permissions</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">👑</span>
                  <span><strong>Super Admin roles have full access</strong> and cannot be modified for security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">📝</span>
                  <span>Permission changes are <strong>logged in the system audit trail</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">🔐</span>
                  <span>Test permissions thoroughly before deploying to production users</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

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

    // Check if user has permission to manage admins using direct database check
    try {
      const { db } = await import('@/server/db');
      const { SuperAdminRole, DEFAULT_ROLE_PERMISSIONS } = await import('@/utils/roles');
      
      // Try to get permissions from database first
      let canManageAdmins = false;
      
      const rolePermission = await db.rolePermission.findUnique({
        where: { role: session.role },
      });
      
      if (rolePermission) {
        const permissions = JSON.parse(rolePermission.permissions);
        canManageAdmins = permissions.canManageAdmins || false;
      } else {
        // Fallback to default permissions
        const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[session.role as SuperAdminRole];
        canManageAdmins = defaultPermissions?.canManageAdmins || false;
      }
      
      if (!canManageAdmins) {
        return {
          redirect: {
            destination: "/super-admin?access=denied",
            permanent: false,
          },
        };
      }
    } catch (permissionError) {
      console.error("Error checking permissions:", permissionError);
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