import { db } from "../db";
import { sql } from "drizzle-orm";
import { cacheService } from "./cacheService";
import fetch from "node-fetch";
import * as os from "os";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    twilio: ServiceHealth;
    openai: ServiceHealth;
    elevenlabs: ServiceHealth;
    sendgrid: ServiceHealth;
    stripe: ServiceHealth;
  };
  system: {
    memory: MemoryInfo;
    disk: DiskInfo;
    cpu: CpuInfo;
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeConnections: number;
  };
}

export interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime?: number;
  lastCheck: string;
  error?: string;
  details?: any;
}

export interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
  heap: {
    used: number;
    total: number;
  };
}

export interface DiskInfo {
  available: number;
  total: number;
  percentage: number;
}

export interface CpuInfo {
  usage: number;
  load: number[];
}

export class HealthCheckService {
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private activeConnections: number = 0;

  constructor() {
    // Clean up old metrics every hour
    setInterval(() => {
      this.responseTimes = this.responseTimes.slice(-1000); // Keep last 1000
    }, 3600000);
  }

  // Main health check method
  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    const services = await this.checkAllServices();
    const system = await this.getSystemMetrics();
    const metrics = this.getApplicationMetrics();

    // Determine overall status
    const serviceStatuses = Object.values(services);
    const overallStatus = this.determineOverallStatus(serviceStatuses);

    return {
      status: overallStatus,
      timestamp,
      uptime,
      version: process.env.npm_package_version || "1.0.0",
      services,
      system,
      metrics,
    };
  }

  // Check all external services
  private async checkAllServices() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkTwilio(),
      this.checkOpenAI(),
      this.checkElevenLabs(),
      this.checkSendGrid(),
      this.checkStripe(),
    ]);

    return {
      database: this.getCheckResult(checks[0]),
      cache: this.getCheckResult(checks[1]),
      twilio: this.getCheckResult(checks[2]),
      openai: this.getCheckResult(checks[3]),
      elevenlabs: this.getCheckResult(checks[4]),
      sendgrid: this.getCheckResult(checks[5]),
      stripe: this.getCheckResult(checks[6]),
    };
  }

  // Database health check
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await db.execute(sql`SELECT 1 as health_check`);
      return {
        status: "healthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: { connection: "active" },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : "Unknown database error",
      };
    }
  }

  // Cache health check
  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const testKey = "health_check_test";
      const testValue = "test_value";

      cacheService.set(testKey, testValue);
      const retrieved = cacheService.get(testKey);
      cacheService.delete(testKey);

      if (retrieved !== testValue) {
        throw new Error("Cache read/write test failed");
      }

      const stats = cacheService.getStats();
      return {
        status: "healthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: stats,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Cache error",
      };
    }
  }

  // Twilio health check
  private async checkTwilio(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return {
          status: "degraded",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: "Twilio credentials not configured",
        };
      }

      // Check Twilio account status via API
      const authString = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
      ).toString("base64");
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
        {
          headers: { Authorization: `Basic ${authString}` },
        },
      );

      if (response.ok) {
        return {
          status: "healthy",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          details: { account: "active" },
        };
      } else {
        throw new Error(`Twilio API returned ${response.status}`);
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Twilio error",
      };
    }
  }

  // OpenAI health check
  private async checkOpenAI(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          status: "degraded",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: "OpenAI API key not configured",
        };
      }

      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      });

      if (response.ok) {
        return {
          status: "healthy",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          details: { api: "accessible" },
        };
      } else {
        throw new Error(`OpenAI API returned ${response.status}`);
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "OpenAI error",
      };
    }
  }

  // ElevenLabs health check
  private async checkElevenLabs(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!process.env.ELEVENLABS_API_KEY) {
        return {
          status: "degraded",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: "ElevenLabs API key not configured",
        };
      }

      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      });

      if (response.ok) {
        return {
          status: "healthy",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          details: { api: "accessible" },
        };
      } else {
        throw new Error(`ElevenLabs API returned ${response.status}`);
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "ElevenLabs error",
      };
    }
  }

  // SendGrid health check
  private async checkSendGrid(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!process.env.SENDGRID_API_KEY) {
        return {
          status: "degraded",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: "SendGrid API key not configured",
        };
      }

      const response = await fetch("https://api.sendgrid.com/v3/user/account", {
        headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` },
      });

      if (response.ok) {
        return {
          status: "healthy",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          details: { api: "accessible" },
        };
      } else {
        throw new Error(`SendGrid API returned ${response.status}`);
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "SendGrid error",
      };
    }
  }

  // Stripe health check
  private async checkStripe(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!process.env.STRIPE_SECRET) {
        return {
          status: "degraded",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: "Stripe secret key not configured",
        };
      }

      const response = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET}` },
      });

      if (response.ok) {
        return {
          status: "healthy",
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          details: { api: "accessible" },
        };
      } else {
        throw new Error(`Stripe API returned ${response.status}`);
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Stripe error",
      };
    }
  }

  // Get system metrics
  private async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const loadAvg = os.loadavg();

    return {
      memory: {
        used: totalMem - freeMem,
        total: totalMem,
        percentage: ((totalMem - freeMem) / totalMem) * 100,
        heap: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
        },
      },
      disk: {
        available: 0, // Would need additional package for disk space
        total: 0,
        percentage: 0,
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
        load: loadAvg,
      },
    };
  }

  // Get application metrics
  private getApplicationMetrics() {
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) /
          this.responseTimes.length
        : 0;

    return {
      totalRequests: this.requestCount,
      errorRate:
        this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      averageResponseTime: avgResponseTime,
      activeConnections: this.activeConnections,
    };
  }

  // Determine overall status from service statuses
  private determineOverallStatus(
    serviceStatuses: ServiceHealth[],
  ): "healthy" | "degraded" | "unhealthy" {
    const unhealthyCount = serviceStatuses.filter(
      (s) => s.status === "unhealthy",
    ).length;
    const degradedCount = serviceStatuses.filter(
      (s) => s.status === "degraded",
    ).length;

    if (unhealthyCount > 0) return "unhealthy";
    if (degradedCount > 1) return "degraded";
    return "healthy";
  }

  // Helper to extract result from Promise.allSettled
  private getCheckResult(
    result: PromiseSettledResult<ServiceHealth>,
  ): ServiceHealth {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        status: "unhealthy",
        lastCheck: new Date().toISOString(),
        error: result.reason?.message || "Health check failed",
      };
    }
  }

  // Metrics tracking methods
  incrementRequestCount(): void {
    this.requestCount++;
  }

  incrementErrorCount(): void {
    this.errorCount++;
  }

  recordResponseTime(time: number): void {
    this.responseTimes.push(time);
  }

  setActiveConnections(count: number): void {
    this.activeConnections = count;
  }

  // Simple health check for basic endpoints
  async getSimpleHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }
}

export const healthCheckService = new HealthCheckService();
