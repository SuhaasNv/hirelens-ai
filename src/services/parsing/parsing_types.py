"""
Internal parsing data structures.

Lightweight representations used by parsers for extracted data.
These are internal types, not the full canonical models defined in
docs/contracts/data_models.md.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ParsingWarning:
    """Represents a parsing warning or issue."""

    type: str
    field: str
    message: str
    severity: str


@dataclass
class ParsedResumeInternal:
    """
    Internal representation of parsed resume data.
    
    Lightweight structure for parser use, not the full canonical model.
    """

    # Personal information
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

    # Work experience (simplified list of dicts)
    work_experience: List[Dict[str, Any]] = field(default_factory=list)

    # Education (simplified list of dicts)
    education: List[Dict[str, Any]] = field(default_factory=list)

    # Skills (list of skill names)
    skills: List[str] = field(default_factory=list)

    # Confidence scores
    confidence_scores: Dict[str, float] = field(default_factory=dict)

    # Warnings
    warnings: List[ParsingWarning] = field(default_factory=list)


@dataclass
class ParsedJobDescriptionInternal:
    """
    Internal representation of parsed job description data.
    
    Lightweight structure for parser use, not the full canonical model.
    """

    # Basic information
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None

    # Skills
    required_skills: List[str] = field(default_factory=list)
    preferred_skills: List[str] = field(default_factory=list)

    # Requirements
    required_experience_years: Optional[float] = None
    required_education: Optional[str] = None
    required_certifications: List[str] = field(default_factory=list)

    # Extracted keywords
    keywords: List[str] = field(default_factory=list)

    # Warnings
    warnings: List[ParsingWarning] = field(default_factory=list)

