import {
  notifications,
  notificationTemplates,
  notificationPreferences,
  type Notification,
  type InsertNotification,
  type NotificationTemplate,
  type InsertNotificationTemplate,
  type NotificationPreferences,
  type InsertNotificationPreferences,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export class NotificationStorage {
  constructor(private db: any) {}

  // Enhanced Notification operations
  async getNotifications(
    userId: string,
    unreadOnly?: boolean,
    limit?: number,
  ): Promise<Notification[]> {
    let query = this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  async createNotification(
    notificationData: InsertNotification,
  ): Promise<Notification> {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        ...notificationData,
        createdAt: new Date(),
      })
      .returning();
    return notification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await this.db.delete(notifications).where(eq(notifications.id, id));
  }

  // Notification Template operations
  async getNotificationTemplates(
    isActive?: boolean,
  ): Promise<NotificationTemplate[]> {
    let query = this.db.select().from(notificationTemplates);

    if (isActive !== undefined) {
      query = query.where(eq(notificationTemplates.isActive, isActive));
    }

    return await query.orderBy(notificationTemplates.name);
  }

  async getNotificationTemplate(
    id: number,
  ): Promise<NotificationTemplate | undefined> {
    const [template] = await this.db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    return template;
  }

  async getNotificationTemplateByType(
    type: NotificationTemplate["type"],
  ): Promise<NotificationTemplate | undefined> {
    const [template] = await this.db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.type, type),
          eq(notificationTemplates.isActive, true),
        ),
      );
    return template;
  }

  async createNotificationTemplate(
    templateData: InsertNotificationTemplate,
  ): Promise<NotificationTemplate> {
    const [template] = await this.db
      .insert(notificationTemplates)
      .values({
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return template;
  }

  async updateNotificationTemplate(
    id: number,
    updates: Partial<InsertNotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const [template] = await this.db
      .update(notificationTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationTemplates.id, id))
      .returning();
    return template;
  }

  async deleteNotificationTemplate(id: number): Promise<void> {
    await this.db
      .delete(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
  }

  // Notification Preferences operations
  async getNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferences | undefined> {
    const [preferences] = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return preferences;
  }

  async createNotificationPreferences(
    preferencesData: InsertNotificationPreferences,
  ): Promise<NotificationPreferences> {
    const [preferences] = await this.db
      .insert(notificationPreferences)
      .values({
        ...preferencesData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return preferences;
  }

  async updateNotificationPreferences(
    userId: string,
    updates: Partial<InsertNotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const [preferences] = await this.db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return preferences;
  }

  // Advanced notification sending operations
  async sendNotification(
    templateId: number,
    userId: string,
    elderlyUserId?: number,
    variables?: Record<string, any>,
  ): Promise<Notification> {
    const template = await this.getNotificationTemplate(templateId);
    if (!template) {
      throw new Error("Notification template not found");
    }

    // Replace variables in template
    let title = template.emailSubject;
    let message = template.emailBody;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        title = title.replace(new RegExp(placeholder, "g"), String(value));
        message = message.replace(new RegExp(placeholder, "g"), String(value));
      });
    }

    const notificationData: InsertNotification = {
      userId,
      elderlyUserId,
      templateId,
      type: template.type,
      title,
      message,
      priority: variables?.priority || "normal",
      actionRequired: variables?.actionRequired || false,
      actionUrl: variables?.actionUrl,
      metadata: variables,
    };

    return await this.createNotification(notificationData);
  }

  async processNotificationQueue(): Promise<void> {
    // This method would handle sending notifications via email/SMS
    // For now, we'll implement basic processing
    const pendingNotifications = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.sentViaEmail, false),
          eq(notifications.sentViaSms, false),
        ),
      )
      .limit(50);

    for (const notification of pendingNotifications) {
      // Mark as processed for now - actual email/SMS sending would happen here
      await this.db
        .update(notifications)
        .set({
          sentViaEmail: true,
          sentViaSms: false, // Would check user preferences
        })
        .where(eq(notifications.id, notification.id));
    }
  }
}
