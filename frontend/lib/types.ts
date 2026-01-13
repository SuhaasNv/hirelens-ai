/**
 * TypeScript interfaces for HireLens AI API types.
 * Aligned with backend API contracts in docs/contracts/data_models.md
 */

// Request Types
export interface ResumeInput {
  file_content: string; // Base64-encoded
  file_format: "pdf" | "doc" | "docx" | "txt";
  file_name?: string;
  file_size_bytes?: number;
  user_id?: string;
  analysis_id?: string;
  metadata?: {
    timestamp?: string;
    source?: string;
    preferences?: {
      ats_type?: string;
      role_level?: string;
      industry?: string;
    };
  };
}

export interface JobDescriptionInput {
  job_description_text: string;
  structured_data?: {
    title?: string;
    company?: string;
    location?: string;
    remote_eligible?: boolean;
    required_skills?: string[];
    preferred_skills?: string[];
    required_experience_years?: number;
    required_education?: string;
    required_certifications?: string[];
    role_level?: string;
    employment_type?: string;
  };
  job_id?: string;
  user_id?: string;
  metadata?: {
    timestamp?: string;
    source?: string;
  };
}

export interface AnalyzeOptions {
  include_parsed_resume?: boolean;
  include_parsed_job_description?: boolean;
  include_feature_vectors?: boolean;
  ats_type?: string;
  recruiter_persona?: string;
  role_level?: string;
}

export interface AnalyzeRequest {
  resume: ResumeInput;
  job_description: JobDescriptionInput;
  options?: AnalyzeOptions;
}

// Response Types
export interface ATSResult {
  parse_success_probability?: number;
  keyword_match_score?: number;
  keyword_match_percentage: number;
  compatibility_score: number;
  advancement_probability?: number;
  required_fields_status: {
    email: boolean;
    phone: boolean;
    work_history: boolean;
    education: boolean;
    all_present: boolean;
  };
  keyword_breakdown: {
    matched_keywords: Array<{
      keyword: string;
      location: string;
      weight: number;
    }>;
    missing_keywords: string[];
    total_required: number;
    total_matched: number;
  };
  hard_filters?: {
    experience_met?: boolean;
    education_met?: boolean;
    certifications_met?: boolean;
    all_met?: boolean;
  };
  rejection_reasons?: string[];
  ats_type?: string;
}

export interface RecruiterResult {
  evaluation_score: number;
  career_progression_score: number;
  job_stability_score: number;
  resume_quality_score?: number;
  advancement_probability?: number;
  estimated_review_time_seconds?: number;
  red_flags: Array<{
    type: string;
    severity: string;
    description: string;
    evidence?: string;
  }>;
  career_progression_analysis?: {
    trajectory: string;
    promotions_count?: number;
    responsibility_increase?: boolean;
    title_progression?: string[];
  };
  job_stability_analysis?: {
    average_tenure_months: number;
    short_tenure_jobs_count: number;
    employment_gaps?: Array<{
      start_date: string;
      end_date: string;
      duration_months: number;
    }>;
  };
  metadata?: {
    recruiter_persona?: string;
    model_version?: string;
  };
}

export interface InterviewReadinessResult {
  readiness_score: number;
  defensibility_score?: number;
  advancement_probability?: number;
  resume_claims: Array<{
    claim_text: string;
    claim_type: string;
    defensibility_score: number;
    depth_indicator: string;
    consistency_risk?: string;
    supporting_evidence?: string[];
  }>;
  predicted_questions: Array<{
    question: string;
    likelihood: number;
    question_type: string;
    related_claim?: string;
    reasoning?: string;
  }>;
  consistency_risks: Array<{
    risk_type: string;
    severity: string;
    description: string;
    related_claim?: string;
    mitigation_suggestion?: string;
  }>;
}

export interface AggregatedScore {
  overall_hiring_probability: number;
  overall_hiring_probability_confidence_interval: {
    lower: number;
    upper: number;
    confidence_level: number;
  };
  stage_probabilities: {
    ats_pass: number;
    recruiter_pass: number;
    interview_pass: number;
    offer: number;
  };
  overall_score: number;
  signal_compounding_analysis?: {
    positive_signals?: Array<{
      signal: string;
      stages_affected: string[];
      compound_effect?: number;
    }>;
    negative_signals?: Array<{
      signal: string;
      stages_affected: string[];
      compound_effect?: number;
    }>;
  };
  risk_factors: Array<{
    factor: string;
    stage: string;
    impact_on_overall_probability: number;
    severity: string;
    description: string;
  }>;
  component_contributions?: {
    ats_contribution?: number;
    recruiter_contribution?: number;
    interview_contribution?: number;
  };
}

export interface AnalysisResult {
  analysis_id: string;
  user_id?: string;
  timestamp: string;
  scores: {
    ats: ATSResult;
    recruiter: RecruiterResult;
    interview: InterviewReadinessResult;
    overall: AggregatedScore;
  };
  explanations: {
    stage_explanations: {
      ats: {
        summary: string;
        key_factors: string[];
        score_breakdown?: string;
        ai_enhanced?: {
          interview_probe_points: string[];
          top_issues_to_fix: Array<{
            issue: string;
            why_it_matters: string;
            priority: "low" | "medium" | "high" | "critical";
          }>;
          improvement_outlook: string;
        };
      };
      recruiter: {
        summary: string;
        key_factors: string[];
        score_breakdown?: string;
        ai_enhanced?: {
          interview_probe_points: string[];
          top_issues_to_fix: Array<{
            issue: string;
            why_it_matters: string;
            priority: "low" | "medium" | "high" | "critical";
          }>;
          improvement_outlook: string;
        };
      };
      interview: {
        summary: string;
        key_factors: string[];
        score_breakdown?: string;
        ai_enhanced?: {
          interview_probe_points: string[];
          top_issues_to_fix: Array<{
            issue: string;
            why_it_matters: string;
            priority: "low" | "medium" | "high" | "critical";
          }>;
          improvement_outlook: string;
        };
      };
      overall: {
        summary: string;
        key_factors: string[];
        score_breakdown?: string;
        ai_enhanced?: {
          interview_probe_points: string[];
          top_issues_to_fix: Array<{
            issue: string;
            why_it_matters: string;
            priority: "low" | "medium" | "high" | "critical";
          }>;
          improvement_outlook: string;
        };
      };
    };
    recommendations: Array<{
      priority: string;
      category: string;
      action: string;
      impact: string;
      reasoning: string;
      stage_affected: string;
      impact_score_delta?: number;
      impact_probability_delta?: number;
    }>;
    counterfactuals?: Array<{
      scenario: string;
      change_description: string;
      expected_impact: {
        score_delta: number;
        probability_delta: number;
        stage_impacts?: Record<string, number>;
      };
    }>;
  };
  parsed_resume?: unknown;
  parsed_job_description?: unknown;
  feature_vectors?: unknown;
  metadata: {
    processing_time_ms: number;
    service_versions?: Record<string, string>;
    processing_stages?: Array<{
      stage: string;
      status: string;
      duration_ms?: number;
      warnings?: string[];
    }>;
    options_used?: {
      ats_type?: string;
      recruiter_persona?: string;
      role_level?: string;
    };
  };
}

export interface ErrorResponse {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
  timestamp: string;
}

