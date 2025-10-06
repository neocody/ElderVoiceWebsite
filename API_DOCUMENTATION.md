# Elder Voice Application - API Documentation

This document provides comprehensive documentation for all server APIs in the Elder Voice elderly care platform.

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Core Application APIs](#core-application-apis) 
3. [Twilio Voice Communication APIs](#twilio-voice-communication-apis)
4. [Billing & Stripe APIs](#billing--stripe-apis)
5. [Admin Statistics APIs](#admin-statistics-apis)
6. [System Management APIs](#system-management-apis)
7. [File Management APIs](#file-management-apis)
8. [Email Template APIs](#email-template-apis)
9. [ElevenLabs Voice APIs](#elevenlabs-voice-apis)
10. [Job Queue APIs](#job-queue-apis)
11. [Error Tracking APIs](#error-tracking-apis)
12. [Health Check APIs](#health-check-apis)

---

## Authentication APIs

### POST /api/auth/register
Register a new user account with password-based authentication.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/auth/login
Login with email and password credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/auth/logout
Logout current user and destroy session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/auth/user
Get current authenticated user information.

**Headers:** Requires authentication

**Response:**
```json
{
  "id": "user-id",
  "email": "john@example.com", 
  "firstName": "John",
  "lastName": "Doe",
  "role": "administrator"
}
```

### POST /api/auth/forgot-password
Request password reset for forgotten password.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

---

## Core Application APIs

### GET /api/elderly-users
Get all elderly users/patients for authenticated caregiver.

**Headers:** Requires authentication

**Response:**
```json
[
  {
    "id": "patient-id",
    "name": "Jane Smith",
    "preferredName": "Grandma Jane",
    "age": 78,
    "phoneNumber": "555-123-4567",
    "emergencyContact": "John Smith",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### POST /api/elderly-users
Create a new elderly user/patient profile.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "name": "Jane Smith",
  "preferredName": "Grandma Jane", 
  "age": 78,
  "phoneNumber": "555-123-4567",
  "emergencyContact": "John Smith",
  "emergencyContactPhone": "555-987-6543",
  "lifeStory": "Retired teacher from Texas",
  "hobbiesInterests": "Gardening, reading, country music",
  "personalityTraits": "Kind, nostalgic, loves family stories",
  "healthStatus": "Good overall health, mild arthritis",
  "conversationStyle": "friendly"
}
```

### PUT /api/elderly-users/:id
Update existing elderly user/patient profile.

**Headers:** Requires authentication
**Parameters:** `id` - Patient ID

**Request Body:** Same as POST /api/elderly-users

### GET /api/calls
Get call history for authenticated user.

**Headers:** Requires authentication

**Response:**
```json
[
  {
    "id": "call-id",
    "elderlyUserId": "patient-id", 
    "status": "completed",
    "duration": 456,
    "summary": "Pleasant conversation about family",
    "createdAt": "2025-01-01T10:00:00Z"
  }
]
```

### POST /api/calls
Create a new call record.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "elderlyUserId": "patient-id",
  "status": "initiated",
  "twilioCallSid": "twilio-call-id"
}
```

### GET /api/calls/:id/transcripts
Get transcript for specific call.

**Headers:** Requires authentication
**Parameters:** `id` - Call ID

**Response:**
```json
{
  "callId": "call-id",
  "transcript": "Hello, this is your AI companion...",
  "summary": "Pleasant conversation about gardening"
}
```

### POST /api/calls/:id/extract-memories
Extract and store memories from call conversation.

**Headers:** Requires authentication
**Parameters:** `id` - Call ID

**Response:**
```json
{
  "memories": [
    {
      "content": "Patient mentioned visiting daughter next week",
      "importance": "high",
      "tags": ["family", "upcoming_events"]
    }
  ]
}
```

### GET /api/schedules
Get call schedules for authenticated user.

**Headers:** Requires authentication

**Response:**
```json
[
  {
    "id": "schedule-id",
    "elderlyUserId": "patient-id",
    "frequency": "daily",
    "timeOfDay": "09:00",
    "isActive": true
  }
]
```

### POST /api/schedules
Create new call schedule.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "elderlyUserId": "patient-id",
  "frequency": "daily",
  "timeOfDay": "09:00",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "isActive": true
}
```

### PUT /api/schedules/:id
Update existing call schedule.

**Headers:** Requires authentication
**Parameters:** `id` - Schedule ID

### DELETE /api/schedules/:id
Delete call schedule.

**Headers:** Requires authentication
**Parameters:** `id` - Schedule ID

### GET /api/notifications
Get notifications for authenticated user.

**Headers:** Requires authentication

**Response:**
```json
[
  {
    "id": "notification-id",
    "userId": "user-id",
    "title": "Call Completed",
    "message": "Call with Jane Smith completed successfully", 
    "type": "info",
    "read": false,
    "createdAt": "2025-01-01T10:30:00Z"
  }
]
```

### PATCH /api/notifications/:id/read
Mark notification as read.

**Headers:** Requires authentication
**Parameters:** `id` - Notification ID

---

## Twilio Voice Communication APIs

### POST /api/twilio/voice
**CRITICAL ENDPOINT - DO NOT MODIFY**
Twilio webhook for incoming voice calls. Generates TwiML response for AI conversations.

**Request Body:** Twilio webhook payload

**Response:** TwiML XML for voice handling

### POST /api/twilio/status
Twilio webhook for call status updates.

**Request Body:** Twilio call status webhook payload

### POST /api/test-call
Initiate test call to specified phone number.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "phoneNumber": "555-123-4567",
  "elderlyUserId": "patient-id"
}
```

**Response:**
```json
{
  "success": true,
  "callSid": "twilio-call-sid",
  "message": "Test call initiated successfully"
}
```

### POST /api/test-call/:callSid/hangup
Hangup active test call.

**Headers:** Requires authentication
**Parameters:** `callSid` - Twilio call SID

### GET /audio/:filename
Serve audio files for Twilio playback.

**Parameters:** `filename` - Audio file name

---

## Billing & Stripe APIs

### POST /api/billing/create-payment-intent
Create Stripe payment intent for one-time payments.

**Request Body:**
```json
{
  "amount": 2999,
  "currency": "usd",
  "description": "Elder Voice Premium Plan",
  "customer": {
    "email": "customer@example.com",
    "phone": "555-123-4567"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "customerId": "cus_xxx"
}
```

### POST /api/billing/create-subscription
Create Stripe subscription.

**Request Body:**
```json
{
  "customerId": "cus_xxx",
  "priceId": "price_xxx",
  "trialPeriodDays": 7
}
```

**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### POST /api/billing/webhook
Stripe webhook endpoint for subscription events.

**Request Body:** Stripe webhook payload
**Headers:** `stripe-signature` header for verification

---

## Admin Statistics APIs

### GET /api/admin/stats/overview
Get comprehensive admin dashboard statistics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "totalUsers": 150,
  "activeUsers": 142,
  "callsToday": 45,
  "callsThisWeek": 320,
  "callsThisMonth": 1250,
  "completedCalls": 1100,
  "failedCalls": 25,
  "activeCalls": 3,
  "activePatients": 128,
  "activeSchedules": 95,
  "unreadNotifications": 12
}
```

### GET /api/admin/stats/billing
Get billing and subscription statistics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "totalRevenue": 45000,
  "monthlyRecurringRevenue": 15000,
  "activeSubscriptions": 150,
  "trialSubscriptions": 12,
  "cancelledSubscriptions": 8
}
```

### GET /api/admin/stats/system
Get system performance statistics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "serverUptime": 3600,
  "memoryUsage": 512,
  "cpuUsage": 25.5,
  "databaseConnections": 5,
  "cacheHitRate": 85.2
}
```

### GET /api/admin/stats/calls
Get detailed call analytics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "totalCalls": 5000,
  "averageDuration": 456,
  "successRate": 96.5,
  "callsByStatus": {
    "completed": 4825,
    "failed": 125,
    "in-progress": 50
  }
}
```

---

## System Management APIs

### GET /health
Basic public health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T10:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

### GET /api/health/detailed
Detailed health check with service status.

**Headers:** Requires authentication

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "twilio": true,
    "openai": true,
    "elevenlabs": true
  },
  "timestamp": "2025-01-01T10:00:00Z",
  "uptime": 3600
}
```

### GET /api/admin/cache/stats
Get cache performance statistics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "hits": 1250,
  "misses": 180,
  "hitRate": 87.4,
  "totalKeys": 45
}
```

### POST /api/admin/cache/clear
Clear application cache.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

### GET /api/admin/migrations/status
Get database migration status.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "pendingMigrations": [],
  "completedMigrations": ["001_initial", "002_add_users"],
  "lastMigration": "002_add_users"
}
```

### POST /api/admin/migrations/run
Run pending database migrations.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "message": "Migrations completed successfully"
}
```

---

## File Management APIs

### POST /api/files/upload/profile-photo
Upload user profile photo.

**Headers:** Requires authentication
**Content-Type:** multipart/form-data

**Form Data:**
- `file`: Image file (max 5MB, jpg/png/gif)

**Response:**
```json
{
  "fileId": "file-id",
  "filename": "profile-photo.jpg",
  "url": "/api/files/file-id",
  "size": 102400
}
```

### POST /api/files/upload/document
Upload document file.

**Headers:** Requires authentication
**Content-Type:** multipart/form-data

**Form Data:**
- `file`: Document file (max 10MB, pdf/doc/docx)

### POST /api/files/upload/attachments
Upload general attachments.

**Headers:** Requires authentication
**Content-Type:** multipart/form-data

**Form Data:**
- `files`: Multiple files (max 20MB each)

### GET /api/files/:fileId
Download/view uploaded file.

**Parameters:** `fileId` - File identifier

### DELETE /api/files/:fileId
Delete uploaded file.

**Headers:** Requires authentication
**Parameters:** `fileId` - File identifier

### GET /api/files/admin/stats
Get file storage statistics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "totalFiles": 1250,
  "totalSize": 5242880000,
  "filesByType": {
    "images": 800,
    "documents": 350,
    "audio": 100
  }
}
```

---

## Email Template APIs

### GET /api/admin/notification-templates
Get all notification templates.

**Headers:** Requires authentication (admin)

**Response:**
```json
[
  {
    "id": "template-id",
    "name": "Call Completion",
    "subject": "Call completed with {patientName}",
    "emailContent": "The call with {patientName} was completed successfully...",
    "smsContent": "Call with {patientName} completed",
    "isActive": true
  }
]
```

### POST /api/admin/notification-templates
Create new notification template.

**Headers:** Requires authentication (admin)

**Request Body:**
```json
{
  "name": "Call Failure Alert",
  "subject": "Call failed for {patientName}",
  "emailContent": "We were unable to reach {patientName}...",
  "smsContent": "Call failed for {patientName}",
  "targetUserTypes": ["family_member", "caregiver"],
  "priority": "high",
  "isActive": true
}
```

### PATCH /api/admin/notification-templates/:id
Update notification template.

**Headers:** Requires authentication (admin)
**Parameters:** `id` - Template ID

### DELETE /api/admin/notification-templates/:id
Delete notification template.

**Headers:** Requires authentication (admin)
**Parameters:** `id` - Template ID

### POST /api/admin/email-templates/test
Send test email using template.

**Headers:** Requires authentication (admin)

**Request Body:**
```json
{
  "templateId": "template-id",
  "recipientEmail": "test@example.com",
  "variables": {
    "patientName": "Jane Smith",
    "callTime": "10:30 AM"
  }
}
```

---

## ElevenLabs Voice APIs

### GET /api/conversational-ai/account-check
Check ElevenLabs account status and capabilities.

**Response:**
```json
{
  "accountValid": true,
  "charactersRemaining": 50000,
  "voicesAvailable": 8
}
```

### POST /api/conversational-ai/test
Test ElevenLabs voice generation.

**Request Body:**
```json
{
  "text": "Hello, this is a test of the voice system",
  "voiceId": "21m00Tcm4TlvDq8ikWAM"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/uploads/audio/test-voice.mp3",
  "duration": 3.2
}
```

### GET /api/conversational-ai/status/:conversationId
Get status of ElevenLabs conversation.

**Parameters:** `conversationId` - Conversation identifier

---

## Job Queue APIs

### GET /api/jobs/stats
Get job queue statistics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "totalJobs": 1500,
  "completedJobs": 1450,
  "failedJobs": 25,
  "pendingJobs": 25,
  "processingRate": 95.2
}
```

### GET /api/jobs/:status
Get jobs by status (pending, completed, failed).

**Headers:** Requires authentication (admin)
**Parameters:** `status` - Job status filter

### POST /api/jobs/queue/email
Queue email job for background processing.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "templateId": "template-id",
  "variables": {
    "name": "John Doe"
  },
  "priority": "normal"
}
```

### POST /api/jobs/queue/sms
Queue SMS job for background processing.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "to": "+15551234567",
  "message": "Your call is scheduled for 2 PM today",
  "priority": "high"
}
```

---

## Error Tracking APIs

### GET /api/admin/errors/stats
Get error tracking statistics.

**Headers:** Requires authentication (admin)

**Response:**
```json
{
  "totalErrors": 150,
  "resolvedErrors": 130,
  "activeErrors": 20,
  "errorRate": 2.1
}
```

### GET /api/admin/errors/recent
Get recent error occurrences.

**Headers:** Requires authentication (admin)

**Response:**
```json
[
  {
    "id": "error-id",
    "message": "Database connection timeout",
    "stack": "Error: timeout...",
    "endpoint": "/api/calls",
    "userId": "user-id",
    "timestamp": "2025-01-01T10:00:00Z",
    "resolved": false
  }
]
```

### PATCH /api/admin/errors/:id/resolve
Mark error as resolved.

**Headers:** Requires authentication (admin)
**Parameters:** `id` - Error ID

---

## Development Endpoints

### POST /api/dev-login-admin
**Development only** - Bypass authentication for testing.

**Response:**
```json
{
  "message": "Logged in as test admin",
  "user": {
    "id": "test-admin-456",
    "email": "admin@example.com"
  }
}
```

### GET /api/dev-auto-login
**Development only** - Auto-login for development.

---

## Authentication & Authorization

Most API endpoints require authentication via session cookies. Admin-only endpoints require the user to have administrator role.

**Authentication Methods:**
1. **Session-based**: Standard web session with cookies
2. **Replit OAuth**: OpenID Connect integration with Replit
3. **Google OAuth**: OAuth2 integration with Google
4. **Password-based**: Traditional email/password authentication

**Rate Limiting:**
- General API endpoints: 100 requests/minute
- Admin endpoints: 50 requests/minute  
- Twilio webhooks: No rate limiting (whitelisted)

**Security Headers:**
- CORS protection
- Content Security Policy
- Rate limiting with progressive slowdown
- Webhook signature verification (Twilio, Stripe)

---

## Error Response Format

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "errors": [...], // Validation errors if applicable
  "code": "ERROR_CODE" // Optional error code
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized 
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## WebSocket Endpoints

The application includes WebSocket support for real-time features:

- **Media Streaming**: `/api/media-stream/:callSid` - Twilio media stream handling
- **Real-time Notifications**: WebSocket connections for live notification updates
- **Call Status Updates**: Real-time call status changes

---

*This documentation covers all major API endpoints as of January 2025. For the most up-to-date endpoint definitions, refer to the individual route files in `server/routes/`.*