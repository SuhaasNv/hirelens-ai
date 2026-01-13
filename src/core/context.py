"""
Analysis context for tracking analysis state and processing metadata.

This module provides a context object that stores all data and intermediate
results throughout the analysis pipeline execution.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass
class AnalysisContext:
    """
    Context object for tracking analysis execution state.
    
    Stores input data, intermediate results, and processing metadata
    throughout the analysis pipeline.
    """

    analysis_id: str
    resume_input: Dict[str, Any]
    job_description_input: Dict[str, Any]
    options: Optional[Dict[str, Any]] = None

    # Intermediate results (populated during pipeline execution)
    parsed_resume: Optional[Dict[str, Any]] = None
    parsed_job_description: Optional[Dict[str, Any]] = None
    feature_vector: Optional[Dict[str, Any]] = None
    ats_result: Optional[Dict[str, Any]] = None
    recruiter_result: Optional[Dict[str, Any]] = None
    interview_result: Optional[Dict[str, Any]] = None
    aggregated_score: Optional[Dict[str, Any]] = None
    explainability_artifact: Optional[Dict[str, Any]] = None

    # Processing metadata
    start_time: Optional[datetime] = None
    stage_timings: Dict[str, float] = field(default_factory=dict)
    stage_statuses: Dict[str, str] = field(default_factory=dict)

