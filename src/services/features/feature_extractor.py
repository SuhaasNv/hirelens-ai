"""
Deterministic feature extraction service.

Computes simple features from parsed resume and job description data
using rule-based methods only.
"""

from typing import List

from src.services.features.feature_types import (
    CategoricalFeatures,
    FeatureVectorInternal,
    QuantitativeFeatures,
)
from src.services.parsing.parsing_types import (
    ParsedJobDescriptionInternal,
    ParsedResumeInternal,
)


class FeatureExtractor:
    """
    Extracts deterministic features from parsed resume and job description.
    
    Uses simple heuristics and rules. No ML or embeddings.
    """

    def extract(
        self,
        parsed_resume: ParsedResumeInternal,
        parsed_job_description: ParsedJobDescriptionInternal,
    ) -> FeatureVectorInternal:
        """
        Extract features from parsed resume and job description.
        
        Args:
            parsed_resume: Parsed resume data
            parsed_job_description: Parsed job description data
            
        Returns:
            FeatureVectorInternal with computed features and metadata
        """
        features = FeatureVectorInternal()

        # Quantitative features
        features.quantitative.skills_count = self._compute_skills_count(parsed_resume, features)
        features.quantitative.keyword_match_count = self._compute_keyword_match_count(
            parsed_resume, parsed_job_description, features
        )
        features.quantitative.resume_length_words = self._compute_resume_length_words(
            parsed_resume, features
        )
        features.quantitative.years_experience = self._compute_years_experience(
            parsed_resume, features
        )

        # Categorical features
        features.categorical.has_required_skills = self._compute_has_required_skills(
            parsed_resume, parsed_job_description, features
        )
        features.categorical.has_required_degree = self._compute_has_required_degree(
            parsed_resume, parsed_job_description, features
        )

        return features

    def _compute_skills_count(
        self, parsed_resume: ParsedResumeInternal, features: FeatureVectorInternal
    ) -> int:
        """Compute total number of skills."""
        if parsed_resume.skills is not None:
            count = len(parsed_resume.skills)
            features.computation_method["skills_count"] = "deterministic_rule"
            return count
        else:
            features.missing_features.append("skills_count")
            return 0

    def _compute_keyword_match_count(
        self,
        parsed_resume: ParsedResumeInternal,
        parsed_job_description: ParsedJobDescriptionInternal,
        features: FeatureVectorInternal,
    ) -> int:
        """Compute count of matching keywords between resume and job description."""
        if not parsed_resume.skills or not parsed_job_description.required_skills:
            features.missing_features.append("keyword_match_count")
            return 0

        resume_skills_lower = [skill.lower() for skill in parsed_resume.skills]
        required_skills_lower = [skill.lower() for skill in parsed_job_description.required_skills]

        matches = sum(1 for skill in required_skills_lower if skill in resume_skills_lower)
        features.computation_method["keyword_match_count"] = "deterministic_rule"
        return matches

    def _compute_resume_length_words(
        self, parsed_resume: ParsedResumeInternal, features: FeatureVectorInternal
    ) -> int:
        """Compute total word count in resume."""
        if parsed_resume.work_experience:
            word_count = 0
            for exp in parsed_resume.work_experience:
                if isinstance(exp, dict):
                    description = exp.get("description", "")
                    if isinstance(description, str):
                        word_count += len(description.split())
            if word_count > 0:
                features.computation_method["resume_length_words"] = "deterministic_rule"
                return word_count

        features.missing_features.append("resume_length_words")
        return 0

    def _compute_years_experience(
        self, parsed_resume: ParsedResumeInternal, features: FeatureVectorInternal
    ) -> float:
        """Compute years of experience using simple heuristic."""
        if not parsed_resume.work_experience:
            features.missing_features.append("years_experience")
            return 0.0

        total_months = 0
        for exp in parsed_resume.work_experience:
            if isinstance(exp, dict):
                start_date = exp.get("start_date")
                end_date = exp.get("end_date")
                if start_date and end_date:
                    total_months += 12

        years = total_months / 12.0 if total_months > 0 else 0.0
        features.computation_method["years_experience"] = "deterministic_heuristic"
        return years

    def _compute_has_required_skills(
        self,
        parsed_resume: ParsedResumeInternal,
        parsed_job_description: ParsedJobDescriptionInternal,
        features: FeatureVectorInternal,
    ) -> bool:
        """Check if resume has all required skills."""
        if not parsed_resume.skills or not parsed_job_description.required_skills:
            features.missing_features.append("has_required_skills")
            return False

        resume_skills_lower = [skill.lower() for skill in parsed_resume.skills]
        required_skills_lower = [skill.lower() for skill in parsed_job_description.required_skills]

        has_all = all(skill in resume_skills_lower for skill in required_skills_lower)
        features.computation_method["has_required_skills"] = "deterministic_rule"
        return has_all

    def _compute_has_required_degree(
        self,
        parsed_resume: ParsedResumeInternal,
        parsed_job_description: ParsedJobDescriptionInternal,
        features: FeatureVectorInternal,
    ) -> bool:
        """Check if resume has required education level."""
        if not parsed_job_description.required_education:
            features.missing_features.append("has_required_degree")
            return False

        if not parsed_resume.education:
            return False

        required_edu_lower = parsed_job_description.required_education.lower()
        for edu in parsed_resume.education:
            if isinstance(edu, dict):
                degree = edu.get("degree", "")
                if isinstance(degree, str) and required_edu_lower in degree.lower():
                    features.computation_method["has_required_degree"] = "deterministic_rule"
                    return True

        features.computation_method["has_required_degree"] = "deterministic_rule"
        return False

