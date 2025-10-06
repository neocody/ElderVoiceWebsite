import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  User,
  Activity,
  RefreshCw,
  Play,
  Pause,
  TestTube,
  Volume2,
  CheckCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Country codes for international phone numbers
const countryCodes = [
  { code: "+1", country: "US/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
];

export default function LiveStatus() {
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(600000); // 10 seconds instead of 5
  const [showTestCallModal, setShowTestCallModal] = useState(false);
  const [testCallPhone, setTestCallPhone] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [activeTestCall, setActiveTestCall] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);

  // WebSocket state for system status
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const { toast } = useToast();

  // Test Websocket trigger on page load
  // Function
  const testWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const testWs = new WebSocket(
      `${protocol}//${window.location.host}/api/test-ws`,
    );

    testWs.onopen = () => {
      console.log("[TEST WS] Connected to test endpoint");

      // Send a ping message
      testWs.send(
        JSON.stringify({
          type: "ping",
          message: "Hello from client",
          timestamp: new Date().toISOString(),
        }),
      );

      // Send an echo message after 1 second
      setTimeout(() => {
        testWs.send(
          JSON.stringify({
            type: "echo",
            message: "This is a test echo message",
            timestamp: new Date().toISOString(),
          }),
        );

        console.log("message sent after a 1 second delay");
      }, 1000);
    };

    testWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[TEST WS] Received:", data);

        if (data.type === "test") {
          toast({
            title: "WebSocket Connected",
            description: data.message,
          });
        } else if (data.type === "pong") {
          toast({
            title: "Ping-Pong Success",
            description: `Server responded in ${Date.now() - new Date(data.timestamp).getTime()}ms`,
          });
        } else if (data.type === "echo_response") {
          toast({
            title: "Echo Test Success",
            description: data.message,
          });
        } else {
          toast({
            title: "WebSocket Message",
            description: `${data.type}: ${data.message}`,
          });
        }
      } catch (error) {
        console.error("[TEST WS] Error parsing message:", error);
        toast({
          title: "WebSocket Error",
          description: "Failed to parse server response",
          variant: "destructive",
        });
      }
    };

    testWs.onclose = () => {
      console.log("[TEST WS] Test connection closed");
    };

    testWs.onerror = (error) => {
      console.error("[TEST WS] WebSocket error:", error);
      toast({
        title: "WebSocket Error",
        description: "Failed to connect to test endpoint",
        variant: "destructive",
      });
    };

    // Keep connection open for 3 seconds to receive all responses
    setTimeout(() => {
      if (testWs.readyState === WebSocket.OPEN) {
        console.log("[TEST WS] Closing test connection after 3 seconds");
        testWs.close();
      }
    }, 3000);
  };

  // Test WebSocket connection on page load
  useEffect(() => {
    testWebSocket();
  }, []);

  // WebSocket connection for real-time system status
  useEffect(() => {
    if (!isLive) {
      // Disconnect WebSocket when live monitoring is paused
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/system/status/ws`;

    console.log("[SYSTEM STATUS WS] Connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[SYSTEM STATUS WS] Connected");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        console.log("[SYSTEM STATUS WS] Raw message received:", event.data);
        const message = JSON.parse(event.data);
        console.log(
          "[SYSTEM STATUS WS] Parsed message:",
          message.type,
          message.data,
        );

        if (message.type === "connection_test") {
          console.log(
            "[SYSTEM STATUS WS] Connection test received:",
            message.message,
          );
          toast({
            title: "WebSocket Connected",
            description: "Real-time system status connection established",
          });
        } else if (message.type === "system_status_update") {
          console.log(
            "[SYSTEM STATUS WS] Updating system status with:",
            message.data,
          );
          setSystemStatus(message.data);
        } else if (message.type === "system_status_error") {
          console.error("[SYSTEM STATUS WS] Error:", message.error);
          toast({
            title: "System Status Error",
            description: message.error,
            variant: "destructive",
          });
        } else {
          console.log("[SYSTEM STATUS WS] Unknown message type:", message.type);
        }
      } catch (error) {
        console.error(
          "[SYSTEM STATUS WS] Failed to parse message:",
          error,
          "Raw data:",
          event.data,
        );
      }
    };

    ws.onclose = () => {
      console.log("[SYSTEM STATUS WS] Disconnected");
      setWsConnected(false);
      setSystemStatus(null);

      // Attempt to reconnect after 5 seconds if still live
      if (isLive) {
        setTimeout(() => {
          console.log("[SYSTEM STATUS WS] Attempting to reconnect...");
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error("[SYSTEM STATUS WS] Error:", error);
      setWsConnected(false);
    };

    // Cleanup on unmount or when isLive changes
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isLive, toast]);

  // Poll for call status updates when there's an active test call
  const { data: callStatusData } = useQuery({
    queryKey: ["/api/calls", activeTestCall?.callSid],
    enabled: !!activeTestCall?.callSid,
    refetchInterval: 5000, // Poll every 5 seconds instead of 2
  });

  // Update call duration every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTestCall && activeTestCall.status !== "completed") {
      interval = setInterval(() => {
        setCallDuration(
          Math.floor((Date.now() - activeTestCall.startTime.getTime()) / 1000),
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTestCall]);

  // Update call status based on polling data
  useEffect(() => {
    if (Array.isArray(callStatusData) && activeTestCall) {
      const callRecord = callStatusData.find(
        (call: any) => call.callSid === activeTestCall.callSid,
      );
      if (callRecord) {
        const newStatus =
          callRecord.status === "in-progress"
            ? "live"
            : callRecord.status === "completed"
              ? "completed"
              : callRecord.status === "ringing"
                ? "connecting"
                : activeTestCall.status;

        if (newStatus !== activeTestCall.status) {
          setActiveTestCall((prev: any) => ({ ...prev, status: newStatus }));

          // Auto-close popup after call completes
          if (newStatus === "completed") {
            setTimeout(() => {
              setActiveTestCall(null);
              toast({
                title: "Call Completed",
                description: `Call ended after ${Math.floor(callDuration / 60)}m ${callDuration % 60}s`,
              });
            }, 3000);
          }
        }
      }
    }
  }, [callStatusData, activeTestCall, callDuration, toast]);

  const { data: activeCallsData, refetch: refetchActiveCalls } = useQuery({
    queryKey: ["/api/calls/active"],
    refetchInterval: isLive ? refreshInterval : false,
  });

  const { data: queueData, refetch: refetchQueue } = useQuery({
    queryKey: ["/api/calls/queue"],
    refetchInterval: isLive ? refreshInterval : false,
  });

  // Fallback to polling if WebSocket is not available
  const { data: fallbackSystemStatus } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: isLive && !wsConnected ? refreshInterval : false,
    enabled: !wsConnected, // Only use polling as fallback
  });

  const { data: elderlyUsers } = useQuery({
    queryKey: ["/api/elderly-users"],
  });

  // Use WebSocket data if available, otherwise fallback to polling data
  const currentSystemStatus = systemStatus || fallbackSystemStatus;

  const testCallMutation = useMutation({
    mutationFn: async (data: { phone: string; elderlyUserId: number }) => {
      return await apiRequest("POST", "/api/test-call", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setActiveTestCall({
        id: data.callSid,
        callSid: data.callSid,
        phone: testCallPhone,
        patientName:
          elderlyUsers?.find((p: any) => p.id === parseInt(selectedPatientId))
            ?.name || "Unknown",
        status: "connecting",
        startTime: new Date(),
      });
      setCallDuration(0);
      toast({
        title: "Test Call Started",
        description: data.message || `Calling ${testCallPhone}...`,
      });
      setShowTestCallModal(false);
    },
    onError: (error: any) => {
      console.error("Test call error:", error);

      // Handle phone validation errors
      if (error.message.includes("Invalid US phone number")) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter exactly 10 digits (e.g., 5551234567)",
          variant: "destructive",
        });
      } else if (
        error.message.includes("Phone number verification required") ||
        error.message.includes("trial")
      ) {
        toast({
          title: "Phone Verification Required",
          description:
            "Twilio trial accounts can only call verified numbers. Check console for verification steps.",
          variant: "destructive",
        });

        // Log verification steps to console for user reference
        console.log("=== TWILIO PHONE VERIFICATION STEPS ===");
        console.log("1. Log into your Twilio Console (twilio.com/console)");
        console.log("2. Go to Phone Numbers > Manage > Verified Caller IDs");
        console.log("3. Add and verify the phone number you want to call");
        console.log(
          "4. Or upgrade to a paid Twilio account to call any number",
        );
        console.log("=========================================");
      } else {
        toast({
          title: "Call Failed",
          description: error.message || "Failed to initiate test call",
          variant: "destructive",
        });
      }
    },
  });

  const hangUpMutation = useMutation({
    mutationFn: async (callSid: string) => {
      const response = await apiRequest(
        "POST",
        `/api/test-call/${callSid}/hangup`,
        {},
      );
      return response.json();
    },
    onSuccess: () => {
      setActiveTestCall(null);
      toast({
        title: "Call Ended",
        description: "Test call has been terminated",
      });
    },
  });

  // Mutation for testing WebSocket connection
  const testWebSocketMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/conversational-ai/test",
        {},
      );
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "WebSocket Test Successful",
        description: `ElevenLabs WebSocket connection working. Response time: ${data.responseTime}ms`,
      });
    },
    onError: (error: any) => {
      console.error("WebSocket test error:", error);
      toast({
        title: "WebSocket Test Failed",
        description:
          error.message ||
          "Failed to connect to ElevenLabs WebSocket. Check your agent configuration.",
        variant: "destructive",
      });
    },
  });

  const testWebSocketConnection = () => {
    testWebSocketMutation.mutate();
  };

  // Get additional real data for dashboard stats
  const { data: callsData } = useQuery({
    queryKey: ["/api/calls"],
    refetchInterval: isLive ? refreshInterval : false,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: isLive ? refreshInterval : false,
  });

  // Use real data from API calls
  const activeCalls = activeCallsData || [];
  const queuedCalls = queueData || [];

  function formatUptime(ms: number) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  // Create real status object from actual API data
  const status = {
    totalActiveUsers: elderlyUsers?.length || 0,
    callsInProgress: activeCalls.length || 0,
    callsInQueue: queuedCalls.length || 0,
    systemHealth: currentSystemStatus?.systemHealth || "healthy",
    twilioStatus: currentSystemStatus?.twilioStatus || "operational",
    openaiStatus: currentSystemStatus?.openaiStatus || "operational",
    uptime: formatUptime(currentSystemStatus?.uptime) || "Running",
    callsToday: dashboardStats?.callsToday || 0,
    totalCalls: callsData?.length || 0,
    lastUpdate: new Date().toISOString(),
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Starting now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "text-green-600 bg-green-100";
      case "ringing":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "normal":
        return "text-green-600 bg-green-100";
      case "low":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "neutral":
        return "text-yellow-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-semibold text-textPrimary">
                  Live Call Status
                </h2>
                <p className="text-textSecondary">
                  Real-time monitoring of call activities and system health
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                ></div>
                <span className="text-sm text-textSecondary">
                  {isLive ? "Live" : "Paused"}
                </span>
                {/* WebSocket connection indicator */}
                {isLive && (
                  <div className="flex items-center space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-yellow-500"}`}
                    ></div>
                    <span className="text-xs text-textSecondary">
                      {wsConnected ? "WS" : "Polling"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTestCallModal(true)}
              >
                <TestTube className="mr-2" size={16} />
                Test Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testWebSocketConnection}
                disabled={testWebSocketMutation.isPending}
              >
                <Volume2 className="mr-2" size={16} />
                {testWebSocketMutation.isPending
                  ? "Testing..."
                  : "Test WebSocket"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchActiveCalls();
                  refetchQueue();
                }}
              >
                <RefreshCw className="mr-2" size={16} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? (
                  <Pause className="mr-2" size={16} />
                ) : (
                  <Play className="mr-2" size={16} />
                )}
                {isLive ? "Pause" : "Resume"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const protocol =
                    window.location.protocol === "https:" ? "wss:" : "ws:";
                  const testWs = new WebSocket(
                    `${protocol}//${window.location.host}/api/test-ws`,
                  );

                  testWs.onopen = () => {
                    console.log("[TEST WS] Connected to test endpoint");

                    // Send a ping message
                    testWs.send(
                      JSON.stringify({
                        type: "ping",
                        message: "Hello from client",
                        timestamp: new Date().toISOString(),
                      }),
                    );

                    // Send an echo message after 1 second
                    setTimeout(() => {
                      testWs.send(
                        JSON.stringify({
                          type: "echo",
                          message: "This is a test echo message",
                          timestamp: new Date().toISOString(),
                        }),
                      );
                    }, 1000);
                  };

                  testWs.onmessage = (event) => {
                    try {
                      const data = JSON.parse(event.data);
                      console.log("[TEST WS] Received:", data);

                      if (data.type === "test") {
                        toast({
                          title: "WebSocket Connected",
                          description: data.message,
                        });
                      } else if (data.type === "pong") {
                        toast({
                          title: "Ping-Pong Success",
                          description: `Server responded in ${Date.now() - new Date(data.timestamp).getTime()}ms`,
                        });
                      } else if (data.type === "echo_response") {
                        toast({
                          title: "Echo Test Success",
                          description: data.message,
                        });
                      } else {
                        toast({
                          title: "WebSocket Message",
                          description: `${data.type}: ${data.message}`,
                        });
                      }
                    } catch (error) {
                      console.error("[TEST WS] Error parsing message:", error);
                      toast({
                        title: "WebSocket Error",
                        description: "Failed to parse server response",
                        variant: "destructive",
                      });
                    }
                  };

                  testWs.onclose = () => {
                    console.log("[TEST WS] Test connection closed");
                  };

                  testWs.onerror = (error) => {
                    console.error("[TEST WS] WebSocket error:", error);
                    toast({
                      title: "WebSocket Error",
                      description: "Failed to connect to test endpoint",
                      variant: "destructive",
                    });
                  };
                }}
              >
                <CheckCircle className="mr-2" size={16} />
                Custom Test
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Calls
                </CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {status.callsInProgress}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Queued Calls
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {status.callsInQueue}
                </div>
                <p className="text-xs text-muted-foreground">
                  Waiting to be placed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status.totalActiveUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {status.uptime}
                </div>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active Calls ({activeCalls?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="queue">
                Call Queue ({queuedCalls?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="system">System Status</TabsTrigger>
            </TabsList>

            {/* Active Calls Tab */}
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Active Calls</CardTitle>
                  <CardDescription>Calls currently in progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeCalls.length === 0 ? (
                    <div className="text-center py-12">
                      <PhoneOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-textPrimary mb-2">
                        No Active Calls
                      </h3>
                      <p className="text-textSecondary">
                        All calls have been completed or are queued.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeCalls.map((call: any) => (
                        <div
                          key={call.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Phone className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-textPrimary">
                                  {call.elderlyUserName}
                                </h3>
                                <p className="text-sm text-textSecondary">
                                  {call.elderlyUserPhone}
                                </p>
                                <p className="text-xs text-textSecondary">
                                  Call ID: {call.callSid}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    className={getStatusColor(call.status)}
                                  >
                                    {call.status
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </Badge>
                                  {call.sentiment && (
                                    <Badge
                                      variant="outline"
                                      className={getSentimentColor(
                                        call.sentiment,
                                      )}
                                    >
                                      {call.sentiment}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mt-1">
                                  Duration: {formatDuration(call.duration)}
                                </p>
                                <p className="text-xs text-textSecondary">
                                  Started:{" "}
                                  {new Date(
                                    call.startedAt,
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue">
              <Card>
                <CardHeader>
                  <CardTitle>Call Queue</CardTitle>
                  <CardDescription>Upcoming scheduled calls</CardDescription>
                </CardHeader>
                <CardContent>
                  {queuedCalls.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-textPrimary mb-2">
                        No Queued Calls
                      </h3>
                      <p className="text-textSecondary">
                        No calls are currently scheduled.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {queuedCalls.map((call: any) => (
                        <div
                          key={call.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-textPrimary">
                                  {call.elderlyUserName}
                                </h3>
                                <p className="text-sm text-textSecondary">
                                  {call.elderlyUserPhone}
                                </p>
                                {call.retryCount > 0 && (
                                  <p className="text-xs text-orange-600">
                                    Retry #{call.retryCount}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2 justify-end">
                                <Badge
                                  className={getPriorityColor(call.priority)}
                                >
                                  {call.priority.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium mt-1">
                                In {formatTimeUntil(call.scheduledAt)}
                              </p>
                              <p className="text-xs text-textSecondary">
                                {new Date(
                                  call.scheduledAt,
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Status Tab */}
            <TabsContent value="system">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Status</CardTitle>
                    <CardDescription>
                      External service health monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Twilio Voice API</span>
                      <Badge className="bg-green-100 text-green-800">
                        {status.twilioStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">OpenAI API</span>
                      <Badge className="bg-green-100 text-green-800">
                        {status.openaiStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">System Health</span>
                      <Badge className="bg-green-100 text-green-800">
                        {status.systemHealth.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>
                      Real-time system performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>System Uptime</span>
                        <span>{status.uptime}</span>
                      </div>
                      <Progress value={99.8} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Call Success Rate</span>
                        <span>97.2%</span>
                      </div>
                      <Progress value={97.2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Average Response Time</span>
                        <span>2.3s</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Test Call Modal */}
      <Dialog open={showTestCallModal} onOpenChange={setShowTestCallModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Test Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCountryCode}
                  onValueChange={setSelectedCountryCode}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={
                    selectedCountryCode === "+1" ? "5551234567" : "Phone number"
                  }
                  value={testCallPhone}
                  onChange={(e) => setTestCallPhone(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                📞 Full number: {selectedCountryCode}
                {testCallPhone.replace(/\D/g, "")}
                {selectedCountryCode === "+1" &&
                  ` (${testCallPhone.replace(/\D/g, "").length}/10 digits)`}
              </p>
              <p className="text-xs text-muted-foreground">
                For Twilio trial accounts, verify this number in your console
                first.
              </p>
            </div>
            <div>
              <Label htmlFor="patient">Patient Profile</Label>
              <Select
                value={selectedPatientId}
                onValueChange={setSelectedPatientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient for AI to simulate" />
                </SelectTrigger>
                <SelectContent>
                  {elderlyUsers?.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowTestCallModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (testCallPhone && selectedPatientId) {
                    const fullPhoneNumber =
                      selectedCountryCode + testCallPhone.replace(/\D/g, "");
                    testCallMutation.mutate({
                      phone: fullPhoneNumber,
                      elderlyUserId: parseInt(selectedPatientId),
                    });
                  }
                }}
                disabled={
                  !testCallPhone.trim() ||
                  !selectedPatientId ||
                  testCallMutation.isPending
                }
              >
                {testCallMutation.isPending ? "Calling..." : "Start Call"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Test Call Popup */}
      {activeTestCall && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="w-80 shadow-lg border-2 border-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  {activeTestCall.status === "connecting" && (
                    <PhoneCall className="mr-2 h-5 w-5 text-yellow-500 animate-pulse" />
                  )}
                  {activeTestCall.status === "live" && (
                    <PhoneCall className="mr-2 h-5 w-5 text-green-500" />
                  )}
                  {activeTestCall.status === "completed" && (
                    <PhoneOff className="mr-2 h-5 w-5 text-gray-500" />
                  )}
                  Test Call
                </CardTitle>
                <Badge
                  variant={
                    activeTestCall.status === "live"
                      ? "default"
                      : activeTestCall.status === "completed"
                        ? "secondary"
                        : "outline"
                  }
                  className={
                    activeTestCall.status === "live"
                      ? "bg-green-500"
                      : activeTestCall.status === "connecting"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                  }
                >
                  {activeTestCall.status === "connecting"
                    ? "Connecting"
                    : activeTestCall.status === "live"
                      ? "Live"
                      : activeTestCall.status === "completed"
                        ? "Completed"
                        : activeTestCall.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Calling:</span>
                <span className="font-medium">{activeTestCall.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Patient:</span>
                <span className="font-medium">
                  {activeTestCall.patientName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="font-medium">
                  {activeTestCall.status === "completed"
                    ? `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`
                    : `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`}
                </span>
              </div>
              {activeTestCall.status === "completed" && (
                <div className="p-2 bg-gray-50 rounded-md">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      Call ID: {activeTestCall.callSid?.substring(0, 8)}...
                    </div>
                    <div>Status: Call completed successfully</div>
                    <div>AI Voice: ElevenLabs Premium</div>
                  </div>
                </div>
              )}
              {activeTestCall.status !== "completed" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => hangUpMutation.mutate(activeTestCall.id)}
                  disabled={hangUpMutation.isPending}
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  {hangUpMutation.isPending ? "Hanging up..." : "End Call"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTestCall(null)}
                >
                  Close
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}
