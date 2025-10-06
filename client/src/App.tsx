import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import Landing from "@/pages/Landing";
import Features from "@/pages/Features";
import Individuals from "@/pages/Individuals";
import Facilities from "@/pages/Facilities";
import Vision from "@/pages/Vision";
import Careers from "@/pages/Careers";
import FAQs from "@/pages/FAQs";
import Contact from "@/pages/Contact";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Services from "@/pages/Services";
import Team from "@/pages/Team";
import BillingAdmin from "@/pages/BillingAdmin";
import CallLogs from "@/pages/CallLogs";
import Schedules from "@/pages/Schedules";
import Notifications from "@/pages/Notifications";
import Billing from "@/pages/Billing";
import Settings from "@/pages/Settings";
import LiveStatus from "@/pages/LiveStatus";
import SystemSettings from "@/pages/SystemSettings";
import AdminNotifications from "@/pages/AdminNotifications";
import SystemMonitoring from "@/pages/SystemMonitoring";
import EmailTemplates from "@/pages/EmailTemplates";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import PatientOnboarding from "@/pages/PatientOnboarding";

import SignIn from "@/pages/SignIn";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import EmailVerification from "@/pages/EmailVerification";

import Pricing from "@/pages/Pricing";
import GetStarted from "@/pages/GetStarted";
import FacilityDemo from "@/pages/FacilityDemo";

import NotFound from "@/pages/not-found";

