import { type NextApiRequest, type NextApiResponse } from 'next';
import { db } from '@/server/db';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'error';
      missing?: string[];
    };
    memory: {
      status: 'ok' | 'warning' | 'error';
      usage?: number;
      limit?: number;
    };
  };
  uptime: number;
}

// Track server start time for uptime calculation
const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  // Initialize response
  const healthCheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'ok' },
      environment: { status: 'ok' },
      memory: { status: 'ok' },
    },
    uptime,
  };

  let overallHealthy = true;

  try {
    // Database health check
    try {
      const dbStartTime = Date.now();
      await db.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - dbStartTime;
      
      healthCheck.checks.database = {
        status: 'ok',
        latency: dbLatency,
      };
      
      // Warn if database is slow
      if (dbLatency > 1000) {
        healthCheck.checks.database.status = 'error';
        healthCheck.checks.database.error = 'Database response time is slow';
        overallHealthy = false;
      }
    } catch (error) {
      healthCheck.checks.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
      overallHealthy = false;
    }

    // Environment variables check
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'OPENAI_API_KEY',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );
    
    if (missingEnvVars.length > 0) {
      healthCheck.checks.environment = {
        status: 'error',
        missing: missingEnvVars,
      };
      overallHealthy = false;
    }

    // Memory usage check (Node.js specific)
    try {
      const memoryUsage = process.memoryUsage();
      const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      
      healthCheck.checks.memory = {
        status: 'ok',
        usage: usedMB,
        limit: totalMB,
      };
      
      // Memory usage warnings
      if (usedMB > 512) {
        healthCheck.checks.memory.status = 'error';
        overallHealthy = false;
      } else if (usedMB > 256) {
        healthCheck.checks.memory.status = 'warning';
      }
    } catch (error) {
      healthCheck.checks.memory = {
        status: 'error',
      };
    }

    // Set overall status
    healthCheck.status = overallHealthy ? 'healthy' : 'unhealthy';

    // Return appropriate HTTP status code
    const statusCode = overallHealthy ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
    
  } catch (error) {
    // Fallback error response
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'error', error: 'Health check failed' },
        environment: { status: 'error' },
        memory: { status: 'error' },
      },
      uptime,
    };
    
    res.status(503).json(errorResponse);
  }
} 