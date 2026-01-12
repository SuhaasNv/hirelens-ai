# HireLens AI System Architecture

## Document Information

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Design Phase  
**Authors**: Engineering Team  
**Reviewers**: TBD

---

## Executive Summary

This document describes the high-level system architecture for HireLens AI, an explainable AI resume and interview intelligence platform. The architecture is designed to accurately model the hiring funnel across three stages (ATS → Recruiter → Interviewer) while providing transparent, explainable recommendations at each stage.

**Key Design Principles:**
- API-first architecture for maximum flexibility and integration
- Modular, service-oriented design for independent scaling and deployment
- Explainability built into every stage, not added as an afterthought
- Minimal reliance on LLMs; use deterministic logic where possible
- Clear separation between deterministic and probabilistic components

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Applications                      │
│              (Web, Mobile, CLI, Third-party Integrations)        │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                        API Gateway                                │
│  • Authentication & Authorization                                │
│  • Rate Limiting                                                 │
│  • Request Routing                                               │
│  • Request/Response Transformation                              │
└─────────────────────────────┬────────────────────────────────────┘
                              │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
│  Ingestion     │   │  Analysis       │   │  Explainability │
│  Service       │   │  Orchestrator   │   │  Service        │
└───────┬────────┘   └────────┬────────┘   └────────┬────────┘
        │                     │                      │
        │                     │                      │
┌───────▼──────────────────────▼──────────────────────▼────────┐
│                    Core Processing Services                   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Parsing    │  │   Feature   │  │   ATS        │      │
│  │   Service    │  │ Extraction  │  │ Simulation   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Recruiter   │  │  Interview   │  │   Scoring    │      │
│  │  Evaluation  │  │  Readiness   │  │ & Aggregation│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                    Data & Model Layer                             │
│  • Structured Resume Data                                         │
│  • Job Description Data                                           │
│  • Feature Vectors                                                │
│  • Model Artifacts                                                │
│  • Explainability Metadata                                        │
└───────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. API Gateway

**Responsibility:**
- Single entry point for all client requests
- Authentication and authorization
- Rate limiting and quota management
- Request routing to appropriate services
- Request/response transformation and validation
- API versioning

**Inputs:**
- HTTP/HTTPS requests from clients
- Authentication tokens (JWT, API keys)
- Request metadata (user ID, subscription tier, etc.)

**Outputs:**
- Routed requests to backend services
- Transformed responses to clients
- Error responses with appropriate status codes

**Deterministic vs Probabilistic:**
- **Deterministic**: Authentication, authorization, routing, rate limiting
- **Probabilistic**: None (pure routing/security layer)

**Failure Modes:**
1. **Service Unavailable**: Backend service down → Return 503 with retry-after header
2. **Authentication Failure**: Invalid token → Return 401 Unauthorized
3. **Rate Limit Exceeded**: Too many requests → Return 429 with rate limit headers
4. **Invalid Request**: Malformed payload → Return 400 with validation errors
5. **Timeout**: Backend service timeout → Return 504 Gateway Timeout

**Failure Handling:**
- Circuit breaker pattern for backend services
- Exponential backoff retry for transient failures
- Request queuing for rate-limited requests
- Graceful degradation (return cached results if available)

**Explainability:**
- Logs all requests with correlation IDs
- Provides error explanations in response headers
- Tracks API usage patterns for debugging

---

### 2. Ingestion Service

**Responsibility:**
- Accept and validate resume and job description inputs
- Normalize file formats (PDF, DOC, DOCX, plain text)
- Extract raw text content
- Store original documents for audit trail
- Queue processing requests

**Inputs:**
- Resume file (PDF, DOC, DOCX, or text)
- Job description (text or structured JSON)
- Metadata (user ID, job ID, timestamp, etc.)
- Processing preferences (ATS type, role level, etc.)

**Outputs:**
- Normalized text content
- File metadata (format, size, encoding)
- Document ID for tracking
- Validation results (success/failure with reasons)

**Deterministic vs Probabilistic:**
- **Deterministic**: File format detection, text extraction, validation rules
- **Probabilistic**: None (pure ingestion/transformation)

**Failure Modes:**
1. **Unsupported Format**: File type not supported → Return 400 with supported formats
2. **Corrupted File**: File cannot be read → Return 400 with error details
3. **File Too Large**: Exceeds size limits → Return 413 Payload Too Large
4. **Encoding Issues**: Text encoding not recognized → Attempt auto-detection, fallback to error
5. **Malformed Job Description**: Invalid JSON or missing required fields → Return 400 with validation errors

**Failure Handling:**
- Retry for transient file read errors
- Store failed ingestion attempts for analysis
- Provide clear error messages with remediation steps
- Support multiple file format libraries (fallback chain)

