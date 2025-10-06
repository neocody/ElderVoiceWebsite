import {
  systemSettings,
  userSettings,
  masterPrompts,
  type SystemSettings,
  type InsertSystemSettings,
  type UserSettings,
  type InsertUserSettings,
  type MasterPrompt,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class SystemSettingsStorage {
  constructor(private db: any) {}

  // System Settings Operations
  async getSystemSetting(key: string): Promise<SystemSettings | undefined> {
    const [setting] = await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async getSystemSettingsByCategory(
    category: string,
  ): Promise<SystemSettings[]> {
    return await this.db
      .select()
      .from(systemSettings)
      .where(
        and(
          eq(systemSettings.category, category),
          eq(systemSettings.isActive, true),
        ),
      );
  }

  async setSystemSetting(
    key: string,
    value: any,
    category: string,
    description?: string,
  ): Promise<SystemSettings> {
    const existingSetting = await this.getSystemSetting(key);

    if (existingSetting) {
      const [updated] = await this.db
        .update(systemSettings)
        .set({
          value,
          category,
          description,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await this.db
        .insert(systemSettings)
        .values({
          key,
          value,
          category,
          description,
          isActive: true,
        })
        .returning();
      return created;
    }
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await this.db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  async getAllSystemSettings(): Promise<SystemSettings[]> {
    return await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.isActive, true))
      .orderBy(systemSettings.category, systemSettings.key);
  }

  // User Settings Operations
  async getUserSettings(
    userId: string,
    category?: string,
  ): Promise<UserSettings[]> {
    const query = this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (category) {
      return await query.where(eq(userSettings.category, category));
    }

    return await query.orderBy(userSettings.category);
  }

  async getUserSetting(
    userId: string,
    category: string,
  ): Promise<UserSettings | undefined> {
    const [setting] = await this.db
      .select()
      .from(userSettings)
      .where(
        and(
          eq(userSettings.userId, userId),
          eq(userSettings.category, category),
        ),
      );
    return setting || undefined;
  }

  async setUserSetting(
    userId: string,
    category: string,
    settings: any,
  ): Promise<UserSettings> {
    const existingSetting = await this.getUserSetting(userId, category);

    if (existingSetting) {
      const [updated] = await this.db
        .update(userSettings)
        .set({
          settings,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userSettings.userId, userId),
            eq(userSettings.category, category),
          ),
        )
        .returning();
      return updated;
    } else {
      const [created] = await this.db
        .insert(userSettings)
        .values({
          userId,
          category,
          settings,
        })
        .returning();
      return created;
    }
  }

  async deleteUserSetting(userId: string, category: string): Promise<void> {
    await this.db
      .delete(userSettings)
      .where(
        and(
          eq(userSettings.userId, userId),
          eq(userSettings.category, category),
        ),
      );
  }

  // Master Prompt Operations
  async getMasterPrompt(): Promise<MasterPrompt | undefined> {
    const [prompt] = await this.db
      .select()
      .from(masterPrompts)
      .where(eq(masterPrompts.isActive, true))
      .orderBy(desc(masterPrompts.version))
      .limit(1);
    return prompt || undefined;
  }

  async setMasterPrompt(
    prompt: string,
    createdBy: string,
  ): Promise<MasterPrompt> {
    // Deactivate previous prompts
    await this.db
      .update(masterPrompts)
      .set({ isActive: false })
      .where(eq(masterPrompts.isActive, true));

    // Get next version number
    const [latestPrompt] = await this.db
      .select({ version: masterPrompts.version })
      .from(masterPrompts)
      .orderBy(desc(masterPrompts.version))
      .limit(1);

    const nextVersion = (latestPrompt?.version || 0) + 1;

    // Create new active prompt
    const [created] = await this.db
      .insert(masterPrompts)
      .values({
        prompt,
        version: nextVersion,
        isActive: true,
        createdBy,
      })
      .returning();

    return created;
  }

  async getMasterPromptHistory(): Promise<MasterPrompt[]> {
    return await this.db
      .select()
      .from(masterPrompts)
      .orderBy(desc(masterPrompts.version));
  }
}
