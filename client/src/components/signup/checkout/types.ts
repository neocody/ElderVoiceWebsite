export type ValidatedCoupon = {
  code: string;
  name: string | null;
  couponType: "percent" | "amount";
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
  duration: string;
  durationInMonths: number | null;
  maxRedemptions: number | null;
  redeemBy: string | null;
};

export type CouponValidationResponse =
  | {
      valid: true;
      coupon: ValidatedCoupon;
    }
  | {
      valid: false;
      message?: string;
    };
