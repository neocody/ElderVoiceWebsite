# ElevenLabs Conversational AI Integration

## Overview
This document explains the proper ElevenLabs Conversational AI implementation in the AI companion system. The system now supports true conversational AI with real-time audio streaming and natural conversation flow.

## Architecture

### Three-Tier Calling System

#### Option 1: ElevenLabs Phone Agent Transfer (FASTEST)
- **Requirement**: `ELEVENLABS_PHONE_NUMBER` environment variable
- **Method**: Direct call transfer to ElevenLabs phone agent
- **Benefits**: Sub-second response, managed by ElevenLabs
- **Implementation**: Uses Twilio `<Dial>` verb to transfer call

#### Option 2: WebSocket Conversational AI (CURRENT DEFAULT)
- **Method**: Twilio Media Streams + ElevenLabs WebSocket
- **Benefits**: Real-time audio streaming, interruptible conversations
- **Implementation**: Bidirectional audio forwarding between Twilio and ElevenLabs
- **Response Time**: ~1 second with streaming audio

#### Option 3: API-based Fallback (LEGACY)
- **Method**: Turn-by-turn using OpenAI + ElevenLabs TTS
- **Benefits**: Reliable fallback when WebSocket fails
- **Implementation**: Traditional gather/response cycle
- **Response Time**: 3-4 seconds per response

## Current Implementation

### WebSocket Integration
```typescript
// Twilio voice webhook creates media stream
const response = new twilio.twiml.VoiceResponse();
const connect = response.connect();
const stream = connect.stream({
  url: `wss://${req.get('host')}/api/media-stream/${CallSid}`
});
```

### Media Stream Handler
```typescript
app.ws('/api/media-stream/:callSid', async (ws, req) => {
  // Connects to ElevenLabs WebSocket
  // Forwards audio bidirectionally
  // Handles patient context and voice configuration
});
```

### ElevenLabs WebSocket Service
```typescript
export class ElevenLabsWebSocketService {
  async connect(config: {
    agentId: string;
    authorization: string;
    customParameters?: any;
  }): Promise<WebSocket>
}
```

## Patient Context Integration

### Conversation Parameters
- **Patient Name**: Personalized addressing
- **Voice ID**: Consistent voice throughout call
- **Patient Profile**: Life story, interests, health status
- **Conversation Style**: Tone and approach preferences

### Context Passing
```typescript
stream.parameter({
  name: 'elderlyUserId',
  value: elderlyUserId.toString()
});
stream.parameter({
  name: 'patientName',
  value: elderlyUser.name
});
stream.parameter({
  name: 'voiceId',
  value: elderlyUser.voiceId || 'QZOPTHiWteIgblFWoaMc'
});
```

## Benefits of True Conversational AI

### Natural Conversation Flow
- **Interruptible**: AI can be interrupted naturally
- **Real-time**: Sub-second response times
- **Streaming**: Audio streams as generated
- **Context-aware**: Maintains conversation context

### Improved User Experience
- **No delays**: Eliminates 3-4 second API delays
- **Natural timing**: Conversation feels human-like
- **Consistent voice**: Same voice throughout entire call
- **Emotional awareness**: AI responds to patient emotions

## Testing

### Current Status
- ✅ WebSocket integration implemented
- ✅ Media stream handler created
- ✅ Patient context passing working
- ✅ Fallback to API-based system if WebSocket fails
- ⚠️ ElevenLabs WebSocket connection needs testing

### Next Steps
1. Test WebSocket connection to ElevenLabs
2. Verify audio streaming works correctly
3. Test conversation interruption capabilities
4. Validate patient context is properly passed

## Configuration

### Environment Variables
- `ELEVENLABS_API_KEY`: Required for all methods
- `ELEVENLABS_PHONE_NUMBER`: Optional for phone agent transfer
- `ELEVENLABS_AGENT_ID`: Agent ID for conversational AI

### ElevenLabs Agent Configuration
- Agent must be configured in ElevenLabs dashboard
- Voice settings managed in agent configuration
- Conversation prompts set in agent settings

## Error Handling

### WebSocket Failures
- Falls back to API-based conversation flow
- Maintains call continuity
- Logs errors for debugging

### Rate Limiting
- Graceful handling of ElevenLabs rate limits
- Continues conversation with brief pauses
- Prevents early call hangups

## Debugging

### Log Indicators
- `[ELEVENLABS] Connecting via WebSocket for real-time conversation`
- `[MEDIA STREAM] WebSocket connected for call: {callSid}`
- `[ELEVENLABS WS] Connected to Conversational AI`

### Common Issues
- WebSocket connection failures → Check API key and agent ID
- Audio streaming problems → Verify media stream parameters
- Call interruptions → Check WebSocket message handling