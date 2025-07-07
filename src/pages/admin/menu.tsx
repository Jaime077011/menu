import { type GetServerSideProps } from "next";
import { useState } from "react";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import { getMenuItemImageUrl, getMenuItemImageAlt } from "@/utils/fallback-image";
import { useTheme } from "@/contexts/ThemeContext";

interface MenuManagementProps {
  session: AdminSession;
}

interface MenuItemFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  dietaryTags: string[];
  imageUrl: string;
  imageAlt: string;
}

const initialFormData: MenuItemFormData = {
  name: "",
  description: "",
  category: "",
  price: 0,
  available: true,
  dietaryTags: [],
  imageUrl: "",
  imageAlt: "",
};

export default function MenuManagement({ session }: MenuManagementProps) {
  const { actualTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>(initialFormData);
  const [newTag, setNewTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const itemsPerPage = 10;

  // tRPC queries and mutations
  const { data: menuData, isLoading, refetch } = api.menu.getPaginated.useQuery({
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    ...(categoryFilter && { category: categoryFilter }),
    ...(searchFilter && { search: searchFilter }),
  });

  const menuItems = menuData?.items || [];
  const totalCount = menuData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const { data: categories = [] } = api.menu.getCategories.useQuery();
  const { data: dietaryTags = [] } = api.menu.getDietaryTags.useQuery();

  const createMutation = api.menu.create.useMutation({
    onSuccess: () => {
      void refetch();
      setIsModalOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      console.error("Create error:", error);
      alert(`Failed to create menu item: ${error.message}`);
    },
  });

  const updateMutation = api.menu.update.useMutation({
    onSuccess: () => {
      void refetch();
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      console.error("Update error:", error);
      alert(`Failed to update menu item: ${error.message}`);
    },
  });

  const deleteMutation = api.menu.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form data being submitted:", formData);
    
    if (editingItem) {
      const updateData = {
        id: editingItem,
        ...formData,
      };
      console.log("Update data:", updateData);
      updateMutation.mutate(updateData);
    } else {
      console.log("Create data:", formData);
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: NonNullable<typeof menuItems>[0]) => {
    setEditingItem(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      available: item.available,
      dietaryTags: item.dietaryTags,
      imageUrl: item.imageUrl || "",
      imageAlt: item.imageAlt || "",
    });
    setImagePreview(item.imageUrl || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will make it unavailable to customers.`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.dietaryTags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        dietaryTags: [...formData.dietaryTags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      dietaryTags: formData.dietaryTags.filter(tag => tag !== tagToRemove),
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setNewTag("");
    setImagePreview(null);
    setUploading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/menu-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        imageUrl: result.imageUrl,
        imageAlt: prev.imageAlt || prev.name,
      }));
      setImagePreview(result.imageUrl);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: "",
      imageAlt: "",
    }));
    setImagePreview(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchFilterChange = (search: string) => {
    setSearchFilter(search);
    setCurrentPage(1); // Reset to first page when search changes
  };

  if (isLoading) {
    return (
      <AdminLayout session={session} title="NEXUS Menu Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
          <p className={`ml-4 font-mono ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>LOADING MENU...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout session={session} title="NEXUS Menu Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🍽️</span>
            </div>
            <div>
              <h2 className={`text-2xl font-mono font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                actualTheme === 'dark' 
                  ? 'from-white to-amber-200' 
                  : 'from-gray-800 to-gray-900'
              }`}>
                MENU ITEMS
              </h2>
              <p className={`font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Manage your restaurant's menu items</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-6 py-3 rounded-lg text-sm font-mono font-bold transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            ADD NEW ITEM
          </button>
        </div>

        {/* Search and Filters */}
        <div className={`backdrop-blur-sm border p-6 rounded-xl ${
          actualTheme === 'dark' 
            ? 'bg-gray-900/50 border-gray-800' 
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className={`block text-sm font-mono mb-2 ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                SEARCH MENU ITEMS
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or description..."
                value={searchFilter}
                onChange={(e) => handleSearchFilterChange(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors font-mono ${
                  actualTheme === 'dark'
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div className="sm:w-48">
              <label htmlFor="category" className={`block text-sm font-mono mb-2 ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                FILTER BY CATEGORY
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors font-mono ${
                  actualTheme === 'dark'
                    ? 'bg-gray-800/50 border-gray-700 text-white'
                    : 'bg-gray-50/50 border-gray-300 text-gray-900'
                }`}
              >
                <option value="">ALL CATEGORIES</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            {(searchFilter || categoryFilter) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchFilter("");
                    setCategoryFilter("");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-3 text-sm font-mono font-bold border rounded-lg transition-colors ${
                    actualTheme === 'dark'
                      ? 'text-gray-300 hover:text-amber-300 border-gray-700 hover:bg-gray-700/50'
                      : 'text-gray-700 hover:text-amber-600 border-gray-300 hover:bg-gray-100/50'
                  }`}
                >
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </div>
          {totalCount > 0 && (
            <div className={`mt-4 text-sm font-mono ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              SHOWING <span className={actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'}>
                {menuItems.length}
              </span> OF <span className={actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'}>
                {totalCount}
              </span> MENU ITEMS
              {(searchFilter || categoryFilter) && " (FILTERED)"}
            </div>
          )}
        </div>

        {/* Menu Items Table */}
        <div className={`backdrop-blur-sm border rounded-xl overflow-hidden ${
          actualTheme === 'dark' 
            ? 'bg-gray-900/50 border-gray-800' 
            : 'bg-white/50 border-gray-200'
        }`}>
          <table className={`min-w-full ${
            actualTheme === 'dark' ? 'divide-y divide-gray-800/50' : 'divide-y divide-gray-200/50'
          }`}>
            <thead className={actualTheme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100/50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  IMAGE
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ITEM
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  CATEGORY
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  PRICE
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  STATUS
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  DIETARY TAGS
                </th>
                <th className={`px-6 py-3 text-right text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={actualTheme === 'dark' ? 'divide-y divide-gray-800/30' : 'divide-y divide-gray-200/30'}>
              {menuItems?.map((item) => (
                <tr key={item.id} className={`transition-colors ${
                  actualTheme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-100/30'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={getMenuItemImageUrl(item)}
                      alt={getMenuItemImageAlt(item)}
                      className={`w-16 h-16 object-cover rounded-lg border ${
                        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                      }`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-mono font-bold ${
                        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{item.name}</div>
                      <div className={`text-sm max-w-xs truncate font-mono ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>{item.description}</div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'
                  }`}>
                    {item.category}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-green-300' : 'text-green-600'
                  }`}>
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-mono font-bold rounded-full border ${
                      item.available 
                        ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                        : 'bg-red-500/20 text-red-300 border-red-400/30'
                    }`}>
                      {item.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.dietaryTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex px-2 py-1 text-xs font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-400/30 rounded-full"
                        >
                          {tag.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 hover:border-amber-400/50 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-300"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30 hover:border-red-400/50 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-300 ml-2"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {menuItems?.length === 0 && (
            <div className="text-center py-12">
              <div className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                <svg className={`mx-auto h-12 w-12 ${
                  actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className={`mt-2 text-sm font-mono font-bold ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>NO MENU ITEMS</h3>
                <p className={`mt-1 text-sm font-mono ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {searchFilter || categoryFilter 
                    ? "No menu items match your search criteria." 
                    : "Get started by creating your first menu item."
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`backdrop-blur-sm border px-4 py-3 flex items-center justify-between sm:px-6 rounded-xl ${
            actualTheme === 'dark' 
              ? 'bg-gray-900/50 border-gray-800' 
              : 'bg-white/50 border-gray-200'
          }`}>
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-mono font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  actualTheme === 'dark'
                    ? 'border-gray-700 text-gray-300 bg-gray-800/50 hover:bg-gray-700/50'
                    : 'border-gray-300 text-gray-700 bg-gray-100/50 hover:bg-gray-200/50'
                }`}
              >
                PREVIOUS
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-mono font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  actualTheme === 'dark'
                    ? 'border-gray-700 text-gray-300 bg-gray-800/50 hover:bg-gray-700/50'
                    : 'border-gray-300 text-gray-700 bg-gray-100/50 hover:bg-gray-200/50'
                }`}
              >
                NEXT
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm font-mono ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  SHOWING{' '}
                  <span className={`font-bold ${
                    actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'
                  }`}>{(currentPage - 1) * itemsPerPage + 1}</span>
                  {' '}TO{' '}
                  <span className={`font-bold ${
                    actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'
                  }`}>
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span>
                  {' '}OF{' '}
                  <span className={`font-bold ${
                    actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'
                  }`}>{totalCount}</span>
                  {' '}MENU ITEMS
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      actualTheme === 'dark'
                        ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        : 'border-gray-300 bg-gray-100/50 text-gray-700 hover:bg-gray-200/50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-mono font-bold transition-colors ${
                          pageNum === currentPage
                            ? 'z-10 bg-gradient-to-r from-amber-600 to-orange-700 border-amber-600 text-white'
                            : actualTheme === 'dark'
                              ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                              : 'bg-gray-100/50 border-gray-300 text-gray-700 hover:bg-gray-200/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      actualTheme === 'dark'
                        ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        : 'border-gray-300 bg-gray-100/50 text-gray-700 hover:bg-gray-200/50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    list="categories"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600"
                  />
                  <datalist id="categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
                  
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Menu item preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Alt Text (for accessibility)</label>
                        <input
                          type="text"
                          value={formData.imageAlt}
                          onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                          placeholder="Describe the image for screen readers"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-2">
                          <label className="cursor-pointer">
                            <span className="text-sm text-gray-600">Upload an image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploading}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                      </div>
                    </div>
                  )}
                  
                  {uploading && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                      Uploading image...
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-600 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Available for ordering
                  </label>
                </div>
                
                {/* Dietary Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Tags</label>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.dietaryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add dietary tag"
                      list="dietary-tags"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 text-sm"
                    >
                      Add
                    </button>
                  </div>
                  
                  <datalist id="dietary-tags">
                    {dietaryTags.map((tag) => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);

  if (!adminSession) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session: adminSession,
    },
  };
}; 