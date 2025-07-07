import { type GetServerSideProps } from "next";
import { getAdminSessionFromCookies } from "@/utils/auth";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Brain, ArrowLeft, Activity, TrendingUp } from "lucide-react";
import dynamic from 'next/dynamic';
import { useTheme } from "@/contexts/ThemeContext";

// Dynamically import AI dashboard to avoid SSR issues
const AIPerformanceDashboard = dynamic(
  () => import('@/components/admin/AIPerformanceDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI Analytics Dashboard...</p>
        </div>
      </div>
    )
  }
);

interface AIAnalyticsProps {
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

function AIAnalyticsContent({ user }: AIAnalyticsProps) {
  const { actualTheme } = useTheme();
  
  return (
    <>
      <Head>
        <title>AI Analytics - Restaurant Manager</title>
        <meta name="description" content="AI performance monitoring and analytics dashboard" />
      </Head>

      <div className={`min-h-screen ${actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className={`flex items-center ${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Link>
                <div className={`border-l ${actualTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'} pl-4`}>
                  <div className="flex items-center space-x-2">
                    <Brain className="w-6 h-6 text-blue-500" />
                    <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AI Analytics</h1>
                  </div>
                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Monitor AI performance and customer interactions</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-500 border border-green-500/30 rounded-full text-sm font-medium">
                  <Activity className="w-4 h-4" />
                  <span>AI System Online</span>
                </div>
                <Link
                  href="/api/auth/signout"
                  className={`${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* AI Performance Dashboard */}
        <AIPerformanceDashboard />
      </div>
    </>
  );
}

export default function AIAnalytics({ user }: AIAnalyticsProps) {
  return <AIAnalyticsContent user={user} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const session = getAdminSessionFromCookies(cookies);

  if (!session?.id) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.id,
        email: session.email,
        name: session.email, // Using email as name since custom auth doesn't have name field
      },
    },
  };
}; 