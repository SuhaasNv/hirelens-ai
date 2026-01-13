/**
 * AI Explainability Client
 * 
 * Single responsibility: Call LLM with prompt + structured input, return structured output.
 * 
 * NO business logic - this is a pure transport layer.
 * 
 * CRITICAL: All inputs and outputs are validated via Zod schemas.
 */

import {
  AIExplainabilityInput,
  AIExplainabilityOutput,
  validateAIExplainabilityInput,
  validateAIExplainabilityOutput,
} from "./explainabilitySchemas";
import { buildUserPrompt, SYSTEM_PROMPT } from "./explainabilityPrompt";
import { callGemini, extractJSONFromGeminiResponse } from "./geminiClient";

/**
 * Configuration for LLM client.
 * 
 * Can be overridden via environment variables for different providers.
 */
export interface LLMClientConfig {
  provider: "openai" | "anthropic" | "gemini" | "custom";
  apiKey: string;
  model: string;
  baseUrl?: string; // For custom providers
  temperature?: number; // Default: 0.3 (low temperature for deterministic outputs)
  maxTokens?: number; // Default: 1000
}

/**
 * Default configuration (can be overridden via environment variables).
 */
function getDefaultConfig(): LLMClientConfig {
  const provider = (process.env.AI_EXPLAINABILITY_PROVIDER as "openai" | "anthropic" | "gemini" | "custom") || "openai";
  
  // Default model based on provider
  let defaultModel = "gpt-4o-mini";
  if (provider === "gemini") {
    defaultModel = "gemini-1.5-flash";
  } else if (provider === "anthropic") {
    defaultModel = "claude-3-haiku-20240307";
  }
  
  return {
    provider,
    apiKey: process.env.AI_EXPLAINABILITY_API_KEY || "",
    model: process.env.AI_EXPLAINABILITY_MODEL || defaultModel,
    baseUrl: process.env.AI_EXPLAINABILITY_BASE_URL,
    temperature: parseFloat(process.env.AI_EXPLAINABILITY_TEMPERATURE || "0.3"),
    maxTokens: parseInt(process.env.AI_EXPLAINABILITY_MAX_TOKENS || "1000", 10),
  };
}

/**
 * Error thrown when LLM call fails.
 */
export class LLMClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown
  ) {
    super(message);
    this.name = "LLMClientError";
  }
}

/**
 * Calls OpenAI API.
 */
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  config: LLMClientConfig
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: config.temperature || 0.3,
      max_tokens: config.maxTokens || 1000,
      response_format: { type: "json_object" }, // Force JSON output
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new LLMClientError(
      `OpenAI API error: ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new LLMClientError("No content in OpenAI response", response.status, data);
  }

  return content;
}

/**
 * Calls Anthropic API (Claude).
 */
async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  config: LLMClientConfig
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: config.temperature || 0.3,
      max_tokens: config.maxTokens || 1000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new LLMClientError(
      `Anthropic API error: ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  const data = (await response.json()) as {
    content?: Array<{
      text?: string;
    }>;
  };
  const content = data.content?.[0]?.text;
  
  if (!content) {
    throw new LLMClientError("No content in Anthropic response", response.status, data);
  }

  return content;
}

/**
 * Calls custom LLM provider (assumes OpenAI-compatible API).
 */
