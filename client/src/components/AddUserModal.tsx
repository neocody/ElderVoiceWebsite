import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const addPatientSchema = z
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

    // Enhanced AI Context Fields
    lifeHistory: z.string().optional(),
    personalityTraits: z.array(z.string()).optional(),
    favoriteMemories: z.string().optional(),
    currentLivingSituation: z.string().optional(),
    dailyRoutine: z.string().optional(),
    socialConnections: z.string().optional(),
    culturalBackground: z.string().optional(),
    educationBackground: z.string().optional(),
    pastCareers: z.string().optional(),
    hobbiesAndCrafts: z.string().optional(),
    favoriteBooks: z.string().optional(),
    favoriteMusic: z.string().optional(),
    travelExperiences: z.string().optional(),
    religiousSpiritual: z.string().optional(),
    currentChallenges: z.string().optional(),
    motivationsGoals: z.string().optional(),
    communicationPreferences: z.string().optional(),
    sensoryPreferences: z.string().optional(),
    memoryConsiderations: z.string().optional(),

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

type AddPatientForm = z.infer<typeof addPatientSchema>;

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPatientModal({
  open,
  onOpenChange,
}: AddPatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<AddPatientForm>({
    resolver: zodResolver(addPatientSchema),
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
      lifeHistory: "",
      personalityTraits: [],
      favoriteMemories: "",
      currentLivingSituation: "",
      dailyRoutine: "",
      socialConnections: "",
      culturalBackground: "",
      educationBackground: "",
      pastCareers: "",
      hobbiesAndCrafts: "",
      favoriteBooks: "",
      favoriteMusic: "",
      travelExperiences: "",
      religiousSpiritual: "",
      currentChallenges: "",
      motivationsGoals: "",
      communicationPreferences: "",
      sensoryPreferences: "",
      memoryConsiderations: "",
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

  // Calculate completion percentage for each tab
  const getBasicInfoCompletion = () => {
    const values = form.getValues();
    const required = [values.name, values.phone];
    const optional = [values.preferredName, values.gender, values.dateOfBirth || values.age];
    const filledRequired = required.filter(Boolean).length;
    const filledOptional = optional.filter(Boolean).length;
    return Math.round(((filledRequired * 2 + filledOptional) / (required.length * 2 + optional.length)) * 100);
  };

  const getCallPreferencesCompletion = () => {
    const values = form.getValues();
    const fields = [values.preferredCallDays?.length > 0, values.preferredCallTime, values.callFrequency];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getHealthInfoCompletion = () => {
    const values = form.getValues();
    const fields = [values.healthConcerns, values.medications, values.allergies, values.mobilityLevel, values.cognitiveStatus];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getPersonalContextCompletion = () => {
    const values = form.getValues();
    const fields = [
      values.lifeHistory, values.favoriteMemories, values.currentLivingSituation,
      values.dailyRoutine, values.socialConnections, values.culturalBackground,
      values.educationBackground, values.pastCareers, values.hobbiesAndCrafts,
      values.favoriteBooks, values.favoriteMusic, values.travelExperiences,
      values.religiousSpiritual, values.motivationsGoals
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getCommunicationCompletion = () => {
    const values = form.getValues();
    const fields = [
      (values.topicsOfInterest?.length || 0) > 0, values.conversationTone, 
      values.communicationPreferences, values.sensoryPreferences, values.memoryConsiderations
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const addPatientMutation = useMutation({
    mutationFn: async (data: AddPatientForm) => {
      const response = await apiRequest("POST", "/api/elderly-users", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Patient Added",
        description: "New patient profile has been created successfully with AI context information.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/elderly-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      setActiveTab("basic");
      onOpenChange(false);
    },
    onError: (error: Error) => {
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

      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddPatientForm) => {
    addPatientMutation.mutate(data);
  };

  const topicsOfInterestOptions = [
    "Gardening", "Cooking", "Books", "Music", "Family", "Pets", "Sports", 
    "Travel", "History", "Movies", "Art", "Dancing", "Games", "Crafts",
    "Religion", "Nature", "Photography", "Technology", "Fashion", "Weather"
  ];

  const personalityTraitOptions = [
    "Cheerful", "Curious", "Gentle", "Humorous", "Patient", "Wise", "Caring",
    "Independent", "Social", "Reserved", "Optimistic", "Nostalgic", "Creative",
    "Practical", "Spiritual", "Adventurous", "Thoughtful", "Generous"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Patient - AI Context Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="relative">
                  <div className="flex flex-col items-center">
                    <span>Basic Info</span>
                    <Badge variant={getBasicInfoCompletion() > 50 ? "default" : "secondary"} className="text-xs">
                      {getBasicInfoCompletion()}%
                    </Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="calls" className="relative">
                  <div className="flex flex-col items-center">
                    <span>Call Preferences</span>
                    <Badge variant={getCallPreferencesCompletion() > 50 ? "default" : "secondary"} className="text-xs">
                      {getCallPreferencesCompletion()}%
                    </Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="health" className="relative">
                  <div className="flex flex-col items-center">
                    <span>Health & Care</span>
                    <Badge variant={getHealthInfoCompletion() > 50 ? "default" : "secondary"} className="text-xs">
                      {getHealthInfoCompletion()}%
                    </Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="personal" className="relative">
                  <div className="flex flex-col items-center">
                    <span>Life & Background</span>
                    <Badge variant={getPersonalContextCompletion() > 50 ? "default" : "secondary"} className="text-xs">
                      {getPersonalContextCompletion()}%
                    </Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="communication" className="relative">
                  <div className="flex flex-col items-center">
                    <span>Communication</span>
                    <Badge variant={getCommunicationCompletion() > 50 ? "default" : "secondary"} className="text-xs">
                      {getCommunicationCompletion()}%
                    </Badge>
                  </div>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <p className="text-sm text-gray-600">Essential information about the patient</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} data-testid="input-name" />
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
                                data-testid="input-preferred-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-dob" />
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
                                    e.target.value ? parseInt(e.target.value) : undefined,
                                  )
                                }
                                data-testid="input-age"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-gender">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Phone Number *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(555) 123-4567"
                                {...field}
                                data-testid="input-phone"
                              />
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
                            <FormLabel>Alternate Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(555) 987-6543"
                                {...field}
                                data-testid="input-alternate-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="calls" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Call Preferences</h3>
                    <p className="text-sm text-gray-600">When and how often they prefer to receive calls</p>

                    <FormField
                      control={form.control}
                      name="preferredCallDays"
                      render={() => (
                        <FormItem>
                          <FormLabel>Preferred Days for Calls *</FormLabel>
                          <div className="grid grid-cols-7 gap-2">
                            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                              <FormField
                                key={day}
                                control={form.control}
                                name="preferredCallDays"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={day}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(day)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, day])
                                              : field.onChange(
                                                  field.value?.filter((value) => value !== day),
                                                );
                                          }}
                                          data-testid={`checkbox-day-${day.toLowerCase()}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {day.slice(0, 3)}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
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
                            <FormLabel>Preferred Call Time *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-call-time">
                                  <SelectValue placeholder="Select preferred time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (12:00 PM - 5:00 PM)</SelectItem>
                                <SelectItem value="evening">Evening (5:00 PM - 8:00 PM)</SelectItem>
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
                            <FormLabel>Call Frequency *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-call-frequency">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="every_other_day">Every Other Day</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="custom">Custom Schedule</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="health" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Health & Care Information</h3>
                    <p className="text-sm text-gray-600">Health conditions, medications, and care needs</p>

                    <FormField
                      control={form.control}
                      name="healthConcerns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Health Concerns</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any ongoing health conditions, concerns, or symptoms to be aware of..."
                              className="min-h-20"
                              {...field}
                              data-testid="textarea-health-concerns"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Medications</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="List current medications and dosages..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-medications"
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
                            <FormLabel>Allergies & Dietary Restrictions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Food allergies, medication allergies, dietary restrictions..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-allergies"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="mobilityLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobility Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-mobility">
                                  <SelectValue placeholder="Select mobility level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fully_mobile">Fully Mobile</SelectItem>
                                <SelectItem value="limited_mobility">Limited Mobility</SelectItem>
                                <SelectItem value="requires_assistance">Requires Assistance</SelectItem>
                                <SelectItem value="bedridden">Bedridden</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cognitiveStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cognitive Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-cognitive">
                                  <SelectValue placeholder="Select cognitive status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="mild_impairment">Mild Impairment</SelectItem>
                                <SelectItem value="moderate_impairment">Moderate Impairment</SelectItem>
                                <SelectItem value="significant_impairment">Significant Impairment</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Emergency Contacts</h4>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium">Primary Emergency Contact</h5>
                          <FormField
                            control={form.control}
                            name="primaryEmergencyContact.name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Contact name" {...field} data-testid="input-primary-contact-name" />
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
                                  <Input placeholder="e.g., Daughter, Son, Friend" {...field} data-testid="input-primary-contact-relationship" />
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
                                  <Input placeholder="(555) 123-4567" {...field} data-testid="input-primary-contact-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-3">
                          <h5 className="text-sm font-medium">Secondary Emergency Contact</h5>
                          <FormField
                            control={form.control}
                            name="secondaryEmergencyContact.name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Contact name" {...field} data-testid="input-secondary-contact-name" />
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
                                  <Input placeholder="e.g., Daughter, Son, Friend" {...field} data-testid="input-secondary-contact-relationship" />
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
                                  <Input placeholder="(555) 123-4567" {...field} data-testid="input-secondary-contact-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Life & Background</h3>
                    <p className="text-sm text-gray-600">Personal history and context that helps the AI have meaningful conversations</p>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="lifeHistory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Life History</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Major life events, career highlights, achievements, significant experiences..."
                                className="min-h-24"
                                {...field}
                                data-testid="textarea-life-history"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="favoriteMemories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favorite Memories</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Cherished memories, special moments, stories they love to tell..."
                                className="min-h-24"
                                {...field}
                                data-testid="textarea-favorite-memories"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pastCareers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Past Careers</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Work history, professional achievements, jobs they held..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-past-careers"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="educationBackground"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Education Background</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Schools attended, degrees earned, areas of study..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-education"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="currentLivingSituation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Living Situation</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Where they live, with whom, type of housing, level of independence..."
                              className="min-h-20"
                              {...field}
                              data-testid="textarea-living-situation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="socialConnections"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Social Connections</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Friends, family members, social groups, regular visitors..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-social-connections"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="culturalBackground"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cultural Background</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Heritage, traditions, cultural practices, languages spoken..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-cultural-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hobbiesAndCrafts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hobbies & Crafts</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Current and past hobbies, things they make, collections..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-hobbies"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="travelExperiences"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Travel Experiences</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Places they've been, favorite destinations, travel memories..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-travel"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="favoriteBooks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favorite Books & Authors</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Books they love, favorite authors, reading preferences..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-books"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="favoriteMusic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favorite Music</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Musical preferences, artists they enjoy, instruments they played..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-music"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="religiousSpiritual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religious & Spiritual Beliefs</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Religious affiliation, spiritual practices, beliefs that are important to them..."
                              className="min-h-20"
                              {...field}
                              data-testid="textarea-religious"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="communication" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Communication Style & Preferences</h3>
                    <p className="text-sm text-gray-600">How the AI should communicate and what topics to focus on</p>

                    <FormField
                      control={form.control}
                      name="topicsOfInterest"
                      render={() => (
                        <FormItem>
                          <FormLabel>Topics of Interest</FormLabel>
                          <div className="grid grid-cols-4 gap-2">
                            {topicsOfInterestOptions.map((topic) => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsOfInterest"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={topic}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(topic)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], topic])
                                              : field.onChange(
                                                  field.value?.filter((value) => value !== topic),
                                                );
                                          }}
                                          data-testid={`checkbox-interest-${topic.toLowerCase()}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {topic}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="personalityTraits"
                      render={() => (
                        <FormItem>
                          <FormLabel>Personality Traits</FormLabel>
                          <div className="grid grid-cols-4 gap-2">
                            {personalityTraitOptions.map((trait) => (
                              <FormField
                                key={trait}
                                control={form.control}
                                name="personalityTraits"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={trait}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(trait)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], trait])
                                              : field.onChange(
                                                  field.value?.filter((value) => value !== trait),
                                                );
                                          }}
                                          data-testid={`checkbox-trait-${trait.toLowerCase()}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {trait}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-conversation-tone">
                                <SelectValue placeholder="Select conversation tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">Formal & Respectful</SelectItem>
                              <SelectItem value="friendly">Friendly & Casual</SelectItem>
                              <SelectItem value="humorous">Humorous & Light-hearted</SelectItem>
                              <SelectItem value="gentle">Gentle & Caring</SelectItem>
                              <SelectItem value="neutral">Neutral & Professional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="communicationPreferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Communication Preferences</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="How they like to be spoken to, communication style preferences, pace of conversation..."
                              className="min-h-20"
                              {...field}
                              data-testid="textarea-communication-prefs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sensoryPreferences"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sensory Considerations</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Hearing difficulties, vision considerations, voice volume preferences..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-sensory"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="memoryConsiderations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Memory Considerations</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Memory aids needed, topics to avoid, things to remember or repeat..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-memory"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="dailyRoutine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Routine</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Their typical day structure, activities, meal times, sleep schedule..."
                              className="min-h-20"
                              {...field}
                              data-testid="textarea-routine"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentChallenges"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Challenges</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="What they're dealing with now, concerns, difficulties..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-challenges"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="motivationsGoals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Motivations & Goals</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="What keeps them going, hopes for the future, things they want to accomplish..."
                                className="min-h-20"
                                {...field}
                                data-testid="textarea-goals"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="specialInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other important information, special considerations, or instructions for the AI..."
                              className="min-h-24"
                              {...field}
                              data-testid="textarea-special-instructions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Complete more sections for better AI conversations
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addPatientMutation.isPending}
                  data-testid="button-save-patient"
                >
                  {addPatientMutation.isPending ? "Saving..." : "Create Patient Profile"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}