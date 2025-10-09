import { useRef, useState, type FormEvent } from "react";
import { useSignup } from "@/contexts/SignupContext";
import { apiRequest } from "@/lib/queryClient";
import type { StripeConstructor } from "@stripe/stripe-js";
import { CheckoutErrorState } from "./errorState";
import { PlanSummary, type PlanDetails } from "./planSummary";
import { SecureCheckoutCard } from "./secureCheckoutCard";
import { useEmbeddedCheckout } from "./useEmbeddedCheckout";
import type { CouponValidationResponse, ValidatedCoupon } from "./types";
import {
  formatCouponExpiration,
  formatCouponSavings,
  parseCouponError,
} from "./couponUtils";

declare global {
  interface Window {
    Stripe?: StripeConstructor;
  }
}

export default function CheckoutStep() {
  const { data, prevStep } = useSignup();
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(
    null
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const isLovedOneFlow = data.userType === "loved-one";
  const firstName =
    data.personalInfo.firstName || (isLovedOneFlow ? "your loved one" : "you");

  const planDetails: PlanDetails = {
    name: "ElderVoice Companion",
    trialDays: 7,
    monthlyPrice: 19.95,
    features: [
      "AI calls as scheduled",
      "Personalized conversations",
      "Family progress updates",
      "Medication reminders",
      "Emergency contact alerts",
      "24/7 customer support",
    ],
  };

  useEmbeddedCheckout({
    checkoutRef,
    appliedCoupon,
    setError,
    setIsLoading,
    reinitializeKey: data.userId,
  });

  const handleApplyCoupon = async (
    event?: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event?.preventDefault();
    if (isApplyingCoupon) return;

    const normalizedCode = couponCodeInput.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError("Enter a coupon code to apply.");
      return;
    }

    if (appliedCoupon && appliedCoupon.code === normalizedCode) {
      setCouponError("This coupon is already applied.");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      setCouponError(null);

      const response = await apiRequest("POST", "/api/coupons/validate", {
        code: normalizedCode,
      });
      const result = (await response.json()) as CouponValidationResponse;

      if (!result.valid) {
        setCouponError(
          result.message ?? "Unable to apply coupon. Please try again."
        );
        return;
      }

      setAppliedCoupon(result.coupon);
      setCouponCodeInput(result.coupon.code);
      setError(null);
      setIsLoading(true);
      console.log("Coupon applied successfully:", result.coupon.code);
    } catch (err) {
      console.error("Failed to apply coupon:", err);
      setCouponError(parseCouponError(err));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (!appliedCoupon) return;
    console.log("Removing coupon:", appliedCoupon.code);
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError(null);
    setError(null);
    setIsLoading(true);
  };

  const getCallScheduleSummary = () => {
    const dayCount = data.callPreferences.days?.length || 0;
    const timeOfDay = data.callPreferences.timeOfDay || "afternoon";
    if (dayCount === 1) return `1 call per week in the ${timeOfDay}`;
    if (dayCount === 7) return `Daily calls in the ${timeOfDay}`;
    return `${dayCount} calls per week in the ${timeOfDay}`;
  };

  const appliedCouponSavings = appliedCoupon
    ? formatCouponSavings(appliedCoupon)
    : null;
  const appliedCouponExpiration = appliedCoupon
    ? formatCouponExpiration(appliedCoupon)
    : null;
  const handleCouponInputChange = (value: string) => {
    setCouponCodeInput(value);
    if (couponError) {
      setCouponError(null);
    }
  };
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    window.location.reload();
  };

  if (error) {
    return (
      <CheckoutErrorState
        message={error}
        onRetry={handleRetry}
        onGoBack={prevStep}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-12 items-start">
        <PlanSummary
          isLovedOneFlow={isLovedOneFlow}
          firstName={firstName}
          planDetails={planDetails}
          callScheduleSummary={getCallScheduleSummary()}
          onPrev={prevStep}
        />

        <SecureCheckoutCard
          checkoutRef={checkoutRef}
          isLoading={isLoading}
          appliedCoupon={appliedCoupon}
          couponCodeInput={couponCodeInput}
          couponError={couponError}
          isApplyingCoupon={isApplyingCoupon}
          onCouponInputChange={handleCouponInputChange}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
          appliedCouponSavings={appliedCouponSavings}
          appliedCouponExpiration={appliedCouponExpiration}
        />
      </div>
    </div>
  );
}
