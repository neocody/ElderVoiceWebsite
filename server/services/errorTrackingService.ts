import { cacheService } from "./cacheService";

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: "error" | "warn" | "info" | "debug";
  message: string;
  stack?: string;
  context: {
    userId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    requestId?: string;
  };
  metadata: Record<string, any>;
  fingerprint: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  tags: string[];
}

export interface ErrorStats {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  topErrors: ErrorLog[];
  recentErrors: ErrorLog[];
  errorRate: number;
  unresolvedCount: number;
}

export class ErrorTrackingService {
  private errors: Map<string, ErrorLog> = new Map();
  private errorsByFingerprint: Map<string, string> = new Map();
  private maxErrors = 1000; // Keep only last 1000 errors in memory

  // Log an error with context
  async logError(
    level: "error" | "warn" | "info" | "debug",
    message: string,
    error?: Error,
    context: Partial<ErrorLog["context"]> = {},
    metadata: Record<string, any> = {},
  ): Promise<string> {
    const timestamp = new Date();
    const stack = error?.stack;
    const fingerprint = this.generateFingerprint(message, stack);

    // Check if we've seen this error before
    const existingErrorId = this.errorsByFingerprint.get(fingerprint);
    let errorLog: ErrorLog;

    if (existingErrorId && this.errors.has(existingErrorId)) {
      // Update existing error
      const existingError = this.errors.get(existingErrorId)!;
      errorLog = {
        ...existingError,
        lastSeen: timestamp,
        count: existingError.count + 1,
        metadata: { ...existingError.metadata, ...metadata },
      };
    } else {
      // Create new error log
      errorLog = {
        id: this.generateErrorId(),
        timestamp,
        level,
        message,
        stack,
        context,
        metadata,
        fingerprint,
        count: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
        resolved: false,
        tags: this.generateTags(message, context),
      };

      this.errorsByFingerprint.set(fingerprint, errorLog.id);
    }

    // Store in memory
    this.errors.set(errorLog.id, errorLog);

    // Clean up old errors if we have too many
    this.cleanupOldErrors();

    // Cache for quick access
    cacheService.set(`error:${errorLog.id}`, errorLog, 3600000); // 1 hour

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error(`[${level.toUpperCase()}] ${message}`, {
        context,
        metadata,
        stack: stack?.split("\n").slice(0, 3).join("\n"),
      });
    }

