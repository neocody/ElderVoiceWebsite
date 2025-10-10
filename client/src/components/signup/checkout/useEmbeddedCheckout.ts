import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { ValidatedCoupon } from "./types";

type UseEmbeddedCheckoutParams = {
  checkoutRef: React.RefObject<HTMLDivElement>;
  appliedCoupon: ValidatedCoupon | null;
  setError: (value: string | null) => void;
  setIsLoading: (value: boolean) => void;
  reinitializeKey?: unknown;
};

export function useEmbeddedCheckout({
  checkoutRef,
  appliedCoupon,
  setError,
  setIsLoading,
  reinitializeKey,
}: UseEmbeddedCheckoutParams) {
  const isMountedRef = useRef(true);
  const checkoutInstanceRef = useRef<any>(null);
  const checkoutInitIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const currentInitId = ++checkoutInitIdRef.current;
    setError(null);
    setIsLoading(true);
    let timeoutId: NodeJS.Timeout | undefined;

    const initializeCheckout = async () => {
      try {
        console.log("Starting checkout initialization...");

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
              appliedCoupon?.code,
            );
          }

          const response = await apiRequest(
            "POST",
            "/api/billing/create-signup-checkout-session",
            payload,
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

        checkoutInstanceRef.current = checkout;

        console.log(
          "Checkout initialized, checking if component is still mounted...",
        );

        if (
          !isMountedRef.current ||
          currentInitId !== checkoutInitIdRef.current
        ) {
          console.log(
            "Component unmounted during initialization, destroying checkout",
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
                checkout.mount(checkoutRef.current);
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
            "Component unmounted after mounting, destroying checkout",
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
        return undefined;
      }

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

      return () => {
        console.log("Cleaning up Stripe check interval");
        clearInterval(checkStripe);
      };
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
  }, [appliedCoupon?.code, reinitializeKey, checkoutRef, setError, setIsLoading]);
}
