import fetch from "node-fetch";

export class LatencyOptimizationService {
  // Pre-generate common responses to reduce real-time processing
  private responseCache = new Map<string, Buffer>();

  async preGenerateCommonResponses(voiceId: string): Promise<void> {
    const commonResponses = [
      "I'm so glad to hear from you! How are you feeling today?",
      "That sounds wonderful. Can you tell me more about that?",
      "I understand. How has that been affecting you?",
      "That's really interesting. What else has been on your mind?",
      "Thank you for sharing that with me. How are you doing overall?",
      "I see. Is there anything else you'd like to talk about?",
      "That makes sense. How have you been sleeping lately?",
      "I'm here to listen. What would you like to discuss?",
    ];

    const { elevenLabsService } = await import("./elevenLabsService.js");

    console.log(
      `[LATENCY OPT] Pre-generating ${commonResponses.length} common responses for voice ${voiceId}`,
    );

    for (const response of commonResponses) {
      try {
        const audio = await elevenLabsService.generateSpeech(response, voiceId);
        if (audio) {
          this.responseCache.set(response, audio);
          console.log(
            `[LATENCY OPT] Cached response: "${response.substring(0, 30)}..." (${audio.length} bytes)`,
          );
        }
      } catch (error) {
        console.error(
          `[LATENCY OPT] Failed to cache response: ${response.substring(0, 30)}`,
          error,
        );
      }
    }
  }

  getCachedResponse(text: string): Buffer | null {
    return this.responseCache.get(text) || null;
  }

  // Streaming audio generation for faster perceived response
  async generateStreamingResponse(
    text: string,
    voiceId: string,
  ): Promise<{ audioUrl: string; size: number }> {
    const { elevenLabsService } = await import("./elevenLabsService.js");

    // Start generation immediately
    const startTime = Date.now();
    const audioBuffer = await elevenLabsService.generateSpeech(text, voiceId);
    const endTime = Date.now();

    if (!audioBuffer) {
      throw new Error("Failed to generate audio");
    }

    // Save to file for immediate serving
    const fs = await import("fs");
    const path = await import("path");
    const audioDir = path.default.join(process.cwd(), "uploads", "audio");

    if (!fs.default.existsSync(audioDir)) {
      fs.default.mkdirSync(audioDir, { recursive: true });
    }

    const filename = `optimized_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const filePath = path.default.join(audioDir, filename);

    fs.default.writeFileSync(filePath, audioBuffer);

    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL_PROD
        : process.env.FRONTEND_URL_DEV;

    const audioUrl = `${baseUrl}/uploads/audio/${filename}`;

    console.log(
      `[LATENCY OPT] Generated in ${endTime - startTime}ms: ${audioBuffer.length} bytes`,
    );

    return {
      audioUrl: audioUrl,
      size: audioBuffer.length,
    };
  }

  // Parallel processing for multiple operations
  async parallelProcessing(
    operations: Array<() => Promise<any>>,
  ): Promise<any[]> {
    const startTime = Date.now();
    const results = await Promise.all(
      operations.map((op) => op().catch((error) => ({ error }))),
    );
    const endTime = Date.now();

    console.log(
      `[LATENCY OPT] Parallel processing completed in ${endTime - startTime}ms`,
    );
    return results;
  }

  // MCP Server preparation utilities
  prepareMCPIntegration() {
    return {
      recommendation: `Based on current latency issues (3-4 second delays), an MCP server could provide significant benefits:

1. **Direct Model-to-ElevenLabs Communication**
   - Eliminates server round-trips
   - Reduces latency to near real-time
   - Maintains voice consistency

2. **Implementation Approach**
   - Set up MCP server with ElevenLabs tools
   - Create patient-specific conversation contexts
   - Integrate with existing Twilio phone connectivity

3. **Expected Benefits**
   - Latency reduction from 3-4 seconds to <1 second
   - More natural conversation flow
   - Reduced server load
   - Better scalability

4. **Current Architecture Preservation**
   - Keep existing Twilio code as fallback
   - Gradual migration approach
   - A/B testing capabilities`,

      nextSteps: [
        "Set up MCP server in ElevenLabs account",
        "Create patient-specific conversation tools",
        "Implement WebSocket bridge for phone integration",
        "Test latency improvements",
        "Deploy parallel to existing system",
      ],

      mcpServerConfig: {
        name: "eldercare-companion-mcp",
        description:
          "AI companion for elderly care with patient-specific voice conversations",
        tools: [
          "patient_conversation",
          "voice_generation",
          "memory_tracking",
          "call_logging",
        ],
        integrations: [
          "elevenlabs_voice",
          "patient_profiles",
          "conversation_history",
        ],
      },
    };
  }
}

export const latencyOptimizationService = new LatencyOptimizationService();
