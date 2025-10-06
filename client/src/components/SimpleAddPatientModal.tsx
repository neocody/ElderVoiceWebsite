import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";


// Simplified schema focused on conversation-relevant information
const simplePatientSchema = z.object({
  // Essential Info
  name: z.string().min(1, "Name is required"),
  preferredName: z.string().optional(),
  age: z.number().min(1, "Age is required").max(120, "Age must be realistic"),
  phone: z.string().min(10, "Valid phone number is required"),

  // Call Preferences
  preferredCallDays: z.array(z.string()).min(1, "Select at least one day"),
  preferredCallTime: z.enum(["morning", "afternoon", "evening"]),
  callFrequency: z.enum(["daily", "every_other_day", "weekly"]),

  // Life & Personality - Key for AI conversations
  lifeStory: z.string().optional(),
  familyInfo: z.string().optional(), 
  hobbiesInterests: z.string().optional(),
  favoriteTopics: z.string().optional(),
  personalityTraits: z.string().optional(),

  // Important Context
  healthStatus: z.string().optional(),
  specialNotes: z.string().optional(),
  conversationStyle: z.enum(["formal", "friendly", "casual", "gentle"]),

  // Emergency Contact
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
});

type SimplePatientForm = z.infer<typeof simplePatientSchema>;

const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

interface SimpleAddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SimpleAddPatientModal({ open, onOpenChange }: SimpleAddPatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SimplePatientForm>({
    resolver: zodResolver(simplePatientSchema),
    defaultValues: {
      name: "",
      preferredName: "",
      age: undefined,
      phone: "",
      preferredCallDays: [],
      preferredCallTime: "morning",
      callFrequency: "daily",
      lifeStory: "",
      familyInfo: "",
      hobbiesInterests: "",
      favoriteTopics: "",
      personalityTraits: "",
      healthStatus: "",
      specialNotes: "",
      conversationStyle: "friendly",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: SimplePatientForm) => {
      const response = await apiRequest("POST", "/api/elderly-users", data);
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Patient Added",
        description: "New patient has been added successfully.",
      });
      // Force immediate refresh of patient list
      await queryClient.invalidateQueries({ queryKey: ["/api/elderly-users"] });
      await queryClient.refetchQueries({ queryKey: ["/api/elderly-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
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

  const onSubmit = (data: SimplePatientForm) => {
    addPatientMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add a New Patient</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                
                {/* Essential Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Essential Information</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                          <FormLabel>Preferred Name</FormLabel>
                          <FormControl>
                            <Input placeholder="What they like to be called" {...field} />
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
                          <FormLabel>Age *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter age" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Call Preferences */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Call Preferences</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="preferredCallDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Call Days *</FormLabel>
                          <div className="grid grid-cols-4 gap-2">
                            {daysOfWeek.map((day) => (
                              <FormItem
                                key={day.id}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, day.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== day.id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
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
                            <FormLabel>Preferred Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time of day" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                                <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
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
                            <FormLabel>Call Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="every_other_day">Every Other Day</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-900">AI Voice Configuration</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Voice and conversation settings are managed through ElevenLabs Conversational AI agent configuration. 
                        The AI will use your pre-configured agent settings for optimal performance and consistency.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Life & Personality */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">About Their Life & Personality</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This information helps the AI have more meaningful and personal conversations.
                  </p>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="lifeStory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Life Story & Background</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about their career, achievements, life experiences..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="familyInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Family & Relationships</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about their family, children, grandchildren, spouse..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hobbiesInterests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hobbies & Interests</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What do they love to do? Gardening, reading, sports, music..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="favoriteTopics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favorite Conversation Topics</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What do they enjoy talking about? Current events, old movies, cooking..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="personalityTraits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personality & Communication Style</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How do they like to be spoken to? Formal, casual, humorous..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Health & Special Notes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Health & Special Notes</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="healthStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Health Status</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any important health information that affects conversations..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="specialNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Notes & Instructions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Anything important for the AI to remember during calls..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="conversationStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conversation Style</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select conversation style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">Formal & Respectful</SelectItem>
                              <SelectItem value="friendly">Friendly & Warm</SelectItem>
                              <SelectItem value="casual">Casual & Relaxed</SelectItem>
                              <SelectItem value="gentle">Gentle & Caring</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency contact name" {...field} />
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
                          <FormLabel>Contact Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency contact phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-blue-700"
                disabled={addPatientMutation.isPending}
              >
                {addPatientMutation.isPending ? "Adding..." : "Add Patient"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}