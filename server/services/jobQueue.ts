import { EventEmitter } from "events";
import storage from "../storage";

export interface Job {
  id: string;
  type: string;
  data: any;
  priority: "low" | "normal" | "high" | "urgent";
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
  status: "pending" | "processing" | "completed" | "failed" | "delayed";
}

export interface JobHandler {
  (job: Job): Promise<any>;
}

export interface QueueOptions {
  concurrency?: number;
  retryDelay?: number;
  maxRetries?: number;
}

export class JobQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private concurrency: number;
  private retryDelay: number;
  private maxRetries: number;
  private isRunning = false;

  constructor(options: QueueOptions = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    this.retryDelay = options.retryDelay || 5000; // 5 seconds
    this.maxRetries = options.maxRetries || 3;
  }

  // Register a job handler
  process(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  // Add a job to the queue
  async add(
    type: string,
    data: any,
    options: {
      priority?: Job["priority"];
      delay?: number;
      maxAttempts?: number;
    } = {},
  ): Promise<string> {
    const jobId = this.generateJobId();
    const now = new Date();

    const job: Job = {
      id: jobId,
      type,
      data,
      priority: options.priority || "normal",
      attempts: 0,
      maxAttempts: options.maxAttempts || this.maxRetries,
      createdAt: now,
      scheduledAt: options.delay
        ? new Date(now.getTime() + options.delay)
        : now,
      status: options.delay ? "delayed" : "pending",
    };

    this.jobs.set(jobId, job);
    this.emit("job:added", job);

    if (!this.isRunning) {
      this.start();
    }

    return jobId;
  }

  // Start processing jobs
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit("queue:started");
    this.processNextJobs();
  }

  // Stop processing jobs
  stop(): void {
    this.isRunning = false;
    this.emit("queue:stopped");
  }

  // Get job by ID
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  // Get jobs by status
  getJobsByStatus(status: Job["status"]): Job[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === status,
    );
  }

  // Get queue statistics
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    delayed: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      delayed: jobs.filter((j) => j.status === "delayed").length,
    };
  }

  // Clean completed jobs older than specified time
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    // 24 hours default
    const cutoff = new Date(Date.now() - olderThanMs);
    let cleaned = 0;

    const jobEntries = Array.from(this.jobs.entries());
    for (const [jobId, job] of jobEntries) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.completedAt &&
        job.completedAt < cutoff
      ) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    this.emit("queue:cleaned", { count: cleaned });
    return cleaned;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processNextJobs(): Promise<void> {
    if (!this.isRunning) return;

    // Check for delayed jobs that are ready
    this.checkDelayedJobs();

    // Get available processing slots
    const availableSlots = this.concurrency - this.processing.size;
    if (availableSlots <= 0) {
      setTimeout(() => this.processNextJobs(), 1000);
      return;
    }

    // Get next jobs to process
    const pendingJobs = this.getPendingJobsByPriority();
    const jobsToProcess = pendingJobs.slice(0, availableSlots);

    // Process jobs
    for (const job of jobsToProcess) {
      this.processJob(job);
    }

    // Schedule next check
    setTimeout(() => this.processNextJobs(), 1000);
  }

  private checkDelayedJobs(): void {
    const now = new Date();
    const jobValues = Array.from(this.jobs.values());
    for (const job of jobValues) {
      if (
        job.status === "delayed" &&
        job.scheduledAt &&
        job.scheduledAt <= now
      ) {
        job.status = "pending";
        this.emit("job:ready", job);
      }
    }
  }

  private getPendingJobsByPriority(): Job[] {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };

    return Array.from(this.jobs.values())
      .filter((job) => job.status === "pending")
      .sort((a, b) => {
        // First by priority
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by creation time (FIFO)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = "failed";
      job.error = `No handler registered for job type: ${job.type}`;
      job.failedAt = new Date();
      this.emit("job:failed", job);
      return;
    }

    job.status = "processing";
    job.startedAt = new Date();
    job.attempts++;
    this.processing.add(job.id);
    this.emit("job:started", job);

    try {
      const result = await handler(job);

      job.status = "completed";
      job.completedAt = new Date();
      job.result = result;
      this.processing.delete(job.id);
      this.emit("job:completed", job);
    } catch (error) {
      job.error = error instanceof Error ? error.message : String(error);
      this.processing.delete(job.id);

      if (job.attempts < job.maxAttempts) {
        // Retry with delay
        job.status = "delayed";
        job.scheduledAt = new Date(Date.now() + this.retryDelay * job.attempts);
        this.emit("job:retry", job);
      } else {
        // Max attempts reached, mark as failed
        job.status = "failed";
        job.failedAt = new Date();
        this.emit("job:failed", job);
      }
    }
  }
}

// Predefined job types
export enum JobType {
  SEND_EMAIL = "send_email",
  SEND_SMS = "send_sms",
  GENERATE_REPORT = "generate_report",
  PROCESS_CALL_RECORDING = "process_call_recording",
  BACKUP_DATA = "backup_data",
  SEND_NOTIFICATION = "send_notification",
  ANALYZE_CALL_SENTIMENT = "analyze_call_sentiment",
  CLEANUP_OLD_FILES = "cleanup_old_files",
  UPDATE_USER_STATS = "update_user_stats",
  PROCESS_BILLING = "process_billing",
}

export type EmailTemplateType =
  | "account_verification"
  | "password_reset"
  | "welcome_email"
  | "call_completed"
  | "call_missed"
  | "call_failed"
  | "reminder"
  | "newsletter"
  | "announcement"
  | "system_alert"
  | "billing_alert"
  | "security_alert"
  | "custom";

// Job data interfaces for type safety
export interface EmailJobData {
  to: string;
  templateType: EmailTemplateType;
  templateData?: any;
}

export interface SMSJobData {
  to: string;
  message: string;
  priority?: "normal" | "urgent";
}

export interface CallRecordingJobData {
  callId: number;
  recordingPath: string;
  transcript?: string;
}

export interface ReportJobData {
  type: "monthly" | "weekly" | "daily";
  userId: string;
  dateRange: { start: Date; end: Date };
  format: "pdf" | "excel" | "csv";
}

export interface NotificationJobData {
  userId: string;
  templateId: number;
  variables: Record<string, any>;
  channels: ("email" | "sms" | "push")[];
}

// Create singleton queue instance
export const jobQueue = new JobQueue({
  concurrency: 10,
  retryDelay: 5000,
  maxRetries: 3,
});

// Auto-cleanup every hour
setInterval(
  () => {
    jobQueue.cleanup();
  },
  60 * 60 * 1000,
);
