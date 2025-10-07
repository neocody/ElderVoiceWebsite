import Stripe from "stripe";
import { storage } from "../storage";
import type {
  InsertSubscription,
  InsertInvoice,
} from "../../shared/schema";

export class StripeSyncService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET) {
      throw new Error("Missing required Stripe secret: STRIPE_SECRET");
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET, {
      apiVersion: "2025-06-30.basil",
    });
  }
  /**
   * Creates a Stripe customer for a client
   */
  async createStripeCustomer(client: {
    name: string;
    billingEmail: string;
    billingPhone?: string | null;
  }): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        name: client.name,
        email: client.billingEmail,
        phone: client.billingPhone || undefined,
        metadata: {
          source: "ai-companion-platform",
        },
      });

      return customer.id;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw error;
    }
  }

  /**
   * Creates a Stripe subscription for a client
   */
  async createStripeSubscription({
    customerId,
    priceId,
    trialPeriodDays,
    metadata = {},
  }: {
    customerId: string;
    priceId: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays || 0,
        payment_behavior: "default_incomplete",
        metadata,
        expand: ["latest_invoice.payment_intent"],
      });

      return subscription;
    } catch (error) {
      console.error("Error creating Stripe subscription:", error);
      throw error;
    }
  }

  /**
   * Updates a Stripe subscription (change plan, add/remove items)
   */
  async updateStripeSubscription(
    subscriptionId: string,
    updates: {
      newPriceId?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items"],
      });

      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (updates.newPriceId) {
        // Update subscription items
        updateParams.items = [
          {
            id: subscription.items.data[0].id,
            price: updates.newPriceId,
          },
        ];
        updateParams.proration_behavior = "create_prorations";
      }

      if (updates.metadata) {
        updateParams.metadata = updates.metadata;
      }

      return await this.stripe.subscriptions.update(subscriptionId, updateParams);
    } catch (error) {
      console.error(
        `Error updating Stripe subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cancels a Stripe subscription
   */
  async cancelStripeSubscription(
    subscriptionId: string,
    atPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: atPeriodEnd,
      });
    } catch (error) {
      console.error(
        `Error canceling Stripe subscription ${subscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Archives (deactivates) a Stripe Product and its associated prices
   */
  async archiveProductAndPrices(
    productId: string,
    monthlyPriceId?: string | null,
    annualPriceId?: string | null,
  ): Promise<void> {
    // Archive product
    await this.stripe.products.update(productId, { active: false });

    // Archive prices (if provided)
    await this.archivePrices(monthlyPriceId ?? null, annualPriceId ?? null);
  }

  // create Stripe product and prices
  async createProductAndPrices(planData: {
    name: string;
    description?: string | null;
    planType: string;
    basePrice: number;
    annualDiscount?: number | null;
    isActive?: boolean | null;
    internalPlanId?: string;
  }): Promise<{
    productId: string;
    monthlyPriceId: string;
    annualPriceId: string;
  }> {
    // Create Stripe Product
    const stripeProduct = await this.stripe.products.create({
      name: planData.name,
      description: planData.description || "",
      metadata: {
        planType: planData.planType,
        internalPlanId: planData.internalPlanId || "TBD",
      },
      active: planData.isActive !== false, // default true
    });

    // Calculate annual price (apply discount)
    const monthlyAmount = planData.basePrice; // in cents
    const annualAmountBeforeDiscount = monthlyAmount * 12;
    const annualDiscountPercent = planData.annualDiscount || 0;
    const annualAmount = Math.round(
      annualAmountBeforeDiscount * (1 - annualDiscountPercent / 100),
    );

    // Create Monthly Price
    const monthlyPrice = await this.stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: monthlyAmount,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { billingCycle: "monthly" },
    });

    // Create Annual Price
    const annualPrice = await this.stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: annualAmount,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { billingCycle: "annual" },
    });

    return {
      productId: stripeProduct.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    };
  }

  /**
   * Updates an existing Stripe Product (name, description, active)
   */
  async updateProduct(
    productId: string,
    updates: Partial<{
      name: string;
      description: string;
      active: boolean;
    }>,
  ): Promise<void> {
    if (Object.keys(updates).length === 0) return;

    await this.stripe.products.update(productId, updates);
  }

  /**
   * Archives old prices and creates new monthly + annual prices for a product
   * Returns new price IDs
   */
  async archiveOldAndCreateNewPrices(
    productId: string,
    basePrice: number,
    annualDiscount: number = 0,
  ): Promise<{ monthlyPriceId: string; annualPriceId: string }> {
    // Calculate new prices
    const monthlyAmount = basePrice;
    const annualAmountBeforeDiscount = monthlyAmount * 12;
    const annualAmount = Math.round(
      annualAmountBeforeDiscount * (1 - annualDiscount / 100),
    );

    // Create new prices
    const newMonthlyPrice = await this.stripe.prices.create({
      product: productId,
      unit_amount: monthlyAmount,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { billingCycle: "monthly" },
    });

    const newAnnualPrice = await this.stripe.prices.create({
      product: productId,
      unit_amount: annualAmount,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { billingCycle: "annual" },
    });

    return {
      monthlyPriceId: newMonthlyPrice.id,
      annualPriceId: newAnnualPrice.id,
    };
  }

  /**
   * Archives (deactivates) Stripe prices by ID
   */
  async archivePrices(...priceIds: (string | null)[]): Promise<void> {
    for (const priceId of priceIds) {
      if (priceId) {
        await this.stripe.prices.update(priceId, { active: false });
      }
    }
  }

  /**
   * Updates Stripe Product metadata
   */
  async updateProductMetadata(
    productId: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    await this.stripe.products.update(productId, { metadata });
  }

  /**
   * Processes a Stripe webhook event
   */
  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      console.log(`Processing webhook event: ${event.type}`);

      switch (event.type) {
        case "customer.subscription.created":
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "invoice.payment_succeeded":
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      throw error; // Re-throw to indicate failure
    }
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    console.log("Processing subscription created:", subscription.id);

    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price.id;

    if (!priceId) {
      console.error(`No price ID found for subscription ${subscription.id}`);
      return;
    }

    // Find the service plan by matching the price ID
    const servicePlan = await storage.findServicePlanByPriceId(priceId);

    if (!servicePlan) {
      console.error(
        `No service plan found for price ID ${priceId} in subscription ${subscription.id}`,
      );
      return;
    }

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.warn(`No user found for Stripe customer: ${customerId}`);
      return;
    }

    // Create subscription data
    const subscriptionData: InsertSubscription = {
      userId: user.id,
      planId: servicePlan.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeLatestInvoiceId: subscription.latest_invoice
        ? typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice.id
        : null,
      stripePaymentMethodId: subscription.default_payment_method
        ? typeof subscription.default_payment_method === "string"
          ? subscription.default_payment_method
          : subscription.default_payment_method.id
        : null,
      status: subscription.status as any,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000,
      ),
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      endedAt: subscription.ended_at
        ? new Date(subscription.ended_at * 1000)
        : null,
      metadata: subscription.metadata || {},
    };

    try {
      // Check if already exists (idempotency)
      let existing = await storage.getSubscriptionByStripeId(subscription.id);
      if (existing) {
        console.log(
          `Subscription ${subscription.id} already exists, updating...`,
        );
        await storage.updateSubscription(existing.id, subscriptionData);
      } else {
        console.log(`Creating new subscription ${subscription.id}...`);
        await storage.createSubscription(subscriptionData);
      }

      console.log(
        `Successfully processed subscription ${subscription.id} for plan ${servicePlan.name}`,
      );
    } catch (error) {
      console.error(`Failed to save subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    console.log("Processing subscription updated:", subscription.id);

    const existing = await storage.getSubscriptionByStripeId(subscription.id);
    if (!existing) {
      console.warn(
        `Subscription not found locally for Stripe ID: ${subscription.id}, creating it...`,
      );
      // If subscription doesn't exist, create it
      await this.handleSubscriptionCreated(subscription);
      return;
    }

    // Get the current price ID and check if plan changed
    const currentPriceId = subscription.items.data[0]?.price.id;
    let planId = existing.planId;

    // If price changed, find the new plan
    if (currentPriceId && currentPriceId !== existing.stripePriceId) {
      const newServicePlan =
        await storage.findServicePlanByPriceId(currentPriceId);
      if (newServicePlan) {
        planId = newServicePlan.id;
        console.log(
          `Plan changed from ${existing.planId} to ${planId} for subscription ${subscription.id}`,
        );
      } else {
        console.warn(
          `Could not find service plan for new price ID ${currentPriceId}`,
        );
      }
    }

    const updates: Partial<InsertSubscription> = {
      planId, // Update plan if it changed
      stripePriceId: currentPriceId || existing.stripePriceId,
      stripeLatestInvoiceId: subscription.latest_invoice
        ? typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice.id
        : existing.stripeLatestInvoiceId,
      stripePaymentMethodId: subscription.default_payment_method
        ? typeof subscription.default_payment_method === "string"
          ? subscription.default_payment_method
          : subscription.default_payment_method.id
        : existing.stripePaymentMethodId,
      status: subscription.status as any,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : existing.trialStart,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : existing.trialEnd,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000,
      ),
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : existing.canceledAt,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      endedAt: subscription.ended_at
        ? new Date(subscription.ended_at * 1000)
        : existing.endedAt,
      metadata: subscription.metadata || existing.metadata,
    };

    try {
      await storage.updateSubscription(existing.id, updates);
      console.log(`Successfully updated subscription ${subscription.id}`);
    } catch (error) {
      console.error(`Failed to update subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    console.log("Processing subscription deleted:", subscription.id);

    const existing = await storage.getSubscriptionByStripeId(subscription.id);
    if (!existing) {
      console.warn(
        `Subscription not found locally for Stripe ID: ${subscription.id}`,
      );
      return;
    }

    try {
      storage.cancelSubscription(existing.id);
      console.log(`Successfully deleted subscription ${subscription.id}`);
    } catch (error) {
      console.error(`Failed to delete subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log("Processing payment succeeded:", invoice.id);

    // Handle case where invoice.id might be undefined
    if (!invoice.id) {
      console.error("Invoice ID is missing");
      return;
    }

    const stripeSubscriptionId = (invoice as any).subscription
      ? typeof (invoice as any).subscription === "string"
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id
      : null;

    if (!stripeSubscriptionId) {
      console.warn(`No subscription linked to invoice ${invoice.id}`);
      return;
    }

    // CRITICAL FIX: Get the local subscription record first
    let localSubscription =
      await storage.getSubscriptionByStripeId(stripeSubscriptionId);

    // If subscription doesn't exist locally yet, we need to handle this gracefully
    if (!localSubscription) {
      console.warn(
        `Local subscription not found for Stripe ID: ${stripeSubscriptionId}. ` +
          `This might happen if payment succeeded before subscription.created event.`,
      );

      // Try to fetch the subscription from Stripe and create it locally
      try {
        const stripeSubscription =
          await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
        await this.handleSubscriptionCreated(stripeSubscription);

        // Now try to get the local subscription again
        localSubscription =
          await storage.getSubscriptionByStripeId(stripeSubscriptionId);

        if (!localSubscription) {
          console.error(
            `Failed to create local subscription for ${stripeSubscriptionId}`,
          );
          return;
        }
      } catch (error) {
        console.error(
          `Failed to retrieve subscription ${stripeSubscriptionId} from Stripe:`,
          error,
        );
        return;
      }
    }

    // Create invoice data using the LOCAL subscription ID (integer)
    const invoiceData: InsertInvoice = {
      subscriptionId: localSubscription.id, // This is the integer ID from our database
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: (invoice as any).payment_intent
        ? typeof (invoice as any).payment_intent === "string"
          ? (invoice as any).payment_intent
          : (invoice as any).payment_intent?.id || null
        : null,
      amountDue: invoice.amount_due || 0,
      amountPaid: invoice.amount_paid || 0,
      currency: invoice.currency || "usd",
      status: (invoice.status as any) || "draft",
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      pdfUrl: invoice.invoice_pdf || null,
    };

    try {
      let existingInvoice = await storage.getInvoiceByStripeId(invoice.id);
      if (existingInvoice) {
        console.log(`Updating existing invoice ${invoice.id}`);
        await storage.updateInvoice(existingInvoice.id, invoiceData);
      } else {
        console.log(`Creating new invoice ${invoice.id}`);
        await storage.createInvoice(invoiceData);
      }
    } catch (error) {
      console.error(`Failed to save invoice ${invoice.id}:`, error);
      throw error;
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log("Processing payment failed:", invoice.id);

    if (!invoice.id) {
      console.error("Invoice ID is missing");
      return;
    }

    const stripeSubscriptionId = (invoice as any).subscription
      ? typeof (invoice as any).subscription === "string"
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id
      : null;

    if (!stripeSubscriptionId) {
      console.warn(`No subscription linked to failed invoice ${invoice.id}`);
      return;
    }

    try {
      const existingInvoice = await storage.getInvoiceByStripeId(invoice.id);
      if (existingInvoice) {
        await storage.updateInvoice(existingInvoice.id, {
          status: (invoice.status as any) || "open",
          amountPaid: invoice.amount_paid || 0,
        });
      } else {
        // Get the local subscription record
        const localSubscription =
          await storage.getSubscriptionByStripeId(stripeSubscriptionId);

        if (!localSubscription) {
          console.warn(
            `No local subscription found for failed invoice subscription: ${stripeSubscriptionId}`,
          );
          return;
        }

        await storage.createInvoice({
          subscriptionId: localSubscription.id, // Use local integer ID
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: (invoice as any).payment_intent
            ? typeof (invoice as any).payment_intent === "string"
              ? (invoice as any).payment_intent
              : (invoice as any).payment_intent?.id || null
            : null,
          amountDue: invoice.amount_due || 0,
          amountPaid: invoice.amount_paid || 0,
          currency: invoice.currency || "usd",
          status: (invoice.status as any) || "open",
          hostedInvoiceUrl: invoice.hosted_invoice_url || null,
          pdfUrl: invoice.invoice_pdf || null,
        });
      }
    } catch (error) {
      console.error(
        `Failed to handle payment failed for invoice ${invoice.id}:`,
        error,
      );
      throw error;
    }
  }
}

// Lazy singleton initialization
let stripeService: StripeSyncService | null = null;

function getStripeSync(): StripeSyncService {
  if (!stripeService) {
    stripeService = new StripeSyncService();
  }
  return stripeService;
}

// Export with proxy to maintain API compatibility
export const stripeSync = new Proxy({} as StripeSyncService, {
  get(target, prop) {
    const instance = getStripeSync();
    const value = instance[prop as keyof StripeSyncService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
