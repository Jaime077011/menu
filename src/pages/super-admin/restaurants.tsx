import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { type GetServerSideProps } from "next";
import { api } from "@/utils/api";
import { getSuperAdminSessionFromCookies } from "@/utils/superAdminAuth";
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

export default function RestaurantManagement({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pageLimit = 10;

  // Form state for creating restaurant
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
    waiterName: "",
    waiterPersonality: "FRIENDLY" as const,
    welcomeMessage: "",
    conversationTone: "BALANCED" as const,
    specialtyKnowledge: "",
    responseStyle: "HELPFUL" as const,
  });

  // Fetch restaurants with pagination and search
  const { data: restaurantData, isLoading: restaurantsLoading, refetch } = api.superAdmin.getRestaurants.useQuery({
    page: currentPage,
    limit: pageLimit,
    search: searchQuery || undefined,
  });

  // Create restaurant mutation
  const createMutation = api.superAdmin.createRestaurant.useMutation({
    onSuccess: () => {
      setSuccess("Restaurant created successfully!");
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

  // Delete restaurant mutation
  const deleteMutation = api.superAdmin.deleteRestaurant.useMutation({
    onSuccess: () => {
      setSuccess("Restaurant deleted successfully!");
      setError("");
      void refetch();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch("/api/super-admin/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    void router.push("/super-admin/login");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subdomain: "",
      adminEmail: "",
      adminPassword: "",
      adminName: "",
      waiterName: "",
      waiterPersonality: "FRIENDLY",
      welcomeMessage: "",
      conversationTone: "BALANCED",
      specialtyKnowledge: "",
      responseStyle: "HELPFUL",
    });
    setError("");
    setSuccess("");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!formData.name || !formData.subdomain || !formData.adminEmail || !formData.adminPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.adminPassword.length < 8) {
      setError("Admin password must be at least 8 characters");
      return;
    }

    createMutation.mutate(formData);
  };

  const handleDeleteRestaurant = (restaurantId: string, restaurantName: string) => {
    if (confirm(`Are you sure you want to delete "${restaurantName}"? This action cannot be undone and will delete all associated data.`)) {
      deleteMutation.mutate({ restaurantId });
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    void refetch();
  };

  // Handle page navigation
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const restaurants = restaurantData?.restaurants ?? [];
  const pagination = restaurantData?.pagination;

  return (
    <SuperAdminLayout user={user} title="Restaurant Management">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">🏪</span>
            <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
              RESTAURANT MANAGEMENT
            </h1>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Platform Restaurant Administration</p>
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

        {/* Search and Create Button */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants..."
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
              />
              <button
                type="submit"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 ${actualTheme === 'dark' ? 'text-gray-400 hover:text-amber-400' : 'text-gray-600 hover:text-amber-600'} transition-colors`}
              >
                🔍
              </button>
            </div>
          </form>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-6 py-3 rounded-lg transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            {showCreateForm ? "CANCEL" : "+ CREATE RESTAURANT"}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
              <h3 className="text-lg font-mono font-bold text-green-300">CREATE NEW RESTAURANT</h3>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    RESTAURANT NAME *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                    placeholder="Pizza Palace"
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    SUBDOMAIN *
                  </label>
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                    placeholder="pizzapalace"
                    required
                  />
                  <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1 font-mono`}>
                    Will be accessible at: {formData.subdomain || "subdomain"}.localhost:3000
                  </p>
                </div>
              </div>

              {/* Admin Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-mono font-bold text-amber-400">ADMIN USER</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      ADMIN EMAIL *
                    </label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                      className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                      placeholder="admin@pizzapalace.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      ADMIN PASSWORD *
                    </label>
                    <input
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                      className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      ADMIN NAME
                    </label>
                    <input
                      type="text"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange("adminName", e.target.value)}
                      className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                      placeholder="John Doe"
                    />
                  </div>
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
                  {createMutation.isPending ? "CREATING..." : "CREATE RESTAURANT"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Restaurants List */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/50'}`}>
            <h3 className="text-lg font-mono font-bold text-amber-400">
              RESTAURANTS {pagination && `(${pagination.total} TOTAL)`}
            </h3>
          </div>
          
          {restaurantsLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING RESTAURANTS...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 ${actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-2xl">🏪</span>
              </div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2 font-mono`}>
                {searchQuery ? "NO RESTAURANTS FOUND MATCHING YOUR SEARCH" : "NO RESTAURANTS YET"}
              </p>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>
                {!searchQuery && "Get started by adding your first restaurant"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${actualTheme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100/50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      RESTAURANT
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      SUBDOMAIN
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      STATS
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
                  {restaurants.map((restaurant) => (
                    <tr key={restaurant.id} className={`${actualTheme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-lg">🏪</span>
                          </div>
                          <div>
                            <div className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {restaurant.name}
                            </div>
                            <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                              ID: {restaurant.id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-mono font-bold rounded-full bg-amber-500/20 text-amber-500 border border-amber-400/30">
                          {restaurant.subdomain}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        <div>
                          <div>👥 {restaurant._count.adminUsers} admins</div>
                          <div>🍽️ {restaurant._count.menuItems} items</div>
                          <div>📋 {restaurant._count.orders} orders</div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {new Date(restaurant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono space-x-2">
                        <button
                          onClick={() => window.open(`http://localhost:3000/${restaurant.subdomain}`, '_blank')}
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          VISIT
                        </button>
                        <button
                          onClick={() => window.open(`http://localhost:3000/admin?restaurantId=${restaurant.id}`, '_blank')}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          ADMIN
                        </button>
                        <button
                          onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
                          disabled={deleteMutation.isPending}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteMutation.isPending ? "DELETING..." : "DELETE"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className={`px-6 py-4 border-t ${actualTheme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/50'} flex items-center justify-between`}>
              <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                Showing {((currentPage - 1) * pageLimit) + 1} to {Math.min(currentPage * pageLimit, pagination.total)} of {pagination.total} restaurants
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  PREV
                </button>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-400/30 rounded font-mono text-sm">
                  {currentPage} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.pages}
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

// Server-side authentication and permission check  
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

    // Check if user has permission to manage restaurants
    const { hasPermission } = await import("@/utils/roles");
    const canManageRestaurants = await hasPermission(session.role, "canManageRestaurants");
    
    if (!canManageRestaurants) {
      return {
        redirect: {
          destination: "/super-admin?access=denied&reason=restaurants&role=" + session.role,
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