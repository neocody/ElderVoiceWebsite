import sgMail from "@sendgrid/mail";
import { storage } from "../storage";

if (!process.env.SENDGRID_API_KEY) {
  console.warn(
    "SENDGRID_API_KEY environment variable not set. Email functionality will be disabled.",
  );
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("Email not sent - SENDGRID_API_KEY not configured");
    return false;
  }

  // Ensure we have at least one content field for SendGrid
  if (!params.text && !params.html) {
    console.error("Email must have either text or html content");
    return false;
  }

  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };

    // Add content fields only when they exist
    if (params.html) {
      emailData.html = params.html;
    }
    if (params.text) {
      emailData.text = params.text;
    }

    await sgMail.send(emailData);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error: any) {
    console.error(
      "SendGrid email error:",
      error?.response?.body || error.message || error,
    );
    return false;
  }
}

export interface EmailVariables {
  //user info
  firstName?: string;
  lastName?: string;
  email?: string;
  prefferedName?: string;

  //auth
  verificationLink?: string;
  resetLink?: string;

  //call info
  patientName?: string;
  callTime?: string;
  callDuration?: string;
  nextCallTime?: string;
  callStatus?: string;
  failureReason?: string;
  nextAttempt?: string;

  //care related
  caregiverName?: string;
  facilityName?: string;
  concernType?: string;
  severityLevel?: string;

  //system
  systemMessage?: string;
  alertType?: string;
  billingAmount?: string;
  dueDate?: string;
}

export const EMAIL_TYPE_CONFIGS = {
  account_verification: {
    required: ["firstName", "verificationLink"],
    optional: ["lastName", "email"],
  },
  password_reset: {
    required: ["firstName", "resetLink"],
    optional: ["lastName"],
  },
  welcome_email: {
    required: ["firstName"],
    optional: ["lastName", "preferredName"],
  },
  call_completed: {
    required: ["firstName", "patientName", "callTime", "callDuration"],
    optional: ["lastName", "nextCallTime", "caregiverName"],
  },
  call_missed: {
    required: ["firstName", "patientName", "callTime"],
    optional: ["lastName", "nextAttempt", "caregiverName"],
  },
  call_failed: {
    required: ["firstName", "patientName", "failureReason"],
    optional: ["lastName", "nextAttempt"],
  },
  reminder: {
    required: ["firstName", "nextCallTime"],
    optional: ["lastName", "patientName", "preferredName"],
  },
  newsletter: {
    required: ["firstName"],
    optional: ["lastName", "preferredName"],
  },
  announcement: {
    required: ["firstName"],
    optional: ["lastName", "systemMessage"],
  },
  system_alert: {
    required: ["firstName", "alertType"],
    optional: ["lastName", "systemMessage", "severityLevel"],
  },
  billing_alert: {
    required: ["firstName", "billingAmount"],
    optional: ["lastName", "dueDate"],
  },
  security_alert: {
    required: ["firstName", "alertType"],
    optional: ["lastName", "systemMessage"],
  },
  custom: {
    required: [],
    optional: Object.keys({} as EmailVariables), // All variables are optional for custom
  },
} as const;
export type EmailType = keyof typeof EMAIL_TYPE_CONFIGS;

export async function sendTemplateEmail(
  to: string,
  emailType: EmailType,
  variables: EmailVariables = {},
): Promise<boolean> {
  try {
    const config = EMAIL_TYPE_CONFIGS[emailType];

    //filter for variables that are NOT in the variables object
    const missingRequired = config.required.filter(
      (key) =>
        !(key in variables) || variables[key as keyof EmailVariables] == null,
    );

    if (missingRequired.length > 0) {
      console.error(
        `Missing required variables for ${emailType}: ${missingRequired.join(", ")}`,
      );
      throw new Error(
        `Missing required variables: ${missingRequired.join(", ")}`,
      );
    }

    const emailTemplate =
      await storage.getNotificationTemplateByType(emailType);

    if (!emailTemplate) {
      console.error("Email template not found");
      return false;
    }

    let processedHtml = emailTemplate.emailBody;
    let processedSubject = emailTemplate.emailSubject;

    for (const [key, value] of Object.entries(variables)) {
      if (value !== null && value !== undefined) {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        const stringValue = String(value);
        processedHtml = processedHtml.replace(regex, stringValue);
        processedSubject = processedSubject.replace(regex, stringValue);
      }
    }

    return await sendEmail({
      to,
      from: process.env.FROM_EMAIL || "hello@eldervoice.com",
      subject: processedSubject,
      html: processedHtml,
    });
  } catch (e) {
    console.error("Error sending template email:", e);
    return false;
  }
}
