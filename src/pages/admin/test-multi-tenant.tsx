import { useState } from "react";
import { type GetServerSideProps } from "next";
import Head from "next/head";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import { runClientSideTests } from "@/utils/client-tests";

interface MultiTenantTestPageProps {
  session: AdminSession;
}

export default function MultiTenantTestPage({ session }: MultiTenantTestPageProps) {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [clientResults, setClientResults] = useState<string[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(["🧪 Running multi-tenant tests..."]);

    try {
      const response = await fetch("/api/admin/test-multi-tenant", {
        method: "POST",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResults(data.logs || ["✅ Tests completed successfully"]);
      } else {
        setTestResults([
          "❌ Error running tests:",
          data.message || "Unknown error",
          ...(data.logs || []),
        ]);
      }
    } catch (error) {
      setTestResults([
        "❌ Network error:",
        error instanceof Error ? error.message : "Failed to connect to server"
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const runClientTests = () => {
    const results = runClientSideTests();
    const logs = results.map(result => {
      const emoji = result.status === "PASS" ? "✅" : "❌";
      return `${emoji} ${result.test}: ${result.message}`;
    });
    
    const passed = results.filter(r => r.status === "PASS").length;
    const total = results.length;
    logs.push("");
    logs.push(`📊 Client Tests: ${passed}/${total} passed`);
    
    setClientResults(logs);
  };

  return (
    <>
      <Head>
        <title>Multi-Tenant Testing - {session.restaurantName}</title>
        <meta name="description" content="Test multi-tenant functionality" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant System Test</h1>
            <p className="text-gray-600 mt-2">
              Validate subdomain routing, restaurant isolation, and data security
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Context</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-900">Restaurant</h3>
                <p className="text-indigo-700">{session.restaurantName}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900">Restaurant ID</h3>
                <p className="text-green-700 font-mono text-sm">{session.restaurantId}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-medium text-amber-900">Admin User</h3>
                <p className="text-amber-700">{session.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test URLs</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Pizza Palace Customer Chat:</span>
                <a 
                  href="http://pizza-palace.localhost:3000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-mono"
                >
                  pizza-palace.localhost:3000
                </a>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Burger Barn Customer Chat:</span>
                <a 
                  href="http://burger-barn.localhost:3000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-mono"
                >
                  burger-barn.localhost:3000
                </a>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Admin Dashboard:</span>
                <a 
                  href="http://localhost:3000/admin" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-mono"
                >
                  localhost:3000/admin
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client-Side Tests */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Client-Side Tests</h2>
                <button
                  onClick={runClientTests}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Run Client Tests
                </button>
              </div>

              {clientResults.length > 0 && (
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  {clientResults.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {clientResults.length === 0 && (
                <div className="text-gray-500 text-center py-8 text-sm">
                  Client-side subdomain and routing tests
                </div>
              )}
            </div>

            {/* Server-Side Tests */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Server-Side Tests</h2>
                <button
                  onClick={runTests}
                  disabled={isRunning}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning ? "Running Tests..." : "Run Server Tests"}
                </button>
              </div>

            {testResults.length > 0 && (
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                {testResults.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
              </div>
            )}

              {testResults.length === 0 && (
                <div className="text-gray-500 text-center py-8 text-sm">
                  Database isolation and restaurant data tests
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">🧪 What These Tests Check:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Subdomain extraction from various hostname formats</li>
              <li>• Restaurant data retrieval from subdomains</li>
              <li>• Data isolation between restaurants (menus, orders)</li>
              <li>• Invalid subdomain handling</li>
              <li>• Database security and proper filtering</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

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