/**
 * AI Performance Dashboard
 * Real-time monitoring and analytics for AI-driven action detection
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  Users, MessageSquare, Target, Zap, Activity
} from 'lucide-react';
import { api } from '@/utils/api';

// Simple UI Components to replace missing ones
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const Badge = ({ children, variant = "default", className = "" }: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
  className?: string;
}) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 text-gray-700"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, onClick, variant = "default", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
  className?: string;
}) => {
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  
  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Progress = ({ value, className = "" }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const Tabs = ({ children, defaultValue, className = "" }: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={`${className}`} data-active-tab={activeTab}>
      {React.Children.map(children, child => 
        React.isValidElement(child) ? React.cloneElement(child, { activeTab, setActiveTab } as any) : child
      )}
    </div>
  );
};

const TabsList = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`}>
    {children}
  </div>
);

const TabsTrigger = ({ children, value, activeTab, setActiveTab, className = "" }: {
  children: React.ReactNode;
  value: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  className?: string;
}) => (
  <button
    onClick={() => setActiveTab?.(value)}
    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === value 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-600 hover:text-gray-900'
    } ${className}`}
  >
    {children}
  </button>
);

const TabsContent = ({ children, value, activeTab, className = "" }: {
  children: React.ReactNode;
  value: string;
  activeTab?: string;
  className?: string;
}) => (
  activeTab === value ? <div className={className}>{children}</div> : null
);

interface AIMetrics {
  totalDecisions: number;
  successRate: number;
  averageConfidence: number;
  averageResponseTime: number;
  fallbackRate: number;
  memoryUtilization: number;
  activeConversations: number;
  dailyInteractions: number;
}

interface ConfidenceDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface FunctionCallStats {
  functionName: string;
  count: number;
  successRate: number;
  averageConfidence: number;
}

interface PerformanceTrend {
  timestamp: string;
  confidence: number;
  responseTime: number;
  successRate: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AIPerformanceDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch AI performance metrics
  const { data: metrics, refetch: refetchMetrics } = api.admin.getAIPerformanceMetrics.useQuery(
    { timeRange },
    { 
      refetchInterval,
      refetchOnWindowFocus: false 
    }
  );

  // Fetch confidence distribution
  const { data: confidenceData } = api.admin.getConfidenceDistribution.useQuery(
    { timeRange },
    { refetchInterval }
  );

  // Fetch function call statistics
  const { data: functionStatsData } = api.admin.getFunctionCallStats.useQuery(
    { timeRange },
    { refetchInterval }
  );

  // Fetch performance trends
  const { data: performanceTrendsData } = api.admin.getPerformanceTrends.useQuery(
    { timeRange },
    { refetchInterval }
  );

  // Fetch conversation insights
  const { data: conversationInsights } = api.admin.getConversationInsights.useQuery(
    { timeRange },
    { refetchInterval }
  );

  const handleRefresh = () => {
    refetchMetrics();
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return <Badge variant="success">Excellent</Badge>;
    if (value >= thresholds.warning) return <Badge variant="warning">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Performance Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and analytics for AI-driven interactions</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button onClick={handleRefresh} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.successRate ? `${(metrics.successRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {metrics?.successRate && getStatusBadge(metrics.successRate, { good: 0.85, warning: 0.75 })}
            </div>
            <Progress value={metrics?.successRate ? metrics.successRate * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageConfidence ? `${(metrics.averageConfidence * 100).toFixed(1)}%` : '0%'}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {metrics?.averageConfidence && getStatusBadge(metrics.averageConfidence, { good: 0.8, warning: 0.6 })}
            </div>
            <Progress value={metrics?.averageConfidence ? metrics.averageConfidence * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageResponseTime ? `${metrics.averageResponseTime.toFixed(0)}ms` : '0ms'}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {metrics?.averageResponseTime && (
                <Badge variant={metrics.averageResponseTime < 2000 ? "success" : 
                              metrics.averageResponseTime < 5000 ? "warning" : "destructive"}>
                  {metrics.averageResponseTime < 2000 ? "Fast" : 
                   metrics.averageResponseTime < 5000 ? "Moderate" : "Slow"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallback Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.fallbackRate ? `${(metrics.fallbackRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {metrics?.fallbackRate && (
                <Badge variant={metrics.fallbackRate < 0.1 ? "success" : 
                              metrics.fallbackRate < 0.2 ? "warning" : "destructive"}>
                  {metrics.fallbackRate < 0.1 ? "Excellent" : 
                   metrics.fallbackRate < 0.2 ? "Good" : "High"}
                </Badge>
              )}
            </div>
            <Progress value={metrics?.fallbackRate ? (1 - metrics.fallbackRate) * 100 : 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Decisions</span>
                    <span className="text-2xl font-bold">{metrics?.totalDecisions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Conversations</span>
                    <span className="text-2xl font-bold">{metrics?.activeConversations || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Interactions</span>
                    <span className="text-2xl font-bold">{metrics?.dailyInteractions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Utilization</span>
                    <span className="text-2xl font-bold">
                      {metrics?.memoryUtilization ? `${(metrics.memoryUtilization * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>AI Decision Quality</span>
                    {metrics?.averageConfidence && getStatusBadge(metrics.averageConfidence, { good: 0.8, warning: 0.6 })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response Performance</span>
                    {metrics?.averageResponseTime && (
                      <Badge variant={metrics.averageResponseTime < 2000 ? "success" : 
                                    metrics.averageResponseTime < 5000 ? "warning" : "destructive"}>
                        {metrics.averageResponseTime < 2000 ? "Excellent" : 
                         metrics.averageResponseTime < 5000 ? "Good" : "Needs Attention"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Error Rate</span>
                    {metrics?.fallbackRate && (
                      <Badge variant={metrics.fallbackRate < 0.1 ? "success" : 
                                    metrics.fallbackRate < 0.2 ? "warning" : "destructive"}>
                        {(metrics.fallbackRate * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Overall Status</span>
                    <Badge variant="success">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Confidence Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {confidenceData && confidenceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={confidenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No confidence data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confidence Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Confidence Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceTrendsData && performanceTrendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="functions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Function Call Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {functionStatsData && functionStatsData.length > 0 ? (
                <div className="space-y-4">
                  {functionStatsData.map((func, index) => (
                    <div key={func.functionName} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{func.functionName}</h3>
                        <Badge variant="outline">{func.count} calls</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={func.successRate * 100} className="flex-1" />
                            <span className="text-sm font-medium">{(func.successRate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Avg Confidence</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={func.averageConfidence * 100} className="flex-1" />
                            <span className="text-sm font-medium">{(func.averageConfidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No function call data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceTrendsData && performanceTrendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={performanceTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="confidence" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="successRate" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationInsights ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Average Session Length</span>
                      <span className="font-semibold">{conversationInsights.avgSessionLength || 0} messages</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Customer Satisfaction</span>
                      <Badge variant="success">{conversationInsights.satisfactionRate || 0}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory Utilization</span>
                      <span className="font-semibold">{conversationInsights.memoryUsage || 0}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    No conversation insights available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Top Conversation Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationInsights?.topTopics ? (
                  <div className="space-y-2">
                    {conversationInsights.topTopics.map((topic: any, index: number) => (
                      <div key={topic.topic} className="flex items-center justify-between">
                        <span className="text-sm">{topic.topic}</span>
                        <Badge variant="outline">{topic.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    No topic data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 