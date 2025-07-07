import { type GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import { useTheme } from "@/contexts/ThemeContext";

interface WaiterSettingsProps {
  session: AdminSession;
}

export default function WaiterSettings({ session }: WaiterSettingsProps) {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customSettings, setCustomSettings] = useState({
    waiterName: "Waiter",
    welcomeMessage: "",
    specialtyKnowledge: "",
  });

  // Check if we're on a subdomain and redirect to main domain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('.localhost') && hostname !== 'localhost') {
        const mainDomainUrl = window.location.href.replace(hostname, 'localhost');
        window.location.href = mainDomainUrl;
        return;
      }
    }
  }, []);

  // Use restaurant ID from session
  const restaurantId = session.restaurantId;

  // Fetch available templates
  const { data: templates, isLoading: templatesLoading, error: templatesError } = api.restaurant.getWaiterTemplates.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  // Fetch current waiter settings
  const { data: waiterSettings, refetch } = api.restaurant.getWaiterSettings.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  // Update form when data loads
  useEffect(() => {
    if (waiterSettings) {
      setSelectedTemplateId(waiterSettings.waiterPersonalityTemplateId || "");
      setCustomSettings({
        waiterName: waiterSettings.waiterName || "Waiter",
        welcomeMessage: waiterSettings.welcomeMessage || "",
        specialtyKnowledge: waiterSettings.specialtyKnowledge || "",
      });
    }
  }, [waiterSettings]);

  // Update mutation
  const updateMutation = api.restaurant.updateWaiterSettings.useMutation({
    onSuccess: () => {
      alert("✅ Waiter settings updated successfully!");
      refetch();
    },
    onError: (error) => {
      alert(`❌ Error: ${error.message}`);
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleSaveSettings = () => {
    if (!restaurantId) return;

    updateMutation.mutate({
      restaurantId,
      waiterName: customSettings.waiterName,
      welcomeMessage: customSettings.welcomeMessage,
      specialtyKnowledge: customSettings.specialtyKnowledge,
      waiterPersonalityTemplateId: selectedTemplateId || null,
    });
  };

  const getPersonalityIcon = (name: string) => {
    if (name.includes('Friendly')) return '😊';
    if (name.includes('Professional')) return '👔';
    if (name.includes('Casual')) return '😎';
    if (name.includes('Enthusiastic')) return '🎉';
    return '🤖';
  };

  const getPersonalityColor = (name: string) => {
    if (name.includes('Friendly')) return 'from-green-400 to-green-600';
    if (name.includes('Professional')) return 'from-amber-600 to-orange-700';
    if (name.includes('Casual')) return 'from-orange-400 to-yellow-400';
    if (name.includes('Enthusiastic')) return 'from-red-500 to-red-600';
    return 'from-gray-400 to-gray-600';
  };

  return (
    <AdminLayout session={session} title="NEXUS Waiter Personality Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className={`text-5xl font-bold bg-gradient-to-r ${
            actualTheme === 'dark' 
              ? 'from-white via-amber-200 to-orange-300' 
              : 'from-gray-800 via-amber-600 to-orange-700'
          } bg-clip-text text-transparent mb-4`}>
            Choose Your AI Waiter
          </h1>
          <p className={`text-xl ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Select the perfect personality for your restaurant's AI assistant. Each waiter comes with unique traits and specialized knowledge.
          </p>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`mb-6 p-4 ${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100 border-gray-200'} border rounded-lg text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>Debug:</strong> Restaurant ID: {restaurantId} | Templates: {templates?.length || 0} | Selected: {selectedTemplateId || 'None'}
            <br />
            <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}
          </div>
        )}

        {/* Loading State */}
        {templatesLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-amber-600/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className={`mt-4 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Loading available waiters...</p>
          </div>
        )}

        {/* Error State */}
        {templatesError && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-red-500 font-bold text-lg mb-2">Unable to Load Waiters</h3>
            <p className="text-red-500 mb-4">{templatesError.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-500 rounded-lg hover:bg-red-500/30 hover:border-red-400/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Waiter Templates Grid */}
        {templates && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`group relative ${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border-2 rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  selectedTemplateId === template.id
                    ? `border-amber-600 ${actualTheme === 'dark' ? 'bg-amber-600/10' : 'bg-amber-600/5'} shadow-amber-600/20 shadow-xl`
                    : `${actualTheme === 'dark' ? 'border-gray-700/50 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`
                }`}
              >
                {/* Premium Badge */}
                {template.isPremium && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                    ⭐ PREMIUM
                  </div>
                )}

                {/* Selection Indicator */}
                {selectedTemplateId === template.id && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Waiter Avatar */}
                <div className={`w-20 h-20 bg-gradient-to-r ${getPersonalityColor(template.name)} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                  <span className="text-3xl">{getPersonalityIcon(template.name)}</span>
                </div>

                {/* Waiter Info */}
                <div className="text-center mb-4">
                  <h3 className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>{template.name}</h3>
                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3`}>{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Tone:</span>
                      <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} capitalize`}>{template.tone.toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Style:</span>
                      <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} capitalize`}>{template.responseStyle.toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Sample Message */}
                {template.defaultWelcomeMessage && (
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg p-3 mb-4`}>
                    <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm italic`}>
                      "{template.defaultWelcomeMessage}"
                    </p>
                  </div>
                )}

                {/* Plan Requirement */}
                <div className="text-center">
                  <span className={`inline-block px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-full text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {template.minimumPlan ? `${template.minimumPlan}+ Plan` : 'All Plans'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Settings Section */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-2xl p-8 mb-8`}>
          <h2 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
            <svg className="w-6 h-6 mr-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Customize Your Waiter
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-bold ${actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'} mb-3`}>WAITER NAME</label>
              <input
                type="text"
                value={customSettings.waiterName}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, waiterName: e.target.value }))}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors`}
                placeholder="e.g., Mario, Sarah, Chef Tony"
              />
            </div>

            <div>
              <label className={`block text-sm font-bold ${actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'} mb-3`}>WELCOME MESSAGE</label>
              <textarea
                value={customSettings.welcomeMessage}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                rows={3}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors`}
                placeholder="Custom welcome message for your customers..."
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-bold ${actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'} mb-3`}>SPECIALTY KNOWLEDGE</label>
              <textarea
                value={customSettings.specialtyKnowledge}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, specialtyKnowledge: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors`}
                placeholder="Enter specific knowledge about your restaurant, cuisine, specialties, etc..."
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button
            onClick={handleSaveSettings}
            disabled={!selectedTemplateId && !customSettings.waiterName}
            className="px-12 py-4 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-600/50 transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center">
              {updateMutation.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SAVING...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  SAVE WAITER SETTINGS
                </>
              )}
            </span>
          </button>
        </div>
      </div>
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