import { AggregatedScore, ATSResult, RecruiterResult, InterviewReadinessResult } from "../types";
import {
  RoleLevel,
  getRoleCalibrationFactors,
  isEarlyCareerRole,
} from "./roleCalibration";

/**
 * Aggregates scores from all stages into overall assessment.
 * 
 * UPDATED WITH PROBABILITY DAMPENING GUARDS:
 * - Prevents compounding penalties from collapsing probability unfairly
 * - Implements soft floor for strong early-career candidates
 * - Floor is explainable (based on ATS pass ≥ 0.75 and recruiter signal ≥ medium)
 */
export function aggregateScores(
  atsResult: ATSResult,
  recruiterResult: RecruiterResult,
  interviewResult: InterviewReadinessResult,
  roleLevel: RoleLevel = undefined
): AggregatedScore {
  const calibration = getRoleCalibrationFactors(roleLevel);
  const isEarlyCareer = isEarlyCareerRole(roleLevel);
  // Calculate stage probabilities (convert scores to probabilities)
  const atsPass = atsResult.advancement_probability || atsResult.compatibility_score / 100;
  const recruiterPass =
    recruiterResult.advancement_probability || recruiterResult.evaluation_score / 100;
  const interviewPass =
    interviewResult.advancement_probability || interviewResult.readiness_score / 100;

  // Conditional probability: recruiter pass requires ATS pass
  const adjustedRecruiterPass = Math.min(recruiterPass, atsPass);

  // Conditional probability: interview pass requires recruiter pass
  const adjustedInterviewPass = Math.min(interviewPass, adjustedRecruiterPass);

  // Offer probability is conditional on interview pass
  // If interview passes, offer probability is high (0.7-0.9 range)
  let offerProbability = 0.0;
  if (adjustedInterviewPass > 0.5) {
    offerProbability = 0.7 + (adjustedInterviewPass - 0.5) * 0.4;
  } else {
    offerProbability = adjustedInterviewPass * 0.5;
  }
  offerProbability = Math.min(1.0, Math.max(0.0, offerProbability));

  // Calculate overall hiring probability (end-to-end)
  let overallHiringProbability = atsPass * adjustedRecruiterPass * adjustedInterviewPass * offerProbability;

  // PROBABILITY DAMPENING GUARD: Prevent unfair compounding penalties
  // REAL-WORLD CONTEXT: Strong early-career candidates (ATS ≥ 0.75, recruiter signal ≥ medium)
  // should not have their probability collapsed by minor interview readiness issues.
  // This matches how real recruiters evaluate: if ATS and recruiter both pass,
  // interview is more about fit than absolute readiness.
  if (isEarlyCareer) {
    const atsPassThreshold = 0.75;
    const recruiterSignalThreshold = 0.5; // Medium signal strength
    
    const recruiterSignalStrength = recruiterResult.evaluation_score / 100; // 0-1 scale
    
    if (atsPass >= atsPassThreshold && recruiterSignalStrength >= recruiterSignalThreshold) {
      // Strong early-career candidate: apply soft floor
      // Floor is explainable: "Strong ATS and recruiter signals indicate candidate
      // has transferable skills and potential, even if interview readiness is lower."
      const floor = calibration.probabilityFloor;
      if (overallHiringProbability < floor) {
        overallHiringProbability = floor;
      }
    }
  }

  // Calculate overall score (weighted average)
  // For entry-level, adjust weights to emphasize transferable skills and potential
  const atsWeight = isEarlyCareer ? 0.25 : 0.3; // Slightly reduce ATS weight for entry-level
  const recruiterWeight = isEarlyCareer ? 0.35 : 0.3; // Increase recruiter weight (evaluates potential)
  const interviewWeight = isEarlyCareer ? 0.40 : 0.4; // Keep interview weight similar

  const overallScore =
    atsResult.compatibility_score * atsWeight +
    recruiterResult.evaluation_score * recruiterWeight +
    interviewResult.readiness_score * interviewWeight;

  // Calculate confidence interval (heuristic)
  const confidenceLevel = 0.95;
  const margin = overallHiringProbability * 0.1; // 10% margin
  const lower = Math.max(0, overallHiringProbability - margin);
  const upper = Math.min(1, overallHiringProbability + margin);

  // Extract risk factors (with role-level calibration)
  const riskFactors: Array<{
    factor: string;
    stage: string;
    impact_on_overall_probability: number;
    severity: string;
    description: string;
  }> = [];

  // ATS risks (calibrated by role level)
  if (atsResult.compatibility_score < 50) {
    const baseImpact = -0.3;
    const calibratedImpact = baseImpact * (isEarlyCareer ? 0.7 : 1.0); // 30% reduction for entry-level
    riskFactors.push({
      factor: "Low ATS compatibility score",
      stage: "ats",
      impact_on_overall_probability: calibratedImpact,
      severity: atsResult.compatibility_score < 40 ? "high" : "medium",
      description: `ATS compatibility score is ${atsResult.compatibility_score.toFixed(1)}/100`,
    });
  }

  // Recruiter risks (calibrated by role level)
  for (const redFlag of recruiterResult.red_flags) {
    const baseImpact = redFlag.severity === "high" ? -0.15 : redFlag.severity === "medium" ? -0.08 : -0.03;
    // Apply calibration: entry-level risks have reduced impact
    const calibratedImpact = baseImpact * (isEarlyCareer ? 0.6 : 1.0); // 40% reduction for entry-level
    riskFactors.push({
      factor: redFlag.type,
      stage: "recruiter",
      impact_on_overall_probability: calibratedImpact,
      severity: redFlag.severity,
      description: redFlag.description,
    });
  }

  // Interview risks (calibrated by role level)
  for (const risk of interviewResult.consistency_risks) {
    const baseImpact = risk.severity === "high" ? -0.20 : risk.severity === "medium" ? -0.10 : -0.05;
    // Apply calibration: vague claims are less penalized for entry-level
    const calibratedImpact = baseImpact * calibration.vagueClaimPenaltyMultiplier;
    riskFactors.push({
      factor: risk.risk_type,
      stage: "interview",
      impact_on_overall_probability: calibratedImpact,
      severity: risk.severity,
      description: risk.description,
    });
  }

  // Sort risk factors by impact
  riskFactors.sort((a, b) => a.impact_on_overall_probability - b.impact_on_overall_probability);

  return {
    overall_hiring_probability: Math.round(overallHiringProbability * 1000) / 1000,
    overall_hiring_probability_confidence_interval: {
      lower: Math.round(lower * 1000) / 1000,
      upper: Math.round(upper * 1000) / 1000,
      confidence_level: confidenceLevel,
    },
    stage_probabilities: {
      ats_pass: Math.round(atsPass * 1000) / 1000,
      recruiter_pass: Math.round(adjustedRecruiterPass * 1000) / 1000,
      interview_pass: Math.round(adjustedInterviewPass * 1000) / 1000,
      offer: Math.round(offerProbability * 1000) / 1000,
    },
    overall_score: Math.round(overallScore * 100) / 100,
    risk_factors: riskFactors,
    component_contributions: {
      ats_contribution: Math.round(atsResult.compatibility_score * atsWeight * 100) / 100,
      recruiter_contribution: Math.round(recruiterResult.evaluation_score * recruiterWeight * 100) / 100,
      interview_contribution: Math.round(interviewResult.readiness_score * interviewWeight * 100) / 100,
    },
  };
}

