import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express, { type Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import {
  apiRateLimit,
  adminRateLimit,
  speedLimiter,
  securityHeaders,
} from "./middleware/security";

const app = express();

// Trust proxy for accurate IP addresses behind reverse proxies
app.set("trust proxy", 1);

// Enable WebSocket support BEFORE all middleware
// Note: We need to pass the server instance to expressWs later
let wsInstance: any = null;

// Security headers should be applied after WebSocket setup
app.use(securityHeaders);

// CRITICAL: Handle raw body for Stripe webhooks BEFORE express.json()
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

// Standard middleware - now applied AFTER the raw body handler
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static audio files from uploads directory
app.use("/uploads", express.static("uploads"));

// Apply rate limiting based on endpoint (skip WebSocket routes)
app.use("/api/admin", adminRateLimit); // Medium limits for admin

app.use((req, res, next) => {
  // Skip rate limiting for WebSocket upgrade requests and media stream endpoints
  if (
    req.headers.upgrade === "websocket" ||
    req.path.startsWith("/api/media-stream")
  ) {
    console.log(
      `[WEBSOCKET] Skipping rate limiting for: ${req.path} (upgrade: ${req.headers.upgrade})`,
    );
    return next();
  }
  speedLimiter(req, res, next);
});

app.use((req, res, next) => {
  // Skip rate limiting for WebSocket upgrade requests and media stream endpoints
  if (
    req.headers.upgrade === "websocket" ||
    req.path.startsWith("/api/media-stream")
  ) {
    console.log(`[WEBSOCKET] Skipping API rate limiting for: ${req.path}`);
    return next();
  }
  apiRateLimit(req, res, next);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create HTTP server first
  const server = createServer(app);

  // Enable WebSocket support on the server
  wsInstance = expressWs(app, server);
  console.log("[WEBSOCKET] Express WebSocket support enabled on server");
  console.log(
    "[WEBSOCKET] WebSocket method available:",
    typeof (app as any).ws === "function",
  );

  // Now register routes with WebSocket support
  await registerRoutes(app, server);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on specified port (defaults to 5000)
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
