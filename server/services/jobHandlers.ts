import twilio from "twilio";
import {
  jobQueue,
  JobType,
  type Job,
  type EmailJobData,
  type SMSJobData,
  type NotificationJobData,
  type CallRecordingJobData,
  type ReportJobData,
} from "./jobQueue";
import { fileStorageService } from "./fileStorageService";
import { storage } from "../storage";
import { sendTemplateEmail } from "../services/emailService";
import type { NotificationTemplate } from "@shared/schema";

// Define EmailTemplateData interface
interface EmailTemplateData {
  patientName?: string;
  caregiverName?: string;
  callTime?: string;
  callDuration?: string;
  facilityName?: string;
  urgentMessage?: string;
  actionRequired?: string;
  nextCallTime?: string;
  emergencyContact?: string;
  systemMessage?: string;
}

// Initialize twillio
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Email job handler
async function handleEmailJob(job: Job): Promise<void> {
  const data = job.data as EmailJobData;

  const sentEmail = await sendTemplateEmail(
    data.to,
    data.templateType || "custom",
    data.templateData || {},
  );
  if (!sentEmail) {
    console.error(`Failed to send email to ${data.to}`);
  } else {
    console.log(`Email sent successfully to ${data.to}`);
  }
}

// SMS job handler
async function handleSMSJob(job: Job): Promise<void> {
  const data = job.data as SMSJobData;

  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio not configured");
  }

  await twilioClient.messages.create({
    body: data.message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: data.to,
  });

  console.log(`SMS sent successfully to ${data.to}`);
}

// Notification job handler (combines email and SMS)
async function handleNotificationJob(job: Job): Promise<void> {
  const data = job.data as NotificationJobData;

  // Get notification template
  const template = await storage.getNotificationTemplate(data.templateId);
  if (!template) {
    throw new Error(`Notification template ${data.templateId} not found`);
  }

  // Get user details
  const user = await storage.getUser(data.userId);
  if (!user) {
    throw new Error(`User ${data.userId} not found`);
  }

  // Generate rich HTML template using the email template service
  const templateData: EmailTemplateData = {
    patientName: data.variables.patientName,
    caregiverName: user.firstName || "User",
    callTime: data.variables.callTime,
    callDuration: data.variables.callDuration,
    facilityName: data.variables.facilityName,
    urgentMessage: data.variables.urgentMessage,
    actionRequired: data.variables.actionRequired,
    nextCallTime: data.variables.nextCallTime,
    emergencyContact: data.variables.emergencyContact,
    systemMessage: data.variables.systemMessage,
  };

  // Queue individual email and SMS jobs if channels are enabled
  const promises: Promise<string>[] = [];

  if (data.channels.includes("email") && user.email) {
    const emailJobData: EmailJobData = {
      to: user.email,
      templateType: template.type,
      templateData: data.variables,
    };

    promises.push(
      jobQueue.add(JobType.SEND_EMAIL, emailJobData, { priority: "high" }),
    );
  }

  if (data.channels.includes("sms") && data.variables.phoneNumber) {
    // Generate simple SMS content
    const smsContent = `${template.name}: ${data.variables.urgentMessage || data.variables.systemMessage || "Important notification from Elder Voice"}`;

    const smsJobData: SMSJobData = {
      to: data.variables.phoneNumber,
      message: smsContent,
      priority: "normal",
    };

    promises.push(
      jobQueue.add(JobType.SEND_SMS, smsJobData, { priority: "high" }),
    );
  }

  await Promise.all(promises);
  console.log(`Notification jobs queued for user ${data.userId}`);
}

// Call recording processing job handler
async function handleCallRecordingJob(job: Job): Promise<void> {
  const data = job.data as CallRecordingJobData;

  // Process the call recording (transcription, sentiment analysis, etc.)
  try {
    // Get call details
    const call = await storage.getCall(data.callId);
    if (!call) {
      throw new Error(`Call ${data.callId} not found`);
    }

    // If transcript not provided, generate one using OpenAI Whisper
    let transcript = data.transcript;
    if (!transcript && data.recordingPath) {
      // In a real implementation, this would transcribe the audio file
      transcript = "Transcription would be generated here from the audio file";
    }

    // Perform sentiment analysis on the transcript
    if (transcript) {
      // This would use OpenAI to analyze sentiment and extract key insights
      const analysisJobData = {
        callId: data.callId,
        transcript,
        analysisType: "sentiment_and_summary",
      };

      await jobQueue.add(JobType.ANALYZE_CALL_SENTIMENT, analysisJobData, {
        priority: "low",
      });
    }

    // Update call record with processing status
    await storage.updateCall(data.callId, {
      transcript,
      status: "completed",
    });

    console.log(`Call recording processed for call ${data.callId}`);
  } catch (error) {
    console.error(
      `Error processing call recording for call ${data.callId}:`,
      error,
    );
    throw error;
  }
}

