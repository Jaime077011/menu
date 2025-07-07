import { useState } from 'react';
import { type GetServerSideProps } from 'next';
import Head from 'next/head';
import { PlusIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api } from '@/utils/api';
import { getSuperAdminSessionFromCookies } from '@/utils/superAdminAuth';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

interface FormData {
  title: string;
  content: string;
  category: string;
}

const CATEGORIES = [
  'dietary',
  'beverage', 
  'sales',
  'service',
  'general',
  'allergens',
  'wine',
  'cooking',
  'customer-service'
];

export default function KnowledgeLibrary({ user }: Props) {
  const { theme: actualTheme } = useTheme();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    category: 'general'
  });

  // Fetch knowledge snippets
  const { data: snippetsData, isLoading: snippetsLoading, refetch } = api.superAdmin.getKnowledgeSnippets.useQuery({
    page: currentPage,
    limit: 10,
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
  });

  const snippets = snippetsData?.snippets || [];
  const pagination = snippetsData?.pagination;

  // Mutations
  const createMutation = api.superAdmin.createKnowledgeSnippet.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateForm(false);
      resetForm();
    },
  });

  const updateMutation = api.superAdmin.updateKnowledgeSnippet.useMutation({
    onSuccess: () => {
      refetch();
      setEditingSnippet(null);
      resetForm();
    },
  });

  const deleteMutation = api.superAdmin.deleteKnowledgeSnippet.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general'
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSnippet) return;
    updateMutation.mutate({ id: editingSnippet, ...formData });
  };

  const handleEditSnippet = (snippet: typeof snippets[0]) => {
    setFormData({
      title: snippet.title,
      content: snippet.content,
      category: snippet.category
    });
    setEditingSnippet(snippet.id);
    setShowCreateForm(true);
  };

  const handleDeleteSnippet = (snippetId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate({ id: snippetId });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <SuperAdminLayout user={user} title="Knowledge Library">
      <Head>
        <title>Knowledge Library - Super Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">📚</span>
            <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
              RESTAURANT KNOWLEDGE LIBRARY
            </h1>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Manage Global Knowledge Snippets</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge snippets..."
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
              />
              <button
                type="submit"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 ${actualTheme === 'dark' ? 'text-gray-400 hover:text-amber-400' : 'text-gray-600 hover:text-amber-600'} transition-colors`}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white/50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600`}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingSnippet(null);
                resetForm();
              }}
              className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded-lg text-amber-400 flex items-center space-x-2 transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Snippet</span>
            </button>
          </div>
        </div>

        {/* Knowledge Snippets List */}
        <div className="space-y-4">
          {snippetsLoading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING KNOWLEDGE SNIPPETS...</p>
            </div>
          ) : snippets.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl block mb-4">📚</span>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>No knowledge snippets found</p>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>Create your first snippet to get started</p>
            </div>
          ) : (
            <>
              {snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800 hover:border-amber-600/30' : 'bg-white/50 border-gray-200 hover:border-amber-400/30'} backdrop-blur-sm border rounded-xl p-6 transition-all duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{snippet.title}</h3>
                        <span className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded-full text-xs font-mono">
                          {snippet.category.charAt(0).toUpperCase() + snippet.category.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                      <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-sm mb-4 line-clamp-3`}>
                        {snippet.content}
                      </p>
                      <div className={`flex items-center space-x-4 text-xs ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>
                        <span>Created: {new Date(snippet.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(snippet.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditSnippet(snippet)}
                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-600/20 rounded-lg transition-all duration-300"
                        title="Edit snippet"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSnippet(snippet.id, snippet.title)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition-all duration-300"
                        title="Delete snippet"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50' : 'bg-gray-100/50 border-gray-300 text-gray-700 hover:bg-gray-200/50'} border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-amber-600 text-white'
                          : `${actualTheme === 'dark' ? 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50' : 'bg-gray-100/50 border border-gray-300 text-gray-700 hover:bg-gray-200/50'}`
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className={`px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50' : 'bg-gray-100/50 border-gray-300 text-gray-700 hover:bg-gray-200/50'} border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className={`relative ${actualTheme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {editingSnippet ? 'EDIT KNOWLEDGE SNIPPET' : 'CREATE KNOWLEDGE SNIPPET'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingSnippet(null);
                      resetForm();
                    }}
                    className={`${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={editingSnippet ? handleUpdateSubmit : handleCreateSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-mono font-medium text-amber-400 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                      placeholder="Enter snippet title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono font-medium text-amber-400 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white/50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
                      required
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-mono font-medium text-amber-400 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={8}
                      className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono resize-none`}
                      placeholder="Enter snippet content..."
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingSnippet(null);
                        resetForm();
                      }}
                      className={`px-4 py-2 text-sm font-medium font-mono ${actualTheme === 'dark' ? 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700' : 'text-gray-700 bg-gray-200 border-gray-300 hover:bg-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600`}
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isLoading || updateMutation.isLoading}
                      className="px-4 py-2 text-sm font-medium font-mono text-white bg-gradient-to-r from-amber-600 to-orange-600 border border-transparent rounded-md hover:from-amber-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300"
                    >
                      {(createMutation.isLoading || updateMutation.isLoading) ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {editingSnippet ? 'UPDATING...' : 'CREATING...'}
                        </>
                      ) : (
                        editingSnippet ? 'UPDATE SNIPPET' : 'CREATE SNIPPET'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const cookies = context.req.headers.cookie || '';
  const session = await getSuperAdminSessionFromCookies(cookies);

  if (!session) {
    return {
      redirect: {
        destination: '/super-admin/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.id,
        email: session.email,
        name: session.name || undefined,
        role: session.role,
      },
    },
  };
}; 