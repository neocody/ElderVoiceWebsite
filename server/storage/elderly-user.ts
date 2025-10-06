import {
  elderlyUsers,
  type ElderlyUser,
  type InsertElderlyUser,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { encryptField, decryptField } from "../services/encryption";

export class ElderlyUserStorage {
  constructor(private db: any) {}

  private encryptElderlyUser(userData: Partial<ElderlyUser>) {
    return {
      ...userData,
      healthConcerns: userData.healthConcerns
        ? encryptField(userData.healthConcerns)
        : null,
      medications: userData.medications
        ? encryptField(userData.medications)
        : null,
      allergies: userData.allergies ? encryptField(userData.allergies) : null,
      topicsOfInterest: userData.topicsOfInterest
        ? encryptField(JSON.stringify(userData.topicsOfInterest))
        : null,
      familyInfo: userData.familyInfo
        ? encryptField(userData.familyInfo)
        : null,
      specialNotes: userData.specialNotes
        ? encryptField(userData.specialNotes)
        : null,
      conversationStyle: userData.conversationStyle
        ? encryptField(userData.conversationStyle)
        : null,
      conversationPreferences: userData.conversationPreferences
        ? encryptField(JSON.stringify(userData.conversationPreferences))
        : null,
      medicationReminders: userData.medicationReminders
        ? encryptField(JSON.stringify(userData.medicationReminders))
        : null,
    };
  }

  private decryptElderlyUser(userData: ElderlyUser): any {
    if (!userData) return userData;

    return {
      ...userData,
      healthConcerns: userData.healthConcerns
        ? decryptField(userData.healthConcerns as string)
        : null,
      medications: userData.medications
        ? decryptField(userData.medications as string)
        : null,
      allergies: userData.allergies
        ? decryptField(userData.allergies as string)
        : null,
      topicsOfInterest: userData.topicsOfInterest
        ? (() => {
            try {
              const decryptedTopics = decryptField(
                userData.topicsOfInterest as string,
              );
              return decryptedTopics ? JSON.parse(decryptedTopics) : null;
            } catch (e) {
              console.error("Error parsing topicsOfInterest:", e);
              return null;
            }
          })()
        : null,
      familyInfo: userData.familyInfo
        ? decryptField(userData.familyInfo as string)
        : null,
      specialNotes: userData.specialNotes
        ? decryptField(userData.specialNotes as string)
        : null,
      conversationStyle: userData.conversationStyle
        ? decryptField(userData.conversationStyle as string)
        : null,
      conversationPreferences: userData.conversationPreferences
        ? (() => {
            try {
              const decryptedPrefs = decryptField(
                userData.conversationPreferences as string,
              );
              return decryptedPrefs ? JSON.parse(decryptedPrefs) : null;
            } catch (e) {
              console.error("Error parsing conversationPreferences:", e);
              return null;
            }
          })()
        : null,
      medicationReminders: userData.medicationReminders
        ? (() => {
            try {
              const decryptedReminders = decryptField(
                userData.medicationReminders as string,
              );
              return decryptedReminders ? JSON.parse(decryptedReminders) : null;
            } catch (e) {
              console.error("Error parsing medicationReminders:", e);
              return null;
            }
          })()
        : null,
    };
  }

  async getElderlyUsers(caregiverId: string): Promise<ElderlyUser[]> {
    const encryptedUsers = await this.db
      .select()
      .from(elderlyUsers)
      .where(eq(elderlyUsers.caregiverId, caregiverId));

    return encryptedUsers.map((user: ElderlyUser) =>
      this.decryptElderlyUser(user),
    );
  }

  async getElderlyUser(id: number): Promise<ElderlyUser | undefined> {
    if (!this.db) {
      console.error("[STORAGE] Database not initialized");
      return undefined;
    }
    try {
      const [encryptedUser] = await this.db
        .select()
        .from(elderlyUsers)
        .where(eq(elderlyUsers.id, id));

      return encryptedUser ? this.decryptElderlyUser(encryptedUser) : undefined;
    } catch (error) {
      console.error(`[STORAGE] Error fetching elderly user ${id}:`, error);
      return undefined;
    }
  }

  async createElderlyUser(userData: InsertElderlyUser): Promise<ElderlyUser> {
    const [encryptedUser] = await this.db
      .insert(elderlyUsers)
      .values({
        ...this.encryptElderlyUser(userData),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return this.decryptElderlyUser(encryptedUser);
  }

  async updateElderlyUser(
    id: number,
    updates: Partial<InsertElderlyUser>,
  ): Promise<ElderlyUser> {
    const [encryptedUser] = await this.db
      .update(elderlyUsers)
      .set({ ...this.encryptElderlyUser(updates), updatedAt: new Date() })
      .where(eq(elderlyUsers.id, id))
      .returning();
    return this.decryptElderlyUser(encryptedUser);
  }

  async deleteElderlyUser(id: number): Promise<void> {
    await this.db.delete(elderlyUsers).where(eq(elderlyUsers.id, id));
  }
}
