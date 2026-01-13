import { RecruiterResult, ParsedResume } from "../types";
import {
  RoleLevel,
  getRoleCalibrationFactors,
  isEarlyCareerRole,
  detectTransferableSignals,
} from "./roleCalibration";

/**
 * Calculates career progression score based on work experience.
 * 
 * UPDATED: For entry-level roles, transferable experience (internships, projects)
 * is positively weighted instead of being treated as missing experience.
 */
function calculateCareerProgression(
  parsedResume: ParsedResume,
  resumeText: string,
  roleLevel: RoleLevel
): {
  score: number;
  trajectory: string;
  promotionsCount?: number;
  responsibilityIncrease?: boolean;
  titleProgression?: string[];
} {
  const workExp = parsedResume.work_experience;
  const isEarlyCareer = isEarlyCareerRole(roleLevel);
  const calibration = getRoleCalibrationFactors(roleLevel);

  if (workExp.length === 0) {
    // For entry-level, check for transferable experience
    if (isEarlyCareer) {
      const transferableSignals = detectTransferableSignals(resumeText);
      if (transferableSignals.length > 0) {
        // Transferable experience counts positively for entry-level
        const transferableScore = Math.min(0.6, transferableSignals.length * 0.15);
        return {
          score: transferableScore,
          trajectory: "transferable_experience",
        };
      }
    }
    return {
      score: 0.5,
      trajectory: "insufficient_data",
    };
  }

  // Simple heuristic: more jobs = more experience = better progression
  // In a real implementation, we'd parse titles and dates
  let score = 0.5;
  if (workExp.length >= 3) {
    score = 0.8;
  } else if (workExp.length >= 2) {
    score = 0.65;
  }

  // For entry-level, boost score if transferable signals exist (shows initiative)
  if (isEarlyCareer) {
    const transferableSignals = detectTransferableSignals(resumeText);
    const ownershipSignals = transferableSignals.filter((s) => s.type === "ownership" || s.type === "leadership");
    if (ownershipSignals.length > 0) {
      score = Math.min(0.85, score + ownershipSignals.length * 0.1 * calibration.ownershipWeightMultiplier);
    }
  }

  return {
    score,
    trajectory: workExp.length >= 2 ? "upward" : "lateral",
    promotionsCount: workExp.length > 1 ? workExp.length - 1 : undefined,
    responsibilityIncrease: workExp.length > 1,
    titleProgression: workExp.map((exp) => exp.title || "Unknown"),
  };
}

/**
 * Calculates job stability score
 */
function calculateJobStability(parsedResume: ParsedResume): {
  score: number;
  averageTenureMonths: number;
  shortTenureJobsCount: number;
} {
  const workExp = parsedResume.work_experience;

  if (workExp.length === 0) {
    return {
      score: 0.0,
      averageTenureMonths: 0,
      shortTenureJobsCount: 0,
    };
  }

  // Placeholder: assume average 24 months per job if no dates available
  // In real implementation, parse dates and calculate actual tenure
  const averageTenureMonths = 24.0;
  const shortTenureJobsCount = 0; // Would count jobs < 12 months

  let score = 1.0;
  if (averageTenureMonths < 12) {
    score = 0.3;
  } else if (averageTenureMonths < 18) {
    score = 0.6;
  }

  return {
    score,
    averageTenureMonths,
    shortTenureJobsCount,
  };
}

/**
 * Detects red flags in resume.
 * 
 * UPDATED: For entry-level roles, missing work experience is less severe
 * if transferable experience (internships, projects) exists.
 */
function detectRedFlags(
  parsedResume: ParsedResume,
  resumeLength: number,
  resumeText: string,
  roleLevel: RoleLevel
): Array<{
  type: string;
  severity: string;
  description: string;
  evidence?: string;
}> {
  const redFlags: Array<{
    type: string;
    severity: string;
    description: string;
    evidence?: string;
  }> = [];
  const isEarlyCareer = isEarlyCareerRole(roleLevel);

  // Very short resume (less severe for entry-level)
  if (resumeLength < 200) {
    const severity = isEarlyCareer ? "low" : "medium";
    redFlags.push({
      type: "generic_resume",
      severity,
      description: "Resume is very short, may lack detail",
      evidence: `Resume length: ${resumeLength} words`,
    });
  }

  // Missing work experience: check for transferable experience for entry-level
  if (parsedResume.work_experience.length === 0) {
    if (isEarlyCareer) {
      const transferableSignals = detectTransferableSignals(resumeText);
      if (transferableSignals.length === 0) {
        // Entry-level with no work experience AND no transferable experience = medium severity
        redFlags.push({
          type: "missing_experience",
          severity: "medium", // Reduced from "high" for entry-level
          description: "No work experience detected. Consider adding internships, projects, or volunteer work.",
        });
      }
      // If transferable signals exist, don't flag as red flag (it's expected for entry-level)
    } else {
      // Senior roles: missing work experience is a high-severity red flag
      redFlags.push({
        type: "missing_experience",
        severity: "high",
        description: "No work experience detected",
      });
    }
  }

  // Very few skills (less severe for entry-level)
  if (parsedResume.skills.length < 3) {
    const severity = isEarlyCareer ? "low" : "medium";
    redFlags.push({
      type: "limited_skills",
      severity,
      description: "Very few skills listed",
      evidence: `Only ${parsedResume.skills.length} skill(s) detected`,
    });
  }

  return redFlags;
}

