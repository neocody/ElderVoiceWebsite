# Elder Voice Application

## Overview
This full-stack Elder Voice application provides regular, caring phone calls to elderly users. It allows family members and caregivers to manage user profiles, schedule calls, and monitor interactions through an AI-powered service. The system utilizes OpenAI for conversation generation and Twilio for voice communications, aiming to provide empathetic, personalized interactions to enhance the well-being of elderly individuals. The business vision is to create a scalable platform that leverages AI to offer consistent companionship and support, addressing social isolation among the elderly and providing peace of mind to their families.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **Contact Page Streamlining (2025-09-30)**: Simplified Contact page with email obfuscation and department-specific contacts
  - **Removed Sections**: Phone support widget, Book Demo, Our Locations, Emergency Support sections
  - **Department Emails**: Individual families (hello@), Healthcare facilities (healthcare@), Technical support (support@), Billing (billing@)
  - **Email Obfuscation**: Implemented bot protection using dynamic mailto link construction
  - **Formspree Integration**: Verified contact form using Formspree (mldpgepo) with proper error handling
  - **No Phone Numbers**: Removed all phone number references as requested
- **Live Chat Integration & Content Cleanup (2025-09-30)**: Added Tawk.to live chat and removed all false HIPAA claims
  - **Tawk.to Integration**: Integrated live chat widget (ID: 68dc2e7e311aad1952563515/1j6e1b7th) available across all pages for real-time visitor support
  - **Content Security Policy**: Updated CSP to allow all Tawk.to resources (scripts, WebSockets, fonts, media)
  - **HIPAA Claims Removal**: Removed all HIPAA compliance mentions from Facilities, Features, FAQs, and Admin Panel pages (Privacy Policy correctly states NOT HIPAA compliant)
  - **Individuals Page**: Removed stock images for cleaner presentation with centered header text
- **Pricing Simplification & Visual Enhancements (2025-09-30)**: Streamlined pricing model and enhanced visual presentation
  - **Single Promotional Price**: Changed from multiple tiers to single promotional package: $49/mo crossed out, showing $25/mo promotional price
  - **Feature Highlight**: "Up to 20 minutes daily calls" as primary feature
  - **Trial Badge Positioning**: Adjusted "7-day free trial" badge on user type selection to stay within card boundaries while maintaining half-out position on top
- **Navigation & Content Updates (2025-09-30)**: Removed fake/unverifiable information and restructured navigation
  - **Vision Page**: Replaced About page with authentic Vision page, removed team/timeline/recognition sections
  - **Careers Page**: Added comprehensive careers page with 4 job listings, all linking to careers@eldervoice.com
  - **Footer Navigation**: Moved Vision and Careers links to footer only, removed from main navigation
- **Complete Signup Flow Redesign (2025-09-24)**: Built comprehensive 7-step onboarding system replacing previous multi-tier complex system
  - **Single Plan Model**: Simplified to $19.95/month with 7-day trial, eliminating complex pricing tiers
  - **User Type Branching**: Dynamic flow for "Myself" vs "Loved One" vs "Care Facility" with different experiences throughout all steps
  - **Verification System**: Created SMS/email verification endpoints with graceful fallbacks and dev mode support
  - **Complete Form Flow**: UserTypeSelection → Verification → PersonalInfo → Personalization → CallPreferences → Checkout → Success
  - **Stripe Integration**: Full SCA handling, graceful fallbacks, proper environment configuration, trial-to-subscription flow
  - **Backend APIs**: Added `/api/auth/send-sms-verification`, `/api/auth/send-email-verification`, `/api/auth/verify-code` with proper error handling
  - **State Management**: React Context with localStorage persistence, step navigation, and data validation
  - **UI Consistency**: Fixed call frequency limits, improved error handling, mobile responsiveness
  - **Navigation Updates**: Updated all "Get Started" and "Start Free Trial" buttons across marketing pages to point to `/getstarted`
  - **Facility Demo**: Standalone care facility demo request form at `/getstarted/facility-demo`
