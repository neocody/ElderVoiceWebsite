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

export interface EmailTemplate {
  id: number;
  name: string;
  type: EmailTemplateType;
  description?: string;
  emailSubject: string;
  emailBody?: string;
  emailBuilderJson?: any;
  isActive: boolean;
  targetUserTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export const templateTypes: EmailTemplateType[] = [
  "account_verification",
  "password_reset",
  "welcome_email",
  "call_completed",
  "call_missed",
  "call_failed",
  "reminder",
  "newsletter",
  "announcement",
  "system_alert",
  "billing_alert",
  "security_alert",
  "custom",
];
