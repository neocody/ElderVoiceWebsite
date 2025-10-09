import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated, requireRole } from "../middleware/auth";
import { stripeSync } from "../services/stripeSync";
import { validateCouponCode } from "../services/couponValidation";
import type { InsertCoupon } from "@shared/schema";

const metadataSchema = z.record(z.string(), z.string()).optional();

const couponCreateSchema = z
  .object({
    code: z.string().trim().min(3).max(64),
    name: z.string().trim().min(1).max(255).optional(),
    couponType: z.enum(["percent", "amount"]),
    percentOff: z.number().min(1).max(100).optional(),
    amountOff: z.number().min(0.01).optional(),
    currency: z.string().trim().length(3).optional(),
    duration: z.enum(["forever", "once", "repeating"]),
    durationInMonths: z.number().int().min(1).max(36).optional(),
    maxRedemptions: z.number().int().min(1).optional(),
    redeemBy: z.string().datetime().optional(),
    metadata: metadataSchema,
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.couponType === "percent" && data.percentOff === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "percentOff is required when couponType is percent",
        path: ["percentOff"],
      });
    }

    if (data.couponType === "amount") {
      if (data.amountOff === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "amountOff is required when couponType is amount",
          path: ["amountOff"],
        });
      }
      if (!data.currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "currency is required when couponType is amount",
          path: ["currency"],
        });
      }
    }

    if (data.duration === "repeating" && data.durationInMonths === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "durationInMonths is required when duration is repeating",
        path: ["durationInMonths"],
      });
    }
  });

const couponUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    metadata: metadataSchema,
    isActive: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided",
  });

const couponValidateRequestSchema = z.object({
  code: z.string().trim().min(3).max(64),
});

function parseRedeemBy(redeemBy?: string | null): Date | undefined {
  if (!redeemBy) return undefined;
  const date = new Date(redeemBy);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid redeemBy date");
  }
  return date;
}

