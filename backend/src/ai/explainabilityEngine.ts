/**
 * AI Explainability Engine
 * 
 * Converts deterministic ExplainabilityArtifact into AIExplainabilityInput,
 * calls AI client, and merges AI explanations back into final response.
 * 
 * CRITICAL BOUNDARIES:
 * - Does NOT modify scores, probabilities, or recommendations
 * - Only transforms explanations into human-friendly language
 * - All deterministic data remains source of truth
 */

import {
  ATSResult,
  RecruiterResult,
  InterviewReadinessResult,
  AggregatedScore,
  AnalysisResult,
} from "../types";
import {
  AIExplainabilityInput,
  AIExplainabilityOutput,
  GroupedRiskFactor,
  Recommendation,
} from "./explainabilitySchemas";
import { callExplainabilityLLM, LLMClientError } from "./explainabilityClient";
import { RoleLevel, isEarlyCareerRole } from "../services/roleCalibration";

/**
 * Logger interface for safe logging (no sensitive data).
 */
export interface SafeLogger {
  info: (msg: string, meta?: object) => void;
  warn: (msg: string, meta?: object) => void;
}

/**
 * Deterministic explainability artifact (from generateExplanations).
 */
type DeterministicExplanations = AnalysisResult["explanations"];

/**
 * Groups repeated risk factors by type and severity.
 * 
 * This prevents repetitive explanations in AI output.
 */
function groupRiskFactors(
  atsResult: ATSResult,
  recruiterResult: RecruiterResult,
  interviewResult: InterviewReadinessResult,
  aggregatedScore: AggregatedScore
): GroupedRiskFactor[] {
  const riskMap = new Map<string, { severity: string; count: number; description: string; stage: string }>();

  // ATS risks
  if (atsResult.rejection_reasons) {
    for (const reason of atsResult.rejection_reasons) {
      const type = "ats_rejection";
      const key = `${type}:${"medium"}`; // ATS rejections are typically medium severity
      const existing = riskMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        riskMap.set(key, {
          severity: "medium",
          count: 1,
          description: reason,
          stage: "ats",
        });
      }
    }
  }

  // Recruiter red flags
  for (const redFlag of recruiterResult.red_flags) {
    const key = `${redFlag.type}:${redFlag.severity}`;
    const existing = riskMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      riskMap.set(key, {
        severity: redFlag.severity,
        count: 1,
        description: redFlag.description,
        stage: "recruiter",
      });
    }
  }

  // Interview consistency risks
  for (const risk of interviewResult.consistency_risks) {
    const key = `${risk.risk_type}:${risk.severity}`;
    const existing = riskMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      riskMap.set(key, {
        severity: risk.severity,
        count: 1,
        description: risk.description,
        stage: "interview",
      });
    }
  }

  // Aggregated risk factors
  for (const risk of aggregatedScore.risk_factors) {
    const key = `${risk.factor}:${risk.severity}`;
    const existing = riskMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      riskMap.set(key, {
        severity: risk.severity,
        count: 1,
        description: risk.description,
        stage: risk.stage,
      });
    }
  }

  // Convert to array
  return Array.from(riskMap.entries()).map(([key, value]) => {
    const [type] = key.split(":");
    return {
      type,
      severity: value.severity as "low" | "medium" | "high" | "critical",
      count: value.count,
      description: value.description,
      stage: value.stage,
    };
  });
}

/**
 * Converts deterministic recommendations to AI input format.
 */
function convertRecommendations(
  deterministicRecommendations: DeterministicExplanations["recommendations"]
): Recommendation[] {
  return deterministicRecommendations.map((rec) => ({
    action: rec.action,
    impact: rec.impact,
    reasoning: rec.reasoning,
    priority: rec.priority as "low" | "medium" | "high" | "critical",
    category: rec.category,
    stage_affected: rec.stage_affected,
    impact_score_delta: rec.impact_score_delta,
    impact_probability_delta: rec.impact_probability_delta,
  }));
}

/**
 * Converts deterministic stage explanation to AI input for a specific stage.
 */
function convertStageToAIInput(
  stageName: "ats" | "recruiter" | "interview" | "overall",
  deterministicExplanations: DeterministicExplanations,
  atsResult: ATSResult,
  recruiterResult: RecruiterResult,
  interviewResult: InterviewReadinessResult,
  aggregatedScore: AggregatedScore,
  roleLevel: RoleLevel
): AIExplainabilityInput {
  const isEarlyCareer = isEarlyCareerRole(roleLevel);
  const stageExplanation = deterministicExplanations.stage_explanations[stageName];

  // Get score and probability for this stage
  let score: number;
  let probability: number | undefined;

  switch (stageName) {
    case "ats":
      score = atsResult.compatibility_score;
      probability = atsResult.advancement_probability;
      break;
    case "recruiter":
      score = recruiterResult.evaluation_score;
      probability = recruiterResult.advancement_probability;
      break;
    case "interview":
      score = interviewResult.readiness_score;
      probability = interviewResult.advancement_probability;
      break;
    case "overall":
      score = aggregatedScore.overall_score;
      probability = aggregatedScore.overall_hiring_probability;
      break;
  }

  // Group risk factors (only for this stage)
  const allRiskFactors = groupRiskFactors(atsResult, recruiterResult, interviewResult, aggregatedScore);
  const stageRiskFactors = allRiskFactors.filter((r) => r.stage === stageName || stageName === "overall");

  // Get recommendations for this stage
  const allRecommendations = convertRecommendations(deterministicExplanations.recommendations);
  const stageRecommendations = allRecommendations.filter((r) => r.stage_affected === stageName || stageName === "overall");

  return {
    stage_name: stageName,
    score,
    probability,
    grouped_risk_factors: stageRiskFactors,
    recommendations: stageRecommendations,
    role_context: {
      role_level: roleLevel,
      is_early_career: isEarlyCareer,
    },
    deterministic_summary: stageExplanation.summary,
    key_factors: stageExplanation.key_factors,
  };
}

