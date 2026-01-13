import { InterviewReadinessResult, ParsedResume } from "../types";
import {
  RoleLevel,
  getRoleCalibrationFactors,
  isEarlyCareerRole,
} from "./roleCalibration";

/**
 * Extracts resume claims (bullet points) from text
 */
function extractResumeClaims(resumeText: string): Array<{
  claim_text: string;
  claim_type: string;
  defensibility_score: number;
  depth_indicator: string;
}> {
  const claims: Array<{
    claim_text: string;
    claim_type: string;
    defensibility_score: number;
    depth_indicator: string;
  }> = [];

  // Split by common bullet point markers
  const lines = resumeText.split(/\n/);
  const bulletPattern = /^[\s]*[•\-\*]\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(bulletPattern);
    if (match && match[1].trim().length > 10) {
      const claimText = match[1].trim();

      // Determine defensibility based on content
      let defensibilityScore = 0.5;
      let depthIndicator = "moderate";

      // Check for metrics (numbers, percentages)
      if (/\d+%|\d+\.\d+%|\$\d+[KMB]?|\d+\s*(million|thousand|k|m|b)/i.test(claimText)) {
        defensibilityScore = 0.9;
        depthIndicator = "deep";
      } else if (
        /\b(built|developed|created|implemented|designed|optimized|reduced|increased|improved)\b/i.test(
          claimText
        )
      ) {
        defensibilityScore = 0.7;
        depthIndicator = "moderate";
      } else if (
        /\b(helped|assisted|worked on|involved in|contributed to)\b/i.test(claimText)
      ) {
        defensibilityScore = 0.3;
        depthIndicator = "surface";
      }

      claims.push({
        claim_text: claimText,
        claim_type: "achievement",
        defensibility_score: defensibilityScore,
        depth_indicator: depthIndicator,
      });
    }
  }

  return claims;
}

/**
 * Predicts interview questions based on resume claims
 */
function predictInterviewQuestions(
  claims: Array<{ claim_text: string; defensibility_score: number }>
): Array<{
  question: string;
  likelihood: number;
  question_type: string;
  related_claim?: string;
  reasoning?: string;
}> {
  const questions: Array<{
    question: string;
    likelihood: number;
    question_type: string;
    related_claim?: string;
    reasoning?: string;
  }> = [];

  for (const claim of claims) {
    if (claim.defensibility_score < 0.5) {
      questions.push({
        question: `Can you explain how you achieved: "${claim.claim_text.substring(0, 50)}..."?`,
        likelihood: 0.8,
        question_type: "resume_deep_dive",
        related_claim: claim.claim_text.substring(0, 100),
        reasoning: "Vague claim may prompt clarification questions",
      });

      if (!/\d+/.test(claim.claim_text)) {
        questions.push({
          question: "How did you measure the success of this achievement?",
          likelihood: 0.7,
          question_type: "situational",
          related_claim: claim.claim_text.substring(0, 100),
          reasoning: "Claim lacks metrics, likely to be probed",
        });
      }
    }
  }

  return questions.slice(0, 5); // Limit to top 5
}

/**
 * Detects consistency risks
 */
function detectConsistencyRisks(
  claims: Array<{ claim_text: string; defensibility_score: number }>
): Array<{
  risk_type: string;
  severity: string;
  description: string;
  related_claim?: string;
  mitigation_suggestion?: string;
}> {
  const risks: Array<{
    risk_type: string;
    severity: string;
    description: string;
    related_claim?: string;
    mitigation_suggestion?: string;
  }> = [];

  for (const claim of claims) {
    if (claim.defensibility_score < 0.4) {
      risks.push({
        risk_type: "vague_claim",
        severity: "high",
        description: `Claim lacks specific evidence: "${claim.claim_text.substring(0, 60)}..."`,
        related_claim: claim.claim_text.substring(0, 100),
        mitigation_suggestion: "Prepare specific examples and metrics to support this claim",
      });
    } else if (claim.defensibility_score < 0.6) {
      risks.push({
        risk_type: "vague_claim",
        severity: "medium",
        description: `Claim could be more specific: "${claim.claim_text.substring(0, 60)}..."`,
        related_claim: claim.claim_text.substring(0, 100),
        mitigation_suggestion: "Add quantifiable metrics to strengthen this claim",
      });
    }
  }

  return risks;
}

