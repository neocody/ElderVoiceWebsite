CREATE TABLE "admin_notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"sms_notifications_enabled" boolean DEFAULT true,
	"email_notifications_enabled" boolean DEFAULT true,
	"failed_calls_threshold" integer DEFAULT 3,
	"failed_calls_time_window" integer DEFAULT 60,
	"negative_sentiment_threshold" text DEFAULT '0.70',
	"billing_failure_threshold" integer DEFAULT 2,
	"system_downtime_threshold" integer DEFAULT 5,
	"critical_alert_emails" text[] DEFAULT '{}',
	"critical_alert_phones" text[] DEFAULT '{}',
	"quiet_hours_start" text DEFAULT '22:00',
	"quiet_hours_end" text DEFAULT '08:00',
	"emergency_override_quiet_hours" boolean DEFAULT true,
	"max_alerts_per_hour" integer DEFAULT 10,
	"alert_cooldown_minutes" integer DEFAULT 30,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"role" varchar NOT NULL,
	"account_type" varchar NOT NULL,
	"facility_id" varchar,
	"status" varchar DEFAULT 'pending',
	"temp_password" varchar,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"role" varchar,
	"account_type" varchar,
	"facility_name" varchar,
	"facility_id" varchar,
	"notes" text,
	"request_data" jsonb,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"processed_by" varchar
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"elderly_user_id" integer NOT NULL,
	"status" varchar NOT NULL,
	"duration" integer,
	"transcript" text,
	"summary" text,
	"sentiment" varchar,
	"call_sid" varchar,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"ended_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"calls_placed" integer DEFAULT 0,
	"total_call_minutes" integer DEFAULT 0,
	"messages_delivered" integer DEFAULT 0,
	"emails_sent" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "elderly_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"preferred_name" varchar,
	"date_of_birth" timestamp,
	"age" integer,
	"gender" varchar,
	"phone" varchar NOT NULL,
	"alternate_phone" varchar,
	"preferred_call_days" jsonb,
	"preferred_call_time" varchar,
	"call_frequency" varchar DEFAULT 'daily' NOT NULL,
	"voice_id" varchar DEFAULT 'QZOPTHiWteIgblFWoaMc',
	"health_concerns" text,
	"medications" text,
	"allergies" text,
	"mobility_level" varchar,
	"cognitive_status" varchar,
	"topics_of_interest" jsonb,
	"conversation_tone" varchar,
	"family_info" text,
	"special_notes" text,
	"conversation_style" varchar,
	"life_history" text,
	"personality_traits" jsonb,
	"favorite_memories" text,
	"current_living_situation" text,
	"daily_routine" text,
	"social_connections" text,
	"cultural_background" text,
	"education_background" text,
	"past_careers" text,
	"hobbies_and_crafts" text,
	"favorite_books" text,
	"favorite_music" text,
	"travel_experiences" text,
	"religious_spiritual" text,
	"current_challenges" text,
	"motivations_goals" text,
	"communication_preferences" text,
	"sensory_preferences" text,
	"memory_considerations" text,
	"primary_emergency_contact" jsonb,
	"secondary_emergency_contact" jsonb,
	"special_instructions" text,
	"caregiver_id" varchar NOT NULL,
	"conversation_preferences" jsonb,
	"medication_reminders" jsonb,
	"status" varchar DEFAULT 'active' NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "elderly_users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"address" varchar NOT NULL,
	"city" varchar NOT NULL,
	"state" varchar NOT NULL,
	"zip_code" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"email" varchar NOT NULL,
	"license_number" varchar NOT NULL,
	"capacity" integer NOT NULL,
	"current_residents" integer DEFAULT 0,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"stripe_invoice_id" varchar NOT NULL,
	"stripe_payment_intent_id" varchar,
	"amount_due" integer NOT NULL,
	"amount_paid" integer,
	"currency" varchar NOT NULL,
	"status" varchar NOT NULL,
	"hosted_invoice_url" varchar,
	"pdf_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "master_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"email_enabled" boolean DEFAULT true,
	"sms_enabled" boolean DEFAULT false,
	"in_app_enabled" boolean DEFAULT true,
	"call_notifications" boolean DEFAULT true,
	"system_alerts" boolean DEFAULT true,
	"billing_alerts" boolean DEFAULT true,
	"reminders" boolean DEFAULT true,
	"quiet_hours_enabled" boolean DEFAULT false,
	"quiet_hours_start" varchar DEFAULT '22:00',
	"quiet_hours_end" varchar DEFAULT '08:00',
	"min_priority_level" varchar DEFAULT 'normal',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"description" text,
	"target_user_types" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"email_enabled" boolean DEFAULT true,
	"email_subject" text NOT NULL,
	"email_body" text NOT NULL,
	"sms_enabled" boolean DEFAULT false,
	"sms_message" text,
	"trigger_conditions" jsonb,
	"send_delay" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"elderly_user_id" integer,
	"template_id" integer,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_via_email" boolean DEFAULT false,
	"sent_via_sms" boolean DEFAULT false,
	"action_required" boolean DEFAULT false,
	"action_url" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patient_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"elderly_user_id" integer NOT NULL,
	"call_id" integer,
	"memory_type" varchar NOT NULL,
	"content" text NOT NULL,
	"tags" jsonb,
	"context" text,
	"importance_score" integer DEFAULT 50,
	"is_verified" boolean DEFAULT false,
	"last_referenced" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"elderly_user_id" integer NOT NULL,
	"day_of_week" integer,
	"days_of_week" text[],
	"time_of_day" varchar NOT NULL,
	"frequency" varchar DEFAULT 'daily' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_plan_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"servicePlanId" integer NOT NULL,
	"serviceId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "serviceplans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"basePrice" integer NOT NULL,
	"annualDiscount" integer DEFAULT 0,
	"planType" varchar NOT NULL,
	"callsPerMonth" integer NOT NULL,
	"callDurationMinutes" integer NOT NULL,
	"stripeProductId" varchar,
	"stripeMonthlyPriceId" varchar,
	"stripeAnnualPriceId" varchar,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "services_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" integer NOT NULL,
	"stripe_customer_id" varchar NOT NULL,
	"stripe_subscription_id" varchar NOT NULL,
	"stripe_price_id" varchar,
	"stripe_latest_invoice_id" varchar,
	"stripe_payment_method_id" varchar,
	"status" varchar NOT NULL,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"ended_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"value" jsonb NOT NULL,
	"category" varchar NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"role" varchar DEFAULT 'support' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar,
	CONSTRAINT "team_members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"email" varchar NOT NULL,
	"phone" varchar,
	"title" varchar,
	"department" varchar,
	"facility_id" varchar,
	"address" text,
	"emergency_contact" varchar,
	"emergency_phone" varchar,
	"notes" text,
	"avatar" varchar,
	"timezone" varchar DEFAULT 'America/New_York',
	"language" varchar DEFAULT 'en',
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"facility_id" varchar,
	"permissions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"category" varchar NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"phone" varchar,
	"google_id" varchar,
	"email_verified" boolean DEFAULT false,
	"role" varchar DEFAULT 'member' NOT NULL,
	"stripe_customer_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_elderly_user_id_elderly_users_id_fk" FOREIGN KEY ("elderly_user_id") REFERENCES "public"."elderly_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_usage" ADD CONSTRAINT "client_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elderly_users" ADD CONSTRAINT "elderly_users_caregiver_id_users_id_fk" FOREIGN KEY ("caregiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_elderly_user_id_elderly_users_id_fk" FOREIGN KEY ("elderly_user_id") REFERENCES "public"."elderly_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_memory" ADD CONSTRAINT "patient_memory_elderly_user_id_elderly_users_id_fk" FOREIGN KEY ("elderly_user_id") REFERENCES "public"."elderly_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_memory" ADD CONSTRAINT "patient_memory_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_elderly_user_id_elderly_users_id_fk" FOREIGN KEY ("elderly_user_id") REFERENCES "public"."elderly_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_plan_services" ADD CONSTRAINT "service_plan_services_servicePlanId_serviceplans_id_fk" FOREIGN KEY ("servicePlanId") REFERENCES "public"."serviceplans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_plan_services" ADD CONSTRAINT "service_plan_services_serviceId_services_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_serviceplans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."serviceplans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");