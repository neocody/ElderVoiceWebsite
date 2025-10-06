import {
  patientMemory,
  calls,
  type PatientMemory,
  type InsertPatientMemory,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { encryptField, decryptField } from "../services/encryption";

export class PatientMemoryStorage {
  constructor(private db: any) {}

  private encryptPatientMemory(memory: any) {
    return {
      ...memory,
      content: memory.content ? encryptField(memory.content) : null,
      context: memory.context ? encryptField(memory.context) : null,
    };
  }

  private decryptPatientMemory(memory: PatientMemory): any {
    if (!memory) return memory;

    return {
      ...memory,
      content: memory.content ? decryptField(memory.content as string) : null,
      context: memory.context ? decryptField(memory.context as string) : null,
    };
  }

  async getPatientMemory(
    elderlyUserId: number,
    limit: number = 20,
  ): Promise<PatientMemory[]> {
    const encryptedMemories = await this.db
      .select()
      .from(patientMemory)
      .where(eq(patientMemory.elderlyUserId, elderlyUserId))
      .orderBy(desc(patientMemory.createdAt))
      .limit(limit);

    return encryptedMemories.map((memory: PatientMemory) =>
      this.decryptPatientMemory(memory),
    );
  }

  async getPatientMemoryByCallId(callId: number): Promise<PatientMemory[]> {
    const encryptedMemories = await this.db
      .select()
      .from(patientMemory)
      .where(eq(patientMemory.callId, callId))
      .orderBy(desc(patientMemory.createdAt));

    return encryptedMemories.map((memory: PatientMemory) =>
      this.decryptPatientMemory(memory),
    );
  }

  async createPatientMemory(
    memory: InsertPatientMemory,
  ): Promise<PatientMemory> {
    const encryptedMemory = this.encryptPatientMemory(memory);

    const [created] = await this.db
      .insert(patientMemory)
      .values(encryptedMemory)
      .returning();
    return this.decryptPatientMemory(created);
  }

  async updatePatientMemory(
    id: number,
    updates: Partial<InsertPatientMemory>,
  ): Promise<PatientMemory> {
    const encryptedUpdates = this.encryptPatientMemory(updates);

    const [updated] = await this.db
      .update(patientMemory)
      .set(encryptedUpdates)
      .where(eq(patientMemory.id, id))
      .returning();
    return this.decryptPatientMemory(updated);
  }

  async deletePatientMemory(id: number): Promise<void> {
    await this.db.delete(patientMemory).where(eq(patientMemory.id, id));
  }

  async getPatientMemoryByType(
    elderlyUserId: number,
    memoryType: string,
  ): Promise<PatientMemory[]> {
    const encryptedMemories = await this.db
      .select()
      .from(patientMemory)
      .where(
        and(
          eq(patientMemory.elderlyUserId, elderlyUserId),
          eq(patientMemory.memoryType, memoryType),
        ),
      )
      .orderBy(desc(patientMemory.createdAt));

    return encryptedMemories.map((memory: PatientMemory) =>
      this.decryptPatientMemory(memory),
    );
  }

  async getPatientMemoryByTags(
    elderlyUserId: number,
    tags: string[],
  ): Promise<PatientMemory[]> {
    return await this.db
      .select()
      .from(patientMemory)
      .where(eq(patientMemory.elderlyUserId, elderlyUserId))
      .orderBy(desc(patientMemory.createdAt));
  }

  // Additional helper function for searching within encrypted content
  async searchPatientMemoryContent(
    elderlyUserId: number,
    searchTerm: string,
  ): Promise<PatientMemory[]> {
    // Since content is encrypted, we need to fetch all memories and search after decryption
    const encryptedMemories = await this.db
      .select()
      .from(patientMemory)
      .where(eq(patientMemory.elderlyUserId, elderlyUserId))
      .orderBy(desc(patientMemory.createdAt));

    const decryptedMemories = encryptedMemories.map((memory: PatientMemory) =>
      this.decryptPatientMemory(memory),
    );

    // Filter by content search term after decryption
    return decryptedMemories.filter((memory: PatientMemory) => {
      const contentMatch = memory.content
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const contextMatch = memory.context
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      return contentMatch || contextMatch;
    });
  }

  // AI Processing Operations
  async generateConversationInsights(elderlyUserId: number): Promise<any> {
    // Get recent patient memories
    const memories = await this.getPatientMemory(elderlyUserId, 50);

    // Get recent calls - we'll need to inject the call storage here or pass it
    // For now, we'll create a simpler version without call data
    const insights = {
      totalMemories: memories.length,
      memoryTypes: memories.reduce((acc: any, m) => {
        acc[m.memoryType] = (acc[m.memoryType] || 0) + 1;
        return acc;
      }, {}),
      importanceDistribution: memories.reduce((acc: any, m) => {
        const importance = m.importanceScore || 0;
        const level =
          importance >= 90
            ? "critical"
            : importance >= 75
              ? "high"
              : importance >= 25
                ? "normal"
                : "low";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {}),
      recentTopics: memories.slice(0, 10).map((m) => ({
        title: m.context || m.content?.substring(0, 50),
        date: m.createdAt,
        type: m.memoryType,
      })),
    };

    return insights;
  }
}
