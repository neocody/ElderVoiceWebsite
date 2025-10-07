import { coupons, type Coupon, type InsertCoupon } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class CouponStorage {
  constructor(private db: any) {}

  async getCoupons(): Promise<Coupon[]> {
    return this.db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCoupon(id: number): Promise<Coupon | undefined> {
    const [coupon] = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);
    return coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);
    return coupon;
  }

  async createCoupon(couponData: InsertCoupon): Promise<Coupon> {
    const [coupon] = await this.db
      .insert(coupons)
      .values({
        ...couponData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return coupon;
  }

  async updateCoupon(
    id: number,
    updates: Partial<InsertCoupon> & { timesRedeemed?: number },
  ): Promise<Coupon> {
    const [coupon] = await this.db
      .update(coupons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return coupon;
  }

  async deleteCoupon(id: number): Promise<void> {
    await this.db.delete(coupons).where(eq(coupons.id, id));
  }
}
