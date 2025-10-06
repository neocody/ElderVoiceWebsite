export interface EmailTemplate {
  id?: number;
  name: string;
  emailSubject: string;
  emailBody?: string;
  targetUserTypes?: string[];
  type?: EmailTemplateType;
  description?: string;
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

export interface EmailTemplateBuilderProps {
  template?: EmailTemplate;
  onSave: (templateData: {
    name: string;
    emailSubject: string;
    emailBody: string;
    type?: EmailTemplateType;
    description?: string;
    targetUserTypes: string[];
  }) => void;
  onClose: () => void;
}

export interface PrebuiltTemplate {
  name: string;
  description: string;
  html: string;
}

export interface CustomBlock {
  id: string;
  name: string;
  icon: React.ReactNode;
  html: string;
  description: string;
}

export interface Role {
  value: string;
  label: string;
}
