import fetch from "node-fetch";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Popular ElevenLabs voices optimized for elderly care
const VOICE_PRESETS: Record<string, string> = {
  "sarah-warm": "EXAVITQu4vr4xnSDxMaL", // Warm, caring female voice
  "rachel-friendly": "21m00Tcm4TlvDq8ikWAM", // Clear, friendly female voice
  "adam-calm": "pNInz6obpgDQGcFmaJgB", // Calm, reassuring male voice
  "antoni-gentle": "ErXwobaYiN019PkySvjV", // Gentle, soothing male voice
  "bella-compassionate": "EXAVITQu4vr4xnSDxMaL", // Compassionate female voice
  "josh-trustworthy": "TxGEqnHWrfWFTfGW9XjX", // Trustworthy male voice
  "old-american-man": "QZOPTHiWteIgblFWoaMc", // Custom Old American Man voice
  QZOPTHiWteIgblFWoaMc: "QZOPTHiWteIgblFWoaMc", // Direct voice ID access
};

const DEFAULT_VOICE = VOICE_PRESETS["sarah-warm"];

export class ElevenLabsService {
  // Start conversation with existing agent
  async startConversation(agentId: string): Promise<string | null> {
    if (!ELEVENLABS_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/convai/conversations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            agent_id: agentId,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[ELEVENLABS] Conversation start error: ${response.status} - ${errorText}`,
        );
        return null;
      }

      const data = await response.json();
      return data.conversation_id;
    } catch (error) {
      console.error("[ELEVENLABS] Error starting conversation:", error);
      return null;
    }
  }

  // Get signed URL for WebSocket connection to ElevenLabs conversation
  async getConversationWebSocket(
    conversationId: string,
  ): Promise<string | null> {
    if (!ELEVENLABS_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/get_signed_url`,
        {
          method: "GET",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        },
      );

      if (!response.ok) {
        console.error(`[ELEVENLABS] WebSocket URL error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.signed_url;
    } catch (error) {
      console.error("[ELEVENLABS] Error getting WebSocket URL:", error);
      return null;
    }
  }

  // Make phone call using ElevenLabs with Twilio Media Streams
  async makePhoneCallWithTwilio(
    phoneNumber: string,
    agentId: string,
  ): Promise<string | null> {
    if (!ELEVENLABS_API_KEY) {
      console.log("[ELEVENLABS] API key not configured for phone calls");
      return null;
    }

    try {
      // Import Twilio service for standard calling (not Media Streams)
      const { twilioService } = await import("./twilioService.js");

      // Use standard Twilio calling method (not Media Streams)
      // This will go through the normal voice webhook flow which now uses API-based method
      const callSid = await twilioService.makeCall(phoneNumber, 1, agentId); // elderlyUserId=1 for test calls

      if (callSid) {
        console.log(
          `[ELEVENLABS] Phone call initiated with standard webhook: ${callSid}`,
        );
        return callSid;
      }

      return null;
    } catch (error) {
      console.error("[ELEVENLABS] Error making phone call:", error);
      return null;
    }
  }

  async generateSpeech(
    text: string,
    voicePreset: string = "sarah-warm",
  ): Promise<Buffer | null> {
    if (!ELEVENLABS_API_KEY) {
      console.log(
        "[ELEVENLABS] API key not configured, falling back to Twilio TTS",
      );
      return null;
    }

    // Check if it's already a voice ID (starts with capital letters and contains mix of chars)
    let voiceId = voicePreset;
    if (voicePreset.length < 20 || !voicePreset.match(/^[A-Za-z0-9]+$/)) {
      // It's a preset name, look it up
      voiceId = VOICE_PRESETS[voicePreset];

      if (!voiceId) {
        // For custom voices, we need to find the voice ID by name
        console.log(`[ELEVENLABS] Looking up custom voice: ${voicePreset}`);
        const customVoiceId = await this.getVoiceIdByName(voicePreset);
        voiceId = customVoiceId || DEFAULT_VOICE;
        if (!customVoiceId) {
          console.log(
            `[ELEVENLABS] Custom voice "${voicePreset}" not found, using default`,
          );
        }
      }
    }

    console.log(
      `[ELEVENLABS] Using voice ID: ${voiceId} for text: "${text.substring(0, 50)}..."`,
    );

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.7,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 429) {
          console.warn(
            `[ELEVENLABS] Rate limit exceeded. API will be available again shortly.`,
          );
          // Return null to trigger Twilio TTS fallback
          return null;
        }

        console.error(
          `[ELEVENLABS] API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      console.log(
        `[ELEVENLABS] Generated ${audioBuffer.length} bytes of audio with voice: ${voicePreset}`,
      );
      return audioBuffer;
    } catch (error) {
      console.error("[ELEVENLABS] Error generating speech:", error);
      return null;
    }
  }

  async getVoiceIdByName(voiceName: string): Promise<string | null> {
    if (!ELEVENLABS_API_KEY) {
      return null;
    }

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      });

