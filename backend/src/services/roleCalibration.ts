/**
 * Role-level calibration utilities for HireLens AI.
 * 
 * This module provides calibration factors and logic to adjust scoring
 * based on role level (entry, intern, apm, mid, senior).
 * 
 * REAL-WORLD CONTEXT:
 * - Entry-level roles prioritize potential, learning velocity, and transferable skills
 * - Senior roles require proven track record, KPIs, and domain expertise
 * - Missing "nice-to-haves" should minimally impact entry-level candidates
 * - Transferable experience should be positively weighted, not weakly substituted
 */

export type RoleLevel = "entry" | "intern" | "apm" | "mid" | "senior" | "staff" | "principal" | "executive" | undefined;

/**
 * Determines if a role level is considered "early-career" (entry, intern, apm).
 * These roles require different calibration than mid/senior roles.
 */
export function isEarlyCareerRole(roleLevel: RoleLevel): boolean {
  if (!roleLevel) return false;
  return roleLevel === "entry" || roleLevel === "intern" || roleLevel === "apm";
}

/**
 * Gets calibration factors for a given role level.
 * 
 * These factors adjust:
 * - Penalty weights (how much missing items cost)
 * - Signal weights (how much different signals contribute)
 * - Probability floors (minimum probabilities for strong candidates)
 */
export interface RoleCalibrationFactors {
  // Penalty multipliers (0.0 = no penalty, 1.0 = full penalty)
  missingKpiPenaltyMultiplier: number;      // Penalty for missing revenue/KPI metrics
  missingNiceToHavePenaltyMultiplier: number; // Penalty for missing nice-to-have skills
  missingExperiencePenaltyMultiplier: number;  // Penalty for missing years of experience
  vagueClaimPenaltyMultiplier: number;         // Penalty for vague resume claims
  
  // Signal weight multipliers (1.0 = standard weight, >1.0 = increased weight)
  transferableSkillWeightMultiplier: number;   // Weight for transferable/proxy experience
  learningVelocityWeightMultiplier: number;    // Weight for learning/initiative signals
  ownershipWeightMultiplier: number;           // Weight for ownership/leadership signals
  directMatchWeightMultiplier: number;         // Weight for direct JD match
  
  // Probability floor (minimum probability for strong candidates)
  probabilityFloor: number;                    // Soft floor when ATS ≥ 0.75 and recruiter signal ≥ medium
}

/**
 * Returns calibration factors based on role level.
 * 
 * ENTRY/INTERN/APM ROLES:
 * - Reduced penalties for missing KPIs (candidates don't have revenue impact yet)
 * - Reduced penalties for missing nice-to-haves (these are learning opportunities)
 * - Increased weight on transferable skills (college projects, internships, side projects)
 * - Increased weight on learning velocity (shows ability to grow)
 * - Higher probability floor (strong early-career candidates shouldn't be unfairly penalized)
 * 
 * SENIOR ROLES:
 * - Full penalties for missing KPIs (proven impact is required)
 * - Full penalties for missing nice-to-haves (expected expertise)
 * - Standard weights (direct match is most important)
 * - Lower probability floor (higher standards)
 */
export function getRoleCalibrationFactors(roleLevel: RoleLevel): RoleCalibrationFactors {
  const isEarlyCareer = isEarlyCareerRole(roleLevel);
  
  if (isEarlyCareer) {
    // EARLY-CAREER CALIBRATION (Entry, Intern, APM)
    return {
      // Reduced penalties: missing KPIs is expected for entry-level
      missingKpiPenaltyMultiplier: 0.2,  // 80% reduction: entry-level candidates rarely have revenue KPIs
      missingNiceToHavePenaltyMultiplier: 0.3, // 70% reduction: nice-to-haves are learning opportunities
      missingExperiencePenaltyMultiplier: 0.4,  // 60% reduction: less experience is expected
      vagueClaimPenaltyMultiplier: 0.5,        // 50% reduction: less polished resumes are normal
      
      // Increased weights: transferable skills and potential matter more
      transferableSkillWeightMultiplier: 1.5,  // 50% increase: college projects, internships count
      learningVelocityWeightMultiplier: 1.6,   // 60% increase: ability to learn is critical
      ownershipWeightMultiplier: 1.4,          // 40% increase: ownership even in small scope matters
      directMatchWeightMultiplier: 0.9,        // 10% reduction: direct match less critical than potential
      
      // Higher probability floor: prevent unfair compounding penalties
      probabilityFloor: 0.25,  // Strong early-career candidates (ATS ≥ 0.75) should have at least 25% overall probability
    };
  } else if (roleLevel === "mid") {
    // MID-LEVEL CALIBRATION
    return {
      missingKpiPenaltyMultiplier: 0.6,        // Moderate penalty: some impact expected
      missingNiceToHavePenaltyMultiplier: 0.7, // Moderate penalty: most nice-to-haves expected
      missingExperiencePenaltyMultiplier: 0.8,  // Higher penalty: experience is important
      vagueClaimPenaltyMultiplier: 0.8,       // Higher penalty: should have polished claims
      
      transferableSkillWeightMultiplier: 1.1,  // Slight increase: transferable skills still valuable
      learningVelocityWeightMultiplier: 1.2,   // Slight increase: growth mindset matters
      ownershipWeightMultiplier: 1.1,          // Slight increase: ownership is important
      directMatchWeightMultiplier: 1.0,        // Standard weight
      
      probabilityFloor: 0.15,  // Moderate floor
    };
  } else {
    // SENIOR-LEVEL CALIBRATION (Senior, Staff, Principal, Executive, or undefined)
    return {
      // Full penalties: proven track record required
      missingKpiPenaltyMultiplier: 1.0,        // Full penalty: revenue impact is required
      missingNiceToHavePenaltyMultiplier: 1.0, // Full penalty: expertise expected
      missingExperiencePenaltyMultiplier: 1.0, // Full penalty: experience is critical
      vagueClaimPenaltyMultiplier: 1.0,       // Full penalty: polished claims required
      
      // Standard weights: direct match is most important
      transferableSkillWeightMultiplier: 1.0,  // Standard: direct experience preferred
      learningVelocityWeightMultiplier: 0.9,   // Slight reduction: proven ability > potential
      ownershipWeightMultiplier: 1.0,          // Standard: ownership expected
      directMatchWeightMultiplier: 1.1,       // Slight increase: direct match is critical
      
      probabilityFloor: 0.10,  // Lower floor: higher standards
    };
  }
}

