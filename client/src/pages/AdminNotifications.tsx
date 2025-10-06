import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import AdminTabs from "@/components/AdminTabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  Shield,
  Trash2,
  Plus,
  Phone,
  Send,
  Edit2,
  Settings,
} from "lucide-react";


// Notification Template Schema
const notificationTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Notification type is required"),
  emailSubject: z.string().min(1, "Email subject is required"),
  emailBody: z.string().min(1, "Email body is required"),
  smsTemplate: z.string().optional(),
  isActive: z.boolean().default(true),
  targetUserTypes: z.array(z.string()).min(1, "At least one user type must be selected"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  category: z.string().min(1, "Category is required"),
});

// Admin Notification Preferences Schema
const notificationPreferencesSchema = z.object({
  smsNotificationsEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  failedCallsThreshold: z.number().min(1).max(100),
  failedCallsTimeWindow: z.number().min(5).max(1440),
  negativeSentimentThreshold: z.string().regex(/^0\.\d{1,2}$|^1\.00$/, "Must be between 0.00 and 1.00"),
  systemAlertsEnabled: z.boolean(),
  billingAlertsEnabled: z.boolean(),
  maintenanceAlertsEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
  escalationEnabled: z.boolean(),
  escalationDelay: z.number().min(1).max(1440),
  notificationFrequency: z.string(),
});

