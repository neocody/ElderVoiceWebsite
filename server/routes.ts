import type { Express } from "express";
import { type Server } from "http";
import { callScheduler } from "./services/callScheduler";
import { registerTwilioRoutes } from "./routes/twilioRoutes";
import { registerBillingRoutes } from "./routes/billingRoutes";
import { registerCoreRoutes } from "./routes/coreRoutes";
import { registerFileRoutes } from "./routes/fileRoutes";
import { registerJobRoutes } from "./routes/jobRoutes";
import { registerSystemRoutes } from "./routes/systemRoutes";
import { registerErrorRoutes } from "./routes/errorRoutes";
import { registerElevenLabsWebhooks } from "./routes/elevenLabsWebhooks";
import { registerConversationalAIRoutes } from "./routes/conversationalAIRoutes";
import { registerAdminStatsRoutes } from "./routes/adminStatsRoutes";
import { registerEmailTemplateRoutes } from "./routes/emailTemplateRoutes";
import { registerDemoCallRoutes } from "./routes/demoCallRoutes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerOnboardRoutes } from "./routes/onboardRoutes";
import { initializeJobHandlers } from "./services/jobHandlers";

//middleware for tracking request metrics
import { statsMiddleware } from "./services/systemStatsService";
import { errorTrackingService } from "./services/errorTrackingService";
import { cacheMiddleware } from "./services/cacheService";

export async function registerRoutes(
  app: Express,
  server: Server,
): Promise<void> {
  //middleware for tracking request metrics
  app.use(statsMiddleware);
  app.use(errorTrackingService.errorMiddleware());
  app.use(errorTrackingService.requestMiddleware());
  app.use(cacheMiddleware());

  // Initialize call scheduler
  await callScheduler.initializeScheduler();

  // Initialize background job processing system
  initializeJobHandlers();

  // Register modular routes - IMPORTANT: WebSocket routes must be registered on the WebSocket-enhanced app
  registerAuthRoutes(app); // Authentication endpoints (Supabase-based)
  registerOnboardRoutes(app); // Onboarding endpoints for profile and preferences
  registerTwilioRoutes(app); // CRITICAL: Twilio voice communication - DO NOT MODIFY
  registerBillingRoutes(app); // Stripe billing and subscription management
  registerCoreRoutes(app); // Core application functionality
  registerFileRoutes(app); // File upload and storage management
  registerJobRoutes(app); // Background job queue management
  registerSystemRoutes(app); // System monitoring, caching, and migrations
  registerErrorRoutes(app); // Error tracking and alerting system
  registerElevenLabsWebhooks(app); // ElevenLabs voice generation webhooks
  registerConversationalAIRoutes(app); // ElevenLabs conversational AI latency testing
  registerAdminStatsRoutes(app); // Admin dashboard real-time statistics
  registerEmailTemplateRoutes(app); // Email template management with EmailBuilder.js
  registerDemoCallRoutes(app); // Demo call request form with SendGrid email notifications

  // Server is now passed in from index.ts with WebSocket support already enabled
  console.log("[WEBSOCKET] Routes registered with WebSocket-enabled server");
}
