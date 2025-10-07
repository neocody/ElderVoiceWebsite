import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  googleId: varchar("google_id"), // For Google OAuth
  emailVerified: boolean("email_verified").default(false),
  role: varchar("role", {
    enum: ["administrator", "facility_manager", "member", "family_member"],
  })
    .notNull()
    .default("member"),
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Elderly users who receive calls
export const elderlyUsers = pgTable("elderly_users", {
  id: serial("id").primaryKey(),

  // Basic Information
  name: varchar("name").notNull(),
  preferredName: varchar("preferred_name"),
  dateOfBirth: timestamp("date_of_birth"),
  age: integer("age"),
  gender: varchar("gender", {
    enum: ["male", "female", "other", "prefer_not_to_say"],
  }),
  phone: varchar("phone").notNull().unique(),
  alternatePhone: varchar("alternate_phone"),

  // Call Preferences
  preferredCallDays: jsonb("preferred_call_days"), // array of days
  preferredCallTime: varchar("preferred_call_time"), // morning, afternoon, evening
  callFrequency: varchar("call_frequency").notNull().default("daily"), // daily, every_other_day, weekly, custom
  voiceId: varchar("voice_id").default("QZOPTHiWteIgblFWoaMc"), // ElevenLabs voice ID - defaults to Old American Man

  // Health and Well-being
  healthConcerns: text("health_concerns"),
  medications: text("medications"),
  allergies: text("allergies"),
  mobilityLevel: varchar("mobility_level", {
    enum: [
      "fully_mobile",
      "limited_mobility",
      "requires_assistance",
      "bedridden",
    ],
  }),

  // Cognitive and Emotional Preferences
  cognitiveStatus: varchar("cognitive_status", {
    enum: [
      "excellent",
      "good",
      "mild_impairment",
      "moderate_impairment",
      "significant_impairment",
    ],
  }),
  topicsOfInterest: jsonb("topics_of_interest"), // array of interests
  conversationTone: varchar("conversation_tone", {
    enum: ["formal", "friendly", "humorous", "gentle", "neutral"],
  }),

  // Conversation-focused fields for AI personalization
  familyInfo: text("family_info"),
  specialNotes: text("special_notes"),
  conversationStyle: varchar("conversation_style"),

  // Enhanced AI Context Fields
  lifeHistory: text("life_history"), // Career, major life events, achievements
  personalityTraits: jsonb("personality_traits"), // Array of traits like ["cheerful", "curious", "reserved"]
  favoriteMemories: text("favorite_memories"), // Cherished memories they like to discuss
  currentLivingSituation: text("current_living_situation"), // Where they live, with whom
  dailyRoutine: text("daily_routine"), // Their typical day structure
  socialConnections: text("social_connections"), // Friends, family they see regularly
  culturalBackground: text("cultural_background"), // Heritage, traditions, language preferences
  educationBackground: text("education_background"), // Schools attended, degrees, areas of study
  pastCareers: text("past_careers"), // Work history, what they did professionally
  hobbiesAndCrafts: text("hobbies_and_crafts"), // Detailed hobbies, things they make or collect
  favoriteBooks: text("favorite_books"), // Books they love or authors they enjoy
  favoriteMusic: text("favorite_music"), // Musical preferences, instruments they played
  travelExperiences: text("travel_experiences"), // Places they've been, want to go
  religiousSpiritual: text("religious_spiritual"), // Religious beliefs, spiritual practices
  currentChallenges: text("current_challenges"), // What they're dealing with now
  motivationsGoals: text("motivations_goals"), // What keeps them going, future hopes
  communicationPreferences: text("communication_preferences"), // How they like to be spoken to
  sensoryPreferences: text("sensory_preferences"), // Hearing, vision considerations
  memoryConsiderations: text("memory_considerations"), // Memory aids, things to remember/avoid

  // Emergency Contacts
  primaryEmergencyContact: jsonb("primary_emergency_contact"), // {name, relationship, phone}
  secondaryEmergencyContact: jsonb("secondary_emergency_contact"), // {name, relationship, phone}

  // Special Instructions
  specialInstructions: text("special_instructions"),

  // System fields
  caregiverId: varchar("caregiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationPreferences: jsonb("conversation_preferences"), // legacy field for backwards compatibility
  medicationReminders: jsonb("medication_reminders"), // legacy field for backwards compatibility
  status: varchar("status").notNull().default("active"), // active, inactive, needs_attention
  consent: boolean("consent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Call logs and records with enhanced transcript tracking
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  elderlyUserId: integer("elderly_user_id")
    .notNull()
    .references(() => elderlyUsers.id, { onDelete: "cascade" }),
  status: varchar("status").notNull(), // completed, missed, failed, in_progress
  duration: integer("duration"), // in seconds
  transcript: text("transcript"),
  summary: text("summary"), // AI-generated summary of the call
  sentiment: varchar("sentiment"), // positive, neutral, negative
  callSid: varchar("call_sid"), // Twilio call SID
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patient memory - cumulative knowledge about each patient
export const patientMemory = pgTable("patient_memory", {
  id: serial("id").primaryKey(),
  elderlyUserId: integer("elderly_user_id")
    .notNull()
    .references(() => elderlyUsers.id, { onDelete: "cascade" }),
  callId: integer("call_id").references(() => calls.id, {
    onDelete: "cascade",
  }), // Source call for this memory entry
  memoryType: varchar("memory_type").notNull(), // 'conversation_summary', 'preference_learned', 'health_update', 'family_news', 'interest_mentioned'
  content: text("content").notNull(), // Detailed memory content
  tags: jsonb("tags"), // Searchable tags like ['family', 'health', 'music', 'mood']
  context: text("context"), // Additional context information
  importanceScore: integer("importance_score").default(50), // 0-100 score
  isVerified: boolean("is_verified").default(false), // If this memory has been verified/confirmed
  lastReferenced: timestamp("last_referenced"), // When this memory was last used in conversation
  createdAt: timestamp("created_at").defaultNow(),
});

// Call schedules
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  elderlyUserId: integer("elderly_user_id")
    .notNull()
    .references(() => elderlyUsers.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week"), // 0-6 (Sunday-Saturday), null for daily
  daysOfWeek: text("days_of_week").array(), // Array of day numbers for custom schedules
  timeOfDay: varchar("time_of_day").notNull(), // HH:MM format
  frequency: varchar("frequency").notNull().default("daily"), // daily, weekly, custom
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Notifications System
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  elderlyUserId: integer("elderly_user_id").references(() => elderlyUsers.id, {
    onDelete: "cascade",
  }),
  templateId: integer("template_id").references(() => notificationTemplates.id),
  type: varchar("type").notNull(), // call_completed, call_missed, call_failed, reminder, system_alert, billing_alert
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  isRead: boolean("is_read").notNull().default(false),
  sentViaEmail: boolean("sent_via_email").default(false),
  sentViaSms: boolean("sent_via_sms").default(false),
  actionRequired: boolean("action_required").default(false),
  actionUrl: varchar("action_url"),
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification Templates for Admin Configuration
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type", {
    enum: [
      // Authentication
      "account_verification",
      "password_reset",
      "welcome_email",

      // Call events
      "call_completed",
      "call_missed",
      "call_failed",

      // Engagement
      "reminder",
      "newsletter",
      "announcement",

      // Alerts
      "system_alert",
      "billing_alert",
      "security_alert",

      // Custom templates
      "custom",
    ],
  }).notNull(),

  description: text("description"),
  targetUserTypes: jsonb("target_user_types").notNull(), // Array of targeted user's roles
  isActive: boolean("is_active").default(true),

  // Email template
  emailEnabled: boolean("email_enabled").default(true),
  emailSubject: text("email_subject").notNull(),
  emailBody: text("email_body").notNull(),

  // SMS template
  smsEnabled: boolean("sms_enabled").default(false),
  smsMessage: text("sms_message"),

  // Trigger conditions
  triggerConditions: jsonb("trigger_conditions"), // When to send this notification
  sendDelay: integer("send_delay").default(0), // Delay in minutes before sending

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification Preferences per User
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),

  // Channel preferences
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  inAppEnabled: boolean("in_app_enabled").default(true),

  // Notification type preferences
  callNotifications: boolean("call_notifications").default(true),
  systemAlerts: boolean("system_alerts").default(true),
  billingAlerts: boolean("billing_alerts").default(true),
  reminders: boolean("reminders").default(true),

  // Quiet hours
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
  quietHoursStart: varchar("quiet_hours_start").default("22:00"),
  quietHoursEnd: varchar("quiet_hours_end").default("08:00"),

  // Priority filtering
  minPriorityLevel: varchar("min_priority_level").default("normal"), // low, normal, high, urgent

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas with custom validation
export const insertElderlyUserSchema = createInsertSchema(elderlyUsers)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Override dateOfBirth to accept string and convert to Date
    dateOfBirth: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
  });

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  sentViaEmail: true,
  sentViaSms: true,
  createdAt: true,
});

