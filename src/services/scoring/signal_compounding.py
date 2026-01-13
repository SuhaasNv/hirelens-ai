"""
Signal compounding engine for HireLens AI.

Applies deterministic rules for how signals compound across hiring stages.
Explains how ATS, recruiter, and interview results influence each other.
"""

from src.services.ats.ats_types import ATSResultInternal
from src.services.interview.interview_types import InterviewReadinessResultInternal
from src.services.recruiter.recruiter_types import RecruiterResultInternal
from src.services.scoring.scoring_types import SignalCompoundingSummary, SignalImpact


class SignalCompoundingEngine:
    """
    Applies signal compounding logic across hiring stages.
    
    Determines how signals from ATS, recruiter, and interview stages
    compound and influence each other using rule-based logic.
    """

    def apply(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
    ) -> SignalCompoundingSummary:
        """
        Apply signal compounding rules and return explainable signal impacts.
        
        Args:
            ats_result: ATS simulation results
            recruiter_result: Recruiter evaluation results
            interview_result: Interview readiness results
            
        Returns:
            SignalCompoundingSummary with positive and negative signal impacts
        """
        summary = SignalCompoundingSummary()

        # 1. ATS influences recruiter
        ats_impact = self._analyze_ats_influence(ats_result, recruiter_result)
        if ats_impact:
            if ats_impact.compound_effect and ats_impact.compound_effect > 0:
                summary.positive_signals.append(ats_impact)
            else:
                summary.negative_signals.append(ats_impact)

        # 2. Interview dominates final outcome
        interview_impact = self._analyze_interview_dominance(interview_result)
        if interview_impact:
            if interview_impact.compound_effect and interview_impact.compound_effect < 0:
                summary.negative_signals.append(interview_impact)
            else:
                summary.positive_signals.append(interview_impact)

        # 3. Risk compounding
        risk_impacts = self._analyze_risk_compounding(
            ats_result, recruiter_result, interview_result
        )
        summary.negative_signals.extend(risk_impacts)

        return summary

    def _analyze_ats_influence(
        self, ats_result: ATSResultInternal, recruiter_result: RecruiterResultInternal
    ) -> SignalImpact:
        """Analyze how ATS results influence recruiter stage."""
        ats_score = ats_result.compatibility_score
        recruiter_score = recruiter_result.evaluation_score

        # Strong ATS (>= 80) slightly boosts recruiter probability
        if ats_score >= 80.0:
            compound_effect = 0.05  # Small positive boost
            signal = "Strong ATS compatibility"
            stages = ["ats", "recruiter"]
        # Weak ATS (< 50) caps recruiter probability
        elif ats_score < 50.0:
            compound_effect = -0.15  # Negative impact
            signal = "Weak ATS compatibility"
            stages = ["ats", "recruiter"]
        # Medium ATS (50-80) has neutral to slight negative effect
        else:
            compound_effect = -0.05  # Slight negative
            signal = "Moderate ATS compatibility"
            stages = ["ats", "recruiter"]

        return SignalImpact(
            signal=signal,
            stages_affected=stages,
            compound_effect=compound_effect,
        )

    def _analyze_interview_dominance(
        self, interview_result: InterviewReadinessResultInternal
    ) -> SignalImpact:
        """Analyze how interview readiness dominates final outcome."""
        readiness_score = interview_result.readiness_score
        consistency_risks = interview_result.consistency_risks

        # High interview risk significantly reduces offer probability
        high_risk_count = sum(1 for risk in consistency_risks if risk.severity == "high")
        critical_risk_count = sum(1 for risk in consistency_risks if risk.severity == "critical")

        if critical_risk_count > 0:
            compound_effect = -0.40  # Steep penalty for critical risks
            signal = "Critical interview consistency risks detected"
            stages = ["interview", "offer"]
        elif high_risk_count >= 2:
            compound_effect = -0.25  # Significant penalty for multiple high risks
            signal = "Multiple high-severity interview consistency risks"
            stages = ["interview", "offer"]
        elif high_risk_count == 1:
            compound_effect = -0.15  # Moderate penalty for single high risk
            signal = "High-severity interview consistency risk detected"
            stages = ["interview", "offer"]
        elif readiness_score < 50.0:
            compound_effect = -0.20  # Penalty for low readiness
            signal = "Low interview readiness score"
            stages = ["interview", "offer"]
        elif readiness_score >= 80.0:
            compound_effect = 0.10  # Positive signal for high readiness
            signal = "High interview readiness score"
            stages = ["interview", "offer"]
        else:
            return None  # No significant signal

        return SignalImpact(
            signal=signal,
            stages_affected=stages,
            compound_effect=compound_effect,
        )

    def _analyze_risk_compounding(
        self,
        ats_result: ATSResultInternal,
        recruiter_result: RecruiterResultInternal,
        interview_result: InterviewReadinessResultInternal,
    ) -> list[SignalImpact]:
        """Analyze how risks compound across stages."""
        impacts: list[SignalImpact] = []

        # Collect all risks by severity
        critical_risks = []
        high_risks = []
        medium_risks = []

        # ATS risks
        if ats_result.compatibility_score < 40.0:
            critical_risks.append("ATS compatibility score below 40")

        # Recruiter risks
        for red_flag in recruiter_result.red_flags:
            if red_flag.severity == "critical":
                critical_risks.append(f"Recruiter red flag: {red_flag.type}")
            elif red_flag.severity == "high":
                high_risks.append(f"Recruiter red flag: {red_flag.type}")

        # Interview risks
        for risk in interview_result.consistency_risks:
            if risk.severity == "critical":
                critical_risks.append(f"Interview risk: {risk.risk_type}")
            elif risk.severity == "high":
                high_risks.append(f"Interview risk: {risk.risk_type}")
            elif risk.severity == "medium":
                medium_risks.append(f"Interview risk: {risk.risk_type}")

        # Rule: Any critical risk → steep penalty
        if critical_risks:
            impacts.append(
                SignalImpact(
                    signal=f"Critical risks detected: {', '.join(critical_risks[:2])}",
                    stages_affected=["ats", "recruiter", "interview", "offer"],
                    compound_effect=-0.35,
                )
            )

        # Rule: Multiple medium risks → high overall risk
        if len(medium_risks) >= 3:
            impacts.append(
                SignalImpact(
                    signal=f"Multiple medium risks compound to high overall risk ({len(medium_risks)} risks)",
                    stages_affected=["recruiter", "interview", "offer"],
                    compound_effect=-0.20,
                )
            )

        # Rule: Multiple high risks compound
        if len(high_risks) >= 2:
            impacts.append(
                SignalImpact(
                    signal=f"Multiple high-severity risks compound ({len(high_risks)} risks)",
                    stages_affected=["recruiter", "interview", "offer"],
                    compound_effect=-0.25,
                )
            )

        return impacts

