import { storage } from "../storage";
import type {
  SelectServicePlan,
  SelectService,
  SelectClient,
  SelectClientUsage,
  SelectServiceRecipient,
} from "../../shared/schema";

export interface PlanValidationResult {
  isAllowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  overageAllowed?: boolean;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  feature: string;
  reason?: string;
}

export class PlanEnforcementService {
  /**
   * Validates if a client can add another patient based on their plan
   */
  async validatePatientLimit(clientId: number): Promise<PlanValidationResult> {
    try {
      const services = await storage.getServicesByClient(clientId);
      if (!services.length) {
        return { isAllowed: false, reason: "No active service plan found" };
      }

      const service = services.find((s) => s.status === "active");
      if (!service) {
        return { isAllowed: false, reason: "No active service found" };
      }

      if (!service.planId) {
        return { isAllowed: false, reason: "Service has no associated plan" };
      }

      const plan = await storage.getServicePlan(service.planId);
      if (!plan) {
        return { isAllowed: false, reason: "Service plan not found" };
      }

      // Check for enhanced schema fields safely
      const maxPatients = (plan as any).maxPatients;
      const enforcePatientLimit = (plan as any).enforcePatientLimit ?? true;

      if (!maxPatients || !enforcePatientLimit) {
        return { isAllowed: true };
      }

      const patients = await storage.getServiceRecipientsByClient(clientId);
      const activePatients = patients.filter(
        (p) => p.status === "active",
      ).length;

      if (activePatients >= maxPatients) {
        return {
          isAllowed: false,
          reason: "Patient limit reached",
          currentUsage: activePatients,
          limit: maxPatients,
        };
      }

      return {
        isAllowed: true,
        currentUsage: activePatients,
        limit: maxPatients,
      };
    } catch (error) {
      console.error("Error validating patient limit:", error);
      return { isAllowed: false, reason: "Error checking patient limit" };
    }
  }

  /**
   * Validates if a client can make another call based on their plan limits
   */
  async validateCallLimit(
    clientId: number,
    serviceId: number,
  ): Promise<PlanValidationResult> {
    try {
      const service = await storage.getService(serviceId);
      if (!service || !service.planId) {
        return { isAllowed: false, reason: "Service or plan not found" };
      }

      const plan = await storage.getServicePlan(service.planId);
      if (!plan) {
        return { isAllowed: false, reason: "Service plan not found" };
      }

      // Check for enhanced schema fields safely
      const enforceCallLimit = (plan as any).enforceCallLimit ?? true;
      const callsPerMonth = (plan as any).callsPerMonth;
      const allowOverages = (plan as any).allowOverages || false;

      if (!enforceCallLimit || (!plan.callsPerDay && !callsPerMonth)) {
        return { isAllowed: true };
      }

      // For simplicity, focus on monthly limits for now
      if (callsPerMonth) {
        const currentUsage = await this.getCurrentMonthlyUsage(clientId);
        const monthlyCalls = currentUsage?.callsCompleted ?? 0;

        if (monthlyCalls >= callsPerMonth) {
          return {
            isAllowed: allowOverages,
            reason: allowOverages
              ? "Monthly limit exceeded - overage will apply"
              : "Monthly call limit reached",
            currentUsage: monthlyCalls,
            limit: callsPerMonth,
            overageAllowed: allowOverages,
          };
        }
      }

      return { isAllowed: true };
    } catch (error) {
      console.error("Error validating call limit:", error);
      return { isAllowed: false, reason: "Error checking call limit" };
    }
  }

  /**
   * Checks if a user has access to a specific feature based on their plan
   */
  async validateFeatureAccess(
    clientId: number,
    feature: string,
  ): Promise<FeatureAccessResult> {
    try {
      const services = await storage.getServicesByClient(clientId);
      const activeService = services.find((s) => s.status === "active");

      if (!activeService || !activeService.planId) {
        return { hasAccess: false, feature, reason: "No active service found" };
      }

      const plan = await storage.getServicePlan(activeService.planId);
      if (!plan) {
        return { hasAccess: false, feature, reason: "Service plan not found" };
      }

      const planFeatures = (plan.features as string[]) || [];
      if (!planFeatures.includes(feature)) {
        return {
          hasAccess: false,
          feature,
          reason: "Feature not included in plan",
        };
      }

      return { hasAccess: true, feature };
    } catch (error) {
      console.error("Error validating feature access:", error);
      return {
        hasAccess: false,
        feature,
        reason: "Error checking feature access",
      };
    }
  }

