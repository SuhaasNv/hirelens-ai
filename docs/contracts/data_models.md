# HireLens AI Canonical Data Models

## Document Information

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Design Phase  
**Purpose**: Defines canonical data structures used across all HireLens AI services

---

## Overview

This document defines the canonical data models used throughout the HireLens AI system. These models represent the data structures that flow between services and are used for analysis, scoring, and explainability.

**Key Conventions:**
- **Deterministic Fields**: Fields computed using rule-based logic, formulas, or deterministic algorithms. Values are reproducible and fully explainable.
- **Probabilistic Fields**: Fields computed using machine learning models or statistical inference. Values represent probabilities or predictions with uncertainty.
- **Explainability Metadata**: Fields that contain information about how other fields were computed, why decisions were made, or what factors contributed to scores.

---

## 1. ResumeInput

### Purpose
Represents the raw input data for a resume analysis request. This is the initial data structure received from clients before any processing occurs.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `file_content` | String (Base64) | Required | Base64-encoded resume file content (PDF, DOC, DOCX, or plain text) |
| `file_format` | String (Enum) | Required | File format: "pdf", "doc", "docx", "txt" |
| `file_name` | String | Optional | Original filename provided by user |
| `file_size_bytes` | Integer | Optional | File size in bytes |
| `user_id` | String (UUID) | Optional | Identifier for the user submitting the resume |
| `analysis_id` | String (UUID) | Optional | Unique identifier for this analysis request (generated if not provided) |
| `metadata` | Object | Optional | Additional metadata about the request |
| `metadata.timestamp` | String (ISO 8601) | Optional | Timestamp when request was created |
| `metadata.source` | String | Optional | Source of the request: "web", "mobile", "api", "cli" |
| `metadata.preferences` | Object | Optional | User preferences for analysis |
| `metadata.preferences.ats_type` | String | Optional | Preferred ATS type to simulate: "generic", "taleo", "workday", "greenhouse", "lever" |
| `metadata.preferences.role_level` | String | Optional | Expected role level: "entry", "mid", "senior", "staff", "principal", "executive" |
| `metadata.preferences.industry` | String | Optional | Industry context: "technology", "finance", "healthcare", etc. |

### Deterministic vs Probabilistic
- **All fields are deterministic**: This is raw input data with no computation involved.

### Explainability Metadata
- **None**: This is input data, not computed results.

---

## 2. JobDescriptionInput

### Purpose
Represents the raw input data for a job description. Used to provide context for resume analysis and optimization recommendations.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `job_description_text` | String | Required | Full text of the job description |
| `structured_data` | Object | Optional | Pre-structured job description data (if available) |
| `structured_data.title` | String | Optional | Job title |
| `structured_data.company` | String | Optional | Company name |
| `structured_data.location` | String | Optional | Job location (city, state, country) |
| `structured_data.remote_eligible` | Boolean | Optional | Whether remote work is allowed |
| `structured_data.required_skills` | Array[String] | Optional | List of required skills/technologies |
| `structured_data.preferred_skills` | Array[String] | Optional | List of preferred skills/technologies |
| `structured_data.required_experience_years` | Number | Optional | Minimum years of experience required |
| `structured_data.required_education` | String | Optional | Required education level: "high_school", "associate", "bachelor", "master", "phd" |
| `structured_data.required_certifications` | Array[String] | Optional | List of required certifications |
| `structured_data.role_level` | String | Optional | Role level: "entry", "mid", "senior", "staff", "principal", "executive" |
| `structured_data.employment_type` | String | Optional | Employment type: "full_time", "part_time", "contract", "internship" |
| `job_id` | String | Optional | External job posting identifier |
| `user_id` | String (UUID) | Optional | Identifier for the user (if different from resume submitter) |
| `metadata` | Object | Optional | Additional metadata |
| `metadata.timestamp` | String (ISO 8601) | Optional | Timestamp when job description was created/retrieved |
| `metadata.source` | String | Optional | Source of job description: "user_input", "job_board", "ats_export" |

### Deterministic vs Probabilistic
- **All fields are deterministic**: This is raw input data with no computation involved.

### Explainability Metadata
- **None**: This is input data, not computed results.

---

## 3. ParsedResume

