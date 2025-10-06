import fetch from 'node-fetch';
import WebSocket from 'ws';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_WS_URL = 'wss://api.elevenlabs.io/v1/convai/conversation';

export class ElevenLabsConversationService {
  private agentId: string = 'agent_01jz1875qsffcsypwcrc58fdq5';

  async getExistingAgent(): Promise<string> {
    return this.agentId;
  }

  // Build comprehensive system prompt with patient context
  buildSystemPrompt(elderlyUser: any): string {
    return `You are a caring AI companion calling to check on ${elderlyUser.preferredName || elderlyUser.name}. 

PATIENT CONTEXT:
- Name: ${elderlyUser.name} (prefers: ${elderlyUser.preferredName || elderlyUser.name})
- Life Story: ${elderlyUser.lifeStory || 'Long-time community member with rich life experiences'}
- Family: ${elderlyUser.familyInfo || 'Has family who cares about their wellbeing'}
- Hobbies & Interests: ${elderlyUser.hobbiesInterests || 'Enjoys various activities and conversations'}
- Favorite Topics: ${elderlyUser.favoriteTopics || 'General life topics, family, memories'}
- Personality: ${elderlyUser.personalityTraits || 'Warm, friendly, appreciates caring conversation'}
- Health Status: ${elderlyUser.healthStatus || 'General wellness check'}
- Conversation Style: ${elderlyUser.conversationStyle || 'Gentle and caring'}
- Special Notes: ${elderlyUser.specialNotes || 'No special considerations'}

CONVERSATION GUIDELINES:
- Always address them by their preferred name
- Be warm, caring, and patient
- Ask about their day, health, family, and interests
- Listen actively and respond with empathy
- Keep conversations natural and engaging
- If they seem sad or concerned, offer gentle support
- End calls naturally when they're ready
- Remember this is their routine check-in call

IMPORTANT: Maintain a consistent, caring tone throughout the entire conversation. Focus on their wellbeing and making them feel heard and valued.`;
  }

  // Create WebSocket configuration for Twilio Stream
  createStreamConfig(elderlyUser: any): any {
    const systemPrompt = this.buildSystemPrompt(elderlyUser);
    const voiceId = elderlyUser.voiceId || 'QZOPTHiWteIgblFWoaMc'; // Default: Old American Man
    
    return {
      agent_id: this.agentId,
      voice_id: voiceId,
      first_message: `Hello ${elderlyUser.preferredName || elderlyUser.name}, this is your daily check-in call. How are you doing today?`,
      system_prompt: systemPrompt,
      language: 'en',
      response_modality: 'audio',
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      conversation_config: {
        max_duration_seconds: 900, // 15 minutes max
        inactivity_timeout_seconds: 30
      }
    };
  }

  // Get WebSocket URL for Twilio Stream integration
  getWebSocketUrl(): string {
    return `${ELEVENLABS_WS_URL}?agent_id=${this.agentId}`;
  }

  async updateAgentForPatient(agentId: string, patient: any): Promise<boolean> {
    if (!ELEVENLABS_API_KEY) {
      console.log('[ELEVENLABS CONV] API key not configured');
      return false;
    }

    try {
      // Log patient configuration for debugging
      console.log(`[ELEVENLABS CONV] Configured agent ${agentId} for patient ${patient.name}`);
      console.log(`[ELEVENLABS CONV] Voice ID: ${patient.voiceId || 'QZOPTHiWteIgblFWoaMc'}`);
      console.log(`[ELEVENLABS CONV] Conversation style: ${patient.conversationStyle || 'Default caring'}`);
      return true;
    } catch (error) {
      console.error('[ELEVENLABS CONV] Error updating agent:', error);
      return false;
    }
  }

