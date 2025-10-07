import { UserStorage } from "./user";
import { ElderlyUserStorage } from "./elderly-user";
import { CallStorage } from "./call";
import { ScheduleStorage } from "./schedule";
import { NotificationStorage } from "./notification";
import { AdminStorage } from "./admin";
import { SubscriptionStorage } from "./subscription";
import { PatientMemoryStorage } from "./patient-memory";
import { SystemSettingsStorage } from "./system-settings";
import { ServiceStorage } from "./service";
import { TeamMemberStorage } from "./team-member";
import { ClientUsageStorage } from "./client-usage";
import { CouponStorage } from "./coupon";
import { IStorage } from "./interfaces/storage.interface";
import type { InsertCoupon } from "@shared/schema";
import { db } from "../db";

export class DatabaseStorage implements IStorage {
  private userStorage: UserStorage;
  private elderlyUserStorage: ElderlyUserStorage;
  private callStorage: CallStorage;
  private scheduleStorage: ScheduleStorage;
  private notificationStorage: NotificationStorage;
  private adminStorage: AdminStorage;
  private subscriptionStorage: SubscriptionStorage;
  private patientMemoryStorage: PatientMemoryStorage;
  private systemSettingsStorage: SystemSettingsStorage;
  private serviceStorage: ServiceStorage;
  private teamMemberStorage: TeamMemberStorage;
  private clientUsageStorage: ClientUsageStorage;
  private couponStorage: CouponStorage;

  constructor(private db: any) {
    this.userStorage = new UserStorage(db);
    this.elderlyUserStorage = new ElderlyUserStorage(db);
    this.callStorage = new CallStorage(db);
    this.scheduleStorage = new ScheduleStorage(db);
    this.notificationStorage = new NotificationStorage(db);
    this.adminStorage = new AdminStorage(db);
    this.subscriptionStorage = new SubscriptionStorage(db);
    this.patientMemoryStorage = new PatientMemoryStorage(db);
    this.systemSettingsStorage = new SystemSettingsStorage(db);
    this.serviceStorage = new ServiceStorage(db);
    this.teamMemberStorage = new TeamMemberStorage(db);
    this.clientUsageStorage = new ClientUsageStorage(db);
    this.couponStorage = new CouponStorage(db);
  }

  // User operations - delegate to UserStorage
  async getUser(id: string) {
    return this.userStorage.getUser(id);
  }

  async upsertUser(user: any) {
    return this.userStorage.upsertUser(user);
  }

  async getUserByEmail(email: string) {
    return this.userStorage.getUserByEmail(email);
  }

  async createUser(user: any) {
    return this.userStorage.createUser(user);
  }

  async updateUser(id: string, updates: any) {
    return this.userStorage.updateUser(id, updates);
  }

  async getUserByStripeCustomerId(stripeCustomerId: string) {
    return this.userStorage.getUserByStripeCustomerId(stripeCustomerId);
  }

  async hasActiveSubscription(userId: string) {
    return this.userStorage.hasActiveSubscription(userId);
  }

  // Elderly User operations - delegate to ElderlyUserStorage
  async getElderlyUsers(caregiverId: string) {
    return this.elderlyUserStorage.getElderlyUsers(caregiverId);
  }

  async getElderlyUser(id: number) {
    return this.elderlyUserStorage.getElderlyUser(id);
  }

  async createElderlyUser(user: any) {
    return this.elderlyUserStorage.createElderlyUser(user);
  }

  async updateElderlyUser(id: number, updates: any) {
    return this.elderlyUserStorage.updateElderlyUser(id, updates);
  }

  async deleteElderlyUser(id: number) {
    return this.elderlyUserStorage.deleteElderlyUser(id);
  }

  // Call operations - delegate to CallStorage
  async getCalls(elderlyUserId?: number, limit?: number) {
    return this.callStorage.getCalls(elderlyUserId, limit);
  }

  async getCall(id: number) {
    return this.callStorage.getCall(id);
  }

  async createCall(call: any) {
    return this.callStorage.createCall(call);
  }