      if (!response.ok) {
        console.error(
          "[ELEVENLABS] Failed to fetch voices:",
          response.statusText,
        );
        return null;
      }

      const data = (await response.json()) as any;
      const voice = data.voices?.find((v: any) => v.name === voiceName);

      if (voice) {
        console.log(
          `[ELEVENLABS] Found custom voice "${voiceName}" with ID: ${voice.voice_id}`,
        );
        return voice.voice_id;
      }

      return null;
    } catch (error) {
      console.error("[ELEVENLABS] Error looking up voice:", error);
      return null;
    }
  }

  getAvailableVoices(): Array<{
    id: string;
    name: string;
    description: string;
    gender: string;
  }> {
    // These are popular ElevenLabs pre-built voices with their actual IDs
    return [
      {
        id: "QZOPTHiWteIgblFWoaMc",
        name: "Old American Man",
        description: "Warm, caring older male voice - current default",
        gender: "male",
      },
      {
        id: "EXAVITQu4vr4xnSDxMaL",
        name: "Sarah",
        description: "Clear, friendly female voice with excellent clarity",
        gender: "female",
      },
      {
        id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        description: "Confident, warm female voice",
        gender: "female",
      },
      {
        id: "CYw3kZ02Hs0563khs1Fj",
        name: "Dave",
        description: "Professional, trustworthy male voice",
        gender: "male",
      },
      {
        id: "FGY2WhTYpPnrIDTdsKH5",
        name: "Laura",
        description: "Gentle, caring female voice",
        gender: "female",
      },
      {
        id: "IKne3meq5aSn9XLyUdCD",
        name: "Charlie",
        description: "Calm, reassuring male voice",
        gender: "male",
      },
      {
        id: "JBFqnCBsd6RMkjVDRZzb",
        name: "George",
        description: "Mature, wise male voice",
        gender: "male",
      },
      {
        id: "XrExE9yKIg1WjnnlVkGX",
        name: "Matilda",
        description: "Warm, grandmotherly female voice",
        gender: "female",
      },
    ];
  }

  async getVoices(): Promise<any[]> {
    if (!ELEVENLABS_API_KEY) {
      return [];
    }

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      });

      if (!response.ok) {
        console.error(`[ELEVENLABS] Error fetching voices: ${response.status}`);
        return [];
      }

      const data: any = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error("[ELEVENLABS] Error fetching voices:", error);
      return [];
    }
  }

  async generateVoicePreview(
    voiceId: string,
    text: string = "Hello, this is a preview of this voice.",
  ): Promise<Buffer | null> {
    if (!ELEVENLABS_API_KEY) {
      console.log("[ELEVENLABS] No API key configured for voice preview");
      return null;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.7,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!response.ok) {
        console.error(
          "[ELEVENLABS] Voice preview failed:",
          response.statusText,
        );
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("[ELEVENLABS] Error generating voice preview:", error);
      return null;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
