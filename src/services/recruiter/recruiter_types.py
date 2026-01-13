"""
Internal recruiter evaluation data structures.

Lightweight representations used by recruiter evaluators for deterministic results.
These are internal types, not the full canonical RecruiterResult model defined in
docs/contracts/data_models.md.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class EmploymentGap:
    """Represents an employment gap."""

    start_date: str
    end_date: str
    duration_months: float


@dataclass
class RecruiterRedFlag:
    """Represents a red flag identified during recruiter evaluation."""

    type: str
    severity: str
    description: str
    evidence: Optional[str] = None


@dataclass
class CareerProgressionAnalysis:
    """Analysis of career progression trajectory."""

    trajectory: str
    promotions_count: Optional[int] = None
    responsibility_increase: Optional[bool] = None
    title_progression: List[str] = field(default_factory=list)


@dataclass
class JobStabilityAnalysis:
    """Analysis of job stability and tenure patterns."""

    average_tenure_months: float
    short_tenure_jobs_count: int
    employment_gaps: List[EmploymentGap] = field(default_factory=list)


@dataclass
class RecruiterResultInternal:
    """
    Internal representation of recruiter evaluation results.
    
    Lightweight structure for recruiter evaluator use, containing only
    explainable fields and analysis data.
    """

    evaluation_score: float = 0.0
    career_progression_score: float = 0.0
    job_stability_score: float = 0.0
    red_flags: List[RecruiterRedFlag] = field(default_factory=list)
    career_progression_analysis: Optional[CareerProgressionAnalysis] = None
    job_stability_analysis: Optional[JobStabilityAnalysis] = None
    recruiter_persona: Optional[str] = None

