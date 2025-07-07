import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/utils/api';
import { getSuperAdminSessionFromCookies } from '@/utils/superAdminAuth';
import { GetServerSideProps } from 'next';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { hasPermission } from '@/utils/roles';

interface Props {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export default function WaiterTemplatesManagement({ user }: Props) {
  const { theme: actualTheme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [selectedTemplateForKnowledge, setSelectedTemplateForKnowledge] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pageLimit = 10;

  // Form state for creating/editing template
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tone: "BALANCED",
    responseStyle: "HELPFUL",
    defaultWelcomeMessage: "",
    minimumPlan: "",
    isPremium: false,
  });

  // Fetch templates with pagination and search
  const { data: templatesData, isLoading: templatesLoading, refetch } = api.superAdmin.getWaiterTemplates.useQuery({
    page: currentPage,
    limit: pageLimit,
    search: searchQuery || undefined,
  });

  // Create template mutation
  const createMutation = api.superAdmin.createWaiterTemplate.useMutation({
    onSuccess: () => {
      setSuccess("Template created successfully!");
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

  // Update template mutation
  const updateMutation = api.superAdmin.updateWaiterTemplate.useMutation({
    onSuccess: () => {
      setSuccess("Template updated successfully!");
      setError("");
      void refetch();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  // Delete template mutation
  const deleteMutation = api.superAdmin.deleteWaiterTemplate.useMutation({
    onSuccess: () => {
      setSuccess("Template deleted successfully!");
      setError("");
      void refetch();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  // Fetch all knowledge snippets for assignment
  const { data: allKnowledge } = api.superAdmin.getKnowledgeSnippets.useQuery({
    page: 1,
    limit: 100, // Get all for assignment dropdown
  });

  // Fetch template knowledge assignments
  const { data: templateKnowledge, refetch: refetchKnowledge } = api.superAdmin.getTemplateKnowledge.useQuery(
    { templateId: selectedTemplateForKnowledge! },
    { enabled: !!selectedTemplateForKnowledge }
  );

  // Assign knowledge mutation
  const assignKnowledgeMutation = api.superAdmin.assignKnowledgeToTemplate.useMutation({
    onSuccess: () => {
      setSuccess("Knowledge assigned successfully!");
      setError("");
      void refetchKnowledge();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  // Remove knowledge mutation
  const removeKnowledgeMutation = api.superAdmin.removeKnowledgeFromTemplate.useMutation({
    onSuccess: () => {
      setSuccess("Knowledge removed successfully!");
      setError("");
      void refetchKnowledge();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      tone: "BALANCED",
      responseStyle: "HELPFUL",
      defaultWelcomeMessage: "",
      minimumPlan: "",
      isPremium: false,
    });
    setError("");
    setSuccess("");
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'isPremium') {
      setFormData(prev => ({ ...prev, [field]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!formData.name || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template.id);
    setEditFormData({
      minimumPlan: template.minimumPlan || "",
      isPremium: template.isPremium || false,
    });
  };

  const handleSaveEdit = (templateId: string) => {
    updateMutation.mutate({
      templateId,
      minimumPlan: editFormData.minimumPlan || null,
      isPremium: editFormData.isPremium,
    });
    setEditingTemplate(null);
    setEditFormData(null);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setEditFormData(null);
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (confirm(`Are you sure you want to delete "${templateName}"? Restaurants using this template will keep their current settings but won't be able to reselect it.`)) {
      deleteMutation.mutate({ templateId });
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    void refetch();
  };

  // Handle page navigation
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const templates = templatesData?.templates ?? [];
  const pagination = templatesData?.pagination;

  return (
    <SuperAdminLayout user={user} title="AI Waiter Templates">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
              🤖 AI WAITER TEMPLATES
            </h1>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Manage AI Waiter Personality Templates</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className={`${actualTheme === 'dark' ? 'bg-red-900/50 border-red-400 text-red-300' : 'bg-red-100/50 border-red-400 text-red-700'} border px-4 py-3 rounded-lg font-mono text-sm backdrop-blur-sm mb-6`}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={`${actualTheme === 'dark' ? 'bg-green-900/50 border-green-400 text-green-300' : 'bg-green-100/50 border-green-400 text-green-700'} border px-4 py-3 rounded-lg font-mono text-sm backdrop-blur-sm mb-6`}>
            {success}
          </div>
        )}

        {/* Search and Create Button */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-8">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono`}
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
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded-lg text-amber-400 flex items-center space-x-2 transition-all duration-300"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Template</span>
          </button>
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-300'} border rounded-xl p-6 max-w-2xl w-full mx-4`}>
              <h3 className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Create New Template</h3>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-400 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-100/50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600`}
                    placeholder="e.g., Professional Fine Dining"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-amber-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-100/50 border-gray-300 text-gray-900'} border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600`}
                    placeholder="Describe the personality and best use cases..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-400 mb-1">Conversation Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => handleInputChange('tone', e.target.value)}
                    className={`w-full px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-100/50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600`}
                  >
                    <option value="FORMAL">Formal</option>
                    <option value="BALANCED">Balanced</option>
                    <option value="CASUAL">Casual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-400 mb-1">Response Style</label>
                  <select
                    value={formData.responseStyle}
                    onChange={(e) => handleInputChange('responseStyle', e.target.value)}
                    className={`w-full px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-100/50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600`}
                  >
                    <option value="HELPFUL">Helpful</option>
                    <option value="CONCISE">Concise</option>
                    <option value="DETAILED">Detailed</option>
                    <option value="PLAYFUL">Playful</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-400 mb-1">Default Welcome Message</label>
                  <textarea
                    value={formData.defaultWelcomeMessage}
                    onChange={(e) => handleInputChange('defaultWelcomeMessage', e.target.value)}
                    className={`w-full px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-100/50 border-gray-300 text-gray-900'} border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600`}
                    placeholder="Optional default welcome message for this template..."
                  />
                </div>

                {/* Plan Requirements Section */}
                <div className={`border-t ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} pt-4`}>
                  <h4 className="text-lg font-semibold text-amber-400 mb-4">💰 Plan Requirements</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-amber-400 mb-1">Minimum Plan Required</label>
                      <select
                        value={formData.minimumPlan}
                        onChange={(e) => handleInputChange('minimumPlan', e.target.value)}
                        className={`w-full px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-100/50 border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600`}
                      >
                        <option value="">Any Plan (Available to all)</option>
                        <option value="STARTER">Starter ($29/mo) +</option>
                        <option value="PROFESSIONAL">Professional ($79/mo) +</option>
                        <option value="ENTERPRISE">Enterprise ($199/mo) +</option>
                      </select>
                      <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs mt-1`}>
                        Higher plans automatically include lower plan templates
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPremium}
                          onChange={(e) => handleInputChange('isPremium', e.target.checked.toString())}
                          className={`w-5 h-5 text-amber-600 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-400'} rounded focus:ring-amber-600 focus:ring-2`}
                        />
                        <div>
                          <span className="text-sm font-medium text-amber-400">Premium Template</span>
                          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
                            Mark as premium for special features & priority
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className={`px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-700'} border rounded-lg`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded-lg text-amber-400"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Knowledge Management Modal */}
        {showKnowledgeModal && selectedTemplateForKnowledge && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-300'} border rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Manage Knowledge for Template</h3>
                <button
                  onClick={() => {
                    setShowKnowledgeModal(false);
                    setSelectedTemplateForKnowledge(null);
                  }}
                  className={`${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Knowledge */}
                <div>
                  <h4 className="text-lg font-semibold text-amber-400 mb-4">Available Knowledge</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allKnowledge?.snippets?.map((snippet) => (
                      <div key={snippet.id} className={`flex items-center justify-between p-3 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{snippet.title}</p>
                          <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{snippet.category}</p>
                        </div>
                        <button
                          onClick={() => assignKnowledgeMutation.mutate({
                            templateId: selectedTemplateForKnowledge,
                            knowledgeId: snippet.id
                          })}
                          className="ml-2 px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded text-amber-400 text-xs"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned Knowledge */}
                <div>
                  <h4 className="text-lg font-semibold text-orange-400 mb-4">Assigned Knowledge</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {templateKnowledge?.map((knowledge) => (
                      <div key={knowledge.id} className="flex items-center justify-between p-3 bg-orange-900/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{knowledge.title}</p>
                          <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{knowledge.category}</p>
                        </div>
                        <button
                          onClick={() => removeKnowledgeMutation.mutate({
                            templateId: selectedTemplateForKnowledge,
                            knowledgeId: knowledge.id
                          })}
                          className="ml-2 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div className="space-y-4">
          {templatesLoading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>LOADING TEMPLATES...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl block mb-4">🤖</span>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>No templates found</p>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>Create your first template to get started</p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-300'} backdrop-blur-sm border rounded-xl p-6 hover:border-amber-600/30 transition-all duration-300`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{template.name}</h3>
                      {template.isPremium && (
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs font-mono">
                          PREMIUM
                        </span>
                      )}
                      {template.minimumPlan && (
                        <span className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded-full text-xs font-mono">
                          {template.minimumPlan}+
                        </span>
                      )}
                    </div>
                    <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-sm mb-4`}>
                      {template.description}
                    </p>
                    <div className={`flex items-center space-x-4 text-xs ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>
                      <span>Tone: {template.tone}</span>
                      <span>Style: {template.responseStyle}</span>
                      <span>Used by: {template._count?.restaurants || 0} restaurants</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedTemplateForKnowledge(template.id);
                        setShowKnowledgeModal(true);
                      }}
                      className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-600/20 rounded-lg transition-all duration-300"
                      title="Manage Knowledge"
                    >
                      📚
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-600/20 rounded-lg transition-all duration-300"
                      title="Edit template"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition-all duration-300"
                      title="Delete template"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Inline Edit Form */}
                {editingTemplate === template.id && (
                  <div className={`mt-4 pt-4 border-t ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-amber-400 mb-1">Minimum Plan</label>
                        <select
                          value={editFormData?.minimumPlan || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, minimumPlan: e.target.value }))}
                          className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-100/50 border-gray-300 text-gray-900'} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`}
                        >
                          <option value="">Any Plan</option>
                          <option value="STARTER">Starter ($29/mo) +</option>
                          <option value="PROFESSIONAL">Professional ($79/mo) +</option>
                          <option value="ENTERPRISE">Enterprise ($199/mo) +</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFormData?.isPremium || false}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, isPremium: e.target.checked }))}
                            className={`w-4 h-4 text-amber-600 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-400'} rounded focus:ring-amber-600 focus:ring-2`}
                          />
                          <span className="text-sm text-amber-400">Premium Template</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={handleCancelEdit}
                        className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-700'} border rounded text-sm`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(template.id)}
                        className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded text-amber-400 text-sm"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50' : 'bg-gray-200/50 border-gray-400 text-gray-700 hover:bg-gray-300/50'} border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm`}
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
                    : actualTheme === 'dark'
                    ? 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                    : 'bg-gray-200/50 border border-gray-400 text-gray-700 hover:bg-gray-300/50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className={`px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50' : 'bg-gray-200/50 border-gray-400 text-gray-700 hover:bg-gray-300/50'} border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm`}
            >
              Next
            </button>
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

  // Check if user has permission to manage templates
  if (!hasPermission(session.role, "canManageTemplates")) {
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
        name: session.name || undefined,
        role: session.role,
      },
    },
  };
};