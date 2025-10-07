import {
  type User,
  type UpsertUser,
  type ElderlyUser,
  type InsertElderlyUser,
  type Call,
  type InsertCall,
  type Schedule,
  type InsertSchedule,
  type Notification,
  type InsertNotification,
  type NotificationTemplate,
  type InsertNotificationTemplate,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type Facility,
  type InsertFacility,
  type ApprovalRequest,
  type InsertApprovalRequest,
  type Subscription,
  type InsertSubscription,
  type AdminNotificationPreferences,
  type InsertAdminNotificationPreferences,
  type SystemSettings,
  type InsertSystemSettings,
  type UserSettings,
  type InsertUserSettings,
  type MasterPrompt,
  type InsertMasterPrompt,
  type PatientMemory,
  type InsertPatientMemory,
  type SelectServicePlan,
  type ServicePlanWithServices,
  type InsertServicePlan,
  type SelectService,
  type InsertService,
  type InsertTeamMember,
  type SelectTeamMember,
  type SelectClientUsage,
  type InsertClientUsage,
  type Invoice,
  type InsertInvoice,
  type Coupon,
  type InsertCoupon,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Elderly user operations
  getElderlyUsers(caregiverId: string): Promise<ElderlyUser[]>;
  getElderlyUser(id: number): Promise<ElderlyUser | undefined>;
  createElderlyUser(user: InsertElderlyUser): Promise<ElderlyUser>;
  updateElderlyUser(
    id: number,
    updates: Partial<InsertElderlyUser>,
  ): Promise<ElderlyUser>;
  deleteElderlyUser(id: number): Promise<void>;

  // Call operations
  getCalls(elderlyUserId?: number, limit?: number): Promise<Call[]>;
  getCall(id: number): Promise<Call | undefined>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: number, updates: Partial<InsertCall>): Promise<Call>;

  // Schedule operations
  getSchedules(elderlyUserId?: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(
    id: number,
    updates: Partial<InsertSchedule>,
  ): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;

  // Enhanced Notification operations
  getNotifications(
    userId: string,
    unreadOnly?: boolean,
    limit?: number,
  ): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: number): Promise<void>;

  // Notification Template operations
  getNotificationTemplates(isActive?: boolean): Promise<NotificationTemplate[]>;
  getNotificationTemplate(
    id: number,
  ): Promise<NotificationTemplate | undefined>;
  getNotificationTemplateByType(
    type: NotificationTemplate["type"],
  ): Promise<NotificationTemplate | undefined>;
  createNotificationTemplate(
    template: InsertNotificationTemplate,
  ): Promise<NotificationTemplate>;
  updateNotificationTemplate(
    id: number,
    updates: Partial<InsertNotificationTemplate>,
  ): Promise<NotificationTemplate>;
  deleteNotificationTemplate(id: number): Promise<void>;

  // Notification Preferences operations
  getNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferences | undefined>;
  createNotificationPreferences(
    preferences: InsertNotificationPreferences,
  ): Promise<NotificationPreferences>;
  updateNotificationPreferences(
    userId: string,
    updates: Partial<InsertNotificationPreferences>,
  ): Promise<NotificationPreferences>;

  // Notification sending operations
  sendNotification(
    templateId: number,
    userId: string,
    elderlyUserId?: number,
    variables?: Record<string, any>,
  ): Promise<Notification>;
  processNotificationQueue(): Promise<void>;

  // Admin operations
  getFacilities(): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacilityStatus(id: string, status: string): Promise<void>;
  getApprovalRequests(): Promise<ApprovalRequest[]>;
  processApprovalRequest(
    id: string,
    approved: boolean,
    processedBy: string,
  ): Promise<void>;

  // Subscription Operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(
    id: number,
    updates: Partial<InsertSubscription>,
  ): Promise<Subscription>;
  cancelSubscription(id: number): Promise<void>;

  // Admin Notification Preferences Operations
  getAdminNotificationPreferences(): Promise<
    AdminNotificationPreferences | undefined
  >;
  updateAdminNotificationPreferences(
    preferences: InsertAdminNotificationPreferences,
  ): Promise<AdminNotificationPreferences>;
  createDefaultAdminNotificationPreferences(): Promise<AdminNotificationPreferences>;

  // Patient Memory Operations
  getPatientMemory(
    elderlyUserId: number,
    limit?: number,
  ): Promise<PatientMemory[]>;
  createPatientMemory(memory: InsertPatientMemory): Promise<PatientMemory>;
  updatePatientMemory(
    id: number,
    updates: Partial<InsertPatientMemory>,
  ): Promise<PatientMemory>;
  deletePatientMemory(id: number): Promise<void>;
  getPatientMemoryByType(
    elderlyUserId: number,
    memoryType: string,
  ): Promise<PatientMemory[]>;
  getPatientMemoryByTags(
    elderlyUserId: number,
    tags: string[],
  ): Promise<PatientMemory[]>;

  // AI Processing Operations
  generateConversationInsights(elderlyUserId: number): Promise<any>;

  // System Settings Operations
  getSystemSetting(key: string): Promise<SystemSettings | undefined>;
  getSystemSettingsByCategory(category: string): Promise<SystemSettings[]>;
  setSystemSetting(
    key: string,
    value: any,
    category: string,
    description?: string,
  ): Promise<SystemSettings>;
  deleteSystemSetting(key: string): Promise<void>;
  getAllSystemSettings(): Promise<SystemSettings[]>;

  // User Settings Operations
  getUserSettings(userId: string, category?: string): Promise<UserSettings[]>;
  getUserSetting(
    userId: string,
    category: string,
  ): Promise<UserSettings | undefined>;
  setUserSetting(
    userId: string,
    category: string,
    settings: any,
  ): Promise<UserSettings>;
  deleteUserSetting(userId: string, category: string): Promise<void>;

  // Master Prompt Operations
  getMasterPrompt(): Promise<MasterPrompt | undefined>;
  setMasterPrompt(prompt: string, createdBy: string): Promise<MasterPrompt>;
  getMasterPromptHistory(): Promise<MasterPrompt[]>;

  // WHMCS-style Service Operations
  getServicePlans(): Promise<SelectServicePlan[]>;
  getServicePlan(id: number): Promise<SelectServicePlan | undefined>;
  findServicePlanByPriceId(priceId: string): Promise<SelectServicePlan | null>;
  getDefaultServicePlan(): Promise<ServicePlanWithServices | undefined>;
  createServicePlan(plan: InsertServicePlan): Promise<SelectServicePlan>;
  updateServicePlan(
    id: number,
    updates: Partial<InsertServicePlan>,
  ): Promise<SelectServicePlan>;
  deleteServicePlan(id: number): Promise<void>;

  getServices(): Promise<SelectService[]>;
  getService(id: number): Promise<SelectService | undefined>;
  createService(service: InsertService): Promise<SelectService>;
  updateService(
    id: number,
    updates: Partial<InsertService>,
  ): Promise<SelectService>;
  deleteService(id: number): Promise<void>;

  // Coupon Operations
  getCoupons(): Promise<Coupon[]>;
  getCoupon(id: number): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(
    id: number,
    updates: Partial<InsertCoupon> & { timesRedeemed?: number },
  ): Promise<Coupon>;
  deleteCoupon(id: number): Promise<void>;

  // Team Member Operations
  getTeamMembers(): Promise<SelectTeamMember[]>;
  getTeamMember(id: string): Promise<SelectTeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<SelectTeamMember>;
  updateTeamMember(
    id: string,
    updates: Partial<InsertTeamMember>,
  ): Promise<SelectTeamMember>;
  deleteTeamMember(id: string): Promise<void>;
  getTeamMemberByEmail(email: string): Promise<SelectTeamMember | undefined>;

  // Client usage tracking operations
  getClientUsageByMonth(
    userId: string,
    month: number,
    year: number,
  ): Promise<SelectClientUsage | undefined>;
  createClientUsage(usage: InsertClientUsage): Promise<SelectClientUsage>;
  updateClientUsage(
    id: number,
    updates: Partial<InsertClientUsage>,
  ): Promise<SelectClientUsage>;
}
