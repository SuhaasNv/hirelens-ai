"""
Deterministic job description parser.

Extracts basic information from job description text using heuristic methods.
"""

import re
from typing import List, Optional

from src.services.parsing.parsing_types import ParsedJobDescriptionInternal, ParsingWarning


class JobDescriptionParser:
    """
    Foundation parser for extracting job description information.
    
    Uses heuristic-based methods only. No ML or embeddings.
    """

    # Common tech keywords for extraction
    COMMON_TECH_KEYWORDS = [
        'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
        'node', 'django', 'flask', 'spring', 'sql', 'postgresql', 'mysql',
        'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
        'git', 'linux', 'agile', 'scrum', 'ci/cd', 'rest', 'api', 'graphql',
        'microservices', 'machine learning', 'ai', 'data science', 'pandas',
        'numpy', 'tensorflow', 'pytorch', 'scikit-learn'
    ]

    # Patterns for required/preferred sections
    REQUIRED_PATTERNS = [
        re.compile(r'\b(required|must have|requirements?|qualifications?):?\s*', re.IGNORECASE),
        re.compile(r'\b(must|should)\s+(have|know|be)\b', re.IGNORECASE),
    ]

    PREFERRED_PATTERNS = [
        re.compile(r'\b(preferred|nice to have|bonus|plus):?\s*', re.IGNORECASE),
        re.compile(r'\b(would be nice|helpful|advantageous)\b', re.IGNORECASE),
    ]

    def parse(self, text: str) -> ParsedJobDescriptionInternal:
        """
        Parse job description text and extract basic information.
        
        Args:
            text: Raw job description text content
            
        Returns:
            ParsedJobDescriptionInternal with extracted data, confidence scores, and warnings
        """
        parsed = ParsedJobDescriptionInternal()

        title = self._extract_title(text)
        if title:
            parsed.title = title
            parsed.confidence_scores['title'] = 0.80
        else:
            parsed.warnings.append(
                ParsingWarning(
                    type="missing_field",
                    field="title",
                    message="No clear job title found",
                    severity="medium"
                )
            )
            parsed.confidence_scores['title'] = 0.0

        required_keywords = self._extract_required_keywords(text)
        preferred_keywords = self._extract_preferred_keywords(text)

        if required_keywords:
            parsed.required_skills = required_keywords
            parsed.keywords.extend(required_keywords)
            parsed.confidence_scores['required_keywords'] = 0.75
        else:
            parsed.warnings.append(
                ParsingWarning(
                    type="missing_field",
                    field="required_keywords",
                    message="No required keywords extracted",
                    severity="medium"
                )
            )
            parsed.confidence_scores['required_keywords'] = 0.0

        if preferred_keywords:
            parsed.preferred_skills = preferred_keywords
            parsed.keywords.extend(preferred_keywords)
            parsed.confidence_scores['preferred_keywords'] = 0.70

        if not parsed.keywords:
            parsed.warnings.append(
                ParsingWarning(
                    type="missing_field",
                    field="keywords",
                    message="No keywords extracted from job description",
                    severity="high"
                )
            )

        return parsed

    def _extract_title(self, text: str) -> Optional[str]:
        """Extract job title from first heading or first line."""
        lines = text.strip().split('\n')
        
        # Try first line if it looks like a title (short, capitalized)
        if lines:
            first_line = lines[0].strip()
            if len(first_line) < 100 and first_line:
                # Check if it looks like a title (not all caps, reasonable length)
                if not first_line.isupper() or len(first_line) < 50:
                    return first_line
        
        # Look for common title patterns
        title_patterns = [
            re.compile(r'^(job\s+title|position|role):\s*(.+)$', re.IGNORECASE | re.MULTILINE),
            re.compile(r'^#+\s*(.+)$', re.MULTILINE),  # Markdown heading
        ]
        
        for pattern in title_patterns:
            match = pattern.search(text)
            if match:
                title = match.group(1 if len(match.groups()) > 1 else 0).strip()
                if title and len(title) < 100:
                    return title
        
        return None

    def _extract_required_keywords(self, text: str) -> List[str]:
        """Extract required keywords using heuristics."""
        keywords = []
        
        # Find required section
        for pattern in self.REQUIRED_PATTERNS:
            match = pattern.search(text)
            if match:
                # Extract text after "required" marker
                start_pos = match.end()
                section_text = text[start_pos:start_pos + 500]  # Look at next 500 chars
                keywords.extend(self._extract_keywords_from_text(section_text))
                break
        
        # If no explicit required section, extract from common tech keywords
        if not keywords:
            keywords = self._extract_keywords_from_text(text)
        
        return list(set(keywords))[:20]  # Deduplicate and limit

    def _extract_preferred_keywords(self, text: str) -> List[str]:
        """Extract preferred keywords using heuristics."""
        keywords = []
        
        # Find preferred section
        for pattern in self.PREFERRED_PATTERNS:
            match = pattern.search(text)
            if match:
                start_pos = match.end()
                section_text = text[start_pos:start_pos + 500]
                keywords.extend(self._extract_keywords_from_text(section_text))
                break
        
        return list(set(keywords))[:15]  # Deduplicate and limit

    def _extract_keywords_from_text(self, text: str) -> List[str]:
        """Extract keywords by matching against common tech terms."""
        text_lower = text.lower()
        found_keywords = []
        
        for keyword in self.COMMON_TECH_KEYWORDS:
            # Match whole word only
            pattern = re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE)
            if pattern.search(text_lower):
                found_keywords.append(keyword)
        
        return found_keywords

