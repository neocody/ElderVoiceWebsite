import { Layout, Heart, MousePointer } from "lucide-react";

import {
  EmailTemplateType,
  PrebuiltTemplate,
  Role,
  CustomBlock,
} from "./types";

export const templateTypes: EmailTemplateType[] = [
  // Authentication
  "account_verification",
  "password_reset",
  "welcome_email",

  // Call events
  "call_completed",
  "call_missed",
  "call_failed",

  // Engagement
  "reminder",
  "newsletter",
  "announcement",

  // Alerts
  "system_alert",
  "billing_alert",
  "security_alert",

  // Custom templates
  "custom",
];

export const defaultHtmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .footer {
            background-color: #f8f9fa;
            color: #6c757d;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        h1, h2, h3 {
            margin-top: 0;
        }
        a {
            color: #007bff;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 0;
        }
        .button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to Our Service</h1>
        </div>
        <div class="content">
            <p>Dear {firstName},</p>
            <p>Thank you for joining our community. We're excited to have you on board!</p>
            <p>Get started by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="#" class="button">Get Started</a>
            </p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
        </div>
    </div>
</body>
</html>
`;

export const prebuiltTemplates: PrebuiltTemplate[] = [
  {
    name: "Welcome Email",
    description: "Professional welcome email template",
    html: defaultHtmlTemplate,
  },
  {
    name: "Newsletter",
    description: "Clean newsletter template",
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Weekly Newsletter</h2>
        <p>Hello {firstName},</p>
        <p>Here's what's new this week...</p>
      </div>
    `,
  },
];

export const availableRoles: Role[] = [
  { value: "administrator", label: "Administrator" },
  { value: "facility_manager", label: "Facility Manager" },
  { value: "member", label: "Member" },
  { value: "family_member", label: "Family Member" },
  { value: "caregiver", label: "Caregiver" },
  { value: "healthcare_provider", label: "Healthcare Provider" },
];

export const customBlocks: CustomBlock[] = [
  {
    id: "button",
    name: "Button",
    icon: <MousePointer className="w-4 h-4" />,
    html: `<div style="text-align: center; margin: 20px 0;">
      <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Click Me
      </a>
    </div>`,
    description: "Styled button with customizable text and link",
  },
  {
    id: "callout",
    name: "Callout Box",
    icon: <Layout className="w-4 h-4" />,
    html: `<div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: #495057;">Important Note</p>
      <p style="margin: 5px 0 0 0; color: #6c757d;">Add your important message here.</p>
    </div>`,
    description: "Highlighted callout box for important information",
  },
  {
    id: "social-buttons",
    name: "Social Media",
    icon: <Heart className="w-4 h-4" />,
    html: `<div style="text-align: center; margin: 20px 0;">
      <a href="#" style="display: inline-block; margin: 0 10px; padding: 10px; background-color: #3b5998; color: white; text-decoration: none; border-radius: 50%; width: 40px; height: 40px; line-height: 20px;">f</a>
      <a href="#" style="display: inline-block; margin: 0 10px; padding: 10px; background-color: #1da1f2; color: white; text-decoration: none; border-radius: 50%; width: 40px; height: 40px; line-height: 20px;">t</a>
      <a href="#" style="display: inline-block; margin: 0 10px; padding: 10px; background-color: #0077b5; color: white; text-decoration: none; border-radius: 50%; width: 40px; height: 40px; line-height: 20px;">in</a>
    </div>`,
    description: "Social media buttons for Facebook, Twitter, LinkedIn",
  },
  {
    id: "two-column",
    name: "Two Columns",
    icon: <Layout className="w-4 h-4" />,
    html: `<table style="width: 100%; margin: 20px 0;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width: 48%; padding-right: 2%; vertical-align: top;">
          <p>Left column content goes here. You can add text, images, or other elements.</p>
        </td>
        <td style="width: 48%; padding-left: 2%; vertical-align: top;">
          <p>Right column content goes here. Perfect for side-by-side layouts.</p>
        </td>
      </tr>
    </table>`,
    description: "Two-column layout for side-by-side content",
  },
  {
    id: "spacer",
    name: "Spacer",
    icon: <Layout className="w-4 h-4" />,
    html: `<div style="height: 30px; line-height: 30px;">&nbsp;</div>`,
    description: "Add vertical spacing between elements",
  },
  {
    id: "footer",
    name: "Email Footer",
    icon: <Layout className="w-4 h-4" />,
    html: `<div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; margin-top: 30px;">
      <p style="margin: 0; font-size: 12px; color: #6c757d;">
        © ${new Date().getFullYear()} Your Elder Voice. All rights reserved.<br>
        <a href="#" style="color: #007bff; text-decoration: none;">Unsubscribe</a> | 
        <a href="#" style="color: #007bff; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>`,
    description: "Professional email footer with links",
  },
];

export const availableVariables = [
  "{firstName}",
  "{lastName}",
  "{verificationLink}",
  "{patientName}",
  "{preferredName}",
  "{callTime}",
  "{callDuration}",
  "{nextCallTime}",
  "{caregiverName}",
  "{facilityName}",
  "{callStatus}",
  "{concernType}",
  "{severityLevel}",
  "{failureReason}",
  "{nextAttempt}",
];
