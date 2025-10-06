import {
  calls,
  elderlyUsers,
  type Call,
  type InsertCall,
  type ElderlyUser,
} from "@shared/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { encryptField, decryptField } from "../services/encryption";

export class CallStorage {
  constructor(private db: any) {}

  private encryptCall(callData: Partial<Call> | Partial<InsertCall>) {
    return {
      ...callData,
      summary:
        callData.summary !== undefined && callData.summary !== null
          ? encryptField(callData.summary)
          : (callData.summary ?? null),
      transcript:
        callData.transcript !== undefined && callData.transcript !== null
          ? encryptField(callData.transcript)
          : (callData.transcript ?? null),
      notes:
        callData.notes !== undefined && callData.notes !== null
          ? encryptField(callData.notes)
          : (callData.notes ?? null),
    };
  }

  private decryptCall(callData: Call) {
    if (!callData) return callData;

    return {
      ...callData,
      summary: callData.summary ? decryptField(callData.summary) : null,
      transcript: callData.transcript
        ? decryptField(callData.transcript)
        : null,
      notes: callData.notes ? decryptField(callData.notes) : null,
    };
  }

  async getCalls(elderlyUserId?: number, limit?: number): Promise<Call[]> {
    if (!this.db) {
      console.error("[STORAGE] Database not initialized");
      return [];
    }

    try {
      let query = this.db
        .select({
          call: calls,
          user: elderlyUsers,
        })
        .from(calls)
        .leftJoin(elderlyUsers, eq(calls.elderlyUserId, elderlyUsers.id))
        .orderBy(desc(calls.createdAt));

      if (elderlyUserId !== undefined) {
        query = query.where(eq(calls.elderlyUserId, elderlyUserId));
      }

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const result = await query;

      // Inline the elderly user into each call
      const mergedResults = result.map(
        ({ call, user }: { call: Call; user: ElderlyUser }) => ({
          ...this.decryptCall(call),
          elderlyUser: user,
        }),
      );

      return mergedResults;
    } catch (error) {
      console.error("[STORAGE] Error fetching calls:", error);
      return [];
    }
  }

  async getCall(id: number): Promise<Call | undefined> {
    const [encryptedCall] = await this.db
      .select()
      .from(calls)
      .where(eq(calls.id, id));

    return encryptedCall ? this.decryptCall(encryptedCall) : undefined;
  }

  async createCall(callData: InsertCall): Promise<Call> {
    const encryptedCallData = this.encryptCall(callData);

    const [encryptedCall] = await this.db
      .insert(calls)
      .values({
        ...encryptedCallData,
        createdAt: new Date(),
      })
      .returning();

    return this.decryptCall(encryptedCall);
  }

  async updateCall(id: number, updates: Partial<InsertCall>): Promise<Call> {
    const encryptedUpdates = this.encryptCall(updates);

    const [encryptedCall] = await this.db
      .update(calls)
      .set(encryptedUpdates)
      .where(eq(calls.id, id))
      .returning();

    return this.decryptCall(encryptedCall);
  }

  async getCallStats(): Promise<{
    totalCalls: number;
    callsToday: number;
    callsThisWeek: number;
    callsThisMonth: number;
    callsByStatus: Record<string, number>;
  }> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const startOfWeek = new Date(
      startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const startOfMonth = new Date(
      startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    // Example using SQL builder
    const [totals, statuses] = await Promise.all([
      this.db
        .select({
          totalCalls: sql<number>`COUNT(*)`,
          callsToday: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${startOfDay})`,
          callsThisWeek: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${startOfWeek})`,
          callsThisMonth: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${startOfMonth})`,
        })
        .from(calls),
      this.db
        .select({
          status: calls.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(calls)
        .groupBy(calls.status),
    ]);

    return {
      ...totals[0],
      callsByStatus: Object.fromEntries(
        statuses.map((s: { status: string; count: number }) => [
          s.status,
          s.count,
        ]),
      ),
    };
  }

  async getEngagementStats() {
    // --- 1. Total Patients ---
    const [{ totalPatients }] = await this.db
      .select({ totalPatients: sql<number>`COUNT(*)` })
      .from(elderlyUsers);

    // --- 2. Engaged Patients (those who have at least one call) ---
    const [{ engagedPatients }] = await this.db
      .select({
        engagedPatients: sql<number>`COUNT(DISTINCT ${calls.elderlyUserId})`,
      })
      .from(calls);

    // --- 3. Top 10 Most Active Patients ---
    const topPatients = await this.db
      .select({
        patientId: calls.elderlyUserId,
        callCount: sql<number>`COUNT(*)`,
        patientName: elderlyUsers.name,
      })
      .from(calls)
      .leftJoin(elderlyUsers, eq(calls.elderlyUserId, elderlyUsers.id))
      .groupBy(calls.elderlyUserId, elderlyUsers.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // --- 4. Engagement Rate ---
    const engagementRate =
      totalPatients > 0 ? (engagedPatients / totalPatients) * 100 : 0;

    return {
      totalPatients,
      engagedPatients,
      engagementRate: Math.round(engagementRate * 100) / 100, // round to 2 decimals
      mostActivePatients: topPatients.map(
        (p: {
          patientId: number;
          patientName: string | null;
          callCount: number;
        }) => ({
          patientId: p.patientId,
          patientName: p.patientName ?? "Unknown",
          callCount: p.callCount,
        }),
      ),
    };
  }
}
