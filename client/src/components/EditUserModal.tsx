import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ElderlyUser } from "@shared/schema";

const editPatientSchema = z
  .object({
    // Basic Information
    name: z.string().min(1, "Full name is required"),
    preferredName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    age: z
      .number()
      .min(1, "Age must be at least 1")
      .max(120, "Age must be less than 120")
      .optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[\d\s\-\(\)\+]+$/, "Please enter a valid phone number"),
    alternatePhone: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length >= 10,
        "Alternate phone must be at least 10 digits",
      ),

    // Call Preferences
    preferredCallDays: z
      .array(z.string())
      .min(1, "Please select at least one day for calls"),
    preferredCallTime: z.enum(["morning", "afternoon", "evening"], {
      errorMap: () => ({ message: "Please select a preferred call time" }),
    }),
    callFrequency: z.enum(["daily", "every_other_day", "weekly", "custom"], {
      errorMap: () => ({ message: "Please select a call frequency" }),
    }),

    // Health and Well-being (optional)
    healthConcerns: z.string().optional(),
    medications: z.string().optional(),
    allergies: z.string().optional(),
    mobilityLevel: z
      .enum([
        "fully_mobile",
        "limited_mobility",
        "requires_assistance",
        "bedridden",
      ])
      .optional(),

    // Cognitive and Emotional Preferences (optional)
    cognitiveStatus: z
      .enum([
        "excellent",
        "good",
        "mild_impairment",
        "moderate_impairment",
        "significant_impairment",
      ])
      .optional(),
    topicsOfInterest: z.array(z.string()).optional(),
    conversationTone: z
      .enum(["formal", "friendly", "humorous", "gentle", "neutral"])
      .optional(),

    // Emergency Contacts (optional)
    primaryEmergencyContact: z
      .object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        phone: z
          .string()
          .optional()
          .refine(
            (val) => !val || val.length >= 10,
            "Emergency contact phone must be at least 10 digits",
          ),
      })
      .optional(),
    secondaryEmergencyContact: z
      .object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        phone: z
          .string()
          .optional()
          .refine(
            (val) => !val || val.length >= 10,
            "Emergency contact phone must be at least 10 digits",
          ),
      })
      .optional(),

    // Special Instructions
    specialInstructions: z.string().optional(),
  })
  .refine(
    (data) => {
      // At least one of age or dateOfBirth should be provided
      return data.age || data.dateOfBirth;
    },
    {
      message: "Please provide either age or date of birth",
      path: ["age"],
    },
  );

type EditPatientForm = z.infer<typeof editPatientSchema>;

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ElderlyUser | null;
}

