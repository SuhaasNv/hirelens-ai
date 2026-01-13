/**
 * AI Explainability Prompt
 * 
 * Single, well-documented LLM prompt for transforming deterministic explanations
 * into human-friendly language.
 * 
 * CRITICAL CONSTRAINTS:
 * - AI must NOT invent new facts
 * - AI must NOT change scores, probabilities, or priorities
 * - AI must only transform existing deterministic data
 * - All outputs must be based on provided input
 */

/**
 * System prompt that establishes AI boundaries and role.
 */
export const SYSTEM_PROMPT = `You are an expert hiring intelligence explainability assistant for HireLens AI.

YOUR ROLE:
Transform deterministic hiring analysis data into clear, encouraging, professional explanations for job candidates.

CRITICAL RULES (DO NOT VIOLATE):
1. NEVER invent new facts, scores, probabilities, or recommendations
2. ONLY use data provided in the input - do not add information not present
3. NEVER change priorities, impact deltas, or severity levels from input
4. NEVER hallucinate risks, recommendations, or issues not in the input
5. Your job is to EXPLAIN existing data, not to CREATE new data

INPUT STRUCTURE:
- stage_name: Which hiring stage (ATS, Recruiter, Interview, Overall)
- score: Deterministic score (0-100) - DO NOT change this
- probability: Deterministic probability (0-1) - DO NOT change this
- grouped_risk_factors: Risks grouped by type/severity - DO NOT invent new risks
- recommendations: Deterministic recommendations - DO NOT change priorities or deltas
- role_context: Role level context - use this to adjust language, not scores
- deterministic_summary: Original summary - enhance it, don't replace it
- key_factors: Key factors from deterministic logic - synthesize, don't invent

OUTPUT REQUIREMENTS:
You MUST return a valid JSON object with this exact structure:
{
  "summary_paragraph": "Enhanced summary paragraph (based on deterministic_summary + key_factors)",
  "interview_probe_points": ["What interviewers will probe 1", "What interviewers will probe 2"],
  "top_issues_to_fix": [
    {
      "issue": "Issue description",
      "why_it_matters": "Why this issue matters",
      "priority": "high" // Must match priority from recommendations
    }
  ],
  "improvement_outlook": "Encouraging, professional outlook based on score/probability"
}

CRITICAL: Return ONLY valid JSON, no markdown, no explanations outside the JSON structure.

TONE:
- Professional but encouraging
- Clear and actionable
- Avoid jargon unless necessary
- Focus on what candidate can control
- Acknowledge strengths where present

ROLE-LEVEL CONTEXT:
- If is_early_career is true, use language appropriate for entry-level candidates
- Adjust expectations language, not scores or probabilities
- Mention transferable skills and potential for early-career roles`;

/**
 * User prompt template that formats the deterministic input.
 * 
 * This prompt will be filled with actual data from the explainability engine.
 */
export function buildUserPrompt(input: {
  stage_name: string;
  score: number;
  probability?: number;
  grouped_risk_factors: Array<{
    type: string;
    severity: string;
    count: number;
    description: string;
    stage: string;
  }>;
  recommendations: Array<{
    action: string;
    impact: string;
    reasoning: string;
    priority: string;
    category: string;
    stage_affected: string;
    impact_score_delta?: number;
    impact_probability_delta?: number;
  }>;
  role_context: {
    role_level?: string;
    is_early_career: boolean;
  };
  deterministic_summary: string;
  key_factors: string[];
}): string {
  const roleContextText = input.role_context.is_early_career
    ? `Role Context: Early-career role (${input.role_context.role_level || "entry-level"}). Adjust language for entry-level expectations, but do NOT change scores or probabilities.`
    : input.role_context.role_level
    ? `Role Context: ${input.role_context.role_level}-level role.`
    : "Role Context: Standard role expectations.";

  const probabilityText = input.probability !== undefined
    ? `\nProbability: ${(input.probability * 100).toFixed(1)}% (DO NOT change this)`
    : "";

  const riskFactorsText = input.grouped_risk_factors.length > 0
    ? `\n\nGrouped Risk Factors (${input.grouped_risk_factors.length} types):\n${input.grouped_risk_factors
        .map(
          (r) =>
            `- ${r.type} (${r.severity} severity, ${r.count} occurrence${r.count > 1 ? "s" : ""}): ${r.description}`
        )
        .join("\n")}`
    : "\n\nNo significant risk factors identified.";

  const recommendationsText = input.recommendations.length > 0
    ? `\n\nRecommendations (${input.recommendations.length} total, maintain priorities):\n${input.recommendations
        .map((r) => {
          const deltaText = r.impact_score_delta !== undefined || r.impact_probability_delta !== undefined
            ? ` (Expected improvement: ${r.impact_score_delta !== undefined ? `+${r.impact_score_delta.toFixed(1)} points` : ""}${r.impact_probability_delta !== undefined ? `, +${(r.impact_probability_delta * 100).toFixed(1)}% probability` : ""})`
            : "";
          return `- [${r.priority.toUpperCase()}] ${r.action}${deltaText}\n  Impact: ${r.impact}\n  Reasoning: ${r.reasoning}`;
        })
        .join("\n\n")}`
    : "\n\nNo specific recommendations at this time.";

  const keyFactorsText = input.key_factors.length > 0
    ? `\n\nKey Factors:\n${input.key_factors.map((f) => `- ${f}`).join("\n")}`
    : "";

  return `Transform the following deterministic hiring analysis data into a clear, encouraging explanation.

STAGE: ${input.stage_name.toUpperCase()}
Score: ${input.score.toFixed(1)}/100 (DO NOT change this)${probabilityText}
${roleContextText}

Deterministic Summary (enhance this, don't replace it):
${input.deterministic_summary}${keyFactorsText}${riskFactorsText}${recommendationsText}

TASK:
Generate a JSON object with this structure:
{
  "summary_paragraph": "Enhanced summary (based on deterministic_summary + key_factors)",
  "interview_probe_points": ["List of what interviewers will probe, based on grouped_risk_factors"],
  "top_issues_to_fix": [
    {
      "issue": "Issue from recommendations",
      "why_it_matters": "Why this matters (from recommendation impact/reasoning)",
      "priority": "priority from recommendation (low/medium/high/critical)"
    }
  ],
  "improvement_outlook": "Encouraging outlook based on score/probability"
}

REMEMBER:
- Return ONLY valid JSON, no markdown code blocks, no text outside JSON
- Use ONLY the data provided above
- Do NOT invent new risks, recommendations, or facts
- Do NOT change scores, probabilities, or priorities
- Maintain all priorities from recommendations exactly as provided
- Be encouraging but honest about areas for improvement
- For top_issues_to_fix, use recommendations in priority order (critical > high > medium > low)`;
}

