import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Phone,
  Calendar,
  Heart,
  User,
  Mail,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

export default function SuccessStep() {
  const { data, resetFlow, updateData } = useSignup();
  const { toast } = useToast();
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  const isLovedOneFlow = data.userType === "loved-one";
  const firstName =
    data.personalInfo.firstName || (isLovedOneFlow ? "your loved one" : "you");

  useEffect(() => {
    const checkSessionStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");

      if (!sessionId) return; // No session ID? Nothing to do.

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

          // ✅ Clean up the URL to prevent re-processing
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

          // Optional: also clean up URL here if you don't want retries
          // Or leave it if you want user to retry manually
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      } catch (error) {
        console.error("Error checking session status:", error);
        // Optionally show error toast
      }
    };

    checkSessionStatus();
  }, [updateData, toast]); // 👈 still okay if these are stable (e.g., from context/hooks)

  // Clear the signup data from localStorage on success
  useEffect(() => {
    // Wait a moment before clearing to ensure the page has loaded
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("eldervoice_signup_data");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getCallScheduleSummary = () => {
    const dayCount = data.callPreferences.days?.length || 0;
    const timeOfDay = data.callPreferences.timeOfDay || "afternoon";

    if (dayCount === 1) return `1 call per week in the ${timeOfDay}`;
    if (dayCount === 7) return `Daily calls in the ${timeOfDay}`;
    return `${dayCount} calls per week in the ${timeOfDay}`;
  };

  const nextSteps = isLovedOneFlow
    ? [
        {
          icon: <Phone className="h-5 w-5 text-blue-600" />,
          title: "First Call Within 24 Hours",
          description: `${firstName} will receive their first companion call within 24 hours to introduce the service and confirm preferences.`,
        },
        {
          icon: <MessageCircle className="h-5 w-5 text-green-600" />,
          title: "Consent Verification",
          description: `During the first call, we'll ensure ${firstName} is comfortable with the service and wants to continue receiving calls.`,
        },
        {
          icon: <Mail className="h-5 w-5 text-purple-600" />,
          title: "Family Updates",
          description:
            "You'll receive weekly email summaries about the calls, including conversation highlights and any concerns.",
        },
        {
          icon: <Calendar className="h-5 w-5 text-orange-600" />,
          title: "Adjust Schedule Anytime",
          description:
            "Use your account dashboard to modify call times, frequency, or conversation topics as needed.",
        },
      ]
    : [
        {
          icon: <Phone className="h-5 w-5 text-blue-600" />,
          title: "First Call Within 24 Hours",
          description:
            "You'll receive your first companion call within 24 hours to introduce the service and confirm your preferences.",
        },
        {
          icon: <MessageCircle className="h-5 w-5 text-green-600" />,
          title: "Personalized Conversations",
          description:
            "Each call will be tailored to your interests and preferences, creating meaningful and engaging conversations.",
        },
        {
          icon: <Mail className="h-5 w-5 text-purple-600" />,
          title: "Your Account Dashboard",
          description:
            "Access your account anytime to view call history, update preferences, or adjust your schedule.",
        },
        {
          icon: <Calendar className="h-5 w-5 text-orange-600" />,
          title: "Adjust Anytime",
          description:
            "Change your call schedule, conversation topics, or service preferences whenever you need to.",
        },
      ];

  const supportInfo = {
    phone: "(555) 123-4567",
    email: "hello@eldervoice.com",
    hours: "24/7 support available",
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ElderVoice! 🎉
        </h1>
        <p className="text-xl text-gray-600">
          {isLovedOneFlow
            ? `Your 7-day free trial has started for ${firstName}`
            : "Your 7-day free trial has started"}
        </p>
      </div>

      {/* Trial Info */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              {isLovedOneFlow ? (
                <Heart className="h-6 w-6 text-rose-600" />
              ) : (
                <User className="h-6 w-6 text-blue-600" />
              )}
              <h3 className="text-xl font-semibold text-gray-900">
                {isLovedOneFlow ? "Their Call Schedule" : "Your Call Schedule"}
              </h3>
            </div>
            <div className="text-lg text-gray-700 mb-2">
              <strong>{getCallScheduleSummary()}</strong>
            </div>
            <div className="text-sm text-gray-600">
              <strong>Free for 7 days</strong> • Then $19.95/month • Cancel
              anytime
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            What Happens Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trial Period Notice */}
      {isLovedOneFlow && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Heart className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-2">
                  Important: Consent Verification
                </h4>
                <p className="text-yellow-800 text-sm leading-relaxed">
                  During the first call, we'll verify that {firstName} wants to
                  receive these calls and is comfortable with the service. If
                  they prefer not to continue, we'll immediately cancel the
                  service at no charge. This ensures their comfort and consent
                  throughout the process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <Phone className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">Call Us</div>
              <div className="text-sm text-gray-600">{supportInfo.phone}</div>
            </div>
            <div>
              <Mail className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <div className="font-medium text-gray-900">Email Us</div>
              <div className="text-sm text-gray-600">{supportInfo.email}</div>
            </div>
            <div>
              <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <div className="font-medium text-gray-900">Availability</div>
              <div className="text-sm text-gray-600">{supportInfo.hours}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/admin" className="flex-1 sm:flex-initial">
          <Button size="lg" className="w-full sm:w-auto">
            Go to Your Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/contact" className="flex-1 sm:flex-initial">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Contact Support
          </Button>
        </Link>
      </div>

      {/* Footer Message */}
      <div className="text-center mt-8 p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-700 mb-2">Thank you for choosing ElderVoice!</p>
        <p className="text-sm text-gray-600">
          We're committed to providing meaningful companionship and support.
          {isLovedOneFlow
            ? ` ${firstName} is in good hands.`
            : " You're in good hands."}
        </p>
      </div>
    </div>
  );
}