export default function EditUserModal({
  open,
  onOpenChange,
  user,
}: EditUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditPatientForm>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: {
      name: "",
      preferredName: "",
      dateOfBirth: "",
      age: undefined,
      gender: undefined,
      phone: "",
      alternatePhone: "",
      preferredCallDays: [],
      preferredCallTime: "morning",
      callFrequency: "daily",
      healthConcerns: "",
      medications: "",
      allergies: "",
      mobilityLevel: undefined,
      cognitiveStatus: undefined,
      topicsOfInterest: [],
      conversationTone: undefined,
      primaryEmergencyContact: {
        name: "",
        relationship: "",
        phone: "",
      },
      secondaryEmergencyContact: {
        name: "",
        relationship: "",
        phone: "",
      },
      specialInstructions: "",
    },
  });

  useEffect(() => {
    if (user) {
      console.log("User:", user);
      console.log("Original dateOfBirth:", user.dateOfBirth);

      // More robust date conversion
      let dateOfBirth = "";
      if (user.dateOfBirth) {
        if (user.dateOfBirth instanceof Date) {
          dateOfBirth = user.dateOfBirth.toISOString().split("T")[0];
        } else if (typeof user.dateOfBirth === "string") {
          // Handle ISO string
          const date = new Date(user.dateOfBirth);
          if (!isNaN(date.getTime())) {
            dateOfBirth = date.toISOString().split("T")[0];
          }
        }
      }

      console.log("Converted dateOfBirth:", dateOfBirth);

      // Rest of your existing code...
      // Parse emergency contacts
      let primaryEmergencyContact = {
        name: "",
        relationship: "",
        phone: "",
      };
      let secondaryEmergencyContact = {
        name: "",
        relationship: "",
        phone: "",
      };

      // Check primary emergency contact
      if (
        user.primaryEmergencyContact &&
        typeof user.primaryEmergencyContact === "object"
      ) {
        primaryEmergencyContact = {
          name: (user.primaryEmergencyContact as any).name || "",
          relationship:
            (user.primaryEmergencyContact as any).relationship || "",
          phone: (user.primaryEmergencyContact as any).phone || "",
        };
      }

      // Check secondary emergency contact
      if (
        user.secondaryEmergencyContact &&
        typeof user.secondaryEmergencyContact === "object"
      ) {
        secondaryEmergencyContact = {
          name: (user.secondaryEmergencyContact as any).name || "",
          relationship:
            (user.secondaryEmergencyContact as any).relationship || "",
          phone: (user.secondaryEmergencyContact as any).phone || "",
        };
      }

      // Convert preferredCallDays to proper format
      const normalizedCallDays = Array.isArray(user.preferredCallDays)
        ? user.preferredCallDays.map((day) => {
            const dayLower = day.toLowerCase();
            if (dayLower === "monday") return "Monday";
            if (dayLower === "tuesday") return "Tuesday";
            if (dayLower === "wednesday") return "Wednesday";
            if (dayLower === "thursday") return "Thursday";
            if (dayLower === "friday") return "Friday";
            if (dayLower === "saturday") return "Saturday";
            if (dayLower === "sunday") return "Sunday";
            return day;
          })
        : [];

      // Convert topicsOfInterest to array if it's a string
      let topicsOfInterest: string[] = [];
      if (user.topicsOfInterest) {
        if (Array.isArray(user.topicsOfInterest)) {
          topicsOfInterest = user.topicsOfInterest;
        } else if (typeof user.topicsOfInterest === "string") {
          try {
            topicsOfInterest = JSON.parse(user.topicsOfInterest);
          } catch {
            topicsOfInterest = user.topicsOfInterest
              .split(",")
              .map((t) => t.trim());
          }
        }
      }

      const formData = {
        name: user.name || "",
        preferredName: user.preferredName || "",
        dateOfBirth: dateOfBirth,
        age: user.age || undefined,
        gender: (user.gender as any) || undefined,
        phone: user.phone || "",
        alternatePhone: user.alternatePhone || "",
        preferredCallDays: normalizedCallDays,
        preferredCallTime:
          (user.preferredCallTime as "morning" | "afternoon" | "evening") ||
          "morning",
        callFrequency:
          (user.callFrequency as
            | "daily"
            | "every_other_day"
            | "weekly"
            | "custom") || "daily",
        healthConcerns: user.healthConcerns || "",
        medications: user.medications || "",
        allergies: user.allergies || "",
        mobilityLevel: (user.mobilityLevel as any) || undefined,
        cognitiveStatus: (user.cognitiveStatus as any) || undefined,
        topicsOfInterest: topicsOfInterest,
        conversationTone: (user.conversationTone as any) || undefined,
        primaryEmergencyContact,
        secondaryEmergencyContact,
        specialInstructions: user.specialInstructions || "",
      };

      console.log("Form data being set:", formData);

      // Use a small delay to ensure form is ready
      setTimeout(() => {
        form.reset(formData);
      }, 0);
    }
  }, [user, form]);

  const updatePatientMutation = useMutation({
    mutationFn: async (data: EditPatientForm) => {
      if (!user) throw new Error("No user to update");

      const response = await apiRequest(
        "PATCH",
        `/api/elderly-users/${user.id}`,
        data,
      );
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Patient Updated",
        description: "Patient information has been updated successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/elderly-users"] });
      await queryClient.refetchQueries({ queryKey: ["/api/elderly-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.log("I am the original error", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      // Parse validation errors from server response
      let errorMessage = "Failed to update patient. Please try again.";
      try {
        const errorData = JSON.parse(error.message.split(": ")[1]);
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = errorData.errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(", ");
          errorMessage = `Please fix the following errors: ${fieldErrors}`;
        } else if (errorData.details) {
          errorMessage = errorData.details;
        }
      } catch (parseError) {
        console.error("Failed to parse error message:", parseError);
        // If parsing fails, use the original error message
        if (error.message.includes("Validation failed")) {
          errorMessage = "Please check all required fields and try again.";
          console.log("There is a validation error", error);
        }
      }

      console.log("I am error at last but original");

      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Clean patch data to match backend schema requirements
  const cleanPatchData = (data: EditPatientForm) => {
    const cleaned: Record<string, any> = {};

    for (const key in data) {
      const value = (data as any)[key];
      if (value === undefined) continue; // omit undefined values

      // Handle emergency contact objects
      if (
        key === "primaryEmergencyContact" ||
        key === "secondaryEmergencyContact"
      ) {
        const contact = value;
        if (
          !contact ||
          (typeof contact === "object" &&
            !contact.name &&
            !contact.relationship &&
            !contact.phone)
        ) {
          cleaned[key] = null;
        } else {
          cleaned[key] = contact;
        }
        continue;
      }

      // Handle array fields
      if (key === "preferredCallDays" || key === "topicsOfInterest") {
        cleaned[key] = Array.isArray(value) ? value : [];
        continue;
      }

      // Handle date fields
      if (key === "dateOfBirth" && !value) continue; // omit empty DOB

      // Handle enum fields - only send if they have valid values
      if (
        key === "gender" ||
        key === "mobilityLevel" ||
        key === "cognitiveStatus" ||
        key === "conversationTone"
      ) {
        if (value && value !== undefined) {
          cleaned[key] = value;
        }
        continue;
      }

      // Handle call frequency and time
      if (key === "callFrequency" || key === "preferredCallTime") {
        if (value && value !== undefined) {
          cleaned[key] = value;
        }
        continue;
      }

      // For all other fields, include if they have a value
      if (value !== undefined && value !== null && value !== "") {
        cleaned[key] = value;
      }
    }

    return cleaned;
  };

  const onSubmit = (data: EditPatientForm) => {
    const cleaned = cleanPatchData(data);
    updatePatientMutation.mutate(cleaned as EditPatientForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    1. Basic Information
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
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
                          <FormLabel>Preferred Name/Nickname</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What they like to be called"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age (if DOB unknown)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Approximate age"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">
                                Prefer not to say
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="alternatePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alternate Contact Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 987-6543" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Call Preferences Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    2. Call Preferences
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="preferredCallDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Call Days *</FormLabel>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {[
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day) => (
                              <div
                                key={day}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={day}
                                  checked={field.value?.includes(day)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, day]);
                                    } else {
                                      field.onChange(
                                        current.filter((d) => d !== day),
                                      );
                                    }
                                  }}
                                />
                                <label htmlFor={day} className="text-sm">
                                  {day.slice(0, 3)}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="preferredCallTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Call Time Window *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">
                                  Morning (9 AM - 12 PM)
                                </SelectItem>
                                <SelectItem value="afternoon">
                                  Afternoon (1 PM - 4 PM)
                                </SelectItem>
                                <SelectItem value="evening">
                                  Evening (5 PM - 8 PM)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="callFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="every_other_day">
                                  Every Other Day
                                </SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="custom">
                                  Custom Schedule
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Health and Well-being Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    3. Health and Well-being (Optional)
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="healthConcerns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Primary Health Concerns or Conditions
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any health conditions we should be aware of"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="medications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medication Names and Schedule</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Metformin 500mg at 8 AM, Blood pressure medication at 2 PM"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Allergies or Dietary Restrictions
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Food allergies, medication allergies, dietary restrictions"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobilityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobility Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mobility level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fully_mobile">
                                Fully mobile
                              </SelectItem>
                              <SelectItem value="limited_mobility">
                                Limited mobility
                              </SelectItem>
                              <SelectItem value="requires_assistance">
                                Requires assistance
                              </SelectItem>
                              <SelectItem value="bedridden">
                                Bedridden
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Cognitive and Emotional Preferences Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    4. Cognitive and Emotional Preferences (Optional)
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cognitiveStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cognitive Health Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cognitive status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="excellent">
                                Excellent
                              </SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="mild_impairment">
                                Mild impairment
                              </SelectItem>
                              <SelectItem value="moderate_impairment">
                                Moderate impairment
                              </SelectItem>
                              <SelectItem value="significant_impairment">
                                Significant impairment
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="topicsOfInterest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topics of Interest</FormLabel>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {[
                              "Family",
                              "Gardening",
                              "Sports",
                              "History",
                              "Current Events",
                              "Movies/TV",
                              "Pets/Animals",
                              "Cooking",
                              "Travel",
                              "Music",
                              "Art",
                              "Technology",
                            ].map((topic) => (
                              <div
                                key={topic}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={topic}
                                  checked={field.value?.includes(topic)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, topic]);
                                    } else {
                                      field.onChange(
                                        current.filter((t) => t !== topic),
                                      );
                                    }
                                  }}
                                />
                                <label htmlFor={topic} className="text-sm">
                                  {topic}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="conversationTone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Conversation Tone</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select conversation tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="humorous">Humorous</SelectItem>
                              <SelectItem value="gentle">
                                Gentle/Reassuring
                              </SelectItem>
                              <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Emergency & Family Contacts Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    5. Emergency & Family Contacts (Optional)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">
                        Primary Emergency Contact
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="primaryEmergencyContact.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="primaryEmergencyContact.relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Daughter, Son"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="primaryEmergencyContact.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="(555) 123-4567"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">
                        Secondary Emergency Contact
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="secondaryEmergencyContact.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="secondaryEmergencyContact.relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Nephew, Friend"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="secondaryEmergencyContact.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="(555) 987-6543"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Special Instructions Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    6. Special Instructions & Notes (Optional)
                  </h3>
                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Is there anything else important we should know about
                          interacting with this patient?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Preferred greeting style, hearing difficulties, sensitive topics to avoid, communication preferences"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={updatePatientMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-blue-700"
                disabled={updatePatientMutation.isPending}
              >
                {updatePatientMutation.isPending
                  ? "Updating..."
                  : "Update Patient"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