### Purpose
Represents a resume that has been parsed from raw text into structured data. Contains extracted entities, sections, and confidence scores for each field.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `personal_info` | Object | Required | Personal information section |
| `personal_info.name` | Object | Optional | Extracted name |
| `personal_info.name.value` | String | Optional | Name value |
| `personal_info.name.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in name extraction |
| `personal_info.email` | Object | Optional | Extracted email address |
| `personal_info.email.value` | String | Optional | Email value |
| `personal_info.email.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in email extraction |
| `personal_info.phone` | Object | Optional | Extracted phone number |
| `personal_info.phone.value` | String | Optional | Phone value |
| `personal_info.phone.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in phone extraction |
| `personal_info.location` | Object | Optional | Extracted location |
| `personal_info.location.value` | String | Optional | Location value |
| `personal_info.location.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in location extraction |
| `personal_info.linkedin_url` | String | Optional | LinkedIn profile URL |
| `personal_info.website_url` | String | Optional | Personal website URL |
| `work_experience` | Array[Object] | Required | List of work experience entries |
| `work_experience[].company` | Object | Required | Company information |
| `work_experience[].company.value` | String | Required | Company name |
| `work_experience[].company.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in company extraction |
| `work_experience[].title` | Object | Required | Job title |
| `work_experience[].title.value` | String | Required | Title value |
| `work_experience[].title.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in title extraction |
| `work_experience[].start_date` | Object | Optional | Start date |
| `work_experience[].start_date.value` | String (ISO 8601) | Optional | Start date value |
| `work_experience[].start_date.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in date extraction |
| `work_experience[].end_date` | Object | Optional | End date (null if current position) |
| `work_experience[].end_date.value` | String (ISO 8601) or null | Optional | End date value or null |
| `work_experience[].end_date.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in date extraction |
| `work_experience[].is_current` | Boolean | Optional | **Deterministic** - Whether this is the current position |
| `work_experience[].description` | String | Optional | Job description text |
| `work_experience[].achievements` | Array[String] | Optional | List of achievements/bullet points |
| `work_experience[].location` | String | Optional | Job location |
| `work_experience[].employment_type` | String | Optional | Employment type: "full_time", "part_time", "contract", "internship", "freelance" |
| `education` | Array[Object] | Optional | List of education entries |
| `education[].institution` | Object | Optional | Institution name |
| `education[].institution.value` | String | Optional | Institution name value |
| `education[].institution.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in institution extraction |
| `education[].degree` | Object | Optional | Degree information |
| `education[].degree.value` | String | Optional | Degree value (e.g., "Bachelor of Science") |
| `education[].degree.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in degree extraction |
| `education[].field` | String | Optional | Field of study |
| `education[].graduation_date` | Object | Optional | Graduation date |
| `education[].graduation_date.value` | String (ISO 8601) | Optional | Graduation date value |
| `education[].graduation_date.confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in date extraction |
| `education[].gpa` | Number | Optional | GPA (if mentioned) |
| `skills` | Array[Object] | Optional | List of skills |
| `skills[].name` | String | Required | Skill name |
| `skills[].category` | String | Optional | Skill category: "programming_language", "framework", "tool", "soft_skill", "certification" |
| `skills[].proficiency_level` | String | Optional | Proficiency level: "beginner", "intermediate", "advanced", "expert" |
| `skills[].years_experience` | Number | Optional | Years of experience with this skill |
| `skills[].confidence` | Number (0-1) | Optional | **Probabilistic** - Confidence in skill extraction |
| `certifications` | Array[Object] | Optional | List of certifications |
| `certifications[].name` | String | Required | Certification name |
| `certifications[].issuer` | String | Optional | Issuing organization |
| `certifications[].issue_date` | String (ISO 8601) | Optional | Issue date |
| `certifications[].expiration_date` | String (ISO 8601) | Optional | Expiration date |
| `certifications[].credential_id` | String | Optional | Credential identifier |
| `projects` | Array[Object] | Optional | List of projects |
| `projects[].name` | String | Required | Project name |
| `projects[].description` | String | Optional | Project description |
| `projects[].technologies` | Array[String] | Optional | Technologies used |
| `projects[].url` | String | Optional | Project URL |
| `projects[].date_range` | Object | Optional | Project date range |
| `languages` | Array[Object] | Optional | List of languages |
| `languages[].name` | String | Required | Language name |
| `languages[].proficiency` | String | Optional | Proficiency: "native", "fluent", "conversational", "basic" |
| `summary` | String | Optional | Professional summary or objective |
| `metadata` | Object | Required | **Explainability Metadata** - Parsing metadata and explainability information |
| `metadata.parsing_confidence` | Number (0-1) | Required | **Probabilistic** - Overall confidence in parsing accuracy |
| `metadata.parsing_method` | String | Optional | **Explainability Metadata** - Method used for parsing: "regex", "ner", "hybrid" |
| `metadata.warnings` | Array[Object] | Optional | **Explainability Metadata** - Parsing warnings |
| `metadata.warnings[].type` | String | Required | Warning type: "missing_field", "ambiguous_data", "inconsistent_data", "low_confidence" |
| `metadata.warnings[].field` | String | Required | Field that triggered the warning |
| `metadata.warnings[].message` | String | Required | Human-readable warning message |
| `metadata.warnings[].severity` | String | Required | Severity: "low", "medium", "high" |
| `metadata.alternatives` | Array[Object] | Optional | **Explainability Metadata** - Alternative interpretations when ambiguous |
| `metadata.alternatives[].field` | String | Required | Field with alternative interpretation |
| `metadata.alternatives[].value` | String | Required | Alternative value |
| `metadata.alternatives[].confidence` | Number (0-1) | Required | **Probabilistic** - Confidence in alternative interpretation |
| `metadata.sections_detected` | Array[String] | Optional | **Explainability Metadata** - List of resume sections detected |
| `metadata.format_issues` | Array[String] | Optional | **Explainability Metadata** - Formatting issues that may affect parsing |

### Deterministic vs Probabilistic
- **Deterministic**: `is_current` (computed from date logic)
- **Probabilistic**: All confidence scores, parsing confidence, alternative interpretations

### Explainability Metadata
- `metadata` object contains all explainability information
- `metadata.warnings` explains parsing issues
- `metadata.alternatives` explains ambiguous interpretations
- `metadata.parsing_method` explains how parsing was performed

---

## 4. ParsedJobDescription

### Purpose
Represents a job description that has been parsed and structured. Contains extracted requirements, skills, and other job details.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `title` | String | Optional | Job title |
| `company` | String | Optional | Company name |
| `location` | Object | Optional | Job location |
| `location.city` | String | Optional | City |
| `location.state` | String | Optional | State/province |
| `location.country` | String | Optional | Country |
| `location.remote_eligible` | Boolean | Optional | Whether remote work is allowed |
| `required_skills` | Array[String] | Optional | List of required skills/technologies |
| `preferred_skills` | Array[String] | Optional | List of preferred skills/technologies |
| `required_experience_years` | Number | Optional | Minimum years of experience required |
| `required_education` | String | Optional | Required education level: "high_school", "associate", "bachelor", "master", "phd" |
| `required_education_field` | String | Optional | Required field of study |
| `required_certifications` | Array[String] | Optional | List of required certifications |
| `role_level` | String | Optional | Role level: "entry", "mid", "senior", "staff", "principal", "executive" |
| `employment_type` | String | Optional | Employment type: "full_time", "part_time", "contract", "internship" |
| `salary_range` | Object | Optional | Salary range |
| `salary_range.min` | Number | Optional | Minimum salary |
| `salary_range.max` | Number | Optional | Maximum salary |
| `salary_range.currency` | String | Optional | Currency code (e.g., "USD") |
| `description` | String | Optional | Full job description text |
| `responsibilities` | Array[String] | Optional | List of job responsibilities |
| `qualifications` | Array[String] | Optional | List of qualifications |
| `benefits` | Array[String] | Optional | List of benefits |
| `keywords` | Array[String] | Optional | **Probabilistic** - Extracted keywords from job description (heuristic-based extraction from free text) |
| `metadata` | Object | Optional | **Explainability Metadata** - Parsing metadata |
| `metadata.parsing_confidence` | Number (0-1) | Optional | **Probabilistic** - Overall confidence in parsing accuracy |
| `metadata.parsing_method` | String | Optional | **Explainability Metadata** - Method used for parsing |
| `metadata.warnings` | Array[Object] | Optional | **Explainability Metadata** - Parsing warnings |
| `metadata.source` | String | Optional | **Explainability Metadata** - Source of job description data |

### Deterministic vs Probabilistic
- **Deterministic**: None (keyword extraction from free text is heuristic-based)
- **Probabilistic**: `keywords` (heuristic-based extraction from free text), `metadata.parsing_confidence`

### Explainability Metadata
- `metadata` object contains parsing explainability information
- `metadata.warnings` explains parsing issues
- `metadata.parsing_method` explains how parsing was performed

---

## 5. FeatureVector

### Purpose
Represents extracted features from a parsed resume and job description. Contains quantitative and categorical features used for ML model inference and scoring.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `quantitative` | Object | Required | Quantitative/numerical features |
| `quantitative.years_experience` | Number | Optional | **Deterministic** - Total years of work experience (calculated from dates) |
| `quantitative.years_experience_relevant` | Number | Optional | **Deterministic** - Years of experience relevant to job description |
| `quantitative.keyword_match_count` | Integer | Optional | **Deterministic** - Count of matching keywords between resume and JD |
| `quantitative.keyword_match_score` | Number (0-1) | Optional | **Probabilistic** - Normalized keyword match score |
| `quantitative.career_progression_score` | Number (0-1) | Optional | **Deterministic** - Score indicating upward career trajectory (0=no progression, 1=strong progression) |
| `quantitative.job_stability_score` | Number (0-1) | Optional | **Deterministic** - Score indicating job stability (0=high turnover, 1=very stable) |
| `quantitative.average_tenure_months` | Number | Optional | **Deterministic** - Average tenure at companies in months |
| `quantitative.total_jobs` | Integer | Optional | **Deterministic** - Total number of jobs listed |
| `quantitative.jobs_last_5_years` | Integer | Optional | **Deterministic** - Number of jobs in last 5 years |
| `quantitative.largest_employment_gap_months` | Number | Optional | **Deterministic** - Largest gap between jobs in months |
| `quantitative.total_employment_gaps_months` | Number | Optional | **Deterministic** - Total months of employment gaps |
| `quantitative.resume_length_words` | Integer | Optional | **Deterministic** - Total word count in resume |
| `quantitative.achievement_count` | Integer | Optional | **Deterministic** - Total number of achievement bullet points |
| `quantitative.achievements_with_metrics` | Integer | Optional | **Deterministic** - Number of achievements that include quantifiable metrics |
| `quantitative.skills_count` | Integer | Optional | **Deterministic** - Total number of skills listed |
| `quantitative.certifications_count` | Integer | Optional | **Deterministic** - Total number of certifications |
| `quantitative.education_count` | Integer | Optional | **Deterministic** - Total number of education entries |
| `quantitative.semantic_similarity_score` | Number (0-1) | Optional | **Probabilistic** - Semantic similarity between resume and job description |
| `quantitative.overqualification_score` | Number (0-1) | Optional | **Probabilistic** - Score indicating overqualification (0=not overqualified, 1=highly overqualified) |
| `quantitative.underqualification_score` | Number (0-1) | Optional | **Probabilistic** - Score indicating underqualification (0=not underqualified, 1=highly underqualified) |
| `categorical` | Object | Required | Categorical features |
| `categorical.education_level` | String | Optional | **Probabilistic** - Highest education level: "high_school", "associate", "bachelor", "master", "phd". Probabilistic when inferred from text, deterministic when explicitly stated. |
| `categorical.industry` | String | Optional | **Probabilistic** - Primary industry: "technology", "finance", "healthcare", etc. |
| `categorical.role_type` | String | Optional | **Probabilistic** - Role type: "software_engineer", "data_scientist", "product_manager", etc. |
| `categorical.seniority_level` | String | Optional | **Probabilistic** - Seniority level: "entry", "mid", "senior", "staff", "principal", "executive" |
| `categorical.has_required_degree` | Boolean | Optional | **Deterministic** - Whether candidate has required education level |
| `categorical.has_required_certifications` | Boolean | Optional | **Deterministic** - Whether candidate has all required certifications |
| `categorical.meets_experience_threshold` | Boolean | Optional | **Deterministic** - Whether candidate meets minimum experience requirement |
| `categorical.has_required_skills` | Boolean | Optional | **Deterministic** - Whether candidate has all required skills |
| `categorical.has_preferred_skills` | Boolean | Optional | **Deterministic** - Whether candidate has preferred skills |
| `categorical.resume_format_type` | String | Optional | **Deterministic** - Resume format: "chronological", "functional", "hybrid", "unknown" |
| `categorical.has_career_gaps` | Boolean | Optional | **Deterministic** - Whether resume shows employment gaps |
| `categorical.has_job_hopping_pattern` | Boolean | Optional | **Deterministic** - Whether resume shows job hopping pattern |
| `metadata` | Object | Required | **Explainability Metadata** - Feature extraction metadata |
| `metadata.feature_importance` | Object | Optional | **Explainability Metadata** - Importance scores for each feature (for model explainability) |
| `metadata.missing_features` | Array[String] | Optional | **Explainability Metadata** - List of features that could not be computed |
| `metadata.computation_method` | Object | Optional | **Explainability Metadata** - Method used to compute each feature |
| `metadata.computation_method[feature_name]` | String | Optional | **Explainability Metadata** - Method used: "deterministic_formula", "ml_model", "rule_based", etc. |
| `metadata.normalization_applied` | Boolean | Optional | **Explainability Metadata** - Whether features were normalized |
| `metadata.normalization_method` | String | Optional | **Explainability Metadata** - Normalization method used |

### Deterministic vs Probabilistic
- **Deterministic**: Most quantitative features (years_experience, counts, scores calculated from rules), categorical boolean flags
- **Probabilistic**: Semantic similarity, over/underqualification scores, classification features (education_level, industry, role_type, seniority_level), keyword_match_score

### Explainability Metadata
- `metadata` object contains all explainability information
- `metadata.feature_importance` explains which features are most important
- `metadata.computation_method` explains how each feature was computed
- `metadata.missing_features` explains what could not be computed

---

## 6. ATSResult

### Purpose
Represents the results of ATS (Applicant Tracking System) simulation. Contains parse success probability, keyword matching scores, and advancement probability.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `parse_success_probability` | Number (0-1) | Required | **Probabilistic** - Probability that ATS will successfully parse the resume |
| `keyword_match_score` | Number (0-1) | Required | **Probabilistic** - Overall keyword match score between resume and job description |
| `keyword_match_percentage` | Number (0-100) | Required | **Deterministic** - Percentage of required keywords found in resume |
| `compatibility_score` | Number (0-100) | Required | **Deterministic** - Overall ATS compatibility score (0-100 scale) |
| `advancement_probability` | Number (0-1) | Required | **Probabilistic** - Probability of passing ATS stage and advancing to recruiter review |
| `required_fields_status` | Object | Required | **Deterministic** - Status of required fields |
| `required_fields_status.email` | Boolean | Required | Whether email field is present |
| `required_fields_status.phone` | Boolean | Required | Whether phone field is present |
| `required_fields_status.work_history` | Boolean | Required | Whether work history is present |
| `required_fields_status.education` | Boolean | Optional | Whether education is present |
| `required_fields_status.all_present` | Boolean | Required | **Deterministic** - Whether all required fields are present |
| `hard_filters` | Object | Optional | **Deterministic** - Evaluation of hard filter requirements |
| `hard_filters.experience_met` | Boolean | Optional | Whether minimum experience requirement is met |
| `hard_filters.education_met` | Boolean | Optional | Whether education requirement is met |
| `hard_filters.certifications_met` | Boolean | Optional | Whether certification requirements are met |
| `hard_filters.all_met` | Boolean | Optional | **Deterministic** - Whether all hard filters are met |
| `keyword_breakdown` | Object | Required | **Explainability Metadata** - Detailed keyword matching breakdown |
| `keyword_breakdown.matched_keywords` | Array[Object] | Required | List of matched keywords |
| `keyword_breakdown.matched_keywords[].keyword` | String | Required | Keyword that matched |
| `keyword_breakdown.matched_keywords[].location` | String | Required | Where keyword was found: "title", "skills", "experience", "summary" |
| `keyword_breakdown.matched_keywords[].weight` | Number | Required | **Deterministic** - Weight assigned to this match (based on location) |
| `keyword_breakdown.missing_keywords` | Array[String] | Required | List of required keywords not found |
| `keyword_breakdown.total_required` | Integer | Required | **Deterministic** - Total number of required keywords |
| `keyword_breakdown.total_matched` | Integer | Required | **Deterministic** - Total number of matched keywords |
| `parse_risk_factors` | Array[Object] | Optional | **Explainability Metadata** - Factors that may cause parse failures |
| `parse_risk_factors[].factor` | String | Required | Risk factor name: "complex_formatting", "tables", "graphics", "non_standard_sections" |
| `parse_risk_factors[].severity` | String | Required | Severity: "low", "medium", "high" |
| `parse_risk_factors[].description` | String | Required | Human-readable description of the risk |
| `ats_type` | String | Optional | **Explainability Metadata** - ATS type that was simulated: "generic", "taleo", "workday", "greenhouse", "lever" |
| `rejection_risk_factors` | Array[Object] | Optional | **Explainability Metadata** - Factors that may cause rejection |
| `rejection_risk_factors[].factor` | String | Required | Risk factor name |
| `rejection_risk_factors[].impact` | String | Required | Impact: "low", "medium", "high", "critical" |
| `rejection_risk_factors[].description` | String | Required | Human-readable description |
| `metadata` | Object | Optional | **Explainability Metadata** - Additional metadata |
| `metadata.model_version` | String | Optional | Version of ATS simulation model used |
| `metadata.computation_timestamp` | String (ISO 8601) | Optional | When computation was performed |

### Deterministic vs Probabilistic
- **Deterministic**: `keyword_match_percentage`, `compatibility_score`, `required_fields_status`, `hard_filters`, keyword counts and weights. Keyword match percentage is deterministic given extracted keywords, but depends on probabilistic keyword extraction upstream.
- **Probabilistic**: `parse_success_probability`, `keyword_match_score`, `advancement_probability`

### Explainability Metadata
- `keyword_breakdown` explains which keywords matched and where
- `parse_risk_factors` explains potential parse issues
- `rejection_risk_factors` explains what might cause rejection
- `ats_type` explains which ATS was simulated
- `metadata` contains model and computation information

---

## 7. RecruiterResult

### Purpose
Represents the results of recruiter evaluation simulation. Contains evaluation scores, career progression analysis, red flag identification, and advancement probability.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `evaluation_score` | Number (0-100) | Required | **Probabilistic** - Overall recruiter evaluation score (0-100 scale) |
| `career_progression_score` | Number (0-1) | Required | **Deterministic** - Score indicating career progression (0=no progression, 1=strong progression) |
| `job_stability_score` | Number (0-1) | Required | **Deterministic** - Score indicating job stability (0=unstable, 1=very stable) |
| `resume_quality_score` | Number (0-1) | Required | **Probabilistic** - Score indicating resume quality (formatting, clarity, impact) |
| `advancement_probability` | Number (0-1) | Required | **Probabilistic** - Probability of passing recruiter stage and advancing to interview |
| `estimated_review_time_seconds` | Number | Optional | **Probabilistic** - Estimated time recruiter would spend reviewing (in seconds) |
| `red_flags` | Array[Object] | Required | **Explainability Metadata** - Identified red flags |
| `red_flags[].type` | String | Required | Red flag type: "job_hopping", "employment_gap", "overqualification", "underqualification", "formatting_issues", "generic_resume", "inconsistent_data" |
| `red_flags[].severity` | String | Required | Severity: "low", "medium", "high", "critical" |
| `red_flags[].description` | String | Required | Human-readable description |
| `red_flags[].evidence` | String | Optional | **Explainability Metadata** - Evidence supporting this red flag |
| `career_progression_analysis` | Object | Optional | **Explainability Metadata** - Detailed career progression analysis |
| `career_progression_analysis.trajectory` | String | Required | Trajectory: "upward", "lateral", "downward", "mixed", "insufficient_data" |
| `career_progression_analysis.promotions_count` | Integer | Optional | **Deterministic** - Number of promotions detected |
| `career_progression_analysis.responsibility_increase` | Boolean | Optional | **Deterministic** - Whether responsibilities increased over time |
| `career_progression_analysis.title_progression` | Array[String] | Optional | **Explainability Metadata** - Sequence of job titles showing progression |
| `job_stability_analysis` | Object | Optional | **Explainability Metadata** - Detailed job stability analysis |
| `job_stability_analysis.average_tenure_months` | Number | Required | **Deterministic** - Average tenure at companies |
| `job_stability_analysis.short_tenure_jobs_count` | Integer | Required | **Deterministic** - Number of jobs with tenure < 12 months |
| `job_stability_analysis.employment_gaps` | Array[Object] | Optional | **Explainability Metadata** - Identified employment gaps |
| `job_stability_analysis.employment_gaps[].start_date` | String (ISO 8601) | Required | Gap start date |
| `job_stability_analysis.employment_gaps[].end_date` | String (ISO 8601) | Required | Gap end date |
| `job_stability_analysis.employment_gaps[].duration_months` | Number | Required | **Deterministic** - Gap duration in months |
| `resume_quality_metrics` | Object | Optional | **Explainability Metadata** - Resume quality metrics |
| `resume_quality_metrics.formatting_score` | Number (0-1) | Optional | **Probabilistic** - Formatting quality score |
| `resume_quality_metrics.typo_count` | Integer | Optional | **Deterministic** - Number of typos detected |
| `resume_quality_metrics.grammar_issues_count` | Integer | Optional | **Deterministic** - Number of grammar issues detected |
| `resume_quality_metrics.achievement_specificity_score` | Number (0-1) | Optional | **Probabilistic** - Score indicating how specific/quantifiable achievements are |
| `resume_quality_metrics.tailoring_score` | Number (0-1) | Optional | **Probabilistic** - Score indicating how well resume is tailored to job description |
| `visual_scanning_simulation` | Object | Optional | **Explainability Metadata** - What recruiter would notice in initial scan |
| `visual_scanning_simulation.first_noticed_elements` | Array[String] | Optional | Elements that would be noticed first: "company_names", "job_titles", "skills", "education", "achievements" |
| `visual_scanning_simulation.standout_elements` | Array[String] | Optional | Elements that stand out positively |
| `visual_scanning_simulation.concerning_elements` | Array[String] | Optional | Elements that stand out negatively |
| `metadata` | Object | Optional | **Explainability Metadata** - Additional metadata |
| `metadata.recruiter_persona` | String | Optional | Recruiter persona used: "technical", "non_technical", "experienced", "junior", "generic" |
| `metadata.model_version` | String | Optional | Version of recruiter evaluation model used |
| `metadata.ats_score_influence` | Number (0-1) | Optional | **Explainability Metadata** - How much ATS score influenced this evaluation (0=none, 1=high) |

### Deterministic vs Probabilistic
- **Deterministic**: Career progression calculations, job stability metrics (tenure, gaps, counts), typo/grammar counts
- **Probabilistic**: `evaluation_score`, `resume_quality_score`, `advancement_probability`, `estimated_review_time_seconds`, formatting and tailoring scores

### Explainability Metadata
- `red_flags` explains what concerns were identified
- `career_progression_analysis` explains progression assessment
- `job_stability_analysis` explains stability assessment
- `resume_quality_metrics` explains quality evaluation
- `visual_scanning_simulation` explains what recruiter would notice
- `metadata` contains model and persona information

---

## 8. InterviewReadinessResult

### Purpose
Represents the results of interview readiness assessment. Contains defensibility scores, predicted interview questions, and consistency risk analysis.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `readiness_score` | Number (0-100) | Required | **Probabilistic** - Overall interview readiness score (0-100 scale) |
| `defensibility_score` | Number (0-1) | Required | **Probabilistic** - Overall score indicating how defensible resume claims are |
| `advancement_probability` | Number (0-1) | Required | **Probabilistic** - Probability of passing interview stage |
| `resume_claims` | Array[Object] | Required | **Explainability Metadata** - Extracted resume claims that may be discussed |
| `resume_claims[].claim_text` | String | Required | Text of the resume claim |
| `resume_claims[].claim_type` | String | Required | Type: "achievement", "skill", "project", "experience", "certification" |
| `resume_claims[].defensibility_score` | Number (0-1) | Required | **Probabilistic** - How defensible this specific claim is |
| `resume_claims[].depth_indicator` | String | Required | Depth: "surface", "moderate", "deep" - indicates level of detail provided |
| `resume_claims[].consistency_risk` | String | Optional | Consistency risk: "low", "medium", "high" - risk of resume-interview mismatch |
| `resume_claims[].supporting_evidence` | Array[String] | Optional | **Explainability Metadata** - Evidence in resume that supports this claim |
| `predicted_questions` | Array[Object] | Required | **Explainability Metadata** - Predicted interview questions |
| `predicted_questions[].question` | String | Required | Predicted question text |
| `predicted_questions[].likelihood` | Number (0-1) | Required | **Probabilistic** - Probability this question will be asked |
| `predicted_questions[].question_type` | String | Required | Question type: "technical", "behavioral", "resume_deep_dive", "situational" |
| `predicted_questions[].related_claim` | String | Optional | **Explainability Metadata** - Resume claim this question relates to |
| `predicted_questions[].reasoning` | String | Optional | **Explainability Metadata** - Why this question is likely to be asked |
| `consistency_risks` | Array[Object] | Optional | **Explainability Metadata** - Potential resume-interview consistency issues |
| `consistency_risks[].risk_type` | String | Required | Risk type: "vague_claim", "overstated_achievement", "missing_context", "skill_depth_mismatch" |
| `consistency_risks[].severity` | String | Required | Severity: "low", "medium", "high" |
| `consistency_risks[].description` | String | Required | Human-readable description |
| `consistency_risks[].related_claim` | String | Optional | Resume claim this risk relates to |
| `consistency_risks[].mitigation_suggestion` | String | Optional | Suggestion for mitigating this risk |
| `depth_analysis` | Object | Optional | **Explainability Metadata** - Analysis of knowledge depth indicators |
| `depth_analysis.surface_level_claims` | Integer | Required | **Deterministic** - Count of surface-level claims (lack detail) |
| `depth_analysis.deep_claims` | Integer | Required | **Deterministic** - Count of deep claims (show expertise) |
| `depth_analysis.metrics_usage_score` | Number (0-1) | Optional | **Deterministic** - Score indicating use of quantifiable metrics |
| `depth_analysis.technical_depth_score` | Number (0-1) | Optional | **Probabilistic** - Score indicating technical depth (for technical roles) |
| `preparation_recommendations` | Array[Object] | Optional | **Explainability Metadata** - Interview preparation recommendations |
| `preparation_recommendations[].priority` | String | Required | Priority: "high", "medium", "low" |
| `preparation_recommendations[].category` | String | Required | Category: "claim_clarification", "skill_preparation", "story_preparation", "technical_preparation" |
| `preparation_recommendations[].recommendation` | String | Required | Specific preparation recommendation |
| `preparation_recommendations[].reasoning` | String | Optional | Why this recommendation is important |
| `metadata` | Object | Optional | **Explainability Metadata** - Additional metadata |
| `metadata.role_type` | String | Optional | Role type used for question prediction |
| `metadata.interview_type` | String | Optional | Interview type: "technical", "behavioral", "mixed" |
| `metadata.model_version` | String | Optional | Version of interview readiness model used |

### Deterministic vs Probabilistic
- **Deterministic**: Depth analysis counts, metrics usage score
- **Probabilistic**: `readiness_score`, `defensibility_score`, `advancement_probability`, claim defensibility scores, question likelihood, technical depth score

### Explainability Metadata
- `resume_claims` explains what claims were identified and their defensibility
- `predicted_questions` explains likely interview questions and reasoning
- `consistency_risks` explains potential resume-interview mismatches
- `depth_analysis` explains knowledge depth assessment
- `preparation_recommendations` provides actionable preparation guidance
- `metadata` contains model and role information

---

## 9. AggregatedScore

### Purpose
Represents aggregated scores and probabilities across all evaluation stages. Contains end-to-end hiring probability, stage-specific probabilities, and signal compounding analysis.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `overall_hiring_probability` | Number (0-1) | Required | **Probabilistic** - End-to-end probability of receiving a job offer |
| `overall_hiring_probability_confidence_interval` | Object | Required | **Probabilistic** - Confidence interval for hiring probability |
| `overall_hiring_probability_confidence_interval.lower` | Number (0-1) | Required | Lower bound of confidence interval |
| `overall_hiring_probability_confidence_interval.upper` | Number (0-1) | Required | Upper bound of confidence interval |
| `overall_hiring_probability_confidence_interval.confidence_level` | Number (0-1) | Required | Confidence level (typically 0.95 for 95% interval) |
| `stage_probabilities` | Object | Required | **Probabilistic** - Probabilities for each stage |
| `stage_probabilities.ats_pass` | Number (0-1) | Required | Probability of passing ATS stage |
| `stage_probabilities.recruiter_pass` | Number (0-1) | Required | Probability of passing recruiter stage (conditional on ATS pass) |
| `stage_probabilities.interview_pass` | Number (0-1) | Required | Probability of passing interview stage (conditional on previous stages) |
| `stage_probabilities.offer` | Number (0-1) | Required | Probability of receiving offer (conditional on interview pass) |
| `overall_score` | Number (0-100) | Required | **Deterministic** - Overall composite score (0-100 scale, weighted average) |
| `signal_compounding_analysis` | Object | Optional | **Explainability Metadata** - Analysis of how signals compound across stages |
| `signal_compounding_analysis.positive_signals` | Array[Object] | Optional | Positive signals that compound |
| `signal_compounding_analysis.positive_signals[].signal` | String | Required | Signal name |
| `signal_compounding_analysis.positive_signals[].stages_affected` | Array[String] | Required | Stages affected: "ats", "recruiter", "interview" |
| `signal_compounding_analysis.positive_signals[].compound_effect` | Number | Optional | **Probabilistic** - Magnitude of compound effect on overall probability |
| `signal_compounding_analysis.negative_signals` | Array[Object] | Optional | Negative signals that compound |
| `signal_compounding_analysis.negative_signals[].signal` | String | Required | Signal name |
| `signal_compounding_analysis.negative_signals[].stages_affected` | Array[String] | Required | Stages affected |
| `signal_compounding_analysis.negative_signals[].compound_effect` | Number | Optional | **Probabilistic** - Magnitude of compound effect |
| `risk_factors` | Array[Object] | Required | **Explainability Metadata** - Risk factors ranked by impact |
| `risk_factors[].factor` | String | Required | Risk factor name |
| `risk_factors[].stage` | String | Required | Stage where risk occurs: "ats", "recruiter", "interview" |
| `risk_factors[].impact_on_overall_probability` | Number | Required | **Probabilistic** - Impact on overall hiring probability (negative number) |
| `risk_factors[].severity` | String | Required | Severity: "low", "medium", "high", "critical" |
| `risk_factors[].description` | String | Required | Human-readable description |
| `component_contributions` | Object | Optional | **Explainability Metadata** - Contribution of each stage to overall score |
| `component_contributions.ats_contribution` | Number | Optional | **Deterministic** - Contribution of ATS score to overall (0-100) |
| `component_contributions.recruiter_contribution` | Number | Optional | **Deterministic** - Contribution of recruiter score to overall |
| `component_contributions.interview_contribution` | Number | Optional | **Deterministic** - Contribution of interview score to overall |
| `metadata` | Object | Optional | **Explainability Metadata** - Additional metadata |
| `metadata.aggregation_method` | String | Optional | Method used for aggregation: "weighted_average", "conditional_probability", "ensemble" |
| `metadata.model_version` | String | Optional | Version of aggregation model used |
| `metadata.computation_timestamp` | String (ISO 8601) | Optional | When computation was performed |

### Deterministic vs Probabilistic
- **Deterministic**: `overall_score`, component contributions, aggregation formulas
- **Probabilistic**: All probabilities, confidence intervals, compound effects, impact calculations

### Explainability Metadata
- `signal_compounding_analysis` explains how signals build across stages
- `risk_factors` explains what risks exist and their impact
- `component_contributions` explains how each stage contributes to overall
- `metadata` explains aggregation method and model information

---

## 10. ExplainabilityArtifact

### Purpose
Represents explainability information generated by the Explainability Engine. Contains human-readable explanations, improvement recommendations, and counterfactual scenarios.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `stage_explanations` | Object | Required | **Explainability Metadata** - Explanations for each stage |
| `stage_explanations.ats` | Object | Required | ATS stage explanation |
| `stage_explanations.ats.summary` | String | Required | Human-readable summary of ATS evaluation |
| `stage_explanations.ats.key_factors` | Array[String] | Required | Key factors that influenced the score |
| `stage_explanations.ats.score_breakdown` | String | Optional | Detailed breakdown of how score was calculated |
| `stage_explanations.recruiter` | Object | Required | Recruiter stage explanation |
| `stage_explanations.recruiter.summary` | String | Required | Human-readable summary of recruiter evaluation |
| `stage_explanations.recruiter.key_factors` | Array[String] | Required | Key factors that influenced the score |
| `stage_explanations.recruiter.score_breakdown` | String | Optional | Detailed breakdown |
| `stage_explanations.interview` | Object | Required | Interview stage explanation |
| `stage_explanations.interview.summary` | String | Required | Human-readable summary of interview readiness |
| `stage_explanations.interview.key_factors` | Array[String] | Required | Key factors that influenced the score |
| `stage_explanations.interview.score_breakdown` | String | Optional | Detailed breakdown |
| `stage_explanations.overall` | Object | Required | Overall explanation |
| `stage_explanations.overall.summary` | String | Required | Human-readable summary of overall assessment |
| `stage_explanations.overall.key_factors` | Array[String] | Required | Key factors across all stages |
| `stage_explanations.overall.score_breakdown` | String | Optional | Detailed breakdown |
| `recommendations` | Array[Object] | Required | **Explainability Metadata** - Improvement recommendations |
| `recommendations[].priority` | String | Required | Priority: "high", "medium", "low" |
| `recommendations[].category` | String | Required | Category: "keyword_optimization", "formatting", "content_improvement", "skill_addition", "gap_explanation", "achievement_enhancement" |
| `recommendations[].action` | String | Required | Specific action to take |
| `recommendations[].impact` | String | Required | Expected impact of this action |
| `recommendations[].impact_score_delta` | Number | Optional | **Probabilistic** - Expected change in score if action is taken |
| `recommendations[].impact_probability_delta` | Number | Optional | **Probabilistic** - Expected change in probability if action is taken |
| `recommendations[].reasoning` | String | Required | Why this recommendation is important |
| `recommendations[].stage_affected` | String | Required | Stage(s) affected: "ats", "recruiter", "interview", "all" |
| `counterfactuals` | Array[Object] | Optional | **Explainability Metadata** - Counterfactual scenarios (what-if analysis) |
| `counterfactuals[].scenario` | String | Required | Description of the counterfactual scenario |
| `counterfactuals[].change_description` | String | Required | What would change |
| `counterfactuals[].expected_impact` | Object | Required | **Probabilistic** - Expected impact |
| `counterfactuals[].expected_impact.score_delta` | Number | Required | Expected change in overall score |
| `counterfactuals[].expected_impact.probability_delta` | Number | Required | Expected change in overall probability |
| `counterfactuals[].expected_impact.stage_impacts` | Object | Optional | Impact on each stage |
| `narratives` | Object | Optional | **Explainability Metadata** - Natural language narratives (generated by LLM) |
| `narratives.ats_narrative` | String | Optional | Natural language narrative for ATS stage |
| `narratives.recruiter_narrative` | String | Optional | Natural language narrative for recruiter stage |
| `narratives.interview_narrative` | String | Optional | Natural language narrative for interview stage |
| `narratives.overall_narrative` | String | Optional | Natural language narrative for overall assessment |
| `metadata` | Object | Optional | **Explainability Metadata** - Additional metadata |
| `metadata.generation_method` | String | Optional | Method used: "template_based", "llm_generated", "hybrid" |
| `metadata.llm_used` | Boolean | Optional | Whether LLM was used for narrative generation |
| `metadata.generation_timestamp` | String (ISO 8601) | Optional | When explanations were generated |

### Deterministic vs Probabilistic
- **Deterministic**: Template-based explanations, score breakdowns, action descriptions
- **Probabilistic**: Impact score deltas, probability deltas, counterfactual impacts, LLM-generated narratives

### Explainability Metadata
- **All fields are explainability metadata**: This entire model is dedicated to explainability
- `stage_explanations` explains each stage's evaluation
- `recommendations` provides actionable improvement guidance
- `counterfactuals` provides what-if analysis
- `narratives` provides natural language explanations
- `metadata` explains how explanations were generated

---

## 11. AnalysisResult

### Purpose
Top-level output model that aggregates all analysis results. This is the complete response returned to clients after resume and job description analysis. Note: `parsed_resume` and `feature_vectors` are excluded by default and only returned when explicitly requested (debug / transparency mode).

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `analysis_id` | String (UUID) | Required | Unique identifier for this analysis |
| `user_id` | String (UUID) | Required | Identifier for the user who requested analysis |
| `timestamp` | String (ISO 8601) | Required | Timestamp when analysis was completed |
| `scores` | Object | Required | All scores from evaluation stages |
| `scores.ats` | ATSResult | Required | ATS evaluation results |
| `scores.recruiter` | RecruiterResult | Required | Recruiter evaluation results |
| `scores.interview` | InterviewReadinessResult | Required | Interview readiness results |
| `scores.overall` | AggregatedScore | Required | Aggregated overall scores and probabilities |
| `explanations` | ExplainabilityArtifact | Required | All explainability information |
| `parsed_resume` | ParsedResume | Optional | Parsed resume data (if requested in options) |
| `parsed_job_description` | ParsedJobDescription | Optional | Parsed job description data (if requested in options) |
| `feature_vectors` | FeatureVector | Optional | Feature vectors (if requested in options, typically for debugging) |
| `metadata` | Object | Required | **Explainability Metadata** - Processing metadata |
| `metadata.processing_time_ms` | Integer | Required | **Deterministic** - Total processing time in milliseconds |
| `metadata.service_versions` | Object | Optional | **Explainability Metadata** - Versions of services used |
| `metadata.service_versions.parsing_service` | String | Optional | Parsing service version |
| `metadata.service_versions.ats_simulation_service` | String | Optional | ATS simulation service version |
| `metadata.service_versions.recruiter_evaluation_service` | String | Optional | Recruiter evaluation service version |
| `metadata.service_versions.interview_readiness_service` | String | Optional | Interview readiness service version |
| `metadata.service_versions.scoring_service` | String | Optional | Scoring service version |
| `metadata.service_versions.explainability_engine` | String | Optional | Explainability engine version |
| `metadata.processing_stages` | Array[Object] | Optional | **Explainability Metadata** - Processing stage information |
| `metadata.processing_stages[].stage` | String | Required | Stage name: "ingestion", "parsing", "feature_extraction", "ats_simulation", "recruiter_evaluation", "interview_readiness", "scoring", "explainability" |
| `metadata.processing_stages[].status` | String | Required | Status: "success", "partial", "failed", "skipped" |
| `metadata.processing_stages[].duration_ms` | Integer | Optional | Duration of this stage in milliseconds |
| `metadata.processing_stages[].warnings` | Array[String] | Optional | Warnings from this stage |
| `metadata.options_used` | Object | Optional | **Explainability Metadata** - Options that were used for this analysis |
| `metadata.options_used.ats_type` | String | Optional | ATS type that was simulated |
| `metadata.options_used.recruiter_persona` | String | Optional | Recruiter persona that was used |
| `metadata.options_used.role_level` | String | Optional | Role level that was assumed |

### Deterministic vs Probabilistic
- **Deterministic**: `metadata.processing_time_ms`, processing durations
- **Probabilistic**: All scores and probabilities within nested objects (ATSResult, RecruiterResult, etc.)

### Explainability Metadata
- `explanations` contains all explainability information
- `metadata` contains processing explainability (versions, stages, options)
- `parsed_resume` and `parsed_job_description` contain parsing explainability (if included)
- `feature_vectors` contains feature extraction explainability (if included)

---

## Notes on Field Types

### String Types
- **UUID**: Universally Unique Identifier (e.g., "550e8400-e29b-41d4-a716-446655440000")
- **ISO 8601**: ISO 8601 date/time format (e.g., "2024-01-15T10:30:00Z")
- **Enum**: One of a predefined set of string values
- **Base64**: Base64-encoded binary data

### Number Types
- **Integer**: Whole number
- **Number**: Floating-point number
- **Number (0-1)**: Floating-point number between 0 and 1 (probability or normalized score)
- **Number (0-100)**: Floating-point number between 0 and 100 (percentage or score)

### Object Types
- **Object**: Nested object structure
- **Array[Type]**: Array of specified type

### Boolean Types
- **Boolean**: true or false

---

## Assumptions

1. **UUID Format**: All UUIDs follow standard UUID v4 format
2. **Date Formats**: All dates use ISO 8601 format with timezone information
3. **Probability Ranges**: All probabilities are between 0 and 1 (inclusive)
4. **Score Ranges**: Scores are either 0-1 (normalized) or 0-100 (percentage-like), as specified
5. **Confidence Scores**: All confidence scores are between 0 and 1 (inclusive)
6. **Optional Fields**: Optional fields may be null, omitted, or have default values depending on implementation
7. **Array Ordering**: Arrays maintain order unless otherwise specified (e.g., "ranked by impact")
8. **String Encoding**: All strings use UTF-8 encoding

---

## Version History

- **v1.0** (2024): Initial canonical data model definitions