**Explainability:**
- Logs file processing steps with timestamps
- Reports extraction confidence scores
- Provides detailed error messages explaining why ingestion failed

---

### 3. Parsing Service

**Responsibility:**
- Parse resume text into structured data model
- Extract entities (name, email, phone, dates, companies, titles, skills, education)
- Identify resume sections (work experience, education, skills, etc.)
- Handle non-standard formats and edge cases
- Validate extracted data for consistency

**Inputs:**
- Normalized resume text from Ingestion Service
- Parsing configuration (strictness level, expected format hints)
- Context metadata (role type, industry hints)

**Outputs:**
- Structured resume data (JSON schema)
- Parsing confidence scores per field
- Parsing warnings/errors (missing fields, ambiguous data)
- Alternative interpretations (when ambiguous)

**Deterministic vs Probabilistic:**
- **Deterministic**: 
  - Regex-based extraction (email, phone, dates)
  - Rule-based section detection
  - Format validation
  - Date parsing and validation
- **Probabilistic**:
  - Named Entity Recognition (NER) for names, companies, titles
  - Section classification (work experience vs. projects)
  - Skill extraction from natural language
  - Ambiguity resolution (multiple possible interpretations)

**Failure Modes:**
1. **Low Parsing Confidence**: Cannot extract key fields → Return warnings, proceed with partial data
2. **Ambiguous Structure**: Multiple valid interpretations → Return all interpretations with confidence scores
3. **Inconsistent Data**: Dates don't add up, conflicting information → Flag inconsistencies, proceed with best guess
4. **Non-Standard Format**: Unusual resume structure → Use fallback parsing strategies
5. **Missing Critical Fields**: No email, no work history → Return error with specific missing fields

**Failure Handling:**
- Multi-strategy parsing (try multiple approaches, use best result)
- Confidence thresholds (reject if below minimum, warn if below optimal)
- Human-in-the-loop flagging for manual review (future enhancement)
- Graceful degradation (proceed with partial data, flag missing fields)

**Explainability:**
- Detailed parsing report showing:
  - Which fields were extracted and how (regex, NER, rules)
  - Confidence scores for each field
  - Alternative interpretations with probabilities
  - Warnings about ambiguous or inconsistent data
  - Reasoning for field extraction decisions

---

### 4. Feature Extraction Service

**Responsibility:**
- Extract quantitative and qualitative features from parsed resume and job description
- Compute feature vectors for ML models
- Normalize features for consistent evaluation
- Handle feature engineering (derived features, interactions)

**Inputs:**
- Structured resume data from Parsing Service
- Structured job description data
- Feature extraction configuration (which features to compute)

**Outputs:**
- Feature vectors (numerical and categorical)
- Feature metadata (feature names, types, normalization info)
- Feature importance scores (for explainability)
- Derived features (career progression metrics, skill depth indicators, etc.)

**Deterministic vs Probabilistic:**
- **Deterministic**:
  - Keyword matching and counting
  - Date calculations (years of experience, tenure, gaps)
  - Text statistics (word count, sentence length, etc.)
  - Formatting metrics (section presence, structure quality)
  - Derived metrics (career progression score, job stability score)
- **Probabilistic**:
  - Semantic similarity (resume-JD alignment)
  - Skill relevance scoring
  - Industry/role classification
  - Career trajectory prediction

**Failure Modes:**
1. **Missing Required Features**: Cannot compute critical features → Use defaults or return error
2. **Feature Computation Error**: Exception during feature calculation → Log error, use fallback or skip feature
3. **Invalid Input Data**: Malformed structured data → Return validation error
4. **Resource Exhaustion**: Too many features to compute → Prioritize critical features, skip optional ones

