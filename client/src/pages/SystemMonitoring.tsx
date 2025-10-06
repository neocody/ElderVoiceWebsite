import { useState } from "react";
import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Server,
  Cpu,
  MemoryStick,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Bug,
  Search,
  Info,
  Eye,
  TrendingUp,
} from "lucide-react";

interface ErrorLog {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  message: string;
  stack?: string;
  context: {
    userId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };
  fingerprint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  tags: string[];
}

interface SystemMetrics {
  // System health overview
  systemStatus: string;
  uptime: string;
  uptimeSeconds: number;

  // Service health
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  serviceHealthRate: number;

  // Performance metrics
  throughput: number; // requests per minute
  avgResponseTime: number; // renamed from averageResponseTime
  totalRequests: number; // must be included (was missing in original interface)

  // CPU & Memory usage
  cpuUsage: number; // e.g., percentage (0–100)
  memoryUsedMB: number;
  memoryTotalMB: number;
  memoryUsagePercent: number;

  // Cache statistics
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  cacheSize: number;

  // Individual service status
  services: Array<{
    name: string;
    status: string;
    responseTime?: number;
    lastCheck?: string;
  }>;

  lastUpdated: string;
}

interface ErrorStats {
  totalErrors: number;
  errorsByLevel: {
    error: number;
    warn: number;
    info: number;
    debug: number;
  };
  errorsByEndpoint: Record<string, number>;
  errorRate: number;
  unresolvedCount: number;
}

