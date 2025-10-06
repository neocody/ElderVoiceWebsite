import type { Express } from "express";
import { isAuthenticated } from "../middleware/auth";
import { storage } from "../storage";
import { healthCheckService } from "../services/healthCheckService";
import { cacheService } from "../services/cacheService";
import { getSystemStats } from "../services/systemStatsService";

export function registerAdminStatsRoutes(app: Express) {
  // Comprehensive admin dashboard statistics
  app.get("/api/admin/stats/overview", isAuthenticated, async (req, res) => {
    try {
      // Accessing the cargiverId from the request
      const caregiverId = req?.query?.caregiverId;
      // Get all data needed for admin stats from database
      const elderlyUsers = await storage.getElderlyUsers(caregiverId);
      const calls = await storage.getCalls();
      const schedules = await storage.getSchedules();
      const notifications = await storage.getNotifications("all");

      // Create representative data for admin stats
      const users = elderlyUsers.map((eu) => ({
        id: eu.caregiverId,
        createdAt: eu.createdAt,
        isActive: eu.isActive,
      }));
      const facilities = [];
      const adminUsers = [];
      const approvalRequests = [];

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate call statistics
      const callsToday = calls.filter(
        (call) => call.createdAt && new Date(call.createdAt) >= today,
      ).length;

      const callsThisWeek = calls.filter(
        (call) => call.createdAt && new Date(call.createdAt) >= thisWeek,
      ).length;

      const callsThisMonth = calls.filter(
        (call) => call.createdAt && new Date(call.createdAt) >= thisMonth,
      ).length;

      const completedCalls = calls.filter(
        (call) => call.status === "completed",
      ).length;
      const failedCalls = calls.filter(
        (call) => call.status === "failed",
      ).length;
      const activeCalls = calls.filter(
        (call) => call.status === "in-progress",
      ).length;

      // Calculate user statistics
      const activeUsers = users.filter(
        (user) => user.isActive !== false,
      ).length;
      const newUsersThisWeek = users.filter(
        (user) => user.createdAt && new Date(user.createdAt) >= thisWeek,
      ).length;

      const newUsersThisMonth = users.filter(
        (user) => user.createdAt && new Date(user.createdAt) >= thisMonth,
      ).length;

      // Calculate patient statistics
      const activePatients = elderlyUsers.filter(
        (user) => user.isActive !== false,
      ).length;
      const newPatientsThisWeek = elderlyUsers.filter(
        (user) => user.createdAt && new Date(user.createdAt) >= thisWeek,
      ).length;

      const newPatientsThisMonth = elderlyUsers.filter(
        (user) => user.createdAt && new Date(user.createdAt) >= thisMonth,
      ).length;

      // Calculate schedule statistics
      const activeSchedules = schedules.filter(
        (schedule) => schedule.isActive,
      ).length;
      const totalScheduledCalls = schedules.reduce(
        (sum, schedule) => sum + (schedule.frequency || 1),
        0,
      );

      // Calculate notification statistics
      const unreadNotifications = notifications.filter(
        (notif) => !notif.read,
      ).length;
      const urgentNotifications = notifications.filter(
        (notif) => notif.priority === "urgent" && !notif.read,
      ).length;

      // Calculate facility statistics
      const activeFacilities = facilities.filter(
        (facility) => facility.isActive,
      ).length;
      const totalFacilityPatients = facilities.reduce(
        (sum, facility) => sum + (facility.patientCount || 0),
        0,
      );

      // Calculate approval statistics
      const pendingApprovals = approvalRequests.filter(
        (req) => req.status === "pending",
      ).length;
      const approvedThisMonth = approvalRequests.filter(
        (req) =>
          req.status === "approved" &&
          req.updatedAt &&
          new Date(req.updatedAt) >= thisMonth,
      ).length;

      // Calculate success rates
      const callSuccessRate =
        calls.length > 0 ? (completedCalls / calls.length) * 100 : 0;
      const userGrowthRate =
        users.length > 0 ? (newUsersThisMonth / users.length) * 100 : 0;
      const patientGrowthRate =
        elderlyUsers.length > 0
          ? (newPatientsThisMonth / elderlyUsers.length) * 100
          : 0;

      res.json({
        // Overview metrics
        totalUsers: users.length,
        activeUsers,
        totalPatients: elderlyUsers.length,
        activePatients,
        totalCalls: calls.length,
        activeCalls,
        totalFacilities: facilities.length,
        activeFacilities,

        // Call statistics
        callsToday,
        callsThisWeek,
        callsThisMonth,
        completedCalls,
        failedCalls,
        callSuccessRate: Math.round(callSuccessRate * 100) / 100,

        // User statistics
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,

        // Patient statistics
        newPatientsThisWeek,
        newPatientsThisMonth,
        patientGrowthRate: Math.round(patientGrowthRate * 100) / 100,

        // Schedule statistics
        activeSchedules,
        totalScheduledCalls,

        // Notification statistics
        unreadNotifications,
        urgentNotifications,

        // Facility statistics
        totalFacilityPatients,

        // Approval statistics
        pendingApprovals,
        approvedThisMonth,

        // System health
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching admin overview stats:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch admin stats",
      });
    }
  });

  // Billing statistics
  app.get("/api/admin/stats/billing", isAuthenticated, async (req, res) => {
    try {
      const [subscriptions, transactions] = await Promise.all([
        storage.getSubscriptions?.() || [],
        storage.getBillingTransactions?.() || [],
      ]);

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Calculate subscription statistics
      const activeSubscriptions = subscriptions.filter(
        (sub) => sub.status === "active",
      ).length;
      const trialSubscriptions = subscriptions.filter(
        (sub) => sub.status === "trial",
      ).length;
      const canceledSubscriptions = subscriptions.filter(
        (sub) => sub.status === "canceled",
      ).length;

      const newSubscriptionsThisMonth = subscriptions.filter(
        (sub) => sub.createdAt && new Date(sub.createdAt) >= thisMonth,
      ).length;

      // Calculate revenue statistics
      const thisMonthTransactions = transactions.filter(
        (txn) => txn.processedAt && new Date(txn.processedAt) >= thisMonth,
      );

      const lastMonthTransactions = transactions.filter(
        (txn) =>
          txn.processedAt &&
          new Date(txn.processedAt) >= lastMonth &&
          new Date(txn.processedAt) < thisMonth,
      );

      const monthlyRevenue = thisMonthTransactions.reduce(
        (sum, txn) => sum + (txn.status === "completed" ? txn.amount : 0),
        0,
      );

      const lastMonthRevenue = lastMonthTransactions.reduce(
        (sum, txn) => sum + (txn.status === "completed" ? txn.amount : 0),
        0,
      );

      const totalRevenue = transactions.reduce(
        (sum, txn) => sum + (txn.status === "completed" ? txn.amount : 0),
        0,
      );

      const averageRevenuePerUser =
        activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;
      const revenueGrowthRate =
        lastMonthRevenue > 0
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      // Calculate transaction statistics
      const successfulTransactions = transactions.filter(
        (txn) => txn.status === "completed",
      ).length;
      const failedTransactions = transactions.filter(
        (txn) => txn.status === "failed",
      ).length;
      const pendingTransactions = transactions.filter(
        (txn) => txn.status === "pending",
      ).length;

      const transactionSuccessRate =
        transactions.length > 0
          ? (successfulTransactions / transactions.length) * 100
          : 0;

      res.json({
        // Subscription metrics
        totalSubscriptions: subscriptions.length,
        activeSubscriptions,
        trialSubscriptions,
        canceledSubscriptions,
        newSubscriptionsThisMonth,

        // Revenue metrics
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,

        // Transaction metrics
        totalTransactions: transactions.length,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        transactionSuccessRate: Math.round(transactionSuccessRate * 100) / 100,

        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching billing stats:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch billing stats",
      });
    }
  });

  // System performance statistics
  app.get("/api/admin/stats/system", isAuthenticated, async (req, res) => {
    try {
      const stats = await getSystemStats({ healthCheckService, cacheService });
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch system stats",
      });
    }
  });

  // Call analytics statistics
  app.get("/api/admin/stats/calls", isAuthenticated, async (req, res) => {
    try {
      const [callStats, engagementStats] = await Promise.all([
        storage.getCallStats(),
        storage.getEngagementStats(),
      ]);

      res.json({
        ...callStats,
        ...engagementStats,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching call stats:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch call stats",
      });
    }
  });
}
