# HireLens AI API Contracts

## Document Information

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Design Phase  
**Purpose**: Defines public API contracts for HireLens AI resume and interview intelligence platform

---

## Overview

This document defines the public REST API contracts for HireLens AI. All endpoints follow RESTful conventions and use JSON for request and response payloads.

**Base URL**: `/api/v1`

**Content-Type**: `application/json`

**Character Encoding**: UTF-8

**API Versioning**: Versioned via URL path (`/api/v1/`). Future versions will use `/api/v2/`, etc.

---

## Standard Error Response

All error responses follow a consistent format defined by the `ErrorResponse` model.

### ErrorResponse Model

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `error_code` | String | Required | Machine-readable error code (e.g., "VALIDATION_ERROR", "FILE_TOO_LARGE", "INVALID_FORMAT") |
| `message` | String | Required | Human-readable error message |
| `details` | Object | Optional | Additional error details (field-specific errors, constraints, etc.) |
| `request_id` | String (UUID) | Optional | Request correlation ID for debugging |
| `timestamp` | String (ISO 8601) | Required | Timestamp when error occurred |

**Example Error Response:**
```
{
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid request: missing required field 'resume'",
  "details": {
    "field": "resume",
    "constraint": "required"
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Endpoints

### 1. POST /api/v1/analyze

#### Purpose
Performs comprehensive analysis of a resume against a job description. Returns scores, probabilities, and explainability information for ATS, recruiter, and interview stages.

#### HTTP Method and Path
`POST /api/v1/analyze`

#### Request Body
The request body contains a resume and job description for analysis.

**Request Model:**
```
{
  "resume": ResumeInput,
  "job_description": JobDescriptionInput,
  "options": {
    "include_parsed_resume": Boolean (optional, default: false),
    "include_parsed_job_description": Boolean (optional, default: false),
    "include_feature_vectors": Boolean (optional, default: false),
    "ats_type": String (optional, default: "generic"),
    "recruiter_persona": String (optional, default: "generic"),
    "role_level": String (optional)
  }
}
```

**Field Descriptions:**
- `resume`: Required. Resume input data (see `ResumeInput` model in data_models.md)
- `job_description`: Required. Job description input data (see `JobDescriptionInput` model in data_models.md)
- `options.include_parsed_resume`: Optional. If true, includes parsed resume data in response
- `options.include_parsed_job_description`: Optional. If true, includes parsed job description data in response
- `options.include_feature_vectors`: Optional. If true, includes feature vectors in response (debug mode)
- `options.ats_type`: Optional. ATS type to simulate: "generic", "taleo", "workday", "greenhouse", "lever"
- `options.recruiter_persona`: Optional. Recruiter persona: "technical", "non_technical", "experienced", "junior", "generic"
- `options.role_level`: Optional. Role level hint: "entry", "mid", "senior", "staff", "principal", "executive"

#### Response Body
**Success Response (200 OK):**
Returns `AnalysisResult` model (see data_models.md). user_id is included in the response only if provided in the request. Anonymous analyses omit this field.

#### Success Response Example
```
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-01-15T10:30:15Z",
  "scores": {
    "ats": {
      "parse_success_probability": 0.95,
      "keyword_match_score": 0.78,
      "keyword_match_percentage": 78,
      "compatibility_score": 82,
      "advancement_probability": 0.85,
      "required_fields_status": {
        "email": true,
        "phone": true,
        "work_history": true,
        "education": true,
        "all_present": true
      },
      "keyword_breakdown": {
        "matched_keywords": [
          {
            "keyword": "Python",
            "location": "skills",
            "weight": 1.0
          }
        ],
        "missing_keywords": ["Docker", "Kubernetes"],
        "total_required": 10,
        "total_matched": 8
      }
    },
    "recruiter": {
      "evaluation_score": 75,
      "career_progression_score": 0.80,
      "job_stability_score": 0.68,
      "resume_quality_score": 0.72,
      "advancement_probability": 0.70,
      "red_flags": []
    },
    "interview": {
      "readiness_score": 68,
      "defensibility_score": 0.72,
      "advancement_probability": 0.65,
      "resume_claims": [],
      "predicted_questions": []
    },
    "overall": {
      "overall_hiring_probability": 0.55,
      "overall_hiring_probability_confidence_interval": {
        "lower": 0.48,
        "upper": 0.62,
        "confidence_level": 0.95
      },
      "overall_score": 72,
      "stage_probabilities": {
        "ats_pass": 0.85,
        "recruiter_pass": 0.70,
        "interview_pass": 0.65,
        "offer": 0.55
      }
    }
  },
  "explanations": {
    "stage_explanations": {
      "ats": {
        "summary": "Your resume has a high probability of passing ATS screening...",
        "key_factors": [
          "Strong keyword match (78%)",
          "All required fields present",
          "Clean formatting"
        ]
      },
      "recruiter": {
        "summary": "Recruiter evaluation shows positive career progression...",
        "key_factors": [
          "Upward career trajectory",
          "Good job stability",
          "Well-formatted resume"
        ]
      },
      "interview": {
        "summary": "Interview readiness assessment indicates moderate defensibility...",
        "key_factors": [
          "Most claims are defensible",
          "Some claims lack depth",
          "Prepare for technical questions"
        ]
      },
      "overall": {
        "summary": "Overall hiring probability is 55% with moderate confidence...",
        "key_factors": [
          "Strong ATS performance",
          "Good recruiter evaluation",
          "Moderate interview readiness"
        ]
      }
    },
    "recommendations": [
      {
        "priority": "high",
        "category": "keyword_optimization",
        "action": "Add 'Docker' and 'Kubernetes' to skills section",
        "impact": "ATS score would increase by 8 points",
        "impact_score_delta": 8,
        "impact_probability_delta": 0.05,
        "reasoning": "These are required keywords missing from your resume",
        "stage_affected": "ats"
      }
    ]
  },
  "metadata": {
    "processing_time_ms": 1250,
    "service_versions": {
      "parsing_service": "1.2.0",
      "ats_simulation_service": "2.1.0"
    },
    "processing_stages": [
      {
        "stage": "ingestion",
        "status": "success",
        "duration_ms": 50
      },
      {
        "stage": "parsing",
        "status": "success",
        "duration_ms": 200
      }
    ]
  }
}
```

#### Error Responses

**400 Bad Request - Validation Error**
```
{
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid request: missing required field 'resume'",
  "details": {
    "field": "resume",
    "constraint": "required"
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**400 Bad Request - Invalid File Format**
```
{
  "error_code": "INVALID_FILE_FORMAT",
  "message": "Unsupported file format. Supported formats: pdf, doc, docx, txt",
  "details": {
    "provided_format": "jpg",
    "supported_formats": ["pdf", "doc", "docx", "txt"]
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**413 Payload Too Large - File Too Large**
```
{
  "error_code": "FILE_TOO_LARGE",
  "message": "Resume file exceeds maximum size limit of 5MB",
  "details": {
    "file_size_bytes": 10485760,
    "max_size_bytes": 5242880
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**422 Unprocessable Entity - Parsing Failure**
```
{
  "error_code": "PARSING_FAILURE",
  "message": "Unable to parse resume: corrupted file or unsupported format",
  "details": {
    "parsing_errors": [
      "Cannot extract text from PDF",
      "Missing required sections"
    ]
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**500 Internal Server Error**
```
{
  "error_code": "INTERNAL_ERROR",
  "message": "An internal error occurred while processing your request",
  "details": {},
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**504 Gateway Timeout**
```
{
  "error_code": "TIMEOUT",
  "message": "Request timed out after 30 seconds",
  "details": {
    "timeout_seconds": 30
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:30Z"
}
```

#### Deterministic vs Probabilistic Behavior
- **Deterministic**: Request validation, file format detection, file size checks, parsing structure validation
- **Probabilistic**: All scoring, probability calculations, and ML model inferences (ATS scores, recruiter evaluation, interview readiness, hiring probability)

#### Idempotency Considerations
- This endpoint is **not idempotent**. Each request creates a new analysis with a unique `analysis_id`.
- Clients cannot supply analysis_id. A new analysis_id is always generated per request.
- Duplicate requests with the same inputs will produce different `analysis_id` values but may produce similar results.

#### Timeout Expectations
- **Expected Processing Time**: 1-5 seconds for typical requests
- **Client Timeout**: Recommended 30 seconds
- **Server Timeout**: 30 seconds (returns 504 if exceeded)
- **Long-running requests**: May take up to 10 seconds for complex resumes or when debug options are enabled

---

### 2. GET /api/v1/analysis/{analysis_id}

#### Purpose
Retrieves previously completed analysis results by analysis ID. Useful for retrieving previously generated analysis results without reprocessing.

#### HTTP Method and Path
`GET /api/v1/analysis/{analysis_id}`

#### Path Parameters
- `analysis_id` (String, UUID, Required): Unique identifier for the analysis to retrieve

#### Request Body
None (GET request)

#### Response Body
**Success Response (200 OK):**
Returns `AnalysisResult` model (see data_models.md), same structure as POST /api/v1/analyze response.

#### Success Response Example
Same as POST /api/v1/analyze success response example.

#### Error Responses

**404 Not Found - Analysis Not Found**
```
{
  "error_code": "ANALYSIS_NOT_FOUND",
  "message": "Analysis with ID '550e8400-e29b-41d4-a716-446655440000' not found",
  "details": {
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "request_id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**400 Bad Request - Invalid Analysis ID**
```
{
  "error_code": "INVALID_ANALYSIS_ID",
  "message": "Invalid analysis ID format. Expected UUID format",
  "details": {
    "provided_id": "invalid-id-format"
  },
  "request_id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**500 Internal Server Error**
```
{
  "error_code": "INTERNAL_ERROR",
  "message": "An internal error occurred while retrieving analysis",
  "details": {},
  "request_id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

#### Deterministic vs Probabilistic Behavior
- **Deterministic**: Analysis ID validation, retrieval of stored analysis results
- **Probabilistic**: None (this endpoint only retrieves previously computed results)

#### Idempotency Considerations
- This endpoint is **idempotent**. Multiple requests with the same `analysis_id` return the same result.
- No side effects occur from repeated calls.

#### Timeout Expectations
- **Expected Processing Time**: < 100 milliseconds (simple database lookup)
- **Client Timeout**: Recommended 5 seconds
- **Server Timeout**: 5 seconds

---

### 3. POST /api/v1/validate-inputs

#### Purpose
Validates resume and job description inputs before submitting a full analysis request. Useful for client-side validation and providing immediate feedback on input quality.

#### HTTP Method and Path
`POST /api/v1/validate-inputs`

#### Request Body
```
{
  "resume": ResumeInput,
  "job_description": JobDescriptionInput
}
```

**Field Descriptions:**
- `resume`: Required. Resume input data (see `ResumeInput` model in data_models.md)
- `job_description`: Required. Job description input data (see `JobDescriptionInput` model in data_models.md)

No files or inputs are stored or persisted by this endpoint.

#### Response Body
**Success Response (200 OK):**
```
{
  "valid": Boolean,
  "resume_validation": {
    "valid": Boolean,
    "errors": Array[Object],
    "warnings": Array[Object]
  },
  "job_description_validation": {
    "valid": Boolean,
    "errors": Array[Object],
    "warnings": Array[Object]
  }
}
```

**Validation Error Object:**
```
{
  "field": String,
  "error_code": String,
  "message": String,
  "constraint": String (optional)
}
```

**Validation Warning Object:**
```
{
  "field": String,
  "warning_code": String,
  "message": String
}
```

#### Success Response Example
```
{
  "valid": true,
  "resume_validation": {
    "valid": true,
    "errors": [],
    "warnings": [
      {
        "field": "file_format",
        "warning_code": "LOW_CONFIDENCE_FORMAT",
        "message": "File format detection has low confidence. Explicitly specify file_format for better results."
      }
    ]
  },
  "job_description_validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

**Example with Validation Errors:**
```
{
  "valid": false,
  "resume_validation": {
    "valid": false,
    "errors": [
      {
        "field": "file_content",
        "error_code": "MISSING_REQUIRED_FIELD",
        "message": "Resume file content is required",
        "constraint": "required"
      },
      {
        "field": "file_format",
        "error_code": "INVALID_ENUM_VALUE",
        "message": "Invalid file format. Must be one of: pdf, doc, docx, txt",
        "constraint": "enum"
      }
    ],
    "warnings": []
  },
  "job_description_validation": {
    "valid": false,
    "errors": [
      {
        "field": "job_description_text",
        "error_code": "MISSING_REQUIRED_FIELD",
        "message": "Job description text is required",
        "constraint": "required"
      }
    ],
    "warnings": []
  }
}
```

#### Error Responses

**400 Bad Request - Invalid Request Format**
```
{
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid request: missing required field 'resume'",
  "details": {
    "field": "resume",
    "constraint": "required"
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**413 Payload Too Large - File Too Large**
```
{
  "error_code": "FILE_TOO_LARGE",
  "message": "Resume file exceeds maximum size limit of 5MB",
  "details": {
    "file_size_bytes": 10485760,
    "max_size_bytes": 5242880
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**500 Internal Server Error**
```
{
  "error_code": "INTERNAL_ERROR",
  "message": "An internal error occurred while validating inputs",
  "details": {},
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Deterministic vs Probabilistic Behavior
- **Deterministic**: All validation logic (field presence, format validation, size checks, enum validation, data type validation)
- **Probabilistic**: None (pure validation, no ML inference)

#### Idempotency Considerations
- This endpoint is **idempotent**. Multiple requests with the same inputs return the same validation results.
- No side effects occur from repeated calls.
- No analysis is performed; only validation.

#### Timeout Expectations
- **Expected Processing Time**: < 500 milliseconds (fast validation checks)
- **Client Timeout**: Recommended 5 seconds
- **Server Timeout**: 5 seconds

---

### 4. GET /api/v1/health

#### Purpose
Health check endpoint for monitoring and load balancer health checks. Returns service status and basic system information.

#### HTTP Method and Path
`GET /api/v1/health`

#### Request Body
None (GET request)

#### Response Body
**Success Response (200 OK):**
```
{
  "status": String,
  "timestamp": String (ISO 8601),
  "version": String,
  "services": {
    "parsing_service": String,
    "ats_simulation_service": String,
    "recruiter_evaluation_service": String,
    "interview_readiness_service": String,
    "scoring_service": String,
    "explainability_engine": String
  }
}
```

**Status Values:**
- `"healthy"`: All services operational
- `"degraded"`: Some services unavailable but core functionality works
- `"unhealthy"`: Critical services unavailable

**Service Status Values:**
- `"operational"`: Service is functioning normally
- `"degraded"`: Service is functioning but with reduced performance or limited features
- `"unavailable"`: Service is not available

#### Success Response Example
```
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "parsing_service": "operational",
    "ats_simulation_service": "operational",
    "recruiter_evaluation_service": "operational",
    "interview_readiness_service": "operational",
    "scoring_service": "operational",
    "explainability_engine": "operational"
  }
}
```

**Degraded Status Example:**
```
{
  "status": "degraded",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "parsing_service": "operational",
    "ats_simulation_service": "operational",
    "recruiter_evaluation_service": "operational",
    "interview_readiness_service": "operational",
    "scoring_service": "operational",
    "explainability_engine": "unavailable"
  }
}
```

#### Error Responses

**503 Service Unavailable**
```
{
  "error_code": "SERVICE_UNAVAILABLE",
  "message": "Service is currently unavailable",
  "details": {
    "status": "unhealthy"
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Deterministic vs Probabilistic Behavior
- **Deterministic**: All health check logic (service status checks, version retrieval, timestamp generation)
- **Probabilistic**: None (pure status reporting)

#### Idempotency Considerations
- This endpoint is **idempotent**. Multiple requests return current status (which may change over time, but requests themselves have no side effects).
- No side effects occur from repeated calls.

#### Timeout Expectations
- **Expected Processing Time**: < 100 milliseconds (fast status checks)
- **Client Timeout**: Recommended 2 seconds
- **Server Timeout**: 2 seconds

---

## Common Error Codes

The following error codes are used across all endpoints:

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed (missing required fields, invalid types, etc.) |
| `INVALID_FILE_FORMAT` | 400 | Unsupported file format |
| `FILE_TOO_LARGE` | 413 | File exceeds maximum size limit |
| `INVALID_ANALYSIS_ID` | 400 | Invalid analysis ID format |
| `ANALYSIS_NOT_FOUND` | 404 | Analysis with specified ID not found |
| `PARSING_FAILURE` | 422 | Unable to parse resume or job description |
| `TIMEOUT` | 504 | Request processing timed out |
| `SERVICE_UNAVAILABLE` | 503 | Service is currently unavailable |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Request/Response Conventions

### Request Headers
- `Content-Type: application/json` (required for POST requests)
- `Accept: application/json` (optional, JSON is default)

### Response Headers
- `Content-Type: application/json`
- `X-Request-ID: <uuid>` (correlation ID for debugging)

### HTTP Status Codes
- `200 OK`: Successful request
- `400 Bad Request`: Client error (validation, invalid format, etc.)
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `422 Unprocessable Entity`: Processing failure (parsing, etc.)
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service unavailable
- `504 Gateway Timeout`: Request timeout

### Date/Time Format
All timestamps use ISO 8601 format with timezone: `YYYY-MM-DDTHH:mm:ssZ`

Example: `2024-01-15T10:30:00Z`

### UUID Format
All UUIDs follow UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

Example: `550e8400-e29b-41d4-a716-446655440000`

---

## Rate Limiting

**Note**: Rate limiting is not implemented in MVP but will be added in future versions. Current expectations:
- No rate limits for MVP
- Future versions will include rate limiting headers and 429 responses

---

## Versioning Strategy

- API versioning via URL path (`/api/v1/`, `/api/v2/`, etc.)
- Breaking changes require new version
- Non-breaking changes (new optional fields, new endpoints) can be added to existing version
- Deprecated endpoints will be announced with at least 6 months notice

---

## Assumptions

1. **Synchronous Processing**: All endpoints are synchronous (no async callbacks or webhooks)
2. **No Authentication**: MVP does not require authentication (future versions will add auth)
3. **No Pagination**: All responses fit in single response (no pagination needed)
4. **JSON Only**: All requests and responses use JSON format
5. **UTF-8 Encoding**: All text is UTF-8 encoded
6. **Idempotency**: GET and validation endpoints are idempotent; POST /analyze is not
7. **Timeout Handling**: Clients should implement appropriate timeouts based on endpoint expectations

---

## Version History

- **v1.0** (2024): Initial API contract definitions
