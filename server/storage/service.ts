import {
  servicePlans,
  services,
  servicePlanServices,
  type ServicePlanWithServices,
  type SelectServicePlan,
  type InsertServicePlan,
  type SelectService,
  type InsertService,
} from "@shared/schema";
import { eq, desc, sql, or } from "drizzle-orm";
import { stripeSync } from "../services/stripeSync";

export class ServiceStorage {
  constructor(private db: any) {}

  // Service Plans
  async getServicePlans(): Promise<ServicePlanWithServices[]> {
    const result = await this.db
      .select({
        id: servicePlans.id,
        name: servicePlans.name,
        description: servicePlans.description,
        basePrice: servicePlans.basePrice,
        annualDiscount: servicePlans.annualDiscount,
        callsPerMonth: servicePlans.callsPerMonth,
        callDurationMinutes: servicePlans.callDurationMinutes,
        isActive: servicePlans.isActive,
        planType: servicePlans.planType,
        createdAt: servicePlans.createdAt,
        updatedAt: servicePlans.updatedAt,
        serviceIds: sql<number[]>`
          coalesce(
            array_agg(${servicePlanServices.serviceId}) 
            filter (where ${servicePlanServices.serviceId} is not null), 
            array[]::int[]
          )
        `,
      })
      .from(servicePlans)
      .leftJoin(
        servicePlanServices,
        eq(servicePlans.id, servicePlanServices.servicePlanId),
      )
      .groupBy(servicePlans.id)
      .orderBy(servicePlans.name);

    return result;
  }

  private servicePlanSelect() {
    return {
      id: servicePlans.id,
      name: servicePlans.name,
      description: servicePlans.description,
      basePrice: servicePlans.basePrice,
      annualDiscount: servicePlans.annualDiscount,
      callsPerMonth: servicePlans.callsPerMonth,
      callDurationMinutes: servicePlans.callDurationMinutes,
      isActive: servicePlans.isActive,
      planType: servicePlans.planType,
      stripeProductId: servicePlans.stripeProductId,
      stripeMonthlyPriceId: servicePlans.stripeMonthlyPriceId,
      stripeAnnualPriceId: servicePlans.stripeAnnualPriceId,
      createdAt: servicePlans.createdAt,
      updatedAt: servicePlans.updatedAt,
      serviceIds: sql<number[]>`
        coalesce(
          array_agg(${servicePlanServices.serviceId})
          filter (where ${servicePlanServices.serviceId} is not null),
          array[]::int[]
        )
      `,
    };
  }

  async getServicePlan(
    id: number,
  ): Promise<ServicePlanWithServices | undefined> {
    const [plan] = await this.db
      .select({
        ...this.servicePlanSelect(),
      })
      .from(servicePlans)
      .leftJoin(
        servicePlanServices,
        eq(servicePlans.id, servicePlanServices.servicePlanId),
      )
      .where(eq(servicePlans.id, id))
      .groupBy(servicePlans.id);

    return plan || undefined;
  }

  async getDefaultServicePlan(): Promise<ServicePlanWithServices | undefined> {
    const [plan] = await this.db
      .select({
        ...this.servicePlanSelect(),
      })
      .from(servicePlans)
      .leftJoin(
        servicePlanServices,
        eq(servicePlans.id, servicePlanServices.servicePlanId),
      )
      .where(eq(servicePlans.isActive, true))
      .groupBy(servicePlans.id)
      .orderBy(servicePlans.createdAt)
      .limit(1);

    return plan || undefined;
  }

  async findServicePlanByPriceId(
    priceId: string,
  ): Promise<SelectServicePlan | null> {
    try {
      // Query the database to find a service plan with matching monthly or annual price ID
      const plan = await this.db
        .select()
        .from(servicePlans)
        .where(
          or(
            eq(servicePlans.stripeMonthlyPriceId, priceId),
            eq(servicePlans.stripeAnnualPriceId, priceId),
          ),
        )
        .limit(1);

      return plan[0] || null;
    } catch (error) {
      console.error(
        `Error finding service plan by price ID ${priceId}:`,
        error,
      );
      return null;
    }
  }

