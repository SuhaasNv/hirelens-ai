"""
Rule-based interview readiness evaluation engine.

Simulates interviewer evaluation behavior using deterministic rules and heuristics.
Identifies resume claims, predicts interview questions, and flags consistency risks.
"""

import re
from typing import Any, Dict, List, Set
from src.services.features.feature_types import FeatureVectorInternal
from src.services.parsing.parsing_types import ParsedResumeInternal
from src.services.interview.interview_types import (
    ConsistencyRisk,
    InterviewReadinessResultInternal,
    PredictedInterviewQuestion,
    ResumeClaim,
)


class InterviewReadinessEvaluator:
    """
    Evaluates interview readiness from an interviewer's perspective.
    
    Extracts resume claims, evaluates their defensibility, predicts likely
    interview questions, and identifies consistency risks.
    """

    def evaluate(
        self,
        parsed_resume: ParsedResumeInternal,
        feature_vector: FeatureVectorInternal,
    ) -> InterviewReadinessResultInternal:
        """
        Evaluate interview readiness.
        
        Args:
            parsed_resume: Parsed resume data
            feature_vector: Extracted features
            
        Returns:
            InterviewReadinessResultInternal with readiness score and analysis
        """
        result = InterviewReadinessResultInternal()

        # 1. Extract resume claims
        result.resume_claims = self._extract_resume_claims(parsed_resume, result)

        # 2. Evaluate claim defensibility (already done in extraction)
        # Claims are scored during extraction

        # 3. Predict interview questions
        result.predicted_questions = self._predict_interview_questions(result.resume_claims)

        # 4. Identify consistency risks
        result.consistency_risks = self._identify_consistency_risks(
            parsed_resume, result.resume_claims, result
        )

        # 5. Compute readiness score
        result.readiness_score = self._compute_readiness_score(result)

        return result

    def _extract_resume_claims(
        self, parsed_resume: ParsedResumeInternal, result: InterviewReadinessResultInternal
    ) -> List[ResumeClaim]:
        """Extract claims from resume (achievements, skills)."""
        claims: List[ResumeClaim] = []

        # Extract achievement claims from work experience
        for job in parsed_resume.work_experience:
            # Check for achievements list
            achievements = job.get("achievements", [])
            if isinstance(achievements, list):
                for achievement in achievements:
                    if isinstance(achievement, str) and achievement.strip():
                        claim = self._create_claim_from_text(
                            achievement.strip(), "achievement", job
                        )
                        claims.append(claim)

            # Check for description field (may contain achievements)
            description = job.get("description", "")
            if isinstance(description, str) and description.strip():
                # Split description into bullet points
                bullets = re.split(r"[•\-\*]\s*|\n\s*[-•*]\s*", description)
                for bullet in bullets:
                    bullet = bullet.strip()
                    if bullet and len(bullet) > 10:  # Filter out very short fragments
                        claim = self._create_claim_from_text(bullet, "achievement", job)
                        claims.append(claim)

        # If no achievements found, extract major skills as claims
        if not claims and parsed_resume.skills:
            for skill in parsed_resume.skills[:5]:  # Top 5 skills
                if skill and skill.strip():
                    claim = ResumeClaim(
                        claim_text=f"Proficient in {skill}",
                        claim_type="skill",
                        defensibility_score=0.5,  # Skills without evidence are medium defensibility
                        depth_indicator="surface",
                        consistency_risk="medium",
                    )
                    claims.append(claim)

        return claims

    def _create_claim_from_text(
        self, text: str, claim_type: str, job: Dict[str, Any]
    ) -> ResumeClaim:
        """Create a ResumeClaim from text and evaluate defensibility."""
        # Evaluate defensibility
        defensibility_score, depth_indicator = self._evaluate_defensibility(text)

        # Check for consistency risk
        consistency_risk = self._assess_consistency_risk(text, defensibility_score)

        # Extract supporting evidence (metrics, numbers, specific actions)
        supporting_evidence = self._extract_supporting_evidence(text)

        return ResumeClaim(
            claim_text=text,
            claim_type=claim_type,
            defensibility_score=defensibility_score,
            depth_indicator=depth_indicator,
            consistency_risk=consistency_risk,
            supporting_evidence=supporting_evidence,
        )

    def _evaluate_defensibility(self, text: str) -> tuple[float, str]:
        """
        Evaluate claim defensibility based on metrics and specificity.
        
        Returns:
            (defensibility_score, depth_indicator)
        """
        text_lower = text.lower()

        # Check for metrics (numbers, percentages, dollar amounts, time periods)
        has_metrics = bool(
            re.search(
                r"\d+%|\d+\.\d+%|\$\d+[KMB]?|\d+\s*(million|thousand|k|m|b)\b|\d+\s*(years?|months?|days?)\b",
                text,
                re.IGNORECASE,
            )
        )

        # Check for specific actions (verbs indicating concrete work)
        has_specific_actions = bool(
            re.search(
                r"\b(built|developed|created|implemented|designed|optimized|reduced|increased|improved|managed|led|achieved|delivered)\b",
                text_lower,
            )
        )

        # Check for vague/generic language
        vague_indicators = [
            "helped",
            "assisted",
            "worked on",
            "involved in",
            "contributed to",
            "part of",
            "responsible for",
        ]
        is_vague = any(indicator in text_lower for indicator in vague_indicators)

        # Determine defensibility
        if has_metrics:
            return (0.9, "deep")
        elif has_specific_actions and not is_vague:
            return (0.7, "moderate")
        elif is_vague or len(text.split()) < 5:
            return (0.3, "surface")
        else:
            return (0.5, "moderate")

    def _assess_consistency_risk(self, text: str, defensibility_score: float) -> Optional[str]:
        """Assess consistency risk for a claim."""
        if defensibility_score < 0.4:
            return "high"
        elif defensibility_score < 0.6:
            return "medium"
        else:
            return None

    def _extract_supporting_evidence(self, text: str) -> List[str]:
        """Extract supporting evidence (metrics, numbers) from claim text."""
        evidence: List[str] = []

        # Extract percentages
        percentages = re.findall(r"\d+\.?\d*%", text)
        evidence.extend(percentages)

        # Extract numbers with units
        numbers_with_units = re.findall(
            r"\d+[KMB]?|\d+\s*(million|thousand|k|m|b|years?|months?|days?)\b", text, re.IGNORECASE
        )
        evidence.extend(numbers_with_units)

        return evidence

    def _predict_interview_questions(
        self, claims: List[ResumeClaim]
    ) -> List[PredictedInterviewQuestion]:
        """Predict interview questions based on risky claims."""
        questions: List[PredictedInterviewQuestion] = []

        for claim in claims:
            if claim.consistency_risk in ["high", "medium"]:
                # Question about the achievement
                questions.append(
                    PredictedInterviewQuestion(
                        question=f"Can you explain how you achieved: '{claim.claim_text[:50]}...'?",
                        likelihood=0.8 if claim.consistency_risk == "high" else 0.6,
                        question_type="resume_deep_dive",
                        related_claim=claim.claim_text[:100],
                        reasoning=f"Claim has {claim.consistency_risk} consistency risk and may need clarification.",
                    )
                )

                # Question about challenges
                if claim.defensibility_score < 0.5:
                    questions.append(
                        PredictedInterviewQuestion(
                            question="What challenges did you face while working on this?",
                            likelihood=0.7,
                            question_type="behavioral",
                            related_claim=claim.claim_text[:100],
                            reasoning="Vague or low-defensibility claims often prompt challenge questions.",
                        )
                    )

                # Question about measurement
                if not claim.supporting_evidence:
                    questions.append(
                        PredictedInterviewQuestion(
                            question="How did you measure the success of this achievement?",
                            likelihood=0.7,
                            question_type="situational",
                            related_claim=claim.claim_text[:100],
                            reasoning="Claims without metrics often prompt measurement questions.",
                        )
                    )

        # Limit to avoid overgeneralization
        return questions[:10]

    def _identify_consistency_risks(
        self,
        parsed_resume: ParsedResumeInternal,
        claims: List[ResumeClaim],
        result: InterviewReadinessResultInternal,
    ) -> List[ConsistencyRisk]:
        """Identify consistency risks between resume claims and experience."""
        risks: List[ConsistencyRisk] = []

        # Check for skills listed but not used in experience
        skills_in_resume: Set[str] = {skill.lower() for skill in parsed_resume.skills}
        skills_in_experience: Set[str] = set()

        for job in parsed_resume.work_experience:
            description = job.get("description", "")
            achievements = job.get("achievements", [])
            combined_text = description + " " + " ".join(
                str(a) for a in achievements if isinstance(a, str)
            )

            for skill in parsed_resume.skills:
                if skill.lower() in combined_text.lower():
                    skills_in_experience.add(skill.lower())

        unused_skills = skills_in_resume - skills_in_experience
        if unused_skills:
            risks.append(
                ConsistencyRisk(
                    risk_type="skill_depth_mismatch",
                    severity="medium",
                    description=f"Skills listed but not mentioned in work experience: {', '.join(list(unused_skills)[:3])}",
                    mitigation_suggestion="Be prepared to explain how you used these skills in your work.",
                )
            )

        # Check for claims without evidence
        for claim in claims:
            if not claim.supporting_evidence and claim.defensibility_score < 0.5:
                risks.append(
                    ConsistencyRisk(
                        risk_type="vague_claim",
                        severity="high" if claim.defensibility_score < 0.4 else "medium",
                        description=f"Claim lacks specific evidence: '{claim.claim_text[:60]}...'",
                        related_claim=claim.claim_text[:100],
                        mitigation_suggestion="Prepare specific examples and metrics to support this claim.",
                    )
                )

        # Check for overly broad impact statements
        for claim in claims:
            broad_indicators = [
                "significant",
                "major",
                "huge",
                "massive",
                "dramatic",
                "revolutionary",
            ]
            if any(indicator in claim.claim_text.lower() for indicator in broad_indicators):
                if not claim.supporting_evidence:
                    risks.append(
                        ConsistencyRisk(
                            risk_type="overstated_achievement",
                            severity="medium",
                            description=f"Broad impact statement without metrics: '{claim.claim_text[:60]}...'",
                            related_claim=claim.claim_text[:100],
                            mitigation_suggestion="Be ready to quantify the impact with specific numbers.",
                        )
                    )

        return risks

    def _compute_readiness_score(
        self, result: InterviewReadinessResultInternal
    ) -> float:
        """Compute interview readiness score (0-100)."""
        score = 100.0

        # Deduct for risky or vague claims
        for claim in result.resume_claims:
            if claim.consistency_risk == "high":
                score -= 8.0
            elif claim.consistency_risk == "medium":
                score -= 4.0

            if claim.defensibility_score < 0.4:
                score -= 5.0
            elif claim.defensibility_score < 0.6:
                score -= 2.0

        # Deduct for consistency risks
        for risk in result.consistency_risks:
            if risk.severity == "high":
                score -= 10.0
            elif risk.severity == "medium":
                score -= 5.0
            elif risk.severity == "low":
                score -= 2.0

        return max(0.0, min(100.0, round(score, 2)))

