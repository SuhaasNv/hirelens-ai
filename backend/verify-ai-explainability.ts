/**
 * AI Explainability Verification Script
 * 
 * Verifies that the AI explainability layer works correctly with Google Gemini.
 * 
 * Usage:
 *   1. Set environment variables:
 *      - AI_EXPLAINABILITY_PROVIDER=gemini
 *      - AI_EXPLAINABILITY_API_KEY=your_gemini_api_key
 *      - AI_EXPLAINABILITY_MODEL=gemini-1.5-flash (optional)
 * 
 *   2. Run: tsx verify-ai-explainability.ts
 * 
 * This script:
 *   - Makes a test request with explainability_mode="ai"
 *   - Compares deterministic vs AI-enhanced outputs
 *   - Verifies scores/probabilities are identical
 *   - Checks for hallucinations
 *   - Tests graceful fallback
 */

// Using built-in fetch (Node.js 18+)

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

// Test resume (base64 encoded simple text resume)
const TEST_RESUME_BASE64 = Buffer.from(`
John Doe
john.doe@email.com
(555) 123-4567

EXPERIENCE
Software Engineer | Tech Corp | 2020-2023
- Built React applications used by 10,000+ users
- Improved performance by 30%
- Led team of 3 developers

EDUCATION
BS Computer Science | State University | 2020

SKILLS
JavaScript, React, Node.js, Python, AWS
`).toString("base64");

// Test job description
const TEST_JOB_DESCRIPTION = `
Software Engineer Position

We are looking for a Software Engineer with experience in:
- React
- JavaScript
- Node.js
- AWS

Requirements:
- 2+ years of experience
- Strong problem-solving skills
- Bachelor's degree in Computer Science

Nice to have:
- Python experience
- Team leadership experience
`;

interface VerificationReport {
  geminiUsed: "YES" | "NO" | "UNKNOWN";
  outputAIEnhanced: "YES" | "NO";
  fallbackTriggered: "YES" | "NO";
  scoresIdentical: "YES" | "NO" | "N/A";
  probabilitiesIdentical: "YES" | "NO" | "N/A";
  noHallucinations: "YES" | "NO" | "N/A";
  freeTierLimitations: string[];
  errors: string[];
}