export function registerCouponRoutes(app: Express) {
  app.post("/api/coupons/validate", isAuthenticated, async (req, res) => {
    try {
      const parsed = couponValidateRequestSchema.safeParse(req.body ?? {});

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid coupon validation payload",
          errors: parsed.error.flatten(),
        });
      }

      const result = await validateCouponCode(parsed.data.code);
      if (!result.valid) {
        return res.status(400).json({
          valid: false,
          message: result.reason,
        });
      }

      const { coupon } = result;
      const redeemBy =
        coupon.redeemBy instanceof Date
          ? coupon.redeemBy.toISOString()
          : coupon.redeemBy
            ? new Date(coupon.redeemBy).toISOString()
            : null;

      res.json({
        valid: true,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          couponType: coupon.couponType,
          percentOff: coupon.percentOff,
          amountOff: coupon.amountOff,
          currency: coupon.currency,
          duration: coupon.duration,
          durationInMonths: coupon.durationInMonths,
          maxRedemptions: coupon.maxRedemptions,
          redeemBy,
        },
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Failed to validate coupon" });
    }
  });

  app.get(
    "/api/coupons",
    isAuthenticated,
    requireRole(["administrator"]),
    async (_req, res) => {
      try {
        const coupons = await storage.getCoupons();
        const synchronized = await Promise.all(
          coupons.map(async (coupon) => {
            try {
              const stripeCoupon = await stripeSync.retrieveCoupon(
                coupon.stripeCouponId,
              );
              const promotion = coupon.stripePromotionCodeId
                ? await stripeSync.retrievePromotionCode(
                    coupon.stripePromotionCodeId,
                  )
                : null;

              const updates: Partial<InsertCoupon> & {
                timesRedeemed?: number;
              } = {};

              if (
                stripeCoupon &&
                stripeCoupon.times_redeemed !== undefined &&
                stripeCoupon.times_redeemed !== coupon.timesRedeemed
              ) {
                updates.timesRedeemed = stripeCoupon.times_redeemed;
              }

              if (promotion && promotion.active !== coupon.isActive) {
                updates.isActive = promotion.active;
              }

              if (Object.keys(updates).length > 0) {
                return await storage.updateCoupon(coupon.id, updates);
              }

              return coupon;
            } catch (syncError) {
              console.warn(
                `Failed to synchronize coupon ${coupon.code}:`,
                syncError,
              );
              return coupon;
            }
          }),
        );

        res.json(synchronized);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    },
  );

  app.get(
    "/api/coupons/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const id = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
          return res.status(400).json({ message: "Invalid coupon id" });
        }

        const coupon = await storage.getCoupon(id);
        if (!coupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        res.json(coupon);
      } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).json({ message: "Failed to fetch coupon" });
      }
    },
  );

  app.post(
    "/api/coupons",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const parsed = couponCreateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message: "Invalid coupon payload",
            errors: parsed.error.flatten(),
          });
        }

        const data = parsed.data;
        const normalizedCode = data.code.trim().toUpperCase();

        const existing = await storage.getCouponByCode(normalizedCode);
        if (existing) {
          return res.status(409).json({
            message: `Coupon code ${normalizedCode} already exists`,
          });
        }

        const redeemByDate = parseRedeemBy(data.redeemBy);
        const metadata = data.metadata ?? undefined;
        const maxRedemptions = data.maxRedemptions ?? undefined;
        const amountOffCents =
          data.couponType === "amount"
            ? Math.round((data.amountOff ?? 0) * 100)
            : null;
        const percentOffValue =
          data.couponType === "percent" ? (data.percentOff ?? null) : null;
        const currencyValue =
          data.couponType === "amount"
            ? (data.currency ?? "USD").toLowerCase()
            : null;

        const { coupon: stripeCoupon, promotionCode } =
          await stripeSync.createCouponAndPromotionCode({
            code: normalizedCode,
            name: data.name,
            couponType: data.couponType,
            percentOff: percentOffValue ?? undefined,
            amountOff: amountOffCents ?? undefined,
            currency: currencyValue ?? undefined,
            duration: data.duration,
            durationInMonths:
              data.duration === "repeating"
                ? (data.durationInMonths ?? undefined)
                : undefined,
            maxRedemptions,
            redeemBy: redeemByDate ?? undefined,
            metadata: metadata ?? undefined,
            active: data.isActive ?? true,
          });

        const couponRecord = await storage.createCoupon({
          stripeCouponId: stripeCoupon.id,
          stripePromotionCodeId: promotionCode.id,
          code: normalizedCode,
          name: data.name ?? null,
          couponType: data.couponType,
          percentOff: percentOffValue,
          amountOff: amountOffCents,
          currency: currencyValue,
          duration: data.duration,
          durationInMonths:
            data.duration === "repeating"
              ? (data.durationInMonths ?? null)
              : null,
          maxRedemptions: data.maxRedemptions ?? null,
          redeemBy: redeemByDate ?? null,
          isActive: promotionCode.active,
          metadata: metadata ?? null,
        });

        res.status(201).json(couponRecord);
      } catch (error: any) {
        console.error("Error creating coupon:", error);
        const status = error?.statusCode ?? 500;
        res
          .status(status)
          .json({ message: error?.message || "Failed to create coupon" });
      }
    },
  );

  app.put(
    "/api/coupons/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const id = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
          return res.status(400).json({ message: "Invalid coupon id" });
        }

        const existing = await storage.getCoupon(id);
        if (!existing) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        const parsed = couponUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message: "Invalid coupon update payload",
            errors: parsed.error.flatten(),
          });
        }

        const updates = parsed.data;
        const metadata = updates.metadata ?? undefined;

        const couponStripeUpdates: {
          name?: string | null;
          metadata?: Record<string, string> | null;
        } = {};

        if (updates.name !== undefined) {
          couponStripeUpdates.name = updates.name ?? null;
        }

        if (metadata !== undefined) {
          couponStripeUpdates.metadata = metadata ?? null;
        }

        if (Object.keys(couponStripeUpdates).length > 0) {
          await stripeSync.updateCoupon(
            existing.stripeCouponId,
            couponStripeUpdates,
          );
        }

        let promotionCodeActive = existing.isActive;
        if (existing.stripePromotionCodeId) {
          if (updates.isActive !== undefined || metadata !== undefined) {
            const promotion = await stripeSync.updatePromotionCode(
              existing.stripePromotionCodeId,
              {
                active: updates.isActive,
                metadata: metadata ?? null,
              },
            );
            promotionCodeActive = promotion.active;
          } else {
            const promotion = await stripeSync.retrievePromotionCode(
              existing.stripePromotionCodeId,
            );
            if (promotion) {
              promotionCodeActive = promotion.active;
            }
          }
        }

        const stripeCoupon = await stripeSync.retrieveCoupon(
          existing.stripeCouponId,
        );

        const dbUpdates: Partial<InsertCoupon> & { timesRedeemed?: number } =
          {};

        if (updates.name !== undefined) {
          dbUpdates.name = updates.name ?? null;
        }

        if (metadata !== undefined) {
          dbUpdates.metadata = metadata ?? null;
        }

        dbUpdates.isActive = promotionCodeActive;

        if (stripeCoupon) {
          dbUpdates.timesRedeemed = stripeCoupon.times_redeemed ?? 0;
        }

        const updatedCoupon = await storage.updateCoupon(id, dbUpdates);
        res.json(updatedCoupon);
      } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    },
  );

  app.delete(
    "/api/coupons/:id",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const id = Number.parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
          return res.status(400).json({ message: "Invalid coupon id" });
        }

        const existing = await storage.getCoupon(id);
        if (!existing) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        if (existing.stripePromotionCodeId) {
          await stripeSync.deactivatePromotionCode(
            existing.stripePromotionCodeId,
          );
        }

        await stripeSync.deleteCoupon(existing.stripeCouponId);
        await storage.deleteCoupon(id);

        res.json({ message: "Coupon deleted successfully" });
      } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ message: "Failed to delete coupon" });
      }
    },
  );
}
