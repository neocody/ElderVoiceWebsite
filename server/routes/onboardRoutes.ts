import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { supabase } from "../supabase";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return value.trim();
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.startsWith("1") && digits.length === 11) {
    return `+${digits}`;
  }
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function calculateAgeFromDate(dateString?: string) {
  if (!dateString) return undefined;
  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function mergeConversationPreferences(
  existing: Record<string, any> | null | undefined,
  updates: Record<string, any>,
) {
  return {
    ...(existing ?? {}),
    ...updates,
  };
}

async function authenticateRequest(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ message: "Invalid or expired token" });
      return null;
    }

    return { userId: data.user.id };
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
}

// Schemas
const myselfProfileSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  // phone required if account created with email; we enforce required here
  phone: z.string().min(7),
  dateOfBirth: z.string().min(1),
  zipCode: z.string().min(3),
  preferredName: z.string().optional(),
});

const lovedOneCaregiverSchema = z
  .object({
    userId: z.string().min(1),
    caregiverFirstName: z.string().min(1),
    caregiverLastName: z.string().min(1),
    caregiverPhone: z.string().min(7).optional(),
    caregiverEmail: z.string().email().optional(),
  })
  .refine((d) => !!d.caregiverPhone || !!d.caregiverEmail, {
    message: "Either caregiverPhone or caregiverEmail is required",
    path: ["caregiverPhone"],
  });

const lovedOneProfileSchema = z.object({
  userId: z.string().min(1), // caregiver id
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(7),
  zipCode: z.string().min(3),
  relationship: z.string().min(1),
  preferredName: z.string().optional(),
});

const callPreferencesSchema = z.object({
  userId: z.string().min(1),
  elderlyUserId: z.number().optional(),
  days: z.array(z.string()).min(1),
  defaultTime: z.string().min(1), // "HH:MM"
  customTimes: z.record(z.string()).optional(),
});

const personalizationSchema = z.object({
  userId: z.string().min(1),
  elderlyUserId: z.number(),
  interests: z.string().optional(),
  aboutText: z.string().optional(),
});

