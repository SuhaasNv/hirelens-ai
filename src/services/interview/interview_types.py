"""
Internal interview readiness evaluation data structures.

Lightweight representations used by interview readiness evaluators for deterministic results.
These are internal types, not the full canonical InterviewReadinessResult model defined in
docs/contracts/data_models.md.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ResumeClaim:
    """Represents a claim made in the resume that may be discussed in interviews."""

    claim_text: str
    claim_type: str
    defensibility_score: float
    depth_indicator: str
    consistency_risk: Optional[str] = None
    supporting_evidence: List[str] = field(default_factory=list)


@dataclass
class PredictedInterviewQuestion:
    """Represents a predicted interview question."""

    question: str
    likelihood: float
    question_type: str
    related_claim: Optional[str] = None
    reasoning: Optional[str] = None


@dataclass
class ConsistencyRisk:
    """Represents a potential consistency risk between resume and interview."""

    risk_type: str
    severity: str
    description: str
    related_claim: Optional[str] = None
    mitigation_suggestion: Optional[str] = None


@dataclass
class InterviewReadinessResultInternal:
    """
    Internal representation of interview readiness evaluation results.
    
    Lightweight structure for interview readiness evaluator use, containing only
    explainable fields and analysis data.
    """

    readiness_score: float = 0.0
    resume_claims: List[ResumeClaim] = field(default_factory=list)
    predicted_questions: List[PredictedInterviewQuestion] = field(default_factory=list)
    consistency_risks: List[ConsistencyRisk] = field(default_factory=list)