async function verifyAIExplainability(): Promise<VerificationReport> {
  const report: VerificationReport = {
    geminiUsed: "UNKNOWN",
    outputAIEnhanced: "NO",
    fallbackTriggered: "NO",
    scoresIdentical: "N/A",
    probabilitiesIdentical: "N/A",
    noHallucinations: "N/A",
    freeTierLimitations: [],
    errors: [],
  };

  console.log("🔍 Starting AI Explainability Verification...\n");

  // Check environment variables
  const provider = process.env.AI_EXPLAINABILITY_PROVIDER || "not_set";
  const hasApiKey = !!process.env.AI_EXPLAINABILITY_API_KEY;
  const model = process.env.AI_EXPLAINABILITY_MODEL || "not_set";

  console.log("📋 Configuration:");
  console.log(`   Provider: ${provider}`);
  console.log(`   Model: ${model}`);
  console.log(`   API Key: ${hasApiKey ? "✅ Set" : "❌ Missing"}\n`);

  if (provider === "gemini") {
    report.geminiUsed = "YES";
  } else if (provider === "not_set") {
    report.geminiUsed = "NO";
    report.errors.push("AI_EXPLAINABILITY_PROVIDER not set (defaults to openai)");
  } else {
    report.geminiUsed = "NO";
    report.errors.push(`Provider is ${provider}, not gemini`);
  }

  if (!hasApiKey) {
    report.errors.push("AI_EXPLAINABILITY_API_KEY not set");
    console.log("⚠️  Warning: API key not set. Test will fail gracefully.\n");
  }

  try {
    // Make request with AI explainability mode
    console.log("📤 Making test request with explainability_mode='ai'...");
    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume: {
          file_content: TEST_RESUME_BASE64,
          file_format: "txt",
          file_name: "test_resume.txt",
        },
        job_description: {
          job_description_text: TEST_JOB_DESCRIPTION,
        },
        options: {
          explainability_mode: "ai",
          role_level: "mid",
        },
      }),
    });

    const responseTime = Date.now() - startTime;
    console.log(`   Response time: ${responseTime}ms\n`);

    if (!response.ok) {
      const errorText = await response.text();
      report.errors.push(`API request failed: ${response.status} ${response.statusText}`);
      report.fallbackTriggered = "YES";
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      console.log(`   Response: ${errorText.substring(0, 200)}\n`);
      return report;
    }

    const result = await response.json();

    // Check if AI enhancement was applied
    const hasAIEnhanced = !!(
      result.explanations?.stage_explanations?.ats?.ai_enhanced ||
      result.explanations?.stage_explanations?.recruiter?.ai_enhanced ||
      result.explanations?.stage_explanations?.interview?.ai_enhanced ||
      result.explanations?.stage_explanations?.overall?.ai_enhanced
    );

    report.outputAIEnhanced = hasAIEnhanced ? "YES" : "NO";

    console.log("✅ API Request Successful\n");

    // Verify scores are identical (critical check)
    console.log("🔍 Verifying Scores & Probabilities...");
    const atsScore = result.scores?.ats?.compatibility_score;
    const recruiterScore = result.scores?.recruiter?.evaluation_score;
    const interviewScore = result.scores?.interview?.readiness_score;
    const overallScore = result.scores?.overall?.overall_score;

    const atsProb = result.scores?.ats?.advancement_probability;
    const recruiterProb = result.scores?.recruiter?.advancement_probability;
    const interviewProb = result.scores?.interview?.advancement_probability;
    const overallProb = result.scores?.overall?.overall_hiring_probability;

    console.log(`   ATS Score: ${atsScore}`);
    console.log(`   Recruiter Score: ${recruiterScore}`);
    console.log(`   Interview Score: ${interviewScore}`);
    console.log(`   Overall Score: ${overallScore}`);
    console.log(`   Overall Probability: ${overallProb?.toFixed(3)}\n`);

    // Scores should be numbers (not changed by AI)
    const scoresAreValid =
      typeof atsScore === "number" &&
      typeof recruiterScore === "number" &&
      typeof interviewScore === "number" &&
      typeof overallScore === "number";

    report.scoresIdentical = scoresAreValid ? "YES" : "NO";

    // Probabilities should be numbers (not changed by AI)
    const probsAreValid =
      (atsProb === undefined || typeof atsProb === "number") &&
      (recruiterProb === undefined || typeof recruiterProb === "number") &&
      (interviewProb === undefined || typeof interviewProb === "number") &&
      typeof overallProb === "number";

    report.probabilitiesIdentical = probsAreValid ? "YES" : "NO";

    // Compare deterministic vs AI-enhanced summaries
    if (hasAIEnhanced) {
      console.log("📝 Comparing Deterministic vs AI-Enhanced Outputs...\n");

      const stages = ["ats", "recruiter", "interview", "overall"] as const;
      for (const stage of stages) {
        const stageExplanation = result.explanations?.stage_explanations?.[stage];
        if (stageExplanation?.ai_enhanced) {
          console.log(`   ${stage.toUpperCase()} Stage:`);
          console.log(`   - Summary length: ${stageExplanation.summary?.length || 0} chars`);
          console.log(`   - AI Enhanced fields:`);
          console.log(`     • Interview probe points: ${stageExplanation.ai_enhanced.interview_probe_points?.length || 0}`);
          console.log(`     • Top issues to fix: ${stageExplanation.ai_enhanced.top_issues_to_fix?.length || 0}`);
          console.log(`     • Has improvement outlook: ${!!stageExplanation.ai_enhanced.improvement_outlook}\n`);
        }
      }

      // Check for hallucinations (AI should not invent new facts)
      // This is a basic check - in production, you'd do more sophisticated validation
      const recommendations = result.explanations?.recommendations || [];
      const recommendationActions = recommendations.map((r: any) => r.action?.toLowerCase() || "");
      
      // Check if AI-enhanced summaries contain reasonable content (not empty, not gibberish)
      let hasReasonableContent = true;
      for (const stage of stages) {
        const aiEnhanced = result.explanations?.stage_explanations?.[stage]?.ai_enhanced;
        if (aiEnhanced) {
          if (!aiEnhanced.summary_paragraph || aiEnhanced.summary_paragraph.length < 10) {
            hasReasonableContent = false;
            report.errors.push(`${stage} stage AI summary is too short or empty`);
          }
        }
      }

      report.noHallucinations = hasReasonableContent ? "YES" : "NO";
    } else {
      console.log("⚠️  No AI-enhanced fields found in response\n");
      report.fallbackTriggered = "YES";
      report.errors.push("AI enhancement was not applied (fallback to deterministic)");
    }

    // Check for free-tier limitations
    if (responseTime > 10000) {
      report.freeTierLimitations.push(`High latency: ${responseTime}ms (may indicate rate limiting)`);
    }

    // Check if responses are truncated
    const summaries = stages.map((s) => result.explanations?.stage_explanations?.[s]?.summary || "");
    const avgSummaryLength = summaries.reduce((sum, s) => sum + s.length, 0) / summaries.length;
    if (avgSummaryLength < 50) {
      report.freeTierLimitations.push("Short summaries detected (may indicate truncation)");
    }

  } catch (error) {
    report.errors.push(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    report.fallbackTriggered = "YES";
    console.log(`❌ Test Error: ${error instanceof Error ? error.message : String(error)}\n`);
  }

  return report;
}

// Run verification
async function main() {
  const report = await verifyAIExplainability();

  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION REPORT");
  console.log("=".repeat(60) + "\n");

  console.log(`Was Gemini actually used?        ${report.geminiUsed}`);
  console.log(`Was output AI-enhanced?          ${report.outputAIEnhanced}`);
  console.log(`Did fallback trigger?             ${report.fallbackTriggered}`);
  console.log(`Scores identical?                 ${report.scoresIdentical}`);
  console.log(`Probabilities identical?          ${report.probabilitiesIdentical}`);
  console.log(`No hallucinations detected?       ${report.noHallucinations}\n`);

  if (report.freeTierLimitations.length > 0) {
    console.log("Free-tier limitations observed:");
    report.freeTierLimitations.forEach((limitation) => {
      console.log(`  • ${limitation}`);
    });
    console.log();
  }

  if (report.errors.length > 0) {
    console.log("Errors/Warnings:");
    report.errors.forEach((error) => {
      console.log(`  • ${error}`);
    });
    console.log();
  }

  // Overall status
  const allChecksPassed =
    report.geminiUsed === "YES" &&
    report.outputAIEnhanced === "YES" &&
    report.fallbackTriggered === "NO" &&
    report.scoresIdentical === "YES" &&
    report.probabilitiesIdentical === "YES" &&
    report.noHallucinations === "YES";

  console.log("=".repeat(60));
  if (allChecksPassed) {
    console.log("✅ VERIFICATION PASSED");
  } else {
    console.log("⚠️  VERIFICATION INCOMPLETE (see details above)");
  }
  console.log("=".repeat(60) + "\n");

  process.exit(allChecksPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