interface CacheStats {
  mainCache: {
    size: number;
    max: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  shortTermCache: {
    size: number;
    max: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  // Combined statistics for convenience
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

export default function SystemMonitoring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  // Cache stats query
  const { data: cacheStats = {} as Partial<CacheStats> } = useQuery<CacheStats>(
    {
      queryKey: ["/api/admin/cache/stats"],
      refetchInterval: 10000,
    },
  );

  // System metrics query
  const { data: systemMetrics = {} as SystemMetrics } = useQuery<SystemMetrics>(
    {
      queryKey: ["/api/admin/stats/system"],
      refetchInterval: 5000,
    },
  );

  // Error tracking queries
  const {
    data: errorStats = {
      totalErrors: 0,
      errorsByLevel: { error: 0, warn: 0, info: 0, debug: 0 },
      errorsByEndpoint: {},
      errorRate: 0,
      unresolvedCount: 0,
    },
  } = useQuery<ErrorStats>({
    queryKey: ["/api/admin/errors/stats"],
    refetchInterval: 30000,
  });

  const { data: recentErrors = [] } = useQuery<ErrorLog[]>({
    queryKey: ["/api/admin/errors/recent"],
    refetchInterval: 15000,
  });

  // Test error generation mutation
  const testErrorMutation = useMutation({
    mutationFn: (data: { level: string; message: string }) =>
      apiRequest("POST", "/api/admin/errors/test", data),
    onSuccess: () => {
      toast({
        title: "Test Error Generated",
        description: "A real application error has been logged for testing",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/errors/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/errors/recent"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: (errorId: string) =>
      apiRequest("PATCH", `/api/admin/errors/${errorId}/resolve`),
    onSuccess: () => {
      toast({
        title: "Error Resolved",
        description: "Error has been marked as resolved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/errors/recent"] });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/cache/clear"),
    onSuccess: () => {
      toast({
        title: "Cache Cleared",
        description: "All cache data has been cleared successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cache/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cache Clear Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Error tracking helper functions
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "debug":
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getLevelBadgeVariant = (
    level: string,
  ): "destructive" | "default" | "secondary" => {
    switch (level) {
      case "error":
        return "destructive";
      case "warn":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredErrors = recentErrors.filter((error: ErrorLog) => {
    const matchesSearch =
      !searchQuery ||
      error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      error.context.endpoint?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === "all" || error.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const generateTestError = () => {
    const levels = ["error", "warn", "info"];
    const messages = [
      "Database connection timeout",
      "API rate limit exceeded",
      "Invalid user input received",
      "Authentication token expired",
      "File upload failed",
    ];

    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];

    testErrorMutation.mutate({ level, message });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "unhealthy":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "unhealthy":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              System Monitoring
            </h1>
            <p className="text-muted-foreground">
              Real-time system health, performance metrics, and error tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateTestError}
              disabled={testErrorMutation.isPending}
              variant="outline"
            >
              {testErrorMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Bug className="h-4 w-4" />
              )}
              Generate Test Error
            </Button>
          </div>
        </div>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="errors">Error Tracking</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    System Status
                  </CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemMetrics.systemStatus || "unknown")}
                    <span
                      className={`text-sm font-medium ${getStatusColor(systemMetrics.systemStatus || "unknown")}`}
                    >
                      {(systemMetrics.systemStatus || "Unknown")
                        .charAt(0)
                        .toUpperCase() +
                        (systemMetrics.systemStatus || "unknown").slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uptime: {systemMetrics.uptime || "Unknown"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Memory Usage
                  </CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics.memoryUsedMB || 0}MB
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {systemMetrics.memoryTotalMB || 0}MB total
                  </p>
                  <Progress
                    value={systemMetrics.memoryUsagePercent || 0}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    CPU Usage
                  </CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics.serviceHealthRate?.toFixed(2) ?? 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Service health rate
                  </p>
                  <Progress
                    value={systemMetrics.serviceHealthRate || 0}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Errors
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics.totalRequests || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total requests processed
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Service Health</CardTitle>
                  <CardDescription>
                    External service connectivity status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemMetrics.services ? (
                      systemMetrics.services.map(
                        (service: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(service.status || "unknown")}
                              <span className="capitalize">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm ${getStatusColor(service.status || "unknown")}`}
                              >
                                {service.status || "Unknown"}
                              </span>
                              {service.responseTime && (
                                <Badge variant="outline">
                                  {service.responseTime}ms
                                </Badge>
                              )}
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No service data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Error Summary</CardTitle>
                  <CardDescription>
                    Error distribution by severity level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(errorStats.errorsByLevel || {}).map(
                      ([level, count]) => (
                        <div
                          key={level}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {getLevelIcon(level)}
                            <span className="capitalize">{level}</span>
                          </div>
                          <Badge variant={getLevelBadgeVariant(level)}>
                            {count}
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Request Throughput
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics.throughput || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">requests/min</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Response Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics.avgResponseTime || 0}ms
                  </div>
                  <p className="text-xs text-muted-foreground">average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Error Rate
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(errorStats.errorRate * 100).toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    error percentage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Connections
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics.throughput || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">concurrent</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search errors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Errors
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {errorStats.totalErrors}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time errors logged
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Error Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(errorStats.errorRate * 100).toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current error rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Unresolved
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {errorStats.unresolvedCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Critical Errors
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {errorStats.errorsByLevel?.error || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    High priority issues
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>
                  Latest application errors and exceptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredErrors.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-muted-foreground">No errors found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recentErrors.length === 0
                        ? "No errors have been logged yet"
                        : "Try adjusting your filters"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredErrors.map((error: ErrorLog) => (
                      <div
                        key={error.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getLevelIcon(error.level)}
                            <Badge variant={getLevelBadgeVariant(error.level)}>
                              {error.level.toUpperCase()}
                            </Badge>
                            {error.count > 1 && (
                              <Badge variant="outline">{error.count}x</Badge>
                            )}
                            {error.resolved && (
                              <Badge variant="secondary">Resolved</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                resolveErrorMutation.mutate(error.id)
                              }
                              disabled={
                                error.resolved || resolveErrorMutation.isPending
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {error.resolved ? "Resolved" : "Mark Resolved"}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium">{error.message}</p>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            <p>Time: {formatTimestamp(error.timestamp)}</p>
                            {error.context.endpoint && (
                              <p>
                                Endpoint:{" "}
                                <code className="bg-muted px-1 rounded">
                                  {error.context.endpoint}
                                </code>
                              </p>
                            )}
                            {error.context.userId && (
                              <p>User: {error.context.userId}</p>
                            )}
                          </div>
                        </div>

                        {error.stack && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-muted-foreground">
                              Stack trace
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Main Cache</CardTitle>
                  <CardDescription>
                    Primary application cache statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{cacheStats.mainCache?.size || 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Size:</span>
                      <span>{cacheStats.mainCache?.max || 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span>
                        {cacheStats.mainCache?.hitRate
                          ? (cacheStats.mainCache.hitRate * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        ((cacheStats.mainCache?.size || 0) /
                          (cacheStats.mainCache?.max || 1)) *
                        100
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Short-term Cache</CardTitle>
                  <CardDescription>
                    Temporary cache for quick access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{cacheStats.shortTermCache?.size || 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Size:</span>
                      <span>{cacheStats.shortTermCache?.max || 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span>
                        {cacheStats.shortTermCache?.hitRate
                          ? (cacheStats.shortTermCache.hitRate * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        ((cacheStats.shortTermCache?.size || 0) /
                          (cacheStats.shortTermCache?.max || 1)) *
                        100
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cache Management</CardTitle>
                <CardDescription>
                  Administrative controls for cache operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => clearCacheMutation.mutate()}
                    disabled={clearCacheMutation.isPending}
                    variant="outline"
                  >
                    {clearCacheMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Clear All Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