/**
 * Scores interview readiness.
 * 
 * UPDATED WITH ROLE-LEVEL CALIBRATION:
 * - Entry-level: Reduced penalties for vague claims (less polished resumes are normal)
 * - Missing revenue KPIs is not penalized for entry-level roles
 * - Transferable experience (projects, internships) is considered defensible
 */
export function scoreInterview(
  parsedResume: ParsedResume,
  resumeText: string,
  roleLevel: RoleLevel = undefined
): InterviewReadinessResult {
  const calibration = getRoleCalibrationFactors(roleLevel);
  const isEarlyCareer = isEarlyCareerRole(roleLevel);
  
  const claims = extractResumeClaims(resumeText);
  const predictedQuestions = predictInterviewQuestions(claims);
  const consistencyRisks = detectConsistencyRisks(claims);

  // Calculate defensibility score (average of claim defensibility)
  let defensibilityScore =
    claims.length > 0
      ? claims.reduce((sum, c) => sum + c.defensibility_score, 0) / claims.length
      : 0.5;

  // For entry-level, boost defensibility if claims show ownership/initiative
  // (even without revenue KPIs, ownership signals are valuable)
  if (isEarlyCareer && claims.length > 0) {
    const ownershipClaims = claims.filter((c) =>
      /\b(owned|led|built|created|managed|founded|started)\b/i.test(c.claim_text)
    );
    if (ownershipClaims.length > 0) {
      // Boost defensibility for ownership signals (shows potential)
      defensibilityScore = Math.min(0.85, defensibilityScore + ownershipClaims.length * 0.1);
    }
  }

  // Calculate readiness score (0-100)
  let readinessScore = 100.0;

  // Deduct for risky claims (penalties are calibrated by role level)
  for (const risk of consistencyRisks) {
    if (risk.severity === "high") {
      const penalty = 10 * calibration.vagueClaimPenaltyMultiplier;
      readinessScore -= penalty;
    } else if (risk.severity === "medium") {
      const penalty = 5 * calibration.vagueClaimPenaltyMultiplier;
      readinessScore -= penalty;
    }
  }

  // Deduct for low defensibility (calibrated penalty)
  if (defensibilityScore < 0.5) {
    const penalty = 15 * calibration.vagueClaimPenaltyMultiplier;
    readinessScore -= penalty;
  }

  // For entry-level, don't penalize for missing revenue KPIs
  // (entry-level candidates rarely have revenue impact metrics)
  if (!isEarlyCareer) {
    // Check for revenue/KPI metrics in claims (only penalize senior roles if missing)
    const hasKpiMetrics = claims.some((c) =>
      /\$\d+[KMB]?|\d+\s*(million|thousand|k|m|b)|revenue|profit|roi|kpi/i.test(c.claim_text)
    );
    if (claims.length > 0 && !hasKpiMetrics && roleLevel && ["senior", "staff", "principal", "executive"].includes(roleLevel)) {
      // Senior roles should have KPIs
      readinessScore -= 8 * calibration.missingKpiPenaltyMultiplier;
    }
  }

  readinessScore = Math.max(0, Math.min(100, Math.round(readinessScore * 100) / 100));

  // Calculate advancement probability
  let advancementProbability = 0.0;
  if (readinessScore >= 70) {
    advancementProbability = 0.70;
  } else if (readinessScore >= 55) {
    advancementProbability = 0.55;
  } else if (readinessScore >= 40) {
    advancementProbability = 0.35;
  } else {
    advancementProbability = 0.20;
  }

  return {
    readiness_score: readinessScore,
    defensibility_score: defensibilityScore,
    advancement_probability: advancementProbability,
    resume_claims: claims.map((c) => ({
      ...c,
      consistency_risk:
        c.defensibility_score < 0.4
          ? "high"
          : c.defensibility_score < 0.6
          ? "medium"
          : undefined,
      supporting_evidence: /\d+/.test(c.claim_text) ? ["Contains metrics"] : undefined,
    })),
    predicted_questions: predictedQuestions,
    consistency_risks: consistencyRisks,
  };
}

