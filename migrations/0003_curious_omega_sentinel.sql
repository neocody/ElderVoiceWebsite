ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_plan_id_serviceplans_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_serviceplans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."serviceplans"("id") ON DELETE cascade ON UPDATE no action;