import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// Extend Express Request type to include rawBody
declare module "express-serve-static-core" {
  interface Request {
    rawBody?: string;
  }
}

// Rate limiting configuration
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // Higher limit in development
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks, static assets, and dashboard APIs in development
  skip: (req) => {
    return (
      req.path === "/health" ||
      req.path.startsWith("/assets") ||
      (process.env.NODE_ENV === "development" &&
        (req.path === "/api/test-call" ||
          req.path === "/api/dashboard/stats" ||
          req.path === "/api/admin/stats/overview" ||
          req.path === "/api/calls" ||
          req.path === "/api/calls/active" ||
          req.path === "/api/calls/queue" ||
          req.path === "/api/system/status" ||
          req.path === "/api/notifications"))
    );
  },
});

// Rate limiting for admin endpoints
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Stricter limit for admin operations
  message: {
    error: "Too many admin requests, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down middleware - progressively delays responses
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

// Webhook signature verification for Twilio
export function verifyTwilioSignature(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Skip verification in development mode if auth token not set
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.TWILIO_AUTH_TOKEN
  ) {
    console.log(
      "⚠️ Skipping Twilio signature verification in development mode",
    );
    return next();
  }

  const twilioSignature = req.get("X-Twilio-Signature");
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!twilioSignature) {
    console.error("Missing Twilio signature header");
    return res
      .status(400)
      .json({ error: "Invalid webhook request - missing signature" });
  }

  try {
    // Get the full URL including protocol, host, and path
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    // Twilio sends the body as form-encoded, get raw body for verification
    const body = req.rawBody || "";

    // Create the expected signature
    const expectedSignature = crypto
      .createHmac("sha1", authToken)
      .update(Buffer.concat([Buffer.from(url), Buffer.from(body)]))
      .digest("base64");

    const expectedHeader = `sha1=${expectedSignature}`;

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(twilioSignature);
    const expectedBuffer = Buffer.from(expectedHeader);

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("Twilio signature verification failed - length mismatch");
      return res.status(403).json({ error: "Invalid webhook signature" });
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      console.error(
        "Twilio signature verification failed - signature mismatch",
      );
      return res.status(403).json({ error: "Invalid webhook signature" });
    }

    console.log("✅ Twilio signature verified successfully");
    next();
  } catch (error) {
    console.error("Error verifying Twilio signature:", error);
    return res.status(500).json({ error: "Signature verification error" });
  }
}

// Webhook signature verification for Stripe
export function verifyStripeSignature(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Skip verification in development mode if webhook secret not set
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.STRIPE_WEBHOOK_SECRET
  ) {
    console.log(
      "⚠️ Skipping Stripe signature verification in development mode",
    );
    return next();
  }

  const signature = req.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!signature) {
    console.error("Missing Stripe signature header");
    return res
      .status(400)
      .json({ error: "Invalid webhook request - missing signature" });
  }

  try {
    const body = req.rawBody || "";
    const elements = signature.split(",");

    let timestamp: string | null = null;
    let v1Signature: string | null = null;

    // Parse the signature header
    for (const element of elements) {
      const [key, value] = element.split("=");
      if (key === "t") {
        timestamp = value;
      } else if (key === "v1") {
        v1Signature = value;
      }
    }

    if (!timestamp || !v1Signature) {
      console.error("Invalid Stripe signature format");
      return res.status(400).json({ error: "Invalid signature format" });
    }

    // Check timestamp to prevent replay attacks (allow 5 minute tolerance)
    const timestampNumber = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes

    if (Math.abs(currentTime - timestampNumber) > tolerance) {
      console.error("Stripe webhook timestamp too old");
      return res.status(400).json({ error: "Request timestamp too old" });
    }

    // Create the expected signature
    const payload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    // Use timing-safe comparison
    const signatureBuffer = Buffer.from(v1Signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("Stripe signature verification failed - length mismatch");
      return res.status(403).json({ error: "Invalid webhook signature" });
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      console.error(
        "Stripe signature verification failed - signature mismatch",
      );
      return res.status(403).json({ error: "Invalid webhook signature" });
    }

    console.log("✅ Stripe signature verified successfully");
    next();
  } catch (error) {
    console.error("Error verifying Stripe signature:", error);
    return res.status(500).json({ error: "Signature verification error" });
  }
}

// Middleware to capture raw body for webhook signature verification
export function captureRawBody(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.path.includes("/webhook") || req.path.includes("/twilio")) {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
}

// Security headers middleware
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Skip security headers for WebSocket upgrade requests
  if (req.headers.upgrade === "websocket") {
    return next();
  }

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  // Content Security Policy - allow WebSocket connections, Stripe.js, and Tawk.to
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://replit.com https://embed.tawk.to https://*.tawk.to; " +
      "style-src 'self' 'unsafe-inline' https://embed.tawk.to https://*.tawk.to; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data: https://embed.tawk.to https://*.tawk.to; " +
      "connect-src 'self' wss: https: https://api.openai.com https://api.elevenlabs.io https://api.stripe.com https://embed.tawk.to https://*.tawk.to wss://*.tawk.to; " +
      "frame-src 'self' https://js.stripe.com https://tawk.to https://*.tawk.to; " +
      "media-src 'self' https://embed.tawk.to https://*.tawk.to; " +
      "frame-ancestors 'none';",
  );

  next();
}

// IP whitelist for webhook endpoints (optional, can be configured via env)
export function webhookIPWhitelist(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const allowedIPs = process.env.WEBHOOK_ALLOWED_IPS?.split(",") || [];

  if (allowedIPs.length === 0) {
    return next(); // No IP restrictions configured
  }

  const clientIP =
    req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  if (!clientIP || !allowedIPs.includes(clientIP)) {
    console.error(`Webhook request from unauthorized IP: ${clientIP}`);
    return res.status(403).json({ error: "Unauthorized IP address" });
  }

  next();
}