  async createServicePlan(
    planData: InsertServicePlan & { serviceIds?: number[] },
  ): Promise<ServicePlanWithServices> {
    const { serviceIds, ...planFields } = planData;

    // Create Product + Prices in Stripe
    const stripeData = await stripeSync.createProductAndPrices(planFields);

    // Insert plan with Stripe IDs
    const [plan] = await this.db
      .insert(servicePlans)
      .values({
        ...planFields,
        stripeProductId: stripeData.productId,
        stripeMonthlyPriceId: stripeData.monthlyPriceId,
        stripeAnnualPriceId: stripeData.annualPriceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update metadata with real plan ID
    await stripeSync.updateProductMetadata(stripeData.productId, {
      planType: planFields.planType,
      internalPlanId: plan.id.toString(),
    });

    // Insert associated services
    if (serviceIds && serviceIds.length > 0) {
      await this.db.insert(servicePlanServices).values(
        serviceIds.map((serviceId) => ({
          servicePlanId: plan.id,
          serviceId,
          createdAt: new Date(),
        })),
      );
    }

    return {
      ...plan,
      serviceIds: serviceIds || [],
    };
  }

  async updateServicePlan(
    id: number,
    updates: Partial<InsertServicePlan> & { serviceIds?: number[] },
  ): Promise<ServicePlanWithServices> {
    const { serviceIds, ...planUpdates } = updates;

    // Fetch existing plan
    const existingPlan = await this.getServicePlan(id);
    if (!existingPlan) {
      throw new Error(`Service plan with id ${id} not found`);
    }

    // Update plan
    const [plan] = await this.db
      .update(servicePlans)
      .set({
        ...planUpdates,
        updatedAt: new Date(),
      })
      .where(eq(servicePlans.id, id))
      .returning();

    if (!plan) {
      throw new Error(`Service plan with id ${id} not found after update`);
    }

    let { stripeProductId, stripeMonthlyPriceId, stripeAnnualPriceId } =
      existingPlan;

    // Stripe operations
    if (!stripeProductId) {
      const stripeData = await stripeSync.createProductAndPrices({
        ...plan,
        internalPlanId: plan.id.toString(),
      });

      stripeProductId = stripeData.productId;
      stripeMonthlyPriceId = stripeData.monthlyPriceId;
      stripeAnnualPriceId = stripeData.annualPriceId;

      // Save new Stripe IDs
      await this.db
        .update(servicePlans)
        .set({
          stripeProductId,
          stripeMonthlyPriceId,
          stripeAnnualPriceId,
          updatedAt: new Date(),
        })
        .where(eq(servicePlans.id, id));
    } else {
      // Update existing product
      const productUpdates: Partial<{
        name: string;
        description: string;
        active: boolean;
      }> = {};

      if (planUpdates.name !== undefined)
        productUpdates.name = planUpdates.name;
      if (planUpdates.description !== undefined)
        productUpdates.description = planUpdates.description || "";
      if (planUpdates.isActive != null)
        productUpdates.active = planUpdates.isActive;

      if (Object.keys(productUpdates).length > 0) {
        await stripeSync.updateProduct(stripeProductId, productUpdates);
      }

      // Recreate prices if pricing changed
      if (
        planUpdates.basePrice !== undefined ||
        planUpdates.annualDiscount !== undefined
      ) {
        await stripeSync.archivePrices(
          stripeMonthlyPriceId,
          stripeAnnualPriceId,
        );

        const newPrices = await stripeSync.archiveOldAndCreateNewPrices(
          stripeProductId,
          plan.basePrice,
          plan.annualDiscount || 0,
        );

        stripeMonthlyPriceId = newPrices.monthlyPriceId;
        stripeAnnualPriceId = newPrices.annualPriceId;

        await this.db
          .update(servicePlans)
          .set({
            stripeMonthlyPriceId,
            stripeAnnualPriceId,
            updatedAt: new Date(),
          })
          .where(eq(servicePlans.id, id));
      }
    }

    // Replace associated services
    await this.db
      .delete(servicePlanServices)
      .where(eq(servicePlanServices.servicePlanId, id));

    if (serviceIds && serviceIds.length > 0) {
      await this.db.insert(servicePlanServices).values(
        serviceIds.map((serviceId) => ({
          servicePlanId: id,
          serviceId,
          createdAt: new Date(),
        })),
      );
    }

    return {
      ...plan,
      serviceIds: serviceIds || [],
    };
  }

  async deleteServicePlan(id: number): Promise<void> {
    const plan = await this.getServicePlan(id);
    if (!plan) return;

    // Archive Stripe product and prices (if they exist)
    if (plan.stripeProductId) {
      await stripeSync.archiveProductAndPrices(
        plan.stripeProductId,
        plan.stripeMonthlyPriceId,
        plan.stripeAnnualPriceId,
      );
    }

    // Delete from database (cascades to service_plan_services)
    await this.db.delete(servicePlans).where(eq(servicePlans.id, id));
  }

  // Services linked with service plans
  async getServices(): Promise<SelectService[]> {
    return await this.db
      .select()
      .from(services)
      .orderBy(desc(services.createdAt));
  }

  async getService(id: number): Promise<SelectService | undefined> {
    const [service] = await this.db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<SelectService> {
    const [service] = await this.db
      .insert(services)
      .values({
        ...serviceData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return service;
  }

  async updateService(
    id: number,
    updates: Partial<InsertService>,
  ): Promise<SelectService> {
    const [service] = await this.db
      .update(services)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<void> {
    await this.db.delete(services).where(eq(services.id, id));
  }
}
