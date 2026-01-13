"""
Deterministic resume parser.

Extracts basic information from resume text using regex and rule-based methods.
"""

import re
from typing import List, Optional

from src.services.parsing.parsing_types import ParsedResumeInternal, ParsingWarning


class ResumeParser:
    """
    Foundation parser for extracting basic resume information.
    
    Uses regex and rule-based methods only. No ML or NLP.
    """

    # Email regex pattern
    EMAIL_PATTERN = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    )

    # Phone regex patterns (lenient - handles various formats)
    PHONE_PATTERNS = [
        re.compile(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'),  # 123-456-7890, 123.456.7890, 123 456 7890
        re.compile(r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}'),  # (123) 456-7890
        re.compile(r'\b\d{10}\b'),  # 1234567890
    ]

    # Section header patterns (case-insensitive)
    SECTION_PATTERNS = {
        'experience': re.compile(r'\b(experience|work\s+experience|employment|work\s+history|professional\s+experience)\b', re.IGNORECASE),
        'education': re.compile(r'\b(education|academic|qualifications|degrees?)\b', re.IGNORECASE),
        'skills': re.compile(r'\b(skills?|technical\s+skills?|competencies?|expertise)\b', re.IGNORECASE),
        'projects': re.compile(r'\b(projects?|portfolio|selected\s+projects?)\b', re.IGNORECASE),
    }

    def parse(self, text: str) -> ParsedResumeInternal:
        """
        Parse resume text and extract basic information.
        
        Args:
            text: Raw resume text content
            
        Returns:
            ParsedResumeInternal with extracted data, confidence scores, and warnings
        """
        parsed = ParsedResumeInternal()

        email = self._extract_email(text)
        if email:
            parsed.email = email
            parsed.confidence_scores['email'] = 0.95
        else:
            parsed.warnings.append(
                ParsingWarning(
                    type="missing_field",
                    field="email",
                    message="Email address not found in resume",
                    severity="high"
                )
            )
            parsed.confidence_scores['email'] = 0.0

        phone = self._extract_phone(text)
        if phone:
            parsed.phone = phone
            parsed.confidence_scores['phone'] = 0.90
        else:
            parsed.warnings.append(
                ParsingWarning(
                    type="missing_field",
                    field="phone",
                    message="Phone number not found in resume",
                    severity="medium"
                )
            )
            parsed.confidence_scores['phone'] = 0.0

        sections = self._detect_sections(text)
        parsed.confidence_scores['sections'] = self._calculate_section_confidence(sections)

        if 'experience' not in sections:
            parsed.warnings.append(
                ParsingWarning(
                    type="missing_section",
                    field="experience",
                    message="No experience section detected",
                    severity="high"
                )
            )

        return parsed

    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email address using regex."""
        match = self.EMAIL_PATTERN.search(text)
        return match.group(0) if match else None

    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number using lenient regex patterns."""
        for pattern in self.PHONE_PATTERNS:
            match = pattern.search(text)
            if match:
                return match.group(0)
        return None

    def _detect_sections(self, text: str) -> List[str]:
        """Detect section headers in resume text."""
        detected = []
        for section_name, pattern in self.SECTION_PATTERNS.items():
            if pattern.search(text):
                detected.append(section_name)
        return detected

    def _calculate_section_confidence(self, sections: List[str]) -> float:
        """Calculate confidence score based on detected sections."""
        if not sections:
            return 0.0
        if 'experience' in sections and 'education' in sections:
            return 0.85
        if 'experience' in sections or 'education' in sections:
            return 0.70
        return 0.50

