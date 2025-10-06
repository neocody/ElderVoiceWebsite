import {
  clientUsage,
  type SelectClientUsage,
  type InsertClientUsage,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class ClientUsageStorage {
  constructor(private db: any) {}

  async getClientUsageByMonth(
    userId: string,
    month: number,
    year: number,
  ): Promise<SelectClientUsage | undefined> {
    return (
      await this.db
        .select()
        .from(clientUsage)
        .where(
          and(
            eq(clientUsage.userId, userId),
            eq(clientUsage.month, month),
            eq(clientUsage.year, year),
          ),
        )
        .limit(1)
    )[0];
  }

  async createClientUsage(
    usage: InsertClientUsage,
  ): Promise<SelectClientUsage> {
    const [newUsage] = await this.db
      .insert(clientUsage)
      .values(usage)
      .returning();
    return newUsage;
  }

  async updateClientUsage(
    id: number,
    updates: Partial<InsertClientUsage>,
  ): Promise<SelectClientUsage> {
    const [updated] = await this.db
      .update(clientUsage)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientUsage.id, id))
      .returning();
    return updated;
  }
}
