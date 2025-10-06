import {
  subscriptions,
  invoices,
  servicePlans,
  type Subscription,
  type InsertSubscription,
  type Invoice,
  type InsertInvoice,
} from "@shared/schema";
import { eq, desc, and, sql, gte, inArray } from "drizzle-orm";

export class SubscriptionStorage {
  constructor(private db: any) {}

  // Subscription Operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<Subscription | undefined> {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription;
  }

  async createSubscription(
    subscriptionData: InsertSubscription,
  ): Promise<Subscription> {
    const [subscription] = await this.db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async updateSubscription(
    id: number,
    updates: Partial<InsertSubscription>,
  ): Promise<Subscription> {
    const [subscription] = await this.db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async cancelSubscription(id: number): Promise<void> {
    await this.db
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));
  }

  async getAllSubscriptions(): Promise<
    (Subscription & { amount: number | null; planName: string })[]
  > {
    return await this.db
      .select({
        ...subscriptions,
        amount: invoices.amountDue,
        planName: servicePlans.name,
      })
      .from(subscriptions)
      .leftJoin(invoices, eq(subscriptions.id, invoices.subscriptionId))
      .innerJoin(servicePlans, eq(subscriptions.planId, servicePlans.id))
      .orderBy(desc(subscriptions.createdAt));
  }

  // Count active subscriptions (status = 'active')
  async getActiveSubscriptionsCount(): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    return Number(result[0]?.count || 0);
  }

  // Count trial subscriptions (status = 'trialing')
  async getTrialSubscriptionsCount(): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, "trialing"));

    return Number(result[0]?.count || 0);
  }

  // Invoices Operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByStripeId(
    stripeInvoiceId: string,
  ): Promise<Invoice | undefined> {
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.stripeInvoiceId, stripeInvoiceId));
    return invoice;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await this.db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    return invoice;
  }

  async updateInvoice(
    id: number,
    updates: Partial<InsertInvoice>,
  ): Promise<Invoice> {
    const [updated] = await this.db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async updateInvoiceByStripeId(
    stripeInvoiceId: string,
    updates: Partial<InsertInvoice>,
  ): Promise<Invoice | undefined> {
    const [updated] = await this.db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.stripeInvoiceId, stripeInvoiceId))
      .returning();
    return updated || undefined;
  }

  // Get all invoices with plan name
  async getAllInvoices(): Promise<
    (Invoice & { planName: string; description: string })[]
  > {
    const result = await this.db
      .select({
        ...invoices,
        planName: servicePlans.name,
      })
      .from(invoices)
      .innerJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
      .innerJoin(servicePlans, eq(subscriptions.planId, servicePlans.id))
      .orderBy(desc(invoices.createdAt));

    return result.map((row: any) => ({
      ...row,
      description: `Invoice for plan: ${row.planName || "Unknown Plan"}`,
    }));
  }

  // Get total revenue (sum of all paid invoices)
  async getTotalRevenue(): Promise<number> {
    const result = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.status, "paid"));

    return Number(result[0]?.total || 0);
  }

  // Get monthly revenue (sum of paid invoices from current month)
  async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
      })
      .from(invoices)
      .where(
        and(eq(invoices.status, "paid"), gte(invoices.createdAt, startOfMonth)),
      );

    return Number(result[0]?.total || 0);
  }
}