export const insertNotificationTemplateSchema = createInsertSchema(
  notificationTemplates,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(
  notificationPreferences,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ElderlyUser = typeof elderlyUsers.$inferSelect;
export type InsertElderlyUser = z.infer<typeof insertElderlyUserSchema>;
export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export const insertPatientMemorySchema = createInsertSchema(patientMemory).omit(
  {
    id: true,
    createdAt: true,
  },
);

export type PatientMemory = typeof patientMemory.$inferSelect;
export type InsertPatientMemory = z.infer<typeof insertPatientMemorySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<
  typeof insertNotificationTemplateSchema
>;
export type NotificationPreferences =
  typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<
  typeof insertNotificationPreferencesSchema
>;

// Admin Panel Tables
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'nursing_home', 'assisted_living', 'memory_care', 'home_care'
  address: varchar("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email").notNull(),
  licenseNumber: varchar("license_number").notNull(),
  capacity: integer("capacity").notNull(),
  currentResidents: integer("current_residents").default(0),
  status: varchar("status").default("pending"), // 'active', 'pending', 'suspended'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const approvalRequests = pgTable("approval_requests", {
  id: varchar("id").primaryKey(),
  type: varchar("type").notNull(), // 'facility', 'user'
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  role: varchar("role"),
  accountType: varchar("account_type"),
  facilityName: varchar("facility_name"),
  facilityId: varchar("facility_id"),
  notes: text("notes"),
  requestData: jsonb("request_data"), // Store full form data
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by"),
});

