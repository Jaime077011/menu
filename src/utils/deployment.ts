import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Optional services
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  ANALYTICS_ID: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

// Production environment validation
export const validateEnvironment = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Validate required environment variables
    envSchema.parse(process.env);
    
    // Additional production checks
    if (process.env.NODE_ENV === 'production') {
      // Check for production-specific requirements
      if (!process.env.SENTRY_DSN) {
        warnings.push('Sentry DSN not configured - error tracking disabled');
      }
      
      if (!process.env.ANALYTICS_ID) {
        warnings.push('Analytics ID not configured - analytics disabled');
      }
      
      // Check database URL for production
      if (process.env.DATABASE_URL?.includes('localhost')) {
        errors.push('Production should not use localhost database');
      }
      
      // Check NextAuth URL
      if (process.env.NEXTAUTH_URL?.includes('localhost')) {
        errors.push('Production should not use localhost for NextAuth URL');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    } else {
      errors.push('Environment validation failed');
    }
    
    return {
      isValid: false,
      errors,
      warnings,
    };
  }
};

// Build optimization checks
export const checkBuildOptimization = (): {
  isOptimized: boolean;
  recommendations: string[];
} => {
  const recommendations: string[] = [];
  
  // Check if running in production mode
  if (process.env.NODE_ENV !== 'production') {
    recommendations.push('Set NODE_ENV=production for optimal performance');
  }
  
  // Check for bundle analyzer
  if (!process.env.ANALYZE) {
    recommendations.push('Use ANALYZE=true to analyze bundle size');
  }
  
  // Check for image optimization
  recommendations.push('Ensure images are optimized (WebP format recommended)');
  
  // Check for code splitting
  recommendations.push('Verify dynamic imports are used for large components');
  
  // Check for caching strategies
  recommendations.push('Configure proper caching headers for static assets');
  
  return {
    isOptimized: recommendations.length === 0,
    recommendations,
  };
};

// Database connection health check
export const checkDatabaseHealth = async (): Promise<{
  isHealthy: boolean;
  latency?: number;
  error?: string;
}> => {
  try {
    const startTime = Date.now();
    
    // Dynamic import to avoid client-side issues
    const { db } = await import('@/server/db');
    
    // Simple health check query
    await db.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - startTime;
    
    return {
      isHealthy: true,
      latency,
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
};

// API endpoints health check
export const checkAPIHealth = async (): Promise<{
  isHealthy: boolean;
  endpoints: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }>;
}> => {
  const endpoints: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {};
  
  const testEndpoints = [
    '/api/trpc/restaurant.getAll',
    '/api/trpc/menu.getByRestaurant',
    '/api/health', // We'll create this
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint, { method: 'HEAD' });
      const latency = Date.now() - startTime;
      
      endpoints[endpoint] = {
        status: response.ok ? 'ok' : 'error',
        latency,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      endpoints[endpoint] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }
  
  const isHealthy = Object.values(endpoints).every(ep => ep.status === 'ok');
  
  return {
    isHealthy,
    endpoints,
  };
};

// Performance metrics collection
export const collectPerformanceMetrics = (): {
  metrics: Record<string, number>;
  recommendations: string[];
} => {
  const metrics: Record<string, number> = {};
  const recommendations: string[] = [];
  
  // Core Web Vitals (if available)
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
      metrics.firstPaint = navigation.responseEnd - navigation.requestStart;
      
      // Recommendations based on metrics
      if (metrics.domContentLoaded > 1500) {
        recommendations.push('DOM Content Loaded time is high - consider code splitting');
      }
      
      if (metrics.loadComplete > 3000) {
        recommendations.push('Page load time is high - optimize assets and reduce bundle size');
      }
    }
    
    // Memory usage (if available)
    const memory = (performance as any).memory;
    if (memory) {
      metrics.memoryUsed = memory.usedJSHeapSize / 1024 / 1024; // MB
      metrics.memoryLimit = memory.jsHeapSizeLimit / 1024 / 1024; // MB
      
      if (metrics.memoryUsed > 50) {
        recommendations.push('High memory usage detected - check for memory leaks');
      }
    }
  }
  
  return {
    metrics,
    recommendations,
  };
};

