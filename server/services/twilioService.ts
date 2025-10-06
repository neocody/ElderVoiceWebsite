import twilio from 'twilio';
import { elevenLabsService } from './elevenLabsService.js';
import fs from 'fs';
import path from 'path';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('[TWILIO] Environment check:');
console.log('  Account SID:', accountSid ? `${accountSid.slice(0, 10)}...` : 'MISSING');
console.log('  Auth Token:', authToken ? `${authToken.slice(0, 10)}...` : 'MISSING');
console.log('  Phone Number:', twilioPhoneNumber ? twilioPhoneNumber : 'MISSING');

if (!accountSid || !authToken || !twilioPhoneNumber) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required Twilio environment variables');
  } else {
    console.warn('Warning: Twilio credentials not found. Voice calling will be disabled in development mode.');
  }
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;
console.log('[TWILIO] Client initialized:', client ? 'SUCCESS' : 'FAILED');

export class TwilioService {
  async makeCall(to: string, elderlyUserId: number, agentId?: string): Promise<string> {
    if (!client || !twilioPhoneNumber) {
      console.log(`Simulated call to ${to} for elderly user ${elderlyUserId} (Twilio not configured)`);
      return `simulated-call-${Date.now()}`;
    }

    // Handle international phone numbers in E.164 format
    let formattedPhone = to;
    
    // If phone number doesn't start with +, assume it's a US number and add +1
    if (!to.startsWith('+')) {
      const digitsOnly = to.replace(/\D/g, '');
      
      // Validate US phone number length (should be 10 digits)
      if (digitsOnly.length !== 10) {
        throw new Error(`Invalid US phone number. Please enter exactly 10 digits (e.g., 5551234567). Got: ${digitsOnly} (${digitsOnly.length} digits)`);
      }
      
      formattedPhone = `+1${digitsOnly}`;
    } else {
      // For international numbers, validate they start with + and have at least 10 digits
      const digitsOnly = to.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        throw new Error(`Invalid international phone number. Must have at least 10 digits. Got: ${digitsOnly} (${digitsOnly.length} digits)`);
      }
    }