export function registerOnboardRoutes(app: Express) {
  // Myself flow: save user profile and create elderly user linked to same user
  app.post("/api/onboard/myself/profile", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req, res);
      if (!authUser) {
        return;
      }

      const result = myselfProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: result.error.errors });
      }

      const {
        userId,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        zipCode,
        preferredName,
      } = result.data;

      if (authUser.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const normalizedPhone = normalizePhone(phone);
      const birthDate = new Date(dateOfBirth);
      const age = calculateAgeFromDate(dateOfBirth);

      // Update Users table
      await storage.updateUser(authUser.userId, {
        firstName,
        lastName,
        phone: normalizedPhone,
      });

      // Create or update elderly user for this user as the caregiver
      const existingElderlyUsers = await storage.getElderlyUsers(
        authUser.userId,
      );
      let elderly = existingElderlyUsers.find(
        (e: any) => normalizePhone(e.phone || "") === normalizedPhone,
      );

      const existingConversationPreferences =
        elderly?.conversationPreferences as Record<string, any> | undefined;
      const mergedConversationPreferences = mergeConversationPreferences(
        existingConversationPreferences,
        {
          signupPersonalInfo: {
            ...(existingConversationPreferences?.signupPersonalInfo ?? {}),
            userType: "myself",
            zipCode,
            dateOfBirth,
            preferredName: preferredName ?? firstName,
            updatedAt: new Date().toISOString(),
          },
        },
      );

      const elderlyPayload: Record<string, any> = {
        caregiverId: authUser.userId,
        name: `${firstName} ${lastName}`.trim(),
        preferredName: preferredName ?? firstName,
        phone: normalizedPhone,
        conversationPreferences: mergedConversationPreferences,
        callFrequency: "daily",
        status: "active",
        consent: true,
      };

      if (!Number.isNaN(birthDate.getTime())) {
        elderlyPayload.dateOfBirth = birthDate;
      }
      if (typeof age === "number") {
        elderlyPayload.age = age;
      }

      if (!elderly) {
        elderly = await storage.createElderlyUser(elderlyPayload);
      } else {
        elderly = await storage.updateElderlyUser(elderly.id, elderlyPayload);
      }

      return res.json({ message: "Profile saved", elderlyUserId: elderly.id });
    } catch (error) {
      console.error("Onboard myself profile error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Loved-one: save caregiver details into users table
  app.post("/api/onboard/caregiver/profile", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req, res);
      if (!authUser) {
        return;
      }

      const result = lovedOneCaregiverSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: result.error.errors });
      }

      const {
        userId,
        caregiverFirstName,
        caregiverLastName,
        caregiverPhone,
        caregiverEmail,
      } = result.data;

      if (authUser.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const normalizedPhone = caregiverPhone
        ? normalizePhone(caregiverPhone)
        : undefined;

      const userUpdates: Record<string, any> = {
        firstName: caregiverFirstName,
        lastName: caregiverLastName,
      };

      if (normalizedPhone) {
        userUpdates.phone = normalizedPhone;
      }

      if (caregiverEmail) {
        userUpdates.email = caregiverEmail;
      }

      await storage.updateUser(authUser.userId, userUpdates);

      return res.json({ message: "Caregiver profile saved" });
    } catch (error) {
      console.error("Onboard caregiver profile error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Loved-one: create elderly user profile linked to caregiver
  app.post("/api/onboard/loved-one/profile", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req, res);
      if (!authUser) {
        return;
      }

      const result = lovedOneProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: result.error.errors });
      }

      const {
        userId,
        firstName,
        lastName,
        phone,
        zipCode,
        relationship,
        preferredName,
      } = result.data;

      if (authUser.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const normalizedPhone = normalizePhone(phone);

      const conversationPreferences = {
        signupPersonalInfo: {
          userType: "loved-one",
          zipCode,
          relationship,
          preferredName: preferredName ?? firstName,
          updatedAt: new Date().toISOString(),
        },
      };

      const elderly = await storage.createElderlyUser({
        caregiverId: authUser.userId,
        name: `${firstName} ${lastName}`.trim(),
        preferredName: preferredName ?? firstName,
        phone: normalizedPhone,
        conversationPreferences,
        callFrequency: "daily",
        status: "active",
        consent: true,
      } as any);

      return res.json({
        message: "Loved one profile created",
        elderlyUserId: elderly.id,
      });
    } catch (error) {
      console.error("Onboard loved one profile error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Save call preferences (applies to both flows)
  app.post("/api/onboard/call-preferences", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req, res);
      if (!authUser) {
        return;
      }

      const result = callPreferencesSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: result.error.errors });
      }

      const { userId, elderlyUserId, days, defaultTime, customTimes } =
        result.data;

      if (authUser.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Resolve elderly user: use provided elderlyUserId or create/find self elderly user
      let targetElderlyId = elderlyUserId;
      if (!targetElderlyId) {
        const existing = await storage.getElderlyUsers(authUser.userId);
        if (!existing || existing.length === 0) {
          return res
            .status(400)
            .json({ message: "No elderly user found for caregiver" });
        }
        targetElderlyId = existing[0].id;
      }

      const elderly = await storage.getElderlyUser(targetElderlyId!);
      if (!elderly || elderly.caregiverId !== authUser.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const frequency = (() => {
        if (days.length === 7) return "daily";
        if (days.length === 1) return "weekly";
        if (days.length === 0) return "custom";
        return "custom";
      })();

      const existingConversationPreferences =
        elderly?.conversationPreferences as Record<string, any> | undefined;

      const mergedConversationPreferences = mergeConversationPreferences(
        existingConversationPreferences,
        {
          signupCallPreferences: {
            ...(existingConversationPreferences?.signupCallPreferences ?? {}),
            days,
            defaultTime,
            customTimes: customTimes ?? {},
            updatedAt: new Date().toISOString(),
          },
        },
      );

      const updated = await storage.updateElderlyUser(targetElderlyId!, {
        preferredCallDays: days as any,
        preferredCallTime: defaultTime,
        callFrequency: frequency,
        conversationPreferences: mergedConversationPreferences,
      } as any);

      return res.json({
        message: "Call preferences saved",
        elderlyUserId: updated.id,
      });
    } catch (error) {
      console.error("Onboard call preferences error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Save personalization (applies to both flows)
  app.post("/api/onboard/personalization", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req, res);
      if (!authUser) {
        return;
      }

      const result = personalizationSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: result.error.errors });
      }

      const {
        userId: bodyUserId,
        elderlyUserId,
        interests,
        aboutText,
      } = result.data;

      if (authUser.userId !== bodyUserId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const elderly = await storage.getElderlyUser(elderlyUserId);

      if (!elderly || elderly.caregiverId !== authUser.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const topics = interests
        ? interests
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : undefined;

      const existingConversationPreferences =
        elderly?.conversationPreferences as Record<string, any> | undefined;

      const mergedConversationPreferences = mergeConversationPreferences(
        existingConversationPreferences,
        {
          signupPersonalization: {
            ...(existingConversationPreferences?.signupPersonalization ?? {}),
            interests,
            aboutText,
            updatedAt: new Date().toISOString(),
          },
        },
      );

      const updated = await storage.updateElderlyUser(elderlyUserId, {
        topicsOfInterest: topics as any,
        lifeHistory: aboutText,
        conversationPreferences: mergedConversationPreferences,
      } as any);

      return res.json({
        message: "Personalization saved",
        elderlyUserId: updated.id,
      });
    } catch (error) {
      console.error("Onboard personalization error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}
