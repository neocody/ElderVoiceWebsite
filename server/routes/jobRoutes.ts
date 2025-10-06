import type { Express } from "express";
import {
  jobQueue,
  JobType,
  type EmailJobData,
  type SMSJobData,
  type NotificationJobData,
} from "../services/jobQueue";
import { isAuthenticated, requireRole } from "../middleware/auth";
import { adminRateLimit } from "../middleware/security";

export function registerJobRoutes(app: Express) {
  // Get queue statistics (admin only)
  app.get(
    "/api/jobs/stats",
    adminRateLimit,
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const stats = jobQueue.getStats();
        res.json(stats);
      } catch (error) {
        console.error("Error getting job stats:", error);
        res.status(500).json({ message: "Failed to get job statistics" });
      }
    },
  );

  // Get jobs by status (admin only)
  app.get(
    "/api/jobs/:status",
    adminRateLimit,
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const { status } = req.params;
        const validStatuses = [
          "pending",
          "processing",
          "completed",
          "failed",
          "delayed",
        ];

        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const jobs = jobQueue.getJobsByStatus(status as any);
        res.json(jobs);
      } catch (error) {
        console.error("Error getting jobs:", error);
        res.status(500).json({ message: "Failed to get jobs" });
      }
    },
  );

  // Get specific job details (admin only)
  app.get(
    "/api/jobs/detail/:jobId",
    adminRateLimit,
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const { jobId } = req.params;
        const job = jobQueue.getJob(jobId);

        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }

        res.json(job);
      } catch (error) {
        console.error("Error getting job details:", error);
        res.status(500).json({ message: "Failed to get job details" });
      }
    },
  );

  // Manual job cleanup (admin only)
  app.post(
    "/api/jobs/cleanup",
    adminRateLimit,
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const { olderThanHours } = req.body;
        const olderThanMs = (olderThanHours || 24) * 60 * 60 * 1000;

        const cleanedCount = jobQueue.cleanup(olderThanMs);

        res.json({
          message: `Cleanup completed. ${cleanedCount} jobs removed.`,
          cleanedCount,
        });
      } catch (error) {
        console.error("Error during job cleanup:", error);
        res.status(500).json({ message: "Failed to cleanup jobs" });
      }
    },
  );

  // Queue email job
  app.post("/api/jobs/queue/email", isAuthenticated, async (req: any, res) => {
    try {
      const {
        to,
        subject,
        htmlContent,
        templateType,
        templateData,
        priority,
        delay,
      } = req.body;

      if (!to || !subject || !htmlContent) {
        return res
          .status(400)
          .json({ message: "Missing required email parameters" });
      }

      const emailData: EmailJobData = {
        to,
        subject,
        htmlContent,
        templateType,
        templateData,
      };

      const jobId = await jobQueue.add(JobType.SEND_EMAIL, emailData, {
        priority: priority || "normal",
        delay: delay || 0,
      });

      res.json({
        message: "Email job queued successfully",
        jobId,
      });
    } catch (error) {
      console.error("Error queueing email job:", error);
      res.status(500).json({ message: "Failed to queue email job" });
    }
  });

  // Queue SMS job
  app.post("/api/jobs/queue/sms", isAuthenticated, async (req: any, res) => {
    try {
      const { to, message, priority, delay } = req.body;

      if (!to || !message) {
        return res
          .status(400)
          .json({ message: "Missing required SMS parameters" });
      }

      const smsData: SMSJobData = {
        to,
        message,
        priority: priority || "normal",
      };

      const jobId = await jobQueue.add(JobType.SEND_SMS, smsData, {
        priority: priority || "normal",
        delay: delay || 0,
      });

      res.json({
        message: "SMS job queued successfully",
        jobId,
      });
    } catch (error) {
      console.error("Error queueing SMS job:", error);
      res.status(500).json({ message: "Failed to queue SMS job" });
    }
  });

  // Queue notification job
  app.post(
    "/api/jobs/queue/notification",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const {
          targetUserId,
          templateId,
          variables,
          channels,
          priority,
          delay,
        } = req.body;

        if (!targetUserId || !templateId || !channels) {
          return res
            .status(400)
            .json({ message: "Missing required notification parameters" });
        }

        const notificationData: NotificationJobData = {
          userId: targetUserId,
          templateId,
          variables: variables || {},
          channels,
        };

        const jobId = await jobQueue.add(
          JobType.SEND_NOTIFICATION,
          notificationData,
          {
            priority: priority || "normal",
            delay: delay || 0,
          },
        );

        res.json({
          message: "Notification job queued successfully",
          jobId,
        });
      } catch (error) {
        console.error("Error queueing notification job:", error);
        res.status(500).json({ message: "Failed to queue notification job" });
      }
    },
  );

  // Queue report generation job
  app.post(
    "/api/jobs/queue/report",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const userId = req.user!.id;
        const { type, dateRange, format, priority, delay } = req.body;

        if (!type || !dateRange || !format) {
          return res
            .status(400)
            .json({ message: "Missing required report parameters" });
        }

        const reportData = {
          type,
          userId,
          dateRange: {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          },
          format,
        };

        const jobId = await jobQueue.add(JobType.GENERATE_REPORT, reportData, {
          priority: priority || "low",
          delay: delay || 0,
        });

        res.json({
          message: "Report generation job queued successfully",
          jobId,
        });
      } catch (error) {
        console.error("Error queueing report job:", error);
        res.status(500).json({ message: "Failed to queue report job" });
      }
    },
  );

  // Start/stop queue processing (admin only)
  app.post(
    "/api/jobs/control/:action",
    adminRateLimit,
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const { action } = req.params;

        if (action === "start") {
          jobQueue.start();
          res.json({ message: "Job queue started" });
        } else if (action === "stop") {
          jobQueue.stop();
          res.json({ message: "Job queue stopped" });
        } else {
          res
            .status(400)
            .json({ message: "Invalid action. Use start or stop." });
        }
      } catch (error) {
        console.error("Error controlling job queue:", error);
        res.status(500).json({ message: "Failed to control job queue" });
      }
    },
  );
}
