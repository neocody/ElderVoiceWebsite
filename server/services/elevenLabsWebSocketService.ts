import WebSocket from 'ws';

export class ElevenLabsWebSocketService {
  private ws: WebSocket | null = null;

  async connect(config: {
    agentId: string;
    authorization: string;
    customParameters?: any;
  }): Promise<WebSocket> {
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation`;
    
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${config.authorization}`,
        'XI-Agent-Id': config.agentId
      }
    });

    return new Promise((resolve, reject) => {
      this.ws!.on('open', () => {
        console.log('[ELEVENLABS WS] Connected to Conversational AI');
        
        // Send initial configuration
        this.ws!.send(JSON.stringify({
          type: 'conversation_initiation',
          conversation_config: {
            agent_id: config.agentId,
            ...config.customParameters
          }
        }));
        
        resolve(this.ws!);
      });

      this.ws!.on('error', (error) => {
        console.error('[ELEVENLABS WS] Connection error:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}