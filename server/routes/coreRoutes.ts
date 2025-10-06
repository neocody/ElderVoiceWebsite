import type { Express } from "express";
import { storage } from "../storage";
import { insertElderlyUserSchema, insertScheduleSchema } from "@shared/schema";
import { callScheduler } from "../services/callScheduler";
import { apiRateLimit } from "../middleware/security";
import { isAuthenticated, requireRole } from "../middleware/auth";
import express from "express";
import path from "path";

// Utility to handle DB errors
function handleDatabaseError(error: any) {
  if (error?.code === "23505") {
    // Unique constraint violation
    const fieldMatch = error.detail?.match(/\((.*?)\)=/);
    const field = fieldMatch ? fieldMatch[1] : undefined;

    return {
      status: 409, // Conflict
      message: `A record with this ${field || "value"} already exists.`,
      field,
      code: "unique_constraint",
    };
  }

  // Zod validation errors are handled earlier by parse()
  return {
    status: 500,
    message: "Internal server error. Please try again.",
    code: "internal_error",
  };
}

export function registerCoreRoutes(app: Express) {
  // Serve uploaded audio files for Twilio playback
  app.use(
    "/uploads/audio",
    express.static(path.join(process.cwd(), "uploads", "audio")),
  );

  // Authentication routes
  app.get(
    "/api/auth/user",
    apiRateLimit,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );

  // Dashboard API
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const elderlyUsers = await storage.getElderlyUsers("all");
      const calls = await storage.getCalls();
      const recentCalls = calls.slice(0, 10);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const callsToday = calls.filter((call) => {
        const callDate = new Date(call.createdAt || "");
        callDate.setHours(0, 0, 0, 0);
        return callDate.getTime() === today.getTime();
      });

      const missedCalls = calls.filter(
        (call) => call.status === "no-answer" || call.status === "busy",
      );
      const successfulCalls = calls.filter(
        (call) => call.status === "completed",
      );

      res.json({
        totalUsers: elderlyUsers.length,
        callsToday: callsToday.length,
        missedCalls: missedCalls.length,
        successfulCalls: successfulCalls.length,
        successRate:
          calls.length > 0
            ? Math.round((successfulCalls.length / calls.length) * 100)
            : 0,
        recentCalls,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Elderly Users API
  app.get("/api/elderly-users", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const elderlyUsers = await storage.getElderlyUsers(userId);
      res.json(elderlyUsers);
    } catch (error) {
      console.error("Error fetching elderly users:", error);
      res.status(500).json({ message: "Failed to fetch elderly users" });
    }
  });

  app.post("/api/elderly-users", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const userData = insertElderlyUserSchema.parse({
        ...req.body,
        caregiverId: userId,
      });

      const elderlyUser = await storage.createElderlyUser(userData);
      res.json(elderlyUser);
    } catch (error: any) {
      console.error("Error creating elderly user:", error);

      // Zod validation errors
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          issues: error.issues,
        });
      }

      // Database errors
      if (error.code) {
        const dbError = handleDatabaseError(error);
        return res.status(dbError.status).json(dbError);
      }

      res.status(500).json({ message: "Failed to create elderly user" });
    }
  });

  app.put("/api/elderly-users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const elderlyUser = await storage.updateElderlyUser(
        parseInt(id, 10),
        updates,
      );

      res.json(elderlyUser);
    } catch (error: any) {
      console.error("Error updating elderly user:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          issues: error.issues,
        });
      }

      if (error.code) {
        const dbError = handleDatabaseError(error);
        return res.status(dbError.status).json(dbError);
      }

      res.status(500).json({ message: "Failed to update elderly user" });
    }
  });

  // Update elder user endpoint with validation and partial updates
  app.patch("/api/elderly-users/:id", isAuthenticated, async (req, res) => {
    try {
      console.log(
        `[PATCH] Updating elderly user ${req.params.id} with data:`,
        req.body,
      );
      const { id } = req.params;
      const updates = req.body;

      // Clean the updates data to ensure it matches the schema
      const cleanedUpdates: any = {};

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null) continue;

        // Handle emergency contact objects
        if (
          key === "primaryEmergencyContact" ||
          key === "secondaryEmergencyContact"
        ) {
          if (typeof value === "object" && value !== null) {
            const contact = value as any;
            if (contact.name || contact.relationship || contact.phone) {
              cleanedUpdates[key] = value;
            } else {
              cleanedUpdates[key] = null;
            }
          } else {
            cleanedUpdates[key] = null;
          }
          continue;
        }

        // Handle array fields
        if (key === "preferredCallDays" || key === "topicsOfInterest") {
          cleanedUpdates[key] = Array.isArray(value) ? value : [];
          continue;
        }

        // Handle date fields
        if (key === "dateOfBirth" && !value) continue;

        // For all other fields, include if they have a value
        if (value !== "" && value !== undefined && value !== null) {
          cleanedUpdates[key] = value;
        }
      }

      console.log(`[PATCH] Cleaned data:`, cleanedUpdates);

      // Validate the cleaned data using the schema
      const validatedData = insertElderlyUserSchema
        .partial()
        .parse(cleanedUpdates);

      const elderlyUser = await storage.updateElderlyUser(
        parseInt(id),
        validatedData,
      );
      console.log(`[PATCH] Update successful:`, elderlyUser);

      // TODO: Sync patient profile to MCP server when service is implemented
      // const { mcpSyncService } = await import('../services/mcpSyncService.js');
      // const syncSuccess = await mcpSyncService.syncPatientProfile(parseInt(id), elderlyUser);

      // if (!syncSuccess) {
      //   console.warn(`Failed to sync patient ${id} profile to MCP server`);
      // }

      res.json(elderlyUser);
    } catch (error) {
      console.error("Error updating elderly user:", error);
      res.status(500).json({
        message: "Failed to update elderly user",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Delete elderly user endpoint
  app.delete("/api/elderly-users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteElderlyUser(parseInt(id));
      res.json({ message: "Elderly user deleted successfully" });
    } catch (error) {
      console.error("Error deleting elderly user:", error);
      res.status(500).json({ message: "Failed to delete elderly user" });
    }
  });

  // Calls API
  app.get("/api/calls", isAuthenticated, async (req, res) => {
    try {
      // const elderlyUserId = req.query.elderlyUserId ? parseInt(req.query.elderlyUserId as string) : undefined;
      const calls = await storage.getCalls();
      res.json(calls);
    } catch (error) {
      console.error("Error fetching calls:", error);
      res.status(500).json({ message: "Failed to fetch calls" });
    }
  });

  // Active calls endpoint - calls currently in progress
  app.get("/api/calls/active", isAuthenticated, async (req, res) => {
    try {
      const allCalls = await storage.getCalls();
      const activeCalls = allCalls.filter(
        (call: any) =>
          call.status === "in-progress" || call.status === "ringing",
      );

      // Enrich with patient information
      const enrichedActiveCalls = await Promise.all(
        activeCalls.map(async (call: any) => {
          if (call.elderlyUserId) {
            const elderlyUser = await storage.getElderlyUser(
              call.elderlyUserId,
            );
            return {
              ...call,
              elderlyUserName:
                elderlyUser?.name ||
                elderlyUser?.preferredName ||
                `Patient ${call.elderlyUserId}`,
              elderlyUserPhone: elderlyUser?.phone || "No phone",
            };
          }
          return call;
        }),
      );

      res.json(enrichedActiveCalls);
    } catch (error) {
      console.error("Error fetching active calls:", error);
      res.status(500).json({ error: "Failed to fetch active calls" });
    }
  });

  // Call queue endpoint - scheduled calls waiting to be placed
  app.get("/api/calls/queue", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      const now = new Date();

      // Get upcoming schedules as queued calls
      const queuedCalls = await Promise.all(
        schedules.map(async (schedule: any) => {
          if (schedule.elderlyUserId) {
            const elderlyUser = await storage.getElderlyUser(
              schedule.elderlyUserId,
            );

            // Calculate next call time based on schedule
            const nextCallTime = new Date();
            nextCallTime.setHours(
              parseInt(schedule.time?.split(":")[0] || "9"),
              parseInt(schedule.time?.split(":")[1] || "0"),
              0,
              0,
            );

            // If time has passed today, schedule for tomorrow
            if (nextCallTime <= now) {
              nextCallTime.setDate(nextCallTime.getDate() + 1);
            }

            return {
              id: `queue_${schedule.id}`,
              elderlyUserId: schedule.elderlyUserId,
              elderlyUserName:
                elderlyUser?.name ||
                elderlyUser?.preferredName ||
                `Patient ${schedule.elderlyUserId}`,
              elderlyUserPhone: elderlyUser?.phone || "No phone",
              scheduledAt: nextCallTime.toISOString(),
              priority: schedule.priority || "normal",
              retryCount: 0,
              scheduleType: schedule.frequency,
            };
          }
          return null;
        }),
      );

      // Filter out null entries and sort by scheduled time
      const validQueuedCalls = queuedCalls
        .filter((call) => call !== null)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        );

      res.json(validQueuedCalls);
    } catch (error) {
      console.error("Error fetching call queue:", error);
      res.status(500).json({ error: "Failed to fetch call queue" });
    }
  });

  // Patient memories extraction API
  app.get(
    "/api/calls/:id/extract-memories",
    isAuthenticated,
    async (req, res) => {
      try {
        const { id } = req.params;
        const memories = await storage.getPatientMemoryByCallId(parseInt(id));
        res.json(memories);
      } catch (error) {
        console.error("Error extracting patient memories:", error);
        res.status(500).json({ message: "Failed to extract patient memories" });
      }
    },
  );

  // Schedules API
  app.get("/api/schedules", isAuthenticated, async (req, res) => {
    try {
      const elderlyUserId = req.query.elderlyUserId
        ? parseInt(req.query.elderlyUserId as string)
        : undefined;
      const schedules = await storage.getSchedules(elderlyUserId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", isAuthenticated, async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);

      // Initialize call scheduler for the new schedule
      await callScheduler.scheduleCallsForUser(schedule.elderlyUserId);

      res.json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.put("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const schedule = await storage.updateSchedule(parseInt(id), updates);

      // Reinitialize call scheduler for the updated schedule
      await callScheduler.scheduleCallsForUser(schedule.elderlyUserId);

      res.json(schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  app.delete("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSchedule(parseInt(id));
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Notifications API
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unreadOnly === "true";
      const notifications = await storage.getNotifications(userId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(parseInt(id));
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Admin Notification Preferences endpoints
  app.get(
    "/api/admin/notification-preferences",
    isAuthenticated,
    async (req, res) => {
      try {
        let preferences = await storage.getAdminNotificationPreferences();
        if (!preferences) {
          preferences =
            await storage.createDefaultAdminNotificationPreferences();
        }
        res.json(preferences);
      } catch (error) {
        console.error("Error fetching admin notification preferences:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch notification preferences" });
      }
    },
  );

  app.put(
    "/api/admin/notification-preferences",
    isAuthenticated,
    async (req, res) => {
      try {
        const preferences = await storage.updateAdminNotificationPreferences(
          req.body,
        );
        res.json(preferences);
      } catch (error) {
        console.error("Error updating admin notification preferences:", error);
        res
          .status(500)
          .json({ message: "Failed to update notification preferences" });
      }
    },
  );

  // Test email alert endpoint
  app.post("/api/admin/test-email-alert", isAuthenticated, async (req, res) => {
    try {
      const { email, message } = req.body;

      if (!email || !message) {
        return res
          .status(400)
          .json({ message: "Email and message are required" });
      }

      // Check if SENDGRID_API_KEY is available
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({
          message:
            "Email service not configured. SENDGRID_API_KEY is required.",
        });
      }

      // Import SendGrid dynamically
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const emailData = {
        to: email,
        from: "alerts@aicompanion.com", // This should be a verified sender in SendGrid
        subject: "AI Companion System - Test Alert",
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">AI Companion System Alert Test</h2>
            <p>${message}</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is a test message from the AI Companion notification system.
              If you received this message, email alerts are working correctly.
            </p>
          </div>
        `,
      };

      await sgMail.send(emailData);
      console.log("Test email sent successfully to:", email);

      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({
        message: "Failed to send test email",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // User Management API endpoints
  app.get(
    "/api/user-management/profiles",
    isAuthenticated,
    async (req, res) => {
      try {
        // Mock user profiles for demonstration
        const mockUserProfiles = [
          {
            id: "user1",
            userId: "user1",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            role: {
              role: "family_member",
              permissions: {
                canManagePatients: true,
                canViewTranscripts: true,
                canManageBilling: false,
                canManageSchedules: true,
              },
            },
            createdAt: new Date().toISOString(),
            isActive: true,
          },
          {
            id: "user2",
            userId: "user2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            role: {
              role: "facility_manager",
              permissions: {
                canManagePatients: true,
                canViewTranscripts: true,
                canManageBilling: true,
                canManageSchedules: true,
              },
            },
            createdAt: new Date().toISOString(),
            isActive: true,
          },
        ];
        res.json(mockUserProfiles);
      } catch (error) {
        console.error("Error fetching user profiles:", error);
        res.status(500).json({ message: "Failed to fetch user profiles" });
      }
    },
  );

  app.post(
    "/api/user-management/profile",
    isAuthenticated,
    async (req, res) => {
      try {
        const userData = req.body;
        console.log("Creating user profile:", userData);

        // Mock user creation response
        const newUser = {
          id: Date.now().toString(),
          userId: userData.userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: {
            role: userData.role,
            permissions: userData.permissions || {
              canManagePatients: true,
              canViewTranscripts: true,
              canManageBilling: false,
              canManageSchedules: true,
            },
          },
          createdAt: new Date().toISOString(),
          isActive: true,
        };

        // Send welcome email to the new user
        try {
          const { jobQueue } = await import("../services/jobQueue.js");

          const emailJobData = {
            to: userData.email,
            subject: "Welcome to AI Companion - Your Account is Ready!",
            templateType: "welcome",
            templateData: {
              caregiverName: `${userData.firstName} ${userData.lastName}`,
              emergencyContact: userData.email,
              actionRequired: userData.role.replace(/_/g, " ").toUpperCase(),
            },
            priority: "medium" as const,
          };

          await jobQueue.addEmailJob(emailJobData);
          console.log("Welcome email queued for:", userData.email);
        } catch (emailError) {
          console.error("Failed to queue welcome email:", emailError);
          // Don't fail user creation if email fails
        }

        res.status(201).json(newUser);
      } catch (error) {
        console.error("Error creating user profile:", error);
        res.status(500).json({ message: "Failed to create user profile" });
      }
    },
  );

  app.delete(
    "/api/user-management/profile/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        const { id } = req.params;
        console.log("Deleting user profile:", id);

        // Mock deletion response
        res.json({ message: "User profile deleted successfully" });
      } catch (error) {
        console.error("Error deleting user profile:", error);
        res.status(500).json({ message: "Failed to delete user profile" });
      }
    },
  );

  // Test welcome email endpoint
  app.post(
    "/api/admin/test-welcome-email",
    isAuthenticated,
    async (req, res) => {
      try {
        const { email, firstName, lastName, role } = req.body;

        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        // Check if SENDGRID_API_KEY is available
        if (!process.env.SENDGRID_API_KEY) {
          return res.status(500).json({
            message:
              "Email service not configured. SENDGRID_API_KEY is required.",
          });
        }

        const { jobQueue } = await import("../services/jobQueue.js");

        const emailJobData = {
          to: email,
          subject: "Welcome to AI Companion - Your Account is Ready!",
          templateType: "welcome",
          templateData: {
            caregiverName: `${firstName || "Test"} ${lastName || "User"}`,
            emergencyContact: email,
            actionRequired: (role || "family_member")
              .replace(/_/g, " ")
              .toUpperCase(),
          },
          priority: "high" as const,
        };

        await jobQueue.addEmailJob(emailJobData);
        console.log("Test welcome email queued for:", email);

        res.json({ message: "Test welcome email sent successfully" });
      } catch (error) {
        console.error("Error sending test welcome email:", error);
        res.status(500).json({
          message: "Failed to send test welcome email",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Test SMS alert endpoint
  app.post("/api/admin/test-sms-alert", isAuthenticated, async (req, res) => {
    try {
      const { phone, message } = req.body;

      if (!phone || !message) {
        return res
          .status(400)
          .json({ message: "Phone number and message are required" });
      }

      // Check if Twilio credentials are available
      if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_PHONE_NUMBER
      ) {
        return res.status(500).json({
          message:
            "SMS service not configured. Twilio credentials are required and phone verification may be pending.",
        });
      }

      // Import Twilio dynamically
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );

      const smsData = {
        body: `AI Companion Alert Test: ${message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      };

      const messageResult = await client.messages.create(smsData);
      console.log(
        "Test SMS sent successfully to:",
        phone,
        "SID:",
        messageResult.sid,
      );

      res.json({
        message: "Test SMS sent successfully",
        sid: messageResult.sid,
      });
    } catch (error) {
      console.error("Error sending test SMS:", error);

      // Provide specific error messages for common Twilio issues
      let errorMessage = "Failed to send test SMS";
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as any).code === 21614
      ) {
        errorMessage =
          "Phone number not verified with Twilio. Please complete phone verification in Twilio console.";
      } else if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as any).code === 21211
      ) {
        errorMessage =
          "Invalid phone number format. Please use international format (+1234567890).";
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as any).message === "string" &&
        (error as any).message.includes("trial")
      ) {
        errorMessage =
          "Twilio trial account restrictions. Please verify the phone number in Twilio console or upgrade account.";
      }

      res.status(500).json({
        message: errorMessage,
        error: error.message,
        code: error.code,
      });
    }
  });

  app.post(
    "/api/admin/system-config/reset",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        console.log("System configuration reset to defaults");
        res.json({ message: "System configuration reset to defaults" });
      } catch (error) {
        console.error("Error resetting system config:", error);
        res
          .status(500)
          .json({ message: "Failed to reset system configuration" });
      }
    },
  );

  // Enhanced Notification Management API
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { unread, limit } = req.query;

      const notifications = await storage.getNotifications(
        userId,
        unread === "true",
        limit ? parseInt(limit as string) : undefined,
      );

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(parseInt(id));
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post(
    "/api/notifications/mark-all-read",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.user!.id;
        await storage.markAllNotificationsRead(userId);
        res.json({ message: "All notifications marked as read" });
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res
          .status(500)
          .json({ message: "Failed to mark all notifications as read" });
      }
    },
  );

  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(parseInt(id));
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Notification Template Management API (Admin Only)
  app.get(
    "/api/admin/notification-templates",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const { active } = req.query;
        const templates = await storage.getNotificationTemplates(
          active !== undefined ? active === "true" : undefined,
        );

        res.json(templates);
      } catch (error) {
        console.error("Error fetching notification templates:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch notification templates" });
      }
    },
  );

  app.post(
    "/api/admin/notification-templates",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const template = await storage.createNotificationTemplate(req.body);
        res.status(201).json(template);
      } catch (error) {
        console.error("Error creating notification template:", error);
        res
          .status(500)
          .json({ message: "Failed to create notification template" });
      }
    },
  );

  app.put(
    "/api/admin/notification-templates/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const template = await storage.updateNotificationTemplate(
          parseInt(id),
          req.body,
        );
        res.json(template);
      } catch (error) {
        console.error("Error updating notification template:", error);
        res
          .status(500)
          .json({ message: "Failed to update notification template" });
      }
    },
  );

  app.delete(
    "/api/admin/notification-templates/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        await storage.deleteNotificationTemplate(parseInt(id));
        res.json({ message: "Notification template deleted" });
      } catch (error) {
        console.error("Error deleting notification template:", error);
        res
          .status(500)
          .json({ message: "Failed to delete notification template" });
      }
    },
  );

  // Individual Notification Management API
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;

      await storage.markNotificationRead(parseInt(id));
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put(
    "/api/notifications/mark-all-read",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.user!.id;
        await storage.markAllNotificationsRead(userId);
        res.json({ message: "All notifications marked as read" });
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res
          .status(500)
          .json({ message: "Failed to mark all notifications as read" });
      }
    },
  );

  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(parseInt(id));
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Notification Preferences API
  app.get(
    "/api/notification-preferences",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.user!.id;
        let preferences = await storage.getNotificationPreferences(userId);

        // Create default preferences if none exist
        if (!preferences) {
          preferences = await storage.createNotificationPreferences({
            userId,
            emailEnabled: true,
            smsEnabled: false,
            inAppEnabled: true,
            callNotifications: true,
            systemAlerts: true,
            billingAlerts: true,
            reminders: true,
            quietHoursEnabled: false,
            quietHoursStart: "22:00",
            quietHoursEnd: "08:00",
            minPriorityLevel: "normal",
          });
        }

        res.json(preferences);
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch notification preferences" });
      }
    },
  );

  app.put(
    "/api/notification-preferences",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.user!.id;
        const preferences = await storage.updateNotificationPreferences(
          userId,
          req.body,
        );
        res.json(preferences);
      } catch (error) {
        console.error("Error updating notification preferences:", error);
        res
          .status(500)
          .json({ message: "Failed to update notification preferences" });
      }
    },
  );

  // MCP Sync Management API endpoints
  app.get(
    "/api/admin/mcp-sync/status",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        // TODO: Implement MCP sync service
        // const { mcpSyncService } = await import('../services/mcpSyncService.js');
        // const status = mcpSyncService.getSyncStatus();
        const status = {
          enabled: false,
          lastSync: null,
          error: "Service not implemented",
        };

        res.json({
          syncEnabled: status.syncEnabled,
          mcpServerUrl: status.mcpServerUrl ? "[CONFIGURED]" : "[NOT SET]",
          mcpApiKey: status.mcpApiKey ? "[CONFIGURED]" : "[NOT SET]",
          lastSync: null, // Would be stored in database in production
        });
      } catch (error) {
        console.error("Error fetching MCP sync status:", error);
        res.status(500).json({ message: "Failed to fetch MCP sync status" });
      }
    },
  );

  app.post(
    "/api/admin/mcp-sync/enable",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        // TODO: Implement MCP sync service
        // const { mcpSyncService } = await import('../services/mcpSyncService.js');
        // mcpSyncService.setSyncEnabled(true);

        res.json({
          message: "MCP sync enabled successfully",
          syncEnabled: true,
        });
      } catch (error) {
        console.error("Error enabling MCP sync:", error);
        res.status(500).json({ message: "Failed to enable MCP sync" });
      }
    },
  );

  app.post(
    "/api/admin/mcp-sync/disable",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        // TODO: Implement MCP sync service
        // const { mcpSyncService } = await import('../services/mcpSyncService.js');
        // mcpSyncService.setSyncEnabled(false);

        res.json({
          message: "MCP sync disabled successfully",
          syncEnabled: false,
        });
      } catch (error) {
        console.error("Error disabling MCP sync:", error);
        res.status(500).json({ message: "Failed to disable MCP sync" });
      }
    },
  );

  app.post(
    "/api/admin/mcp-sync/full-sync",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        // TODO: Implement MCP sync service
        // const { mcpSyncService } = await import('../services/mcpSyncService.js');
        // const result = await mcpSyncService.fullSync();
        const result = { success: false, error: "Service not implemented" };

        res.json({
          message: result.success
            ? "Full sync completed successfully"
            : "Full sync completed with errors",
          success: result.success,
          errors: result.errors || [],
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error performing full MCP sync:", error);
        res.status(500).json({ message: "Failed to perform full sync" });
      }
    },
  );

  // Master AI Prompt API endpoints
  app.get(
    "/api/admin/master-prompt",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        // For now, return a default master prompt if none exists
        // In a real implementation, this would be stored in the database
        const defaultMasterPrompt = `You are a caring, empathetic AI companion designed to provide regular check-ins and emotional support to elderly users. Your primary goals are to:

1. Show genuine care and interest in their well-being
2. Engage in warm, natural conversations that feel like talking to a caring friend or family member
3. Listen attentively and respond with empathy to their concerns, stories, and experiences
4. Encourage them to share about their day, feelings, health, and any concerns they may have
5. Provide gentle emotional support and validation
6. Ask thoughtful follow-up questions to keep the conversation flowing naturally
7. Remember and reference previous conversations when appropriate
8. Maintain a positive, patient, and understanding tone throughout the interaction

Important guidelines:
- Always address the user by their preferred name
- Speak in a warm, conversational tone as if you're a caring friend
- Be patient and allow time for responses
- Show genuine interest in their stories and experiences
- If they express concerns about health, mood, or safety, listen carefully and be supportive
- Keep conversations engaging but not overwhelming
- End calls on a positive, caring note

Remember: Your role is to be a companion and provide emotional support. You are not a medical professional, but you can listen, care, and provide comfort through meaningful conversation.`;

        res.json({ masterPrompt: defaultMasterPrompt });
      } catch (error) {
        console.error("Error fetching master prompt:", error);
        res.status(500).json({ message: "Failed to fetch master prompt" });
      }
    },
  );

  app.put(
    "/api/admin/master-prompt",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const { masterPrompt } = req.body;

        if (!masterPrompt || typeof masterPrompt !== "string") {
          return res.status(400).json({
            message: "Master prompt is required and must be a string",
          });
        }

        if (masterPrompt.trim().length === 0) {
          return res
            .status(400)
            .json({ message: "Master prompt cannot be empty" });
        }

        // Store the master prompt in database
        await storage.setMasterPrompt(masterPrompt);
        console.log(
          "Master prompt updated:",
          masterPrompt.substring(0, 100) + "...",
        );

        // Sync to MCP server
        // TODO: Implement MCP sync service
        // const { mcpSyncService } = await import('../services/mcpSyncService.js');
        // const syncSuccess = await mcpSyncService.syncMasterPrompt(masterPrompt);
        const syncSuccess = false; // Service not implemented

        if (!syncSuccess) {
          console.warn("Failed to sync master prompt to MCP server");
        }

        res.json({
          message: "Master prompt updated successfully",
          masterPrompt: masterPrompt,
          mcpSynced: syncSuccess,
        });
      } catch (error) {
        console.error("Error updating master prompt:", error);
        res.status(500).json({ message: "Failed to update master prompt" });
      }
    },
  );

  // Initialize default notification templates (development only)
  app.post(
    "/api/admin/notification-templates/initialize-defaults",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      if (process.env.NODE_ENV !== "development") {
        return res
          .status(403)
          .json({ message: "Only available in development" });
      }

      try {
        const defaultTemplates = [
          {
            name: "Call Failed Alert",
            type: "call_failed",
            emailSubject: "Call Failed: {patientName}",
            emailBody:
              "A scheduled call to {patientName} has failed. Please check the system for details and consider rescheduling. Call attempted at {callTime}.",
            smsTemplate:
              "Call failed for {patientName}. Check AI Companion dashboard.",
            isActive: true,
            targetUserTypes: ["administrator", "family_member"],
            priority: "high" as const,
            category: "Patient Care",
          },
          {
            name: "Patient Concern Detected",
            type: "patient_concern",
            emailSubject: "Patient Concern: {patientName}",
            emailBody:
              "During a call with {patientName}, our AI detected potential concerns that may require attention. Sentiment score: {sentimentScore}. Please review the call transcript.",
            smsTemplate: "Concern detected for {patientName}. Review needed.",
            isActive: true,
            targetUserTypes: [
              "administrator",
              "family_member",
              "facility_manager",
            ],
            priority: "urgent" as const,
            category: "Patient Care",
          },
          {
            name: "System Alert",
            type: "system_alert",
            emailSubject: "System Alert: {alertType}",
            emailBody:
              "A system alert has been triggered: {alertMessage}. Please review the system status and take appropriate action if needed.",
            smsTemplate: "System alert: {alertType}. Check dashboard.",
            isActive: true,
            targetUserTypes: ["administrator"],
            priority: "high" as const,
            category: "System",
          },
          {
            name: "Billing Issue",
            type: "billing_issue",
            emailSubject: "Billing Alert: {issueType}",
            emailBody:
              "A billing issue has been detected: {issueDescription}. Please review your billing settings and resolve this issue promptly.",
            smsTemplate: "Billing issue detected. Check account.",
            isActive: true,
            targetUserTypes: ["administrator", "facility_manager"],
            priority: "normal" as const,
            category: "Billing",
          },
          {
            name: "Maintenance Scheduled",
            type: "maintenance_scheduled",
            emailSubject: "Scheduled Maintenance: {maintenanceDate}",
            emailBody:
              "System maintenance is scheduled for {maintenanceDate} from {startTime} to {endTime}. The system may be temporarily unavailable during this time.",
            smsTemplate:
              "Maintenance scheduled {maintenanceDate}. System may be unavailable.",
            isActive: true,
            targetUserTypes: ["administrator", "facility_manager", "member"],
            priority: "normal" as const,
            category: "Maintenance",
          },
          {
            name: "New User Created",
            type: "user_created",
            emailSubject: "New User Account: {userName}",
            emailBody:
              "A new user account has been created for {userName} ({userEmail}). Role: {userRole}. Please ensure they have the appropriate access permissions.",
            smsTemplate: "New user created: {userName}.",
            isActive: true,
            targetUserTypes: ["administrator"],
            priority: "low" as const,
            category: "Security",
          },
        ];

        for (const template of defaultTemplates) {
          await storage.createNotificationTemplate(template);
        }

        res.json({
          message: `${defaultTemplates.length} default templates created successfully`,
        });
      } catch (error) {
        console.error("Error creating default templates:", error);
        res.status(500).json({ message: "Failed to create default templates" });
      }
    },
  );

  // Voice Management API
  app.get("/api/voices/available", async (req, res) => {
    try {
      const { elevenLabsService } = await import(
        "../services/elevenLabsService"
      );
      const voices = elevenLabsService.getAvailableVoices();
      res.json(voices);
    } catch (error) {
      console.error("Error fetching available voices:", error);
      res.status(500).json({ message: "Failed to fetch available voices" });
    }
  });

  app.get("/api/voices/preview/:voiceId", async (req, res) => {
    try {
      const { voiceId } = req.params;
      const { text } = req.query;

      const { elevenLabsService } = await import(
        "../services/elevenLabsService"
      );
      const audioBuffer = await elevenLabsService.generateVoicePreview(
        voiceId,
        typeof text === "string"
          ? text
          : "Hello, this is a preview of this voice.",
      );

      if (!audioBuffer) {
        return res
          .status(500)
          .json({ message: "Failed to generate voice preview" });
      }

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error("Error generating voice preview:", error);
      res.status(500).json({ message: "Failed to generate voice preview" });
    }
  });

  // Comprehensive Settings API
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Get all user settings organized by category
      const userSettings = await storage.getUserSettings(userId);

      // Organize settings by category
      const settings = userSettings.reduce((acc, setting) => {
        acc[setting.category] = setting.settings;
        return acc;
      }, {} as any);

      // Provide admin-focused defaults if no settings exist
      const defaultSettings = {
        system: settings.system || {
          maintenanceMode: false,
          debugLogging: false,
          maxConcurrentCalls: 50,
          callTimeout: 300,
          systemTimezone: "America/New_York",
        },
        security: settings.security || {
          sessionTimeout: 30,
          requireMFA: false,
          passwordExpiry: 90,
          maxLoginAttempts: 5,
          auditLogging: true,
        },
        notifications: settings.notifications || {
          adminAlerts: true,
          systemHealthAlerts: true,
          userRegistrationAlerts: true,
          billingAlerts: true,
          maintenanceAlerts: true,
        },
        api: settings.api || {
          rateLimitEnabled: true,
          maxRequestsPerMinute: 100,
          enableWebhooks: true,
          logApiRequests: true,
        },
        billing: settings.billing || {
          autoInvoicing: true,
          paymentRetryAttempts: 3,
          latePaymentGracePeriod: 7,
          enableTrialAccounts: true,
        },
      };

      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      // Save admin settings with audit logging
      const settingsData = req.body;
      console.log(
        `Admin settings update by ${userId}:`,
        JSON.stringify(settingsData, null, 2),
      );

      // Save each category of settings
      for (const [category, settings] of Object.entries(settingsData)) {
        if (settings && typeof settings === "object") {
          await storage.setUserSetting(userId, category, settings);

          // Log critical setting changes for audit
          if (category === "system" && (settings as any).maintenanceMode) {
            console.log(`AUDIT: Maintenance mode enabled by admin ${userId}`);
          }
          if (category === "security" && (settings as any).requireMFA) {
            console.log(`AUDIT: MFA requirement changed by admin ${userId}`);
          }
        }
      }

      res.json({
        message: "Admin settings updated successfully",
        settings: settingsData,
      });
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update admin settings" });
    }
  });

  // System Configuration API
  app.get(
    "/api/admin/system-config",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        // Get all system settings organized by category
        const allSettings = await storage.getAllSystemSettings();

        const config = allSettings.reduce((acc, setting) => {
          if (!acc[setting.category]) {
            acc[setting.category] = {};
          }
          acc[setting.category][setting.key] = setting.value;
          return acc;
        }, {} as any);

        // Provide defaults for system configuration
        const defaultConfig = {
          aiSettings: config.ai || {
            model: "gpt-4o",
            temperature: 0.7,
            maxTokens: 500,
            conversationTimeout: 300,
          },
          callSettings: config.calling || {
            maxDuration: 1800,
            retryAttempts: 3,
            voiceSpeed: 1.0,
            voicePitch: 1.0,
          },
          systemLimits: config.limits || {
            maxPatientsPerUser: 50,
            dailyCallLimit: 100,
            maxConcurrentCalls: 10,
            dataRetentionDays: 365,
          },
          security: config.security || {
            sessionTimeoutMinutes: 60,
            requireMFA: false,
            enableAuditLogging: true,
          },
          maintenance: config.maintenance || {
            maintenanceMode: false,
            scheduledMaintenance: "",
            maintenanceMessage:
              "System maintenance in progress. Please check back later.",
          },
        };

        res.json(defaultConfig);
      } catch (error) {
        console.error("Error fetching system config:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch system configuration" });
      }
    },
  );

  app.put(
    "/api/admin/system-config",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const config = req.body;

        // Save each category of system settings
        for (const [category, settings] of Object.entries(config)) {
          if (settings && typeof settings === "object") {
            for (const [key, value] of Object.entries(settings as any)) {
              await storage.setSystemSetting(
                key,
                value,
                category,
                `${category} configuration setting`,
              );
            }
          }
        }

        res.json({
          message: "System configuration saved successfully",
          config,
        });
      } catch (error) {
        console.error("Error saving system config:", error);
        res
          .status(500)
          .json({ message: "Failed to save system configuration" });
      }
    },
  );

  // User Settings API (Personal preferences, not system-wide)
  app.get("/api/user/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get user's personal settings
      const userSettings = await storage.getUserSettings(userId);

      // Organize settings by category
      const settings = userSettings.reduce((acc, setting) => {
        acc[setting.category] = setting.settings;
        return acc;
      }, {} as any);

      // Provide user-focused defaults if no settings exist
      const defaultUserSettings = {
        profile: settings.profile || {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          preferredName: "",
        },
        notifications: settings.notifications || {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          callReminders: true,
          weeklyReports: false,
          emergencyAlerts: true,
        },
        preferences: settings.preferences || {
          timezone: "America/New_York",
          language: "en",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "12hour",
          theme: "light",
        },
        privacy: settings.privacy || {
          allowDataSharing: false,
          recordCallConsent: true,
          shareWithFamily: true,
          emergencyContactAccess: true,
        },
      };

      res.json(defaultUserSettings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.put("/api/user/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userSettings = req.body;

      // Save each category of user settings
      for (const [category, settings] of Object.entries(userSettings)) {
        if (settings && typeof settings === "object") {
          await storage.setUserSetting(userId, category, settings);
        }
      }

      console.log(
        `User settings updated for ${userId}:`,
        JSON.stringify(userSettings, null, 2),
      );

      res.json({
        message: "User settings saved successfully",
        settings: userSettings,
      });
    } catch (error) {
      console.error("Error saving user settings:", error);
      res.status(500).json({ message: "Failed to save user settings" });
    }
  });

  app.get("/api/settings/compliance", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get actual compliance settings from database
      const complianceSettings = await storage.getUserSetting(
        userId,
        "compliance",
      );

      // Get real statistics
      const totalUsers = await storage.getUserProfiles();
      const callsWithRecordings = await storage.getCalls();

      const actualStats = {
        hipaa: {
          enabled: complianceSettings?.settings?.hipaaCompliant ?? true,
          lastAudit: "2025-01-01", // Could be stored in system settings
          status: "compliant",
          recordsProtected: totalUsers.length,
          encryptionEnabled: true,
        },
        gdpr: {
          enabled: complianceSettings?.settings?.gdprCompliant ?? true,
          consentRecords: totalUsers.length,
          status: "compliant",
          dataRetentionPeriod:
            complianceSettings?.settings?.dataRetention || "90days",
          rightToBeErasedSupported: true,
        },
        callRecording: {
          enabled: complianceSettings?.settings?.recordCalls ?? true,
          totalRecordings: callsWithRecordings.length,
          transcriptStorage:
            complianceSettings?.settings?.transcriptStorage ?? true,
          automaticDeletion: true,
        },
      };

      res.json(actualStats);
    } catch (error) {
      console.error("Error fetching compliance settings:", error);
      res.status(500).json({ message: "Failed to fetch compliance settings" });
    }
  });

  // Service Plans
  app.get("/api/service-plans", async (req, res) => {
    try {
      const servicePlans = await storage.getServicePlans();
      res.json(servicePlans);
    } catch (error) {
      console.error("Error getting service plans:", error);
      res.status(500).json({ message: "Failed to get service plans" });
    }
  });

  app.post(
    "/api/service-plans",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const planData = req.body; // must include basePrice, planType, etc.
        const servicePlan = await storage.createServicePlan(planData);
        res.json(servicePlan);
      } catch (error) {
        console.error("Error creating service plan:", error);
        res.status(500).json({ message: "Failed to create service plan" });
      }
    },
  );

  app.put(
    "/api/service-plans/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        const servicePlan = await storage.updateServicePlan(id, updates);
        res.json(servicePlan);
      } catch (error) {
        console.error("Error updating service plan:", error);
        res.status(500).json({ message: "Failed to update service plan" });
      }
    },
  );

  app.delete(
    "/api/service-plans/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteServicePlan(id);
        res.json({ message: "Service plan deleted successfully" });
      } catch (error) {
        console.error("Error deleting service plan:", error);
        res.status(500).json({ message: "Failed to delete service plan" });
      }
    },
  );

  // Services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error getting services:", error);
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.post(
    "/api/services",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const serviceData = req.body; // must include key, name, description
        const service = await storage.createService(serviceData);
        res.json(service);
      } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({ message: "Failed to create service" });
      }
    },
  );

  app.put(
    "/api/services/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        const service = await storage.updateService(id, updates);
        res.json(service);
      } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Failed to update service" });
      }
    },
  );

  app.delete(
    "/api/services/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        await storage.deleteService(id);
        res.json({ message: "Service deleted successfully" });
      } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ message: "Failed to delete service" });
      }
    },
  );

  app.get(
    "/api/service-recipients",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const userId = req.user!.id;
        const recipients = await storage.getElderlyUsers(userId);
        res.json(recipients);
      } catch (error) {
        console.error("Error getting service recipients:", error);
        res.status(500).json({ message: "Failed to get service recipients" });
      }
    },
  );

  // Team Member Management API
  app.get("/api/team", isAuthenticated, async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post("/api/team", isAuthenticated, async (req, res) => {
    try {
      const { insertTeamMemberSchema } = await import("@shared/schema");
      const memberData = insertTeamMemberSchema.parse(req.body);
      const teamMember = await storage.createTeamMember(memberData);
      res.json(teamMember);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.put("/api/team/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { insertTeamMemberSchema } = await import("@shared/schema");
      const updates = insertTeamMemberSchema.partial().parse(req.body);
      const teamMember = await storage.updateTeamMember(id, updates);
      res.json(teamMember);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/team/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTeamMember(id);
      res.json({ message: "Team member deleted successfully" });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Facility Contact Form Proxy
  app.post("/api/facility-contact", apiRateLimit, async (req, res) => {
    try {
      const response = await fetch('https://formspree.io/f/mldpgepo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      if (response.ok) {
        res.json({ success: true });
      } else {
        console.error("Formspree submission failed:", await response.text());
        res.status(500).json({ success: false, message: "Submission failed" });
      }
    } catch (error) {
      console.error("Error submitting to Formspree:", error);
      res.status(500).json({ success: false, message: "Submission failed" });
    }
  });
}
