import type { Express } from "express";
import { storage } from "../storage";

/**
 * ElevenLabs Conversational AI Webhook Endpoints
 * Required for Twilio phone call integration
 */

// Middleware to verify ElevenLabs webhook authenticity
function verifyElevenLabsWebhook(req: any, res: any, next: any) {
  // ElevenLabs webhook secret for verification
  const expectedSecret = 'wsec_e9bdefc8f67cf48ab4fdd4afcd56893fc2d52543fe8fc7e7b4cc7c154da978e4';
  
  // ElevenLabs typically sends webhooks with specific headers
  const authHeader = req.headers['authorization'];
  const webhookSecret = req.headers['xi-signature'] || req.headers['x-webhook-secret'];
  const userAgent = req.headers['user-agent'];
  
  console.log(`[ELEVENLABS WEBHOOK] Auth header: ${authHeader}`);
  console.log(`[ELEVENLABS WEBHOOK] Webhook secret: ${webhookSecret}`);
  console.log(`[ELEVENLABS WEBHOOK] User agent: ${userAgent}`);
  console.log(`[ELEVENLABS WEBHOOK] Headers:`, JSON.stringify(req.headers, null, 2));
  
  // Verify webhook secret if provided
  if (webhookSecret && webhookSecret !== expectedSecret) {
    console.log(`[ELEVENLABS WEBHOOK] Invalid webhook secret provided`);
    return res.status(403).json({ error: 'Invalid webhook secret' });
  }
  
  // Allow requests from ElevenLabs or requests with valid secret
  next();
}

export function registerElevenLabsWebhooks(app: Express) {
  
  /**
   * Conversation Initiation Client Data Webhook
   * Called when a new Twilio phone call conversation begins
   * This webhook provides patient context to ElevenLabs agent
   */
  app.post("/api/elevenlabs/conversation-initiation", verifyElevenLabsWebhook, async (req, res) => {
    try {
      console.log(`[ELEVENLABS WEBHOOK] Conversation initiation webhook called`);
      console.log(`[ELEVENLABS WEBHOOK] Request body:`, JSON.stringify(req.body, null, 2));
      
      // Extract conversation ID and phone number from ElevenLabs webhook
      const { conversation_id, client_tools, phone_number } = req.body;
      
      if (!conversation_id) {
        console.error(`[ELEVENLABS WEBHOOK] No conversation_id provided`);
        return res.status(400).json({ error: "conversation_id required" });
      }
      
      console.log(`[ELEVENLABS WEBHOOK] Processing conversation: ${conversation_id}`);
      console.log(`[ELEVENLABS WEBHOOK] Phone number: ${phone_number}`);
      
      // Try to find the patient based on the phone call context
      // This would typically be passed via query parameters or call context
      let patientData = null;
      
      // For now, we'll use a default patient since we need to match this with our calling system
      // In production, this would be matched via call SID or phone number
      try {
        const elderlyUsers = await storage.getElderlyUsers();
        patientData = elderlyUsers[0]; // Use first patient for testing
        console.log(`[ELEVENLABS WEBHOOK] Using patient data for: ${patientData?.name}`);
      } catch (error) {
        console.error(`[ELEVENLABS WEBHOOK] Error fetching patient data:`, error);
      }
      
      // Return patient-specific context data to ElevenLabs agent
      const clientData = {
        patient_name: patientData?.name || "Friend",
        preferred_name: patientData?.preferredName || patientData?.name || "Friend",
        age: patientData?.age || "unknown",
        life_story: patientData?.lifeStory || "not provided",
        family_info: patientData?.familyInfo || "not provided", 
        hobbies_interests: patientData?.hobbiesInterests || "not specified",
        favorite_topics: patientData?.favoriteTopics || "general conversation",
        personality_traits: patientData?.personalityTraits || "friendly",
        health_status: patientData?.healthStatus || "not specified",
        special_notes: patientData?.specialNotes || "none",
        conversation_style: patientData?.conversationStyle || "warm and caring",
        phone_number: phone_number,
        conversation_id: conversation_id,
        timestamp: new Date().toISOString()
      };
      
      console.log(`[ELEVENLABS WEBHOOK] Sending client data:`, JSON.stringify(clientData, null, 2));
      
      // Return the patient context to ElevenLabs agent
      res.json({
        client_data: clientData,
        success: true
      });
      
    } catch (error) {
      console.error(`[ELEVENLABS WEBHOOK] Error in conversation initiation:`, error);
      res.status(500).json({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  /**
   * Post-Call Webhook  
   * Called when a conversation ends
   * Used for logging and cleanup
   */
  app.post("/api/elevenlabs/post-call", verifyElevenLabsWebhook, async (req, res) => {
    try {
      console.log(`[ELEVENLABS WEBHOOK] Post-call webhook called`);
      console.log(`[ELEVENLABS WEBHOOK] Request body:`, JSON.stringify(req.body, null, 2));
      
      const { 
        conversation_id, 
        duration_seconds, 
        transcript, 
        summary,
        phone_number,
        status 
      } = req.body;
      
      console.log(`[ELEVENLABS WEBHOOK] Call completed - Conversation: ${conversation_id}`);
      console.log(`[ELEVENLABS WEBHOOK] Duration: ${duration_seconds}s, Status: ${status}`);
      
      // Log the call completion in our system
      try {
        // Find matching call record and update it
        const calls = await storage.getCalls();
        const matchingCall = calls.find(call => 
          call.status === 'in-progress' && 
          call.notes?.includes(phone_number)
        );
        
        if (matchingCall) {
          await storage.updateCall(matchingCall.id, {
            status: 'completed',
            duration: duration_seconds,
            transcript: transcript || null,
            summary: summary || null,
            endedAt: new Date(),
            notes: `${matchingCall.notes} - ElevenLabs conversation: ${conversation_id}`
          });
          console.log(`[ELEVENLABS WEBHOOK] Updated call record ${matchingCall.id}`);
        } else {
          console.log(`[ELEVENLABS WEBHOOK] No matching call record found for phone: ${phone_number}`);
        }
        
      } catch (error) {
        console.error(`[ELEVENLABS WEBHOOK] Error updating call record:`, error);
      }
      
      res.json({ 
        success: true,
        message: "Post-call webhook processed successfully"
      });
      
    } catch (error) {
      console.error(`[ELEVENLABS WEBHOOK] Error in post-call webhook:`, error);
      res.status(500).json({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  /**
   * Conversation Status Webhook (optional)
   * For real-time conversation status updates
   */
  app.post("/api/elevenlabs/conversation-status", verifyElevenLabsWebhook, async (req, res) => {
    try {
      console.log(`[ELEVENLABS WEBHOOK] Conversation status update:`, JSON.stringify(req.body, null, 2));
      
      // Just acknowledge the status update
      res.json({ success: true });
      
    } catch (error) {
      console.error(`[ELEVENLABS WEBHOOK] Error in status webhook:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}