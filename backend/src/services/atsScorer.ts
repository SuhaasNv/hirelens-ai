import { ATSResult, ParsedResume } from "../types";

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
 * Calculates keyword match between resume and job description
 */
function calculateKeywordMatch(
  resumeText: string,
  jobKeywords: string[]
): {
  matched: string[];
  missing: string[];
  percentage: number;
} {
  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of jobKeywords) {
    if (resumeLower.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const percentage =
    jobKeywords.length > 0 ? (matched.length / jobKeywords.length) * 100 : 0;

  return {
    matched,
    missing,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Scores ATS compatibility based on resume and job description
 */
export function scoreATS(
  parsedResume: ParsedResume,
  resumeText: string,
  jobDescriptionText: string,
  atsType: string = "generic"
): ATSResult {
  // Extract required fields status
  const hasEmail = !!parsedResume.personal_info.email;
  const hasPhone = !!parsedResume.personal_info.phone;
  const hasWorkHistory = parsedResume.work_experience.length > 0;
  const hasEducation = parsedResume.education.length > 0;

  // Extract keywords from job description
  const jobKeywords = extractJobKeywords(jobDescriptionText);

  // Calculate keyword matching
  const keywordMatch = calculateKeywordMatch(resumeText, jobKeywords);

  // Calculate compatibility score (0-100)
  let compatibilityScore = 100.0;

  // Deduct for missing required fields
  if (!hasEmail) compatibilityScore -= 25;
  if (!hasPhone) compatibilityScore -= 25;
  if (!hasWorkHistory) compatibilityScore -= 30;

  // Deduct for low keyword match
  if (keywordMatch.percentage < 60) {
    const penalty = 60 - keywordMatch.percentage;
    compatibilityScore -= Math.min(penalty, 20);
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

  // Build keyword breakdown with location detection
  const matchedKeywordsWithLocation = keywordMatch.matched.map((keyword) => {
    // Simple heuristic: check where keyword appears
    let location = "experience";
    if (parsedResume.skills.some((s) => s.toLowerCase().includes(keyword.toLowerCase()))) {
      location = "skills";
    } else if (resumeText.toLowerCase().indexOf(keyword.toLowerCase()) < resumeText.length * 0.2) {
      location = "summary";
    }
    return {
      keyword,
      location,
      weight: location === "skills" ? 1.0 : location === "summary" ? 0.8 : 0.6,
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