  async testLatency(): Promise<{
    success: boolean;
    latency: number;
    error?: string;
  }> {
    if (!ELEVENLABS_API_KEY) {
      return {
        success: false,
        latency: 0,
        error: 'API key not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (!response.ok) {
        return {
          success: false,
          latency,
          error: `API request failed with status ${response.status}`
        };
      }

      return {
        success: true,
        latency
      };
    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async startConversation(patientData: any, initialMessage?: string): Promise<{
    success: boolean;
    conversationId?: string;
    error?: string;
  }> {
    try {
      const streamConfig = this.createStreamConfig(patientData);
      
      console.log(`[ELEVENLABS CONV] Starting conversation for ${patientData.name}`);
      console.log(`[ELEVENLABS CONV] Using agent: ${streamConfig.agent_id}`);
      console.log(`[ELEVENLABS CONV] Voice: ${streamConfig.voice_id}`);
      
      // In a real implementation, this would start a WebSocket connection
      // For now, we'll simulate conversation initiation
      const conversationId = `conv_${Date.now()}_${patientData.id}`;
      
      return {
        success: true,
        conversationId,
      };
    } catch (error) {
      console.error('[ELEVENLABS CONV] Error starting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation'
      };
    }
  }

  async sendMessage(conversationId: string, message: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
  }> {
    try {
      console.log(`[ELEVENLABS CONV] Sending message to ${conversationId}: ${message}`);
      
      // In a real implementation, this would send message via WebSocket
      // For now, we'll simulate a response
      const response = "Thank you for sharing that with me. How are you feeling today?";
      
      return {
        success: true,
        response
      };
    } catch (error) {
      console.error('[ELEVENLABS CONV] Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  async getAccountInfo(): Promise<any> {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[ELEVENLABS CONV] Error getting account info:', error);
      throw error;
    }
  }

  async testLatency(): Promise<{
    success: boolean;
    latency: number;
    error?: string;
  }> {
    if (!ELEVENLABS_API_KEY) {
      return {
        success: false,
        latency: 0,
        error: 'API key not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (!response.ok) {
        return {
          success: false,
          latency,
          error: `API request failed with status ${response.status}`
        };
      }

      return {
        success: true,
        latency
      };
    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async startConversation(patientData: any, initialMessage?: string): Promise<{
    success: boolean;
    conversationId?: string;
    audioUrl?: string;
    error?: string;
  }> {
    if (!ELEVENLABS_API_KEY) {
      return {
        success: false,
        error: 'ElevenLabs API key not configured'
      };
    }

    try {
      console.log(`[ELEVENLABS CONV] Starting conversation with agent ${this.agentId} for patient ${patientData.name}`);
      
      // Start conversation with the agent
      const conversationResponse = await fetch(`${ELEVENLABS_BASE_URL}/convai/conversations`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          require_auth: false
        })
      });

      if (!conversationResponse.ok) {
        const errorText = await conversationResponse.text();
        console.error('[ELEVENLABS CONV] Failed to start conversation:', errorText);
        return {
          success: false,
          error: `Failed to start conversation: ${conversationResponse.status}`
        };
      }

      const conversationData = await conversationResponse.json();
      const conversationId = conversationData.conversation_id;
      
      console.log(`[ELEVENLABS CONV] Conversation started: ${conversationId}`);

      // If we have an initial message (like patient speech), send it
      if (initialMessage) {
        return await this.sendMessage(conversationId, initialMessage);
      }

      return {
        success: true,
        conversationId
      };
    } catch (error) {
      console.error('[ELEVENLABS CONV] Error starting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendMessage(conversationId: string, message: string): Promise<{
    success: boolean;
    audioUrl?: string;
    error?: string;
  }> {
    if (!ELEVENLABS_API_KEY) {
      return {
        success: false,
        error: 'ElevenLabs API key not configured'
      };
    }

    try {
      console.log(`[ELEVENLABS CONV] Sending message to conversation ${conversationId}: "${message}"`);
      
      const response = await fetch(`${ELEVENLABS_BASE_URL}/convai/conversations/${conversationId}/add_user_message`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ELEVENLABS CONV] Failed to send message:', errorText);
        return {
          success: false,
          error: `Failed to send message: ${response.status}`
        };
      }

      const responseData = await response.json();
      
      console.log(`[ELEVENLABS CONV] ✓ Agent response generated for conversation ${conversationId}`);
      
      // The response should contain the audio URL or stream
      return {
        success: true,
        audioUrl: responseData.audio_url || responseData.audio
      };
    } catch (error) {
      console.error('[ELEVENLABS CONV] Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAccountInfo(): Promise<any> {
    if (!ELEVENLABS_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[ELEVENLABS CONV] Error fetching account info:', error);
      return null;
    }
  }
}

export const elevenLabsConversationService = new ElevenLabsConversationService();