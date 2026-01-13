"""
API request schemas.

These models define the request structures for API endpoints.
Canonical data models are defined in docs/contracts/data_models.md.

This module provides API-facing request wrappers that reference canonical models:
- ResumeInput (canonical model)
- JobDescriptionInput (canonical model)
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AnalyzeOptions(BaseModel):
    """Options for analysis request."""

    include_parsed_resume: bool = Field(default=False, description="Include parsed resume data in response")
    include_parsed_job_description: bool = Field(
        default=False, description="Include parsed job description data in response"
    )
    include_feature_vectors: bool = Field(default=False, description="Include feature vectors in response (debug mode)")
    ats_type: Optional[str] = Field(
        default="generic",
        description='ATS type to simulate: "generic", "taleo", "workday", "greenhouse", "lever"',
    )
    recruiter_persona: Optional[str] = Field(
        default="generic",
        description='Recruiter persona: "technical", "non_technical", "experienced", "junior", "generic"',
    )
    role_level: Optional[str] = Field(
        default=None,
        description='Role level hint: "entry", "mid", "senior", "staff", "principal", "executive"',
    )


class AnalyzeRequest(BaseModel):
    """
    Request model for POST /api/v1/analyze.
    
    References canonical models:
    - resume: ResumeInput (see docs/contracts/data_models.md)
    - job_description: JobDescriptionInput (see docs/contracts/data_models.md)
    """

    resume: dict = Field(..., description="Resume input data (ResumeInput canonical model)")
    job_description: dict = Field(..., description="Job description input data (JobDescriptionInput canonical model)")
    options: Optional[AnalyzeOptions] = Field(default=None, description="Analysis options")


class ValidateInputsRequest(BaseModel):
    """
    Request model for POST /api/v1/validate-inputs.
    
    References canonical models:
    - resume: ResumeInput (see docs/contracts/data_models.md)
    - job_description: JobDescriptionInput (see docs/contracts/data_models.md)
    """

    resume: dict = Field(..., description="Resume input data (ResumeInput canonical model)")
    job_description: dict = Field(..., description="Job description input data (JobDescriptionInput canonical model)")

