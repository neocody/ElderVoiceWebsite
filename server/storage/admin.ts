import {
  facilities,
  approvalRequests,
  adminNotificationPreferences,
  type Facility,
  type InsertFacility,
  type ApprovalRequest,
  type AdminNotificationPreferences,
  type InsertAdminNotificationPreferences,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export class AdminStorage {
  constructor(private db: any) {}

  async getFacilities(): Promise<Facility[]> {
    return await this.db.select().from(facilities);
  }

  async createFacility(facilityData: InsertFacility): Promise<Facility> {
    const [facility] = await this.db
      .insert(facilities)
      .values({
        ...facilityData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return facility;
  }

  async updateFacilityStatus(id: string, status: string): Promise<void> {
    await this.db
      .update(facilities)
      .set({ status, updatedAt: new Date() })
      .where(eq(facilities.id, id));
  }

  async getApprovalRequests(): Promise<ApprovalRequest[]> {
    return await this.db.select().from(approvalRequests);
  }

  async processApprovalRequest(
    id: string,
    approved: boolean,
    processedBy: string,
  ): Promise<void> {
    await this.db
      .update(approvalRequests)
      .set({
        status: approved ? "approved" : "rejected",
        processedBy,
        processedAt: new Date(),
      })
      .where(eq(approvalRequests.id, id));
  }

  async getAdminNotificationPreferences(): Promise<
    AdminNotificationPreferences | undefined
  > {
    const [preferences] = await this.db
      .select()
      .from(adminNotificationPreferences)
      .limit(1);
    return preferences;
  }

  async updateAdminNotificationPreferences(
    preferencesData: InsertAdminNotificationPreferences,
  ): Promise<AdminNotificationPreferences> {
    const existing = await this.getAdminNotificationPreferences();

    if (existing) {
      const [updated] = await this.db
        .update(adminNotificationPreferences)
        .set({
          ...preferencesData,
          updatedAt: new Date(),
        })
        .where(eq(adminNotificationPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      return this.createDefaultAdminNotificationPreferences();
    }
  }

  async createDefaultAdminNotificationPreferences(): Promise<AdminNotificationPreferences> {
    const [preferences] = await this.db
      .insert(adminNotificationPreferences)
      .values({
        smsNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        failedCallsThreshold: 3,
        failedCallsTimeWindow: 60,
        negativeSentimentThreshold: "0.70",
        billingFailureThreshold: 2,
        systemDowntimeThreshold: 5,
        criticalAlertEmails: [],
        criticalAlertPhones: [],
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        emergencyOverrideQuietHours: true,
        maxAlertsPerHour: 10,
        alertCooldownMinutes: 30,
      })
      .returning();
    return preferences;
  }
}
