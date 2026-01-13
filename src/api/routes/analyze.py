"""
Analyze endpoint router.

Handles POST /api/v1/analyze for comprehensive resume analysis.
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/analyze")
async def analyze_resume():
    """
    Performs comprehensive analysis of a resume against a job description.
    
    Returns scores, probabilities, and explainability information for ATS,
    recruiter, and interview stages.
    """
    raise NotImplementedError


