import { Request, Response, NextFunction } from "express";
import { supabase } from "../supabase";
import { storage } from "../storage";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Access token required" });
      return;
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Authentication error:", error);
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      res.status(403).json({
        message:
          "Email verification required. Please verify your email address.",
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      emailConfirmed: !!user.email_confirmed_at,
      ...user.user_metadata,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      // Get user data from your custom users table to check role
      const userData = await storage.getUser(req.user.id);

      if (!userData) {
        res.status(403).json({ message: "Unable to verify user role" });
        return;
      }

      if (!allowedRoles.includes(userData.role)) {
        res.status(403).json({
          message:
            "Insufficient permissions. Required roles: " +
            allowedRoles.join(", "),
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Role verification failed" });
    }
  };
}

export async function withUserProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Get full user profile
    const userData = await storage.getUser(req.user.id);

    if (!userData) {
      res.status(404).json({ message: "User profile not found" });
      return;
    }

    // Attach full user profile to request
    req.user = {
      ...req.user,
      profile: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        emailVerified: userData.emailVerified,
        role: userData.role,
        stripeCustomerId: userData.stripeCustomerId,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    };

    next();
  } catch (error) {
    console.error("User profile middleware error:", error);
    res.status(500).json({ message: "Failed to load user profile" });
  }
}
