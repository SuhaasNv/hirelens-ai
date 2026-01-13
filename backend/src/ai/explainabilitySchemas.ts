/**
 * AI Explainability Schemas
 * 
 * Defines structured input and output schemas for AI-powered explainability.
 * 
 * CRITICAL BOUNDARIES:
 * - AI only transforms existing deterministic explanations into human-friendly language
 * - AI does NOT decide outcomes, scores, or probabilities
 * - All inputs are from deterministic logic (source of truth)
 * - All outputs are structured and auditable
 */

import { z } from "zod";

/**
 * Grouped risk factor for AI processing.
 * 
 * Groups repeated risks by type and severity to avoid repetitive explanations.
 */
export const GroupedRiskFactorSchema = z.object({
  type: z.string().describe("Risk type identifier (e.g., 'vague_claim', 'missing_experience')"),
  severity: z.enum(["low", "medium", "high", "critical"]).describe("Risk severity level"),
  count: z.number().int().min(1).describe("Number of occurrences of this risk type"),
  description: z.string().describe("Human-readable description of the risk"),
  stage: z.string().describe("Stage where this risk occurs (e.g., 'ats', 'recruiter', 'interview')"),
});

export type GroupedRiskFactor = z.infer<typeof GroupedRiskFactorSchema>;

/**
 * Recommendation for AI processing.
 * 
 * Contains action, impact, and expected deltas from deterministic logic.
 */
export const RecommendationSchema = z.object({
  action: z.string().describe("Recommended action to take"),
  impact: z.string().describe("Expected impact of taking this action"),
  reasoning: z.string().describe("Why this action is recommended"),
  priority: z.enum(["low", "medium", "high", "critical"]).describe("Priority level"),
  category: z.string().describe("Category of recommendation (e.g., 'formatting', 'keyword_optimization')"),
  stage_affected: z.string().describe("Stage that would be improved (e.g., 'ats', 'recruiter')"),
  impact_score_delta: z.number().optional().describe("Expected score improvement (from deterministic logic)"),
  impact_probability_delta: z.number().optional().describe("Expected probability improvement (from deterministic logic)"),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Input schema for AI explainability transformation.
 * 
 * Contains all deterministic data that AI will transform into human-friendly language.
 * AI must NOT invent new facts or change scores/probabilities.
 */
export const AIExplainabilityInputSchema = z.object({
  stage_name: z.enum(["ats", "recruiter", "interview", "overall"]).describe("Stage being explained"),
  score: z.number().min(0).max(100).describe("Deterministic score (0-100) - AI must not change this"),
  probability: z.number().min(0).max(1).optional().describe("Deterministic probability (0-1) - AI must not change this"),
  grouped_risk_factors: z.array(GroupedRiskFactorSchema).describe("Grouped risk factors (collapsed by type/severity)"),
  recommendations: z.array(RecommendationSchema).describe("Deterministic recommendations (AI must not change priorities or deltas)"),
  role_context: z.object({
    role_level: z.enum(["entry", "intern", "apm", "mid", "senior", "staff", "principal", "executive"]).optional(),
    is_early_career: z.boolean().describe("Whether this is an early-career role"),
  }).describe("Role-level context for calibration"),
  deterministic_summary: z.string().describe("Original deterministic summary - AI will enhance, not replace"),
  key_factors: z.array(z.string()).describe("Key factors from deterministic logic - AI will synthesize, not invent"),
});

export type AIExplainabilityInput = z.infer<typeof AIExplainabilityInputSchema>;

/**
 * Output schema for AI explainability.
 * 
 * Structured output that AI generates from deterministic input.
 * All outputs are human-friendly transformations of deterministic data.
 */
export const AIExplainabilityOutputSchema = z.object({
  summary_paragraph: z.string().describe("Enhanced summary paragraph (human-friendly, based on deterministic data)"),
  interview_probe_points: z.array(z.string()).describe("What interviewers will likely probe (based on risk factors)"),
  top_issues_to_fix: z.array(z.object({
    issue: z.string().describe("Issue to fix"),
    why_it_matters: z.string().describe("Why this issue matters"),
    priority: z.enum(["low", "medium", "high", "critical"]).describe("Priority from deterministic logic"),
  })).describe("Top issues to fix first (prioritized from deterministic recommendations)"),
  improvement_outlook: z.string().describe("Encouraging, professional outlook on improvement potential"),
});

export type AIExplainabilityOutput = z.infer<typeof AIExplainabilityOutputSchema>;

/**
 * Validates AI explainability input.
 * 
 * Ensures all inputs are from deterministic logic and properly structured.
 */
export function validateAIExplainabilityInput(input: unknown): AIExplainabilityInput {
  return AIExplainabilityInputSchema.parse(input);
}

/**
 * Validates AI explainability output.
 * 
 * Ensures AI output is structured and auditable.
 */
export function validateAIExplainabilityOutput(output: unknown): AIExplainabilityOutput {
  return AIExplainabilityOutputSchema.parse(output);
}

