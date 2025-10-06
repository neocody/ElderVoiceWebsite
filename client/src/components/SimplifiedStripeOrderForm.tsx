import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, User, Heart, Shield, Phone, CheckCircle } from "lucide-react";
import { Link } from "wouter";

// Load Stripe outside of component render to avoid recreating the object
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Simplified form validation schema
const orderFormSchema = z.object({
  // Customer Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),  
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  
  // Plan Selection
  planId: z.enum(["basic", "premium", "professional"]),
  billingCycle: z.enum(["monthly", "annual"]),
  
  // Terms and Privacy
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  acceptPrivacy: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
  marketingEmails: z.boolean().default(true),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

// Plan configurations
const planConfigs = {
  basic: {
    name: "Basic Care",
    icon: <Phone className="text-blue-600" size={20} />,
    monthlyPrice: 49,
    annualPrice: 529, // 10% discount
    features: ["3 calls per week", "15-minute conversations", "Weekly family summaries", "Basic health check-ins"],
    color: "blue",
    popular: false
  },
  premium: {
    name: "Premium Care", 
    icon: <Heart className="text-blue-600" size={20} />,
    monthlyPrice: 89,
    annualPrice: 909, // 15% discount
    features: ["Daily calls", "20-minute conversations", "Daily family updates", "Medication reminders", "Mood monitoring"],
    color: "blue",
    popular: true
  },
  professional: {
    name: "Professional Care",
    icon: <Shield className="text-purple-600" size={20} />,
    monthlyPrice: 149,
    annualPrice: 1431, // 20% discount
    features: ["Unlimited calls", "30-minute conversations", "Real-time alerts", "Healthcare integration", "24/7 support"],
    color: "purple",
    popular: false
  }
};

interface StripeOrderFormProps {
  selectedPlan?: keyof typeof planConfigs;
  trigger?: React.ReactNode;
}

function CheckoutForm({ formData, onSuccess, onError }: { 
  formData: OrderFormData; 
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
          return_url: `${window.location.origin}/order-success`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
        <PaymentElement 
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card", "apple_pay", "google_pay"]
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700"
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
            Complete Order
          </>
        )}
      </Button>
    </form>
  );
}

function OrderModal({ isOpen, onClose, selectedPlan = "premium" }: {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: keyof typeof planConfigs;
}) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderFormData | null>(null);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      planId: selectedPlan,
      billingCycle: "monthly",
      acceptTerms: false,
      acceptPrivacy: false,
      marketingEmails: true,
    },
  });

  const watchedPlan = form.watch("planId");
  const watchedBilling = form.watch("billingCycle");
  const currentPlan = planConfigs[watchedPlan];
  const currentPrice = watchedBilling === "annual" ? currentPlan.annualPrice : currentPlan.monthlyPrice;

  const onSubmit = async (data: OrderFormData) => {
    try {
      setOrderData(data);
      
      // Create payment intent
      const response = await apiRequest("POST", "/api/billing/create-payment-intent", {
        amount: Math.round(currentPrice * 100),
        currency: "usd",
        description: `${currentPlan.name} - ${watchedBilling} subscription`,
        customer: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        }
      });
      
      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
      setCurrentStep(2);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Success!",
      description: "Your subscription has been created successfully. Welcome to Elder Voice!",
    });
    onClose();
    setCurrentStep(1);
    setClientSecret(null);
    setOrderData(null);
    form.reset();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleReset = () => {
    setCurrentStep(1);
    setClientSecret(null);
    setOrderData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentPlan.icon}
            Complete Your {currentPlan.name} Order
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 mb-6">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= 1 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 text-gray-400'
            }`}>
              <User size={20} />
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Order Details
            </span>
          </div>
          <div className={`w-12 h-px ${
            currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'
          }`} />
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= 2 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 text-gray-400'
            }`}>
              <CreditCard size={20} />
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Payment
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Plan Selection */}
                  <Card className="border-2 border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle className="text-green-500" size={20} />
                        Plan Selection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="planId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Choose Your Plan</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 text-base border-2">
                                  <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(planConfigs).map(([key, plan]) => (
                                  <SelectItem key={key} value={key} className="py-3">
                                    <div className="flex items-center gap-2">
                                      {plan.icon}
                                      <span className="font-medium">{plan.name}</span>
                                      {plan.popular && <Badge className="ml-2 text-xs">Most Popular</Badge>}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="billingCycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Billing Cycle</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 text-base border-2">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly (${currentPlan.monthlyPrice}/month)</SelectItem>
                                <SelectItem value="annual">
                                  Annual (${Math.round(currentPlan.annualPrice/12)}/month - Save {Math.round((1 - currentPlan.annualPrice/(currentPlan.monthlyPrice * 12)) * 100)}%)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card className="border-2 border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="text-blue-600" size={20} />
                        Your Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="h-12 text-base border-2 border-gray-300 focus:border-blue-500" 
                                  placeholder="Enter your first name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="h-12 text-base border-2 border-gray-300 focus:border-blue-500" 
                                  placeholder="Enter your last name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                className="h-12 text-base border-2 border-gray-300 focus:border-blue-500" 
                                placeholder="Enter your email address"
                              />
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
                            <FormLabel className="text-base font-medium">Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="tel" 
                                className="h-12 text-base border-2 border-gray-300 focus:border-blue-500" 
                                placeholder="Enter your phone number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Terms and Privacy */}
                  <Card className="border-2 border-blue-100">
                    <CardHeader>
                      <CardTitle className="text-lg">Terms & Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">
                                I accept the{" "}
                                <Link href="/terms-of-service" className="text-blue-600 hover:underline">
                                  Terms of Service
                                </Link>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acceptPrivacy"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">
                                I accept the{" "}
                                <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                                  Privacy Policy
                                </Link>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="marketingEmails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">
                                Send me helpful tips and updates about Elder Voice (optional)
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      size="lg"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              clientSecret && orderData && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Complete Payment</h3>
                      <Button 
                        variant="outline" 
                        onClick={handleReset}
                        size="sm"
                      >
                        ← Back to Details
                      </Button>
                    </div>
                    <CheckoutForm 
                      formData={orderData}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </div>
                </Elements>
              )
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-2 border-blue-100">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {currentPlan.icon}
                  <div>
                    <div className="font-semibold">{currentPlan.name}</div>
                    <div className="text-sm text-gray-600">
                      {watchedBilling === "annual" ? "Annual" : "Monthly"} billing
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${currentPrice.toFixed(2)}</span>
                  </div>
                  {watchedBilling === "annual" && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Annual discount</span>
                      <span>-${((currentPlan.monthlyPrice * 12) - currentPlan.annualPrice).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${currentPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="font-medium">Plan includes:</div>
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500 pt-4 border-t">
                  You can add your loved one's details and set up calls after completing your order.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SimplifiedStripeOrderForm({ trigger, selectedPlan = "premium" }: StripeOrderFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (trigger) {
    return (
      <>
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
        <OrderModal 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          selectedPlan={selectedPlan}
        />
      </>
    );
  }

  return (
    <OrderModal 
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      selectedPlan={selectedPlan}
    />
  );
}