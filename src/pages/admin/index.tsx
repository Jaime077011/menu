import { type GetServerSideProps } from "next";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import AdminLayout from "@/components/AdminLayout";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminDashboardProps {
  session: AdminSession;
}

export default function AdminDashboard({ session }: AdminDashboardProps) {
  const { actualTheme } = useTheme();

  return (
    <AdminLayout session={session} title="NEXUS Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Menu Management Card */}
        <div className={`backdrop-blur-sm border rounded-xl overflow-hidden hover:border-amber-600/30 transition-all duration-300 group ${
          actualTheme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-mono truncate ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    MENU MANAGEMENT
                  </dt>
                  <dd className={`text-lg font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'
                  }`}>
                    MANAGE ITEMS
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className={`px-6 py-3 border-t ${
            actualTheme === 'dark'
              ? 'bg-gray-800/30 border-gray-700/50'
              : 'bg-gray-100/50 border-gray-200'
          }`}>
            <div className="text-sm">
              <a href="/admin/menu" className={`font-mono transition-colors ${
                actualTheme === 'dark'
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-600 hover:text-amber-700'
              }`}>
                VIEW MENU ITEMS →
              </a>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className={`backdrop-blur-sm border rounded-xl overflow-hidden hover:border-green-400/30 transition-all duration-300 group ${
          actualTheme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-mono truncate ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    RECENT ORDERS
                  </dt>
                  <dd className={`text-lg font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-green-300' : 'text-green-600'
                  }`}>
                    VIEW ALL
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className={`px-6 py-3 border-t ${
            actualTheme === 'dark'
              ? 'bg-gray-800/30 border-gray-700/50'
              : 'bg-gray-100/50 border-gray-200'
          }`}>
            <div className="text-sm">
              <a href="/admin/orders" className={`font-mono transition-colors ${
                actualTheme === 'dark'
                  ? 'text-green-400 hover:text-green-300'
                  : 'text-green-600 hover:text-green-700'
              }`}>
                VIEW ORDERS →
              </a>
            </div>
          </div>
        </div>

        {/* Kitchen Dashboard Card */}
        <div className={`backdrop-blur-sm border rounded-xl overflow-hidden hover:border-orange-400/30 transition-all duration-300 group ${
          actualTheme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-mono truncate ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    KITCHEN DASHBOARD
                  </dt>
                  <dd className={`text-lg font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                  }`}>
                    LIVE ORDERS
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className={`px-6 py-3 border-t ${
            actualTheme === 'dark'
              ? 'bg-gray-800/30 border-gray-700/50'
              : 'bg-gray-100/50 border-gray-200'
          }`}>
            <div className="text-sm">
              <a href="/admin/kitchen" className={`font-mono transition-colors ${
                actualTheme === 'dark'
                  ? 'text-orange-400 hover:text-orange-300'
                  : 'text-orange-600 hover:text-orange-700'
              }`}>
                VIEW KITCHEN →
              </a>
            </div>
          </div>
        </div>

        {/* QR Codes Card */}
        <div className={`backdrop-blur-sm border rounded-xl overflow-hidden hover:border-red-400/30 transition-all duration-300 group ${
          actualTheme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-mono truncate ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    QR CODES
                  </dt>
                  <dd className={`text-lg font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-red-300' : 'text-red-600'
                  }`}>
                    GENERATE & PRINT
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className={`px-6 py-3 border-t ${
            actualTheme === 'dark'
              ? 'bg-gray-800/30 border-gray-700/50'
              : 'bg-gray-100/50 border-gray-200'
          }`}>
            <div className="text-sm">
              <a href="/admin/qr-codes" className={`font-mono transition-colors ${
                actualTheme === 'dark'
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-red-600 hover:text-red-700'
              }`}>
                MANAGE QR CODES →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className={`mt-8 backdrop-blur-sm border rounded-xl ${
        actualTheme === 'dark'
          ? 'bg-gray-900/50 border-gray-800'
          : 'bg-white/50 border-gray-200'
      }`}>
        <div className="px-6 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-mono font-bold text-sm">🍽</span>
            </div>
            <h3 className={`text-lg leading-6 font-mono font-bold ${
              actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'
            }`}>
              RESTAURANT INFORMATION
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className={`p-4 rounded-lg border ${
              actualTheme === 'dark'
                ? 'bg-gray-800/30 border-gray-700/50'
                : 'bg-gray-100/50 border-gray-200'
            }`}>
              <dt className={`text-sm font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>RESTAURANT NAME</dt>
              <dd className={`mt-2 text-sm font-mono font-bold ${
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{session.restaurantName}</dd>
            </div>
            <div className={`p-4 rounded-lg border ${
              actualTheme === 'dark'
                ? 'bg-gray-800/30 border-gray-700/50'
                : 'bg-gray-100/50 border-gray-200'
            }`}>
              <dt className={`text-sm font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>ADMIN EMAIL</dt>
              <dd className={`mt-2 text-sm font-mono ${
                actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'
              }`}>{session.email}</dd>
            </div>
            <div className={`p-4 rounded-lg border ${
              actualTheme === 'dark'
                ? 'bg-gray-800/30 border-gray-700/50'
                : 'bg-gray-100/50 border-gray-200'
            }`}>
              <dt className={`text-sm font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>RESTAURANT ID</dt>
              <dd className={`mt-2 text-sm font-mono px-2 py-1 rounded ${
                actualTheme === 'dark'
                  ? 'text-gray-300 bg-gray-700/50'
                  : 'text-gray-700 bg-gray-200/50'
              }`}>{session.restaurantId}</dd>
            </div>
            <div className={`p-4 rounded-lg border ${
              actualTheme === 'dark'
                ? 'bg-gray-800/30 border-gray-700/50'
                : 'bg-gray-100/50 border-gray-200'
            }`}>
              <dt className={`text-sm font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>USER ROLE</dt>
              <dd className={`mt-2 text-sm font-mono font-bold uppercase ${
                actualTheme === 'dark' ? 'text-orange-300' : 'text-orange-600'
              }`}>{session.role}</dd>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);

  // Redirect to login if not authenticated or not an admin
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