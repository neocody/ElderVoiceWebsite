import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, MessageSquare, TestTube, Settings, Shield, Clock, AlertTriangle, Bot, Phone, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import AdminTabs from "@/components/AdminTabs";

interface MasterPromptResponse {
  masterPrompt: string;
}

interface MCPSyncStatus {
  syncEnabled: boolean;
  mcpServerUrl: string;
  mcpApiKey: string;
  lastSync: string | null;
}

interface SystemConfig {
  aiSettings: {
    model: string;
    temperature: number;
    maxTokens: number;
    conversationTimeout: number;
  };
  callSettings: {
    maxDuration: number;
    retryAttempts: number;
    voiceSpeed: number;
    voicePitch: number;
  };
  systemLimits: {
    maxPatientsPerUser: number;
    dailyCallLimit: number;
    maxConcurrentCalls: number;
    dataRetentionDays: number;
  };
  security: {
    sessionTimeoutMinutes: number;
    requireMFA: boolean;
    enableAuditLogging: boolean;
  };
  maintenance: {
    maintenanceMode: boolean;
    scheduledMaintenance: string;
    maintenanceMessage: string;
  };
}

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ai-prompts");
  const [masterPrompt, setMasterPrompt] = useState("");
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    aiSettings: {
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 500,
      conversationTimeout: 300
    },
    callSettings: {
      maxDuration: 1800,
      retryAttempts: 3,
      voiceSpeed: 1.0,
      voicePitch: 1.0
    },
    systemLimits: {
      maxPatientsPerUser: 50,
      dailyCallLimit: 100,
      maxConcurrentCalls: 10,
      dataRetentionDays: 365
    },
    security: {
      sessionTimeoutMinutes: 60,
      requireMFA: false,
      enableAuditLogging: true
    },
    maintenance: {
      maintenanceMode: false,
      scheduledMaintenance: "",
      maintenanceMessage: "System maintenance in progress. Please check back later."
    }
  });

  // Generate sample notifications mutation
  const generateNotificationsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/notifications/generate-samples");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Test Notifications Generated",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate test notifications",
        variant: "destructive",
      });
    },
  });

  const testWelcomeEmailMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/test-welcome-email", {
        email: "admin@example.com",
        firstName: "Test",
        lastName: "Administrator",
        role: "administrator"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Welcome email sent successfully to admin@example.com",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // MCP Sync queries and mutations
  const { data: mcpStatus, isLoading: mcpStatusLoading } = useQuery<MCPSyncStatus>({
    queryKey: ["/api/admin/mcp-sync/status"],
    retry: false,
  });

  const enableMCPSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/mcp-sync/enable");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mcp-sync/status"] });
      toast({
        title: "MCP Sync Enabled",
        description: "ElevenLabs MCP server synchronization is now active.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enable MCP sync",
        variant: "destructive",
      });
    },
  });

  const disableMCPSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/mcp-sync/disable");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mcp-sync/status"] });
      toast({
        title: "MCP Sync Disabled",
        description: "ElevenLabs MCP server synchronization has been turned off.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable MCP sync",
        variant: "destructive",
      });
    },
  });

  const fullSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/mcp-sync/full-sync");
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log('MCP Sync Response:', data); // Debug log
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mcp-sync/status"] });
      toast({
        title: data.success ? "Full Sync Completed" : "Sync Completed with Warnings",
        description: data.success 
          ? "All settings synchronized to MCP server successfully." 
          : `Sync completed with ${data.errors?.length || 0} errors.`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform full sync",
        variant: "destructive",
      });
    },
  });

  // Fetch current master prompt
  const { data: promptData, isLoading } = useQuery<MasterPromptResponse>({
    queryKey: ["/api/admin/master-prompt"],
    retry: false,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (promptData?.masterPrompt) {
      setMasterPrompt(promptData.masterPrompt);
    }
  }, [promptData]);

  // Save master prompt mutation
  const saveMasterPromptMutation = useMutation({
    mutationFn: async (newPrompt: string) => {
      return await apiRequest("PUT", "/api/admin/master-prompt", { masterPrompt: newPrompt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-prompt"] });
      toast({
        title: "Master Prompt Saved",
        description: "AI conversation prompt has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save master prompt",
        variant: "destructive",
      });
    },
  });

  // Save system configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: SystemConfig) => {
      return await apiRequest("PUT", "/api/admin/system-config", configData);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "System configuration has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  const handleSavePrompt = () => {
    if (!masterPrompt.trim()) {
      toast({
        title: "Error",
        description: "Master prompt cannot be empty",
        variant: "destructive",
      });
      return;
    }
    saveMasterPromptMutation.mutate(masterPrompt);
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(systemConfig);
  };

  const resetToSaved = () => {
    if (promptData?.masterPrompt) {
      setMasterPrompt(promptData.masterPrompt);
      toast({
        title: "Reset Complete",
        description: "Prompt has been reset to saved version.",
      });
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setSystemConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: "ai-prompts", label: "AI Prompts", icon: MessageSquare },
    { id: "ai-settings", label: "AI Settings", icon: Bot },
    { id: "call-settings", label: "Call Settings", icon: Phone },
    { id: "system-limits", label: "System Limits", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
    { id: "maintenance", label: "Maintenance", icon: AlertTriangle },
    { id: "mcp-sync", label: "MCP Sync", icon: TestTube }
  ];

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">System Configuration</h2>
              <p className="text-textSecondary">Configure AI, calling, security, and system settings</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Standardized Admin Tabs */}
            <AdminTabs 
              tabs={tabs} 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
            />

            {/* AI Prompts Section */}
            {activeTab === "ai-prompts" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="text-primary" size={20} />
                    <span>Master AI Prompt Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure the universal AI behavior that applies to all patient conversations. This prompt is combined with patient-specific information during each call.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="masterPrompt">Master AI Prompt</Label>
                    <Textarea
                      id="masterPrompt"
                      value={masterPrompt}
                      onChange={(e) => setMasterPrompt(e.target.value)}
                      placeholder="Enter the master AI conversation prompt..."
                      className="min-h-[400px] font-mono text-sm"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-gray-500">
                      This prompt defines the AI's personality, conversation style, and safety guidelines for all patient interactions.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleSavePrompt}
                      disabled={saveMasterPromptMutation.isPending || isLoading}
                      className="bg-primary text-white hover:bg-blue-700"
                    >
                      <Save className="mr-2" size={16} />
                      {saveMasterPromptMutation.isPending ? "Saving..." : "Save Prompt"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetToSaved}
                      disabled={!promptData?.masterPrompt || isLoading}
                    >
                      Reset to Saved
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Settings Section */}
            {activeTab === "ai-settings" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="text-primary" size={20} />
                    <span>AI Configuration Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure OpenAI model parameters and conversation behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="aiModel">AI Model</Label>
                      <Select value={systemConfig.aiSettings.model} onValueChange={(value) => updateConfig('aiSettings', 'model', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature ({systemConfig.aiSettings.temperature})</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={systemConfig.aiSettings.temperature}
                        onChange={(e) => updateConfig('aiSettings', 'temperature', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">Controls randomness in responses (0 = deterministic, 1 = creative)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        type="number"
                        value={systemConfig.aiSettings.maxTokens}
                        onChange={(e) => updateConfig('aiSettings', 'maxTokens', parseInt(e.target.value))}
                        min="50"
                        max="2000"
                      />
                      <p className="text-xs text-gray-500">Maximum response length (50-2000 tokens)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conversationTimeout">Conversation Timeout (seconds)</Label>
                      <Input
                        type="number"
                        value={systemConfig.aiSettings.conversationTimeout}
                        onChange={(e) => updateConfig('aiSettings', 'conversationTimeout', parseInt(e.target.value))}
                        min="60"
                        max="1800"
                      />
                      <p className="text-xs text-gray-500">Maximum time for AI response generation</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    <Save className="mr-2" size={16} />
                    Save AI Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Call Settings Section */}
            {activeTab === "call-settings" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="text-primary" size={20} />
                    <span>Call Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure call duration, retry behavior, and voice settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxDuration">Max Call Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={systemConfig.callSettings.maxDuration}
                        onChange={(e) => updateConfig('callSettings', 'maxDuration', parseInt(e.target.value))}
                        min="300"
                        max="3600"
                      />
                      <p className="text-xs text-gray-500">Maximum duration for each call (5-60 minutes)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retryAttempts">Retry Attempts</Label>
                      <Input
                        type="number"
                        value={systemConfig.callSettings.retryAttempts}
                        onChange={(e) => updateConfig('callSettings', 'retryAttempts', parseInt(e.target.value))}
                        min="0"
                        max="5"
                      />
                      <p className="text-xs text-gray-500">Number of retry attempts for failed calls</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voiceSpeed">Voice Speed ({systemConfig.callSettings.voiceSpeed}x)</Label>
                      <Input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={systemConfig.callSettings.voiceSpeed}
                        onChange={(e) => updateConfig('callSettings', 'voiceSpeed', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">Speech rate for AI voice (0.5x - 2.0x)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voicePitch">Voice Pitch ({systemConfig.callSettings.voicePitch}x)</Label>
                      <Input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={systemConfig.callSettings.voicePitch}
                        onChange={(e) => updateConfig('callSettings', 'voicePitch', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">Voice pitch adjustment (0.5x - 2.0x)</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    <Save className="mr-2" size={16} />
                    Save Call Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* System Limits Section */}
            {activeTab === "system-limits" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="text-primary" size={20} />
                    <span>System Limits & Quotas</span>
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide limits and data retention policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxPatientsPerUser">Max Patients Per User</Label>
                      <Input
                        type="number"
                        value={systemConfig.systemLimits.maxPatientsPerUser}
                        onChange={(e) => updateConfig('systemLimits', 'maxPatientsPerUser', parseInt(e.target.value))}
                        min="1"
                        max="1000"
                      />
                      <p className="text-xs text-gray-500">Maximum patients each user can manage</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dailyCallLimit">Daily Call Limit</Label>
                      <Input
                        type="number"
                        value={systemConfig.systemLimits.dailyCallLimit}
                        onChange={(e) => updateConfig('systemLimits', 'dailyCallLimit', parseInt(e.target.value))}
                        min="1"
                        max="10000"
                      />
                      <p className="text-xs text-gray-500">Maximum calls per day across all users</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxConcurrentCalls">Max Concurrent Calls</Label>
                      <Input
                        type="number"
                        value={systemConfig.systemLimits.maxConcurrentCalls}
                        onChange={(e) => updateConfig('systemLimits', 'maxConcurrentCalls', parseInt(e.target.value))}
                        min="1"
                        max="100"
                      />
                      <p className="text-xs text-gray-500">Maximum simultaneous active calls</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                      <Input
                        type="number"
                        value={systemConfig.systemLimits.dataRetentionDays}
                        onChange={(e) => updateConfig('systemLimits', 'dataRetentionDays', parseInt(e.target.value))}
                        min="30"
                        max="2555"
                      />
                      <p className="text-xs text-gray-500">How long to keep call logs and data</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    <Save className="mr-2" size={16} />
                    Save System Limits
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Security Section */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="text-primary" size={20} />
                    <span>Security Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure authentication, session management, and audit logging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        type="number"
                        value={systemConfig.security.sessionTimeoutMinutes}
                        onChange={(e) => updateConfig('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                        min="5"
                        max="1440"
                      />
                      <p className="text-xs text-gray-500">Automatic logout after inactivity (5 minutes - 24 hours)</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Require Multi-Factor Authentication</Label>
                        <p className="text-xs text-gray-500">Require MFA for all user accounts</p>
                      </div>
                      <Switch
                        checked={systemConfig.security.requireMFA}
                        onCheckedChange={(checked) => updateConfig('security', 'requireMFA', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Enable Audit Logging</Label>
                        <p className="text-xs text-gray-500">Log all user actions for security monitoring</p>
                      </div>
                      <Switch
                        checked={systemConfig.security.enableAuditLogging}
                        onCheckedChange={(checked) => updateConfig('security', 'enableAuditLogging', checked)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    <Save className="mr-2" size={16} />
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Maintenance Section */}
            {activeTab === "maintenance" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="text-primary" size={20} />
                    <span>Maintenance & System Control</span>
                  </CardTitle>
                  <CardDescription>
                    Configure maintenance mode and system notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Maintenance Mode</Label>
                        <p className="text-xs text-gray-500">Enable to prevent new calls and show maintenance message</p>
                      </div>
                      <Switch
                        checked={systemConfig.maintenance.maintenanceMode}
                        onCheckedChange={(checked) => updateConfig('maintenance', 'maintenanceMode', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledMaintenance">Scheduled Maintenance</Label>
                      <Input
                        type="datetime-local"
                        value={systemConfig.maintenance.scheduledMaintenance}
                        onChange={(e) => updateConfig('maintenance', 'scheduledMaintenance', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Schedule future maintenance window</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea
                        value={systemConfig.maintenance.maintenanceMessage}
                        onChange={(e) => updateConfig('maintenance', 'maintenanceMessage', e.target.value)}
                        placeholder="Message to display during maintenance..."
                        rows={3}
                      />
                      <p className="text-xs text-gray-500">Message shown to users during maintenance</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    <Save className="mr-2" size={16} />
                    Save Maintenance Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* MCP Sync Management Section */}
            {activeTab === "mcp-sync" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TestTube className="text-primary" size={20} />
                    <span>ElevenLabs MCP Server Synchronization</span>
                  </CardTitle>
                  <CardDescription>
                    Manage synchronization between your application and ElevenLabs MCP server for reduced latency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Sync Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sync Status</Label>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${mcpStatus?.syncEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">
                          {mcpStatusLoading ? 'Loading...' : mcpStatus?.syncEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>MCP Server URL</Label>
                      <p className="text-sm text-gray-600">
                        {mcpStatusLoading ? 'Loading...' : mcpStatus?.mcpServerUrl || '[NOT SET]'}
                      </p>
                    </div>
                  </div>

                  {/* Configuration Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Key Status</Label>
                      <p className="text-sm text-gray-600">
                        {mcpStatusLoading ? 'Loading...' : mcpStatus?.mcpApiKey || '[NOT SET]'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Last Sync</Label>
                      <p className="text-sm text-gray-600">
                        {mcpStatusLoading ? 'Loading...' : mcpStatus?.lastSync || 'Never'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Expected Benefits */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Expected Benefits</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Latency Reduction:</strong> From 3-4 seconds to under 1 second</li>
                      <li>• <strong>Direct Communication:</strong> Model ↔ ElevenLabs (eliminates server round-trips)</li>
                      <li>• <strong>Voice Consistency:</strong> Maintains patient-specific ElevenLabs voices</li>
                      <li>• <strong>Better Experience:</strong> Natural conversation flow for elderly patients</li>
                    </ul>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex space-x-4">
                    {mcpStatus?.syncEnabled ? (
                      <Button
                        onClick={() => disableMCPSyncMutation.mutate()}
                        disabled={disableMCPSyncMutation.isPending}
                        variant="destructive"
                      >
                        {disableMCPSyncMutation.isPending ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Disabling...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Disable MCP Sync
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => enableMCPSyncMutation.mutate()}
                        disabled={enableMCPSyncMutation.isPending}
                      >
                        {enableMCPSyncMutation.isPending ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Enabling...
                          </>
                        ) : (
                          <>
                            <TestTube className="w-4 h-4 mr-2" />
                            Enable MCP Sync
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      onClick={() => fullSyncMutation.mutate()}
                      disabled={fullSyncMutation.isPending || !mcpStatus?.syncEnabled}
                      variant="outline"
                    >
                      {fullSyncMutation.isPending ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Full Sync Now
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Setup Instructions */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Setup Instructions</h4>
                    <div className="text-sm text-yellow-800 space-y-2">
                      <p>To configure the MCP server in your ElevenLabs account:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Log into your ElevenLabs account</li>
                        <li>Navigate to Settings → Integrations → MCP Servers</li>
                        <li>Upload the <code>mcp-server-config.json</code> file from your project</li>
                        <li>Configure webhook URLs and API keys</li>
                        <li>Test the connection and enable sync here</li>
                      </ol>
                      <p className="mt-2">
                        <strong>Note:</strong> Requires ElevenLabs subscription with MCP server access.
                      </p>
                    </div>
                  </div>

                  {/* Synchronized Items */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Items Synchronized to MCP Server</Label>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <h5 className="font-medium">Configuration Items</h5>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Master AI prompts</li>
                          <li>• Available voice options</li>
                          <li>• System configuration</li>
                          <li>• Notification templates</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">Patient Data</h5>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Patient profiles</li>
                          <li>• Voice preferences</li>
                          <li>• Conversation history</li>
                          <li>• Memory and context</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Development Testing Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="text-primary" size={20} />
                  <span>Development Testing</span>
                </CardTitle>
                <CardDescription>
                  Testing tools for development and debugging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button
                    onClick={() => generateNotificationsMutation.mutate()}
                    disabled={generateNotificationsMutation.isPending}
                    variant="outline"
                  >
                    <TestTube className="mr-2" size={16} />
                    {generateNotificationsMutation.isPending ? "Generating..." : "Generate Test Notifications"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Creates sample notifications for testing the notification system
                  </p>
                </div>
                
                <div>
                  <Button
                    onClick={() => testWelcomeEmailMutation.mutate()}
                    disabled={testWelcomeEmailMutation.isPending}
                    variant="outline"
                  >
                    <Mail className="mr-2" size={16} />
                    {testWelcomeEmailMutation.isPending ? "Sending..." : "Test Welcome Email"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Sends a test welcome email to admin@example.com to verify email templates
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
}