function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [userSubscribed, setUserSubscribed] = useState(false);

  const isSubscribed = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await fetch("/api/auth/has-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to check subscription status");
      }
      const data = await response.json();
      return data; // { isUserSubscribed: boolean }
    },
    onSuccess: (data) => {
      setUserSubscribed(data.isUserSubscribed);
      setSubscriptionChecked(true);
    },
    onError: (error) => {
      console.error("Subscription check failed:", error.message);
      setSubscriptionChecked(true);
      setUserSubscribed(false);
    },
  });

  // Check subscription when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && !subscriptionChecked) {
      isSubscribed.mutate({ userId: user.id });
    }
  }, [isAuthenticated, user?.id, subscriptionChecked]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to signin page if not authenticated
    window.location.href = "/auth/signin";
    return null;
  }

  // Show loading while checking subscription
  if (!subscriptionChecked || isSubscribed.isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking subscription...</p>
        </div>
      </div>
    );
  }

  if (!userSubscribed) {
    // Redirect to pricing page if not subscribed
    window.location.href = "/pricing";
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Marketing website routes - always available */}
      <Route path="/" component={Landing} />
      <Route path="/features" component={Features} />
      <Route path="/individuals" component={Individuals} />
      <Route path="/facilities" component={Facilities} />
      <Route path="/vision" component={Vision} />
      <Route path="/careers" component={Careers} />
      <Route path="/faqs" component={FAQs} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />

      {/* New Signup Flow */}
      <Route path="/getstarted" component={GetStarted} />
      <Route path="/getstarted/facility-demo" component={FacilityDemo} />

      {/* Auth */}
      <Route path="/auth/signin" component={SignIn} />
      <Route path="/auth/signup" component={Signup} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/auth/verify-email" component={EmailVerification} />

      {/* Pricing (auth required) */}
      <Route path="/pricing" component={Pricing} />

      {/* Admin panel routes - protected */}
      <Route
        path="/onboarding"
        component={() => <AdminRoute component={PatientOnboarding} />}
      />
      <Route
        path="/admin"
        component={() => <AdminRoute component={Dashboard} />}
      />
      <Route
        path="/admin/dashboard"
        component={() => <AdminRoute component={Dashboard} />}
      />
      <Route
        path="/admin/clients"
        component={() => <AdminRoute component={Clients} />}
      />
      <Route
        path="/admin/services"
        component={() => <AdminRoute component={Services} />}
      />
      <Route
        path="/admin/team"
        component={() => <AdminRoute component={Team} />}
      />
      <Route
        path="/admin/schedules"
        component={() => <AdminRoute component={Schedules} />}
      />
      <Route
        path="/admin/call-logs"
        component={() => <AdminRoute component={CallLogs} />}
      />
      <Route
        path="/admin/live-status"
        component={() => <AdminRoute component={LiveStatus} />}
      />
      <Route
        path="/admin/notifications"
        component={() => <AdminRoute component={Notifications} />}
      />
      <Route
        path="/admin/alert-config"
        component={() => <AdminRoute component={AdminNotifications} />}
      />
      <Route
        path="/admin/billing-admin"
        component={() => <AdminRoute component={BillingAdmin} />}
      />
      <Route
        path="/admin/email-templates"
        component={() => <AdminRoute component={EmailTemplates} />}
      />
      <Route
        path="/admin/settings"
        component={() => <AdminRoute component={Settings} />}
      />
      <Route
        path="/admin/system-settings"
        component={() => <AdminRoute component={SystemSettings} />}
      />
      <Route
        path="/admin/system-monitoring"
        component={() => <AdminRoute component={SystemMonitoring} />}
      />

      <Route
        path="/facility/dashboard"
        component={() => <AdminRoute component={Dashboard} />}
      />
      <Route
        path="/facility/clients"
        component={() => <AdminRoute component={Clients} />}
      />
      <Route
        path="/facility/services"
        component={() => <AdminRoute component={Services} />}
      />
      <Route
        path="/facility/schedules"
        component={() => <AdminRoute component={Schedules} />}
      />
      <Route
        path="/facility/call-logs"
        component={() => <AdminRoute component={CallLogs} />}
      />
      <Route
        path="/facility/live-status"
        component={() => <AdminRoute component={LiveStatus} />}
      />
      <Route
        path="/facility/notifications"
        component={() => <AdminRoute component={Notifications} />}
      />
      <Route
        path="/facility/billing"
        component={() => <AdminRoute component={Billing} />}
      />
      <Route
        path="/facility/settings"
        component={() => <AdminRoute component={Settings} />}
      />

      <Route
        path="/member/dashboard"
        component={() => <AdminRoute component={Dashboard} />}
      />
      <Route
        path="/member/clients"
        component={() => <AdminRoute component={Clients} />}
      />
      <Route
        path="/member/services"
        component={() => <AdminRoute component={Services} />}
      />
      <Route
        path="/member/schedules"
        component={() => <AdminRoute component={Schedules} />}
      />
      <Route
        path="/member/call-logs"
        component={() => <AdminRoute component={CallLogs} />}
      />
      <Route
        path="/member/notifications"
        component={() => <AdminRoute component={Notifications} />}
      />
      <Route
        path="/member/billing"
        component={() => <AdminRoute component={Billing} />}
      />
      <Route
        path="/member/settings"
        component={() => <AdminRoute component={Settings} />}
      />

      {/* Legacy routes for backward compatibility */}
      <Route
        path="/clients"
        component={() => <AdminRoute component={Clients} />}
      />
      <Route
        path="/services"
        component={() => <AdminRoute component={Services} />}
      />
      <Route path="/team" component={() => <AdminRoute component={Team} />} />
      <Route
        path="/call-logs"
        component={() => <AdminRoute component={CallLogs} />}
      />
      <Route
        path="/schedules"
        component={() => <AdminRoute component={Schedules} />}
      />
      <Route
        path="/notifications"
        component={() => <AdminRoute component={Notifications} />}
      />
      <Route
        path="/billing"
        component={() => <AdminRoute component={Billing} />}
      />
      <Route
        path="/billing-admin"
        component={() => <AdminRoute component={BillingAdmin} />}
      />
      <Route
        path="/email-templates"
        component={() => <AdminRoute component={EmailTemplates} />}
      />
      <Route
        path="/settings"
        component={() => <AdminRoute component={Settings} />}
      />
      <Route
        path="/live-status"
        component={() => <AdminRoute component={LiveStatus} />}
      />

      <Route component={NotFound} />
    </Switch>
  );
}

// Declare global types for Tawk.to
declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

function App() {
  // Load Tawk.to live chat widget
  useEffect(() => {
    // Check if Tawk.to is already loaded
    if (window.Tawk_API) {
      return;
    }

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Create and load the Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/68dc2e7e311aad1952563515/1j6e1b7th';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // Insert the script into the document
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