async function callCustom(
  systemPrompt: string,
  userPrompt: string,
  config: LLMClientConfig
): Promise<string> {
  if (!config.baseUrl) {
    throw new LLMClientError("Custom provider requires baseUrl");
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: config.temperature || 0.3,
      max_tokens: config.maxTokens || 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new LLMClientError(
      `Custom LLM API error: ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new LLMClientError("No content in custom LLM response", response.status, data);
  }

  return content;
}

/**
 * Calls LLM with structured input and returns structured output.
 * 
 * This is a pure transport function - no business logic.
 * 
 * @param input - Validated AI explainability input (from deterministic logic)
 * @param config - Optional LLM configuration (defaults to environment variables)
 * @returns Validated AI explainability output
 * @throws LLMClientError if LLM call fails or output is invalid
 */
export async function callExplainabilityLLM(
  input: AIExplainabilityInput,
  config?: Partial<LLMClientConfig>,
  logger?: { info: (msg: string, meta?: object) => void; warn: (msg: string, meta?: object) => void }
): Promise<AIExplainabilityOutput> {
  // Validate input (defensive check)
  const validatedInput = validateAIExplainabilityInput(input);

  // Merge config
  const finalConfig: LLMClientConfig = {
    ...getDefaultConfig(),
    ...config,
  };

  // SAFE LOGGING: Log provider and model (no secrets)
  if (logger) {
    logger.info("AI explainability client invoked", {
      provider: finalConfig.provider,
      model: finalConfig.model,
      stage: validatedInput.stage_name,
      has_api_key: !!finalConfig.apiKey, // Boolean, not the actual key
    });
  }

  if (!finalConfig.apiKey) {
    throw new LLMClientError("AI_EXPLAINABILITY_API_KEY environment variable is required");
  }

  // Build prompts
  // Type assertion: validatedInput is guaranteed to match buildUserPrompt signature after Zod validation
  const userPrompt = buildUserPrompt(validatedInput as Parameters<typeof buildUserPrompt>[0]);

  // Call appropriate LLM provider
  let rawResponse: string;
  try {
    switch (finalConfig.provider) {
      case "openai":
        rawResponse = await callOpenAI(SYSTEM_PROMPT, userPrompt, finalConfig);
        break;
      case "anthropic":
        rawResponse = await callAnthropic(SYSTEM_PROMPT, userPrompt, finalConfig);
        break;
      case "gemini":
        // GEMINI-SPECIFIC: System prompt is embedded in callGemini
        // Gemini does not support system/user role separation
        rawResponse = await callGemini(SYSTEM_PROMPT, userPrompt, finalConfig);
        break;
      case "custom":
        rawResponse = await callCustom(SYSTEM_PROMPT, userPrompt, finalConfig);
        break;
      default:
        throw new LLMClientError(`Unsupported provider: ${finalConfig.provider}`);
    }
  } catch (error) {
    if (error instanceof LLMClientError) {
      throw error;
    }
    throw new LLMClientError(`LLM call failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Parse JSON response
  // Provider-specific JSON extraction (Gemini uses different extraction logic)
  let jsonText: string;
  if (finalConfig.provider === "gemini") {
    // GEMINI-SPECIFIC: Use Gemini's JSON extraction function
    // Handles Gemini's response format and any markdown fences
    jsonText = extractJSONFromGeminiResponse(rawResponse);
  } else {
    // OpenAI/Anthropic/Custom: Standard JSON extraction
    jsonText = rawResponse.trim();
    
    // Remove markdown code blocks if present
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
  }
  
  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(jsonText);
  } catch (error) {
    throw new LLMClientError(
      `Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : String(error)}. Raw response: ${rawResponse.substring(0, 200)}`
    );
  }

  // Validate output schema
  try {
    const validatedOutput = validateAIExplainabilityOutput(parsedResponse);
    
    // SAFE LOGGING: Log successful validation (no sensitive data)
    if (logger) {
      logger.info("AI explainability output validated successfully", {
        provider: finalConfig.provider,
        model: finalConfig.model,
        stage: validatedInput.stage_name,
        has_summary: !!validatedOutput.summary_paragraph,
        probe_points_count: validatedOutput.interview_probe_points.length,
        issues_count: validatedOutput.top_issues_to_fix.length,
      });
    }
    
    return validatedOutput;
  } catch (error) {
    // SAFE LOGGING: Log validation failure (no sensitive data)
    if (logger) {
      logger.warn("AI explainability output validation failed", {
        provider: finalConfig.provider,
        model: finalConfig.model,
        stage: validatedInput.stage_name,
        error: error instanceof Error ? error.message : String(error),
        response_preview: typeof parsedResponse === "object" ? "object" : String(parsedResponse).substring(0, 100),
      });
    }
    
    throw new LLMClientError(
      `LLM output validation failed: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      parsedResponse
    );
  }
}

