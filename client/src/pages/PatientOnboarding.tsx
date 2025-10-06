import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Heart,
  Phone,
  Clock,
  User,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  Loader2,
  AlertCircle,
  PhoneCall,
} from "lucide-react";
import { useLocation } from "wouter";

// Enhanced patient onboarding schema with better validation
const patientSchema = z.object({
  // Essential Information
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  preferredName: z
    .string()
    .max(50, "Preferred name must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^[\+]?[\s\d\(\)\-\.]+$/, "Please enter a valid phone number"),

  // Call Preferences
  preferredCallTime: z.enum(["morning", "afternoon", "evening"], {
    errorMap: () => ({ message: "Please select a preferred call time" }),
  }),

  timezone: z.string().min(1, "Please select a timezone"),

  callFrequency: z.enum(["daily", "every-other-day", "three-times-week"], {
    errorMap: () => ({ message: "Please select call frequency" }),
  }),

  // Conversation Preferences
  conversationStyle: z.enum(
    ["formal", "friendly", "humorous", "gentle", "neutral"],
    {
      errorMap: () => ({ message: "Please select a conversation style" }),
    },
  ),

  interests: z.array(z.string()).optional(),

  specialNotes: z
    .string()
    .max(500, "Special notes must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  // Emergency Contact
  emergencyContactName: z
    .string()
    .min(1, "Emergency contact name is required")
    .min(2, "Emergency contact name must be at least 2 characters")
    .max(100, "Emergency contact name must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  emergencyContactPhone: z
    .string()
    .min(10, "Emergency contact phone must be at least 10 digits")
    .max(15, "Emergency contact phone must be less than 15 digits")
    .regex(/^[\+]?[\s\d\(\)\-\.]+$/, "Please enter a valid phone number"),

  emergencyContactRelation: z
    .string()
    .min(1, "Please specify the relationship")
    .max(50, "Relationship must be less than 50 characters"),
});

type PatientData = z.infer<typeof patientSchema>;

const timeZones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

const interestOptions = [
  "Family & grandchildren",
  "Gardening",
  "Cooking & recipes",
  "Music & singing",
  "Movies & TV shows",
  "Books & reading",
  "Sports",
  "Travel memories",
  "Crafts & hobbies",
  "Nature & animals",
  "History",
  "Current events",
  "Religion & spirituality",
  "Technology & computers",
];

interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

export default function PatientOnboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PatientData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      preferredName: "",
      phone: "",
      preferredCallTime: "morning",
      timezone: "America/New_York",
      callFrequency: "daily",
      conversationStyle: "friendly",
      interests: [],
      specialNotes: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
    },
    mode: "onTouched",
  });

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/[^\d]/g, "");

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return phoneNumber;
  };

  const handlePhoneChange = (field: any, value: string) => {
    const formatted = formatPhoneNumber(value);
    field.onChange(formatted);
  };

  interface ApiError {
    message: string;
    field?: string;
    code?: string;
  }

  const parseApiError = (error: any): ApiError => {
    let data = error?.response?.data;

    if (!data && typeof error?.message === "string") {
      const match = error.message.match(/^\s*\d{3}\s*:\s*(\{.*\})$/);
      if (match) {
        try {
          data = JSON.parse(match[1]);
        } catch {
          data = match[1];
        }
      } else {
        try {
          data = JSON.parse(error.message);
        } catch {
          data = error.message;
        }
      }
    }

    const tryParse = (val: any) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    };
    data = tryParse(data);

    if (data && typeof data === "object") {
      if (Array.isArray((data as any).issues)) {
        const first = (data as any).issues[0];
        return {
          message: first?.message || "Validation error",
          field: first?.path?.join("."),
          code: first?.code || "validation_error",
        };
      }

      if ((data as any).code === "unique_constraint" && (data as any).field) {
        return {
          message: (data as any).message || "This value is already taken.",
          field: (data as any).field,
          code: (data as any).code,
        };
      }

      if (typeof (data as any).message === "string") {
        return { message: (data as any).message };
      }

      return { message: JSON.stringify(data) };
    }

    if (typeof data === "string") {
      return { message: data };
    }

    return {
      message:
        error?.message || "An unexpected error occurred. Please try again.",
    };
  };

  const onSubmit = async (data: PatientData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean phone numbers (remove formatting)
      const cleanedData = {
        ...data,
        phone: data.phone.replace(/[^\d]/g, ""),
        emergencyContactPhone: data.emergencyContactPhone.replace(/[^\d]/g, ""),
        // Convert form data to match API expectations
        preferredName: data.preferredName || data.name,
        topicsOfInterest: data.interests || [],
        conversationTone: data.conversationStyle,
        specialNotes: data.specialNotes || null,
        primaryEmergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone.replace(/[^\d]/g, ""),
          relationship: data.emergencyContactRelation,
        },
      };

      const response = await apiRequest(
        "POST",
        "/api/elderly-users",
        cleanedData,
      );

      toast({
        title: "Success! 🎉",
        description: `${data.name} has been added successfully. Their first call will be scheduled soon!`,
      });

      // Small delay to ensure the toast shows before redirecting
      setTimeout(() => {
        setLocation("/admin/dashboard");
      }, 500);
    } catch (error: any) {
      console.error("Error creating elderly user:", error);

      const apiError = parseApiError(error);
      setSubmitError(apiError.message);

      // Set field-specific error if available
      if (apiError.field && apiError.field in data) {
        form.setError(apiError.field as keyof PatientData, {
          type: "server",
          message: apiError.message,
        });
      }

      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });

      // If it's a validation error for an earlier step, go back to that step
      if (apiError.field) {
        if (["name", "phone", "preferredName"].includes(apiError.field)) {
          setCurrentStep(1);
        } else if (
          [
            "emergencyContactName",
            "emergencyContactPhone",
            "emergencyContactRelation",
          ].includes(apiError.field)
        ) {
          setCurrentStep(3);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Basic Info", icon: User },
    { number: 2, title: "Preferences", icon: MessageCircle },
    { number: 3, title: "Emergency Contact", icon: PhoneCall },
  ];

  const handleStepNext = async () => {
    const currentFields = getCurrentStepFields();

    // Mark fields as touched to trigger validation display
    currentFields.forEach((field) => {
      form.trigger(field);
    });

    const isValid = await form.trigger(currentFields);

    if (isValid) {
      setCurrentStep(currentStep + 1);
      setSubmitError(null); // Clear any previous errors
    }
  };

  const getCurrentStepFields = (): (keyof PatientData)[] => {
    switch (currentStep) {
      case 1:
        return ["name", "preferredName", "phone"];
      case 2:
        return [
          "preferredCallTime",
          "timezone",
          "callFrequency",
          "conversationStyle",
        ];
      case 3:
        return [
          "emergencyContactName",
          "emergencyContactPhone",
          "emergencyContactRelation",
        ];
      default:
        return [];
    }
  };

  const isStepValid = (stepNumber: number) => {
    if (stepNumber === currentStep) return true;

    // Check if step has been completed
    const stepFields = {
      1: ["name", "phone"] as (keyof PatientData)[],
      2: [
        "preferredCallTime",
        "timezone",
        "callFrequency",
        "conversationStyle",
      ] as (keyof PatientData)[],
      3: [
        "emergencyContactName",
        "emergencyContactPhone",
        "emergencyContactRelation",
      ] as (keyof PatientData)[],
    };

    const requiredFields =
      stepFields[stepNumber as keyof typeof stepFields] || [];
    return requiredFields.every((field) => {
      const value = form.getValues(field);
      const fieldState = form.getFieldState(field);
      // Only consider it valid if the field has been touched and has a value and no errors
      return (
        value &&
        value.toString().trim() !== "" &&
        (!fieldState.error || !fieldState.isTouched)
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Heart className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tell Us About Your Loved One
          </h1>
          <p className="text-gray-600 text-lg">
            Help us create personalized, caring conversations they'll love
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step.number
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                    : isStepValid(step.number)
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "border-gray-300 text-gray-400 bg-white"
                }`}
              >
                {currentStep > step.number && isStepValid(step.number) ? (
                  <CheckCircle size={20} />
                ) : (
                  <step.icon size={20} />
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium transition-colors ${
                  currentStep >= step.number ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 w-12 h-px transition-colors duration-300 ${
                    currentStep > step.number ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-xl text-center text-gray-800 flex items-center justify-center gap-2">
              {currentStep === 1 && (
                <>
                  <User size={24} /> Basic Information
                </>
              )}
              {currentStep === 2 && (
                <>
                  <MessageCircle size={24} /> Call & Conversation Preferences
                </>
              )}
              {currentStep === 3 && (
                <>
                  <PhoneCall size={24} /> Emergency Contact
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {submitError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700 flex items-center gap-2">
                            <User size={16} />
                            What is their full name? *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                              placeholder="e.g., Margaret Rose Smith"
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">
                            What should we call them?
                            <span className="text-sm text-gray-500 font-normal ml-2">
                              (optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                              placeholder="e.g., Grandma, Mom, Margaret, Mrs. Smith"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500 mt-1">
                            This is how our AI will address them during calls
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700 flex items-center gap-2">
                            <Phone size={16} />
                            Their phone number *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                              />
                              <Input
                                {...field}
                                type="tel"
                                className="h-12 pl-10 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                                placeholder="(555) 123-4567"
                                onChange={(e) =>
                                  handlePhoneChange(field, e.target.value)
                                }
                                autoComplete="tel"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500 mt-1">
                            We'll call this number for their daily check-ins
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Preferences */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="preferredCallTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-700 flex items-center gap-2">
                              <Clock size={16} />
                              Best time for calls *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500">
                                  <SelectValue placeholder="Select preferred time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">
                                  🌅 Morning (9 AM - 12 PM)
                                </SelectItem>
                                <SelectItem value="afternoon">
                                  ☀️ Afternoon (12 PM - 5 PM)
                                </SelectItem>
                                <SelectItem value="evening">
                                  🌆 Evening (5 PM - 8 PM)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-700">
                              Time zone *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500">
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeZones.map((tz) => (
                                  <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="callFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-700">
                              How often should we call? *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">📞 Daily</SelectItem>
                                <SelectItem value="every-other-day">
                                  📅 Every Other Day
                                </SelectItem>
                                <SelectItem value="three-times-week">
                                  🗓️ 3 Times a Week
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conversationStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-700">
                              Conversation style *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500">
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="formal">
                                  🎩 Polite & Formal
                                </SelectItem>
                                <SelectItem value="friendly">
                                  😊 Friendly & Upbeat
                                </SelectItem>
                                <SelectItem value="humorous">
                                  😂 Fun & Humorous
                                </SelectItem>
                                <SelectItem value="gentle">
                                  💝 Gentle & Caring
                                </SelectItem>
                                <SelectItem value="neutral">
                                  😌 Calm & Neutral
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="interests"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">
                            What do they enjoy talking about?
                            <span className="text-sm text-gray-500 font-normal ml-2">
                              (select all that apply)
                            </span>
                          </FormLabel>
                          <div className="grid grid-cols-2 gap-3 mt-3 p-4 bg-gray-50 rounded-lg">
                            {interestOptions.map((interest) => (
                              <FormField
                                key={interest}
                                control={form.control}
                                name="interests"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={interest}
                                      className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-white rounded transition-colors"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            interest,
                                          )}
                                          onCheckedChange={(checked) => {
                                            const updatedValue = checked
                                              ? [
                                                  ...(field.value || []),
                                                  interest,
                                                ]
                                              : (field.value || []).filter(
                                                  (value) => value !== interest,
                                                );
                                            field.onChange(updatedValue);
                                          }}
                                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer flex-1">
                                        {interest}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                          <p className="text-sm text-gray-500 mt-2">
                            This helps our AI create more engaging conversations
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">
                            Any special notes or preferences?
                            <span className="text-sm text-gray-500 font-normal ml-2">
                              (optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[100px] text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg resize-none transition-colors"
                              placeholder="e.g., loves to talk about their grandchildren, prefers shorter calls, has hearing difficulties, uses hearing aids..."
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-right text-xs text-gray-400 mt-1">
                            {field.value?.length || 0}/500 characters
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Emergency Contact */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        We'll contact this person if we're unable to reach your
                        loved one or if there are any concerns during a call.
                        This information is kept secure and private.
                      </AlertDescription>
                    </Alert>

                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700 flex items-center gap-2">
                            <User size={16} />
                            Emergency contact name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                              placeholder="e.g., John Smith"
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700 flex items-center gap-2">
                            <Phone size={16} />
                            Emergency contact phone *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                              />
                              <Input
                                {...field}
                                type="tel"
                                className="h-12 pl-10 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                                placeholder="(555) 123-4567"
                                onChange={(e) =>
                                  handlePhoneChange(field, e.target.value)
                                }
                                autoComplete="tel"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">
                            Relationship to them *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
                              placeholder="e.g., Son, Daughter, Spouse, Primary Caregiver"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-8 border-t border-gray-100">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="h-12 px-6 rounded-lg border-2 hover:bg-gray-50 transition-colors"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleStepNext}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                      disabled={isSubmitting}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting Up...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete Setup
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Skip for now option - only on first step */}
                {currentStep === 1 && (
                  <div className="text-center pt-4 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setLocation("/admin/dashboard")}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      disabled={isSubmitting}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Skip for now, go to dashboard
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-800 text-sm">
                If you have any questions while setting up, don't worry! You can
                always update this information later from your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