  async updateCall(id: number, updates: any) {
    return this.callStorage.updateCall(id, updates);
  }

  async getCallStats() {
    return this.callStorage.getCallStats();
  }

  async getEngagementStats() {
    return this.callStorage.getEngagementStats();
  }

  // Schedule operations - delegate to ScheduleStorage
  async getSchedules(elderlyUserId?: number) {
    return this.scheduleStorage.getSchedules(elderlyUserId);
  }

  async createSchedule(schedule: any) {
    return this.scheduleStorage.createSchedule(schedule);
  }

  async updateSchedule(id: number, updates: any) {
    return this.scheduleStorage.updateSchedule(id, updates);
  }

  async deleteSchedule(id: number) {
    return this.scheduleStorage.deleteSchedule(id);
  }

  // Notification operations - delegate to NotificationStorage
  async getNotifications(userId: string, unreadOnly?: boolean, limit?: number) {
    return this.notificationStorage.getNotifications(userId, unreadOnly, limit);
  }

  async getNotification(id: number) {
    return this.notificationStorage.getNotification(id);
  }

  async createNotification(notification: any) {
    return this.notificationStorage.createNotification(notification);
  }

  async markNotificationRead(id: number) {
    return this.notificationStorage.markNotificationRead(id);
  }

  async markAllNotificationsRead(userId: string) {
    return this.notificationStorage.markAllNotificationsRead(userId);
  }

  async deleteNotification(id: number) {
    return this.notificationStorage.deleteNotification(id);
  }

  async getNotificationTemplates(isActive?: boolean) {
    return this.notificationStorage.getNotificationTemplates(isActive);
  }

  async getNotificationTemplate(id: number) {
    return this.notificationStorage.getNotificationTemplate(id);
  }

  async getNotificationTemplateByType(type: any) {
    return this.notificationStorage.getNotificationTemplateByType(type);
  }

  async createNotificationTemplate(template: any) {
    return this.notificationStorage.createNotificationTemplate(template);
  }

  async updateNotificationTemplate(id: number, updates: any) {
    return this.notificationStorage.updateNotificationTemplate(id, updates);
  }

  async deleteNotificationTemplate(id: number) {
    return this.notificationStorage.deleteNotificationTemplate(id);
  }

  async getNotificationPreferences(userId: string) {
    return this.notificationStorage.getNotificationPreferences(userId);
  }

  async createNotificationPreferences(preferences: any) {
    return this.notificationStorage.createNotificationPreferences(preferences);
  }

  async updateNotificationPreferences(userId: string, updates: any) {
    return this.notificationStorage.updateNotificationPreferences(
      userId,
      updates,
    );
  }

  async sendNotification(
    templateId: number,
    userId: string,
    elderlyUserId?: number,
    variables?: any,
  ) {
    return this.notificationStorage.sendNotification(
      templateId,
      userId,
      elderlyUserId,
      variables,
    );
  }

  async processNotificationQueue() {
    return this.notificationStorage.processNotificationQueue();
  }

  // Admin operations - delegate to AdminStorage
  async getFacilities() {
    return this.adminStorage.getFacilities();
  }

  async createFacility(facility: any) {
    return this.adminStorage.createFacility(facility);
  }

  async updateFacilityStatus(id: string, status: string) {
    return this.adminStorage.updateFacilityStatus(id, status);
  }

  async getApprovalRequests() {
    return this.adminStorage.getApprovalRequests();
  }

  async processApprovalRequest(
    id: string,
    approved: boolean,
    processedBy: string,
  ) {
    return this.adminStorage.processApprovalRequest(id, approved, processedBy);
  }

  async getAdminNotificationPreferences() {
    return this.adminStorage.getAdminNotificationPreferences();
  }

  async updateAdminNotificationPreferences(preferences: any) {
    return this.adminStorage.updateAdminNotificationPreferences(preferences);
  }

  async createDefaultAdminNotificationPreferences() {
    return this.adminStorage.createDefaultAdminNotificationPreferences();
  }

