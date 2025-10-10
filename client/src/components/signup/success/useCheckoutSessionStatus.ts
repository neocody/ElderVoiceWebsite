import { useEffect, useState } from "react";

type ToastFn = (options: {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | null;
}) => void;

type UseCheckoutSessionStatusParams = {
  updateData: (updates: Record<string, unknown>) => void;
  toast: ToastFn;
};

export function useCheckoutSessionStatus({
  updateData,
  toast,
}: UseCheckoutSessionStatusParams) {
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionStatus = async () => {
      if (typeof window === "undefined") {
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");

      if (!sessionId) return;

      try {
        const response = await fetch(
          `/api/billing/session-status?session_id=${sessionId}`,
        );
        const session = await response.json();

        if (session.status === "complete") {
          setSessionStatus("complete");
          setCustomerEmail(session.customer_email);

          updateData({
            subscriptionId: session.subscription_id,
            customerId: session.customer_email,
          });

          toast({
            title: "Payment Successful!",
            description:
              "Your subscription has been activated and your free trial has begun.",
          });

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        } else if (session.status === "open") {
          toast({
            title: "Payment Incomplete",
            description:
              "Please complete your payment to activate your subscription.",
            variant: "destructive",
          });

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      } catch (error) {
        console.error("Error checking session status:", error);
      }
    };

    checkSessionStatus();
  }, [updateData, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("eldervoice_signup_data");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { sessionStatus, customerEmail };
}
