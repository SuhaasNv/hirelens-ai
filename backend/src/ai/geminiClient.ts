/**
 * Google Gemini Client for AI Explainability
 * 
 * Implements Google Gemini API client for transforming deterministic explanations
 * into human-friendly language.
 * 
 * GEMINI-SPECIFIC CONSTRAINTS:
 * - Gemini does NOT support system/user role separation like OpenAI/Anthropic
 * - System instructions must be embedded at the top of the prompt
 * - Gemini supports JSON output via response_mime_type: "application/json"
 * - API endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * 
 * SAFETY:
 * - All outputs validated via Zod schemas
 * - JSON extraction handles markdown fences
 * - Graceful error handling with controlled exceptions
 */

import { LLMClientError } from "./explainabilityClient";
import { SYSTEM_PROMPT } from "./explainabilityPrompt";
import type { LLMClientConfig } from "./explainabilityClient";

/**
 * Gemini API request structure.
 * 
 * Gemini uses a different request format than OpenAI/Anthropic:
 * - contents: Array of content objects (no system/user separation)
 * - generationConfig: Configuration including JSON output mode
 */
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType: "application/json";
  };
}

/**
 * Gemini API response structure.
 */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Calls Google Gemini API with embedded system instructions.
 * 
 * GEMINI-SPECIFIC: System instructions are embedded at the top of the prompt
 * because Gemini does not support separate system/user roles.
 * 
 * @param systemPrompt - System instructions (embedded in prompt)
 * @param userPrompt - User prompt with deterministic data
 * @param config - LLM client configuration
 * @returns Raw text response from Gemini
 * @throws LLMClientError if API call fails or response is invalid
 */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  config: LLMClientConfig
): Promise<string> {
  // GEMINI-SPECIFIC: Embed system instructions at the top of the prompt
  // Gemini does not support system/user role separation, so we combine them
  const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  // Build Gemini API request
  // Endpoint format: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
  const model = config.model || "gemini-1.5-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const requestBody: GeminiRequest = {
    contents: [
      {
        parts: [
          {
            text: combinedPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: config.temperature || 0.3,
      maxOutputTokens: config.maxTokens || 1000,
      // GEMINI-SPECIFIC: Request JSON output explicitly
      // This ensures Gemini returns valid JSON, not markdown or text
      responseMimeType: "application/json",
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new LLMClientError(
        `Gemini API error: ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    const data = (await response.json()) as GeminiResponse;

    // Check for API-level errors
    if (data.error) {
      throw new LLMClientError(
        `Gemini API error: ${data.error.message}`,
        data.error.code,
        data.error
      );
    }

    // Extract text from response
    // Gemini response structure: candidates[0].content.parts[0].text
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new LLMClientError("No candidates in Gemini response", response.status, data);
    }

    // Check finish reason (safety check)
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      // FINISH_REASON_SAFETY: Content was blocked for safety reasons
      // FINISH_REASON_MAX_TOKENS: Response was cut off
      // FINISH_REASON_RECITATION: Response contained recitation
      throw new LLMClientError(
        `Gemini response incomplete: finishReason=${candidate.finishReason}`,
        response.status,
        data
      );
    }

    const content = candidate.content?.parts?.[0]?.text;
    if (!content) {
      throw new LLMClientError("No text content in Gemini response", response.status, data);
    }

    return content;
  } catch (error) {
    // Re-throw LLMClientError as-is
    if (error instanceof LLMClientError) {
      throw error;
    }

    // Wrap other errors
    throw new LLMClientError(
      `Gemini API call failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extracts JSON from Gemini response text.
 * 
 * SAFETY: Handles cases where Gemini might wrap JSON in markdown code blocks
 * or include explanatory text (though responseMimeType should prevent this).
 * 
 * @param rawResponse - Raw text response from Gemini
 * @returns Extracted JSON string
 */
export function extractJSONFromGeminiResponse(rawResponse: string): string {
  let jsonText = rawResponse.trim();

  // Remove markdown code blocks if present (defensive)
  // Even with responseMimeType: "application/json", some models might add formatting
  const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  // If response starts with {, assume it's pure JSON
  if (jsonText.startsWith("{")) {
    // Find the matching closing brace (handles nested objects)
    let braceCount = 0;
    let endIndex = -1;
    for (let i = 0; i < jsonText.length; i++) {
      if (jsonText[i] === "{") braceCount++;
      if (jsonText[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    if (endIndex > 0) {
      jsonText = jsonText.substring(0, endIndex + 1);
    }
  }

  return jsonText;
}