    console.log(`[TWILIO] Initiating call to ${formattedPhone} (original: ${to}) from ${twilioPhoneNumber}`);
    console.log(`[TWILIO] Phone number formatting: ${to} → ${formattedPhone}`);
    // Build webhook URL with agentId if provided
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twilio/voice?elderlyUserId=${elderlyUserId}`;
    const webhookUrl = agentId ? `${baseUrl}&agentId=${agentId}` : baseUrl;
    
    console.log(`[TWILIO] Webhook URL: ${webhookUrl}`);
    
    try {
      const call = await client.calls.create({
        to: formattedPhone,
        from: twilioPhoneNumber,
        url: webhookUrl,
        statusCallback: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twilio/status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      });

      console.log(`[TWILIO] Call created successfully. SID: ${call.sid}`);
      return call.sid;
    } catch (error: any) {
      console.error('Error making call:', error);
      
      // Provide specific guidance for common Twilio errors
      if (error.message?.includes('trial') || error.code === 21219) {
        console.log(`[TWILIO TRIAL] Phone number ${formattedPhone} needs to be verified in Twilio console`);
        console.log(`[TWILIO TRIAL] Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
        console.log(`[TWILIO TRIAL] Add ${formattedPhone} to verified caller IDs`);
      } else if (error.code === 21215) {
        console.log(`[TWILIO PERMISSIONS] International calling not enabled for ${formattedPhone}`);
        console.log(`[TWILIO PERMISSIONS] Go to: https://www.twilio.com/console/voice/calls/geo-permissions`);
        console.log(`[TWILIO PERMISSIONS] Enable permissions for the target country`);
        if (formattedPhone.startsWith('+52')) {
          console.log(`[TWILIO PERMISSIONS] This is a Mexico number - enable Mexico calling permissions`);
        }
      }
      
      throw error;
    }
  }

  async makeCallWithMediaStream(targetPhone: string, mediaStreamUrl: string, agentId: string): Promise<string> {
    if (!client || !twilioPhoneNumber) {
      console.log(`Simulated ElevenLabs Media Stream call to ${targetPhone} (Twilio not configured)`);
      return `simulated-media-stream-call-${Date.now()}`;
    }

    // Handle international phone numbers in E.164 format
    let formattedPhone = targetPhone;
    
    // If phone number doesn't start with +, assume it's a US number and add +1
    if (!targetPhone.startsWith('+')) {
      const digitsOnly = targetPhone.replace(/\D/g, '');
      
      // Validate US phone number length (should be 10 digits)
      if (digitsOnly.length !== 10) {
        throw new Error(`Invalid US phone number. Please enter exactly 10 digits (e.g., 5551234567). Got: ${digitsOnly} (${digitsOnly.length} digits)`);
      }
      
      formattedPhone = `+1${digitsOnly}`;
    }

    console.log(`[TWILIO] Creating Media Stream call to ${formattedPhone} with agent ${agentId}`);
    console.log(`[TWILIO] Media Stream URL: ${mediaStreamUrl}/${agentId}`);

    try {
      const call = await client.calls.create({
        to: formattedPhone,
        from: twilioPhoneNumber,
        url: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twilio/voice?elderlyUserId=1&agentId=${agentId}`,
        statusCallback: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twilio/status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      });

      console.log(`[TWILIO] Media Stream call created successfully. SID: ${call.sid}`);
      return call.sid;
    } catch (error: any) {
      console.error('Error making Media Stream call:', error);
      
      // Provide specific guidance for common Twilio errors
      if (error.message?.includes('trial') || error.code === 21219) {
        console.log(`[TWILIO TRIAL] Phone number ${formattedPhone} needs to be verified in Twilio console`);
        console.log(`[TWILIO TRIAL] Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
        console.log(`[TWILIO TRIAL] Add ${formattedPhone} to verified caller IDs`);
      }
      
      throw error;
    }
  }

  async makeElevenLabsAgentCall(targetPhone: string, elderlyUserId: number, patient?: any): Promise<string> {
    if (!client || !twilioPhoneNumber) {
      console.log(`Simulated ElevenLabs agent call to ${targetPhone} for elderly user ${elderlyUserId} (Twilio not configured)`);
      return `simulated-agent-call-${Date.now()}`;
    }

    console.log(`[TWILIO] Creating ElevenLabs agent call to ${targetPhone} for ${patient?.name || 'patient'}`);
    
    // Create a TwiML response that connects to ElevenLabs agent
    const twimlResponse = `
      <Response>
        <Dial>
          <Number>${targetPhone}</Number>
        </Dial>
      </Response>
    `;
    
    // Save TwiML to serve to ElevenLabs agent
    const twimlPath = path.join(process.cwd(), 'uploads', 'twiml', `agent-call-${Date.now()}.xml`);
    await fs.promises.mkdir(path.dirname(twimlPath), { recursive: true });
    await fs.promises.writeFile(twimlPath, twimlResponse);
    
    try {
      // Make direct call to target phone number instead of agent bridging
      const call = await client.calls.create({
        to: targetPhone, // Call patient directly
        from: twilioPhoneNumber,
        url: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twilio/voice?elderlyUserId=${elderlyUserId}`,
        statusCallback: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twilio/status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      });

      console.log(`[TWILIO] ElevenLabs agent call created successfully. SID: ${call.sid}`);
      return call.sid;
    } catch (error) {
      console.error('Error making ElevenLabs agent call:', error);
      throw error;
    }
  }

  async sendSMS(to: string, message: string): Promise<string> {
    if (!client || !twilioPhoneNumber) {
      console.log(`Simulated SMS to ${to}: ${message} (Twilio not configured)`);
      return `simulated-sms-${Date.now()}`;
    }

    try {
      const sms = await client.messages.create({
        to,
        from: twilioPhoneNumber,
        body: message,
      });

      return sms.sid;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  generateVoiceResponse(message: string, voice: string = "alice", elderlyUserId?: number, useElevenLabs: boolean = false, elevenLabsVoice: string = 'sarah-warm'): string {
    const domain = process.env.REPLIT_DEV_DOMAIN || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    const baseUrl = `https://${domain}`;
    
    const gatherUrl = elderlyUserId 
      ? `${baseUrl}/api/twilio/gather?elderlyUserId=${elderlyUserId}`
      : `${baseUrl}/api/twilio/gather`;
    
    if (useElevenLabs) {
      // Use ElevenLabs for premium voice generation
      return `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Play>${baseUrl}/api/audio/elevenlabs?text=${encodeURIComponent(message)}&voice=${elevenLabsVoice}</Play>
        <Gather timeout="10" input="speech" action="${gatherUrl}" method="POST" speechTimeout="3">
          <Play>${baseUrl}/api/audio/elevenlabs?text=${encodeURIComponent("You can respond now, or I'll continue after a moment.")}&voice=${elevenLabsVoice}</Play>
        </Gather>
        <Play>${baseUrl}/api/audio/elevenlabs?text=${encodeURIComponent("Thank you for listening. Have a wonderful day!")}&voice=${elevenLabsVoice}</Play>
        <Hangup/>
      </Response>`;
    }
      
    return `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Hangup/>
      </Response>`;
  }

  async generateElevenLabsAudio(text: string, voicePreset: string = 'sarah-warm'): Promise<Buffer | null> {
    return await elevenLabsService.generateSpeech(text, voicePreset);
  }

  generateGatherResponse(message: string, action: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Hangup/>
      </Response>`;
  }
}

export const twilioService = new TwilioService();
