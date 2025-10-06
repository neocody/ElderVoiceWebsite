import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, 
  CreditCard, 
  User, 
  Heart, 
  Shield, 
  Phone, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Calendar,
  Star,
  Clock
} from "lucide-react";
import { Link } from "wouter";

// Load Stripe lazily only when needed
let stripePromise: ReturnType<typeof loadStripe> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Step 1: Account Creation Schema
const accountSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Please enter a valid phone number").optional(),
});

// Step 2: Plan Selection Schema
const planSchema = z.object({
  planId: z.enum(["basic", "premium", "professional"]),
  billingCycle: z.enum(["monthly", "annual"]),
  promoCode: z.string().optional(),
});

// Combined form schema
const signupSchema = accountSchema.merge(planSchema);
type SignupFormData = z.infer<typeof signupSchema>;

// Lazy load plan configurations to reduce initial bundle size
const getPlanConfigs = () => ({
  basic: {
    name: "Essential Care",
    tagline: "Perfect for getting started",
    icon: <Phone className="text-blue-500" size={24} />,
    monthlyPrice: 49,
    annualPrice: 529,
    savings: "2 months free",
    features: [
      "3 caring calls per week",
      "15-minute conversations", 
      "Weekly family updates",
      "Basic wellness check-ins",
      "Email support"
    ],
    color: "blue",
    popular: false
  },
  premium: {
    name: "Complete Care", 
    tagline: "Most popular choice",
    icon: <Heart className="text-rose-500" size={24} />,
    monthlyPrice: 89,
    annualPrice: 909,
    savings: "3 months free",
    features: [
      "Daily caring calls",
      "20-minute conversations",
      "Daily family updates", 
      "Medication reminders",
      "Mood & wellness monitoring",
      "Priority support"
    ],
    color: "rose",
    popular: true
  },
  professional: {
    name: "Premium Care",
    tagline: "Complete peace of mind",
    icon: <Shield className="text-purple-500" size={24} />,
    monthlyPrice: 149,
    annualPrice: 1431,
    savings: "4 months free",
    features: [
      "Unlimited caring calls",
      "30-minute conversations",
      "Real-time family alerts", 
      "Healthcare integration",
      "Custom conversation topics",
      "24/7 dedicated support"
    ],
    color: "purple",
    popular: false
  }
});

type PlanKey = "basic" | "premium" | "professional";

