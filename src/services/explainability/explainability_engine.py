"""
Explainability engine for HireLens AI.

Generates honest, clear, and trustworthy explanations for evaluation results.
All explanations are backed by actual signals and scoring logic.
"""

from src.services.ats.ats_types import ATSResultInternal
from src.services.explainability.explainability_types import (
    CounterfactualImpact,
    CounterfactualScenario,
    ExplainabilityArtifactInternal,
    StageExplanation,
)
from src.services.explainability.recommendation_engine import RecommendationEngine
from src.services.interview.interview_types import InterviewReadinessResultInternal
from src.services.recruiter.recruiter_types import RecruiterResultInternal
from src.services.scoring.scoring_types import AggregatedScoreInternal


class ExplainabilityEngine:
    """
    Generates explainability artifacts from evaluation results.
    
    Creates stage-wise summaries, highlights key factors, generates
    recommendations, and provides counterfactual scenarios.
    """

    def __init__(self):
        """Initialize the explainability engine."""
        self.recommendation_engine = RecommendationEngine()

    def explain(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
        aggregated_score: AggregatedScoreInternal,
    ) -> ExplainabilityArtifactInternal:
        """
        Generate explainability artifact from evaluation results.
        
        Args:
            ats_result: ATS simulation results
            recruiter_result: Recruiter evaluation results
            interview_result: Interview readiness results
            aggregated_score: Aggregated scoring results
            
        Returns:
            ExplainabilityArtifactInternal with explanations and recommendations
        """
        artifact = ExplainabilityArtifactInternal()

        # 1. Generate stage-wise summaries
        artifact.stage_explanations["ats"] = self._explain_ats_stage(ats_result)
        artifact.stage_explanations["recruiter"] = self._explain_recruiter_stage(
            recruiter_result
        )
        artifact.stage_explanations["interview"] = self._explain_interview_stage(
            interview_result
        )
        artifact.stage_explanations["overall"] = self._explain_overall_stage(
            aggregated_score
        )

        # 2. Invoke RecommendationEngine
        artifact.recommendations = self.recommendation_engine.generate(
            ats_result, recruiter_result, interview_result, aggregated_score
        )

        # 3. Generate counterfactual scenarios
        artifact.counterfactuals = self._generate_counterfactuals(
            ats_result, recruiter_result, interview_result, aggregated_score, artifact.recommendations
        )

        return artifact

    def _explain_ats_stage(self, ats_result: ATSResultInternal) -> StageExplanation:
        """Generate explanation for ATS stage."""
        key_factors: list[str] = []
        referenced_risks: list[str] = []
        referenced_signals: list[str] = []

        # Positive factors
        if ats_result.compatibility_score >= 70.0:
            key_factors.append(f"Strong ATS compatibility score: {ats_result.compatibility_score:.1f}/100")
            referenced_signals.append("High ATS compatibility")
        elif ats_result.compatibility_score >= 50.0:
            key_factors.append(f"Moderate ATS compatibility score: {ats_result.compatibility_score:.1f}/100")
            referenced_signals.append("Moderate ATS compatibility")

        if ats_result.keyword_match_percentage >= 70.0:
            key_factors.append(f"Good keyword match: {ats_result.keyword_match_percentage:.1f}%")
            referenced_signals.append("High keyword match percentage")
        elif ats_result.keyword_match_percentage >= 50.0:
            key_factors.append(f"Moderate keyword match: {ats_result.keyword_match_percentage:.1f}%")
            referenced_signals.append("Moderate keyword match percentage")

        if ats_result.required_fields_status.all_present:
            key_factors.append("All required fields present (email, phone, work history)")
            referenced_signals.append("Complete required fields")

        # Negative factors
        if not ats_result.required_fields_status.email:
            key_factors.append("Missing email address")
            referenced_risks.append("Missing required field: email")

        if not ats_result.required_fields_status.phone:
            key_factors.append("Missing phone number")
            referenced_risks.append("Missing required field: phone")

        if not ats_result.required_fields_status.work_history:
            key_factors.append("Missing work history")
            referenced_risks.append("Missing required field: work history")

        if ats_result.keyword_match_percentage < 50.0:
            key_factors.append(f"Low keyword match: {ats_result.keyword_match_percentage:.1f}%")
            referenced_risks.append(f"Low keyword match: {ats_result.keyword_match_percentage:.1f}%")

        if ats_result.hard_filters and ats_result.hard_filters.all_met is False:
            if ats_result.hard_filters.experience_met is False:
                key_factors.append("Hard filter failed: missing required skills")
                referenced_risks.append("Hard filter failed: missing required skills")
            if ats_result.hard_filters.education_met is False:
                key_factors.append("Hard filter failed: missing required education")
                referenced_risks.append("Hard filter failed: missing required education")

        # Generate summary
        if ats_result.compatibility_score >= 70.0:
            summary = f"ATS compatibility is strong ({ats_result.compatibility_score:.1f}/100). Resume likely to pass ATS screening."
        elif ats_result.compatibility_score >= 50.0:
            summary = f"ATS compatibility is moderate ({ats_result.compatibility_score:.1f}/100). Some improvements could increase pass probability."
        else:
            summary = f"ATS compatibility is weak ({ats_result.compatibility_score:.1f}/100). Significant improvements needed to pass ATS screening."

        return StageExplanation(
            summary=summary,
            key_factors=key_factors,
            referenced_signals=referenced_signals,
            referenced_risks=referenced_risks,
            estimated_impact=ats_result.compatibility_score,
        )

    def _explain_recruiter_stage(
        self, recruiter_result: RecruiterResultInternal
    ) -> StageExplanation:
        """Generate explanation for recruiter stage."""
        key_factors: list[str] = []
        referenced_risks: list[str] = []
        referenced_signals: list[str] = []

        # Positive factors
        if recruiter_result.evaluation_score >= 70.0:
            key_factors.append(f"Strong recruiter evaluation score: {recruiter_result.evaluation_score:.1f}/100")
            referenced_signals.append("High recruiter evaluation score")

        if recruiter_result.career_progression_score >= 0.7:
            key_factors.append("Positive career progression trajectory")
            referenced_signals.append("Strong career progression")

        if recruiter_result.job_stability_score >= 0.7:
            key_factors.append("Good job stability indicators")
            referenced_signals.append("Strong job stability")

        # Negative factors
        if recruiter_result.evaluation_score < 50.0:
            key_factors.append(f"Low recruiter evaluation score: {recruiter_result.evaluation_score:.1f}/100")
            referenced_risks.append(f"Low recruiter score: {recruiter_result.evaluation_score:.1f}")

        for red_flag in recruiter_result.red_flags:
            key_factors.append(f"Red flag: {red_flag.type} ({red_flag.severity} severity)")
            referenced_risks.append(red_flag.type)

        if recruiter_result.job_stability_score < 0.5:
            key_factors.append("Job stability concerns detected")
            referenced_risks.append("Low job stability score")

        if recruiter_result.career_progression_score < 0.5:
            key_factors.append("Career progression concerns detected")
            referenced_risks.append("Low career progression score")

        # Generate summary
        if recruiter_result.evaluation_score >= 70.0:
            summary = f"Recruiter evaluation is strong ({recruiter_result.evaluation_score:.1f}/100). Resume likely to advance to interview stage."
        elif recruiter_result.evaluation_score >= 50.0:
            summary = f"Recruiter evaluation is moderate ({recruiter_result.evaluation_score:.1f}/100). Some concerns may affect advancement."
        else:
            summary = f"Recruiter evaluation is weak ({recruiter_result.evaluation_score:.1f}/100). Significant concerns may prevent advancement."

        return StageExplanation(
            summary=summary,
            key_factors=key_factors,
            referenced_signals=referenced_signals,
            referenced_risks=referenced_risks,
            estimated_impact=recruiter_result.evaluation_score,
        )

    def _explain_interview_stage(
        self, interview_result: InterviewReadinessResultInternal
    ) -> StageExplanation:
        """Generate explanation for interview stage."""
        key_factors: list[str] = []
        referenced_risks: list[str] = []
        referenced_signals: list[str] = []

        # Positive factors
        if interview_result.readiness_score >= 70.0:
            key_factors.append(f"Strong interview readiness score: {interview_result.readiness_score:.1f}/100")
            referenced_signals.append("High interview readiness")

        defensible_claims = [
            claim for claim in interview_result.resume_claims if claim.defensibility_score >= 0.7
        ]
        if len(defensible_claims) > 0:
            key_factors.append(f"{len(defensible_claims)} defensible resume claim(s) with strong evidence")
            referenced_signals.append("Defensible claims with evidence")

        # Negative factors
        if interview_result.readiness_score < 50.0:
            key_factors.append(f"Low interview readiness score: {interview_result.readiness_score:.1f}/100")
            referenced_risks.append(f"Low interview readiness: {interview_result.readiness_score:.1f}")

        for risk in interview_result.consistency_risks:
            key_factors.append(f"Consistency risk: {risk.risk_type} ({risk.severity} severity)")
            referenced_risks.append(risk.risk_type)

        vague_claims = [
            claim for claim in interview_result.resume_claims if claim.defensibility_score < 0.5
        ]
        if len(vague_claims) > 0:
            key_factors.append(f"{len(vague_claims)} vague or low-defensibility claim(s) may be probed")
            referenced_risks.append("Vague or low-defensibility claims")

        # Generate summary
        if interview_result.readiness_score >= 70.0:
            summary = f"Interview readiness is strong ({interview_result.readiness_score:.1f}/100). Resume claims are defensible and interview-ready."
        elif interview_result.readiness_score >= 50.0:
            summary = f"Interview readiness is moderate ({interview_result.readiness_score:.1f}/100). Some claims may need clarification in interviews."
        else:
            summary = f"Interview readiness is weak ({interview_result.readiness_score:.1f}/100). Multiple claims may be challenged in interviews."

        return StageExplanation(
            summary=summary,
            key_factors=key_factors,
            referenced_signals=referenced_signals,
            referenced_risks=referenced_risks,
            estimated_impact=interview_result.readiness_score,
        )

    def _explain_overall_stage(
        self, aggregated_score: AggregatedScoreInternal
    ) -> StageExplanation:
        """Generate explanation for overall assessment."""
        key_factors: list[str] = []
        referenced_risks: list[str] = []
        referenced_signals: list[str] = []

        # Overall score
        if aggregated_score.overall_score >= 70.0:
            key_factors.append(f"Strong overall score: {aggregated_score.overall_score:.1f}/100")
            referenced_signals.append("High overall score")
        elif aggregated_score.overall_score >= 50.0:
            key_factors.append(f"Moderate overall score: {aggregated_score.overall_score:.1f}/100")
            referenced_signals.append("Moderate overall score")
        else:
            key_factors.append(f"Weak overall score: {aggregated_score.overall_score:.1f}/100")
            referenced_risks.append(f"Low overall score: {aggregated_score.overall_score:.1f}")

        # Stage probabilities
        if aggregated_score.stage_probabilities.offer > 0.5:
            key_factors.append("Offer probability above 50%")
            referenced_signals.append("High offer probability")
        else:
            key_factors.append("Offer probability below 50%")
            referenced_risks.append("Low offer probability")

        # Top risk factors
        top_risks = aggregated_score.risk_factors[:3]
        for risk in top_risks:
            key_factors.append(f"Risk: {risk.factor} ({risk.severity} severity, {abs(risk.impact_on_overall_probability):.1%} impact)")
            referenced_risks.append(risk.factor)

        # Positive signals from compounding
        for signal in aggregated_score.signal_compounding_summary.positive_signals[:2]:
            key_factors.append(f"Positive signal: {signal.signal}")
            referenced_signals.append(signal.signal)

        # Generate summary
        if aggregated_score.overall_score >= 70.0:
            summary = f"Overall assessment is strong ({aggregated_score.overall_score:.1f}/100). Candidate has good probability of receiving an offer."
        elif aggregated_score.overall_score >= 50.0:
            summary = f"Overall assessment is moderate ({aggregated_score.overall_score:.1f}/100). Some improvements could increase hiring probability."
        else:
            summary = f"Overall assessment is weak ({aggregated_score.overall_score:.1f}/100). Significant improvements needed to increase hiring probability."

        return StageExplanation(
            summary=summary,
            key_factors=key_factors,
            referenced_signals=referenced_signals,
            referenced_risks=referenced_risks,
            estimated_impact=aggregated_score.overall_score,
        )

    def _generate_counterfactuals(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
        aggregated_score: AggregatedScoreInternal,
        recommendations: list,
    ) -> list[CounterfactualScenario]:
        """Generate counterfactual scenarios based on top recommendations."""
        counterfactuals: list[CounterfactualScenario] = []

        # Generate counterfactuals for top 3 high-priority recommendations
        top_recommendations = [rec for rec in recommendations if rec.priority in ["critical", "high"]][:3]

        for rec in top_recommendations:
            if rec.impact_score_delta and rec.impact_probability_delta:
                # Calculate expected impact
                current_score = aggregated_score.overall_score
                expected_score = min(100.0, current_score + rec.impact_score_delta)

                current_probability = aggregated_score.stage_probabilities.offer
                expected_probability = min(1.0, current_probability + rec.impact_probability_delta)

                # Determine stage impacts
                stage_impacts: dict[str, float] = {}
                if rec.stage_affected == "ats":
                    stage_impacts["ats"] = rec.impact_score_delta
                elif rec.stage_affected == "recruiter":
                    stage_impacts["recruiter"] = rec.impact_score_delta
                elif rec.stage_affected == "interview":
                    stage_impacts["interview"] = rec.impact_score_delta
                elif rec.stage_affected == "overall":
                    stage_impacts["overall"] = rec.impact_score_delta

                counterfactuals.append(
                    CounterfactualScenario(
                        scenario=f"If you {rec.action.lower()}",
                        change_description=rec.action,
                        expected_impact=CounterfactualImpact(
                            score_delta=rec.impact_score_delta,
                            probability_delta=rec.impact_probability_delta,
                            stage_impacts=stage_impacts,
                        ),
                        referenced_factors=[rec.referenced_risk] if rec.referenced_risk else [],
                    )
                )

        return counterfactuals

