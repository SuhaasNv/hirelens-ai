"""
Internal explainability data structures.

Lightweight representations used by explainability engines for deterministic results.
These are internal types, not the full canonical ExplainabilityArtifact model defined in
docs/contracts/data_models.md.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class StageExplanation:
    """Explanation for a single evaluation stage."""

    summary: str
    key_factors: List[str] = field(default_factory=list)
    score_breakdown: Optional[str] = None
    referenced_signals: List[str] = field(default_factory=list)
    referenced_risks: List[str] = field(default_factory=list)
    estimated_impact: Optional[float] = None


@dataclass
class Recommendation:
    """Improvement recommendation with expected impact."""

    priority: str
    category: str
    action: str
    impact: str
    reasoning: str
    stage_affected: str
    impact_score_delta: Optional[float] = None
    impact_probability_delta: Optional[float] = None
    referenced_risk: Optional[str] = None
    referenced_signal: Optional[str] = None


@dataclass
class CounterfactualImpact:
    """Expected impact of a counterfactual scenario."""

    score_delta: float
    probability_delta: float
    stage_impacts: Dict[str, float] = field(default_factory=dict)


@dataclass
class CounterfactualScenario:
    """Counterfactual what-if scenario analysis."""

    scenario: str
    change_description: str
    expected_impact: CounterfactualImpact
    referenced_factors: List[str] = field(default_factory=list)


@dataclass
class ExplainabilityArtifactInternal:
    """
    Internal representation of explainability results.
    
    Lightweight structure for explainability engine use, containing only
    explainable fields and human-readable explanations.
    """

    stage_explanations: Dict[str, StageExplanation] = field(default_factory=dict)
    recommendations: List[Recommendation] = field(default_factory=list)
    counterfactuals: List[CounterfactualScenario] = field(default_factory=list)

