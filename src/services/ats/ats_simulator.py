"""
Rule-based ATS simulator.

Simulates ATS screening behavior using deterministic rules and heuristics.
"""

from src.services.ats.ats_types import (
    ATSHardFilters,
    ATSKeywordBreakdown,
    ATSRequiredFieldsStatus,
    ATSResultInternal,
    MatchedKeyword,
)
from src.services.features.feature_types import FeatureVectorInternal
from src.services.parsing.parsing_types import (
    ParsedJobDescriptionInternal,
    ParsedResumeInternal,
)


class ATSSimulator:
    """
    Simulates ATS screening using rule-based logic.
    
    Evaluates required fields, hard filters, keyword matching, and
    computes compatibility scores using simple heuristics.
    """

    def simulate(
        self,
        parsed_resume: ParsedResumeInternal,
        parsed_job_description: ParsedJobDescriptionInternal,
        feature_vector: FeatureVectorInternal,
        ats_type: str = "generic",
    ) -> ATSResultInternal:
        """
        Simulate ATS screening and return results.
        
        Args:
            parsed_resume: Parsed resume data
            parsed_job_description: Parsed job description data
            feature_vector: Extracted features
            ats_type: ATS type to simulate (default: "generic")
            
        Returns:
            ATSResultInternal with compatibility score and rejection reasons
        """
        result = ATSResultInternal()
        result.ats_type = ats_type

        # 1. Required fields check
        result.required_fields_status = self._check_required_fields(parsed_resume, result)

        # 2. Hard filters check
        result.hard_filters = self._check_hard_filters(feature_vector, result)

        # 3. Keyword matching
        result.keyword_breakdown = self._compute_keyword_matching(
            parsed_resume, parsed_job_description, feature_vector, result
        )
        result.keyword_match_percentage = self._calculate_keyword_match_percentage(
            result.keyword_breakdown
        )

        # 4. Compatibility score
        result.compatibility_score = self._calculate_compatibility_score(result)

        return result

    def _check_required_fields(
        self, parsed_resume: ParsedResumeInternal, result: ATSResultInternal
    ) -> ATSRequiredFieldsStatus:
        """Check if required fields are present."""
        status = ATSRequiredFieldsStatus()

        status.email = parsed_resume.email is not None and parsed_resume.email.strip() != ""
        status.phone = parsed_resume.phone is not None and parsed_resume.phone.strip() != ""
        status.work_history = len(parsed_resume.work_experience) > 0
        status.education = len(parsed_resume.education) > 0

        status.all_present = status.email and status.phone and status.work_history

        if not status.email:
            result.rejection_reasons.append("Missing required field: email")
        if not status.phone:
            result.rejection_reasons.append("Missing required field: phone")
        if not status.work_history:
            result.rejection_reasons.append("Missing required field: work history")

        return status

    def _check_hard_filters(
        self, feature_vector: FeatureVectorInternal, result: ATSResultInternal
    ) -> ATSHardFilters:
        """Check hard filter requirements."""
        filters = ATSHardFilters()

        if feature_vector.categorical.has_required_skills is not None:
            filters.experience_met = feature_vector.categorical.has_required_skills
            if not filters.experience_met:
                result.rejection_reasons.append("Hard filter failed: missing required skills")

        if feature_vector.categorical.has_required_degree is not None:
            filters.education_met = feature_vector.categorical.has_required_degree
            if not filters.education_met:
                result.rejection_reasons.append("Hard filter failed: missing required education")

        if filters.experience_met is not None and filters.education_met is not None:
            filters.all_met = filters.experience_met and filters.education_met
        elif filters.experience_met is not None:
            filters.all_met = filters.experience_met
        elif filters.education_met is not None:
            filters.all_met = filters.education_met

        return filters

    def _compute_keyword_matching(
        self,
        parsed_resume: ParsedResumeInternal,
        parsed_job_description: ParsedJobDescriptionInternal,
        feature_vector: FeatureVectorInternal,
        result: ATSResultInternal,
    ) -> ATSKeywordBreakdown:
        """Compute keyword matching breakdown."""
        breakdown = ATSKeywordBreakdown()

        required_keywords = parsed_job_description.required_skills
        breakdown.total_required = len(required_keywords)

        if breakdown.total_required == 0:
            return breakdown

        resume_skills_lower = [skill.lower() for skill in parsed_resume.skills]

        matched = []
        missing = []

        for keyword in required_keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in resume_skills_lower:
                matched.append(
                    MatchedKeyword(
                        keyword=keyword,
                        location="skills",
                        weight=1.0,
                    )
                )
            else:
                missing.append(keyword)

        breakdown.matched_keywords = matched
        breakdown.missing_keywords = missing
        breakdown.total_matched = len(matched)

        if feature_vector.quantitative.keyword_match_count is not None:
            breakdown.total_matched = feature_vector.quantitative.keyword_match_count

        if breakdown.total_matched < breakdown.total_required:
            missing_count = breakdown.total_required - breakdown.total_matched
            result.rejection_reasons.append(
                f"Missing {missing_count} required keyword(s): {', '.join(missing[:5])}"
            )

        return breakdown

    def _calculate_keyword_match_percentage(self, breakdown: ATSKeywordBreakdown) -> float:
        """Calculate keyword match percentage."""
        if breakdown.total_required == 0:
            return 100.0

        percentage = (breakdown.total_matched / breakdown.total_required) * 100.0
        return round(percentage, 2)

    def _calculate_compatibility_score(self, result: ATSResultInternal) -> float:
        """Calculate ATS compatibility score using simple heuristic."""
        score = 100.0

        # Deduct for missing required fields
        if not result.required_fields_status.email:
            score -= 25.0
        if not result.required_fields_status.phone:
            score -= 25.0
        if not result.required_fields_status.work_history:
            score -= 30.0

        # Deduct for failed hard filters
        if result.hard_filters:
            if result.hard_filters.experience_met is False:
                score -= 20.0
            if result.hard_filters.education_met is False:
                score -= 15.0

        # Deduct for low keyword match
        if result.keyword_match_percentage < 60.0:
            penalty = 60.0 - result.keyword_match_percentage
            score -= min(penalty, 20.0)

        return max(0.0, round(score, 2))

