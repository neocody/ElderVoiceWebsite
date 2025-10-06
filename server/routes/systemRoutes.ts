import type { Express } from "express";
import { healthCheckService } from "../services/healthCheckService";
import { cacheService } from "../services/cacheService";
import { isAuthenticated, requireRole } from "../middleware/auth";

// Store connected WebSocket clients for system status updates
const systemStatusClients = new Set<any>();

export function registerSystemRoutes(app: Express) {
  console.log(
    "[SYSTEM ROUTES] Registering system routes with WebSocket support",
  );
  console.log(
    "[SYSTEM ROUTES] WebSocket method available:",
    typeof (app as any).ws === "function",
  );

  // Simple test WebSocket endpoint
  (app as any).ws("/api/test-ws", (ws: any, req: any) => {
    console.log("[TEST WS] Client connected");
    ws.send(
      JSON.stringify({ type: "test", message: "Hello from test WebSocket" }),
    );

    // Handle incoming messages
    ws.on("message", (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("[TEST WS] Received message:", data);

        if (data.type === "ping") {
          ws.send(
            JSON.stringify({
              type: "pong",
              message: "Pong response from server",
              timestamp: new Date().toISOString(),
              receivedData: data,
            }),
          );
        } else if (data.type === "echo") {
          ws.send(
            JSON.stringify({
              type: "echo_response",
              message: `Echo: ${data.message}`,
              timestamp: new Date().toISOString(),
            }),
          );
        } else if (data.type === "custom") {
          ws.send(
            JSON.stringify({
              type: "custom_response",
              message: `Custom message received : ${data.message}`,
              receivedData: data,
              timestamp: new Date().toISOString(),
            }),
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "unknown",
              message: "Unknown message type received",
              receivedType: data.type,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch (error) {
        console.error("[TEST WS] Error parsing message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid JSON received",
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log("[TEST WS] Client disconnected");
    });
  });

  // WebSocket endpoint for real-time system status (no authentication required)
  // Using exact path match to avoid conflicts with Twilio's catch-all handler
  (app as any).ws("/api/system/status/ws", (ws: any, req: any) => {
    console.log("[SYSTEM STATUS WS] Client connected from:", req.ip);
    console.log("[SYSTEM STATUS WS] Request headers:", req.headers);
    console.log("[SYSTEM STATUS WS] Request path:", req.path);
    console.log("[SYSTEM STATUS WS] User agent:", req.headers["user-agent"]);

    // Add client to the set
    systemStatusClients.add(ws);
    console.log(
      "[SYSTEM STATUS WS] Total connected clients:",
      systemStatusClients.size,
    );

    // Send a simple test message first
    try {
      ws.send(
        JSON.stringify({
          type: "connection_test",
          message: "WebSocket connection established",
          timestamp: new Date().toISOString(),
        }),
      );
      console.log("[SYSTEM STATUS WS] Connection test message sent");
    } catch (error) {
      console.error(
        "[SYSTEM STATUS WS] Failed to send connection test message:",
        error,
      );
    }

    // Send initial status immediately after a short delay to ensure connection is ready
    setTimeout(async () => {
      console.log("[SYSTEM STATUS WS] Sending initial status...");
      try {
        await sendSystemStatus(ws);
        console.log("[SYSTEM STATUS WS] Initial status sent successfully");
      } catch (error) {
        console.error(
          "[SYSTEM STATUS WS] Failed to send initial status:",
          error,
        );
      }
    }, 100);

    // Send status updates every 10 seconds
    const statusInterval = setInterval(async () => {
      if (ws.readyState === 1) {
        // WebSocket.OPEN
        console.log("[SYSTEM STATUS WS] Sending periodic status update...");
        await sendSystemStatus(ws);
      } else {
        console.log("[SYSTEM STATUS WS] WebSocket not open, clearing interval");
        clearInterval(statusInterval);
        systemStatusClients.delete(ws);
      }
    }, 10000);

    ws.on("close", (code: number, reason: any) => {
      console.log(
        "[SYSTEM STATUS WS] Client disconnected, code:",
        code,
        "reason:",
        reason,
      );
      clearInterval(statusInterval);
      systemStatusClients.delete(ws);
      console.log(
        "[SYSTEM STATUS WS] Remaining connected clients:",
        systemStatusClients.size,
      );
    });

    ws.on("error", (error: any) => {
      console.error("[SYSTEM STATUS WS] Error:", error);
      clearInterval(statusInterval);
      systemStatusClients.delete(ws);
    });
  });

  // Function to send system status to a specific client
  async function sendSystemStatus(ws: any) {
    try {
      console.log("[SYSTEM STATUS WS] Fetching health status...");
      const health = await healthCheckService.getHealthStatus();
      console.log("[SYSTEM STATUS WS] Health status fetched:", {
        status: health.status,
        uptime: health.uptime,
        totalRequests: health.metrics.totalRequests,
      });

      const systemStatus = {
        type: "system_status_update",
        timestamp: new Date().toISOString(),
        data: {
          systemHealth: health.status,
          twilioStatus: health.services.twilio?.status || "unknown",
          openaiStatus: health.services.openai?.status || "unknown",
          uptime: health.uptime,
          callsToday: health.metrics.totalRequests,
          lastUpdated: new Date().toISOString(),
          services: {
            database: health.services.database?.status || "unknown",
            twilio: health.services.twilio?.status || "unknown",
            openai: health.services.openai?.status || "unknown",
            elevenlabs: health.services.elevenlabs?.status || "unknown",
            sendgrid: health.services.sendgrid?.status || "unknown",
          },
          metrics: {
            averageResponseTime: health.metrics.averageResponseTime,
            errorRate: health.metrics.errorRate,
            totalRequests: health.metrics.totalRequests,
          },
          system: {
            memory: health.system.memory,
            cpu: health.system.cpu,
          },
        },
      };

      if (ws.readyState === 1) {
        // WebSocket.OPEN
        console.log(
          "[SYSTEM STATUS WS] Sending status to client, readyState:",
          ws.readyState,
        );
        ws.send(JSON.stringify(systemStatus));
        console.log("[SYSTEM STATUS WS] Status sent successfully");
      } else {
        console.log(
          "[SYSTEM STATUS WS] WebSocket not ready, readyState:",
          ws.readyState,
        );
      }
    } catch (error) {
      console.error("[SYSTEM STATUS WS] Error sending status:", error);
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            type: "system_status_error",
            timestamp: new Date().toISOString(),
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch system status",
          }),
        );
      }
    }
  }

  // Function to broadcast system status to all connected clients
  async function broadcastSystemStatus() {
    const health = await healthCheckService.getHealthStatus();

    const systemStatus = {
      type: "system_status_update",
      timestamp: new Date().toISOString(),
      data: {
        systemHealth: health.status,
        twilioStatus: health.services.twilio?.status || "unknown",
        openaiStatus: health.services.openai?.status || "unknown",
        uptime: health.uptime,
        callsToday: health.metrics.totalRequests,
        lastUpdated: new Date().toISOString(),
        services: {
          database: health.services.database?.status || "unknown",
          twilio: health.services.twilio?.status || "unknown",
          openai: health.services.openai?.status || "unknown",
          elevenlabs: health.services.elevenlabs?.status || "unknown",
          sendgrid: health.services.sendgrid?.status || "unknown",
        },
        metrics: {
          averageResponseTime: health.metrics.averageResponseTime,
          errorRate: health.metrics.errorRate,
          totalRequests: health.metrics.totalRequests,
        },
        system: {
          memory: health.system.memory,
          cpu: health.system.cpu,
        },
      },
    };

    const message = JSON.stringify(systemStatus);
    systemStatusClients.forEach((client: any) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  // Basic health check endpoint (public)
  app.get("/health", async (req, res) => {
    try {
      const health = await healthCheckService.getSimpleHealth();
      res.status(200).json(health);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
  });

  // Detailed health check endpoint (authenticated)
  app.get("/api/health/detailed", isAuthenticated, async (req, res) => {
    try {
      const health = await healthCheckService.getHealthStatus();
      const statusCode =
        health.status === "healthy"
          ? 200
          : health.status === "degraded"
            ? 206
            : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      console.error("Error fetching detailed health status:", error);
      res.status(503).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
  });

  // Cache management endpoints (admin only)
  app.get(
    "/api/admin/cache/stats",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const stats = cacheService.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Cache stats error",
        });
      }
    },
  );

  app.post("/api/admin/cache/clear", isAuthenticated, async (req, res) => {
    try {
      cacheService.clear();
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Cache clear error",
      });
    }
  });

  // Manual trigger to broadcast system status to all WebSocket clients (for testing)
  app.post(
    "/api/system/status/broadcast",
    isAuthenticated,
    async (req, res) => {
      try {
        console.log("[SYSTEM STATUS WS] Manual broadcast requested");
        await broadcastSystemStatus();
        res.json({
          message: "System status broadcasted to all connected clients",
          connectedClients: systemStatusClients.size,
        });
      } catch (error) {
        console.error("[SYSTEM STATUS WS] Broadcast error:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Broadcast failed",
        });
      }
    },
  );

  // System status endpoint for Live Status dashboard (fallback for non-WebSocket clients)
  app.get("/api/system/status", isAuthenticated, async (req, res) => {
    try {
      const health = await healthCheckService.getHealthStatus();

      // Get real system status data
      const systemStatus = {
        systemHealth: health.status,
        twilioStatus: health.services.twilio?.status || "unknown",
        openaiStatus: health.services.openai?.status || "unknown",
        uptime: health.uptime,
        callsToday: health.metrics.totalRequests, // Using total requests as proxy for calls today
        lastUpdated: new Date().toISOString(),
        services: {
          database: health.services.database?.status || "unknown",
          twilio: health.services.twilio?.status || "unknown",
          openai: health.services.openai?.status || "unknown",
          elevenlabs: health.services.elevenlabs?.status || "unknown",
          sendgrid: health.services.sendgrid?.status || "unknown",
        },
        metrics: {
          averageResponseTime: health.metrics.averageResponseTime,
          errorRate: health.metrics.errorRate,
          totalRequests: health.metrics.totalRequests,
        },
        system: {
          memory: health.system.memory,
          cpu: health.system.cpu,
        },
      };

      res.json(systemStatus);
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "System status error",
      });
    }
  });

  // System metrics and monitoring
  app.get("/api/admin/system/metrics", isAuthenticated, async (req, res) => {
    try {
      const health = await healthCheckService.getHealthStatus();
      res.json({
        uptime: health.uptime,
        memory: health.system.memory,
        cpu: health.system.cpu,
        metrics: health.metrics,
        cacheStats: cacheService.getStats(),
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "System metrics error",
      });
    }
  });

  // Cache operations for specific keys
  app.get("/api/admin/cache/get/:key", isAuthenticated, async (req, res) => {
    try {
      const { key } = req.params;
      const value = cacheService.get(key);
      res.json({ key, value, exists: value !== undefined });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Cache get error",
      });
    }
  });

  app.post("/api/admin/cache/set", isAuthenticated, async (req, res) => {
    try {
      const { key, value, ttl } = req.body;

      if (!key) {
        return res.status(400).json({ error: "Cache key is required" });
      }

      cacheService.set(key, value, ttl);
      res.json({ message: "Cache value set successfully", key });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Cache set error",
      });
    }
  });

  app.delete(
    "/api/admin/cache/delete/:key",
    isAuthenticated,
    async (req, res) => {
      try {
        const { key } = req.params;
        cacheService.delete(key);
        res.json({ message: "Cache key deleted successfully", key });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Cache delete error",
        });
      }
    },
  );

  // Performance monitoring
  app.get("/api/admin/performance", isAuthenticated, async (req, res) => {
    try {
      const health = await healthCheckService.getHealthStatus();

      res.json({
        responseTime: {
          average: health.metrics.averageResponseTime,
          current: Date.now(), // Could be enhanced with actual current response time
        },
        throughput: {
          requestsPerSecond:
            health.metrics.totalRequests / (health.uptime / 1000),
          totalRequests: health.metrics.totalRequests,
        },
        errors: {
          rate: health.metrics.errorRate,
          total:
            health.metrics.totalRequests * (health.metrics.errorRate / 100),
        },
        resources: {
          memory: health.system.memory,
          cpu: health.system.cpu,
        },
        services: Object.entries(health.services).map(([name, service]) => ({
          name,
          status: service.status,
          responseTime: service.responseTime,
          lastCheck: service.lastCheck,
        })),
      });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Performance metrics error",
      });
    }
  });
}
