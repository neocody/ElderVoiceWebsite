import Stripe from "stripe";
import type { Express } from "express";
import { storage } from "../storage";
import {
  isAuthenticated,
  requireRole,
  withUserProfile,
} from "../middleware/auth";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET) {
      throw new Error("Missing required Stripe secret: STRIPE_SECRET");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET, {
      apiVersion: "2025-06-30.basil",
    });
  }
  return stripeClient;
}

export function registerBillingRoutes(app: Express) {
  // Webhook for Stripe events
  app.post("/api/billing/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing signature or webhook secret");
      return res.status(400).send("Missing signature or webhook secret");
    }

    try {
      let event: Stripe.Event;

      // Verify we have raw body data
      if (Buffer.isBuffer(req.body)) {
        event = getStripe().webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } else if (typeof req.body === "string") {
        // Fallback for express.text() middleware
        event = getStripe().webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } else {
        console.error(
          "Webhook body is not raw - received parsed object:",
          typeof req.body,
        );
        return res.status(400).send("Webhook body must be raw");
      }

      console.log(`Received webhook event: ${event.type}`);

      // Handle the event using your Stripe sync service
      const { stripeSync } = await import("../services/stripeSync");
      await stripeSync.processWebhookEvent(event);

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      // More specific error handling
      if (error.type === "StripeSignatureVerificationError") {
        console.error("Stripe signature verification failed");
        console.error("Make sure STRIPE_WEBHOOK_SECRET is correctly set");
        return res.status(400).send("Invalid signature");
      }
      res.status(400).send(`Webhook error: ${error.message}`);
    }
  });

  //create checkout session link for Stripe (old)
  app.post(
    "/api/billing/create-checkout-session",
    isAuthenticated,
    withUserProfile,
    async (req, res) => {
      try {
        const { planId, billingCycle } = req.body;

        if (!planId || !billingCycle) {
          return res
            .status(400)
            .json({ error: "Missing planId or billingCycle" });
        }

        const plan = await storage.getServicePlan(parseInt(planId));
        if (!plan) {
          return res.status(404).json({ error: "Plan not found" });
        }

        const priceId =
          billingCycle === "monthly"
            ? plan.stripeMonthlyPriceId
            : plan.stripeAnnualPriceId;

        if (!priceId) {
          return res.status(400).json({
            error: "No Stripe price configured for this billing cycle",
          });
        }

        const frontendURL =
          process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL_PROD
            : process.env.FRONTEND_URL_DEV;

        // Get user's existing Stripe Customer ID from profile
        let userStripeCustomerId = req.user?.profile?.stripeCustomerId;

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${frontendURL}/onboarding`,
          cancel_url: `${frontendURL}/pricing`,
          client_reference_id: req.user!.id,
          metadata: {
            planId: plan.id.toString(),
            userId: req.user!.id,
          },
        };

        // If user already has a Stripe customer, reuse it
        if (userStripeCustomerId) {
          sessionParams.customer = userStripeCustomerId;
        } else {
          // Create a new Stripe Customer for this user
          console.log(`Creating new Stripe customer for user: ${req.user!.id}`);

          const stripeCustomer = await getStripe().customers.create({
            email: req.user?.profile?.email || undefined,
            name:
              req.user?.profile?.firstName && req.user?.profile?.lastName
                ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
                : undefined,
            metadata: {
              userId: req.user!.id,
            },
          });

          // Update user record with new stripeCustomerId
          await storage.updateUser(req.user!.id, {
            stripeCustomerId: stripeCustomer.id,
          });

          // Assign to session
          sessionParams.customer = stripeCustomer.id;
          userStripeCustomerId = stripeCustomer.id; // for any future use in this scope

          console.log(
            `Assigned new Stripe customer ${stripeCustomer.id} to user ${
              req.user!.id
            }`,
          );
        }

        const session = await getStripe().checkout.sessions.create(sessionParams);

        res.json({ url: session.url });
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
      }
    },
  );

  // Create checkout session for signup flow (new)
  app.post(
    "/api/billing/create-signup-checkout-session",
    isAuthenticated,
    withUserProfile,
    async (req, res) => {
      try {
        const plan = await storage.getDefaultServicePlan();
        if (!plan) {
          return res
            .status(404)
            .json({ error: "No active service plan available" });
        }

        const priceId = plan.stripeMonthlyPriceId || plan.stripeAnnualPriceId;
        if (!priceId) {
          return res.status(400).json({
            error: "Selected plan is missing Stripe pricing information",
          });
        }

        const frontendURL =
          process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL_PROD
            : process.env.FRONTEND_URL_DEV;

        if (!frontendURL) {
          return res.status(500).json({
            error: "Frontend URL configuration missing",
          });
        }

        const userProfile = req.user?.profile;
        if (!userProfile) {
          return res.status(500).json({ error: "User profile not loaded" });
        }

        let stripeCustomerId = userProfile.stripeCustomerId;

        if (!stripeCustomerId) {
          const stripeCustomer = await getStripe().customers.create({
            email: userProfile.email || undefined,
            name:
              userProfile.firstName && userProfile.lastName
                ? `${userProfile.firstName} ${userProfile.lastName}`
                : userProfile.firstName || userProfile.lastName || undefined,
            phone: userProfile.phone || undefined,
            metadata: {
              userId: req.user!.id,
            },
          });

          stripeCustomerId = stripeCustomer.id;
          await storage.updateUser(req.user!.id, {
            stripeCustomerId,
          });
        }

        const metadata: Record<string, string> = {
          signupFlow: "true",
          planId: plan.id.toString(),
          userId: req.user!.id,
        };

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          customer: stripeCustomerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          subscription_data: {
            trial_period_days: 7,
          },
          metadata,
          client_reference_id: req.user!.id,
          ui_mode: "embedded",
          return_url: `${frontendURL}/getstarted?session_id={CHECKOUT_SESSION_ID}`,
        };

        const session = await getStripe().checkout.sessions.create(sessionParams);

        res.json({
          clientSecret: session.client_secret,
          sessionId: session.id,
        });
      } catch (error: any) {
        console.error("Error creating signup checkout session:", error);
        res.status(500).json({
          error: "Failed to create checkout session",
          message: error.message,
        });
      }
    },
  );

  // Get checkout session status
  app.get("/api/billing/session-status", async (req, res) => {
    try {
      const { session_id } = req.query;

      if (!session_id || typeof session_id !== "string") {
        return res.status(400).json({ error: "Missing or invalid session_id" });
      }

      // Retrieve the session from Stripe
      const session = await getStripe().checkout.sessions.retrieve(session_id, {
        expand: ["subscription", "customer"],
      });

      // Normalize response for your frontend
      res.json({
        id: session.id,
        status: session.status, // "open" | "complete" | "expired"
        customer_email: session.customer_email,
        subscription_id:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id,
      });
    } catch (error: any) {
      console.error("Error retrieving session status:", error);
      res.status(500).json({
        error: "Failed to retrieve session status",
        message: error.message,
      });
    }
  });

  // GET /api/admin/stats/billing
  app.get(
    "/api/admin/stats/billing",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const totalRevenue = await storage.getTotalRevenue();
        const monthlyRevenue = await storage.getMonthlyRevenue();
        const activeSubscriptions = await storage.getActiveSubscriptionsCount();
        const trialSubscriptions = await storage.getTrialSubscriptionsCount();

        res.json({
          totalRevenue,
          monthlyRevenue,
          activeSubscriptions,
          trialSubscriptions,
        });
      } catch (error) {
        console.error("Failed to fetch billing stats:", error);
        res.status(500).json({ error: "Failed to fetch billing stats" });
      }
    },
  );

  // GET /api/billing/subscriptions
  app.get(
    "/api/billing/subscriptions",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const subscriptions = await storage.getAllSubscriptions();

        const transformedSubscriptions = subscriptions.map((sub) => ({
          id: sub.id,
          userId: sub.userId,
          facilityId: null, // Extend if needed
          planId: sub.planId.toString(),
          status: sub.status,
          amount: sub.amount,
          planName: sub.planName,
          patientCount: 0, // Replace with real logic
          currentPeriodStart: sub.currentPeriodStart?.toISOString() || "",
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || "",
          createdAt: sub.createdAt?.toISOString() || "",
        }));

        res.json(transformedSubscriptions);
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
        res.status(500).json({ error: "Failed to fetch subscriptions" });
      }
    },
  );

  // GET /api/billing/transactions
  app.get(
    "/api/billing/transactions",
    isAuthenticated,
    requireRole(["administrator"]),
    async (req, res) => {
      try {
        const invoices = await storage.getAllInvoices();
        res.json(invoices);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
      }
    },
  );

  // Create payment intent for one-time payments and subscriptions
  app.post("/api/billing/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "usd", description, customer } = req.body;

      // Create customer if provided
      let customerId;
      if (customer?.email) {
        const stripeCustomer = await getStripe().customers.create({
          email: customer.email,
          phone: customer.phone,
        });
        customerId = stripeCustomer.id;
      }

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(amount), // Already in cents
        currency,
        description,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        customerId,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({
        message: "Error creating payment intent: " + error.message,
      });
    }
  });

  // Create subscription
  app.post("/api/billing/create-subscription", async (req, res) => {
    try {
      const { customerId, priceId, trialPeriodDays = 7 } = req.body;

      const subscription = await getStripe().subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays,
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent
          ?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({
        message: "Error creating subscription: " + error.message,
      });
    }
  });

  // Assign a plan to a client
  app.post("/api/billing/assign-plan", async (req, res) => {
    try {
      const { clientId, planId, trialDays } = req.body;

      if (!clientId || !planId) {
        return res
          .status(400)
          .json({ error: "Client ID and Plan ID are required" });
      }

      const { planEnforcement } = await import(
        "../services/planEnforcementService"
      );
      const { stripeSync } = await import("../services/stripeSync");
      const { storage } = await import("../storage");

      // Validate plan change
      const validation = await planEnforcement.validatePlanChange(
        clientId,
        planId,
      );
      if (!validation.isAllowed) {
        return res.status(400).json({
          error: validation.reason,
          currentUsage: validation,
        });
      }

      // Get client and plan details
      const client = await storage.getClient(clientId);
      const plan = await storage.getServicePlan(planId);

      if (!client || !plan) {
        return res.status(404).json({ error: "Client or plan not found" });
      }

      // Ensure Stripe customer exists
      let stripeCustomerId = (client as any).stripeCustomerId;
      if (!stripeCustomerId) {
        stripeCustomerId = await stripeSync.createStripeCustomer({
          name: client.name,
          billingEmail: client.billingEmail,
          billingPhone: client.billingPhone,
        });

        // Update client with Stripe customer ID
        await storage.updateClient(clientId, {
          stripeCustomerId,
        } as any);
      }

      // Get appropriate Stripe price ID
      const stripePriceId =
        (plan as any).stripePriceIdMonthly || (plan as any).stripePriceIdAnnual;
      if (!stripePriceId) {
        return res.status(400).json({
          error:
            "Plan not configured with Stripe pricing. Please sync plan first.",
        });
      }

      // Create Stripe subscription
      const subscription = await stripeSync.createStripeSubscription({
        customerId: stripeCustomerId,
        priceId: stripePriceId,
        trialPeriodDays: trialDays || (plan as any).freeTrialDays || 0,
        metadata: {
          clientId: clientId.toString(),
          planId: planId.toString(),
        },
      });

      // Create local service record
      const service = await storage.createService({
        clientId,
        planId,
        serviceName: `${plan.name} - ${client.name}`,
        status: "active",
        monthlyPrice: plan.basePrice,
        stripeSubscriptionId: subscription.id,
        frequency: "daily",
        timeOfDay: "10:00",
        configuredBy: (req as any).session?.user?.id || "system",
      } as any);

      res.json({
        success: true,
        service,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent
            ?.client_secret,
        },
        prorationAmount: validation.prorationAmount,
      });
    } catch (error: any) {
      console.error("Error assigning plan:", error);
      res
        .status(500)
        .json({ error: "Failed to assign plan: " + error.message });
    }
  });

  // Validate plan limits (for use in middleware)
  app.post("/api/billing/validate-limit", async (req, res) => {
    try {
      const { clientId, limitType, serviceId } = req.body;

      const { planEnforcement } = await import(
        "../services/planEnforcementService"
      );

      let validation;
      switch (limitType) {
        case "patient":
          validation = await planEnforcement.validatePatientLimit(clientId);
          break;
        case "call":
          if (!serviceId) {
            return res
              .status(400)
              .json({ error: "Service ID required for call limit validation" });
          }
          validation = await planEnforcement.validateCallLimit(
            clientId,
            serviceId,
          );
          break;
        default:
          return res.status(400).json({ error: "Invalid limit type" });
      }

      res.json(validation);
    } catch (error: any) {
      console.error("Error validating limit:", error);
      res
        .status(500)
        .json({ error: "Failed to validate limit: " + error.message });
    }
  });

  // Check feature access
  app.post("/api/billing/check-feature", async (req, res) => {
    try {
      const { clientId, feature } = req.body;

      if (!clientId || !feature) {
        return res
          .status(400)
          .json({ error: "Client ID and feature are required" });
      }

      const { planEnforcement } = await import(
        "../services/planEnforcementService"
      );
      const result = await planEnforcement.validateFeatureAccess(
        clientId,
        feature,
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error checking feature access:", error);
      res
        .status(500)
        .json({ error: "Failed to check feature access: " + error.message });
    }
  });

  // Track call usage
  app.post("/api/billing/track-usage", async (req, res) => {
    try {
      const { clientId, serviceId, durationSeconds } = req.body;

      if (!clientId || !serviceId || durationSeconds === undefined) {
        return res
          .status(400)
          .json({ error: "Client ID, service ID, and duration are required" });
      }

      const { planEnforcement } = await import(
        "../services/planEnforcementService"
      );
      await planEnforcement.trackCallUsage(
        clientId,
        serviceId,
        durationSeconds,
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error tracking usage:", error);
      res
        .status(500)
        .json({ error: "Failed to track usage: " + error.message });
    }
  });

  // Get client usage statistics
  app.get("/api/billing/usage/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const { month, year } = req.query;

      if (!clientId) {
        return res.status(400).json({ error: "Invalid client ID" });
      }

      const { storage } = await import("../storage");
      const currentDate = new Date();
      const targetMonth = month
        ? parseInt(month as string)
        : currentDate.getMonth() + 1;
      const targetYear = year
        ? parseInt(year as string)
        : currentDate.getFullYear();

      const usage = await storage.getClientUsageByMonth(
        clientId,
        targetMonth,
        targetYear,
      );

      // Get client's active service plan for context
      const services = await storage.getServicesByClient(clientId);
      const activeService = services.find((s) => s.status === "active");
      let planLimits = null;

      if (activeService && activeService.planId) {
        const plan = await storage.getServicePlan(activeService.planId);
        if (plan) {
          planLimits = {
            maxPatients: (plan as any).maxPatients,
            callsPerMonth: (plan as any).callsPerMonth,
            allowOverages: (plan as any).allowOverages,
          };
        }
      }

      res.json({
        usage: usage || {
          clientId,
          month: targetMonth,
          year: targetYear,
          callsCompleted: 0,
          totalCallMinutes: 0,
          patientsActive: 0,
          overageCalls: 0,
          overageCharges: 0,
        },
        planLimits,
        activeService,
      });
    } catch (error: any) {
      console.error("Error getting usage:", error);
      res.status(500).json({ error: "Failed to get usage: " + error.message });
    }
  });
}