// Security checks
export const checkSecurity = (): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      issues.push('Site is not served over HTTPS in production');
    }
  }
  
  // Check for secure headers (would need to be checked server-side)
  recommendations.push('Ensure Content Security Policy (CSP) headers are configured');
  recommendations.push('Verify HSTS headers are set for HTTPS');
  recommendations.push('Check that sensitive data is not logged in production');
  
  // Check environment variables exposure
  if (typeof window !== 'undefined') {
    const exposedEnvVars = Object.keys(window.process?.env || {});
    if (exposedEnvVars.length > 0) {
      issues.push(`Environment variables exposed to client: ${exposedEnvVars.join(', ')}`);
    }
  }
  
  return {
    isSecure: issues.length === 0,
    issues,
    recommendations,
  };
};

// Comprehensive deployment readiness check
export const checkDeploymentReadiness = async (): Promise<{
  isReady: boolean;
  score: number;
  checks: {
    environment: ReturnType<typeof validateEnvironment>;
    database: Awaited<ReturnType<typeof checkDatabaseHealth>>;
    api: Awaited<ReturnType<typeof checkAPIHealth>>;
    performance: ReturnType<typeof collectPerformanceMetrics>;
    security: ReturnType<typeof checkSecurity>;
    optimization: ReturnType<typeof checkBuildOptimization>;
  };
  summary: {
    passed: number;
    total: number;
    criticalIssues: string[];
    recommendations: string[];
  };
}> => {
  console.log('🔍 Running deployment readiness checks...');
  
  // Run all checks
  const environment = validateEnvironment();
  const database = await checkDatabaseHealth();
  const api = await checkAPIHealth();
  const performance = collectPerformanceMetrics();
  const security = checkSecurity();
  const optimization = checkBuildOptimization();
  
  // Calculate score
  const checks = [
    environment.isValid,
    database.isHealthy,
    api.isHealthy,
    security.isSecure,
  ];
  
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  const score = Math.round((passed / total) * 100);
  
  // Collect critical issues
  const criticalIssues: string[] = [];
  if (!environment.isValid) criticalIssues.push(...environment.errors);
  if (!database.isHealthy) criticalIssues.push(`Database: ${database.error}`);
  if (!api.isHealthy) criticalIssues.push('API endpoints failing');
  if (!security.isSecure) criticalIssues.push(...security.issues);
  
  // Collect all recommendations
  const recommendations: string[] = [
    ...environment.warnings,
    ...performance.recommendations,
    ...security.recommendations,
    ...optimization.recommendations,
  ];
  
  const isReady = criticalIssues.length === 0 && score >= 75;
  
  return {
    isReady,
    score,
    checks: {
      environment,
      database,
      api,
      performance,
      security,
      optimization,
    },
    summary: {
      passed,
      total,
      criticalIssues,
      recommendations,
    },
  };
};

// Deployment configuration for different environments
export const deploymentConfigs = {
  development: {
    name: 'Development',
    url: 'http://localhost:3001',
    database: 'Local SQLite/MySQL',
    features: ['Hot reload', 'Debug mode', 'Source maps'],
  },
  
  staging: {
    name: 'Staging',
    url: 'https://staging.yourapp.com',
    database: 'Staging database',
    features: ['Production build', 'Error tracking', 'Performance monitoring'],
  },
  
  production: {
    name: 'Production',
    url: 'https://yourapp.com',
    database: 'Production database',
    features: ['Optimized build', 'CDN', 'Full monitoring', 'Backup systems'],
  },
};

// Vercel-specific deployment utilities
export const vercelDeployment = {
  // Environment variables for Vercel
  getVercelEnvVars: () => ({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.VERCEL_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  }),
  
  // Build command optimization
  getBuildCommand: () => {
    return process.env.NODE_ENV === 'production' 
      ? 'npm run build'
      : 'npm run build:dev';
  },
  
  // Recommended Vercel configuration
  getVercelConfig: () => ({
    version: 2,
    builds: [
      {
        src: 'package.json',
        use: '@vercel/next',
      },
    ],
    env: {
      DATABASE_URL: '@database-url',
      NEXTAUTH_SECRET: '@nextauth-secret',
      OPENAI_API_KEY: '@openai-api-key',
    },
    functions: {
      'pages/api/**/*.ts': {
        maxDuration: 30,
      },
    },
  }),
};

export default {
  validateEnvironment,
  checkBuildOptimization,
  checkDatabaseHealth,
  checkAPIHealth,
  collectPerformanceMetrics,
  checkSecurity,
  checkDeploymentReadiness,
  deploymentConfigs,
  vercelDeployment,
};