  // Patient Memory operations - delegate to PatientMemoryStorage
  async getPatientMemory(elderlyUserId: number, limit?: number) {
    return this.patientMemoryStorage.getPatientMemory(elderlyUserId, limit);
  }

  async createPatientMemory(memory: any) {
    return this.patientMemoryStorage.createPatientMemory(memory);
  }

  async updatePatientMemory(id: number, updates: any) {
    return this.patientMemoryStorage.updatePatientMemory(id, updates);
  }

  async deletePatientMemory(id: number) {
    return this.patientMemoryStorage.deletePatientMemory(id);
  }

  async getPatientMemoryByType(elderlyUserId: number, memoryType: string) {
    return this.patientMemoryStorage.getPatientMemoryByType(
      elderlyUserId,
      memoryType,
    );
  }

  async getPatientMemoryByTags(elderlyUserId: number, tags: string[]) {
    return this.patientMemoryStorage.getPatientMemoryByTags(
      elderlyUserId,
      tags,
    );
  }

  async generateConversationInsights(elderlyUserId: number) {
    return this.patientMemoryStorage.generateConversationInsights(
      elderlyUserId,
    );
  }

  // System Settings operations - delegate to SystemSettingsStorage
  async getSystemSetting(key: string) {
    return this.systemSettingsStorage.getSystemSetting(key);
  }

  async getSystemSettingsByCategory(category: string) {
    return this.systemSettingsStorage.getSystemSettingsByCategory(category);
  }

  async setSystemSetting(
    key: string,
    value: any,
    category: string,
    description?: string,
  ) {
    return this.systemSettingsStorage.setSystemSetting(
      key,
      value,
      category,
      description,
    );
  }

  async deleteSystemSetting(key: string) {
    return this.systemSettingsStorage.deleteSystemSetting(key);
  }

  async getAllSystemSettings() {
    return this.systemSettingsStorage.getAllSystemSettings();
  }

  async getUserSettings(userId: string, category?: string) {
    return this.systemSettingsStorage.getUserSettings(userId, category);
  }

  async getUserSetting(userId: string, category: string) {
    return this.systemSettingsStorage.getUserSetting(userId, category);
  }

  async setUserSetting(userId: string, category: string, settings: any) {
    return this.systemSettingsStorage.setUserSetting(
      userId,
      category,
      settings,
    );
  }

  async deleteUserSetting(userId: string, category: string) {
    return this.systemSettingsStorage.deleteUserSetting(userId, category);
  }

  async getMasterPrompt() {
    return this.systemSettingsStorage.getMasterPrompt();
  }

  async setMasterPrompt(prompt: string, createdBy: string) {
    return this.systemSettingsStorage.setMasterPrompt(prompt, createdBy);
  }

  async getMasterPromptHistory() {
    return this.systemSettingsStorage.getMasterPromptHistory();
  }

  // Service operations - delegate to ServiceStorage
  async getServicePlans() {
    return this.serviceStorage.getServicePlans();
  }

  async getServicePlan(id: number) {
    return this.serviceStorage.getServicePlan(id);
  }

  async getDefaultServicePlan() {
    return this.serviceStorage.getDefaultServicePlan();
  }

  async findServicePlanByPriceId(priceId: string) {
    return this.serviceStorage.findServicePlanByPriceId(priceId);
  }

  async createServicePlan(plan: any) {
    return this.serviceStorage.createServicePlan(plan);
  }

  async updateServicePlan(id: number, updates: any) {
    return this.serviceStorage.updateServicePlan(id, updates);
  }

  async deleteServicePlan(id: number) {
    return this.serviceStorage.deleteServicePlan(id);
  }

  async getServices() {
    return this.serviceStorage.getServices();
  }

  async getService(id: number) {
    return this.serviceStorage.getService(id);
  }

  async createService(service: any) {
    return this.serviceStorage.createService(service);
  }

  async updateService(id: number, updates: any) {
    return this.serviceStorage.updateService(id, updates);
  }

