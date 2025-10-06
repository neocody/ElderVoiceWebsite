import { schedules, type Schedule, type InsertSchedule } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ScheduleStorage {
  constructor(private db: any) {}

  async getSchedules(elderlyUserId?: number): Promise<Schedule[]> {
    if (elderlyUserId !== undefined) {
      return await this.db
        .select()
        .from(schedules)
        .where(eq(schedules.elderlyUserId, elderlyUserId));
    }
    return await this.db.select().from(schedules);
  }

  async createSchedule(scheduleData: InsertSchedule): Promise<Schedule> {
    const [schedule] = await this.db
      .insert(schedules)
      .values({
        ...scheduleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return schedule;
  }

  async updateSchedule(
    id: number,
    updates: Partial<InsertSchedule>,
  ): Promise<Schedule> {
    const [schedule] = await this.db
      .update(schedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await this.db.delete(schedules).where(eq(schedules.id, id));
  }
}
