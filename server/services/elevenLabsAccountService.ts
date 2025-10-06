/**
 * ElevenLabs Account Service
 * Checks account capabilities and available features
 */

export class ElevenLabsAccountService {
  private apiKey: string | null;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || null;
  }

  /**
   * Check what features are available on this account
   */
  async checkAccountCapabilities(): Promise<{
    hasConversationalAI: boolean;
    availableVoices: any[];
    accountTier: string;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        return {
          hasConversationalAI: false,
          availableVoices: [],
          accountTier: 'unknown',
          error: 'No API key configured'
        };
      }

      // Check user info
      const userResponse = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      let accountTier = 'unknown';
      if (userResponse.ok) {
        const userData = await userResponse.json();
        accountTier = userData.subscription?.tier || 'starter';
      }

      // Check available voices
      const voicesResponse = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      let availableVoices: any[] = [];
      if (voicesResponse.ok) {
        const voicesData = await voicesResponse.json();
        availableVoices = voicesData.voices || [];
      }

      // Test Conversational AI availability by checking specific agent access
      // Since user can test agent directly in ElevenLabs, we know they have access
      const specificAgentResponse = await fetch(`${this.baseUrl}/convai/agents/agent_01jz1b17gbfcf9wrrp9ztnvmbp`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      const hasConversationalAI = specificAgentResponse.ok;
      let agentError = null;

      if (!hasConversationalAI) {
        const errorText = await specificAgentResponse.text();
        agentError = `Agent access failed - Status ${specificAgentResponse.status}: ${errorText}`;
      }

      console.log('[ELEVENLABS ACCOUNT] Capabilities check:', {
        accountTier,
        hasConversationalAI,
        voiceCount: availableVoices.length,
        agentsStatus: agentsResponse.status
      });

      return {
        hasConversationalAI,
        availableVoices,
        accountTier,
        error: hasConversationalAI ? undefined : `Conversational AI not available (Status: ${agentsResponse.status})`
      };

    } catch (error) {
      console.error('[ELEVENLABS ACCOUNT] Error checking capabilities:', error);
      return {
        hasConversationalAI: false,
        availableVoices: [],
        accountTier: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify a specific agent exists and is accessible
   */
  async verifyAgent(agentId: string): Promise<{
    exists: boolean;
    accessible: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        return {
          exists: false,
          accessible: false,
          error: 'No API key configured'
        };
      }

      const response = await fetch(`${this.baseUrl}/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (response.ok) {
        const agentData = await response.json();
        return {
          exists: true,
          accessible: true,
          details: agentData
        };
      } else {
        const errorText = await response.text();
        return {
          exists: response.status !== 404,
          accessible: false,
          error: `Status ${response.status}: ${errorText}`
        };
      }

    } catch (error) {
      console.error('[ELEVENLABS ACCOUNT] Error verifying agent:', error);
      return {
        exists: false,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const elevenLabsAccountService = new ElevenLabsAccountService();