  async deleteService(id: number) {
    return this.serviceStorage.deleteService(id);
  }

  // Coupon operations - delegate to CouponStorage
  async getCoupons() {
    return this.couponStorage.getCoupons();
  }

  async getCoupon(id: number) {
    return this.couponStorage.getCoupon(id);
  }

  async getCouponByCode(code: string) {
    return this.couponStorage.getCouponByCode(code);
  }

  async createCoupon(coupon: InsertCoupon) {
    return this.couponStorage.createCoupon(coupon);
  }

  async updateCoupon(
    id: number,
    updates: Partial<InsertCoupon> & { timesRedeemed?: number },
  ) {
    return this.couponStorage.updateCoupon(id, updates);
  }

  async deleteCoupon(id: number) {
    return this.couponStorage.deleteCoupon(id);
  }

  // Subscription operations - delegate to SubscriptionStorage
  async getSubscription(id: number) {
    return this.subscriptionStorage.getSubscription(id);
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string) {
    return this.subscriptionStorage.getSubscriptionByStripeId(
      stripeSubscriptionId,
    );
  }

  async createSubscription(subscription: any) {
    return this.subscriptionStorage.createSubscription(subscription);
  }

  async updateSubscription(id: number, updates: any) {
    return this.subscriptionStorage.updateSubscription(id, updates);
  }

  async cancelSubscription(id: number) {
    return this.subscriptionStorage.cancelSubscription(id);
  }

  async getAllSubscriptions() {
    return this.subscriptionStorage.getAllSubscriptions();
  }

  async getActiveSubscriptionsCount() {
    return this.subscriptionStorage.getActiveSubscriptionsCount();
  }

  async getTrialSubscriptionsCount() {
    return this.subscriptionStorage.getTrialSubscriptionsCount();
  }

  async getInvoice(id: number) {
    return this.subscriptionStorage.getInvoice(id);
  }

  async getInvoiceByStripeId(stripeInvoiceId: string) {
    return this.subscriptionStorage.getInvoiceByStripeId(stripeInvoiceId);
  }

  async createInvoice(invoice: any) {
    return this.subscriptionStorage.createInvoice(invoice);
  }

  async updateInvoice(id: number, updates: any) {
    return this.subscriptionStorage.updateInvoice(id, updates);
  }

  async updateInvoiceByStripeId(stripeInvoiceId: string, updates: any) {
    return this.subscriptionStorage.updateInvoiceByStripeId(
      stripeInvoiceId,
      updates,
    );
  }

  async getAllInvoices() {
    return this.subscriptionStorage.getAllInvoices();
  }

  async getTotalRevenue() {
    return this.subscriptionStorage.getTotalRevenue();
  }

  async getMonthlyRevenue() {
    return this.subscriptionStorage.getMonthlyRevenue();
  }

  // Team Member operations - delegate to TeamMemberStorage
  async getTeamMembers() {
    return this.teamMemberStorage.getTeamMembers();
  }

  async getTeamMember(id: string) {
    return this.teamMemberStorage.getTeamMember(id);
  }

  async createTeamMember(member: any) {
    return this.teamMemberStorage.createTeamMember(member);
  }

  async updateTeamMember(id: string, updates: any) {
    return this.teamMemberStorage.updateTeamMember(id, updates);
  }

  async deleteTeamMember(id: string) {
    return this.teamMemberStorage.deleteTeamMember(id);
  }

  async getTeamMemberByEmail(email: string) {
    return this.teamMemberStorage.getTeamMemberByEmail(email);
  }

  // Client Usage operations - delegate to ClientUsageStorage
  async getClientUsageByMonth(userId: string, month: number, year: number) {
    return this.clientUsageStorage.getClientUsageByMonth(userId, month, year);
  }

  async createClientUsage(usage: any) {
    return this.clientUsageStorage.createClientUsage(usage);
  }

  async updateClientUsage(id: number, updates: any) {
    return this.clientUsageStorage.updateClientUsage(id, updates);
  }
}

export const storage = new DatabaseStorage(db);
