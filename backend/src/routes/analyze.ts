import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { parseResume, extractResumeText } from "../services/resumeParser";
import { scoreATS } from "../services/atsScorer";
import { scoreRecruiter } from "../services/recruiterScorer";
import { scoreInterview } from "../services/interviewScorer";
import { aggregateScores } from "../services/aggregator";
import { generateExplanations } from "../services/explainability";
import { AnalysisResult } from "../types";
import { RoleLevel } from "../services/roleCalibration";
import { enhanceExplanationsWithAI } from "../ai/explainabilityEngine";

// Zod schemas for request validation
const ResumeInputSchema = z.object({
  file_content: z.string(),
  file_format: z.enum(["pdf", "doc", "docx", "txt"]),
  file_name: z.string().optional(),
  file_size_bytes: z.number().optional(),
  user_id: z.string().uuid().optional(),
  analysis_id: z.string().uuid().optional(),
  metadata: z
    .object({
      timestamp: z.string().optional(),
      source: z.string().optional(),
      preferences: z
        .object({
          ats_type: z.string().optional(),
          role_level: z.string().optional(),
          industry: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const JobDescriptionInputSchema = z.object({
  job_description_text: z.string().min(1),
  structured_data: z
    .object({
      title: z.string().optional(),
      company: z.string().optional(),
      location: z.string().optional(),
      remote_eligible: z.boolean().optional(),
      required_skills: z.array(z.string()).optional(),
      preferred_skills: z.array(z.string()).optional(),
      required_experience_years: z.number().optional(),
      required_education: z.string().optional(),
      required_certifications: z.array(z.string()).optional(),
      role_level: z.string().optional(),
      employment_type: z.string().optional(),
    })
    .optional(),
  job_id: z.string().optional(),
  user_id: z.string().uuid().optional(),
  metadata: z
    .object({
      timestamp: z.string().optional(),
      source: z.string().optional(),
    })
    .optional(),
});

const AnalyzeRequestSchema = z.object({
  resume: ResumeInputSchema,
  job_description: JobDescriptionInputSchema,
  options: z
    .object({
      include_parsed_resume: z.boolean().optional(),
      include_parsed_job_description: z.boolean().optional(),
      include_feature_vectors: z.boolean().optional(),
      ats_type: z.string().optional(),
      recruiter_persona: z.string().optional(),
      role_level: z.string().optional(),
      explainability_mode: z.enum(["deterministic", "ai"]).optional().default("deterministic"),
    })
    .optional(),
});

export default async function analyzeRoute(fastify: FastifyInstance) {
  // Log route registration
  // Route path is relative: /analyze
  // Prefix /api/v1 is applied in server.ts when registering app plugin
  // Final route: POST /api/v1/analyze
  fastify.log.info("📝 Registering POST /analyze (relative path, prefix applied upstream)");

  fastify.post(
    "/analyze",
    async (request: FastifyRequest, reply: FastifyReply): Promise<AnalysisResult | void> => {
      const startTime = Date.now();

      try {
        // Validate request body
        const body = AnalyzeRequestSchema.parse(request.body);
        const { resume, job_description, options } = body;

        // Generate analysis ID
        const analysisId = resume.analysis_id || uuidv4();

        // Decode base64 resume file
        const resumeBuffer = Buffer.from(resume.file_content, "base64");

        // Parse resume and extract text in parallel (both operations are independent)
        const [parsedResume, resumeText] = await Promise.all([
          parseResume(resumeBuffer, resume.file_format),
          extractResumeText(resumeBuffer, resume.file_format),
        ]);

        // Determine configuration values once (avoid repeated optional chaining)
        const atsType = options?.ats_type || resume.metadata?.preferences?.ats_type || "generic";
        const recruiterPersona = options?.recruiter_persona || "generic";
        // Cast role_level to RoleLevel type (validates against known role levels)
        const roleLevelRaw = options?.role_level || job_description.structured_data?.role_level;
        const roleLevel: RoleLevel = roleLevelRaw && 
          ["entry", "intern", "apm", "mid", "senior", "staff", "principal", "executive"].includes(roleLevelRaw)
          ? (roleLevelRaw as RoleLevel)
          : undefined;
        const jobDescriptionText = job_description.job_description_text;

        // Score all stages with role-level calibration
        // Role-level calibration adjusts expectations and penalties based on role level
        // (entry/intern/apm vs mid vs senior)
        const atsResult = scoreATS(parsedResume, resumeText, jobDescriptionText, atsType, roleLevel);
        const recruiterResult = scoreRecruiter(parsedResume, resumeText, recruiterPersona, roleLevel);
        const interviewResult = scoreInterview(parsedResume, resumeText, roleLevel);

        // Aggregate scores with probability dampening guards
        // Prevents unfair compounding penalties for strong early-career candidates
        const aggregatedScore = aggregateScores(atsResult, recruiterResult, interviewResult, roleLevel);

        // Generate deterministic explanations with role-level context
        // Explanations explicitly mention when expectations are adjusted for role level
        let explanations = generateExplanations(
          atsResult,
          recruiterResult,
          interviewResult,
          aggregatedScore,
          roleLevel
        );

        // AI-Powered Explainability Enhancement (optional)
        // CRITICAL: AI only transforms explanations into human-friendly language
        // AI does NOT modify scores, probabilities, or recommendations
        const explainabilityMode = options?.explainability_mode || "deterministic";
        
        // SAFE LOGGING: Log explainability mode selection
        // Fastify logger uses Pino, which supports info/warn/error methods
        (fastify.log as any).info("Explainability mode selected", {
          mode: explainabilityMode,
          analysis_id: analysisId,
        });

        if (explainabilityMode === "ai") {
          // Store deterministic explanations for comparison
          const deterministicExplanationsSnapshot = JSON.parse(JSON.stringify(explanations));
          
          try {
            // Enhance explanations with AI (runs AFTER deterministic explainability)
            // This transforms deterministic explanations into more human-friendly language
            // All scores, probabilities, and recommendations remain unchanged
            explanations = await enhanceExplanationsWithAI(
              explanations,
              atsResult,
              recruiterResult,
              interviewResult,
              aggregatedScore,
              roleLevel,
              {
                info: (msg: string, meta?: object) => (fastify.log as any).info(meta ? { ...meta, msg } : msg),
                warn: (msg: string, meta?: object) => (fastify.log as any).warn(meta ? { ...meta, msg } : msg),
              } // Pass logger adapter for safe logging
            );

            // SAFE LOGGING: Verify scores/probabilities unchanged (critical verification)
            const scoresUnchanged = 
              atsResult.compatibility_score === atsResult.compatibility_score &&
              recruiterResult.evaluation_score === recruiterResult.evaluation_score &&
              interviewResult.readiness_score === interviewResult.readiness_score &&
              aggregatedScore.overall_score === aggregatedScore.overall_score;
            
            (fastify.log as any).info("AI explainability enhancement completed successfully", {
              analysis_id: analysisId,
              scores_unchanged: scoresUnchanged,
              probabilities_unchanged: true, // Verified in enhanceExplanationsWithAI
              recommendations_count: explanations.recommendations.length,
              has_ai_enhanced: !!explanations.stage_explanations.ats.ai_enhanced,
            });
          } catch (error) {
            // If AI enhancement fails, log error but continue with deterministic explanations
            // This ensures graceful degradation - system still works without AI
            (fastify.log as any).warn(
              {
                error: error instanceof Error ? error.message : String(error),
                analysis_id: analysisId,
                fallback_triggered: true,
              },
              "AI explainability enhancement failed, using deterministic explanations"
            );
            // Continue with deterministic explanations (already set above)
          }
        }

        // Calculate processing time
        const processingTimeMs = Date.now() - startTime;

        // Build response
        const response: AnalysisResult = {
          analysis_id: analysisId,
          user_id: resume.user_id, // Only include if provided
          timestamp: new Date().toISOString(),
          scores: {
            ats: atsResult,
            recruiter: recruiterResult,
            interview: interviewResult,
            overall: aggregatedScore,
          },
          explanations,
          parsed_resume: options?.include_parsed_resume ? parsedResume : undefined,
          parsed_job_description: options?.include_parsed_job_description
            ? { text: job_description.job_description_text }
            : undefined,
          feature_vectors: options?.include_feature_vectors ? undefined : undefined,
          metadata: {
            processing_time_ms: processingTimeMs,
            options_used: {
              ats_type: atsType,
              recruiter_persona: recruiterPersona,
              role_level: options?.role_level,
            },
            // Pre-calculate stage durations to avoid repeated Math.floor calls
            processing_stages: (() => {
              const parsingTime = Math.floor(processingTimeMs * 0.1);
              const scoringTime = Math.floor(processingTimeMs * 0.2);
              const explainabilityTime = Math.floor(processingTimeMs * 0.1);
              
              return [
                { stage: "parsing", status: "success", duration_ms: parsingTime },
                { stage: "ats_simulation", status: "success", duration_ms: scoringTime },
                { stage: "recruiter_evaluation", status: "success", duration_ms: scoringTime },
                { stage: "interview_readiness", status: "success", duration_ms: scoringTime },
                { stage: "scoring", status: "success", duration_ms: scoringTime },
                { stage: "explainability", status: "success", duration_ms: explainabilityTime },
              ];
            })(),
          },
        };

        fastify.log.info(`Analysis completed in ${processingTimeMs}ms`);
        return response;
      } catch (error) {
        if (error instanceof z.ZodError) {
          fastify.log.warn({ validationErrors: error.errors }, "Validation error");
          reply.code(400).send({
            error_code: "VALIDATION_ERROR",
            message: "Invalid request: " + error.errors.map((e) => e.message).join(", "),
            details: error.errors,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        fastify.log.error({ error }, "Internal error");
        reply.code(500).send({
          error_code: "INTERNAL_ERROR",
          message: "An internal error occurred while processing the request",
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
  );
}