- **Database Infrastructure Overhaul (2025-08-20)**: Completely resolved all database schema mismatches causing widespread 500 errors
  - Fixed servicePlans table (table name and column structure)
  - Fixed clients table (added missing billing columns: billing_phone, billing_address, billing_city, billing_state, billing_zip, billing_country, facility_license, facility_capacity, facility_type)
  - Fixed services table (renamed name→service_name, added custom_price, discount_percent, contract_notes, start_date, end_date)
  - Fixed patients table (renamed phone→primary_phone, added address, emergency_contact, emergency_phone, care_instructions)
  - All CRUD operations now working: clients, services, patients, service plans APIs fully operational
- **Admin Authentication (2025-08-20)**: Fixed admin login flow - users now properly authenticate and redirect to dashboard instead of returning to homepage

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth (OpenID Connect), session-based with PostgreSQL store
- **Database**: PostgreSQL with Drizzle ORM
- **API**: RESTful design with error handling

### Database Design
Key entities include `sessions`, `users` (caregiver/family member accounts), `elderlyUsers` (profiles, preferences), `calls` (history, metadata), `schedules` (configuration), and `notifications`.

### Key Features
- **Authentication**: Replit-based OAuth, role-based access control, session management.
- **AI Conversation Engine**: OpenAI GPT-4o for natural, context-aware conversations, sentiment analysis, personalized topics. ElevenLabs integration for premium voice quality.
- **Voice Communication**: Twilio for outbound calls, TwiML generation for interactive voice responses, call status tracking.
- **Call Scheduling**: Cron-based scheduling with flexible patterns and time zone awareness.
- **Frontend Dashboard**: Responsive design, real-time data updates, interactive forms, statistics.
- **User Management**: Comprehensive CRUD for users with role-based access.
- **Patient Onboarding**: Detailed forms capturing conversation-relevant information (life story, hobbies, health, etc.) for personalized AI interactions.
- **Notification System**: Comprehensive system with templates, preferences, and multi-channel delivery (email, SMS).
- **Security**: API rate limiting, webhook signature verification, IP whitelisting, security headers.
- **Billing**: WHMCS-style client/service billing model with subscription management, custom pricing, and detailed analytics.

### Core Architectural Decisions
- **Modularity**: Routes are organized into `twilioRoutes`, `billingRoutes`, and `coreRoutes` for maintainability and protection of critical functionality.
- **Voice Consistency**: Achieved 100% voice consistency by exclusively using ElevenLabs for all call audio and removing all Twilio voice fallbacks, ensuring patients hear the same selected voice throughout conversations.
- **Latency Optimization**: Migration to ElevenLabs Conversational AI agents reduces conversation latency significantly compared to multi-API round-trip approaches.
- **Scalability**: Stateless server design and PostgreSQL session storage support horizontal scaling.
- **Unified Portal**: Caregiver and admin functionalities are integrated into a single interface with role-based viewing.
- **Data Persistence**: Uses Supabase PostgreSQL for all data storage.

## External Dependencies

### Core Services
- **Replit Authentication**: OAuth provider.
- **OpenAI API**: GPT-4o for conversation generation, sentiment analysis, transcript summaries, and memory extraction.
- **Twilio**: Voice calling, SMS services, webhook handling.
- **ElevenLabs**: Premium voice generation for AI conversations.
- **Neon Database**: PostgreSQL hosting.
- **SendGrid**: Email sending for notifications.
- **Stripe**: Payment processing and subscription management.

### Development Tools & Libraries
- **Drizzle Kit**: Database schema management.
- **ESBuild**: Backend bundling.
- **TypeScript**: Type safety.
- **Radix UI**: Accessible component primitives.
- **Lucide Icons**: Icon library.
- **date-fns**: Date utilities.
- **clsx/tailwind-merge**: CSS class handling.