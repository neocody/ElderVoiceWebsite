import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { User, Bell, Shield, Globe, Save } from "lucide-react";
import Layout from "@/components/Layout";

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredName: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    callReminders: boolean;
    weeklyReports: boolean;
    emergencyAlerts: boolean;
  };
  preferences: {
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
    theme: string;
  };
  privacy: {
    allowDataSharing: boolean;
    recordCallConsent: boolean;
    shareWithFamily: boolean;
    emergencyContactAccess: boolean;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);

  // Default user settings
  const defaultSettings: UserSettings = {
    profile: {
      firstName: "",
      lastName: "",
      email: user?.email || "",
      phone: "",
      preferredName: ""
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      callReminders: true,
      weeklyReports: false,
      emergencyAlerts: true
    },
    preferences: {
      timezone: "America/New_York",
      language: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12hour",
      theme: "light"
    },
    privacy: {
      allowDataSharing: false,
      recordCallConsent: true,
      shareWithFamily: true,
      emergencyContactAccess: true
    }
  };

  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/user/settings"],
  });

  // Update local settings when server data loads
  useEffect(() => {
    if (userSettings) {
      setLocalSettings({
        profile: { ...defaultSettings.profile, ...((userSettings as any).profile || {}) },
        notifications: { ...defaultSettings.notifications, ...((userSettings as any).notifications || {}) },
        preferences: { ...defaultSettings.preferences, ...((userSettings as any).preferences || {}) },
        privacy: { ...defaultSettings.privacy, ...((userSettings as any).privacy || {}) }
      });
    } else {
      setLocalSettings(defaultSettings);
    }
  }, [userSettings, user]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UserSettings) => {
      return await apiRequest("/api/user/settings", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
      setHasChanges(false);
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
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    if (localSettings) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  const updateSetting = (category: keyof UserSettings, key: string, value: any) => {
    if (!localSettings) return;
    
    setHasChanges(true);
    setLocalSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
    });
  };

  // Show loading state
  if (settingsLoading || !localSettings) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
              <p className="text-muted-foreground">
                Manage your profile, notifications, and preferences
              </p>
            </div>
            {hasChanges && (
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    value={localSettings.profile.firstName}
                    onChange={(e) => updateSetting('profile', 'firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input 
                    value={localSettings.profile.lastName}
                    onChange={(e) => updateSetting('profile', 'lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    type="email"
                    value={localSettings.profile.email}
                    onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    type="tel"
                    value={localSettings.profile.phone}
                    onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Name</Label>
                <Input 
                  value={localSettings.profile.preferredName}
                  onChange={(e) => updateSetting('profile', 'preferredName', e.target.value)}
                  placeholder="How would you like to be addressed?"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Choose how you'd like to receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive updates and alerts via email
                  </div>
                </div>
                <Switch 
                  checked={localSettings.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive urgent alerts via text message
                  </div>
                </div>
                <Switch 
                  checked={localSettings.notifications.smsNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Call Reminders</Label>
                  <div className="text-sm text-muted-foreground">
                    Get reminders before scheduled calls
                  </div>
                </div>
                <Switch 
                  checked={localSettings.notifications.callReminders}
                  onCheckedChange={(checked) => updateSetting('notifications', 'callReminders', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Reports</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive weekly summary reports
                  </div>
                </div>
                <Switch 
                  checked={localSettings.notifications.weeklyReports}
                  onCheckedChange={(checked) => updateSetting('notifications', 'weeklyReports', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Emergency Alerts</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive immediate emergency notifications
                  </div>
                </div>
                <Switch 
                  checked={localSettings.notifications.emergencyAlerts}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emergencyAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Display Preferences</CardTitle>
              </div>
              <CardDescription>
                Customize your interface and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={localSettings.preferences.timezone} 
                    onValueChange={(value) => updateSetting('preferences', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                      <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={localSettings.preferences.language} 
                    onValueChange={(value) => updateSetting('preferences', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español (Spanish)</SelectItem>
                      <SelectItem value="fr">Français (French)</SelectItem>
                      <SelectItem value="de">Deutsch (German)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select 
                    value={localSettings.preferences.dateFormat} 
                    onValueChange={(value) => updateSetting('preferences', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select 
                    value={localSettings.preferences.timeFormat} 
                    onValueChange={(value) => updateSetting('preferences', 'timeFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12hour">12 Hour</SelectItem>
                      <SelectItem value="24hour">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Privacy & Consent</CardTitle>
              </div>
              <CardDescription>
                Manage your data privacy and sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Call Recording Consent</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow calls to be recorded for quality and training purposes
                  </div>
                </div>
                <Switch 
                  checked={localSettings.privacy.recordCallConsent}
                  onCheckedChange={(checked) => updateSetting('privacy', 'recordCallConsent', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Share with Family</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow family members to access your call summaries
                  </div>
                </div>
                <Switch 
                  checked={localSettings.privacy.shareWithFamily}
                  onCheckedChange={(checked) => updateSetting('privacy', 'shareWithFamily', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Emergency Contact Access</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow emergency contacts to access your information if needed
                  </div>
                </div>
                <Switch 
                  checked={localSettings.privacy.emergencyContactAccess}
                  onCheckedChange={(checked) => updateSetting('privacy', 'emergencyContactAccess', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Data Sharing for Improvements</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow anonymized data to be used to improve the service
                  </div>
                </div>
                <Switch 
                  checked={localSettings.privacy.allowDataSharing}
                  onCheckedChange={(checked) => updateSetting('privacy', 'allowDataSharing', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </Layout>
  );
}