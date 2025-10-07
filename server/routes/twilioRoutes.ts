import { Express } from "express";
import { storage } from "../storage";
import { TwilioService } from "../services/twilioService";
import * as fs from "fs";
import * as path from "path";
import { openaiService } from "../services/openaiService";

const twilioService = new TwilioService();

interface CoversationEntry {
  timestamp: Date;
  speaker: "user" | "agent";
  text: string;
}

const activeConversations: Record<string, CoversationEntry[]> = {};

const generateTranscript = (callSid: string) => {
  const conversation = activeConversations[callSid] || [];
  return conversation
    .map((entry) => {
      const time = entry.timestamp.toLocaleTimeString();
      const speaker = entry.speaker.toLowerCase();
      return `[${time}] [${speaker}]: ${entry.text}`;
    })
    .join("\n");
};

export function registerTwilioRoutes(app: Express) {
  console.log("[TWILIO ROUTES] Registering WebSocket endpoints...");

  // Test WebSocket endpoint - simplified version
  (app as any).ws("/test-ws", (ws: any, req: any) => {
    console.log("[TEST WEBSOCKET] Connection established from:", req.ip);
    ws.send("Hello from WebSocket");

    ws.on("message", (message: any) => {
      console.log("[TEST WEBSOCKET] Received:", message.toString());
      ws.send(`Echo: ${message}`);
    });

    ws.on("close", () => {
      console.log("[TEST WEBSOCKET] Connection closed");
    });
  });

  // Debug endpoint to test Media Stream path pattern
  (app as any).ws("/api/media-stream-test", (ws: any, req: any) => {
    console.log("[MEDIA STREAM TEST] Connection established");
    console.log("[MEDIA STREAM TEST] Query params:", req.query);
    ws.send("Media Stream Test Connected");
    ws.on("close", () => {
      console.log("[MEDIA STREAM TEST] Connection closed");
    });
  });

  // Production WebSocket endpoint for Twilio Media Streams → ElevenLabs Conversational AI
  (app as any).ws("*", async (ws: any, req: any) => {
    // Only handle Twilio Media Stream paths
    if (!req.path.includes("/api/media-stream/")) {
      console.log(`[WEBSOCKET] Non-media-stream connection: ${req.path}`);
      ws.close();
      return;
    }

    // Extract CallSid from path: /api/media-stream/CA123.../.websocket
    const pathParts = req.path.split("/");
    const callSidIndex =
      pathParts.findIndex((part: string) => part === "api") + 2; // api -> media-stream -> CallSid
    const callSid = pathParts[callSidIndex];

    if (!callSid || !callSid.startsWith("CA")) {
      console.log(`[MEDIA STREAM] Invalid CallSid from path: ${req.path}`);
      ws.close();
      return;
    }

    console.log(`[MEDIA STREAM] *** TWILIO CONNECTED ***`);
    console.log(`[MEDIA STREAM] CallSid: ${callSid}`);
    console.log(`[MEDIA STREAM] User-Agent: ${req.headers["user-agent"]}`);
    console.log(`[MEDIA STREAM] Path: ${req.path}`);

    let elevenLabsWs: any = null;
    let streamSid: string | null = null;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    // Initialize conversation tracking for this call
    activeConversations[callSid] = [];

    // Helper function to add conversation entry
    const addConversationEntry = (speaker: "user" | "agent", text: string) => {
      const conversation = activeConversations[callSid] || [];
      conversation.push({
        timestamp: new Date(),
        speaker,
        text: text.trim(),
      });
      activeConversations[callSid] = conversation;
      console.log(`[CONVERSATION] ${speaker.toUpperCase()}: ${text.trim()}`);
    };

    ws.on("message", async (message: any) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.event === "start") {
          console.log(`[TWILIO] Media stream started for call ${callSid}`);
          console.log(`[TWILIO] Stream parameters:`, data.start);
          console.log(`[TWILIO] StreamSid:`, data.start.streamSid);

          // Save streamSid for later use
          streamSid = data.start.streamSid;

          if (!agentId) {
            console.error(`[ELEVENLABS] No agent ID configured`);
            return;
          }

          // Initialize ElevenLabs WebSocket
          try {
            const WebSocket = (await import("ws")).default;
            const apiKey = process.env.ELEVENLABS_API_KEY;

            if (!apiKey) {
              console.error(`[ELEVENLABS] No API key configured`);
              return;
            }

            // Get patient info from custom parameters
            const customParams = data.start.customParameters || {};
            const preferredName =
              customParams.preferred_name || customParams.name || "Friend";

            type PatientContextType = {
              age?: string;
              gender?: string;
              healthConcerns?: string;
              medications?: string;
              allergies?: string;
              mobilityLevel?: string;
              cognitiveStatus?: string;
              topicsOfInterest?: string;
              conversationStyle?: string;
              familyInfo?: string;
              specialNotes?: string;
            };

            let patientContext: PatientContextType = {};
            if (customParams.patient_context) {
              try {
                patientContext = JSON.parse(customParams.patient_context);
                console.log(`[ELEVENLABS] Patient context:`, patientContext);
              } catch (e) {
                console.error(
                  `[ELEVENLABS] Failed to parse patient context:`,
                  e,
                );
              }
            }

            // Get signed URL for authenticated conversation (CORRECT METHOD)
            console.log(
              `[ELEVENLABS] Getting signed URL for agent: ${agentId}`,
            );
            const signedUrlResponse = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
              {
                method: "GET",
                headers: {
                  "xi-api-key": apiKey,
                },
              },
            );

            if (!signedUrlResponse.ok) {
              throw new Error(
                `Failed to get signed URL: ${signedUrlResponse.statusText}`,
              );
            }

            const signedUrlData = await signedUrlResponse.json();
            const signedUrl = signedUrlData.signed_url;

            console.log(`[ELEVENLABS] Got signed URL:`, signedUrl);

            // Connect using signed URL (no headers needed)
            elevenLabsWs = new WebSocket(signedUrl);

            elevenLabsWs.on("open", async () => {
              console.log(
                `[ELEVENLABS] WebSocket connected for call ${callSid}`,
              );

              // Send initialization with nickname variable (matches agent config)
              const initMessage = {
                type: "conversation_initiation_client_data",
                dynamic_variables: {
                  nickname: preferredName,
                  // age: patientContext.age,
                  // gender:patientContext.gender,
                  // health_concerns: patientContext.healthConcerns,
                  // medications: patientContext.medications,
                  // allergies: patientContext.allergies,
                  // mobility_level:patientContext.mobilityLevel,
                  // cognitive_status:patientContext.cognitiveStatus,
                  // topics_of_interest:patientContext.topicsOfInterest,
                  // coversational_style:patientContext.conversationStyle,
                  // family_info:patientContext.familyInfo,
                  // special_notes:patientContext.specialNotes,
                },
              };

              console.log(
                `[ELEVENLABS] Sending initialization message:`,
                JSON.stringify(initMessage),
              );
              elevenLabsWs.send(JSON.stringify(initMessage));

              // Don't send client_ready - ElevenLabs doesn't expect it
              // The conversation starts automatically after sending initialization
            });

            elevenLabsWs.on("message", (elevenLabsMessage: any) => {
              try {
                const elevenData = JSON.parse(elevenLabsMessage.toString());
                console.log(
                  `[ELEVENLABS] Received message type: ${elevenData.type}`,
                );

                if (elevenData.type === "conversation_initiation_metadata") {
                  console.log(
                    `[ELEVENLABS] Conversation initialized:`,
                    elevenData,
                  );
                  console.log(
                    `[ELEVENLABS] Agent output format: ${elevenData.conversation_initiation_metadata_event?.agent_output_audio_format}`,
                  );
                  console.log(
                    `[ELEVENLABS] User input format: ${elevenData.conversation_initiation_metadata_event?.user_input_audio_format}`,
                  );
                  console.log(
                    `[ELEVENLABS] Conversation ID: ${elevenData.conversation_initiation_metadata_event?.conversation_id}`,
                  );

                  // Set flag that we're ready to send audio
                  ws["conversationReady"] = true;
                  console.log(
                    `[ELEVENLABS] ✅ Conversation ready to receive audio`,
                  );
                } else if (elevenData.type === "audio") {
                  // Handle audio from ElevenLabs - check both possible formats
                  let audioData = null;

                  if (elevenData.audio?.chunk) {
                    audioData = elevenData.audio.chunk;
                  } else if (elevenData.audio_event?.audio_base_64) {
                    audioData = elevenData.audio_event.audio_base_64;
                  }

                  if (audioData && streamSid) {
                    try {
                      // Forward audio directly to Twilio
                      const twilioMessage = {
                        event: "media",
                        streamSid: streamSid,
                        media: {
                          payload: audioData,
                        },
                      };
                      ws.send(JSON.stringify(twilioMessage));

                      // Track if this is the greeting
                      if (!ws["greetingPlayed"]) {
                        ws["greetingPlayed"] = true;
                        console.log(
                          `[ELEVENLABS] 🎤 Greeting audio sent to caller (${
                            Buffer.from(audioData, "base64").length
                          } bytes)`,
                        );
                      } else {
                        console.log(
                          `[ELEVENLABS] 🗣️ Agent response audio (${
                            Buffer.from(audioData, "base64").length
                          } bytes)`,
                        );
                      }
                    } catch (error) {
                      console.error(
                        `[ELEVENLABS] Audio forwarding error:`,
                        error,
                      );
                    }
                  }
                } else if (elevenData.type === "user_transcript") {
                  ws["transcriptReceived"] = true;

                  addConversationEntry(
                    "user",
                    elevenData.user_transcription_event?.user_transcript,
                  );
                  console.log(
                    `[ELEVENLABS] 🎤 User said:`,
                    elevenData.user_transcription_event?.user_transcript,
                  );
                } else if (elevenData.type === "agent_response") {
                  addConversationEntry(
                    "agent",
                    elevenData.agent_response_event?.agent_response,
                  );
                  console.log(
                    `[ELEVENLABS] 🤖 Agent responding:`,
                    elevenData.agent_response_event?.agent_response,
                  );
                } else if (elevenData.type === "interruption") {
                  console.log(
                    `[ELEVENLABS] ⚡ Interruption detected:`,
                    elevenData,
                  );
                } else if (elevenData.type === "error") {
                  console.error(
                    `[ELEVENLABS] ❌ Error received:`,
                    JSON.stringify(elevenData),
                  );
                } else if (elevenData.type === "silence") {
                  console.log(`[ELEVENLABS] 🔇 Silence detected`);
                } else if (elevenData.type === "ping") {
                  // CORRECTED: Respond to pings with pong (required by ElevenLabs)
                  if (elevenData.ping_event?.event_id) {
                    const pongMessage = {
                      type: "pong",
                      event_id: elevenData.ping_event.event_id,
                    };
                    elevenLabsWs.send(JSON.stringify(pongMessage));
                    console.log(
                      `[ELEVENLABS] 🏓 Responded to ping with pong: ${elevenData.ping_event.event_id}`,
                    );
                  }
                } else if (elevenData.type === "voice_activity_start") {
                  console.log(`[ELEVENLABS] 🎙️ Voice activity started`);
                } else if (elevenData.type === "voice_activity_end") {
                  console.log(`[ELEVENLABS] 🎙️ Voice activity ended`);
                } else if (elevenData.type === "conversation_error") {
                  console.error(
                    `[ELEVENLABS] 🚨 Conversation error:`,
                    JSON.stringify(elevenData),
                  );
                } else if (elevenData.type === "debug") {
                  console.log(
                    `[ELEVENLABS] 🔍 Debug info:`,
                    JSON.stringify(elevenData),
                  );
                } else {
                  console.log(
                    `[ELEVENLABS] ❓ Unknown message type: ${elevenData.type}`,
                    JSON.stringify(elevenData).substring(0, 200),
                  );
                }
              } catch (error) {
                console.error(`[ELEVENLABS] Message parsing error:`, error);
              }
            });

            elevenLabsWs.on("error", (error: any) => {
              console.error(
                `[ELEVENLABS] WebSocket error:`,
                error.message || error,
              );
            });

            elevenLabsWs.on("close", (code: number, reason: any) => {
              console.log(
                `[ELEVENLABS] WebSocket closed for call ${callSid}, code: ${code}, reason: ${reason}`,
              );
            });
          } catch (error) {
            console.error(`[ELEVENLABS] Failed to connect:`, error);
          }
        }

        if (
          data.event === "media" &&
          elevenLabsWs &&
          elevenLabsWs.readyState === 1
        ) {
          // Only send audio after conversation is ready
          if (!ws["conversationReady"]) {
            if (!ws["bufferedAudio"]) ws["bufferedAudio"] = [];
            ws["bufferedAudio"].push(data.media.payload);
            console.log(
              `[TWILIO->ELEVENLABS] Buffering audio until conversation ready (${ws["bufferedAudio"].length} chunks)`,
            );
            return;
          }

          // Send any buffered audio first
          if (ws["bufferedAudio"] && ws["bufferedAudio"].length > 0) {
            console.log(
              `[TWILIO->ELEVENLABS] Sending ${ws["bufferedAudio"].length} buffered audio chunks`,
            );
            for (const bufferedPayload of ws["bufferedAudio"]) {
              // CORRECTED: Use proper format for buffered audio too
              const bufferedMessage = {
                user_audio_chunk: Buffer.from(
                  bufferedPayload,
                  "base64",
                ).toString("base64"),
              };
              elevenLabsWs.send(JSON.stringify(bufferedMessage));
            }
            ws["bufferedAudio"] = [];
          }

          // Send mulaw audio directly - ElevenLabs now accepts mulaw 8000Hz
          try {
            // Track audio chunks
            const audioBuffer = Buffer.from(data.media.payload, "base64");

            // Log first few chunks in detail
            if (!ws["audioChunkCount"]) ws["audioChunkCount"] = 0;
            ws["audioChunkCount"]++;

            // CORRECTED: Use proper ElevenLabs audio format
            const elevenMessage = {
              user_audio_chunk: Buffer.from(
                data.media.payload,
                "base64",
              ).toString("base64"),
            };

            // Log the exact message being sent on first few chunks
            if (ws["audioChunkCount"] <= 5) {
              console.log(
                `[TWILIO->ELEVENLABS] Sending CORRECTED audio format:`,
                {
                  user_audio_chunk_length:
                    elevenMessage.user_audio_chunk.length,
                  preview:
                    elevenMessage.user_audio_chunk.substring(0, 50) + "...",
                },
              );
            }

            // Also try sending audio in binary format every 10th chunk to test
            if (ws["audioChunkCount"] % 100 === 0) {
              console.log(
                `[ELEVENLABS] Testing binary audio send at chunk ${ws["audioChunkCount"]}`,
              );
              const binaryMessage = {
                type: "user_audio_chunk",
                audio_chunk: audioBuffer.toString("base64"),
              };
              elevenLabsWs.send(JSON.stringify(binaryMessage));
            }

            elevenLabsWs.send(JSON.stringify(elevenMessage));

            // Add more detailed logging for first 10 chunks and every 50th chunk after
            if (
              ws["audioChunkCount"] <= 10 ||
              ws["audioChunkCount"] % 50 === 0
            ) {
              console.log(
                `[TWILIO->ELEVENLABS] Audio chunk #${ws["audioChunkCount"]}: ${audioBuffer.length} bytes`,
              );

              // Check if audio contains actual voice data (non-silence)
              const hasVoiceData = audioBuffer.some(
                (byte) => Math.abs(byte - 127) > 10,
              );
              if (ws["audioChunkCount"] <= 10) {
                console.log(
                  `[TWILIO->ELEVENLABS] Chunk #${
                    ws["audioChunkCount"]
                  } voice detection: ${
                    hasVoiceData ? "VOICE DETECTED" : "SILENCE"
                  }`,
                );
              }

              // Log when we detect strong voice signal
              if (
                hasVoiceData &&
                ws["audioChunkCount"] > 100 &&
                ws["audioChunkCount"] % 10 === 0
              ) {
                const maxAmplitude = Math.max(
                  ...Array.from(audioBuffer).map((b) => Math.abs(b - 127)),
                );
                console.log(
                  `[TWILIO->ELEVENLABS] 🎯 Strong voice signal detected - max amplitude: ${maxAmplitude}`,
                );

                // Check if we're getting any transcript responses
                if (ws["audioChunkCount"] > 200 && !ws["transcriptReceived"]) {
                  console.log(
                    `[ELEVENLABS] ⚠️ ${ws["audioChunkCount"]} chunks sent but no transcripts received yet`,
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `[TWILIO->ELEVENLABS] Audio forwarding error:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error(`[MEDIA STREAM] Message processing error:`, error);
      }
    });

    ws.on("close", () => {
      console.log(`[MEDIA STREAM] Twilio WebSocket closed for ${callSid}`);
      if (elevenLabsWs) {
        elevenLabsWs.close();
      }
    });

    ws.on("error", (error: any) => {
      console.error(`[MEDIA STREAM] Twilio WebSocket error:`, error);
    });
  });

  // Test WebSocket connectivity endpoint
  app.get("/api/test-websocket-url", (req, res) => {
    const host = req.get("host");
    const testCallSid = "CA1234567890abcdef1234567890abcdef";
    const testUrl = `wss://${host}/api/media-stream/${testCallSid}?agentId=test&elderlyUserId=1&callId=1`;

    console.log(`[WEBSOCKET TEST] Generated test URL: ${testUrl}`);
    console.log(`[WEBSOCKET TEST] Host header: ${host}`);
    console.log(`[WEBSOCKET TEST] Protocol: ${req.protocol}`);
    console.log(`[WEBSOCKET TEST] Original URL: ${req.originalUrl}`);

    res.json({
      success: true,
      testWebSocketUrl: testUrl,
      host: host,
      protocol: req.protocol,
      note: "This URL can be tested with a WebSocket client",
    });
  });

  // Twilio Voice Webhook - CRITICAL: This webhook generates TwiML for voice calls
  app.post("/api/twilio/voice", async (req, res) => {
    try {
      const { CallSid, From, To } = req.body;
      const { elderlyUserId, agentId } = req.query;

      console.log(`[TWILIO VOICE] Incoming call for patient: ${elderlyUserId}`);
      console.log(`[TWILIO VOICE] Agent ID: ${agentId}`);
      console.log(
        `[TWILIO VOICE] CallSid: ${CallSid}, From: ${From}, To: ${To}`,
      );

      if (!elderlyUserId) {
        res
          .status(400)
          .send(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Error: Patient ID not provided</Say><Hangup/></Response>',
          );
        return;
      }

      const patient = await storage.getElderlyUser(
        parseInt(elderlyUserId as string),
      );
      if (!patient) {
        res
          .status(404)
          .send(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Error: Patient not found</Say><Hangup/></Response>',
          );
        return;
      }

      // Create call record
      const callRecord = await storage.createCall({
        elderlyUserId: patient.id,
        status: "in-progress",
        callSid: CallSid,
      });
      const callId = callRecord.id;

      console.log(
        `[ELEVENLABS] Attempting to use conversational AI for: ${patient.name}`,
      );
      console.log(
        `[ELEVENLABS] Connecting via WebSocket for real-time conversation`,
      );
      console.log(`[ELEVENLABS] Using agent ID: ${agentId}`);
      console.log(`[ELEVENLABS] Call record created with ID: ${callId}`);

      // Generate WebSocket URL for Twilio Media Streams
      const host = req.get("host");
      const wsUrl = `wss://${host}/api/media-stream/${CallSid}?agentId=${agentId}&elderlyUserId=${elderlyUserId}&callId=${callId}`;

      console.log(`[ELEVENLABS] Host: ${host}`);
      console.log(`[ELEVENLABS] WebSocket URL being sent to Twilio: ${wsUrl}`);

      // Parse and prepare patient context for TwiML parameters
      const patientContext = {
        age: patient.age,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        healthConcerns: patient.healthConcerns,
        medications: patient.medications,
        allergies: patient.allergies,
        mobilityLevel: patient.mobilityLevel,
        cognitiveStatus: patient.cognitiveStatus,
        topicsOfInterest: patient.topicsOfInterest,
        conversationStyle: patient.conversationStyle,
        familyInfo: patient.familyInfo,
        specialNotes: patient.specialNotes,
      };

      console.log(
        `[ELEVENLABS] URL Components - Base: wss://${host}/api/media-stream/${CallSid}, Params: agentId=${agentId}&elderlyUserId=${elderlyUserId}&callId=${callId}`,
      );

      // Generate TwiML with WebSocket Stream
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Connect>
      <Stream url="${wsUrl.replace(/&/g, "&amp;")}">
        <Parameter name="patient_name" value="${patient.name}"/>
        <Parameter name="preferred_name" value="${
          patient.preferredName || patient.name
        }"/>
        <Parameter name="patient_context" value="${JSON.stringify(
          patientContext,
        ).replace(/"/g, "&quot;")}"/>
      </Stream>
    </Connect>
  </Response>`;

      console.log(`[ELEVENLABS] WebSocket TwiML generated, sending to Twilio:`);
      console.log(`[ELEVENLABS] TwiML Content: ${twimlResponse}`);
      console.log(`[ELEVENLABS] WebSocket URL in TwiML: ${wsUrl}`);

      res.type("application/xml").send(twimlResponse);
    } catch (error) {
      console.error("[TWILIO VOICE] Error processing webhook:", error);
      res
        .status(500)
        .send(
          '<?xml version="1.0" encoding="UTF-8"?><Response><Say>System error occurred</Say><Hangup/></Response>',
        );
    }
  });

  // Twilio Status Webhook - tracks call lifecycle events
  app.post("/api/twilio/status", async (req, res) => {
    try {
      const { CallSid, CallStatus, CallDuration } = req.body;

      console.log(
        `[TWILIO STATUS] Call ${CallSid}: ${CallStatus}${
          CallDuration ? `, Duration: ${CallDuration}s` : ""
        }`,
      );

      // Find call by Twilio CallSid and update status
      const calls = await storage.getCalls();
      const call = calls.find((c) => c.callSid === CallSid);

      if (call) {
        const updateData: any = { status: CallStatus };

        if (CallStatus === "completed" && CallDuration) {
          updateData.duration = parseInt(CallDuration);
        }

        await storage.updateCall(call.id, updateData);
        console.log(
          `[TWILIO STATUS] Updated call ${call.id} with status: ${CallStatus}`,
        );

        // Process completed calls
        if (CallStatus === "completed") {
          console.log(
            `[CALL PROCESSING] Starting automatic processing for completed call ${call.id}`,
          );

          // Generate transcript and summary for completed calls
          const transcript = generateTranscript(CallSid);
          const callAIContent =
            await openaiService.generateCallSummary(transcript);

          console.log("Summary:", callAIContent.summary);
          console.log("Sentiment:", callAIContent.sentiment);

          await storage.updateCall(call.id, {
            summary: callAIContent.summary,
            sentiment: callAIContent.sentiment,
            transcript,
          });

          if (callAIContent.memoryRecord) {
            console.log("Memory Type:", callAIContent.memoryRecord.memoryType);
            console.log("Memory Content:", callAIContent.memoryRecord.content);
            console.log("Tags:", callAIContent.memoryRecord.tags);
            console.log("Context:", callAIContent.memoryRecord.context);
            console.log(
              "Importance Score:",
              callAIContent.memoryRecord.importanceScore,
            );

            await storage.createPatientMemory({
              elderlyUserId: call.elderlyUserId,
              callId: call.id,
              memoryType: callAIContent.memoryRecord.memoryType,
              content: callAIContent.memoryRecord.content,
              tags: callAIContent.memoryRecord.tags,
              context: callAIContent.memoryRecord.context,
              importanceScore: callAIContent.memoryRecord.importanceScore,
            });
          } else {
            console.log(
              "Memory Record is null or undefined - skipping memory creation.",
            );
          }

          console.log(
            `[CALL PROCESSING] Generated summary, transcript and memory for call ${call.id}:`,
            transcript,
          );
          console.log(
            `[CALL PROCESSING] Call processing completed for call ${call.id}`,
          );

          // Clean up conversation data after processing
          delete activeConversations[CallSid];
          console.log(
            `[CLEANUP] Removed conversation data for CallSid: ${CallSid}`,
          );
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("[TWILIO STATUS] Error processing status webhook:", error);
      res.status(500).send("Error");
    }
  });

  // Test call endpoint
  app.post("/api/test-call", async (req, res) => {
    try {
      const { phone, phoneNumber, elderlyUserId } = req.body;
      const actualPhone = phone || phoneNumber;

      console.log(
        `[TEST CALL] Initiating call to ${actualPhone} for patient ${elderlyUserId}`,
      );

      console.log(
        `[TEST CALL] Raw request body:`,
        JSON.stringify(req.body, null, 2),
      );

      console.log(`[TEST CALL] Phone from 'phone' field: ${phone}`);
      console.log(`[TEST CALL] Phone from 'phoneNumber' field: ${phoneNumber}`);

      if (!actualPhone || !elderlyUserId) {
        return res.status(400).json({
          success: false,
          message: "Phone number and patient ID are required",
        });
      }

      console.log(
        `[TEST CALL] METHOD 1: Using ElevenLabs Conversational AI (Premium)`,
      );

      const agentId = process.env.ELEVENLABS_AGENT_ID;
      if (!agentId) {
        return res.status(500).json({
          success: false,
          message: "ElevenLabs agent ID not configured",
        });
      }

      console.log(`[TEST CALL] Using agent ID: ${agentId}`);

      // Use existing Twilio service to make the call
      const callSid = await twilioService.makeCall(
        actualPhone,
        parseInt(elderlyUserId),
        agentId,
      );

      console.log(
        `[ELEVENLABS] Phone call initiated with standard webhook: ${callSid}`,
      );
      console.log(
        `[TEST CALL] ElevenLabs agent ${agentId} calling ${actualPhone}`,
      );
      console.log(`[TEST CALL] Call SID: ${callSid}`);

      res.json({
        success: true,
        message: `ElevenLabs Conversational AI call initiated to ${actualPhone}`,
        callSid: callSid,
        method: "ElevenLabs Conversational AI WebSocket",
      });
    } catch (error) {
      console.error("[TEST CALL] Error:", error);
      res.status(500).json({
        success: false,
        message: `Failed to initiate call: ${error}`,
      });
    }
  });

  // Hangup test call endpoint
  app.post("/api/test-call/:callSid/hangup", async (req, res) => {
    try {
      const { callSid } = req.params;
      console.log(`[TEST CALL] Hanging up call ${callSid}`);

      // Note: TwilioService doesn't have endCall method, using client directly
      let result;
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require("twilio");
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );
        const call = await client
          .calls(callSid)
          .update({ status: "completed" });
        result = { success: true, message: "Call ended", callSid: call.sid };
      } else {
        result = { success: true, message: "Call ended (simulated)", callSid };
      }
      res.json(result);
    } catch (error) {
      console.error("[TEST CALL] Hangup error:", error);
      res.status(500).json({
        success: false,
        message: `Failed to hangup call: ${error}`,
      });
    }
  });

  // Audio file serving endpoint for Twilio
  app.get("/audio/:filename", (req, res) => {
    const { filename } = req.params;
    const audioPath = path.join(process.cwd(), "uploads", filename);

    console.log(`[AUDIO] Serving audio file: ${audioPath}`);

    if (fs.existsSync(audioPath)) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=3600");
      const audioStream = fs.createReadStream(audioPath);
      audioStream.pipe(res);
    } else {
      console.error(`[AUDIO] File not found: ${audioPath}`);
      res.status(404).send("Audio file not found");
    }
  });

  // SMS webhook endpoint for handling incoming SMS (HELP, STOP, etc.)
  app.post("/api/twilio/sms", async (req, res) => {
    try {
      const { Body, From } = req.body;
      const incomingMessage = Body?.trim().toUpperCase();
      const senderNumber = From;

      console.log(`[SMS] Incoming message from ${senderNumber}: ${Body}`);

      // TwiML response
      const MessagingResponse = require("twilio").twiml.MessagingResponse;
      const twiml = new MessagingResponse();

      // HELP keywords
      const helpKeywords = ["HELP", "INFO"];
      // STOP keywords (Twilio standard opt-out keywords)
      const stopKeywords = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
      // START keywords (Twilio standard opt-in keywords)
      const startKeywords = ["START", "YES", "UNSTOP"];

      if (helpKeywords.includes(incomingMessage)) {
        twiml.message(
          "Inverse Collective LLC support. For help reply HELP or email hello@inversecollective.com. Msg and data rates may apply."
        );
      } else if (stopKeywords.includes(incomingMessage)) {
        twiml.message(
          "You are opted out of Inverse Collective LLC messages. No more texts will be sent. For help email hello@inversecollective.com."
        );
      } else if (startKeywords.includes(incomingMessage)) {
        twiml.message(
          "You have been resubscribed to Inverse Collective LLC messages. Reply HELP for help or STOP to unsubscribe. Msg and data rates may apply."
        );
      }
      // For any other message, send no response

      res.type("text/xml");
      res.send(twiml.toString());
    } catch (error) {
      console.error("[SMS] Error processing incoming SMS:", error);
      res.status(500).send("Error processing SMS");
    }
  });
}
