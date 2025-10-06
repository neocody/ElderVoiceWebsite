import {
  teamMembers,
  type SelectTeamMember,
  type InsertTeamMember,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export class TeamMemberStorage {
  constructor(private db: any) {}

  async getTeamMembers(): Promise<SelectTeamMember[]> {
    return await this.db.select().from(teamMembers).orderBy(teamMembers.name);
  }

  async getTeamMember(id: string): Promise<SelectTeamMember | undefined> {
    const [member] = await this.db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(
    memberData: InsertTeamMember,
  ): Promise<SelectTeamMember> {
    const [member] = await this.db
      .insert(teamMembers)
      .values({
        ...memberData,
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return member;
  }

  async updateTeamMember(
    id: string,
    updates: Partial<InsertTeamMember>,
  ): Promise<SelectTeamMember> {
    const [member] = await this.db
      .update(teamMembers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, id))
      .returning();
    return member;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await this.db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  async getTeamMemberByEmail(
    email: string,
  ): Promise<SelectTeamMember | undefined> {
    const [member] = await this.db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.email, email));
    return member;
  }
}
