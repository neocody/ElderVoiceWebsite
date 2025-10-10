import type { Coupon } from "@shared/schema";
import { storage } from "../storage";

export type CouponValidationResult =
  | {
      valid: true;
      normalizedCode: string;
      coupon: Coupon;
    }
  | {
      valid: false;
      normalizedCode: string;
      reason: string;
    };

/**
 * Normalizes a coupon code string by trimming whitespace and upper-casing
 */
function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Validates whether a coupon can be redeemed in checkout.
 * Performs basic checks against the local database representation.
 */
export async function validateCouponCode(
  rawCode: string,
): Promise<CouponValidationResult> {
  const normalizedCode = normalizeCouponCode(rawCode);

  if (!normalizedCode) {
    return {
      valid: false,
      normalizedCode,
      reason: "Coupon code is required",
    };
  }

  const coupon = await storage.getCouponByCode(normalizedCode);

  if (!coupon) {
    return {
      valid: false,
      normalizedCode,
      reason: "Coupon code not found",
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      normalizedCode,
      reason: "This coupon is no longer active",
    };
  }

  if (coupon.redeemBy) {
    const redeemByDate =
      coupon.redeemBy instanceof Date
        ? coupon.redeemBy
        : new Date(coupon.redeemBy);
    if (!Number.isNaN(redeemByDate.getTime()) && redeemByDate.getTime() < Date.now()) {
      return {
        valid: false,
        normalizedCode,
        reason: "This coupon has expired",
      };
    }
  }

  if (
    coupon.maxRedemptions != null &&
    coupon.timesRedeemed != null &&
    coupon.timesRedeemed >= coupon.maxRedemptions
  ) {
    return {
      valid: false,
      normalizedCode,
      reason: "This coupon has reached its redemption limit",
    };
  }

  return {
    valid: true,
    normalizedCode,
    coupon,
  };
}
