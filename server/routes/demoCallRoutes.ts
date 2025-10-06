import type { Express } from "express";
import { z } from "zod";
import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

// Validation schema for demo call requests
const demoCallRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().optional(),
  role: z.string().optional(),
  preferredTime: z.string().optional(),
  timeZone: z.string().optional(),
  numberOfPatients: z.string().optional(),
  currentSolution: z.string().optional(),
  specificNeeds: z.string().optional(),
  urgency: z.string().optional(),
});

export function registerDemoCallRoutes(app: Express) {
  // Demo call request endpoint
  app.post("/api/demo-call-request", async (req, res) => {
    try {
      const result = demoCallRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.errors,
        });
      }

      const data = result.data;
      
      // Create email content for admin notification
      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🔔 New Demo Call Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">AI Companion Application</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Name:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                <td style="padding: 8px 0; color: #6b7280;"><a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
                <td style="padding: 8px 0; color: #6b7280;"><a href="tel:${data.phone}" style="color: #3b82f6;">${data.phone}</a></td>
              </tr>
              ${data.company ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Company:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.company}</td>
              </tr>
              ` : ''}
              ${data.role ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Role:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.role}</td>
              </tr>
              ` : ''}
            </table>

            ${data.preferredTime || data.timeZone || data.urgency ? `
            <h2 style="color: #1e40af; margin: 25px 0 15px 0;">Scheduling Preferences</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              ${data.preferredTime ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Preferred Time:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.preferredTime}</td>
              </tr>
              ` : ''}
              ${data.timeZone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time Zone:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.timeZone}</td>
              </tr>
              ` : ''}
              ${data.urgency ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Timeline:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.urgency}</td>
              </tr>
              ` : ''}
            </table>
            ` : ''}

            ${data.numberOfPatients || data.currentSolution || data.specificNeeds ? `
            <h2 style="color: #1e40af; margin: 25px 0 15px 0;">Needs Assessment</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              ${data.numberOfPatients ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Number of Patients:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.numberOfPatients}</td>
              </tr>
              ` : ''}
              ${data.currentSolution ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Current Solution:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.currentSolution}</td>
              </tr>
              ` : ''}
              ${data.specificNeeds ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Specific Needs:</td>
                <td style="padding: 8px 0; color: #6b7280;">${data.specificNeeds}</td>
              </tr>
              ` : ''}
            </table>
            ` : ''}

            <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px;">📞 Next Steps</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                Contact ${data.name} within 24 hours to schedule their demo call
              </p>
            </div>
          </div>
          
          <div style="background: #e2e8f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              This email was automatically generated by the AI Companion Application demo request system
            </p>
          </div>
        </div>
      `;

      // Create confirmation email for the requester
      const confirmationEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">✅ Demo Call Request Received</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">AI Companion for Elderly Care</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
              Dear <strong>${data.name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for your interest in our AI Companion service for elderly care! We've received your demo call request and our team will contact you within <strong>24 hours</strong> to schedule your personalized demonstration.
            </p>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">What to Expect:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin: 8px 0;">Personalized 30-minute demo tailored to your needs</li>
                <li style="margin: 8px 0;">Discussion about how our AI companions work</li>
                <li style="margin: 8px 0;">Review of pricing and implementation options</li>
                <li style="margin: 8px 0;">Q&A session to address your specific questions</li>
              </ul>
            </div>

            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 25px 0 20px 0;">
              In the meantime, feel free to reply to this email if you have any urgent questions or if your availability changes.
            </p>

            <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px;">🤝 We're Here to Help</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                Our mission is to bring peace of mind to families through compassionate AI companionship
              </p>
            </div>
          </div>
          
          <div style="background: #e2e8f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              AI Companion Application • Caring companionship, powered by technology
            </p>
          </div>
        </div>
      `;

      // Send email to admin
      await mailService.send({
        to: 'admin@eldercare-ai.com', // Admin notification email
        from: 'demo-requests@eldercare-ai.com', // Demo request notifications
        subject: `🔔 New Demo Call Request from ${data.name}`,
        html: adminEmailHtml,
        text: `New demo call request from ${data.name} (${data.email}, ${data.phone}). Company: ${data.company || 'N/A'}. Role: ${data.role || 'N/A'}. Patients: ${data.numberOfPatients || 'N/A'}. Preferred time: ${data.preferredTime || 'N/A'}. Urgency: ${data.urgency || 'N/A'}. Specific needs: ${data.specificNeeds || 'N/A'}`,
      });

      // Send confirmation email to requester
      await mailService.send({
        to: data.email,
        from: 'welcome@eldercare-ai.com', // Welcome and confirmation emails
        subject: '✅ Demo Call Request Received - AI Companion',
        html: confirmationEmailHtml,
        text: `Dear ${data.name}, thank you for your interest in our AI Companion service! We've received your demo call request and our team will contact you within 24 hours to schedule your personalized demonstration.`,
      });

      res.json({
        success: true,
        message: "Demo call request submitted successfully",
      });

    } catch (error) {
      console.error("Error processing demo call request:", error);
      res.status(500).json({
        message: "Failed to submit demo call request",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}