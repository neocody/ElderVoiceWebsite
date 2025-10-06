import os from "os";

let requestCount = 0;
let totalResponseTime = 0;
let throughputPerMinute = 0;

setInterval(() => {
  throughputPerMinute = requestCount;
  requestCount = 0;
}, 60 * 1000);

interface ServiceStatus {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime?: number;
  lastCheck?: string;
}

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  services: Record<string, ServiceStatus>;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

interface HealthCheckService {
  getHealthStatus(): Promise<HealthCheckResult>;
}

interface CacheService {
  getStats(): CacheStats;
}

// Middleware to track response times only
export function statsMiddleware(req: any, res: any, next: () => void): void {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const ms = diff[0] * 1000 + diff[1] / 1e6;
    totalResponseTime += ms;
    requestCount++;
  });

  next();
}

// CPU usage (%)
function getCPUUsage(): string {
  const cpus = os.cpus();
  let user = 0,
    nice = 0,
    sys = 0,
    idle = 0,
    irq = 0;

  cpus.forEach((cpu) => {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  });

  const total = user + nice + sys + idle + irq;
  return (((total - idle) / total) * 100).toFixed(2);
}

// Main function to collect ALL stats
export async function getSystemStats({
  healthCheckService,
  cacheService,
}: {
  healthCheckService: HealthCheckService;
  cacheService: CacheService;
}) {
  // External health and cache stats
  const [healthData, cacheStats] = await Promise.all([
    healthCheckService.getHealthStatus(),
    Promise.resolve(cacheService.getStats()),
  ]);

  // ---- Uptime ----
  const uptimeSeconds = process.uptime();
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

  // ---- Services ----
  const services = healthData.services || {};
  const totalServices = Object.keys(services).length;
  const healthyServices = Object.values(services).filter(
    (s) => s.status === "healthy",
  ).length;
  const degradedServices = Object.values(services).filter(
    (s) => s.status === "degraded",
  ).length;
  const unhealthyServices = Object.values(services).filter(
    (s) => s.status === "unhealthy",
  ).length;

  // ---- Memory ----
  const memoryUsage = process.memoryUsage();
  const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryUsagePercent = (memoryUsedMB / memoryTotalMB) * 100;

  // ---- Request metrics ----
  const avgResponseTime =
    requestCount > 0 ? (totalResponseTime / requestCount).toFixed(2) : "0.00";

  // Reset counters for next collection window
  totalResponseTime = 0;

  return {
    // System health overview
    systemStatus: healthData.status,
    uptime: `${uptimeHours}h ${uptimeMinutes}m`,
    uptimeSeconds,

    // Service health
    totalServices,
    healthyServices,
    degradedServices,
    unhealthyServices,
    serviceHealthRate:
      totalServices > 0 ? (healthyServices / totalServices) * 100 : 0,

    // Performance metrics
    throughput: throughputPerMinute, // requests/min
    avgResponseTime,

    // CPU & Memory usage
    cpuUsage: getCPUUsage(),
    memoryUsedMB,
    memoryTotalMB,
    memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,

    // Cache statistics
    cacheHits: cacheStats.hits || 0,
    cacheMisses: cacheStats.misses || 0,
    cacheHitRate: cacheStats.hitRate || 0,
    cacheSize: cacheStats.size || 0,

    // Individual service status
    services: Object.entries(services).map(([name, service]) => ({
      name,
      status: service.status,
      responseTime: service.responseTime,
      lastCheck: service.lastCheck,
    })),

    lastUpdated: new Date().toISOString(),
  };
}