type NotificationTemplate = {
  id: number;
  name: string;
  type: string;
  emailSubject: string;
  emailBody: string;
  smsTemplate?: string;
  isActive: boolean;
  targetUserTypes: string[];
  priority: "low" | "normal" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");

  const notificationTabs = [
    { id: "templates", label: "Templates", icon: Settings },
    { id: "preferences", label: "Preferences", icon: Bell },
    { id: "testing", label: "Testing", icon: Send }
  ];
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // Fetch notification templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/admin/notification-templates"],
    retry: false,
  });

  // Template form
  const templateForm = useForm<z.infer<typeof notificationTemplateSchema>>({
    resolver: zodResolver(notificationTemplateSchema),
    defaultValues: {
      name: "",
      type: "",
      emailSubject: "",
      emailBody: "",
      smsTemplate: "",
      isActive: true,
      targetUserTypes: [],
      priority: "normal",
      category: "",
    },
  });

  // Preferences form
  const preferencesForm = useForm<z.infer<typeof notificationPreferencesSchema>>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      smsNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      failedCallsThreshold: 3,
      failedCallsTimeWindow: 60,
      negativeSentimentThreshold: "0.30",
      systemAlertsEnabled: true,
      billingAlertsEnabled: true,
      maintenanceAlertsEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      escalationEnabled: true,
      escalationDelay: 15,
      notificationFrequency: "immediate",
    },
  });

  // Mutations
  const createTemplate = useMutation({
    mutationFn: async (data: z.infer<typeof notificationTemplateSchema>) => {
      return await apiRequest("POST", "/api/admin/notification-templates", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
      setIsTemplateDialogOpen(false);
      templateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof notificationTemplateSchema> }) => {
      return await apiRequest("PUT", `/api/admin/notification-templates/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/notification-templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const initializeDefaultTemplates = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/notification-templates/initialize-defaults");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data.message || "Default templates created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create default templates",
        variant: "destructive",
      });
    },
  });

  const testEmailAlert = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/admin/test-email-alert", { email });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Test email alert sent successfully",
      });
      setTestEmailAddress("");
    },
    onError: (error: Error) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const testSmsAlert = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return await apiRequest("POST", "/api/admin/test-sms-alert", { phoneNumber });
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent",
        description: "Test SMS alert sent successfully",
      });
      setTestPhoneNumber("");
    },
    onError: (error: Error) => {
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send test SMS",
        variant: "destructive",
      });
    },
  });

  // Handle template editing
  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    templateForm.reset({
      name: template.name,
      type: template.type,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      smsTemplate: template.smsTemplate || "",
      isActive: template.isActive,
      targetUserTypes: template.targetUserTypes,
      priority: template.priority,
      category: template.category,
    });
    setIsTemplateDialogOpen(true);
  };

  const onTemplateSubmit = (data: z.infer<typeof notificationTemplateSchema>) => {
    if (selectedTemplate) {
      updateTemplate.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplate.mutate(data);
    }
  };

  const onPreferencesSubmit = (data: z.infer<typeof notificationPreferencesSchema>) => {
    toast({
      title: "Success",
      description: "Notification preferences updated successfully",
    });
  };

  const notificationTypes = [
    "call_failed", "call_completed", "patient_concern", "system_alert", 
    "billing_issue", "maintenance_scheduled", "user_created", "subscription_expiring"
  ];

  const userTypes = ["administrator", "facility_manager", "member", "family_member"];
  const categories = ["System", "Billing", "Patient Care", "Maintenance", "Security"];

  return (
    <Layout>
      <div className="p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage notification templates, preferences, and system alerts.
            </p>
          </div>

          <AdminTabs 
            tabs={notificationTabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            className="mb-6"
          />

          {activeTab === "templates" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Notification Templates</h2>
                <div className="flex gap-2">
                  {(!templates || templates.length === 0) && (
                    <Button
                      onClick={() => initializeDefaultTemplates.mutate()}
                      disabled={initializeDefaultTemplates.isPending}
                      variant="outline"
                      className="btn-primary-enhanced"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {initializeDefaultTemplates.isPending ? "Creating..." : "Add Default Templates"}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedTemplate(null);
                      templateForm.reset();
                      setIsTemplateDialogOpen(true);
                    }}
                    className="btn-primary-enhanced"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </div>

              <Card className="card-enhanced">
                <CardContent className="p-0">
                  {templatesLoading ? (
                    <div className="p-8 text-center">Loading templates...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Target Users</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templates?.map((template: NotificationTemplate) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>{template.type}</TableCell>
                            <TableCell>{template.category}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  template.priority === "urgent" ? "destructive" :
                                  template.priority === "high" ? "default" : "secondary"
                                }
                              >
                                {template.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {template.targetUserTypes.map((type) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={template.isActive ? "default" : "secondary"}>
                                {template.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTemplate(template)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTemplate.mutate(template.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Alert Thresholds & Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide notification preferences and alert thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={preferencesForm.control}
                          name="failedCallsThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Failed Calls Threshold</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Number of failed calls before triggering an alert
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="negativeSentimentThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Negative Sentiment Threshold</FormLabel>
                              <FormControl>
                                <Input placeholder="0.30" {...field} />
                              </FormControl>
                              <FormDescription>
                                Sentiment score threshold for concern alerts (0.00 - 1.00)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={preferencesForm.control}
                          name="emailNotificationsEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Email Notifications
                                </FormLabel>
                                <FormDescription>Send alerts via email</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="smsNotificationsEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  SMS Notifications
                                </FormLabel>
                                <FormDescription>Send alerts via SMS</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="btn-primary-enhanced">
                        Save Preferences
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "testing" && (
            <div className="space-y-6">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-500" />
                    Alert Testing
                  </CardTitle>
                  <CardDescription>
                    Test notification delivery to verify configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium flex items-center gap-2 mb-3">
                      <Mail className="h-4 w-4" />
                      Email Alert Testing
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email address"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => testEmailAlert.mutate(testEmailAddress)}
                        disabled={!testEmailAddress || testEmailAlert.isPending}
                        className="btn-primary-enhanced"
                      >
                        {testEmailAlert.isPending ? "Sending..." : "Send Test Email"}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium flex items-center gap-2 mb-3">
                      <Phone className="h-4 w-4" />
                      SMS Alert Testing
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter phone number (+1234567890)"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => testSmsAlert.mutate(testPhoneNumber)}
                        disabled={!testPhoneNumber || testSmsAlert.isPending}
                        className="btn-primary-enhanced"
                      >
                        {testSmsAlert.isPending ? "Sending..." : "Send Test SMS"}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <strong>Note:</strong> For Twilio trial accounts, the receiving phone number must be verified in your Twilio console.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Template Dialog */}
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? "Edit Template" : "Create Template"}
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate ? "Update the notification template" : "Create a new notification template"}
                </DialogDescription>
              </DialogHeader>

              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Failed Call Alert" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={templateForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {notificationTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={templateForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={templateForm.control}
                    name="emailSubject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Call Failed: {patientName}" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="emailBody"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Body</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A call to {patientName} has failed. Please check the system for details."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="smsTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMS Template (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Call failed for {patientName}. Check AI Companion dashboard."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Template</FormLabel>
                          <FormDescription>
                            Enable this template for notifications
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTemplateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="btn-primary-enhanced"
                      disabled={createTemplate.isPending || updateTemplate.isPending}
                    >
                      {createTemplate.isPending || updateTemplate.isPending ? "Saving..." : "Save Template"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}