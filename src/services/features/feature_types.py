"""
Internal feature extraction data structures.

Lightweight representations used by feature extractors for deterministic features.
These are internal types, not the full canonical FeatureVector model defined in
docs/contracts/data_models.md.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class QuantitativeFeatures:
    """
    Internal representation of quantitative/numerical features.
    
    Contains only deterministic features that can be computed from rules and formulas.
    """

    years_experience: Optional[float] = None
    skills_count: Optional[int] = None
    keyword_match_count: Optional[int] = None
    resume_length_words: Optional[int] = None


@dataclass
class CategoricalFeatures:
    """
    Internal representation of categorical features.
    
    Contains only deterministic boolean flags and categorical values.
    """

    has_required_skills: Optional[bool] = None
    has_required_degree: Optional[bool] = None


@dataclass
class FeatureVectorInternal:
    """
    Internal representation of extracted features.
    
    Lightweight structure for feature extractor use, containing only
    deterministic features and metadata for explainability.
    """

    quantitative: QuantitativeFeatures = field(default_factory=QuantitativeFeatures)
    categorical: CategoricalFeatures = field(default_factory=CategoricalFeatures)

    # Metadata for explainability
    missing_features: List[str] = field(default_factory=list)
    computation_method: Dict[str, str] = field(default_factory=dict)