/**
 * Detects transferable signals in resume text.
 * 
 * Transferable signals are experiences that demonstrate relevant skills
 * even if not in the exact same domain (e.g., PM thinking from product
 * management class, leadership from club president role).
 */
export interface TransferableSignal {
  type: "transferable_skill" | "learning_velocity" | "ownership" | "leadership";
  evidence: string;
  strength: "weak" | "medium" | "strong";
  relevance: number; // 0-1, how relevant to the role
}

/**
 * Detects transferable signals from resume text.
 * 
 * REAL-WORLD CONTEXT:
 * - Entry-level candidates often have transferable experience (projects, internships, clubs)
 * - These signals should be positively weighted, not treated as weak substitutes
 * - Examples: "Led team of 5" (leadership), "Built web app" (ownership), "Learned React in 2 weeks" (learning velocity)
 */
export function detectTransferableSignals(resumeText: string): TransferableSignal[] {
  const signals: TransferableSignal[] = [];
  const textLower = resumeText.toLowerCase();
  
  // Learning velocity signals (ability to learn quickly)
  const learningVelocityPatterns = [
    /\blearned\s+\w+\s+in\s+\d+\s+(week|month)/i,
    /\bself[- ]taught\b/i,
    /\bquickly\s+(learned|mastered|picked up)\b/i,
    /\brapidly\s+(learned|mastered|picked up)\b/i,
  ];
  
  for (const pattern of learningVelocityPatterns) {
    if (pattern.test(resumeText)) {
      signals.push({
        type: "learning_velocity",
        evidence: "Demonstrates ability to learn quickly",
        strength: "medium",
        relevance: 0.7,
      });
      break; // Only count once
    }
  }
  
  // Ownership signals (took ownership of something)
  const ownershipPatterns = [
    /\b(owned|led|managed|built|created|founded|started)\s+(a|an|the)\s+\w+/i,
    /\bresponsible\s+for\s+(building|creating|developing|managing)/i,
    /\bfrom\s+scratch/i,
  ];
  
  for (const pattern of ownershipPatterns) {
    if (pattern.test(resumeText)) {
      signals.push({
        type: "ownership",
        evidence: "Demonstrates ownership and initiative",
        strength: "medium",
        relevance: 0.8,
      });
      break;
    }
  }
  
  // Leadership signals (led teams, organized events)
  const leadershipPatterns = [
    /\bled\s+(a|an|team of|group of)\s+\d+/i,
    /\bpresident|vice president|director|chair|organizer/i,
    /\bmanaged\s+\d+\s+(people|members|volunteers)/i,
  ];
  
  for (const pattern of leadershipPatterns) {
    if (pattern.test(resumeText)) {
      signals.push({
        type: "leadership",
        evidence: "Demonstrates leadership experience",
        strength: "strong",
        relevance: 0.9,
      });
      break;
    }
  }
  
  // Transferable skill signals (relevant skills from different contexts)
  const transferableSkillPatterns = [
    /\b(project|side project|personal project|hackathon|competition)/i,
    /\binternship|co[- ]op|part[- ]time/i,
    /\bvolunteer|volunteering/i,
  ];
  
  for (const pattern of transferableSkillPatterns) {
    if (pattern.test(resumeText)) {
      signals.push({
        type: "transferable_skill",
        evidence: "Transferable experience from projects or internships",
        strength: "medium",
        relevance: 0.6,
      });
      break;
    }
  }
  
  return signals;
}

/**
 * Determines if a signal is "direct" (exact JD match), "transferable" (proxy experience),
 * or "potential" (initiative, learning velocity).
 */
export type SignalType = "direct" | "transferable" | "potential";

/**
 * Classifies a keyword match as direct, transferable, or potential signal.
 */
export function classifySignalType(
  keyword: string,
  resumeText: string,
  jobDescriptionText: string
): SignalType {
  const resumeLower = resumeText.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  // Direct signal: keyword appears in resume in similar context to JD
  if (resumeLower.includes(keywordLower)) {
    // Check if it's in a professional context (work experience, skills section)
    const professionalContexts = [
      /\b(worked|developed|built|implemented|used|experience with)\s+.*?\b" + keywordLower + "\b/i,
      /\b(skills?|technologies?|tools?)[\s:].*?\b" + keywordLower + "\b/i,
    ];
    
    for (const context of professionalContexts) {
      if (context.test(resumeText)) {
        return "direct";
      }
    }
    
    // If keyword appears but not in clear professional context, it might be transferable
    return "transferable";
  }
  
  // Potential signal: related concepts that show understanding
  // (This is a simplified heuristic; in production, you'd use semantic similarity)
  return "potential";
}

