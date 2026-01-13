"""
Internal ATS simulation data structures.

Lightweight representations used by ATS simulators for deterministic results.
These are internal types, not the full canonical ATSResult model defined in
docs/contracts/data_models.md.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ATSRequiredFieldsStatus:
    """Status of required fields for ATS parsing."""

    email: bool = False
    phone: bool = False
    work_history: bool = False
    education: bool = False
    all_present: bool = False


@dataclass
class ATSHardFilters:
    """Evaluation of hard filter requirements."""

    experience_met: Optional[bool] = None
    education_met: Optional[bool] = None
    certifications_met: Optional[bool] = None
    all_met: Optional[bool] = None


@dataclass
class MatchedKeyword:
    """Represents a matched keyword with location and weight."""

    keyword: str
    location: str
    weight: float


@dataclass
class ATSKeywordBreakdown:
    """Detailed keyword matching breakdown."""

    matched_keywords: List[MatchedKeyword] = field(default_factory=list)
    missing_keywords: List[str] = field(default_factory=list)
    total_required: int = 0
    total_matched: int = 0


@dataclass
class ATSResultInternal:
    """
    Internal representation of ATS simulation results.
    
    Lightweight structure for ATS simulator use, containing only
    deterministic fields and explainability information.
    """

    keyword_match_percentage: float = 0.0
    compatibility_score: float = 0.0
    required_fields_status: ATSRequiredFieldsStatus = field(default_factory=ATSRequiredFieldsStatus)
    hard_filters: Optional[ATSHardFilters] = None
    keyword_breakdown: ATSKeywordBreakdown = field(default_factory=ATSKeywordBreakdown)
    rejection_reasons: List[str] = field(default_factory=list)
    ats_type: Optional[str] = None