interface StreamlinedSignupFlowProps {
  selectedPlan?: PlanKey;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

function PaymentStep({ formData, onSuccess, onError }: { 
  formData: SignupFormData; 
  onSuccess: () => void; 
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/welcome`,
        },
        redirect: "if_required"
      });

      if (error) {
        onError(error.message || "Payment failed. Please try again.");
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const planConfigs = getPlanConfigs();
  const currentPlan = planConfigs[formData.planId];
  const currentPrice = formData.billingCycle === "annual" ? currentPlan.annualPrice : currentPlan.monthlyPrice;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          {currentPlan.icon}
          <div>
            <h3 className="font-semibold text-gray-900">{currentPlan.name}</h3>
            <p className="text-sm text-gray-600">
              {formData.billingCycle === "annual" ? "Annual" : "Monthly"} billing
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${Math.round(currentPrice / (formData.billingCycle === "annual" ? 12 : 1))}/mo
            </div>
            {formData.billingCycle === "annual" && (
              <div className="text-sm text-green-600 font-medium">
                Save ${(currentPlan.monthlyPrice * 12) - currentPlan.annualPrice}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="text-green-500" size={16} />
          <span>Your payment information is secure and encrypted</span>
        </div>
        
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
          <PaymentElement 
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card", "apple_pay", "google_pay"]
            }}
          />
        </div>
      </div>

      {/* Trust Signals */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <span>Powered by Stripe</span>
          <span>•</span>
          <span>256-bit SSL encryption</span>
        </div>
        <p>
          By continuing, you agree to our{" "}
          <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-base font-medium rounded-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Start My Free Trial
          </>
        )}
      </Button>
    </form>
  );
}

export default function StreamlinedSignupFlow({ trigger, selectedPlan = "premium", onClose }: StreamlinedSignupFlowProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    planId: selectedPlan,
    billingCycle: "monthly"
  });

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      planId: selectedPlan,
      billingCycle: "monthly",
      email: "",
      password: "",
      phone: "",
      promoCode: "",
    },
  });

  const watchedPlan = form.watch("planId");
  const watchedBilling = form.watch("billingCycle");
  const planConfigs = getPlanConfigs();
  const currentPlan = planConfigs[watchedPlan];

  const handleStepSubmit = async (stepData: Partial<SignupFormData>) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (currentStep === 1) {
      // Account creation step
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Plan selection step - create payment intent
      try {
        const planConfigs = getPlanConfigs();
        const currentPlan = planConfigs[updatedData.planId!];
        const price = updatedData.billingCycle === "annual" ? currentPlan.annualPrice : currentPlan.monthlyPrice;
        
        const response = await apiRequest("POST", "/api/billing/create-payment-intent", {
          amount: Math.round(price * 100),
          currency: "usd",
          description: `${currentPlan.name} - ${updatedData.billingCycle} subscription`,
          customer: {
            email: updatedData.email,
            phone: updatedData.phone,
          }
        });
        
        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
        setCurrentStep(3);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process plan selection. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentStep(4);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(1);
    setClientSecret(null);
    setFormData({ planId: selectedPlan, billingCycle: "monthly" });
    form.reset();
    onClose?.();
  };

  const steps = [
    { number: 1, title: "Account", icon: User },
    { number: 2, title: "Plan", icon: Heart },
    { number: 3, title: "Payment", icon: CreditCard },
    { number: 4, title: "Complete", icon: CheckCircle },
  ];

  return (
    <>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                {currentStep === 4 ? "Welcome to Elder Voice!" : "Join Elder Voice"}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600 mt-2">
                {currentStep === 4 
                  ? "You're all set up! Let's add your loved one next."
                  : "Give your loved one the gift of daily companionship"
                }
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            {currentStep < 4 && (
              <div className="flex items-center justify-center space-x-4 mt-6 mb-8">
                {steps.slice(0, 3).map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      currentStep >= step.number 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      <step.icon size={18} />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                    {index < 2 && (
                      <div className={`mx-4 w-8 h-px transition-colors ${
                        currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            {/* Step 1: Account Creation */}
            {currentStep === 1 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => handleStepSubmit(data))} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                              <Input 
                                {...field} 
                                type="email" 
                                className="h-12 pl-10 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg" 
                                placeholder="your@email.com"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                              <Input 
                                {...field} 
                                type="password" 
                                className="h-12 pl-10 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg" 
                                placeholder="Create a secure password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">
                            Phone Number 
                            <span className="text-sm text-gray-500 font-normal ml-1">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                              <Input 
                                {...field} 
                                type="tel" 
                                className="h-12 pl-10 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg" 
                                placeholder="(555) 123-4567"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-base font-medium rounded-lg"
                    size="lg"
                  >
                    Continue to Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 2: Plan Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => handleStepSubmit(data))} className="space-y-6">
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center">
                      <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                          type="button"
                          onClick={() => form.setValue("billingCycle", "monthly")}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            watchedBilling === "monthly"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => form.setValue("billingCycle", "annual")}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            watchedBilling === "annual"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            Annual
                            <Badge className="bg-green-100 text-green-700 text-xs">Save 20%</Badge>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Plan Cards */}
                    <div className="grid gap-4">
                      {Object.entries(planConfigs).map(([key, plan]) => {
                        const planKey = key as PlanKey;
                        const isSelected = watchedPlan === planKey;
                        const price = watchedBilling === "annual" ? plan.annualPrice : plan.monthlyPrice;
                        const monthlyPrice = watchedBilling === "annual" ? Math.round(price / 12) : price;
                        
                        return (
                          <div
                            key={planKey}
                            onClick={() => form.setValue("planId", planKey)}
                            className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? `border-blue-500 bg-blue-50 shadow-lg`
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {plan.popular && (
                              <Badge className="absolute -top-2 left-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                                <Star className="mr-1" size={12} />
                                Most Popular
                              </Badge>
                            )}
                            
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {plan.icon}
                                <div>
                                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                                  <p className="text-sm text-gray-600">{plan.tagline}</p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  ${monthlyPrice}
                                  <span className="text-base font-normal text-gray-600">/mo</span>
                                </div>
                                {watchedBilling === "annual" && (
                                  <div className="text-sm text-green-600 font-medium">
                                    {plan.savings}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              {plan.features.slice(0, 3).map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                  <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                                  <span>{feature}</span>
                                </div>
                              ))}
                              {plan.features.length > 3 && (
                                <div className="text-sm text-gray-500">
                                  +{plan.features.length - 3} more features
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Promo Code */}
                    <FormField
                      control={form.control}
                      name="promoCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">
                            Promo Code 
                            <span className="text-sm text-gray-500 font-normal ml-1">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg" 
                              placeholder="Enter promo code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="h-12 px-6 rounded-lg"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-base font-medium rounded-lg"
                        size="lg"
                      >
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && clientSecret && formData && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="h-10 px-4 rounded-lg"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="text-sm text-gray-600">
                    Step 3 of 3
                  </div>
                </div>

                <Elements stripe={getStripe()} options={{ clientSecret }}>
                  <PaymentStep 
                    formData={formData as SignupFormData}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="text-center space-y-6 py-8">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={40} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h3>
                  <p className="text-gray-600 mb-6">
                    Welcome to Elder Voice! Your account has been created and your subscription is active.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="text-blue-600" size={20} />
                    <span className="font-medium text-blue-900">Next Step: Add Your Loved One</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Tell us about the person who will receive caring calls, set their preferences, 
                    and schedule their first conversation.
                  </p>
                </div>

                <Button 
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-base font-medium rounded-lg"
                  size="lg"
                >
                  Set Up Your Loved One
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-sm text-gray-500">
                  You can always do this later from your dashboard
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}