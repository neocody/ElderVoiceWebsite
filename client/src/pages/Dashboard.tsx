import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import Layout from "@/components/Layout";

import StatsCard from "@/components/StatsCard";
import AddUserModal from "@/components/AddUserModal";
import EditUserModal from "@/components/EditUserModal";
import NotificationBell from "@/components/NotificationBell";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Users,
  Phone,
  Clock,
  Search,
  Plus,
  Eye,
  Edit,
  PhoneCall,
} from "lucide-react";
import { access } from "fs";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // State for managing search results box
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch dashboard data
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: adminStats } = useQuery({
    queryKey: [`/api/admin/stats/overview?caregiverId=${user?.id}`],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every 60 seconds instead of 10
  });

  const { data: elderlyUsers = [] } = useQuery({
    queryKey: ["/api/elderly-users"],
    enabled: isAuthenticated,
  });

  const { data: recentCalls = [] } = useQuery({
    queryKey: ["/api/calls", { limit: 5 }],
    enabled: isAuthenticated,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications", { unreadOnly: true }],
    enabled: isAuthenticated,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const callDate = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - callDate.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-secondary/10 text-secondary";
      case "needs_attention":
        return "bg-accent/10 text-accent";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-secondary/10 text-secondary";
      case "missed":
        return "bg-red-100 text-red-600";
      case "failed":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatCallStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "missed":
        return "Missed";
      case "failed":
        return "Failed";
      case "in_progress":
        return "In Progress";
      default:
        return status;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // User search onchange function
  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
    console.log("I am the searched valye", searchTerm);

    if (searchTerm.trim().length !== 0) {
      const filteredUsers = elderlyUsers.filter((user: any) =>
        user.name.toLowerCase().includes(searchTerm),
      );
      setSearchResults(filteredUsers);
      console.log(filteredUsers);
    }
  };

  return (
    <Layout>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-textPrimary">
                Dashboard
              </h2>
              <p className="text-textSecondary">
                Welcome back, {user?.firstName || "User"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary"
                  size={16}
                />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={handleUserSearch}
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 w-64"
                />
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Add User Button */}
              <Button
                onClick={() => setAddUserModalOpen(true)}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Plus className="mr-2" size={16} />
                Add User
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value={adminStats?.totalUsers || 0}
              change={`+${adminStats?.newUsersThisMonth || 0}`}
              changeLabel="new this month"
              changeType="positive"
              icon={Users}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
            />
            <StatsCard
              title="Calls Today"
              value={adminStats?.callsToday || 0}
              change={`${adminStats?.callSuccessRate || 0}%`}
              changeLabel="success rate"
              changeType="positive"
              icon={Phone}
              iconColor="text-secondary"
              iconBgColor="bg-secondary/10"
            />
            <StatsCard
              title="Active Patients"
              value={adminStats?.activePatients || 0}
              change={`+${adminStats?.newPatientsThisMonth || 0}`}
              changeLabel="new this month"
              changeType="positive"
              icon={Users}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
            />
            <StatsCard
              title="System Health"
              value={adminStats?.healthyServices || 0}
              change={`${adminStats?.totalServices || 0} services`}
              changeLabel="total monitored"
              changeType="neutral"
              icon={Clock}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Calls */}
            <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-textPrimary">
                    Recent Calls
                  </h3>
                  <a
                    href="/call-logs"
                    className="text-primary font-medium hover:text-blue-700"
                  >
                    View All
                  </a>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentCalls.length === 0 ? (
                    <p className="text-textSecondary text-center py-8">
                      No recent calls
                    </p>
                  ) : (
                    recentCalls.map((call: any) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-textPrimary font-medium">
                              {call.elderlyUser
                                ? getInitials(call.elderlyUser.name)
                                : "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-textPrimary">
                              {call.elderlyUser?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-textSecondary">
                              {call.elderlyUser?.phone || ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getCallStatusColor(call.status)}`}
                            >
                              {formatCallStatus(call.status)}
                            </span>
                            <span className="text-sm text-textSecondary">
                              {formatDuration(call.duration)}
                            </span>
                          </div>
                          <p className="text-xs text-textSecondary mt-1">
                            {call.createdAt
                              ? formatTimeAgo(call.createdAt)
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Calls */}
            <div className="bg-surface rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-textPrimary">
                  Upcoming Calls
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {elderlyUsers.slice(0, 4).map((user: any, index: number) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 rounded-r-lg ${
                        index === 0
                          ? "border-l-4 border-primary bg-primary/5"
                          : "border-l-4 border-gray-300 bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? "bg-primary/20" : "bg-gray-200"
                        }`}
                      >
                        <Phone
                          className={`text-sm ${
                            index === 0 ? "text-primary" : "text-gray-500"
                          }`}
                          size={14}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-textPrimary text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-textSecondary">
                          {index === 0
                            ? "Today at 2:30 PM"
                            : "Tomorrow at 10:00 AM"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button className="w-full text-center py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors">
                    View Full Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User Management Section */}
          <div className="mt-8 bg-surface rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-textPrimary">
                  Active Users
                </h3>
                <div className="flex items-center space-x-2">
                  <Select>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="recent">Recently Called</SelectItem>
                      <SelectItem value="missed">Missed Calls</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setAddUserModalOpen(true)}
                    className="bg-primary text-white hover:bg-blue-700"
                  >
                    <Plus className="mr-2" size={16} />
                    Add User
                  </Button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Last Call
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Next Call
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {elderlyUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-textSecondary"
                      >
                        No elderly users found. Add your first user to get
                        started.
                      </td>
                    </tr>
                  ) : (
                    elderlyUsers.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-textPrimary font-medium text-sm">
                                {getInitials(user.name)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-textPrimary">
                                {user.name}
                              </div>
                              {user.age && (
                                <div className="text-sm text-textSecondary">
                                  Age {user.age}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                          {user.lastCall
                            ? formatTimeAgo(user.lastCall)
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                          Tomorrow 10:00 AMa
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}
                          >
                            {user.status === "active"
                              ? "Active"
                              : user.status === "needs_attention"
                                ? "Needs Attention"
                                : user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-primary hover:text-blue-700">
                              <Eye size={16} />
                            </button>
                            <button
                              className="text-textSecondary hover:text-textPrimary"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit size={16} />
                            </button>
                            <button className="text-primary hover:text-blue-700">
                              <PhoneCall size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {elderlyUsers.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-textSecondary">
                    Showing 1 to {elderlyUsers.length} of {elderlyUsers.length}{" "}
                    users
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button size="sm" className="bg-primary text-white">
                      1
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <AddUserModal
          open={addUserModalOpen}
          onOpenChange={setAddUserModalOpen}
        />

        <EditUserModal
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUser(null);
            }
          }}
          user={editingUser}
        />
      </div>
    </Layout>
  );
}