// Admin schema types
export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  currentResidents: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApprovalRequestSchema = createInsertSchema(
  approvalRequests,
).omit({
  id: true,
  status: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
});

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;

// Admin Notification Preferences
export const adminNotificationPreferences = pgTable(
  "admin_notification_preferences",
  {
    id: serial("id").primaryKey(),
    // Global notification toggles
    smsNotificationsEnabled: boolean("sms_notifications_enabled").default(true),
    emailNotificationsEnabled: boolean("email_notifications_enabled").default(
      true,
    ),

    // Alert thresholds
    failedCallsThreshold: integer("failed_calls_threshold").default(3), // Number of failed calls before alert
    failedCallsTimeWindow: integer("failed_calls_time_window").default(60), // Time window in minutes
    negativeSentimentThreshold: text("negative_sentiment_threshold").default(
      "0.70",
    ), // 0.0-1.0 sentiment score as string
    billingFailureThreshold: integer("billing_failure_threshold").default(2), // Number of billing failures before alert
    systemDowntimeThreshold: integer("system_downtime_threshold").default(5), // Minutes of downtime before alert

    // Contact information for critical alerts
    criticalAlertEmails: text("critical_alert_emails").array().default([]), // Array of email addresses
    criticalAlertPhones: text("critical_alert_phones").array().default([]), // Array of phone numbers

    // Notification timing settings
    quietHoursStart: text("quiet_hours_start").default("22:00"), // Format: "HH:MM"
    quietHoursEnd: text("quiet_hours_end").default("08:00"), // Format: "HH:MM"
    emergencyOverrideQuietHours: boolean(
      "emergency_override_quiet_hours",
    ).default(true),

    // Alert frequency limits
    maxAlertsPerHour: integer("max_alerts_per_hour").default(10),
    alertCooldownMinutes: integer("alert_cooldown_minutes").default(30),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

export const insertAdminNotificationPreferencesSchema = createInsertSchema(
  adminNotificationPreferences,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminNotificationPreferences =
  typeof adminNotificationPreferences.$inferSelect;
export type InsertAdminNotificationPreferences = z.infer<
  typeof insertAdminNotificationPreferencesSchema
>;

// System Settings for centralized configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  category: varchar("category").notNull(), // 'ai', 'calling', 'security', 'limits', 'maintenance'
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-specific settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  category: varchar("category").notNull(), // 'notifications', 'accessibility', 'regional', 'privacy'
  settings: jsonb("settings").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Master AI Prompt storage
export const masterPrompts = pgTable("master_prompts", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertSystemSettingsSchema = createInsertSchema(
  systemSettings,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMasterPromptSchema = createInsertSchema(masterPrompts).omit({
  id: true,
  version: true,
  createdAt: true,
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type MasterPrompt = typeof masterPrompts.$inferSelect;
export type InsertMasterPrompt = z.infer<typeof insertMasterPromptSchema>;

// Service Plans for recurring products
export const servicePlans = pgTable("serviceplans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),

  basePrice: integer("basePrice").notNull(), // in cents
  annualDiscount: integer("annualDiscount").default(0),
  planType: varchar("planType", { enum: ["individual", "facility"] }).notNull(),

  callsPerMonth: integer("callsPerMonth").notNull(),
  callDurationMinutes: integer("callDurationMinutes").notNull(),

  // Stripe Integration
  stripeProductId: varchar("stripeProductId"),
  stripeMonthlyPriceId: varchar("stripeMonthlyPriceId"),
  stripeAnnualPriceId: varchar("stripeAnnualPriceId"),

  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Services linking clients to plans (no specific recipients - patients are separate)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(), // machine-readable key e.g. "medication_reminders"
  name: varchar("name").notNull(), // human-readable name e.g. "Medication Reminders"
  description: text("description"), // optional extra info
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const servicePlanServices = pgTable("service_plan_services", {
  id: serial("id").primaryKey(),

  servicePlanId: integer("servicePlanId")
    .notNull()
    .references(() => servicePlans.id, { onDelete: "cascade" }),

  serviceId: integer("serviceId")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt").defaultNow(),
});

export type ServicePlanWithServices = SelectServicePlan & {
  serviceIds: number[];
};

// Insert schemas for WHMCS-style tables
export const insertServicePlanSchema = createInsertSchema(servicePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertServicePlan = z.infer<typeof insertServicePlanSchema>;
export type SelectServicePlan = typeof servicePlans.$inferSelect;

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertService = z.infer<typeof insertServiceSchema>;
export type SelectService = typeof services.$inferSelect;

// Coupon and Billing Tables
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  stripeCouponId: varchar("stripe_coupon_id").notNull().unique(),
  stripePromotionCodeId: varchar("stripe_promotion_code_id"),
  code: varchar("code").notNull().unique(),
  name: varchar("name"),
  couponType: varchar("coupon_type", {
    enum: ["percent", "amount"],
  }).notNull(),
  percentOff: integer("percent_off"),
  amountOff: integer("amount_off"), // stored in cents when applicable
  currency: varchar("currency"),
  duration: varchar("duration", {
    enum: ["forever", "once", "repeating"],
  }).notNull(),
  durationInMonths: integer("duration_in_months"),
  maxRedemptions: integer("max_redemptions"),
  redeemBy: timestamp("redeem_by"),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  timesRedeemed: true,
});
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// Billing and Subscription Tables
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),

  planId: integer("plan_id")
    .references(() => servicePlans.id)
    .notNull(),

  stripeCustomerId: varchar("stripe_customer_id").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id").notNull().unique(),
  stripePriceId: varchar("stripe_price_id"), // track current price (monthly/annual)
  stripeLatestInvoiceId: varchar("stripe_latest_invoice_id"), // optional quick access
  stripePaymentMethodId: varchar("stripe_payment_method_id"), // optional

  status: varchar("status", {
    enum: [
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
    ],
  }).notNull(),

  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),

  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),

  canceledAt: timestamp("canceled_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  endedAt: timestamp("ended_at"), // when subscription fully ends
  couponId: integer("coupon_id").references(() => coupons.id, {
    onDelete: "set null",
  }),
  stripePromotionCodeId: varchar("stripe_promotion_code_id"),
  couponAppliedAt: timestamp("coupon_applied_at"),

  metadata: jsonb("metadata"), // store extra info from Stripe if needed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for billing tables
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for billing
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

//invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id")
    .references(() => subscriptions.id, { onDelete: "cascade" })
    .notNull(),

  stripeInvoiceId: varchar("stripe_invoice_id").notNull().unique(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  amountDue: integer("amount_due").notNull(), // in cents
  amountPaid: integer("amount_paid"),
  currency: varchar("currency").notNull(),
  status: varchar("status", {
    enum: ["draft", "open", "paid", "uncollectible", "void"],
  }).notNull(),

  hostedInvoiceUrl: varchar("hosted_invoice_url"), // for user to view/pay
  pdfUrl: varchar("pdf_url"), // downloadable PDF

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Client usage tracking table - tracks monthly usage statistics
export const clientUsage = pgTable("client_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(), // e.g., 2024
  callsPlaced: integer("calls_placed").default(0),
  totalCallMinutes: integer("total_call_minutes").default(0),
  messagesDelivered: integer("messages_delivered").default(0),
  emailsSent: integer("emails_sent").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas and types for client usage
export const insertClientUsageSchema = createInsertSchema(clientUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClientUsage = z.infer<typeof insertClientUsageSchema>;
export type SelectClientUsage = typeof clientUsage.$inferSelect;

// Team Members (Admin Staff)
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").notNull().unique(),
  name: varchar("name").notNull(),
  role: varchar("role", { enum: ["administrator", "support", "manager"] })
    .notNull()
    .default("support"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type SelectTeamMember = typeof teamMembers.$inferSelect;
