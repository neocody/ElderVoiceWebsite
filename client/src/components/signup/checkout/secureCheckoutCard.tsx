import { type FormEvent, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ValidatedCoupon } from "./types";

type SecureCheckoutCardProps = {
  checkoutRef: RefObject<HTMLDivElement>;
  isLoading: boolean;
  appliedCoupon: ValidatedCoupon | null;
  couponCodeInput: string;
  couponError: string | null;
  isApplyingCoupon: boolean;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: (event: FormEvent<HTMLFormElement>) => void;
  onRemoveCoupon: () => void;
  appliedCouponSavings: string | null;
  appliedCouponExpiration: string | null;
};

export function SecureCheckoutCard({
  checkoutRef,
  isLoading,
  appliedCoupon,
  couponCodeInput,
  couponError,
  isApplyingCoupon,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCouponSavings,
  appliedCouponExpiration,
}: SecureCheckoutCardProps) {
  return (
    <div className="lg:sticky lg:top-8">
      <Card className="bg-white shadow-2xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Secure Checkout</h2>
          <p className="text-slate-300 text-sm">Complete your subscription</p>
        </div>

        <CardContent className="p-0">
          <div className="space-y-0">
            <div className="p-6 space-y-4 border-b border-slate-200/80">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Have a coupon code?
                </h3>
                <p className="text-sm text-slate-500">
                  Apply a promotional code before completing your subscription.
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
                    onClick={onRemoveCoupon}
                    disabled={isApplyingCoupon}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-3 sm:flex-row"
                  onSubmit={onApplyCoupon}
                >
                  <Input
                    value={couponCodeInput}
                    onChange={(event) =>
                      onCouponInputChange(event.target.value.toUpperCase())
                    }
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
  );
}
