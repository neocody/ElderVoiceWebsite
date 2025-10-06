import type { Request, Response, NextFunction } from "express";
import { planEnforcement } from "../services/planEnforcementService";
import { storage } from "../storage";

interface PlanEnforcementOptions {
  feature?: string;
  limitType?: 'patient' | 'call';
  skipIfNoClient?: boolean;
}

/**
 * Middleware to enforce plan limits and feature access
 */
export function enforcePlanLimits(options: PlanEnforcementOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract client ID from request (could be in body, params, or query)
      const clientId = parseInt(
        req.body?.clientId || 
        req.params?.clientId || 
        req.query?.clientId as string
      );

      // If no client ID found and skipIfNoClient is true, continue
      if (!clientId && options.skipIfNoClient) {
        return next();
      }

      if (!clientId) {
        return res.status(400).json({ 
          error: "Client ID is required for plan enforcement",
          code: "MISSING_CLIENT_ID"
        });
      }

      // Check feature access if feature is specified
      if (options.feature) {
        const featureAccess = await planEnforcement.validateFeatureAccess(clientId, options.feature);
        if (!featureAccess.hasAccess) {
          return res.status(403).json({
            error: "Feature not available in your plan",
            feature: options.feature,
            reason: featureAccess.reason,
            code: "FEATURE_NOT_AVAILABLE"
          });
        }
      }

      // Check limits if limit type is specified
      if (options.limitType) {
        let validation;
        
        switch (options.limitType) {
          case 'patient':
            validation = await planEnforcement.validatePatientLimit(clientId);
            break;
            
          case 'call':
            const serviceId = parseInt(
              req.body?.serviceId || 
              req.params?.serviceId ||
              req.query?.serviceId as string
            );
            
            if (!serviceId) {
              return res.status(400).json({ 
                error: "Service ID is required for call limit validation",
                code: "MISSING_SERVICE_ID"
              });
            }
            
            validation = await planEnforcement.validateCallLimit(clientId, serviceId);
            break;
            
          default:
            return res.status(400).json({ 
              error: "Invalid limit type",
              code: "INVALID_LIMIT_TYPE"
            });
        }

        if (!validation.isAllowed) {
          const statusCode = validation.overageAllowed ? 200 : 403;
          return res.status(statusCode).json({
            error: validation.reason,
            currentUsage: validation.currentUsage,
            limit: validation.limit,
            overageAllowed: validation.overageAllowed,
            code: validation.overageAllowed ? "OVERAGE_APPLIED" : "LIMIT_EXCEEDED"
          });
        }

        // Add limit information to request for downstream use
        (req as any).planValidation = validation;
      }

      next();
    } catch (error) {
      console.error("Plan enforcement middleware error:", error);
      res.status(500).json({ 
        error: "Failed to validate plan limits",
        code: "ENFORCEMENT_ERROR"
      });
    }
  };
}

/**
 * Middleware to check specific feature access
 */
export function requireFeature(feature: string) {
  return enforcePlanLimits({ feature });
}

/**
 * Middleware to check patient limit before adding patients
 */
export function checkPatientLimit() {
  return enforcePlanLimits({ limitType: 'patient' });
}

/**
 * Middleware to check call limit before making calls
 */
export function checkCallLimit() {
  return enforcePlanLimits({ limitType: 'call' });
}

/**
 * Middleware to track usage after successful operations
 */
export function trackUsage(options: { 
  operation: 'call' | 'patient_added' | 'feature_used';
  getDuration?: (req: Request) => number;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any) {
      // Only track usage on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const clientId = parseInt(
          req.body?.clientId || 
          req.params?.clientId || 
          req.query?.clientId as string
        );
        
        const serviceId = parseInt(
          req.body?.serviceId || 
          req.params?.serviceId ||
          req.query?.serviceId as string
        );

        if (clientId && serviceId && options.operation === 'call') {
          const duration = options.getDuration ? options.getDuration(req) : 0;
          
          // Track usage asynchronously to not block the response
          planEnforcement.trackCallUsage(clientId, serviceId, duration)
            .catch(error => {
              console.error("Error tracking usage:", error);
            });
        }
      }
      
      return originalJson(body);
    };
    
    next();
  };
}

/**
 * Express route handler to get client's plan information
 */
export async function getPlanInfo(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.params.clientId);
    
    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }

    // Get client's active services
    const services = await storage.getServicesByClient(clientId);
    const activeService = services.find(s => s.status === "active");
    
    if (!activeService || !activeService.planId) {
      return res.status(404).json({ error: "No active service plan found" });
    }

    // Get plan details
    const plan = await storage.getServicePlan(activeService.planId);
    if (!plan) {
      return res.status(404).json({ error: "Service plan not found" });
    }

    // Get current usage
    const currentDate = new Date();
    const usage = await storage.getClientUsageByMonth(
      clientId, 
      currentDate.getMonth() + 1, 
      currentDate.getFullYear()
    );

    // Get patient count
    const patients = await storage.getServiceRecipientsByClient(clientId);
    const activePatients = patients.filter(p => p.status === "active");

    // Format plan information with enhanced fields
    const planInfo = {
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        planType: plan.planType,
        basePrice: plan.basePrice,
        billingCycle: plan.billingCycle,
        features: plan.features as string[],
        
        // Enhanced fields (with safe access)
        maxPatients: (plan as any).maxPatients,
        callsPerDay: plan.callsPerDay,
        callsPerMonth: (plan as any).callsPerMonth,
        includedCallsPerMonth: (plan as any).includedCallsPerMonth,
        overageCallPrice: (plan as any).overageCallPrice,
        allowOverages: (plan as any).allowOverages,
        enforcePatientLimit: (plan as any).enforcePatientLimit,
        enforceCallLimit: (plan as any).enforceCallLimit,
        freeTrialDays: (plan as any).freeTrialDays,
      },
      
      usage: {
        currentMonth: {
          callsCompleted: usage?.callsCompleted || 0,
          totalCallMinutes: usage?.totalCallMinutes || 0,
          patientsActive: usage?.patientsActive || activePatients.length,
          overageCalls: usage?.overageCalls || 0,
          overageCharges: usage?.overageCharges || 0,
        },
        limits: {
          patientsUsed: activePatients.length,
          patientsLimit: (plan as any).maxPatients || null,
          patientsRemaining: (plan as any).maxPatients ? (plan as any).maxPatients - activePatients.length : null,
          callsUsed: usage?.callsCompleted || 0,
          callsLimit: (plan as any).callsPerMonth || null,
          callsRemaining: (plan as any).callsPerMonth ? Math.max(0, (plan as any).callsPerMonth - (usage?.callsCompleted || 0)) : null,
        }
      },

      service: {
        id: activeService.id,
        serviceName: activeService.serviceName,
        status: activeService.status,
        monthlyPrice: (activeService as any).monthlyPrice,
        stripeSubscriptionId: (activeService as any).stripeSubscriptionId,
      }
    };

    res.json(planInfo);
  } catch (error) {
    console.error("Error getting plan info:", error);
    res.status(500).json({ error: "Failed to get plan information" });
  }
}

/**
 * Utility function to extract client ID from request
 */
export function extractClientId(req: Request): number | null {
  const clientId = parseInt(
    req.body?.clientId || 
    req.params?.clientId || 
    req.query?.clientId as string
  );
  
  return isNaN(clientId) ? null : clientId;
}