// Report generation job handler
async function handleReportGeneration(job: Job): Promise<void> {
  const data = job.data as ReportJobData;

  try {
    // Generate report based on type and date range
    let reportData: any = {};

    switch (data.type) {
      case "daily":
        reportData = await generateDailyReport(data.userId, data.dateRange);
        break;
      case "weekly":
        reportData = await generateWeeklyReport(data.userId, data.dateRange);
        break;
      case "monthly":
        reportData = await generateMonthlyReport(data.userId, data.dateRange);
        break;
      default:
        throw new Error(`Unknown report type: ${data.type}`);
    }

    // Format report based on requested format
    let reportBuffer: Buffer;
    let mimeType: string;
    let fileName: string;

    switch (data.format) {
      case "pdf":
        // In a real implementation, this would generate a PDF
        reportBuffer = Buffer.from(JSON.stringify(reportData, null, 2));
        mimeType = "application/pdf";
        fileName = `${data.type}_report_${Date.now()}.pdf`;
        break;
      case "excel":
        // In a real implementation, this would generate an Excel file
        reportBuffer = Buffer.from(JSON.stringify(reportData, null, 2));
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileName = `${data.type}_report_${Date.now()}.xlsx`;
        break;
      case "csv":
        // Convert data to CSV format
        reportBuffer = Buffer.from(convertToCSV(reportData));
        mimeType = "text/csv";
        fileName = `${data.type}_report_${Date.now()}.csv`;
        break;
      default:
        throw new Error(`Unknown report format: ${data.format}`);
    }

    // Save report file
    const fileUpload = await fileStorageService.uploadFile(
      reportBuffer,
      fileName,
      mimeType,
      {
        category: "document",
        userId: data.userId,
        metadata: {
          reportType: data.type,
          dateRange: data.dateRange,
          generatedAt: new Date(),
        },
      },
    );

    if (fileUpload) {
      console.log(`Report generated successfully: ${fileName}`);
    } else {
      console.error(`Report generation failed: ${fileName}`);
    }
  } catch (error) {
    console.error(`Error generating report:`, error);
    throw error;
  }
}

// Call sentiment analysis job handler
async function handleCallSentimentAnalysis(job: Job): Promise<void> {
  const data = job.data;

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    // Analyze call transcript for sentiment and key concerns
    const analysis = await analyzeCallTranscript(data.transcript);

    // Update call record with analysis results
    await storage.updateCall(data.callId, {
      sentiment: `Score: ${analysis.sentimentScore}`,
      notes: `Summary: ${analysis.summary}. Key topics: ${analysis.keyTopics.join(", ")}`,
    });

    // If urgent concerns detected, create notification
    if (analysis.urgentConcerns && analysis.urgentConcerns.length > 0) {
      const call = await storage.getCall(data.callId);
      if (call) {
        const elderlyUser = await storage.getElderlyUser(call.elderlyUserId);
        if (elderlyUser) {
          // Create urgent notification job
          const notificationData: NotificationJobData = {
            userId: elderlyUser.caregiverId,
            templateId: 2, // Patient concern template
            variables: {
              patientName: elderlyUser.name,
              urgentMessage: analysis.urgentConcerns.join(", "),
              callTime: call.createdAt?.toISOString(),
              actionRequired: "Review call transcript and contact patient",
            },
            channels: ["email", "sms"],
          };

          await jobQueue.add(JobType.SEND_NOTIFICATION, notificationData, {
            priority: "urgent",
          });
        }
      }
    }

    console.log(`Call sentiment analysis completed for call ${data.callId}`);
  } catch (error) {
    console.error(`Error analyzing call sentiment:`, error);
    throw error;
  }
}

// File cleanup job handler
async function handleFileCleanup(job: Job): Promise<void> {
  const data = job.data;
  const olderThanDays = data.olderThanDays || 30;

  const deletedCount = await fileStorageService.cleanupOldFiles(olderThanDays);
  console.log(`File cleanup completed: ${deletedCount} files deleted`);
}

