import { RecruiterResult, ParsedResume } from "../types";

/**
 * Calculates career progression score based on work experience
 */
function calculateCareerProgression(parsedResume: ParsedResume): {
  score: number;
  trajectory: string;
  promotionsCount?: number;
  responsibilityIncrease?: boolean;
  titleProgression?: string[];
} {
  const workExp = parsedResume.work_experience;

  if (workExp.length === 0) {
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
 * Detects red flags in resume
 */
function detectRedFlags(parsedResume: ParsedResume, resumeLength: number): Array<{
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

  // Very short resume
  if (resumeLength < 200) {
    redFlags.push({
      type: "generic_resume",
      severity: "medium",
      description: "Resume is very short, may lack detail",
      evidence: `Resume length: ${resumeLength} words`,
    });
  }

  // Missing work experience
  if (parsedResume.work_experience.length === 0) {
    redFlags.push({
      type: "missing_experience",
      severity: "high",
      description: "No work experience detected",
    });
  }

  // Very few skills
  if (parsedResume.skills.length < 3) {
    redFlags.push({
      type: "limited_skills",
      severity: "medium",
      description: "Very few skills listed",
      evidence: `Only ${parsedResume.skills.length} skill(s) detected`,
    });
  }

  return redFlags;
}

/**
 * Scores recruiter evaluation
 */
export function scoreRecruiter(
  parsedResume: ParsedResume,
  resumeText: string,
  recruiterPersona: string = "generic"
): RecruiterResult {
  const careerProgression = calculateCareerProgression(parsedResume);
  const jobStability = calculateJobStability(parsedResume);
  const resumeLength = resumeText.split(/\s+/).length;
  const redFlags = detectRedFlags(parsedResume, resumeLength);

  // Calculate resume quality score (heuristic)
  let resumeQualityScore = 0.7;
  if (resumeLength > 500 && resumeLength < 1500) {
    resumeQualityScore = 0.8;
  } else if (resumeLength < 200) {
    resumeQualityScore = 0.4;
  }

  // Calculate evaluation score (0-100)
  let evaluationScore = 100.0;

  // Deduct for red flags
  for (const flag of redFlags) {
    if (flag.severity === "high") {
      evaluationScore -= 15;
    } else if (flag.severity === "medium") {
      evaluationScore -= 8;
    } else {
      evaluationScore -= 3;
    }
  }

  // Deduct for low career progression
  if (careerProgression.score < 0.5) {
    evaluationScore -= 10;
  }

  // Deduct for low job stability
  if (jobStability.score < 0.5) {
    evaluationScore -= 12;
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

