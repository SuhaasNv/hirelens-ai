import { ATSResult, ParsedResume } from "../types";
import {
  RoleLevel,
  getRoleCalibrationFactors,
  classifySignalType,
  detectTransferableSignals,
} from "./roleCalibration";

/**
 * Extracts keywords from job description text
 */
function extractJobKeywords(jobDescriptionText: string): string[] {
  const commonTechKeywords = [
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "angular",
    "vue",
    "node.js",
    "aws",
    "azure",
    "docker",
    "kubernetes",
    "sql",
    "mongodb",
    "postgresql",
    "git",
    "agile",
    "scrum",
    "machine learning",
    "data science",
  ];

  const textLower = jobDescriptionText.toLowerCase();
  const foundKeywords: string[] = [];

  for (const keyword of commonTechKeywords) {
    if (textLower.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }

  return foundKeywords;
}

/**
 * Calculates keyword match between resume and job description.
 * 
 * UPDATED: Now distinguishes between direct, transferable, and potential signals.
 * Transferable signals (proxy experience) are positively weighted for entry-level roles.
 */
function calculateKeywordMatch(
  resumeText: string,
  jobKeywords: string[],
  jobDescriptionText: string,
  roleLevel: RoleLevel
): {
  matched: string[];
  missing: string[];
  percentage: number;
  directSignals: number;
  transferableSignals: number;
  potentialSignals: number;
} {
  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  let directSignals = 0;
  let transferableSignals = 0;
  let potentialSignals = 0;

  const calibration = getRoleCalibrationFactors(roleLevel);

  for (const keyword of jobKeywords) {
    const signalType = classifySignalType(keyword, resumeText, jobDescriptionText);
    
    if (signalType === "direct") {
      matched.push(keyword);
      directSignals++;
    } else if (signalType === "transferable") {
      // Transferable signals count as partial matches for entry-level roles
      if (calibration.transferableSkillWeightMultiplier > 1.0) {
        matched.push(keyword);
        transferableSignals++;
      } else {
        missing.push(keyword);
      }
    } else {
      missing.push(keyword);
      potentialSignals++;
    }
  }

  // Calculate weighted percentage: direct signals count fully, transferable signals count partially
  const directWeight = 1.0;
  const transferableWeight = calibration.transferableSkillWeightMultiplier * 0.6; // Transferable = 60% of direct
  const weightedMatches = directSignals * directWeight + transferableSignals * transferableWeight;
  const percentage =
    jobKeywords.length > 0 ? (weightedMatches / jobKeywords.length) * 100 : 0;

  return {
    matched,
    missing,
    percentage: Math.round(percentage * 100) / 100,
    directSignals,
    transferableSignals,
    potentialSignals,
  };
}

/**
 * Scores ATS compatibility based on resume and job description.
 * 
 * UPDATED WITH ROLE-LEVEL CALIBRATION:
 * - Entry-level roles: Reduced penalties for missing nice-to-have keywords
 * - Transferable signals (proxy experience) are positively weighted
 * - Missing work history is less penalized for entry-level (internships/projects count)
 */
export function scoreATS(
  parsedResume: ParsedResume,
  resumeText: string,
  jobDescriptionText: string,
  atsType: string = "generic",
  roleLevel: RoleLevel = undefined
): ATSResult {
  // Get role-level calibration factors
  const calibration = getRoleCalibrationFactors(roleLevel);
  const isEarlyCareer = roleLevel === "entry" || roleLevel === "intern" || roleLevel === "apm";

  // Extract required fields status
  const hasEmail = !!parsedResume.personal_info.email;
  const hasPhone = !!parsedResume.personal_info.phone;
  const hasWorkHistory = parsedResume.work_experience.length > 0;
  const hasEducation = parsedResume.education.length > 0;
  
  // For entry-level roles, check for transferable experience (internships, projects)
  const hasTransferableExperience = isEarlyCareer && (
    resumeText.toLowerCase().includes("internship") ||
    resumeText.toLowerCase().includes("project") ||
    resumeText.toLowerCase().includes("hackathon") ||
    resumeText.toLowerCase().includes("volunteer")
  );

  // Extract keywords from job description
  const jobKeywords = extractJobKeywords(jobDescriptionText);

  // Calculate keyword matching with signal type classification
  const keywordMatch = calculateKeywordMatch(resumeText, jobKeywords, jobDescriptionText, roleLevel);

  // Calculate compatibility score (0-100)
  let compatibilityScore = 100.0;

  // Deduct for missing required fields (hard requirements still matter)
  if (!hasEmail) compatibilityScore -= 25;
  if (!hasPhone) compatibilityScore -= 25;
  
  // Work history penalty: reduced for entry-level if transferable experience exists
  if (!hasWorkHistory) {
    if (isEarlyCareer && hasTransferableExperience) {
      // Entry-level with transferable experience: reduced penalty
      compatibilityScore -= 15; // 50% reduction (30 -> 15)
    } else {
      compatibilityScore -= 30; // Full penalty for senior roles or no transferable experience
    }
  }

  // Keyword match penalty: asymmetric based on role level
  // For entry-level, missing nice-to-have keywords have minimal impact
  if (keywordMatch.percentage < 60) {
    const penalty = 60 - keywordMatch.percentage;
    // Apply calibration: entry-level roles get reduced penalty for missing keywords
    const adjustedPenalty = penalty * calibration.missingNiceToHavePenaltyMultiplier;
    compatibilityScore -= Math.min(adjustedPenalty, 20);
  }

  // Boost for transferable signals in entry-level roles
  if (isEarlyCareer && keywordMatch.transferableSignals > 0) {
    const transferableBoost = keywordMatch.transferableSignals * 2; // Small boost per transferable signal
    compatibilityScore = Math.min(100, compatibilityScore + transferableBoost);
  }

  compatibilityScore = Math.max(0, Math.min(100, Math.round(compatibilityScore * 100) / 100));

  // Calculate advancement probability (heuristic mapping)
  let advancementProbability = 0.0;
  if (compatibilityScore >= 80) {
    advancementProbability = 0.85;
  } else if (compatibilityScore >= 60) {
    advancementProbability = 0.65;
  } else if (compatibilityScore >= 40) {
    advancementProbability = 0.40;
  } else {
    advancementProbability = 0.15;
  }

  // Generate rejection reasons
  const rejectionReasons: string[] = [];
  if (!hasEmail) rejectionReasons.push("Missing required field: email");
  if (!hasPhone) rejectionReasons.push("Missing required field: phone");
  if (!hasWorkHistory) rejectionReasons.push("Missing required field: work history");
  if (keywordMatch.percentage < 50) {
    rejectionReasons.push(
      `Low keyword match: ${keywordMatch.percentage.toFixed(1)}% (missing ${keywordMatch.missing.length} keywords)`
    );
  }

  // Build keyword breakdown with location detection and signal type
  const matchedKeywordsWithLocation = keywordMatch.matched.map((keyword) => {
    // Simple heuristic: check where keyword appears
    let location = "experience";
    if (parsedResume.skills.some((s) => s.toLowerCase().includes(keyword.toLowerCase()))) {
      location = "skills";
    } else if (resumeText.toLowerCase().indexOf(keyword.toLowerCase()) < resumeText.length * 0.2) {
      location = "summary";
    }
    
    // Determine if this is a direct or transferable signal
    const signalType = classifySignalType(keyword, resumeText, jobDescriptionText);
    const baseWeight = location === "skills" ? 1.0 : location === "summary" ? 0.8 : 0.6;
    
    // Apply calibration: transferable signals get higher weight for entry-level
    const weight = signalType === "transferable" && isEarlyCareer
      ? baseWeight * calibration.transferableSkillWeightMultiplier
      : baseWeight;
    
    return {
      keyword,
      location,
      weight: Math.min(1.5, weight), // Cap at 1.5x
    };
  });

  return {
    keyword_match_percentage: keywordMatch.percentage,
    compatibility_score: compatibilityScore,
    advancement_probability: advancementProbability,
    required_fields_status: {
      email: hasEmail,
      phone: hasPhone,
      work_history: hasWorkHistory,
      education: hasEducation,
      all_present: hasEmail && hasPhone && hasWorkHistory,
    },
    keyword_breakdown: {
      matched_keywords: matchedKeywordsWithLocation,
      missing_keywords: keywordMatch.missing,
      total_required: jobKeywords.length,
      total_matched: keywordMatch.matched.length,
    },
    rejection_reasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
    ats_type: atsType,
  };
}