  /**
   * Updates usage tracking for a completed call
   */
  async trackCallUsage(
    clientId: number,
    serviceId: number,
    durationSeconds: number,
  ): Promise<void> {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      let usage = await storage.getClientUsageByMonth(clientId, month, year);

      if (!usage) {
        usage = await storage.createClientUsage({
          clientId,
          serviceId,
          month,
          year,
          callsCompleted: 1,
          totalCallMinutes: durationSeconds,
          patientsActive: await this.getActivePatientCount(clientId),
        });
      } else {
        await storage.updateClientUsage(usage.id, {
          callsCompleted: (usage.callsCompleted ?? 0) + 1,
          totalCallMinutes: (usage.totalCallMinutes ?? 0) + durationSeconds,
          patientsActive: await this.getActivePatientCount(clientId),
        });
      }

      // Check for overages and update if necessary
      if (serviceId) {
        await this.checkAndUpdateOverages(clientId, serviceId);
      }
    } catch (error) {
      console.error("Error tracking call usage:", error);
    }
  }

  /**
   * Checks for plan overages and calculates additional charges
   */
  private async checkAndUpdateOverages(
    clientId: number,
    serviceId: number,
  ): Promise<void> {
    try {
      const service = await storage.getService(serviceId);
      if (!service || !service.planId) return;

      const plan = await storage.getServicePlan(service.planId);
      if (!plan) return;

      const allowOverages = (plan as any).allowOverages || false;
      if (!allowOverages) return;

      const usage = await this.getCurrentMonthlyUsage(clientId);
      if (!usage) return;

      const callsPerMonth = (plan as any).callsPerMonth;
      const overageCallPrice = (plan as any).overageCallPrice;

      let overageCalls = 0;
      let overageCharges = 0;

      if (
        callsPerMonth &&
        usage.callsCompleted &&
        usage.callsCompleted > callsPerMonth
      ) {
        overageCalls = usage.callsCompleted - callsPerMonth;
        if (overageCallPrice) {
          overageCharges = overageCalls * overageCallPrice;
        }
      }

      if (overageCalls > 0) {
        await storage.updateClientUsage(usage.id, {
          overageCalls,
          overageCharges,
        });
      }
    } catch (error) {
      console.error("Error checking overages:", error);
    }
  }

  /**
   * Gets current monthly usage for a client
   */
  private async getCurrentMonthlyUsage(
    clientId: number,
  ): Promise<SelectClientUsage | undefined> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return await storage.getClientUsageByMonth(clientId, month, year);
  }

  /**
   * Gets count of active patients for a client
   */
  private async getActivePatientCount(clientId: number): Promise<number> {
    const patients = await storage.getServiceRecipientsByClient(clientId);
    return patients.filter((p) => p.status === "active").length;
  }

  /**
   * Validates if a plan change is allowed and calculates pro-ration
   */
  async validatePlanChange(
    clientId: number,
    newPlanId: number,
  ): Promise<{
    isAllowed: boolean;
    reason?: string;
    prorationAmount?: number;
  }> {
    try {
      const services = await storage.getServicesByClient(clientId);
      const activeService = services.find((s) => s.status === "active");

      if (!activeService || !activeService.planId) {
        return { isAllowed: true }; // New plan assignment
      }

      const currentPlan = await storage.getServicePlan(activeService.planId);
      const newPlan = await storage.getServicePlan(newPlanId);

      if (!currentPlan || !newPlan) {
        return { isAllowed: false, reason: "Plan not found" };
      }

      // Check if downgrade would violate current usage
      const activePatients = await this.getActivePatientCount(clientId);
      const newPlanMaxPatients = (newPlan as any).maxPatients;

      if (newPlanMaxPatients && activePatients > newPlanMaxPatients) {
        return {
          isAllowed: false,
          reason: `Cannot downgrade: You have ${activePatients} patients but the new plan only allows ${newPlanMaxPatients}`,
        };
      }

      // Calculate simple price difference (could be enhanced with proper pro-ration logic)
      const priceDiff = newPlan.basePrice - currentPlan.basePrice;

      return {
        isAllowed: true,
        prorationAmount: priceDiff,
      };
    } catch (error) {
      console.error("Error validating plan change:", error);
      return { isAllowed: false, reason: "Error validating plan change" };
    }
  }
}

// Export singleton instance
export const planEnforcement = new PlanEnforcementService();