    return errorLog.id;
  }

  // Generate error fingerprint for deduplication
  private generateFingerprint(message: string, stack?: string): string {
    const stackLines = stack?.split("\n").slice(0, 3) || [];
    const key = message + stackLines.join("");
    return Buffer.from(key).toString("base64").substring(0, 16);
  }

  // Generate error ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Generate tags based on error content
  private generateTags(
    message: string,
    context: Partial<ErrorLog["context"]>,
  ): string[] {
    const tags: string[] = [];

    if (context.endpoint) {
      tags.push(`endpoint:${context.endpoint}`);
    }

    if (context.method) {
      tags.push(`method:${context.method}`);
    }

    if (context.userId) {
      tags.push(`user:${context.userId}`);
    }

    // Add tags based on error message content
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("database") || lowerMessage.includes("db")) {
      tags.push("database");
    }
    if (lowerMessage.includes("auth")) {
      tags.push("authentication");
    }
    if (lowerMessage.includes("payment")) {
      tags.push("payment");
    }
    if (lowerMessage.includes("api")) {
      tags.push("api");
    }
    if (lowerMessage.includes("timeout")) {
      tags.push("timeout");
    }
    if (
      lowerMessage.includes("permission") ||
      lowerMessage.includes("forbidden")
    ) {
      tags.push("permission");
    }

    return tags;
  }

  // Clean up old errors to prevent memory leaks
  private cleanupOldErrors(): void {
    if (this.errors.size <= this.maxErrors) return;

    // Convert to array and sort by timestamp
    const errorArray = Array.from(this.errors.values());
    errorArray.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Remove oldest errors
    const toRemove = errorArray.slice(0, this.errors.size - this.maxErrors);

    for (const error of toRemove) {
      this.errors.delete(error.id);
      this.errorsByFingerprint.delete(error.fingerprint);
      cacheService.delete(`error:${error.id}`);
    }
  }

  // Get error statistics
  async getErrorStats(timeRange: number = 24): Promise<ErrorStats> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeRange * 60 * 60 * 1000);

    const relevantErrors = Array.from(this.errors.values()).filter(
      (error) => error.timestamp >= startTime,
    );

    const stats: ErrorStats = {
      totalErrors: relevantErrors.length,
      errorsByLevel: { error: 0, warn: 0, info: 0, debug: 0 },
      errorsByEndpoint: {},
      topErrors: [],
      recentErrors: [],
      errorRate: 0,
      unresolvedCount: 0,
    };

    // Calculate stats from relevant errors
    for (const error of relevantErrors) {
      // Count by level
      stats.errorsByLevel[error.level] =
        (stats.errorsByLevel[error.level] || 0) + error.count;

      // Count by endpoint
      if (error.context.endpoint) {
        stats.errorsByEndpoint[error.context.endpoint] =
          (stats.errorsByEndpoint[error.context.endpoint] || 0) + error.count;
      }

      // Count unresolved
      if (!error.resolved) {
        stats.unresolvedCount++;
      }
    }

    // Get top errors (by count)
    stats.topErrors = relevantErrors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent errors
    stats.recentErrors = relevantErrors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    // Calculate error rate (errors per hour)
    stats.errorRate = parseFloat((stats.totalErrors / timeRange).toFixed(2));

    return stats;
  }

  // Get recent errors
  async getRecentErrors(limit: number = 50): Promise<ErrorLog[]> {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get error by ID
  async getError(id: string): Promise<ErrorLog | null> {
    const cached = cacheService.get(`error:${id}`);
    if (cached) return cached;

    return this.errors.get(id) || null;
  }

  // Mark error as resolved
  async resolveError(id: string, userId: string): Promise<boolean> {
    const error = this.errors.get(id);
    if (!error) return false;

    error.resolved = true;
    error.metadata.resolvedBy = userId;
    error.metadata.resolvedAt = new Date().toISOString();

    this.errors.set(id, error);
    cacheService.set(`error:${id}`, error, 3600000);

    return true;
  }

  // Search errors (simplified version)
  async searchErrors(query: {
    q?: string;
    level?: string;
    resolved?: boolean;
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ errors: ErrorLog[]; total: number; hasMore: boolean }> {
    let filteredErrors = Array.from(this.errors.values());

    // Apply filters
    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      filteredErrors = filteredErrors.filter(
        (error) =>
          error.message.toLowerCase().includes(searchTerm) ||
          error.context.endpoint?.toLowerCase().includes(searchTerm) ||
          error.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      );
    }

    if (query.level) {
      filteredErrors = filteredErrors.filter(
        (error) => error.level === query.level,
      );
    }

    if (query.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(
        (error) => error.resolved === query.resolved,
      );
    }

    if (query.tags && query.tags.length > 0) {
      filteredErrors = filteredErrors.filter((error) =>
        query.tags!.some((tag) => error.tags.includes(tag)),
      );
    }

    if (query.startDate) {
      filteredErrors = filteredErrors.filter(
        (error) => error.timestamp >= query.startDate!,
      );
    }

    if (query.endDate) {
      filteredErrors = filteredErrors.filter(
        (error) => error.timestamp <= query.endDate!,
      );
    }

    // Sort by timestamp (newest first)
    filteredErrors.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    const total = filteredErrors.length;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const paginatedErrors = filteredErrors.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      errors: paginatedErrors,
      total,
      hasMore,
    };
  }

  // Express middleware for automatic error tracking
  errorMiddleware() {
    return (error: Error, req: any, res: any, next: any) => {
      const context = {
        userId: req.user?.id || req.user?.claims?.sub,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get("User-Agent"),
        ip: req.ip || req.connection.remoteAddress,
        requestId: req.id,
      };

      const metadata = {
        statusCode: res.statusCode,
        body: req.body,
        query: req.query,
        params: req.params,
      };

      this.logError("error", error.message, error, context, metadata);

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === "production") {
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.status(500).json({
          error: error.message,
          stack: error.stack,
        });
      }
    };
  }

  // Request tracking middleware for slow requests
  requestMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();

      // Generate request ID if not exists
      if (!req.id) {
        req.id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      }

      // Track response
      const originalSend = res.send;
      res.send = function (data: any) {
        const duration = Date.now() - start;

        // Log slow requests (over 5 seconds)
        if (duration > 5000) {
          errorTrackingService.logError(
            "warn",
            `Slow request: ${duration}ms`,
            undefined,
            {
              endpoint: req.originalUrl,
              method: req.method,
              requestId: req.id,
              userId: req.user?.id || req.user?.claims?.sub,
            },
            { duration, statusCode: res.statusCode },
          );
        }

        // Log 4xx and 5xx responses as warnings/errors
        if (res.statusCode >= 400) {
          const level = res.statusCode >= 500 ? "error" : "warn";
          errorTrackingService.logError(
            level,
            `HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`,
            undefined,
            {
              endpoint: req.originalUrl,
              method: req.method,
              requestId: req.id,
              userId: req.user?.id || req.user?.claims?.sub,
            },
            { statusCode: res.statusCode, duration },
          );
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Get error count for a specific time period
  getErrorCount(minutes: number = 60, level?: string): number {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return Array.from(this.errors.values()).filter(
      (error) => error.timestamp >= cutoff && (!level || error.level === level),
    ).length;
  }

  // Clear all errors (for testing/development)
  clearErrors(): void {
    this.errors.clear();
    this.errorsByFingerprint.clear();
  }

  // Get basic metrics
  getMetrics(): {
    totalErrors: number;
    uniqueErrors: number;
    resolvedErrors: number;
    errorsByLevel: Record<string, number>;
  } {
    const errors = Array.from(this.errors.values());
    const errorsByLevel = { error: 0, warn: 0, info: 0, debug: 0 };
    let resolvedCount = 0;

    for (const error of errors) {
      errorsByLevel[error.level]++;
      if (error.resolved) resolvedCount++;
    }

    return {
      totalErrors: errors.reduce((sum, error) => sum + error.count, 0),
      uniqueErrors: errors.length,
      resolvedErrors: resolvedCount,
      errorsByLevel,
    };
  }
}

export const errorTrackingService = new ErrorTrackingService();
