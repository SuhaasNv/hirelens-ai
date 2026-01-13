"""
Internal scoring aggregation data structures.

Lightweight representations used by scoring aggregators for deterministic results.
These are internal types, not the full canonical AggregatedScore model defined in
docs/contracts/data_models.md.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class StageProbabilities:
    """Probabilities for passing each stage of the hiring funnel."""

    ats_pass: float = 0.0
    recruiter_pass: float = 0.0
    interview_pass: float = 0.0
    offer: float = 0.0


@dataclass
class SignalImpact:
    """Represents the impact of a signal across stages."""

    signal: str
    stages_affected: List[str]
    compound_effect: Optional[float] = None


@dataclass
class RiskFactor:
    """Represents a risk factor that impacts hiring probability."""

    factor: str
    stage: str
    impact_on_overall_probability: float
    severity: str
    description: str


@dataclass
class ComponentContributions:
    """Contribution of each stage to the overall score."""

    ats_contribution: Optional[float] = None
    recruiter_contribution: Optional[float] = None
    interview_contribution: Optional[float] = None


@dataclass
class SignalCompoundingSummary:
    """Summary of how signals compound across stages."""

    positive_signals: List[SignalImpact] = field(default_factory=list)
    negative_signals: List[SignalImpact] = field(default_factory=list)


@dataclass
class AggregatedScoreInternal:
    """
    Internal representation of aggregated scoring results.
    
    Lightweight structure for scoring aggregator use, containing only
    explainable fields and aggregation data.
    """

    overall_score: float = 0.0
    stage_probabilities: StageProbabilities = field(default_factory=StageProbabilities)
    risk_factors: List[RiskFactor] = field(default_factory=list)
    component_contributions: ComponentContributions = field(default_factory=ComponentContributions)
    signal_compounding_summary: SignalCompoundingSummary = field(
        default_factory=SignalCompoundingSummary
    )

