import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSignup } from "@/contexts/SignupContext";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, CreditCard, Shield, Calendar, Phone } from "lucide-react";
import type { StripeConstructor } from "@stripe/stripe-js";

declare global {
  interface Window {
    Stripe?: StripeConstructor;
  }
}

type ValidatedCoupon = {
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

type CouponValidationResponse =
  | {
      valid: true;
      coupon: ValidatedCoupon;
    }
  | {
      valid: false;
      message?: string;
    };

function formatCouponSavings(coupon: ValidatedCoupon): string {
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

function formatCouponExpiration(coupon: ValidatedCoupon): string | null {
  if (!coupon.redeemBy) return null;
  const date = new Date(coupon.redeemBy);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseCouponError(error: unknown): string {
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

export default function CheckoutStep() {
  const { data, nextStep, prevStep } = useSignup();
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(
    null
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Add ref to track if component is still mounted
  const isMountedRef = useRef(true);
  const checkoutInstanceRef = useRef<any>(null);
  const checkoutInitIdRef = useRef(0);

  const isLovedOneFlow = data.userType === "loved-one";
  const firstName =
    data.personalInfo.firstName || (isLovedOneFlow ? "your loved one" : "you");

  const planDetails = {
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize Embedded Checkout
  useEffect(() => {
    const currentInitId = ++checkoutInitIdRef.current;
    setError(null);
    setIsLoading(true);
    let timeoutId: NodeJS.Timeout;

    const initializeCheckout = async () => {
      try {
        console.log("Starting checkout initialization...");

        // Check if component is still mounted
        if (
          !isMountedRef.current ||
          currentInitId !== checkoutInitIdRef.current
        ) {
          console.log("Component unmounted, aborting initialization");
          return;
        }

        if (!window.Stripe) {
          throw new Error("Stripe.js failed to load");
        }

        const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        console.log("Stripe public key exists:", !!stripePublicKey);

        if (!stripePublicKey) {
          throw new Error("Stripe public key not found");
        }

        const stripe = window.Stripe(stripePublicKey);
        if (!stripe) {
          throw new Error("Failed to initialize Stripe");
        }

        console.log("Stripe initialized, creating checkout session...");

        const fetchClientSecret = async () => {
          console.log("Fetching client secret...");

          const payload = appliedCoupon
            ? { couponCode: appliedCoupon.code }
            : undefined;

          if (payload) {
            console.log(
              "Applying coupon to checkout session:",
              appliedCoupon?.code
            );
          }

          const response = await apiRequest(
            "POST",
            "/api/billing/create-signup-checkout-session",
            payload
          );

          const result = await response.json();
          console.log("API Response:", result);

          if (!result.clientSecret) {
            throw new Error("No client secret received from server");
          }

          console.log("Client secret received successfully");
          return result.clientSecret;
        };

        console.log("Initializing embedded checkout...");
        const checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret,
        });

        // Store checkout instance
        checkoutInstanceRef.current = checkout;

        console.log(
          "Checkout initialized, checking if component is still mounted..."
        );

        // Double-check component is mounted and ref is available before mounting
        if (
          !isMountedRef.current ||
          currentInitId !== checkoutInitIdRef.current
        ) {
          console.log(
            "Component unmounted during initialization, destroying checkout"
          );
          checkout.destroy();
          return;
        }

        if (!checkoutRef.current) {
          console.log("Checkout ref not available, retrying in 100ms...");
          timeoutId = setTimeout(() => {
            if (
              isMountedRef.current &&
              currentInitId === checkoutInitIdRef.current &&
              checkoutRef.current &&
              checkout
            ) {
              console.log("Retry: mounting checkout to DOM...");
              try {
                checkout.mount(checkoutRef.current); // returns void
                if (isMountedRef.current) {
                  console.log("Checkout mounted successfully (retry)");
                  setIsLoading(false);
                }
              } catch (err: any) {
                console.error("Error mounting checkout (retry):", err);
                if (isMountedRef.current) {
                  setError(err.message || "Failed to load payment form");
                  setIsLoading(false);
                }
              }
            } else {
              console.log("Ref still not available after retry");
              if (isMountedRef.current) {
                setError("Failed to initialize payment form");
                setIsLoading(false);
              }
            }
          }, 100);
          return;
        }

        console.log("Mounting checkout to DOM...");

        if (currentInitId !== checkoutInitIdRef.current) {
          console.log("Newer checkout initialization detected, aborting mount");
          checkout.destroy();
          return;
        }

        await checkout.mount(checkoutRef.current);

        if (
          isMountedRef.current &&
          currentInitId === checkoutInitIdRef.current
        ) {
          console.log("Checkout mounted successfully");
          setIsLoading(false);
        } else {
          console.log(
            "Component unmounted after mounting, destroying checkout"
          );
          checkout.destroy();
        }
      } catch (err: any) {
        console.error("Embedded Checkout init error:", err);
        if (isMountedRef.current) {
          setError(err.message || "Failed to load payment form");
          setIsLoading(false);
        }
      }
    };

    const waitForStripeAndInit = () => {
      if (window.Stripe) {
        console.log("Stripe is available, initializing...");
        initializeCheckout();
      } else {
        console.log("Waiting for Stripe to load...");
        const checkStripe = setInterval(() => {
          if (window.Stripe) {
            console.log("Stripe loaded, clearing interval and initializing...");
            clearInterval(checkStripe);
            if (isMountedRef.current) {
              initializeCheckout();
            }
          }
        }, 100);

        // Cleanup function for the interval
        return () => {
          console.log("Cleaning up Stripe check interval");
          clearInterval(checkStripe);
        };
      }
    };

    const cleanupInterval = waitForStripeAndInit();

    return () => {
      console.log("Cleanup: Component unmounting");

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (checkoutInstanceRef.current) {
        console.log("Destroying checkout instance");
        checkoutInstanceRef.current.destroy();
        checkoutInstanceRef.current = null;
      }

      if (cleanupInterval) {
        cleanupInterval();
      }
    };
  }, [data, appliedCoupon?.code]); // Reinitialize when signup data or coupon changes

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

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <div className="space-y-2">
          <Button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              window.location.reload();
            }}
          >
            Refresh Page
          </Button>
          <Button variant="outline" onClick={prevStep} className="ml-2">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-12 items-start">
        {/* Left Column - Plan Details */}
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-6">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Complete Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}
                Subscription
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Start your free trial and begin companion calls for{" "}
              <span className="font-semibold text-gray-800">{firstName}</span>
            </p>
          </div>

          {/* Plan Summary Card */}
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <Phone className="h-6 w-6" />
                {planDetails.name}
              </CardTitle>
            </div>
            <CardContent className="p-6 space-y-6">
              {/* Call Schedule */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-lg">
                    {isLovedOneFlow
                      ? "Their call schedule"
                      : "Your call schedule"}
                  </span>
                </div>
                <div className="text-gray-700 text-base leading-relaxed ml-13">
                  {getCallScheduleSummary()}
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planDetails.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-800 text-sm font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-2">
                    Bank-Level Security
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Your payment information is encrypted and secure. We use
                    Stripe — trusted by millions of businesses worldwide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 pt-2">
            <Button
              variant="outline"
              onClick={prevStep}
              className="px-8 py-3 text-base font-semibold border-2 hover:bg-gray-50 transition-all duration-200"
            >
              ← Previous
            </Button>
          </div>
        </div>

        {/* Right Column - Payment Form */}
        <div className="lg:sticky lg:top-8">
          <Card className="bg-white shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Secure Checkout</h2>
              <p className="text-slate-300 text-sm">
                Complete your subscription
              </p>
            </div>

            <CardContent className="p-0">
              <div className="space-y-0">
                <div className="p-6 space-y-4 border-b border-slate-200/80">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Have a coupon code?
                    </h3>
                    <p className="text-sm text-slate-500">
                      Apply a promotional code before completing your
                      subscription.
                    </p>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                          Coupon {appliedCoupon.code} applied
                        </div>
                        <div className="text-sm text-emerald-600">
                          {appliedCouponSavings}
                          {appliedCouponExpiration
                            ? ` · Expires ${appliedCouponExpiration}`
                            : ""}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRemoveCoupon}
                        disabled={isApplyingCoupon}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <form
                      className="flex flex-col gap-3 sm:flex-row"
                      onSubmit={handleApplyCoupon}
                    >
                      <Input
                        value={couponCodeInput}
                        onChange={(event) => {
                          setCouponCodeInput(event.target.value.toUpperCase());
                          if (couponError) {
                            setCouponError(null);
                          }
                        }}
                        placeholder="Enter coupon code"
                        className="uppercase"
                        disabled={isApplyingCoupon}
                        autoComplete="off"
                        aria-label="Coupon code"
                      />
                      <Button
                        type="submit"
                        disabled={isApplyingCoupon}
                        className="sm:w-32"
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </Button>
                    </form>
                  )}

                  {couponError && (
                    <p className="text-sm text-red-600">{couponError}</p>
                  )}
                </div>

                <div className="relative">
                  <div
                    ref={checkoutRef}
                    style={{
                      width: "100%",
                      minHeight: "450px",
                      backgroundColor: "white",
                    }}
                    className="rounded-b-lg"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-white rounded-b-lg flex items-center justify-center">
                      <div className="text-center py-16">
                        <div className="relative mb-6">
                          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Setting up secure checkout...
                        </h3>
                        <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                          We're preparing your encrypted payment form. This will
                          only take a moment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
