import type { Express } from "express";
import { storage } from "../storage";
import { sendEmail } from "../services/emailService";
import { z } from "zod";

const testEmailSchema = z.object({
  email: z.string().email(),
  subject: z.string(),
  html: z.string(),
});

export const templateUpdateSchema = z.object({
  name: z.string().optional(),

  type: z
    .enum([
      "account_verification",
      "password_reset",
      "welcome_email",
      "call_completed",
      "call_missed",
      "call_failed",
      "reminder",
      "newsletter",
      "announcement",
      "system_alert",
      "billing_alert",
      "security_alert",
      "custom",
    ])
    .optional(),

  description: z.string().optional(),

  targetUserTypes: z.array(z.string()).optional(),

  isActive: z.boolean().optional(),

  // Email fields
  emailEnabled: z.boolean().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),

  // SMS fields
  smsEnabled: z.boolean().optional(),
  smsMessage: z.string().optional(),

  // Trigger conditions (JSON)
  triggerConditions: z.record(z.any()).optional(),

  sendDelay: z.number().int().min(0).optional(), // delay in minutes
});

export function registerEmailTemplateRoutes(app: Express) {
  // Send test email endpoint
  app.post("/api/admin/email-templates/test", async (req, res) => {
    try {
      if (!process.env.FROM_EMAIL){
        return res.status(500).json({ error: "FROM_EMAIL environment variable not set" });
      }
      const { email, subject, html } = testEmailSchema.parse(req.body);

      // Send test email using existing email service
      const success = await sendEmail({
        to: email,
        from: process.env.FROM_EMAIL,
        subject: subject,
        html: html,
      });

      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // Update notification template with EmailBuilder.js data
  app.patch("/api/admin/notification-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = templateUpdateSchema.parse(req.body);

      const existingTemplate = await storage.getNotificationTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Update template with EmailBuilder.js data
      const updatedTemplate = await storage.updateNotificationTemplate(id, {
        ...updateData,
      });

      res.json(updatedTemplate);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Create new notification template with EmailBuilder.js support
  app.post("/api/admin/notification-templates", async (req, res) => {
    try {
      const templateData = req.body;

      // Create new template
      const newTemplate = await storage.createNotificationTemplate({
        name: templateData.name,
        type: templateData.type,
        description: templateData.description,
        targetUserTypes: templateData.targetUserTypes,
        isActive: templateData.isActive ?? true,
        emailEnabled: templateData.emailEnabled ?? true,
        emailSubject: templateData.emailSubject,
        emailBody: templateData.emailBody || "",
        smsEnabled: templateData.smsEnabled ?? false,
        smsMessage: templateData.smsMessage,
        triggerConditions: templateData.triggerConditions,
        sendDelay: templateData.sendDelay || 0,
      });

      res.json(newTemplate);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Get all notification templates
  app.get("/api/admin/notification-templates", async (req, res) => {
    try {
      const templates = await storage.getNotificationTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to get templates" });
    }
  });

  // Delete notification template
  app.delete("/api/admin/notification-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      await storage.deleteNotificationTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Export template as HTML
  app.get("/api/admin/notification-templates/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getNotificationTemplate(id);

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const html = template.emailBody;

      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${template.name}.html"`,
      );
      res.send(html);
    } catch (error) {
      console.error("Export template error:", error);
      res.status(500).json({ error: "Failed to export template" });
    }
  });

  // Render template with variables for preview
  app.post("/api/admin/notification-templates/:id/render", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const variables = req.body.variables || {};

      const template = await storage.getNotificationTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      let html = template.emailBody;

      // Replace variables in HTML
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        html = html.replace(regex, String(value));
      }

      res.json({
        subject: template.emailSubject,
        html: html,
      });
    } catch (error) {
      console.error("Render template error:", error);
      res.status(500).json({ error: "Failed to render template" });
    }
  });
}