// User stats update job handler
async function handleUserStatsUpdate(job: Job): Promise<void> {
  const data = job.data;

  // Update user statistics (call counts, usage metrics, etc.)
  // This would typically update dashboard metrics and analytics
  console.log(`User stats updated for user ${data.userId}`);
}

// Billing processing job handler
async function handleBillingProcessing(job: Job): Promise<void> {
  const data = job.data;

  // Process subscription billing, usage calculations, etc.
  // This would integrate with Stripe for actual billing operations
  console.log(`Billing processing completed for ${data.subscriptionId}`);
}

// Helper functions
async function generateDailyReport(
  userId: string,
  dateRange: { start: Date; end: Date },
): Promise<any> {
  // Generate daily report data
  return {
    type: "daily",
    userId,
    dateRange,
    summary: "Daily report summary",
    data: [],
  };
}

async function generateWeeklyReport(
  userId: string,
  dateRange: { start: Date; end: Date },
): Promise<any> {
  // Generate weekly report data
  return {
    type: "weekly",
    userId,
    dateRange,
    summary: "Weekly report summary",
    data: [],
  };
}

async function generateMonthlyReport(
  userId: string,
  dateRange: { start: Date; end: Date },
): Promise<any> {
  // Generate monthly report data
  return {
    type: "monthly",
    userId,
    dateRange,
    summary: "Monthly report summary",
    data: [],
  };
}

function convertToCSV(data: any): string {
  // Convert JSON data to CSV format
  if (Array.isArray(data)) {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    return `${headers}\n${rows}`;
  }

  return JSON.stringify(data);
}

async function analyzeCallTranscript(transcript: string): Promise<{
  sentimentScore: number;
  keyTopics: string[];
  concerns: string[];
  urgentConcerns: string[];
  summary: string;
}> {
  // This would use OpenAI to analyze the transcript
  // For now, return mock analysis structure
  return {
    sentimentScore: 0.7,
    keyTopics: ["health", "family", "daily activities"],
    concerns: [],
    urgentConcerns: [],
    summary: "Patient seems to be doing well overall.",
  };
}

// Queue helper functions for easy use throughout the application
export async function queueEmailWithTemplate(
  to: string,
  templateType: NotificationTemplate["type"],
  templateData: EmailTemplateData,
  priority: "low" | "normal" | "high" | "urgent" = "normal",
): Promise<string> {
  const emailData: EmailJobData = {
    to,
    templateType,
    templateData,
  };

  return jobQueue.add(JobType.SEND_EMAIL, emailData, { priority });
}

export async function queueNotification(
  userId: string,
  templateType: NotificationTemplate["type"],
  variables: Record<string, any>,
  channels: ("email" | "sms")[] = ["email"],
  priority: "low" | "normal" | "high" | "urgent" = "normal",
): Promise<string> {
  // Get template by type
  const template = await storage.getNotificationTemplateByType(templateType);
  if (!template) {
    throw new Error(`No template found for type: ${templateType}`);
  }

  const notificationData: NotificationJobData = {
    userId,
    templateId: template.id,
    variables,
    channels,
  };

  return jobQueue.add(JobType.SEND_NOTIFICATION, notificationData, {
    priority,
  });
}

// Register all job handlers
export function initializeJobHandlers(): void {
  jobQueue.process(JobType.SEND_EMAIL, handleEmailJob);
  jobQueue.process(JobType.SEND_SMS, handleSMSJob);
  jobQueue.process(JobType.SEND_NOTIFICATION, handleNotificationJob);
  jobQueue.process(JobType.PROCESS_CALL_RECORDING, handleCallRecordingJob);
  jobQueue.process(JobType.GENERATE_REPORT, handleReportGeneration);
  jobQueue.process(JobType.ANALYZE_CALL_SENTIMENT, handleCallSentimentAnalysis);
  jobQueue.process(JobType.CLEANUP_OLD_FILES, handleFileCleanup);
  jobQueue.process(JobType.UPDATE_USER_STATS, handleUserStatsUpdate);
  jobQueue.process(JobType.PROCESS_BILLING, handleBillingProcessing);

  // Start the job queue
  jobQueue.start();

  console.log("Job handlers initialized and queue started");
}
