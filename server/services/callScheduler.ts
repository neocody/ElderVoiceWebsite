import cron, { ScheduledTask } from "node-cron";
import { storage } from "../storage";
import { twilioService } from "./twilioService";

export class CallScheduler {
  private scheduledTasks: Map<number, ScheduledTask> = new Map();

  async initializeScheduler() {
    // Check for due calls every minute
    cron.schedule("* * * * *", async () => {
      await this.checkDueCalls();
    });

    console.log("Call scheduler initialized");
  }

  async scheduleCallsForUser(elderlyUserId: number) {
    // Remove existing scheduled tasks for this user
    const existingTask = this.scheduledTasks.get(elderlyUserId);
    if (existingTask) {
      existingTask.destroy();
    }

    const schedules = await storage.getSchedules(elderlyUserId);
    const elderlyUser = await storage.getElderlyUser(elderlyUserId);

    if (!elderlyUser || schedules.length === 0) {
      return;
    }

    // For simplicity, we'll handle daily calls
    // In a production system, you'd want more sophisticated scheduling
    schedules.forEach((schedule) => {
      if (schedule.frequency === "daily" && schedule.isActive) {
        const [hour, minute] = schedule.timeOfDay.split(":");
        const cronExpression = `${minute} ${hour} * * *`;

        const task = cron.schedule(cronExpression, async () => {
          await this.initiateCall(elderlyUserId);
        });

        task.start();
        this.scheduledTasks.set(elderlyUserId, task);
      }
    });
  }

  async checkDueCalls() {
    try {
      console.log("[SCHEDULER] Checking for due calls...");

      // Get all active schedules
      const schedules = await storage.getSchedules();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      console.log(
        `[SCHEDULER] Current time: ${currentHour}:${currentMinute} on day ${currentDay}`,
      );
      console.log(`[SCHEDULER] Found ${schedules.length} schedules to check`);

      for (const schedule of schedules) {
        if (!schedule.isActive) {
          console.log(`[SCHEDULER] Skipping inactive schedule ${schedule.id}`);
          continue;
        }

        // Parse the scheduled time
        const timeField = schedule.timeOfDay;
        if (!timeField) {
          console.log(`[SCHEDULER] No time set for schedule ${schedule.id}`);
          continue;
        }
        const [scheduleHour, scheduleMinute] = timeField.split(":").map(Number);

        // Check if this call is due now (within current minute)
        const isDueNow =
          currentHour === scheduleHour && currentMinute === scheduleMinute;

        // Check day of week for weekly schedules
        let isDayMatch = true;
        if (schedule.frequency === "weekly" && schedule.dayOfWeek !== null) {
          isDayMatch = currentDay === schedule.dayOfWeek;
        }

        if (isDueNow && isDayMatch) {
          console.log(
            `[SCHEDULER] Call due for patient ${schedule.elderlyUserId} at ${schedule.timeOfDay}`,
          );

          // Check if we already made a call in the last hour to avoid duplicates
          const recentCalls = await storage.getCalls();
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

          const hasRecentCall = recentCalls.some(
            (call) =>
              call.elderlyUserId === schedule.elderlyUserId &&
              call.startedAt &&
              new Date(call.startedAt) > oneHourAgo,
          );

          if (hasRecentCall) {
            console.log(
              `[SCHEDULER] Skipping - call already made recently for patient ${schedule.elderlyUserId}`,
            );
            continue;
          }

          // Get patient information
          const patient = await storage.getElderlyUser(schedule.elderlyUserId);
          if (!patient) {
            console.log(
              `[SCHEDULER] Patient ${schedule.elderlyUserId} not found`,
            );
            continue;
          }

          console.log(
            `[SCHEDULER] Initiating scheduled call to ${patient.name} at ${patient.phone}`,
          );

          // Make the call using the same logic as test calls
          await this.makeScheduledCall(patient, schedule);
        }
      }
    } catch (error) {
      console.error("[SCHEDULER] Error checking due calls:", error);
    }
  }

