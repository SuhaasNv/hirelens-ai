"""
Score aggregation engine for HireLens AI.

Aggregates scores and probabilities across all hiring stages using deterministic,
transparent, and auditable logic.
"""

from src.services.ats.ats_types import ATSResultInternal
from src.services.interview.interview_types import InterviewReadinessResultInternal
from src.services.recruiter.recruiter_types import RecruiterResultInternal
from src.services.scoring.scoring_types import (
    AggregatedScoreInternal,
    ComponentContributions,
    RiskFactor,
    StageProbabilities,
)
from src.services.scoring.signal_compounding import SignalCompoundingEngine


class ScoreAggregator:
    """
    Aggregates scores and probabilities across hiring stages.
    
    Computes stage probabilities, applies signal compounding, calculates
    end-to-end hiring probability, and ranks risk factors.
    """

    def __init__(self):
        """Initialize the score aggregator."""
        self.signal_compounding_engine = SignalCompoundingEngine()

    def aggregate(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
    ) -> AggregatedScoreInternal:
        """
        Aggregate scores and probabilities from all stages.
        
        Args:
            ats_result: ATS simulation results
            recruiter_result: Recruiter evaluation results
            interview_result: Interview readiness results
            
        Returns:
            AggregatedScoreInternal with aggregated scores and probabilities
        """
        result = AggregatedScoreInternal()

        # 1. Calculate base stage probabilities
        base_probabilities = self._calculate_base_probabilities(
            ats_result, recruiter_result, interview_result
        )

        # 2. Apply signal compounding
        signal_summary = self.signal_compounding_engine.apply(
            ats_result, recruiter_result, interview_result
        )
        result.signal_compounding_summary = signal_summary

        # 3. Compute end-to-end hiring probability (with compounding effects)
        final_probabilities = self._apply_compounding_effects(
            base_probabilities, signal_summary
        )
        result.stage_probabilities = final_probabilities

        # 4. Derive overall score (0-100)
        result.overall_score = self._compute_overall_score(
            ats_result, recruiter_result, interview_result
        )

        # 5. Rank risk factors by impact
        result.risk_factors = self._rank_risk_factors(
            ats_result, recruiter_result, interview_result, signal_summary
        )

        # 6. Record component contributions
        result.component_contributions = self._compute_component_contributions(
            ats_result, recruiter_result, interview_result
        )

        return result

    def _calculate_base_probabilities(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
    ) -> StageProbabilities:
        """Calculate base probabilities from stage scores."""
        probabilities = StageProbabilities()

        # Convert ATS compatibility score (0-100) to probability (0-1)
        # Simple linear mapping: score / 100
        ats_score = ats_result.compatibility_score
        probabilities.ats_pass = max(0.0, min(1.0, ats_score / 100.0))

        # Convert recruiter evaluation score (0-100) to probability
        recruiter_score = recruiter_result.evaluation_score
        probabilities.recruiter_pass = max(0.0, min(1.0, recruiter_score / 100.0))

        # Convert interview readiness score (0-100) to probability
        interview_score = interview_result.readiness_score
        probabilities.interview_pass = max(0.0, min(1.0, interview_score / 100.0))

        # Base offer probability is conditional on interview pass
        # If interview passes, offer probability is high (0.7-0.9 range based on interview score)
        if probabilities.interview_pass > 0.5:
            probabilities.offer = 0.7 + (probabilities.interview_pass - 0.5) * 0.4
        else:
            probabilities.offer = probabilities.interview_pass * 0.5

        probabilities.offer = max(0.0, min(1.0, probabilities.offer))

        return probabilities

    def _apply_compounding_effects(
        self, base_probabilities: StageProbabilities, signal_summary
    ) -> StageProbabilities:
        """Apply signal compounding effects to base probabilities."""
        adjusted = StageProbabilities()
        adjusted.ats_pass = base_probabilities.ats_pass
        adjusted.recruiter_pass = base_probabilities.recruiter_pass
        adjusted.interview_pass = base_probabilities.interview_pass
        adjusted.offer = base_probabilities.offer

        # Apply positive signals
        for signal in signal_summary.positive_signals:
            if signal.compound_effect:
                if "recruiter" in signal.stages_affected:
                    adjusted.recruiter_pass = min(1.0, adjusted.recruiter_pass + signal.compound_effect)
                if "interview" in signal.stages_affected:
                    adjusted.interview_pass = min(1.0, adjusted.interview_pass + signal.compound_effect)
                if "offer" in signal.stages_affected:
                    adjusted.offer = min(1.0, adjusted.offer + signal.compound_effect)

        # Apply negative signals
        for signal in signal_summary.negative_signals:
            if signal.compound_effect:
                if "recruiter" in signal.stages_affected:
                    adjusted.recruiter_pass = max(0.0, adjusted.recruiter_pass + signal.compound_effect)
                if "interview" in signal.stages_affected:
                    adjusted.interview_pass = max(0.0, adjusted.interview_pass + signal.compound_effect)
                if "offer" in signal.stages_affected:
                    adjusted.offer = max(0.0, adjusted.offer + signal.compound_effect)

        # Ensure conditional probabilities make sense
        # Recruiter pass is conditional on ATS pass
        adjusted.recruiter_pass = min(adjusted.recruiter_pass, adjusted.ats_pass)

        # Interview pass is conditional on recruiter pass
        adjusted.interview_pass = min(adjusted.interview_pass, adjusted.recruiter_pass)

        # Offer is conditional on interview pass
        adjusted.offer = min(adjusted.offer, adjusted.interview_pass)

        return adjusted

    def _compute_overall_score(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
    ) -> float:
        """Compute overall composite score (0-100) using weighted average."""
        # Weights: ATS (30%), Recruiter (30%), Interview (40%)
        # Interview gets higher weight because it's the final gate
        ats_weight = 0.30
        recruiter_weight = 0.30
        interview_weight = 0.40

        ats_score = ats_result.compatibility_score
        recruiter_score = recruiter_result.evaluation_score
        interview_score = interview_result.readiness_score

        overall = (
            ats_score * ats_weight
            + recruiter_score * recruiter_weight
            + interview_score * interview_weight
        )

        return round(max(0.0, min(100.0, overall)), 2)

    def _rank_risk_factors(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
        signal_summary,
    ) -> list[RiskFactor]:
        """Rank risk factors by impact on overall hiring probability."""
        risk_factors: list[RiskFactor] = []

        # Extract risks from ATS
        if ats_result.compatibility_score < 50.0:
            impact = (50.0 - ats_result.compatibility_score) / 100.0 * -0.3
            risk_factors.append(
                RiskFactor(
                    factor="Low ATS compatibility score",
                    stage="ats",
                    impact_on_overall_probability=impact,
                    severity="high" if ats_result.compatibility_score < 40.0 else "medium",
                    description=f"ATS compatibility score is {ats_result.compatibility_score:.1f}/100",
                )
            )

        # Extract risks from recruiter red flags
        for red_flag in recruiter_result.red_flags:
            severity_to_impact = {
                "critical": -0.25,
                "high": -0.15,
                "medium": -0.08,
                "low": -0.03,
            }
            impact = severity_to_impact.get(red_flag.severity, -0.05)
            risk_factors.append(
                RiskFactor(
                    factor=red_flag.type,
                    stage="recruiter",
                    impact_on_overall_probability=impact,
                    severity=red_flag.severity,
                    description=red_flag.description,
                )
            )

        # Extract risks from interview consistency risks
        for risk in interview_result.consistency_risks:
            severity_to_impact = {
                "critical": -0.30,
                "high": -0.20,
                "medium": -0.10,
                "low": -0.05,
            }
            impact = severity_to_impact.get(risk.severity, -0.10)
            risk_factors.append(
                RiskFactor(
                    factor=risk.risk_type,
                    stage="interview",
                    impact_on_overall_probability=impact,
                    severity=risk.severity,
                    description=risk.description,
                )
            )

        # Add risks from signal compounding (negative signals)
        for signal in signal_summary.negative_signals:
            if signal.compound_effect:
                # Map compound effect to impact
                impact = signal.compound_effect * 0.8  # Scale down for overall probability
                risk_factors.append(
                    RiskFactor(
                        factor=signal.signal,
                        stage=",".join(signal.stages_affected),
                        impact_on_overall_probability=impact,
                        severity="high" if abs(impact) > 0.15 else "medium",
                        description=f"Signal compounding effect: {signal.signal}",
                    )
                )

        # Sort by impact (most negative first)
        risk_factors.sort(key=lambda x: x.impact_on_overall_probability)

        return risk_factors

    def _compute_component_contributions(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
    ) -> ComponentContributions:
        """Compute contribution of each stage to overall score."""
        # Same weights as overall score calculation
        ats_weight = 0.30
        recruiter_weight = 0.30
        interview_weight = 0.40

        contributions = ComponentContributions()

        contributions.ats_contribution = round(ats_result.compatibility_score * ats_weight, 2)
        contributions.recruiter_contribution = round(
            recruiter_result.evaluation_score * recruiter_weight, 2
        )
        contributions.interview_contribution = round(
            interview_result.readiness_score * interview_weight, 2
        )

        return contributions

