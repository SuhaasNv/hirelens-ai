import {
  ATSResult,
  RecruiterResult,
  InterviewReadinessResult,
  AggregatedScore,
  AnalysisResult,
} from "../types";
import {
  RoleLevel,
  isEarlyCareerRole,
  getRoleCalibrationFactors,
} from "./roleCalibration";

/**
 * Generates explainability artifacts for the analysis result.
 * 
 * UPDATED: Explanations now explicitly mention role-level adjustments:
 * - "Expectations adjusted for entry-level role"
 * - "Transferable PM experience positively weighted"
 * - "Lack of revenue KPIs not penalized for intern role"
 */
export function generateExplanations(
  atsResult: ATSResult,
  recruiterResult: RecruiterResult,
  interviewResult: InterviewReadinessResult,
  aggregatedScore: AggregatedScore,
  roleLevel: RoleLevel = undefined
): AnalysisResult["explanations"] {
  const isEarlyCareer = isEarlyCareerRole(roleLevel);
  const calibration = getRoleCalibrationFactors(roleLevel);
  
  const roleLevelContext = isEarlyCareer
    ? " Expectations adjusted for entry-level role."
    : roleLevel === "mid"
    ? " Expectations calibrated for mid-level role."
    : roleLevel && ["senior", "staff", "principal", "executive"].includes(roleLevel)
    ? " Expectations calibrated for senior-level role."
    : "";
  // ATS Stage Explanation (with role-level context)
  const atsSummary =
    atsResult.compatibility_score >= 70
      ? `ATS compatibility is strong (${atsResult.compatibility_score.toFixed(1)}/100). Resume likely to pass ATS screening.${roleLevelContext}`
      : atsResult.compatibility_score >= 50
      ? `ATS compatibility is moderate (${atsResult.compatibility_score.toFixed(1)}/100). Some improvements could increase pass probability.${roleLevelContext}`
      : `ATS compatibility is weak (${atsResult.compatibility_score.toFixed(1)}/100). Significant improvements needed to pass ATS screening.${roleLevelContext}`;

  const atsKeyFactors: string[] = [];
  if (atsResult.compatibility_score >= 70) {
    atsKeyFactors.push(`Strong ATS compatibility score: ${atsResult.compatibility_score.toFixed(1)}/100`);
  }
  if (atsResult.keyword_match_percentage >= 70) {
    atsKeyFactors.push(`Good keyword match: ${atsResult.keyword_match_percentage.toFixed(1)}%`);
  }
  if (atsResult.required_fields_status.all_present) {
    atsKeyFactors.push("All required fields present");
  }
  if (!atsResult.required_fields_status.email) {
    atsKeyFactors.push("Missing email address");
  }
  if (!atsResult.required_fields_status.phone) {
    atsKeyFactors.push("Missing phone number");
  }
  if (atsResult.keyword_match_percentage < 50) {
    const context = isEarlyCareer
      ? " (penalty reduced for entry-level role)"
      : "";
    atsKeyFactors.push(`Low keyword match: ${atsResult.keyword_match_percentage.toFixed(1)}%${context}`);
  }
  
  // Add role-level specific factors
  if (isEarlyCareer && atsResult.keyword_match_percentage > 40) {
    atsKeyFactors.push("Transferable experience positively weighted for entry-level role");
  }

  // Recruiter Stage Explanation (with role-level context)
  const recruiterSummary =
    recruiterResult.evaluation_score >= 70
      ? `Recruiter evaluation is strong (${recruiterResult.evaluation_score.toFixed(1)}/100). Resume likely to advance to interview stage.${roleLevelContext}`
      : recruiterResult.evaluation_score >= 50
      ? `Recruiter evaluation is moderate (${recruiterResult.evaluation_score.toFixed(1)}/100). Some concerns may affect advancement.${roleLevelContext}`
      : `Recruiter evaluation is weak (${recruiterResult.evaluation_score.toFixed(1)}/100). Significant concerns may prevent advancement.${roleLevelContext}`;

  const recruiterKeyFactors: string[] = [];
  if (recruiterResult.evaluation_score >= 70) {
    recruiterKeyFactors.push(`Strong recruiter evaluation score: ${recruiterResult.evaluation_score.toFixed(1)}/100`);
  }
  if (recruiterResult.career_progression_score >= 0.7) {
    recruiterKeyFactors.push("Positive career progression trajectory");
  } else if (isEarlyCareer && recruiterResult.career_progression_score >= 0.4) {
    recruiterKeyFactors.push("Transferable experience shows potential for entry-level role");
  }
  if (recruiterResult.job_stability_score >= 0.7) {
    recruiterKeyFactors.push("Good job stability indicators");
  } else if (isEarlyCareer) {
    recruiterKeyFactors.push("Job stability less critical for entry-level roles");
  }
  for (const redFlag of recruiterResult.red_flags) {
    const context = isEarlyCareer && redFlag.severity === "medium"
      ? " (severity reduced for entry-level role)"
      : "";
    recruiterKeyFactors.push(`Red flag: ${redFlag.type} (${redFlag.severity} severity)${context}`);
  }

  // Interview Stage Explanation (with role-level context)
  const interviewSummary =
    interviewResult.readiness_score >= 70
      ? `Interview readiness is strong (${interviewResult.readiness_score.toFixed(1)}/100). Resume claims are defensible and interview-ready.${roleLevelContext}`
      : interviewResult.readiness_score >= 50
      ? `Interview readiness is moderate (${interviewResult.readiness_score.toFixed(1)}/100). Some claims may need clarification in interviews.${roleLevelContext}`
      : `Interview readiness is weak (${interviewResult.readiness_score.toFixed(1)}/100). Multiple claims may be challenged in interviews.${roleLevelContext}`;

  const interviewKeyFactors: string[] = [];
  if (interviewResult.readiness_score >= 70) {
    interviewKeyFactors.push(`Strong interview readiness score: ${interviewResult.readiness_score.toFixed(1)}/100`);
  }
  const defensibleClaims = interviewResult.resume_claims.filter((c) => c.defensibility_score >= 0.7);
  if (defensibleClaims.length > 0) {
    interviewKeyFactors.push(`${defensibleClaims.length} defensible resume claim(s) with strong evidence`);
  }
  
  // Role-level specific factors
  if (isEarlyCareer) {
    const ownershipClaims = interviewResult.resume_claims.filter((c) =>
      /\b(owned|led|built|created|managed)\b/i.test(c.claim_text)
    );
    if (ownershipClaims.length > 0) {
      interviewKeyFactors.push(`Ownership signals positively weighted for entry-level role (${ownershipClaims.length} claim(s))`);
    }
    interviewKeyFactors.push("Lack of revenue KPIs not penalized for entry-level role");
  }
  
  for (const risk of interviewResult.consistency_risks) {
    const context = isEarlyCareer
      ? " (penalty reduced for entry-level role)"
      : "";
    interviewKeyFactors.push(`Consistency risk: ${risk.risk_type} (${risk.severity} severity)${context}`);
  }

  // Overall Explanation
  const overallSummary =
    aggregatedScore.overall_score >= 70
      ? `Overall assessment is strong (${aggregatedScore.overall_score.toFixed(1)}/100). Candidate has good probability of receiving an offer.`
      : aggregatedScore.overall_score >= 50
      ? `Overall assessment is moderate (${aggregatedScore.overall_score.toFixed(1)}/100). Some improvements could increase hiring probability.`
      : `Overall assessment is weak (${aggregatedScore.overall_score.toFixed(1)}/100). Significant improvements needed to increase hiring probability.`;

  const overallKeyFactors: string[] = [];
  if (aggregatedScore.overall_score >= 70) {
    overallKeyFactors.push(`Strong overall score: ${aggregatedScore.overall_score.toFixed(1)}/100`);
  }
  if (aggregatedScore.stage_probabilities.offer > 0.5) {
    overallKeyFactors.push("Offer probability above 50%");
  }
  const topRisks = aggregatedScore.risk_factors.slice(0, 3);
  for (const risk of topRisks) {
    overallKeyFactors.push(
      `Risk: ${risk.factor} (${risk.severity} severity, ${Math.abs(risk.impact_on_overall_probability).toFixed(1)}% impact)`
    );
  }

  // Generate recommendations
  const recommendations: Array<{
    priority: string;
    category: string;
    action: string;
    impact: string;
    reasoning: string;
    stage_affected: string;
    impact_score_delta?: number;
    impact_probability_delta?: number;
  }> = [];

  // ATS recommendations (with role-level context)
  if (!atsResult.required_fields_status.email) {
    recommendations.push({
      priority: "high",
      category: "formatting",
      action: "Add email address to resume header",
      impact: "ATS systems require email for contact. Missing email will cause immediate rejection.",
      reasoning: "ATS requires email field for candidate contact and tracking.",
      stage_affected: "ats",
      impact_score_delta: 25.0,
      impact_probability_delta: 0.25,
    });
  }

  if (atsResult.keyword_match_percentage < 60) {
    const context = isEarlyCareer
      ? " For entry-level roles, focus on transferable skills and learning velocity."
      : "";
    recommendations.push({
      priority: atsResult.keyword_match_percentage < 40 ? "high" : "medium",
      category: "keyword_optimization",
      action: `Incorporate missing keywords naturally: ${atsResult.keyword_breakdown.missing_keywords.slice(0, 3).join(", ")}`,
      impact: `Keyword match is ${atsResult.keyword_match_percentage.toFixed(1)}%. Increasing to 70%+ would significantly improve ATS compatibility.${context}`,
      reasoning: `ATS systems rank candidates by keyword match. Missing ${atsResult.keyword_breakdown.missing_keywords.length} required keywords reduces visibility.${context}`,
      stage_affected: "ats",
      impact_score_delta: Math.min(20.0, (70.0 - atsResult.keyword_match_percentage) * 0.5) * (isEarlyCareer ? 0.7 : 1.0),
      impact_probability_delta: Math.min(0.20, (70.0 - atsResult.keyword_match_percentage) / 100.0) * (isEarlyCareer ? 0.7 : 1.0),
    });
  }

  // Recruiter recommendations
  for (const redFlag of recruiterResult.red_flags) {
    if (redFlag.type === "generic_resume") {
      recommendations.push({
        priority: "medium",
        category: "achievement_enhancement",
        action: "Add specific, quantifiable achievements with metrics",
        impact: "Generic resume lacks impact. Quantifiable achievements demonstrate value and results.",
        reasoning: redFlag.description,
        stage_affected: "recruiter",
        impact_score_delta: 12.0,
        impact_probability_delta: 0.12,
      });
    }
  }

  // Interview recommendations (with role-level context)
  for (const risk of interviewResult.consistency_risks.slice(0, 3)) {
    const context = isEarlyCareer
      ? " For entry-level roles, focus on ownership and learning velocity rather than revenue KPIs."
      : "";
    recommendations.push({
      priority: risk.severity === "high" ? "high" : "medium",
      category: "achievement_enhancement",
      action: `Add specific details and metrics to support claim`,
      impact: `Vague claims will be probed in interviews. Specific details with metrics make claims defensible.${context}`,
      reasoning: risk.description + context,
      stage_affected: "interview",
      impact_score_delta: (risk.severity === "high" ? 15.0 : 8.0) * calibration.vagueClaimPenaltyMultiplier,
      impact_probability_delta: (risk.severity === "high" ? 0.15 : 0.08) * calibration.vagueClaimPenaltyMultiplier,
    });
  }

  // Sort recommendations by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => {
    return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
  });

  return {
    stage_explanations: {
      ats: {
        summary: atsSummary,
        key_factors: atsKeyFactors,
      },
      recruiter: {
        summary: recruiterSummary,
        key_factors: recruiterKeyFactors,
      },
      interview: {
        summary: interviewSummary,
        key_factors: interviewKeyFactors,
      },
      overall: {
        summary: overallSummary,
        key_factors: overallKeyFactors,
      },
    },
    recommendations,
  };
}

