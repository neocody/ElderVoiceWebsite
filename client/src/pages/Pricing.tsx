import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Phone,
  Heart,
  Shield,
  ArrowRight,
  Calendar,
  Users,
  Building2,
  ArrowLeft,
  Lock,
  CreditCard,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

interface ServicePlanWithServices {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  annualDiscount: number;
  callsPerMonth: number;
  callDurationMinutes: number;
  isActive: boolean;
  planType: "individual" | "facility";
  createdAt: string;
  updatedAt: string;
  serviceIds: number[];
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeAnnualPriceId: string | null;
}

interface SelectService {
  id: number;
  key: string;
  name: string;
  description: string | null;
}

const Pricing: React.FC = () => {
  /** ----------------- Hooks (must always be called in the same order) ------------------ */
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();

  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [userSubscribed, setUserSubscribed] = useState(false);
  const [servicePlans, setServicePlans] = useState<ServicePlanWithServices[]>(
    [],
  );
  const [services, setServices] = useState<SelectService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);
  const [planType, setPlanType] = useState<"individual" | "facility" | null>(
    null,
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const isSubscribed = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await fetch("/api/auth/has-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to check subscription status");
      }
      return response.json(); // { isUserSubscribed: boolean }
    },
    onSuccess: (data) => {
      setUserSubscribed(data.isUserSubscribed);
      setSubscriptionChecked(true);
    },
    onError: () => {
      setSubscriptionChecked(true);
      setUserSubscribed(false);
    },
  });

  const createCheckoutSessionMutation = useMutation({
    mutationFn: async ({
      planId,
      billingCycle,
    }: {
      planId: number;
      billingCycle: "monthly" | "annual";
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/billing/create-checkout-session",
        { planId, billingCycle },
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Checkout Error",
          description: "Failed to create checkout session.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 500);
        return;
      }
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  /** ----------------- Effects ------------------ */
  useEffect(() => {
    if (isAuthenticated && user?.id && !subscriptionChecked) {
      isSubscribed.mutate({ userId: user.id });
    }
  }, [isAuthenticated, user?.id, subscriptionChecked]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const plansRes = await fetch("/api/service-plans");
        if (!plansRes.ok) throw new Error("Failed to fetch service plans");
        const plansData: ServicePlanWithServices[] = await plansRes.json();

        const servicesRes = await fetch("/api/services");
        if (!servicesRes.ok) throw new Error("Failed to fetch services");
        const servicesData: SelectService[] = await servicesRes.json();

        setServicePlans(plansData);
        setServices(servicesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /** ----------------- Helpers ------------------ */
  const handleSubscribe = (planId: number, cycle: "monthly" | "annual") => {
    setLoadingPlanId(planId);
    createCheckoutSessionMutation.mutate(
      { planId, billingCycle: cycle },
      { onSettled: () => setLoadingPlanId(null) },
    );
  };

  const filteredPlans = servicePlans.filter(
    (plan) => plan.isActive && plan.planType === planType,
  );

  const getPlanServices = (serviceIds: number[]): SelectService[] =>
    services.filter((service) => serviceIds.includes(service.id));

  const calculatePrice = (basePrice: number, annualDiscount: number): number =>
    billingCycle === "annual"
      ? (basePrice * 12 * (1 - annualDiscount / 100)) / 100
      : basePrice / 100;

  const getPlanIcon = (planName: string): React.ElementType => {
    const name = planName.toLowerCase();
    if (name.includes("basic")) return Phone;
    if (name.includes("premium")) return Heart;
    if (name.includes("professional") || name.includes("pro")) return Shield;
    return Phone;
  };

  const getPlanColor = (planName: string, index: number): string => {
    const name = planName.toLowerCase();
    if (name.includes("basic")) return "blue";
    if (name.includes("premium")) return "blue";
    if (name.includes("professional") || name.includes("pro")) return "purple";
    const colors = ["blue", "purple", "green", "orange"];
    return colors[index % colors.length];
  };

  const handlePlanTypeSelect = (type: "individual" | "facility") => {
    setPlanType(type);
    setCurrentStep(2);
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
    setPlanType(null);
  };

  /** ----------------- Conditional Rendering ------------------ */
  let content: JSX.Element | null = null;

  if (isLoading) {
    content = (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  } else if (!isAuthenticated) {
    window.location.href = "/auth/signin";
    content = null;
  } else if (!subscriptionChecked || isSubscribed.isPending) {
    content = (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking subscription...</p>
        </div>
      </div>
    );
  } else if (userSubscribed) {
    window.location.href = "/admin/dashboard";
    content = null;
  } else if (loading) {
    content = (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading plans: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  } else if (currentStep === 1) {
    /** Step 1: Plan Type Selection */
    content = (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative text-center mb-16">
            <div className="absolute right-0 inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Step 1 of 2
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Choose Your Care Type
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Select whether you're looking for individual care or facility-wide
              solutions
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <Card
              className="group cursor-pointer border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => handlePlanTypeSelect("individual")}
            >
              <CardContent className="p-8 text-center">
                <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 transition-colors">
                  <Users className="text-blue-600" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Individual Care
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Perfect for personal health monitoring and individual care
                  needs. Get personalized attention and support.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:scale-105 transition-transform">
                  Select Individual Care
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer border-2 border-slate-200 hover:border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => handlePlanTypeSelect("facility")}
            >
              <CardContent className="p-8 text-center">
                <div className="bg-purple-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-100 transition-colors">
                  <Building2 className="text-purple-600" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Facility Care
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Comprehensive solutions for healthcare facilities, nursing
                  homes, and medical institutions.
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 group-hover:scale-105 transition-transform">
                  Select Facility Care
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } else {
    /** Step 2: Plan Selection */
    content = (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="ghost"
                onClick={goBackToStep1}
                className="flex items-center text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Care Type
              </Button>
              <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Step 2 of 2
              </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Choose Your{" "}
              {planType === "individual" ? "Individual" : "Facility"} Plan
            </h2>
            <p className="text-lg text-slate-600">
              Select the perfect plan for your care requirements
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-lg transition-all text-sm font-medium ${
                  billingCycle === "monthly"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-lg transition-all text-sm font-medium relative ${
                  billingCycle === "annual"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="mr-2 inline" size={14} />
                Annual
                <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-600 text-lg">
                No plans available for {planType} care at the moment.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 ${
                filteredPlans.length === 2
                  ? "md:grid-cols-2 max-w-4xl mx-auto"
                  : "md:grid-cols-3"
              } gap-8 mb-12`}
            >
              {filteredPlans.map((plan, index) => {
                const PlanIcon = getPlanIcon(plan.name);
                const planColor = getPlanColor(plan.name, index);
                const planServices = getPlanServices(plan.serviceIds);
                const price = calculatePrice(
                  plan.basePrice,
                  plan.annualDiscount,
                );
                const isPopular = index === 1 && filteredPlans.length > 2;

                return (
                  <Card
                    key={plan.id}
                    className={`border-2 shadow-lg hover:shadow-xl transition-all duration-300 relative ${
                      isPopular
                        ? "border-blue-500 transform scale-105"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader
                      className={`text-center pb-8 ${isPopular ? "pt-8" : ""}`}
                    >
                      <div
                        className={`bg-${planColor}-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}
                      >
                        <PlanIcon
                          className={`text-${planColor}-600`}
                          size={32}
                        />
                      </div>
                      <CardTitle className="text-xl mb-2">
                        {plan.name}
                      </CardTitle>
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        ${price.toFixed(2)}
                        <span className="text-lg font-normal text-slate-600">
                          /{billingCycle === "annual" ? "year" : "month"}
                        </span>
                      </div>
                      {billingCycle === "annual" && plan.annualDiscount > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Save {plan.annualDiscount}% with annual billing
                        </div>
                      )}
                      <p className="text-slate-600">{plan.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle
                          className="text-green-500 flex-shrink-0"
                          size={20}
                        />
                        <span className="text-sm">
                          {plan.callsPerMonth === -1
                            ? "Unlimited calls"
                            : `${plan.callsPerMonth} calls per month`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle
                          className="text-green-500 flex-shrink-0"
                          size={20}
                        />
                        <span className="text-sm">
                          {plan.callDurationMinutes}-minute conversations
                        </span>
                      </div>

                      {planServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center space-x-3"
                        >
                          <CheckCircle
                            className="text-green-500 flex-shrink-0"
                            size={20}
                          />
                          <span className="text-sm">{service.name}</span>
                        </div>
                      ))}

                      <div className="pt-6">
                        <Button
                          className={`w-full bg-${planColor}-600 hover:bg-${planColor}-700`}
                          disabled={loadingPlanId !== null}
                          onClick={() => handleSubscribe(plan.id, billingCycle)}
                        >
                          {loadingPlanId === plan.id ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <>
                              Subscribe Now
                              <ArrowRight className="ml-2" size={16} />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-center">
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm">
              <div className="flex items-center mr-4">
                <CreditCard className="text-slate-400 mr-2" size={16} />
                <span className="text-slate-600 text-sm font-medium">
                  Powered by{" "}
                  <span className="text-[#635BFF] font-medium">Stripe</span>
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4 flex items-center">
                <Lock className="text-slate-400 mr-2" size={16} />
                <span className="text-slate-600 text-sm">256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return content;
};

export default Pricing;
