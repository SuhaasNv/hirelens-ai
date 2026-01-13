"""
Recommendation engine for HireLens AI.

Generates actionable, specific recommendations based on identified risks
across all evaluation stages.
"""

from src.services.ats.ats_types import ATSResultInternal
from src.services.explainability.explainability_types import Recommendation
from src.services.interview.interview_types import InterviewReadinessResultInternal
from src.services.recruiter.recruiter_types import RecruiterResultInternal
from src.services.scoring.scoring_types import AggregatedScoreInternal


class RecommendationEngine:
    """
    Generates actionable recommendations based on evaluation results.
    
    Maps high-impact risks to specific, actionable recommendations
    and ranks them by severity and expected impact.
    """

    def generate(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
        aggregated_score: AggregatedScoreInternal,
    ) -> list[Recommendation]:
        """
        Generate recommendations from evaluation results.
        
        Args:
            ats_result: ATS simulation results
            recruiter_result: Recruiter evaluation results
            interview_result: Interview readiness results
            aggregated_score: Aggregated scoring results
            
        Returns:
            List of recommendations ranked by priority and impact
        """
        recommendations: list[Recommendation] = []

        # 1. Map ATS risks to recommendations
        recommendations.extend(self._generate_ats_recommendations(ats_result))

        # 2. Map recruiter risks to recommendations
        recommendations.extend(self._generate_recruiter_recommendations(recruiter_result))

        # 3. Map interview risks to recommendations
        recommendations.extend(self._generate_interview_recommendations(interview_result))

        # 4. Map aggregated risk factors to recommendations
        recommendations.extend(
            self._generate_aggregated_recommendations(aggregated_score, recommendations)
        )

        # 5. Rank by severity and impact
        recommendations = self._rank_recommendations(recommendations)

        return recommendations

    def _generate_ats_recommendations(
        self, ats_result: ATSResultInternal
    ) -> list[Recommendation]:
        """Generate recommendations from ATS results."""
        recommendations: list[Recommendation] = []

        # Missing required fields
        if not ats_result.required_fields_status.email:
            recommendations.append(
                Recommendation(
                    priority="high",
                    category="formatting",
                    action="Add email address to resume header",
                    impact="ATS systems require email for contact. Missing email will cause immediate rejection.",
                    reasoning="ATS requires email field for candidate contact and tracking.",
                    stage_affected="ats",
                    impact_score_delta=25.0,
                    impact_probability_delta=0.25,
                    referenced_risk="Missing required field: email",
                )
            )

        if not ats_result.required_fields_status.phone:
            recommendations.append(
                Recommendation(
                    priority="high",
                    category="formatting",
                    action="Add phone number to resume header",
                    impact="ATS systems require phone for contact. Missing phone will cause immediate rejection.",
                    reasoning="ATS requires phone field for candidate contact and tracking.",
                    stage_affected="ats",
                    impact_score_delta=25.0,
                    impact_probability_delta=0.25,
                    referenced_risk="Missing required field: phone",
                )
            )

        if not ats_result.required_fields_status.work_history:
            recommendations.append(
                Recommendation(
                    priority="critical",
                    category="content_improvement",
                    action="Add work experience section with at least one job entry",
                    impact="ATS requires work history. Missing work history will cause immediate rejection.",
                    reasoning="ATS systems filter out resumes without work experience.",
                    stage_affected="ats",
                    impact_score_delta=30.0,
                    impact_probability_delta=0.30,
                    referenced_risk="Missing required field: work history",
                )
            )

        # Low keyword match
        if ats_result.keyword_match_percentage < 60.0:
            missing_keywords = ats_result.keyword_breakdown.missing_keywords[:5]
            recommendations.append(
                Recommendation(
                    priority="high" if ats_result.keyword_match_percentage < 40.0 else "medium",
                    category="keyword_optimization",
                    action=f"Incorporate missing keywords naturally: {', '.join(missing_keywords)}",
                    impact=f"Keyword match is {ats_result.keyword_match_percentage:.1f}%. Increasing to 70%+ would significantly improve ATS compatibility.",
                    reasoning=f"ATS systems rank candidates by keyword match. Missing {len(ats_result.keyword_breakdown.missing_keywords)} required keywords reduces visibility.",
                    stage_affected="ats",
                    impact_score_delta=min(20.0, (70.0 - ats_result.keyword_match_percentage) * 0.5),
                    impact_probability_delta=min(0.20, (70.0 - ats_result.keyword_match_percentage) / 100.0),
                    referenced_risk=f"Low keyword match: {ats_result.keyword_match_percentage:.1f}%",
                )
            )

        # Failed hard filters
        if ats_result.hard_filters:
            if ats_result.hard_filters.experience_met is False:
                recommendations.append(
                    Recommendation(
                        priority="high",
                        category="content_improvement",
                        action="Highlight required skills more prominently in work experience descriptions",
                        impact="Hard filter failure for required skills causes immediate ATS rejection.",
                        reasoning="ATS hard filters reject candidates who don't meet minimum skill requirements.",
                        stage_affected="ats",
                        impact_score_delta=20.0,
                        impact_probability_delta=0.20,
                        referenced_risk="Hard filter failed: missing required skills",
                    )
                )

            if ats_result.hard_filters.education_met is False:
                recommendations.append(
                    Recommendation(
                        priority="high",
                        category="content_improvement",
                        action="Ensure education section clearly states required degree level",
                        impact="Hard filter failure for required education causes immediate ATS rejection.",
                        reasoning="ATS hard filters reject candidates who don't meet minimum education requirements.",
                        stage_affected="ats",
                        impact_score_delta=15.0,
                        impact_probability_delta=0.15,
                        referenced_risk="Hard filter failed: missing required education",
                    )
                )

        return recommendations

    def _generate_recruiter_recommendations(
        self, recruiter_result: RecruiterResultInternal
    ) -> list[Recommendation]:
        """Generate recommendations from recruiter results."""
        recommendations: list[Recommendation] = []

        for red_flag in recruiter_result.red_flags:
            if red_flag.type == "job_hopping":
                recommendations.append(
                    Recommendation(
                        priority="high" if red_flag.severity == "high" else "medium",
                        category="gap_explanation",
                        action="Add brief explanation for short tenures or job changes in cover letter or resume summary",
                        impact="Job hopping pattern raises recruiter concerns about stability. Explanation can mitigate concerns.",
                        reasoning=red_flag.description,
                        stage_affected="recruiter",
                        impact_score_delta=10.0 if red_flag.severity == "high" else 5.0,
                        impact_probability_delta=0.10 if red_flag.severity == "high" else 0.05,
                        referenced_risk=red_flag.type,
                    )
                )

            elif red_flag.type == "employment_gap":
                recommendations.append(
                    Recommendation(
                        priority="medium",
                        category="gap_explanation",
                        action="Add brief explanation for employment gap (e.g., 'Career break for family reasons' or 'Pursuing additional education')",
                        impact="Unexplained employment gaps raise recruiter concerns. Brief explanation can address concerns.",
                        reasoning=red_flag.description,
                        stage_affected="recruiter",
                        impact_score_delta=8.0,
                        impact_probability_delta=0.08,
                        referenced_risk=red_flag.type,
                    )
                )

            elif red_flag.type == "generic_resume":
                recommendations.append(
                    Recommendation(
                        priority="medium",
                        category="achievement_enhancement",
                        action="Add specific, quantifiable achievements with metrics (e.g., 'Increased revenue by 25%' or 'Reduced processing time by 40%')",
                        impact="Generic resume lacks impact. Quantifiable achievements demonstrate value and results.",
                        reasoning=red_flag.description,
                        stage_affected="recruiter",
                        impact_score_delta=12.0,
                        impact_probability_delta=0.12,
                        referenced_risk=red_flag.type,
                    )
                )

            elif red_flag.type == "formatting_issues":
                recommendations.append(
                    Recommendation(
                        priority="low",
                        category="formatting",
                        action="Condense resume to 1-2 pages by removing less relevant information",
                        impact="Very long resumes are difficult for recruiters to scan quickly.",
                        reasoning=red_flag.description,
                        stage_affected="recruiter",
                        impact_score_delta=3.0,
                        impact_probability_delta=0.03,
                        referenced_risk=red_flag.type,
                    )
                )

        return recommendations

    def _generate_interview_recommendations(
        self, interview_result: InterviewReadinessResultInternal
    ) -> list[Recommendation]:
        """Generate recommendations from interview results."""
        recommendations: list[Recommendation] = []

        for risk in interview_result.consistency_risks:
            if risk.risk_type == "vague_claim":
                recommendations.append(
                    Recommendation(
                        priority="high" if risk.severity == "high" else "medium",
                        category="achievement_enhancement",
                        action=f"Add specific details and metrics to support claim: '{risk.related_claim[:50] if risk.related_claim else 'claim'}...'",
                        impact="Vague claims will be probed in interviews. Specific details with metrics make claims defensible.",
                        reasoning=risk.description,
                        stage_affected="interview",
                        impact_score_delta=15.0 if risk.severity == "high" else 8.0,
                        impact_probability_delta=0.15 if risk.severity == "high" else 0.08,
                        referenced_risk=risk.risk_type,
                    )
                )

            elif risk.risk_type == "overstated_achievement":
                recommendations.append(
                    Recommendation(
                        priority="high",
                        category="achievement_enhancement",
                        action="Add quantifiable metrics to support impact statement (e.g., specific numbers, percentages, timeframes)",
                        impact="Overstated claims without metrics will be challenged in interviews. Quantifiable evidence supports claims.",
                        reasoning=risk.description,
                        stage_affected="interview",
                        impact_score_delta=12.0,
                        impact_probability_delta=0.12,
                        referenced_risk=risk.risk_type,
                    )
                )

            elif risk.risk_type == "skill_depth_mismatch":
                recommendations.append(
                    Recommendation(
                        priority="medium",
                        category="skill_addition",
                        action=f"Demonstrate listed skills in work experience descriptions: {risk.description.split(':')[1].strip() if ':' in risk.description else 'listed skills'}",
                        impact="Skills listed but not demonstrated raise interview questions. Show skill usage in context.",
                        reasoning=risk.description,
                        stage_affected="interview",
                        impact_score_delta=10.0,
                        impact_probability_delta=0.10,
                        referenced_risk=risk.risk_type,
                    )
                )

            elif risk.risk_type == "missing_context":
                recommendations.append(
                    Recommendation(
                        priority="medium",
                        category="content_improvement",
                        action="Add context to claims (team size, project scope, business impact, constraints faced)",
                        impact="Claims without context are difficult to defend in interviews. Context demonstrates understanding.",
                        reasoning=risk.description,
                        stage_affected="interview",
                        impact_score_delta=8.0,
                        impact_probability_delta=0.08,
                        referenced_risk=risk.risk_type,
                    )
                )

        return recommendations

    def _generate_aggregated_recommendations(
        self, aggregated_score: AggregatedScoreInternal, existing_recommendations: list[Recommendation]
    ) -> list[Recommendation]:
        """Generate recommendations from aggregated risk factors."""
        recommendations: list[Recommendation] = []

        # Only add if not already covered by stage-specific recommendations
        existing_risk_types = {rec.referenced_risk for rec in existing_recommendations if rec.referenced_risk}

        for risk_factor in aggregated_score.risk_factors:
            # Skip if already covered
            if risk_factor.factor in existing_risk_types:
                continue

            # Only recommend for high-impact risks
            if abs(risk_factor.impact_on_overall_probability) < 0.10:
                continue

            recommendations.append(
                Recommendation(
                    priority="high" if risk_factor.severity in ["critical", "high"] else "medium",
                    category="content_improvement",
                    action=f"Address {risk_factor.factor.lower()} to improve overall hiring probability",
                    impact=f"This risk factor reduces overall hiring probability by {abs(risk_factor.impact_on_overall_probability):.1%}.",
                    reasoning=risk_factor.description,
                    stage_affected=risk_factor.stage if "," not in risk_factor.stage else "overall",
                    impact_score_delta=abs(risk_factor.impact_on_overall_probability) * 100.0,
                    impact_probability_delta=abs(risk_factor.impact_on_overall_probability),
                    referenced_risk=risk_factor.factor,
                )
            )

        return recommendations

    def _rank_recommendations(self, recommendations: list[Recommendation]) -> list[Recommendation]:
        """Rank recommendations by priority and impact."""
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}

        def sort_key(rec: Recommendation) -> tuple[int, float]:
            priority_score = priority_order.get(rec.priority, 3)
            impact_score = abs(rec.impact_score_delta) if rec.impact_score_delta else 0.0
            return (priority_score, -impact_score)  # Negative for descending impact

        return sorted(recommendations, key=sort_key)

