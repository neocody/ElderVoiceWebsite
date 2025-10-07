import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.");
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export interface CallSummary {
  summary: string;
  sentiment: string;
  memoryRecord: {
    memoryType: string;
    content: string;
    tags: string[];
    context: string;
    importanceScore: number;
  } | null;
}

export class OpenAIService {
  async generateCallSummary(transcript: string): Promise<CallSummary> {
    if (!transcript || transcript.trim().length === 0) {
      return {
        summary: "No conversation transcript available.",
        sentiment: "neutral",
        memoryRecord: null,
      };
    }

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an assistant that analyzes phone call transcripts.
              Return a JSON object with the following fields:
              - summary: a concise summary of the call
              - sentiment: overall sentiment (positive, neutral, negative)
              - memory: patient_memory record with:
                - memoryType
                - content
                - tags (array of keywords)
                - context
                - importanceScore (0-100)
              `,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.4,
        max_tokens: 400,
        response_format: { type: "json_object" },
      });

      const parsedData = JSON.parse(
        response.choices[0]?.message?.content?.trim() || "{}",
      );

      return {
        summary: parsedData.summary || "Summary is not available",
        sentiment: parsedData.sentiment || "neutral",
        memoryRecord: {
          memoryType: parsedData.memory?.memoryType || "unknown",
          content:
            parsedData.memory?.content ||
            parsedData.summary ||
            "No content available",
          tags: parsedData.memory?.tags || [],
          context: parsedData.memory?.context || "No context available",
          importanceScore: parsedData.memory?.importanceScore || 50,
        },
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      return {
        summary: "Error generating summary.",
        sentiment: "neutral",
        memoryRecord: null,
      };
    }
  }
}

export const openaiService = new OpenAIService();