/**
 * Scores recruiter evaluation.
 * 
 * UPDATED WITH ROLE-LEVEL CALIBRATION:
 * - Entry-level: Reduced penalties for missing KPIs, increased weight on transferable skills
 * - Asymmetric penalties: missing nice-to-haves have minimal impact for entry-level
 * - Transferable signals (ownership, learning velocity) are positively weighted
 */
export function scoreRecruiter(
  parsedResume: ParsedResume,
  resumeText: string,
  recruiterPersona: string = "generic",
  roleLevel: RoleLevel = undefined
): RecruiterResult {
  const calibration = getRoleCalibrationFactors(roleLevel);
  const isEarlyCareer = isEarlyCareerRole(roleLevel);
  
  const careerProgression = calculateCareerProgression(parsedResume, resumeText, roleLevel);
  const jobStability = calculateJobStability(parsedResume);
  const resumeLength = resumeText.split(/\s+/).length;
  const redFlags = detectRedFlags(parsedResume, resumeLength, resumeText, roleLevel);

  // Detect transferable signals for entry-level roles
  const transferableSignals = isEarlyCareer ? detectTransferableSignals(resumeText) : [];

  // Calculate resume quality score (heuristic)
  // For entry-level, shorter resumes are more acceptable
  let resumeQualityScore = 0.7;
  if (resumeLength > 500 && resumeLength < 1500) {
    resumeQualityScore = 0.8;
  } else if (resumeLength < 200) {
    resumeQualityScore = isEarlyCareer ? 0.5 : 0.4; // Less penalty for entry-level
  }

  // Boost resume quality for entry-level if transferable signals exist
  if (isEarlyCareer && transferableSignals.length > 0) {
    const signalBoost = Math.min(0.1, transferableSignals.length * 0.02);
    resumeQualityScore = Math.min(0.9, resumeQualityScore + signalBoost);
  }

  // Calculate evaluation score (0-100)
  let evaluationScore = 100.0;

  // Deduct for red flags (penalties are already calibrated in detectRedFlags)
  for (const flag of redFlags) {
    if (flag.severity === "high") {
      evaluationScore -= 15;
    } else if (flag.severity === "medium") {
      evaluationScore -= 8;
    } else {
      evaluationScore -= 3;
    }
  }

  // Career progression: apply calibration
  // For entry-level, low progression is less penalized if transferable signals exist
  if (careerProgression.score < 0.5) {
    const penalty = 10 * calibration.missingExperiencePenaltyMultiplier;
    evaluationScore -= penalty;
  } else if (isEarlyCareer && transferableSignals.length > 0) {
    // Boost for transferable signals showing progression/initiative
    const boost = Math.min(5, transferableSignals.length * 1.5);
    evaluationScore = Math.min(100, evaluationScore + boost);
  }

  // Job stability: less important for entry-level (job hopping is more acceptable)
  if (jobStability.score < 0.5) {
    const penalty = isEarlyCareer ? 6 : 12; // 50% reduction for entry-level
    evaluationScore -= penalty;
  }

  evaluationScore = Math.max(0, Math.min(100, Math.round(evaluationScore * 100) / 100));

  // Calculate advancement probability
  let advancementProbability = 0.0;
  if (evaluationScore >= 75) {
    advancementProbability = 0.75;
  } else if (evaluationScore >= 60) {
    advancementProbability = 0.60;
  } else if (evaluationScore >= 45) {
    advancementProbability = 0.40;
  } else {
    advancementProbability = 0.20;
  }

  return {
    evaluation_score: evaluationScore,
    career_progression_score: careerProgression.score,
    job_stability_score: jobStability.score,
    resume_quality_score: resumeQualityScore,
    advancement_probability: advancementProbability,
    red_flags: redFlags,
    career_progression_analysis: {
      trajectory: careerProgression.trajectory,
      promotions_count: careerProgression.promotionsCount,
      responsibility_increase: careerProgression.responsibilityIncrease,
      title_progression: careerProgression.titleProgression,
    },
    job_stability_analysis: {
      average_tenure_months: jobStability.averageTenureMonths,
      short_tenure_jobs_count: jobStability.shortTenureJobsCount,
    },
    metadata: {
      recruiter_persona: recruiterPersona,
    },
  };
}