/**
 * Merges AI output back into deterministic explanations.
 * 
 * CRITICAL: Does NOT replace deterministic data, only enhances explanations.
 */
function mergeAIOutput(
  stageName: "ats" | "recruiter" | "interview" | "overall",
  deterministicExplanations: DeterministicExplanations,
  aiOutput: AIExplainabilityOutput
): void {
  const stageExplanation = deterministicExplanations.stage_explanations[stageName];

  // Replace summary with AI-enhanced version
  stageExplanation.summary = aiOutput.summary_paragraph;

  // Add AI-generated fields (new fields, don't replace existing)
  // Type assertion: aiOutput is validated via Zod, so types are guaranteed
  stageExplanation.ai_enhanced = {
    interview_probe_points: aiOutput.interview_probe_points,
    top_issues_to_fix: aiOutput.top_issues_to_fix as Array<{
      issue: string;
      why_it_matters: string;
      priority: "low" | "medium" | "high" | "critical";
    }>,
    improvement_outlook: aiOutput.improvement_outlook,
  };
}

/**
 * Enhances deterministic explanations with AI-powered transformations.
 * 
 * This function:
 * 1. Converts deterministic explanations to AI input format
 * 2. Calls AI client for each stage
 * 3. Merges AI output back into explanations
 * 
 * CRITICAL: Does NOT modify scores, probabilities, or recommendations.
 * Only transforms explanations into human-friendly language.
 * 
 * @param deterministicExplanations - Original deterministic explanations (source of truth)
 * @param atsResult - ATS scoring result
 * @param recruiterResult - Recruiter scoring result
 * @param interviewResult - Interview scoring result
 * @param aggregatedScore - Aggregated scoring result
 * @param roleLevel - Role level for context
 * @returns Enhanced explanations (deterministic data + AI-enhanced language)
 */
export async function enhanceExplanationsWithAI(
  deterministicExplanations: DeterministicExplanations,
  atsResult: ATSResult,
  recruiterResult: RecruiterResult,
  interviewResult: InterviewReadinessResult,
  aggregatedScore: AggregatedScore,
  roleLevel: RoleLevel = undefined,
  logger?: SafeLogger
): Promise<DeterministicExplanations> {
  // Create a copy to avoid mutating original
  const enhancedExplanations: DeterministicExplanations = JSON.parse(
    JSON.stringify(deterministicExplanations)
  );

  // SAFE LOGGING: Log AI enhancement start
  if (logger) {
    logger.info("AI explainability enhancement started", {
      role_level: roleLevel || "unspecified",
      stages_to_process: 4,
    });
  }

  // Process each stage
  const stages: Array<"ats" | "recruiter" | "interview" | "overall"> = [
    "ats",
    "recruiter",
    "interview",
    "overall",
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const stageName of stages) {
    try {
      // Convert to AI input
      const aiInput = convertStageToAIInput(
        stageName,
        deterministicExplanations,
        atsResult,
        recruiterResult,
        interviewResult,
        aggregatedScore,
        roleLevel
      );

      // Call AI client with logger
      const aiOutput = await callExplainabilityLLM(aiInput, undefined, logger);

      // Merge AI output back
      mergeAIOutput(stageName, enhancedExplanations, aiOutput);
      successCount++;

      // SAFE LOGGING: Log successful stage enhancement
      if (logger) {
        logger.info(`AI explainability enhanced stage: ${stageName}`, {
          stage: stageName,
          summary_length: aiOutput.summary_paragraph.length,
          probe_points_count: aiOutput.interview_probe_points.length,
          issues_count: aiOutput.top_issues_to_fix.length,
        });
      }
    } catch (error) {
      failureCount++;
      
      // SAFE LOGGING: Log stage failure (no sensitive data)
      if (logger) {
        logger.warn(`AI explainability failed for stage: ${stageName}`, {
          stage: stageName,
          error: error instanceof Error ? error.message : String(error),
          fallback: "deterministic_explanations",
        });
      }
      
      // If AI fails, continue with deterministic explanations for this stage
      // This ensures the system degrades gracefully
    }
  }

  // SAFE LOGGING: Log overall enhancement results
  if (logger) {
    logger.info("AI explainability enhancement completed", {
      stages_successful: successCount,
      stages_failed: failureCount,
      total_stages: stages.length,
      used_fallback: failureCount > 0,
    });
  }

  return enhancedExplanations;
}

