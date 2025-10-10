import type { Express } from "express";
import { z } from "zod";
import { supabase } from "../supabase";
import { sendEmail, sendTemplateEmail } from "../services/emailService";
import { randomBytes } from "crypto";
import { storage } from "../storage";
import { TwilioService } from "../services/twilioService";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.FROM_EMAIL) {
  throw new Error("Missing FROM_EMAIL");
}
if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY");
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schemas
const registerStartSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^[0-9+()\-\s]{10,20}$/)
      .optional(),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Either email or phone is required",
    path: ["email"],
  });

const verifyOtpSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    otp: z.string().regex(/^\d{6}$/),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Either email or phone is required",
    path: ["email"],
  });

const setPasswordSchema = z
  .object({
    userId: z.string().min(1),
    password: z.string().min(8),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^[0-9+()\-\s]{10,20}$/)
      .optional(),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Either email or phone is required",
    path: ["email"],
  });

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1, "Access token is required"),
});

// Simple in-memory store for OTP codes (contact -> { code, expiresAt })
const pendingOtps: Map<string, { code: string; expiresAt: number }> = new Map();

function contactKey(email?: string, phone?: string) {
  return email ? `email:${email.toLowerCase()}` : `phone:${phone}`;
}

function normalizePhone(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function registerAuthRoutes(app: Express) {
  // OTP Registration: start (send OTP to email or phone)
  app.post("/api/auth/register/start", async (req, res) => {
    try {
      const result = registerStartSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.errors,
        });
      }
      const { email, phone } = result.data;

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const key = contactKey(email, phone);

      // Store OTP
      pendingOtps.set(key, {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Log after storing (ensures it logs every time)
      console.log(
        `OTP generated for ${email || phone}: ${otp} (expires in 10 minutes)`
      );

      // Send via chosen channel
      if (email) {
        try {
          await resend.emails.send({
            from: process.env.FROM_EMAIL!,
            to: email,
            subject: "Your ElderVoice verification code",
            html: `Your verification code is ${otp}. It expires in 10 minutes.`,
          });
        } catch (e) {
          return res.status(500).json({ message: "Failed to send email" });
        }
      } else if (phone) {
        const twilioSvc = new TwilioService();
        try {
          await twilioSvc.sendSMS(
            phone,
            `Your ElderVoice verification code is ${otp}. It expires in 10 minutes.`
          );
        } catch (e) {
          console.error("Failed to send SMS:", e);
          return res.status(500).json({ message: "Failed to send SMS" });
        }
      }

      return res.json({
        message: `Verification code sent`,
      });
    } catch (error) {
      console.error("Register start error:", error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  // OTP Registration: verify code and create Supabase user
  app.post("/api/auth/register/verify-otp", async (req, res) => {
    try {
      const result = verifyOtpSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.errors,
        });
      }

      const { email, phone, otp } = result.data;
      const key = contactKey(email, phone);
      const entry = pendingOtps.get(key);
      if (!entry || entry.code !== otp || entry.expiresAt < Date.now()) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification code" });
      }

      // Create Supabase user now (temporary random password, will be set next step)
      const tempPassword = randomBytes(12).toString("hex");
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email,
          phone: phone,
          password: tempPassword,
          email_confirm: !!email, // mark confirmed if using email OTP
        } as any);

      if (authError || !authData?.user) {
        console.error("Supabase create user error:", authError);
        return res
          .status(400)
          .json({ message: authError?.message || "Failed to create user" });
      }

      // Create app user record (names optional now)
      const userRecord = await storage.createUser({
        id: authData.user.id,
        email: authData.user.email || undefined,
        phone: phone,
        role: "member",
        emailVerified: !!authData.user.email_confirmed_at,
      });

      // Clear OTP
      pendingOtps.delete(key);

      return res.json({
        message: "Verified successfully",
        userId: authData.user.id,
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // OTP Registration: set password after verification
  app.post("/api/auth/register/set-password", async (req, res) => {
    try {
      const result = setPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.errors,
        });
      }

      const { userId, password, email, phone } = result.data;
      const { data: authUser, error } =
        await supabase.auth.admin.updateUserById(userId, { password });
      if (error) {
        return res.status(400).json({ message: error.message });
      }

      const normalizedPhone = normalizePhone(phone);
      const signInPayload = email
        ? { email: email.toLowerCase(), password }
        : normalizedPhone
        ? { phone: normalizedPhone, password }
        : null;

      if (!signInPayload) {
        return res
          .status(400)
          .json({ message: "Unable to determine login identity" });
      }

      const { data: sessionData, error: signInError } =
        await supabase.auth.signInWithPassword(signInPayload as any);

      if (signInError || !sessionData.session) {
        console.error("Auto login failed after password set", signInError);
        return res
          .status(400)
          .json({ message: signInError?.message || "Failed to sign in" });
      }

      return res.json({
        message: "Password set successfully",
        session: sessionData.session,
        user: sessionData.user,
      });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint - Check if email is verified
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);

      console.log("Login request received:", req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.errors,
        });
      }

      const { email, password } = result.data;

      console.log(`Login attempt for email: ${email}`);

      // Authenticate with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.error("Supabase auth error:", authError);
        return res.status(401).json({
          message: authError.message,
        });
      }

      // Check if email is verified
      if (!authData.user.email_confirmed_at) {
        return res.status(403).json({
          message:
            "Please verify your email address before logging in. Check your inbox for the verification email.",
        });
      }

      console.log(`User authenticated: ${authData.user.id}`);

      // Get user data from your custom users table
      const userData = await storage.getUser(authData.user.id);

      if (!userData) {
        return res.status(404).json({
          message: "User data not found",
        });
      }

      // Parallelize user update and subscription check for better performance
      const [finalUserData, hasSubscription] = await Promise.all([
        // Update emailVerified status if needed
        !userData.emailVerified && authData.user.email_confirmed_at
          ? storage.updateUser(authData.user.id, { emailVerified: true })
          : Promise.resolve(userData),
        // Check subscription status in parallel
        storage.hasActiveSubscription(authData.user.id)
      ]);

      console.log(`User data fetched: ${finalUserData.id}, hasSubscription: ${hasSubscription}`);

      res.json({
        message: "Login successful",
        user: {
          id: finalUserData.id,
          email: finalUserData.email,
          firstName: finalUserData.firstName,
          lastName: finalUserData.lastName,
          phone: finalUserData.phone,
          emailVerified: finalUserData.emailVerified,
          role: finalUserData.role,
          createdAt: finalUserData.createdAt,
          updatedAt: finalUserData.updatedAt,
        },
        session: authData.session,
        hasSubscription: !!hasSubscription,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Verify token and get user data
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const result = verifyTokenSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.errors,
        });
      }

      const { token } = result.data;

      // Verify token with Supabase
      const { data: authData, error: authError } = await supabase.auth.getUser(
        token
      );

      if (authError || !authData.user) {
        return res.status(401).json({
          message: "Invalid or expired token",
        });
      }

      // Get user data from your custom users table
      const userData = await storage.getUser(authData.user.id);

      if (!userData) {
        return res.status(404).json({
          message: "User data not found",
        });
      }

      res.json({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        emailVerified: userData.emailVerified,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");

      if (token) {
        await supabase.auth.admin.signOut(token);
      }

      res.json({
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.json({
        message: "Logout successful",
      });
    }
  });

  // Password reset request endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      // Check if user exists in our database
      const userData = await storage.getUserByEmail(email);

      if (!userData) {
        // Always return success to prevent email enumeration
        return res.json({
          message:
            "If an account with this email exists, a password reset link has been sent.",
        });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const frontendUrl =
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL_PROD
          : process.env.FRONTEND_URL_DEV;
      const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

      // Store reset token in user metadata
      await supabase.auth.admin.updateUserById(userData.id, {
        user_metadata: {
          reset_token: resetToken,
          reset_token_expires: Date.now() + 60 * 60 * 1000, // 1 hour
        },
      });

      // Send custom password reset email
      try {
        const sentEmail = await sendTemplateEmail(email, "password_reset", {
          firstName: userData.firstName ?? undefined,
          lastName: userData.lastName ?? undefined,
          resetLink: resetLink,
        });
        if (!sentEmail) {
          return res.status(500).json({
            message: "Failed to send email",
          });
        }
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }

      res.json({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          message: "Token and password are required",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      // Find user by reset token
      const { data: authUsers, error: userError } =
        await supabase.auth.admin.listUsers();

      if (userError) {
        return res.status(500).json({
          message: "Failed to validate reset token",
        });
      }

      const userWithToken = authUsers.users.find(
        (user) =>
          user.user_metadata?.reset_token === token &&
          user.user_metadata?.reset_token_expires > Date.now()
      );

      if (!userWithToken) {
        return res.status(400).json({
          message: "Invalid or expired reset token",
        });
      }

      // Update the password
      const { error } = await supabase.auth.admin.updateUserById(
        userWithToken.id,
        {
          password: password,
          user_metadata: {
            ...userWithToken.user_metadata,
            reset_token: null,
            reset_token_expires: null,
          },
        }
      );

      if (error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      res.json({
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  app.post("/api/auth/has-subscription", async (req, res) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const subscription = await storage.hasActiveSubscription(userId);
      return res.json({ isUserSubscribed: !!subscription });
    } catch (e) {
      console.error("Error checking subscription", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
