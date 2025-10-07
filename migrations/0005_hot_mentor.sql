CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_coupon_id" varchar NOT NULL,
	"stripe_promotion_code_id" varchar,
	"code" varchar NOT NULL,
	"name" varchar,
	"coupon_type" varchar NOT NULL,
	"percent_off" integer,
	"amount_off" integer,
	"currency" varchar,
	"duration" varchar NOT NULL,
	"duration_in_months" integer,
	"max_redemptions" integer,
	"redeem_by" timestamp,
	"times_redeemed" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_stripe_coupon_id_unique" UNIQUE("stripe_coupon_id"),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "coupon_id" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_promotion_code_id" varchar;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "coupon_applied_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;