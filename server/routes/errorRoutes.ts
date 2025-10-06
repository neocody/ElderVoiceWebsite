import type { Express } from "express";
import { errorTrackingService } from "../services/errorTrackingService";
import { isAuthenticated } from "../middleware/auth";

export function registerErrorRoutes(app: Express) {
  // Get error statistics
  app.get("/api/admin/errors/stats", isAuthenticated, async (req, res) => {
    try {
      const timeRange = parseInt(req.query.hours as string) || 24;
      const stats = await errorTrackingService.getErrorStats(timeRange);
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to get error stats",
      });
    }
  });

  // Get recent errors
  app.get("/api/admin/errors/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const errors = await errorTrackingService.getRecentErrors(limit);
      res.json(errors);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get recent errors",
      });
    }
  });

  // Mark error as resolved
  app.patch(
    "/api/admin/errors/:id/resolve",
    isAuthenticated,
    async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.claims?.sub;

        if (!userId) {
          return res.status(401).json({ error: "User ID not found" });
        }

        const success = await errorTrackingService.resolveError(id, userId);

        if (!success) {
          return res.status(404).json({ error: "Error not found" });
        }

        res.json({ message: "Error marked as resolved" });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to resolve error",
        });
      }
    },
  );

  // Manually log an error (for testing)
  app.post("/api/admin/errors/test", isAuthenticated, async (req, res) => {
    try {
      const { level, message, context, metadata } = req.body;

      if (!level || !message) {
        return res.status(400).json({
          error: "Level and message are required",
        });
      }

      if (!["error", "warn", "info", "debug"].includes(level)) {
        return res.status(400).json({
          error: "Level must be one of: error, warn, info, debug",
        });
      }

      const errorId = await errorTrackingService.logError(
        level,
        message,
        undefined,
        {
          ...context,
          userId: req.user?.id || req.user?.claims?.sub,
          endpoint: req.originalUrl,
          method: req.method,
        },
        metadata || {},
      );

      res.json({ message: "Test error logged successfully", errorId });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to log test error",
      });
    }
  });
}