**Failure Handling:**
- Feature computation isolation (one feature failure doesn't break others)
- Fallback values for missing features
- Feature importance ranking (compute critical features first)
- Caching of expensive feature computations

**Explainability:**
- Feature computation report showing:
  - Which features were computed and their values
  - How each feature was derived (formula, algorithm, source data)
  - Feature importance scores
  - Missing or defaulted features with reasons

---

### 5. ATS Simulation Service

**Responsibility:**
- Simulate ATS screening behavior
- Model parse success/failure scenarios
- Compute keyword matching scores
- Evaluate required field presence
- Calculate ATS compatibility scores
- Model different ATS systems (Taleo, Workday, Greenhouse, etc.)

**Inputs:**
- Structured resume data
- Feature vectors
- Job description
- ATS configuration (which ATS to simulate, thresholds, required fields)

**Outputs:**
- ATS parse success probability
- Keyword match score and breakdown
- Required field presence status
- ATS compatibility score (0-100)
- Rejection risk factors
- Advancement probability

**Deterministic vs Probabilistic:**
- **Deterministic**:
  - Required field checks (email present? phone present?)
  - Keyword presence checks (exact matches)
  - Format validation (file type, structure)
  - Hard filter evaluation (meets minimum experience? has required degree?)
- **Probabilistic**:
  - Parse success probability (based on format, structure, historical data)
  - Keyword match score (weighted by placement, context)
  - ATS ranking score (if ATS uses ML ranking)
  - Advancement probability (probability of passing ATS stage)

**Failure Modes:**
1. **Unknown ATS Type**: ATS system not supported → Use generic ATS model with warnings
2. **Missing Configuration**: ATS thresholds not provided → Use default thresholds
3. **Insufficient Data**: Cannot compute probabilities → Return deterministic scores only
4. **Model Error**: ML model fails → Fall back to rule-based scoring

**Failure Handling:**
- Generic ATS fallback model
- Default threshold values
- Rule-based fallback when ML models unavailable
- Clear warnings when using fallback models

**Explainability:**
- Detailed ATS simulation report:
  - Parse success probability with contributing factors
  - Keyword match breakdown (which keywords matched, where, with what weight)
  - Required field status (present/missing/ambiguous)
  - Hard filter evaluation (pass/fail with reasons)
  - ATS compatibility score with component breakdown
  - Rejection risk factors ranked by impact
  - Counterfactual analysis ("if you added X keyword, score would increase by Y")

---

### 6. Recruiter Evaluation Service

**Responsibility:**
- Model recruiter resume screening behavior
- Evaluate career progression and job stability
- Assess resume quality and formatting
- Identify red flags (job hopping, gaps, etc.)
- Compute recruiter evaluation scores
- Model different recruiter personas (technical vs. non-technical, experienced vs. junior)

**Inputs:**
- Structured resume data
- Feature vectors
- Job description
- ATS scores (from ATS Simulation Service)
- Recruiter persona configuration (optional)

**Outputs:**
- Recruiter evaluation score (0-100)
- Career progression score
- Job stability assessment
- Red flag indicators and severity
- Resume quality metrics
- Advancement probability (probability of passing recruiter stage)

**Deterministic vs Probabilistic:**
- **Deterministic**:
  - Job hopping detection (count jobs <1 year, calculate average tenure)
  - Employment gap detection (identify gaps >threshold)
  - Career progression calculation (title progression, responsibility increase)
  - Formatting quality checks (typos, grammar, structure)
  - Over/underqualification detection (experience level vs. role requirements)
- **Probabilistic**:
  - Recruiter evaluation score (ML model trained on recruiter behavior)
  - Time spent estimation (how long recruiter would spend reviewing)
  - Visual scanning pattern simulation (what recruiter would notice first)
  - Advancement probability (probability of passing recruiter stage)

**Failure Modes:**
1. **Insufficient Career History**: Not enough work history to evaluate → Use available data, flag limitations
2. **Ambiguous Career Path**: Non-traditional background → Use specialized models, provide context
3. **Model Not Trained**: Recruiter persona not available → Use default recruiter model
4. **Conflicting Signals**: Mixed positive/negative indicators → Weight by importance, provide nuanced assessment

**Failure Handling:**
- Default recruiter persona model
- Specialized models for non-traditional backgrounds
- Graceful handling of incomplete data
- Confidence intervals for probabilistic scores

**Explainability:**
- Detailed recruiter evaluation report:
  - Evaluation score breakdown by dimension (experience, progression, quality, etc.)
  - Career progression analysis (trajectory, growth indicators)
  - Job stability assessment (tenure patterns, gap analysis)
  - Red flag identification with severity and reasoning
  - Resume quality metrics (formatting, clarity, impact)
  - Visual scanning simulation (what stands out, what might be missed)
  - Time estimation (how long recruiter would spend)
  - Counterfactual analysis ("if you explained this gap, evaluation would improve by X")

---

### 7. Interview Readiness Service

**Responsibility:**
- Assess whether resume claims can be defended in interviews
- Predict likely interview questions based on resume content
- Identify resume-interview consistency risks
- Evaluate depth of knowledge indicators
- Compute interview readiness scores

**Inputs:**
- Structured resume data
- Feature vectors
- Job description
- Role level and type
- Interview type hints (technical, behavioral, etc.)

**Outputs:**
- Interview readiness score (0-100)
- Predicted interview questions (ranked by likelihood)
- Resume claim defensibility assessment
- Consistency risk indicators
- Interview preparation recommendations

**Deterministic vs Probabilistic:**
- **Deterministic**:
  - Resume claim extraction (identify specific achievements, technologies, projects)
  - Question template matching (map resume claims to question patterns)
  - Consistency checks (dates align, skills mentioned in experience, etc.)
  - Depth indicators (specificity of achievements, metrics provided)
- **Probabilistic**:
  - Question likelihood prediction (probability interviewer will ask about X)
  - Defensibility score (probability candidate can defend claim with depth)
  - Interview readiness score (probability of performing well in interview)
  - Consistency risk probability (probability of resume-interview mismatch)

**Failure Modes:**
1. **Vague Resume Claims**: Cannot extract specific claims → Flag for improvement, provide generic questions
2. **Unknown Role Type**: Role type not recognized → Use generic interview model
3. **Insufficient Data**: Not enough resume content → Provide limited assessment with warnings
4. **Model Limitations**: Cannot predict questions for niche roles → Use role category model

**Failure Handling:**
- Generic interview question templates
- Role category fallbacks
- Clear warnings when assessment is limited
- Progressive enhancement (basic assessment always available, enhanced for supported roles)

**Explainability:**
- Detailed interview readiness report:
  - Resume claims identified and their defensibility scores
  - Predicted questions with likelihood and reasoning
  - Consistency risk analysis (what might be challenged, why)
  - Depth assessment (which claims show depth, which are surface-level)
  - Preparation recommendations (what to prepare, what to clarify)
  - Counterfactual analysis ("if you added metrics to this achievement, defensibility would increase")

---

### 8. Scoring & Probability Aggregation Service

**Responsibility:**
- Aggregate scores from all evaluation stages
- Compute end-to-end hiring probability
- Model signal compounding across stages
- Calculate confidence intervals
- Provide overall assessment

**Inputs:**
- ATS scores and probabilities
- Recruiter evaluation scores and probabilities
- Interview readiness scores and probabilities
- Feature vectors
- Job description context

**Outputs:**
- Overall hiring probability (end-to-end)
- Stage-specific probabilities (ATS pass, recruiter pass, interview pass)
- Confidence intervals for all probabilities
- Signal compounding analysis
- Overall recommendation score
- Risk factors ranked by impact

**Deterministic vs Probabilistic:**
- **Deterministic**:
  - Score aggregation formulas (weighted averages, min/max rules)
  - Signal compounding rules (how ATS score affects recruiter evaluation)
  - Confidence interval calculations (statistical formulas)
- **Probabilistic**:
  - End-to-end hiring probability (conditional probability chain)
  - Stage transition probabilities (probability of advancing given previous stage)
  - Uncertainty quantification (confidence intervals, prediction intervals)

**Failure Modes:**
1. **Missing Stage Scores**: One or more stages didn't complete → Use available scores, flag missing stages
2. **Inconsistent Probabilities**: Probabilities don't align logically → Validate and correct, flag inconsistencies
3. **Model Error**: Aggregation model fails → Use fallback aggregation method
4. **Insufficient Data**: Cannot compute confidence intervals → Return point estimates only

**Failure Handling:**
- Partial aggregation (use available scores)
- Validation and correction of inconsistent probabilities
- Fallback aggregation methods
- Clear flags for missing or incomplete data

**Explainability:**
- Comprehensive scoring report:
  - Stage-by-stage breakdown with probabilities
  - Signal compounding visualization (how signals build across stages)
  - Confidence intervals with interpretation
  - Overall probability with component contributions
  - Risk factors ranked by impact on overall probability
  - Counterfactual analysis ("if ATS score improved by X, overall probability would increase by Y")

---

### 9. Explainability Engine

**Responsibility:**
- Generate human-readable explanations for all scores and recommendations
- Aggregate explainability data from all services
- Provide counterfactual analysis
- Generate improvement recommendations with reasoning
- Create explanation narratives

**Inputs:**
- All scores and probabilities from evaluation services
- Explainability metadata from each service
- Feature vectors and intermediate results
- User context (experience level, goals, etc.)

**Outputs:**
- Human-readable explanations for each score
- Improvement recommendations with reasoning
- Counterfactual scenarios ("if you changed X, Y would happen")
- Explanation narratives (storytelling format)
- Visual explanation data (for UI rendering)

**Deterministic vs Probabilistic:**
- **Deterministic**:
  - Explanation template selection (which template to use)
  - Text generation from structured data (fill-in-the-blank explanations)
  - Counterfactual calculation (deterministic what-if scenarios)
  - Recommendation prioritization (rank by impact)
- **Probabilistic**:
  - Explanation personalization (tailor to user experience level)
  - Narrative generation (LLM for natural language, but only for final presentation)
  - Explanation completeness scoring (how well does explanation cover the reasoning)

**Failure Modes:**
1. **Missing Explainability Data**: Service didn't provide explainability metadata → Generate generic explanations
2. **Explanation Generation Error**: Template or LLM fails → Use fallback explanation format
3. **Incomplete Data**: Cannot generate full explanation → Provide partial explanation with gaps noted
4. **LLM Unavailable**: LLM service down → Use template-based explanations only

**Failure Handling:**
- Template-based fallback explanations
- Partial explanation generation
- Clear flags for incomplete explanations
- Caching of generated explanations

**Explainability:**
- The Explainability Engine is itself explainable:
  - Shows which data sources were used for explanation
  - Indicates explanation confidence
  - Flags assumptions made in explanation generation
  - Provides explanation metadata (generation method, timestamp, version)

**Note on LLM Usage:**
- LLMs are used ONLY for final explanation narrative generation (natural language)
- All reasoning, scoring, and analysis use deterministic logic or trained ML models
- LLM prompts are templated and validated
- LLM outputs are validated and can be regenerated deterministically

---

### 10. Analysis Orchestrator

**Responsibility:**
- Coordinate the end-to-end analysis pipeline
- Manage service dependencies and execution order
- Handle parallel processing where possible
- Manage request context and correlation IDs
- Aggregate results from all services
- Handle partial failures gracefully

**Inputs:**
- Analysis request (resume + JD + configuration)
- User context and preferences
- Processing options (which stages to run, quality vs. speed)

**Outputs:**
- Complete analysis results
- Stage-by-stage results
- Processing metadata (timing, service versions, etc.)
- Error summary (if any stages failed)

**Deterministic vs Probabilistic:**
- **Deterministic**: Service orchestration, dependency management, error handling
- **Probabilistic**: None (pure orchestration)

**Failure Modes:**
1. **Service Timeout**: Backend service doesn't respond → Retry with exponential backoff, then fail gracefully
2. **Service Failure**: Backend service returns error → Continue with other services, flag partial results
3. **Dependency Failure**: Required service unavailable → Return error or use cached results if available
4. **Partial Results**: Some stages complete, others fail → Return partial results with clear flags

**Failure Handling:**
- Circuit breakers for failing services
- Retry logic with exponential backoff
- Graceful degradation (return partial results)
- Caching of intermediate results for retry scenarios
- Clear error reporting with service-level details

**Explainability:**
- Processing report showing:
  - Which services were called and in what order
  - Timing for each service call
  - Success/failure status for each stage
  - Service versions used
  - Any fallbacks or retries that occurred

---

## Data Flow

### End-to-End Request Flow

```
1. CLIENT REQUEST
   └─> POST /api/v1/analyze
       Body: { resume_file, job_description, options }

2. API GATEWAY
   ├─> Authenticate request (JWT validation)
   ├─> Authorize user (check subscription, rate limits)
   ├─> Validate request format
   └─> Route to Ingestion Service
       Correlation ID: <uuid>

3. INGESTION SERVICE
   ├─> Validate file format and size
   ├─> Extract text from resume file
   ├─> Normalize text encoding
   ├─> Store original file (for audit)
   └─> Queue parsing request
       Document ID: <doc_id>

4. ANALYSIS ORCHESTRATOR
   ├─> Receive ingestion results
   ├─> Initialize analysis context
   └─> Trigger parallel processing:
       │
       ├─> PARSING SERVICE (async)
       │   ├─> Parse resume text → structured data
       │   ├─> Extract entities (name, email, dates, etc.)
       │   ├─> Identify sections
       │   └─> Return: ParsedResume + confidence scores
       │
       ├─> JOB DESCRIPTION PARSING (async, if needed)
       │   └─> Parse JD → structured data
       │
       └─> Wait for parsing completion

5. FEATURE EXTRACTION SERVICE
   ├─> Receive: ParsedResume + JobDescription
   ├─> Extract quantitative features
   ├─> Compute feature vectors
   └─> Return: FeatureVectors + metadata

6. PARALLEL EVALUATION STAGES
   │
   ├─> ATS SIMULATION SERVICE (async)
   │   ├─> Input: ParsedResume + FeatureVectors + JD
   │   ├─> Simulate ATS parsing
   │   ├─> Compute keyword matching
   │   ├─> Evaluate required fields
   │   └─> Return: ATSScores + probabilities + explanations
   │
   ├─> RECRUITER EVALUATION SERVICE (async)
   │   ├─> Input: ParsedResume + FeatureVectors + JD + ATSScores
   │   ├─> Evaluate career progression
   │   ├─> Assess job stability
   │   ├─> Identify red flags
   │   └─> Return: RecruiterScores + probabilities + explanations
   │
   └─> INTERVIEW READINESS SERVICE (async)
       ├─> Input: ParsedResume + FeatureVectors + JD
       ├─> Extract resume claims
       ├─> Predict interview questions
       ├─> Assess defensibility
       └─> Return: InterviewScores + questions + explanations

7. SCORING & PROBABILITY AGGREGATION SERVICE
   ├─> Input: All stage scores + probabilities
   ├─> Aggregate scores
   ├─> Compute end-to-end probability
   ├─> Model signal compounding
   └─> Return: OverallScores + probabilities + confidence intervals

8. EXPLAINABILITY ENGINE
   ├─> Input: All scores + explainability metadata from all services
   ├─> Generate human-readable explanations
   ├─> Create improvement recommendations
   ├─> Generate counterfactual scenarios
   └─> Return: Explanations + recommendations + narratives

9. ANALYSIS ORCHESTRATOR
   ├─> Aggregate all results
   ├─> Create final response structure
   └─> Return to API Gateway

10. API GATEWAY
    ├─> Transform response format
    ├─> Add response headers
    └─> Return to client
        Status: 200 OK
        Body: {
          analysis_id: <uuid>,
          scores: { ats, recruiter, interview, overall },
          probabilities: { ats_pass, recruiter_pass, interview_pass, hire },
          explanations: { ... },
          recommendations: [ ... ],
          metadata: { processing_time, service_versions, ... }
        }
```

### Stage Dependencies

```
Ingestion
  └─> Parsing
       └─> Feature Extraction
            ├─> ATS Simulation (independent)
            ├─> Recruiter Evaluation (depends on ATS scores)
            └─> Interview Readiness (independent)
                 │
                 └─> Scoring & Aggregation (depends on all stages)
                      └─> Explainability Engine (depends on all)
```

**Parallelization Opportunities:**
- ATS Simulation, Recruiter Evaluation, and Interview Readiness can run in parallel after Feature Extraction
- Explainability Engine can process explanations in parallel for each stage

**Sequential Dependencies:**
- Feature Extraction must complete before evaluation stages
- Recruiter Evaluation benefits from ATS scores (but can proceed without them)
- Scoring & Aggregation requires all evaluation stages
- Explainability Engine requires all scores and metadata

---

## Data Models

### Core Data Structures

**ParsedResume:**
```json
{
  "personal_info": {
    "name": { "value": "...", "confidence": 0.95 },
    "email": { "value": "...", "confidence": 0.99 },
    "phone": { "value": "...", "confidence": 0.90 }
  },
  "work_experience": [
    {
      "company": { "value": "...", "confidence": 0.98 },
      "title": { "value": "...", "confidence": 0.95 },
      "start_date": { "value": "...", "confidence": 0.90 },
      "end_date": { "value": "...", "confidence": 0.85 },
      "description": "...",
      "achievements": [...]
    }
  ],
  "education": [...],
  "skills": [...],
  "metadata": {
    "parsing_confidence": 0.92,
    "warnings": [...],
    "alternatives": [...]
  }
}
```

**FeatureVectors:**
```json
{
  "quantitative": {
    "years_experience": 5.2,
    "keyword_match_score": 0.75,
    "career_progression_score": 0.82,
    "job_stability_score": 0.68,
    ...
  },
  "categorical": {
    "education_level": "bachelor",
    "industry": "technology",
    "role_type": "software_engineer",
    ...
  },
  "metadata": {
    "feature_importance": {...},
    "missing_features": [...],
    "computation_method": {...}
  }
}
```

**AnalysisResults:**
```json
{
  "analysis_id": "<uuid>",
  "scores": {
    "ats": {
      "parse_success_probability": 0.95,
      "keyword_match_score": 0.78,
      "compatibility_score": 82,
      "advancement_probability": 0.85
    },
    "recruiter": {
      "evaluation_score": 75,
      "career_progression_score": 0.80,
      "advancement_probability": 0.70
    },
    "interview": {
      "readiness_score": 68,
      "defensibility_score": 0.72,
      "advancement_probability": 0.65
    },
    "overall": {
      "hiring_probability": 0.55,
      "confidence_interval": [0.48, 0.62]
    }
  },
  "explanations": {
    "ats": {...},
    "recruiter": {...},
    "interview": {...},
    "overall": {...}
  },
  "recommendations": [
    {
      "priority": "high",
      "category": "keyword_optimization",
      "action": "Add 'Python' to skills section",
      "impact": "ATS score would increase by 8 points",
      "reasoning": "..."
    }
  ],
  "metadata": {
    "processing_time_ms": 1250,
    "service_versions": {...},
    "timestamp": "..."
  }
}
```

---

## Non-Goals

### Explicitly Out of Scope

1. **User Interface Design**
   - No UI components, layouts, or user experience design
   - Architecture supports any UI through API

2. **Database Schema Design**
   - No specific database technology or schema
   - Architecture is database-agnostic
   - Data models are logical, not physical

3. **Vendor-Specific Services**
   - No AWS, GCP, or Azure-specific services
   - Architecture is cloud-agnostic
   - Services can be deployed on any platform

4. **Authentication/Authorization Implementation**
   - API Gateway handles auth, but implementation details are out of scope
   - No specific identity provider requirements

5. **Real-Time Features**
   - No WebSocket support, real-time updates, or streaming
   - Request-response pattern only
   - Async processing but synchronous API responses

6. **Resume Generation/Editing**
   - No resume builder or editor functionality
   - Architecture focuses on analysis and optimization recommendations
   - Resume creation is out of scope

7. **Job Board Integration**
   - No integration with job boards or ATS systems
   - Architecture simulates ATS behavior but doesn't connect to real ATS

8. **Multi-Tenancy Implementation**
   - Architecture supports multi-tenancy but implementation details are out of scope
   - No specific tenant isolation strategies

9. **Caching Strategy**
   - Architecture mentions caching but doesn't specify implementation
   - Caching is an optimization, not a core requirement

10. **Monitoring and Observability Implementation**
    - Architecture assumes monitoring exists but doesn't specify tools
    - No specific logging, metrics, or tracing implementation

11. **LLM Training or Fine-Tuning**
    - Architecture uses LLMs but doesn't specify training
    - LLM selection and configuration are out of scope

12. **Data Retention Policies**
    - No specific data retention or deletion policies
    - Architecture supports data storage but policies are out of scope

---

## Architectural Trade-offs and Rationale

### 1. Service-Oriented vs. Monolithic

**Decision**: Service-oriented architecture with independent services

**Rationale**:
- **Scalability**: Each service can scale independently based on load
- **Technology Flexibility**: Different services can use different tech stacks if needed
- **Fault Isolation**: Failure in one service doesn't bring down entire system
- **Team Autonomy**: Different teams can own different services
- **Complexity Trade-off**: More operational complexity (service discovery, inter-service communication, distributed tracing)

**Alternative Considered**: Monolithic architecture
- **Rejected Because**: Less flexible, harder to scale individual components, tighter coupling

### 2. API-First vs. Database-First

**Decision**: API-first architecture

**Rationale**:
- **Flexibility**: API contracts define the system, not database schema
- **Multiple Clients**: Web, mobile, CLI, third-party integrations all use same API
- **Versioning**: API versioning allows evolution without breaking clients
- **Testing**: APIs are easier to test than database-dependent code
- **Complexity Trade-off**: Requires API design discipline and versioning strategy

**Alternative Considered**: Database-first
- **Rejected Because**: Tighter coupling, harder to support multiple clients, less flexible

### 3. Deterministic vs. Probabilistic Logic Separation

**Decision**: Clear separation between deterministic and probabilistic components

**Rationale**:
- **Explainability**: Deterministic logic is fully explainable (can show exact rules/formulas)
- **Reliability**: Deterministic components are more reliable and testable
- **Performance**: Deterministic logic is faster (no model inference)
- **Transparency**: Users can understand deterministic reasoning
- **Complexity Trade-off**: Requires careful design to separate concerns

**Alternative Considered**: All probabilistic (ML end-to-end)
- **Rejected Because**: Less explainable, harder to debug, more compute-intensive, less reliable

### 4. Minimal LLM Usage vs. LLM-Heavy

**Decision**: Minimal LLM usage, only for final explanation narrative generation

**Rationale**:
- **Cost**: LLMs are expensive, especially at scale
- **Latency**: LLM inference is slow (seconds vs. milliseconds)
- **Reliability**: LLMs can be unreliable (hallucinations, non-deterministic)
- **Explainability**: LLM reasoning is opaque
- **Control**: Deterministic logic gives more control over behavior
- **Complexity Trade-off**: Requires more engineering to build deterministic logic

**Alternative Considered**: LLM-heavy (use LLMs for all analysis)
- **Rejected Because**: Too expensive, too slow, less reliable, less explainable

### 5. Synchronous vs. Asynchronous Processing

**Decision**: Synchronous API with internal async processing

**Rationale**:
- **User Experience**: Users expect immediate results (even if it takes a few seconds)
- **Simplicity**: Synchronous API is simpler for clients
- **Internal Optimization**: Can use async processing internally for parallelism
- **Complexity Trade-off**: Requires careful timeout and error handling

**Alternative Considered**: Fully asynchronous (queue-based)
- **Rejected Because**: More complex for clients, requires polling or webhooks, worse UX

### 6. Centralized vs. Distributed Explainability

**Decision**: Each service generates explainability metadata, centralized engine aggregates

**Rationale**:
- **Service Autonomy**: Each service knows best how to explain its own logic
- **Co-location**: Explanations generated alongside scores (no data loss)
- **Aggregation**: Centralized engine can create cohesive narrative
- **Complexity Trade-off**: Requires explainability contract/interface

**Alternative Considered**: Only centralized explainability
- **Rejected Because**: Services would lose context, harder to generate accurate explanations

### 7. Generic vs. ATS-Specific Simulation

**Decision**: Support multiple ATS types with generic fallback

**Rationale**:
- **Accuracy**: ATS-specific models are more accurate
- **Flexibility**: Generic model works when ATS type unknown
- **Scalability**: Can add new ATS types without changing architecture
- **Complexity Trade-off**: Requires ATS model registry and selection logic

**Alternative Considered**: Single generic ATS model
- **Rejected Because**: Less accurate, doesn't reflect reality that different ATS systems behave differently

### 8. Real-Time vs. Batch Processing

**Decision**: Real-time processing (synchronous request-response)

**Rationale**:
- **User Experience**: Immediate feedback is better
- **Simplicity**: No need for job queues, polling, or webhooks
- **Complexity Trade-off**: Must optimize for latency, may need caching

**Alternative Considered**: Batch processing
- **Rejected Because**: Worse UX, more complex, not needed for current scale

---

## Assumptions

### Explicit Assumptions

1. **Scale Assumptions**:
   - Initial scale: Thousands of requests per day, not millions
   - Can scale horizontally as needed
   - No need for sub-100ms latency (1-5 seconds acceptable)

2. **Data Assumptions**:
   - Resume files are typically <5MB
   - Job descriptions are typically <50KB text
   - Most resumes follow standard formats (can handle edge cases but optimize for common)

3. **Technology Assumptions**:
   - Services can be containerized (Docker)
   - Can use message queues for async processing if needed
   - Can use caching layers (Redis, etc.) for performance
   - Can use object storage for file storage

4. **Model Assumptions**:
   - ML models can be loaded into memory or served via model serving infrastructure
   - Models are updated periodically, not in real-time
   - Can use pre-trained models initially, fine-tune later

5. **Explainability Assumptions**:
   - Users want detailed explanations, not just scores
   - Explanations should be human-readable (not just technical)
   - Can trade some accuracy for explainability

6. **Privacy Assumptions**:
   - Resume data is sensitive and must be handled securely
   - Data retention policies will be defined separately
   - Compliance requirements (GDPR, etc.) will be handled at implementation

7. **Reliability Assumptions**:
   - 99.9% uptime target (allows for maintenance windows)
   - Partial failures are acceptable (return partial results with flags)
   - Can degrade gracefully (use cached results, simpler models)

8. **Cost Assumptions**:
   - LLM usage should be minimized due to cost
   - Compute costs are acceptable for accuracy and explainability
   - Can optimize costs through caching and efficient processing

---

## Future Considerations

### Potential Enhancements (Not in Current Design)

1. **Real-Time Updates**: WebSocket support for long-running analyses
2. **Batch Processing**: Support for bulk resume analysis
3. **Custom ATS Models**: Allow users to train custom ATS models
4. **Resume Generation**: Add resume builder/editor functionality
5. **Interview Simulation**: Simulate actual interview scenarios
6. **Outcome Learning**: Learn from actual hiring outcomes (with consent)
7. **Multi-Language Support**: Support for non-English resumes
8. **Video Interview Analysis**: Analyze video interview performance
9. **Employer Integration**: Direct integration with ATS systems
10. **Advanced Personalization**: User-specific model fine-tuning

**Note**: These are potential future enhancements and are explicitly NOT part of the current architecture design.

---

## Conclusion

This architecture provides a solid foundation for HireLens AI that:

1. **Accurately Models the Hiring Funnel**: Three-stage evaluation (ATS → Recruiter → Interviewer) with signal compounding
2. **Supports Explainability**: Built-in explainability at every stage, not added as an afterthought
3. **Minimizes LLM Dependency**: Uses LLMs only where necessary (final narrative generation)
4. **Separates Concerns**: Clear separation between deterministic and probabilistic logic
5. **Scales Effectively**: Service-oriented design allows independent scaling
6. **Maintains Flexibility**: API-first design supports multiple clients and use cases

The architecture is designed to be:
- **Production-Ready**: Handles failures gracefully, provides clear error messages
- **Maintainable**: Modular design, clear responsibilities, well-defined interfaces
- **Extensible**: Can add new services, models, or features without major refactoring
- **Explainable**: Every decision and score can be explained to users

This design balances accuracy, explainability, performance, and cost while providing a foundation for future enhancements.

