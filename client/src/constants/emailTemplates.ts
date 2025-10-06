export const defaultHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #005FB8; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .button { display: inline-block; background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Elder Voice</h1>
        </div>
        <div class="content">
            <h2>Welcome to your personalized email</h2>
            <p>Hello {patientName},</p>
            <p>This is a sample email template that you can customize for your needs.</p>
            <p><a href="#" class="button">Take Action</a></p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Elder Voice. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

export const prebuiltTemplates = [
    {
        name: "Call Completed",
        description: "Notification for successful wellness calls",
        html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Call Completed</title><style>body{font-family:Arial,sans-serif;margin:0;padding:0;background-color:#f4f4f4}.container{max-width:600px;margin:0 auto;background-color:#ffffff}.header{background-color:#005FB8;color:white;padding:20px;text-align:center}.content{padding:30px}.footer{background-color:#f8f9fa;padding:20px;text-align:center;color:#666}.button{display:inline-block;background-color:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:4px}</style></head><body><div class="container"><div class="header"><h1>✓ Call Completed Successfully</h1></div><div class="content"><h2>Daily wellness check completed for {patientName}</h2><p><strong>Call Details:</strong></p><ul><li>Patient: {patientName}</li><li>Time: {callTime}</li><li>Duration: {callDuration}</li><li>Next Call: {nextCallTime}</li></ul><p><a href="#" class="button">View Full Report</a></p></div><div class="footer"><p>&copy; 2025 Elder Voice. All rights reserved.</p></div></div></body></html>`,
    },
    {
        name: "Call Failed",
        description: "Alert for missed or failed calls",
        html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Call Failed</title><style>body{font-family:Arial,sans-serif;margin:0;padding:0;background-color:#f4f4f4}.container{max-width:600px;margin:0 auto;background-color:#ffffff}.header{background-color:#dc3545;color:white;padding:20px;text-align:center}.content{padding:30px}.footer{background-color:#f8f9fa;padding:20px;text-align:center;color:#666}.button{display:inline-block;background-color:#dc3545;color:white;padding:12px 24px;text-decoration:none;border-radius:4px}</style></head><body><div class="container"><div class="header"><h1>⚠ Call Failed</h1></div><div class="content"><h2>Unable to reach {patientName}</h2><p>We were unable to complete the scheduled wellness call.</p><p><strong>Details:</strong></p><ul><li>Patient: {patientName}</li><li>Attempted: {callTime}</li><li>Reason: {failureReason}</li><li>Next Attempt: {nextAttempt}</li></ul><p><a href="#" class="button">Take Action</a></p></div><div class="footer"><p>&copy; 2025 Elder Voice. All rights reserved.</p></div></div></body></html>`,
    },
    {
        name: "Patient Concern",
        description: "Notification for patient health concerns",
        html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Patient Concern</title><style>body{font-family:Arial,sans-serif;margin:0;padding:0;background-color:#f4f4f4}.container{max-width:600px;margin:0 auto;background-color:#ffffff}.header{background-color:#ffc107;color:#212529;padding:20px;text-align:center}.content{padding:30px}.footer{background-color:#f8f9fa;padding:20px;text-align:center;color:#666}.button{display:inline-block;background-color:#ffc107;color:#212529;padding:12px 24px;text-decoration:none;border-radius:4px}</style></head><body><div class="container"><div class="header"><h1>❗ Patient Concern Detected</h1></div><div class="content"><h2>Attention needed for {patientName}</h2><p>Our AI has detected a potential concern during the wellness call.</p><p><strong>Concern Details:</strong></p><ul><li>Patient: {patientName}</li><li>Call Time: {callTime}</li><li>Concern: {concernType}</li><li>Severity: {severityLevel}</li></ul><p><a href="#" class="button">Review Details</a></p></div><div class="footer"><p>&copy; 2025 Elder Voice. All rights reserved.</p></div></div></body></html>`,
    },
];
