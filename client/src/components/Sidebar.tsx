import {
  Heart,
  Home,
  Phone,
  Bell,
  CreditCard,
  DollarSign,
  Settings,
  LogOut,
  Activity,
  Shield,
  UserCheck,
  Building2,
  User,
  Cog,
  Mail,
  Package,
  Ticket,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [currentViewRole, setCurrentViewRole] = useState(
    (user as any)?.role || "member",
  );

  // Check if current page should show view switcher (shared pages only, not admin-only pages)
  const shouldShowViewSwitcher =
    (user as any)?.role === "administrator" &&
    (location.includes("/dashboard") ||
      // location.includes("/clients") ||
      location.includes("/services") ||
      location.includes("/call-logs") ||
      location.includes("/live-status") ||
      location.includes("/notifications") ||
      location.includes("/settings")) &&
    !(
      location.includes("/user-management") ||
      location.includes("/team") ||
      location.includes("/billing-admin") ||
      location.includes("/revenue") ||
      location.includes("/notification-preferences") ||
      location.includes("/alert-config") ||
      location.includes("/system-settings") ||
      location.includes("/config")
    );

  // Administrator core application features - same as regular users
  const adminCoreNavigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },
    // { name: "Clients", href: "/admin/clients", icon: Building2 },
    { name: "Call Logs", href: "/admin/call-logs", icon: Phone },
    { name: "Live Status", href: "/admin/live-status", icon: Activity },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  // Administrator management functions - admin-only features
  const adminManagementNavigation = [
    { name: "Team", href: "/admin/team", icon: UserCheck },
    { name: "Service Plans", href: "/admin/services", icon: Package },
    { name: "Coupon Codes", href: "/admin/coupon", icon: Ticket },
    { name: "Revenue", href: "/admin/billing-admin", icon: DollarSign },
    { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
    { name: "Alert Config", href: "/admin/alert-config", icon: Bell },
    { name: "Config", href: "/admin/system-settings", icon: Cog },
    { name: "Monitoring", href: "/admin/system-monitoring", icon: Activity },
  ];

  // Elderly Care Facility navigation - facility-scoped access
  const facilityNavigation = [
    { name: "Dashboard", href: "/facility/dashboard", icon: Home },
    // { name: "Clients", href: "/facility/clients", icon: Building2 },
    { name: "Call Logs", href: "/facility/call-logs", icon: Phone },
    { name: "Live Status", href: "/facility/live-status", icon: Activity },
    { name: "Notifications", href: "/facility/notifications", icon: Bell },
    { name: "Billing", href: "/facility/billing", icon: CreditCard },
    { name: "Settings", href: "/facility/settings", icon: Settings },
  ];

  // Regular Member navigation - personal/family-scoped access
  const memberNavigation = [
    { name: "Dashboard", href: "/member/dashboard", icon: Home },
    // { name: "Clients", href: "/member/clients", icon: Building2 },
    { name: "Call Logs", href: "/member/call-logs", icon: Phone },
    { name: "Notifications", href: "/member/notifications", icon: Bell },
    { name: "Billing", href: "/member/billing", icon: CreditCard },
    { name: "Settings", href: "/member/settings", icon: Settings },
  ];

  // Get navigation based on user role
  const getNavigationForRole = (role: string) => {
    switch (role) {
      case "administrator":
        return {
          core: adminCoreNavigation,
          management: adminManagementNavigation,
        };
      case "facility_manager":
        return { core: facilityNavigation, management: [] };
      case "member":
      case "family_member":
      default:
        return { core: memberNavigation, management: [] };
    }
  };

  const navigation = getNavigationForRole(currentViewRole);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getDisplayName = (
    firstName?: string | null,
    lastName?: string | null,
  ) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "User";
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case "administrator":
        return "Administrator";
      case "facility_manager":
        return "Facility Manager";
      case "member":
        return "Regular Member";
      case "family_member":
        return "Family Member";
      default:
        return "Member";
    }
  };

  const getPortalTitle = (role: string) => {
    switch (role) {
      case "administrator":
        return "Admin Portal";
      case "facility_manager":
        return "Facility Portal";
      case "member":
      case "family_member":
      default:
        return "Member Portal";
    }
  };

  return (
    <div className="w-60 min-w-60 max-w-60 sidebar-nav flex flex-col flex-shrink-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Heart className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI Companion</h1>
            <p className="text-sm text-white/80">
              {getPortalTitle(currentViewRole)}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-7rem)]">
        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-4">
          {/* Core Application Features */}
          <div className="space-y-1">
            {navigation.core?.map((item: any) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`sidebar-nav-item flex items-center space-x-3 px-3 py-2 font-medium cursor-pointer ${
                      isActive
                        ? "sidebar-nav-item active text-white"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Admin Management Functions - Only for administrators */}
          {navigation.management && navigation.management.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-2 mt-6">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Administration
                </h3>
              </div>
              {navigation.management?.map((item: any) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`sidebar-nav-item flex items-center space-x-3 px-3 py-2 font-medium cursor-pointer ${
                        isActive
                          ? "sidebar-nav-item active text-white"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Admin View Switcher - Only shown for administrators on shared pages */}
        {shouldShowViewSwitcher && (
          <div className="px-4 py-4 border-t border-white/20">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium text-white/80">
                  View As
                </span>
              </div>
              <Select
                value={currentViewRole}
                onValueChange={setCurrentViewRole}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="facility_manager">
                    Facility Manager
                  </SelectItem>
                  <SelectItem value="member">Regular Member</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-white/70">
                Switch views to see different user experiences
              </p>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="px-4 py-6 border-t border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-sm font-medium">
                {getInitials((user as any)?.firstName, (user as any)?.lastName)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {getDisplayName(
                  (user as any)?.firstName,
                  (user as any)?.lastName,
                )}
              </p>
              <p className="text-xs text-white/70">
                {getRoleDisplay(currentViewRole)}
                {(user as any)?.role === "administrator" &&
                  currentViewRole !== "administrator" && (
                    <span className="text-white/90"> (Viewing as)</span>
                  )}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-white/70 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