  async makeScheduledCall(patient: any, schedule: any) {
    try {
      console.log(
        `[SCHEDULED CALL] Starting call to ${patient.name} (${patient.phone})`,
      );

      const twilioService = require("./twilioService");

      // Create call record
      const callData = {
        elderlyUserId: patient.id,
        status: "initiated",
        startedAt: new Date(),
        duration: 0,
      };

      const call = await storage.createCall(callData);
      console.log(`[SCHEDULED CALL] Created call record ${call.id}`);

      // Use Twilio to make the call
      const callResult = await twilioService.makePhoneCallWithTwilio(
        patient.phone,
        patient,
      );

      if (callResult.success) {
        // Update call with Twilio SID
        await storage.updateCall(call.id, {
          callSid: callResult.callSid,
          status: "in_progress",
        });
        console.log(
          `[SCHEDULED CALL] Call initiated successfully with SID: ${callResult.callSid}`,
        );
      } else {
        // Mark call as failed
        await storage.updateCall(call.id, {
          status: "failed",
          endedAt: new Date(),
        });
        console.error(`[SCHEDULED CALL] Call failed: ${callResult.error}`);
      }
    } catch (error) {
      console.error("[SCHEDULED CALL] Error making scheduled call:", error);
    }
  }

  async initiateCall(elderlyUserId: number) {
    try {
      const elderlyUser = await storage.getElderlyUser(elderlyUserId);
      if (!elderlyUser) {
        console.error(`Elderly user ${elderlyUserId} not found`);
        return;
      }

      // Create call record
      const call = await storage.createCall({
        elderlyUserId,
        status: "in_progress",
        scheduledAt: new Date(),
        startedAt: new Date(),
      });

      // Make the call via Twilio
      const callSid = await twilioService.makeCall(
        elderlyUser.phone,
        elderlyUserId,
      );

      // Update call with Twilio SID
      await storage.updateCall(call.id, { callSid });

      console.log(`Call initiated for ${elderlyUser.name} (${elderlyUserId})`);

      // Create notification for caregiver
      await storage.createNotification({
        userId: elderlyUser.caregiverId,
        elderlyUserId,
        type: "call_initiated",
        title: "Call in Progress",
        message: `Calling ${elderlyUser.name}`,
      });
    } catch (error) {
      console.error("Error initiating call:", error);

      // Create error notification
      const elderlyUser = await storage.getElderlyUser(elderlyUserId);
      if (elderlyUser) {
        await storage.createNotification({
          userId: elderlyUser.caregiverId,
          elderlyUserId,
          type: "call_failed",
          title: "Call Failed",
          message: `Failed to call ${elderlyUser.name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }
  }

  async handleCallStatus(callSid: string, status: string) {
    // Find call by SID and update status
    const calls = await storage.getCalls();
    const call = calls.find((c) => c.callSid === callSid);

    if (!call) {
      console.error(`Call with SID ${callSid} not found`);
      return;
    }

    const elderlyUser = await storage.getElderlyUser(call.elderlyUserId);
    if (!elderlyUser) {
      console.error(`Elderly user ${call.elderlyUserId} not found`);
      return;
    }

    let updateData: any = { status };
    let notificationType = "";
    let notificationTitle = "";
    let notificationMessage = "";

    switch (status) {
      case "completed":
        updateData.endedAt = new Date();
        notificationType = "call_completed";
        notificationTitle = "Call Completed";
        notificationMessage = `Successfully called ${elderlyUser.name}`;
        break;
      case "no-answer":
      case "busy":
        updateData.status = "missed";
        updateData.endedAt = new Date();
        notificationType = "call_missed";
        notificationTitle = "Call Missed";
        notificationMessage = `${elderlyUser.name} did not answer the call`;
        break;
      case "failed":
        updateData.endedAt = new Date();
        notificationType = "call_failed";
        notificationTitle = "Call Failed";
        notificationMessage = `Call to ${elderlyUser.name} failed`;
        break;
    }

    await storage.updateCall(call.id, updateData);

    if (notificationType) {
      await storage.createNotification({
        userId: elderlyUser.caregiverId,
        elderlyUserId: call.elderlyUserId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
      });
    }
  }
}

export const callScheduler = new CallScheduler();
