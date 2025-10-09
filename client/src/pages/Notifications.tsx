import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bell, CheckCircle, AlertTriangle, Info, MessageSquare, Phone, Calendar, Settings, Check } from "lucide-react";

// Mock notifications data for development
const mockNotifications = [
  {
    id: 1,
    type: "call_completed",
    title: "Call Completed Successfully",
    message: "Your scheduled call with Margaret Thompson was completed successfully. Duration: 8 minutes.",
    elderlyUserId: 1,
    elderlyUserName: "Margaret Thompson",
    createdAt: new Date().toISOString(),
    isRead: false
  },
  {
    id: 2,
    type: "call_failed",
    title: "Call Failed - Retry Scheduled",
    message: "Unable to reach Robert Johnson at scheduled time. System will automatically retry in 30 minutes.",
    elderlyUserId: 2,
    elderlyUserName: "Robert Johnson",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 3,
    type: "schedule_reminder",
    title: "Upcoming Call Reminder",
    message: "Reminder: You have a call scheduled with Eleanor Davis in 15 minutes.",
    elderlyUserId: 3,
    elderlyUserName: "Eleanor Davis",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true
  },
  {
    id: 4,
    type: "system_alert",
    title: "Monthly Usage Alert",
    message: "You have used 85% of your monthly call allocation. Consider upgrading your plan.",
    elderlyUserId: null,
    elderlyUserName: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 5,
    type: "wellbeing_alert",
    title: "Wellbeing Check Alert",
    message: "Margaret Thompson mentioned feeling lonely during today's call. Consider scheduling additional check-ins.",
    elderlyUserId: 1,
    elderlyUserName: "Margaret Thompson",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    isRead: true
  }
];

export default function Notifications() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [mockReadStatus, setMockReadStatus] = useState<Record<number, boolean>>({});

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      // If using mock data, handle locally
      if (notifications.length === 0) {
        setMockReadStatus(prev => ({ ...prev, [notificationId]: true }));
        return { success: true };
      }
      // Otherwise call the API
      await apiRequest(`/api/notifications/${notificationId}/read`, "PATCH");
    },
    onSuccess: (data, notificationId) => {
      // Only invalidate queries if we actually called the API
      if (notifications.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
      toast({
        title: "Notification marked as read",
        description: "The notification has been updated.",
      });
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
        description: "Failed to update notification.",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // If using mock data, handle locally
      if (notifications.length === 0) {
        const allMockIds = mockNotifications.reduce((acc, n) => {
          acc[n.id] = true;
          return acc;
        }, {} as Record<number, boolean>);
        setMockReadStatus(allMockIds);
        return { success: true };
      }
      // Otherwise call the API
      await apiRequest("/api/notifications/mark-all-read", "PATCH");
    },
    onSuccess: () => {
      // Only invalidate queries if we actually called the API
      if (notifications.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
      toast({
        title: "All notifications marked as read",
        description: "Your notification list has been cleared.",
      });
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
        description: "Failed to mark notifications as read.",
        variant: "destructive",
      });
    },
  });

  

  // Apply mock read status to mock notifications if we're using them
  const currentNotifications = notifications.length > 0 
    ? notifications 
    : mockNotifications.map(n => ({
        ...n,
        isRead: mockReadStatus[n.id] ?? n.isRead
      }));


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "call_completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "call_failed":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "schedule_reminder":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case "system_alert":
        return <Settings className="h-5 w-5 text-orange-600" />;
      case "wellbeing_alert":
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "call_completed":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "call_failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "schedule_reminder":
        return <Badge className="bg-blue-100 text-blue-800">Reminder</Badge>;
      case "system_alert":
        return <Badge className="bg-orange-100 text-orange-800">Alert</Badge>;
      case "wellbeing_alert":
        return <Badge className="bg-purple-100 text-purple-800">Wellbeing</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const filterNotifications = (notifications: any[], filter: string) => {
    switch (filter) {
      case "unread":
        return notifications.filter(n => !n.isRead);
      case "calls":
        return notifications.filter(n => n.type.includes("call"));
      case "alerts":
        return notifications.filter(n => n.type.includes("alert"));
      default:
        return notifications;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = currentNotifications.filter(n => !n.isRead).length;

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">Notifications</h2>
              <div className="text-textSecondary flex items-center">
                Stay updated on call activities and system alerts
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-primary/10 text-primary">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            >
              <Check className="mr-2" size={16} />
              Mark All Read
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filterNotifications(currentNotifications, "all").map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsReadMutation.mutate}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationBadge={getNotificationBadge}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </TabsContent>

            <TabsContent value="unread" className="space-y-4">
              {filterNotifications(currentNotifications, "unread").map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsReadMutation.mutate}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationBadge={getNotificationBadge}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
              {filterNotifications(currentNotifications, "unread").length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">All caught up!</h3>
                  <p className="text-textSecondary">No unread notifications.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="calls" className="space-y-4">
              {filterNotifications(currentNotifications, "calls").map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsReadMutation.mutate}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationBadge={getNotificationBadge}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {filterNotifications(currentNotifications, "alerts").map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsReadMutation.mutate}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationBadge={getNotificationBadge}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </Layout>
  );
}

interface NotificationCardProps {
  notification: any;
  onMarkAsRead: (id: number) => void;
  getNotificationIcon: (type: string) => JSX.Element;
  getNotificationBadge: (type: string) => JSX.Element;
  formatTimeAgo: (dateStr: string) => string;
}

function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  getNotificationIcon, 
  getNotificationBadge, 
  formatTimeAgo 
}: NotificationCardProps) {
  return (
    <Card className={`${!notification.isRead ? 'border-l-4 border-l-primary bg-blue-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-textPrimary">{notification.title}</h3>
                {getNotificationBadge(notification.type)}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
              <p className="text-textSecondary text-sm">{notification.message}</p>
              {notification.elderlyUserName && (
                <p className="text-xs text-textSecondary">
                  Related to: {notification.elderlyUserName}
                </p>
              )}
              <p className="text-xs text-textSecondary">
                {formatTimeAgo(notification.createdAt)}
              </p>
            </div>
          </div>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="ml-2"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}