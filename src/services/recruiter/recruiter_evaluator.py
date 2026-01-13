"""
Rule-based recruiter evaluation engine.

Simulates recruiter evaluation behavior using deterministic rules and heuristics.
Explains why a recruiter would hesitate or advance a candidate.
"""

from typing import List, Optional
from src.services.features.feature_types import FeatureVectorInternal
from src.services.parsing.parsing_types import ParsedResumeInternal
from src.services.recruiter.recruiter_types import (
    CareerProgressionAnalysis,
    EmploymentGap,
    JobStabilityAnalysis,
    RecruiterRedFlag,
    RecruiterResultInternal,
)


class RecruiterEvaluator:
    """
    Evaluates resumes from a recruiter's perspective using rule-based logic.
    
    Analyzes career progression, job stability, resume quality, and identifies
    red flags that would cause a recruiter to hesitate.
    """

    def evaluate(
        self,
        parsed_resume: ParsedResumeInternal,
        feature_vector: FeatureVectorInternal,
        recruiter_persona: str = "generic",
    ) -> RecruiterResultInternal:
        """
        Evaluate resume from recruiter perspective.
        
        Args:
            parsed_resume: Parsed resume data
            feature_vector: Extracted features
            recruiter_persona: Recruiter persona type (default: "generic")
            
        Returns:
            RecruiterResultInternal with evaluation score and red flags
        """
        result = RecruiterResultInternal()
        result.recruiter_persona = recruiter_persona

        # 1. Career progression analysis
        career_analysis = self._analyze_career_progression(parsed_resume)
        result.career_progression_analysis = career_analysis
        result.career_progression_score = self._compute_career_progression_score(career_analysis)

        # 2. Job stability analysis
        stability_analysis = self._analyze_job_stability(parsed_resume)
        result.job_stability_analysis = stability_analysis
        result.job_stability_score = self._compute_job_stability_score(stability_analysis, result)

        # 3. Resume quality checks
        self._check_resume_quality(parsed_resume, feature_vector, result)

        # 4. Evaluation score (starts at 100, subtracts for issues)
        result.evaluation_score = self._compute_evaluation_score(
            result.career_progression_score,
            result.job_stability_score,
            result.red_flags,
        )

        return result

    def _analyze_career_progression(
        self, parsed_resume: ParsedResumeInternal
    ) -> CareerProgressionAnalysis:
        """Analyze career progression from work experience."""
        analysis = CareerProgressionAnalysis(trajectory="insufficient_data")
        
        work_experience = parsed_resume.work_experience
        if not work_experience or len(work_experience) < 2:
            return analysis

        # Extract titles for progression analysis
        titles = []
        for job in work_experience:
            title = job.get("title") or job.get("position") or ""
            if title:
                titles.append(title)

        analysis.title_progression = titles

        # Simple heuristic: count promotions (title changes that suggest advancement)
        # This is a placeholder - real implementation would need title hierarchy
        promotions = 0
        if len(titles) >= 2:
            # Assume any title change indicates potential progression
            # In reality, would need to check for seniority indicators
            promotions = len(titles) - 1

        analysis.promotions_count = promotions if promotions > 0 else None

        # Determine trajectory
        if len(titles) >= 2:
            # Placeholder: assume upward if multiple jobs, lateral if same titles
            unique_titles = len(set(titles))
            if unique_titles == len(titles):
                analysis.trajectory = "upward"
            elif unique_titles == 1:
                analysis.trajectory = "lateral"
            else:
                analysis.trajectory = "mixed"
        else:
            analysis.trajectory = "insufficient_data"

        # Check for responsibility increase (placeholder)
        analysis.responsibility_increase = len(work_experience) > 1

        return analysis

    def _compute_career_progression_score(self, analysis: CareerProgressionAnalysis) -> float:
        """Compute career progression score (0-1)."""
        if analysis.trajectory == "insufficient_data":
            return 0.5

        score = 0.5  # Base score

        if analysis.trajectory == "upward":
            score += 0.3
        elif analysis.trajectory == "mixed":
            score += 0.1
        elif analysis.trajectory == "lateral":
            score += 0.0
        elif analysis.trajectory == "downward":
            score -= 0.2

        if analysis.promotions_count and analysis.promotions_count > 0:
            score += min(0.2, analysis.promotions_count * 0.05)

        if analysis.responsibility_increase:
            score += 0.1

        return max(0.0, min(1.0, score))

    def _analyze_job_stability(
        self, parsed_resume: ParsedResumeInternal
    ) -> JobStabilityAnalysis:
        """Analyze job stability from work experience."""
        work_experience = parsed_resume.work_experience
        
        if not work_experience:
            return JobStabilityAnalysis(
                average_tenure_months=0.0,
                short_tenure_jobs_count=0,
                employment_gaps=[],
            )

        # Placeholder: compute average tenure
        # In reality, would parse dates from work_experience entries
        # For now, assume each job entry represents some tenure
        total_jobs = len(work_experience)
        
        # Placeholder: assume average 24 months per job if no dates available
        # Real implementation would parse start_date and end_date
        average_tenure = 24.0 if total_jobs > 0 else 0.0

        # Count short tenure jobs (< 12 months)
        # Placeholder: assume no short tenure if we can't parse dates
        short_tenure_count = 0

        # Placeholder: detect employment gaps
        # Real implementation would parse dates and find gaps
        employment_gaps: List[EmploymentGap] = []

        return JobStabilityAnalysis(
            average_tenure_months=average_tenure,
            short_tenure_jobs_count=short_tenure_count,
            employment_gaps=employment_gaps,
        )

    def _compute_job_stability_score(
        self, analysis: JobStabilityAnalysis, result: RecruiterResultInternal
    ) -> float:
        """Compute job stability score (0-1) and add red flags."""
        score = 1.0

        # Penalize low average tenure
        if analysis.average_tenure_months < 12.0:
            penalty = (12.0 - analysis.average_tenure_months) / 12.0
            score -= min(0.4, penalty * 0.4)
            result.red_flags.append(
                RecruiterRedFlag(
                    type="job_hopping",
                    severity="high" if analysis.average_tenure_months < 6.0 else "medium",
                    description=f"Average job tenure is {analysis.average_tenure_months:.1f} months, indicating potential job hopping pattern.",
                    evidence=f"Average tenure: {analysis.average_tenure_months:.1f} months",
                )
            )

        # Penalize short tenure jobs
        if analysis.short_tenure_jobs_count > 0:
            score -= min(0.3, analysis.short_tenure_jobs_count * 0.1)
            result.red_flags.append(
                RecruiterRedFlag(
                    type="job_hopping",
                    severity="medium" if analysis.short_tenure_jobs_count == 1 else "high",
                    description=f"{analysis.short_tenure_jobs_count} job(s) with tenure less than 12 months.",
                    evidence=f"Short tenure jobs: {analysis.short_tenure_jobs_count}",
                )
            )

        # Penalize employment gaps
        if analysis.employment_gaps:
            total_gap_months = sum(gap.duration_months for gap in analysis.employment_gaps)
            if total_gap_months > 6.0:
                score -= min(0.3, (total_gap_months - 6.0) / 12.0)
                result.red_flags.append(
                    RecruiterRedFlag(
                        type="employment_gap",
                        severity="high" if total_gap_months > 12.0 else "medium",
                        description=f"Employment gap(s) totaling {total_gap_months:.1f} months detected.",
                        evidence=f"Total gap duration: {total_gap_months:.1f} months",
                    )
                )

        return max(0.0, min(1.0, score))

    def _check_resume_quality(
        self,
        parsed_resume: ParsedResumeInternal,
        feature_vector: FeatureVectorInternal,
        result: RecruiterResultInternal,
    ) -> None:
        """Check resume quality and add red flags."""
        resume_length = feature_vector.quantitative.resume_length_words or 0

        # Check resume length
        if resume_length < 200:
            result.red_flags.append(
                RecruiterRedFlag(
                    type="generic_resume",
                    severity="medium",
                    description="Resume is very short, may lack detail or appear generic.",
                    evidence=f"Resume length: {resume_length} words",
                )
            )
        elif resume_length > 1500:
            result.red_flags.append(
                RecruiterRedFlag(
                    type="formatting_issues",
                    severity="low",
                    description="Resume is very long, may be difficult to scan quickly.",
                    evidence=f"Resume length: {resume_length} words",
                )
            )

        # Check for achievements with metrics (placeholder)
        # Real implementation would parse achievements and check for numbers/metrics
        achievements_count = 0
        for job in parsed_resume.work_experience:
            if "achievements" in job:
                achievements_count += len(job.get("achievements", []))
            if "description" in job and job.get("description"):
                # Simple heuristic: check for numbers in description
                desc = job["description"]
                if any(char.isdigit() for char in desc):
                    achievements_count += 1

        if achievements_count == 0:
            result.red_flags.append(
                RecruiterRedFlag(
                    type="generic_resume",
                    severity="medium",
                    description="Resume lacks quantifiable achievements or metrics.",
                    evidence="No achievements with metrics detected",
                )
            )

    def _compute_evaluation_score(
        self,
        career_progression_score: float,
        job_stability_score: float,
        red_flags: List[RecruiterRedFlag],
    ) -> float:
        """Compute overall evaluation score (0-100)."""
        score = 100.0

        # Deduct for low career progression
        if career_progression_score < 0.5:
            score -= (0.5 - career_progression_score) * 30.0

        # Deduct for low job stability
        if job_stability_score < 0.5:
            score -= (0.5 - job_stability_score) * 40.0

        # Deduct for red flags
        for red_flag in red_flags:
            if red_flag.severity == "critical":
                score -= 20.0
            elif red_flag.severity == "high":
                score -= 10.0
            elif red_flag.severity == "medium":
                score -= 5.0
            elif red_flag.severity == "low":
                score -= 2.0

        return max(0.0, min(100.0, round(score, 2)))

