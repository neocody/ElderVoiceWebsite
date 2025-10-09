import type { ValidatedCoupon } from "./types";

export function formatCouponSavings(coupon: ValidatedCoupon): string {
  if (
    coupon.couponType === "percent" &&
    typeof coupon.percentOff === "number"
  ) {
    return `${coupon.percentOff}% off your subscription`;
  }

  if (coupon.couponType === "amount" && typeof coupon.amountOff === "number") {
    const currencyCode = (coupon.currency || "usd").toUpperCase();
    try {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(coupon.amountOff / 100);
      return `${formatted} off your subscription`;
    } catch (error) {
      console.warn("Failed to format coupon amount", error);
      return `${coupon.amountOff / 100} ${currencyCode} off your subscription`;
    }
  }

  return "Discount applied";
}

export function formatCouponExpiration(
  coupon: ValidatedCoupon,
): string | null {
  if (!coupon.redeemBy) return null;
  const date = new Date(coupon.redeemBy);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function parseCouponError(error: unknown): string {
  if (error instanceof Error) {
    const parts = error.message.split(": ");
    if (parts.length > 1) {
      const possibleJson = parts.slice(1).join(": ").trim();
      try {
        const parsed = JSON.parse(possibleJson);
        if (typeof parsed?.message === "string") {
          return parsed.message;
        }
      } catch {
        return possibleJson;
      }
    }
    return error.message;
  }

  return "Failed to apply coupon. Please try again.";
}
