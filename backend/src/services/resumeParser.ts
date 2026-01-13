import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { ParsedResume } from "../types";

/**
 * Converts resume file to plain text based on format
 */
export async function extractResumeText(
  fileContent: Buffer,
  fileFormat: "pdf" | "doc" | "docx" | "txt"
): Promise<string> {
  switch (fileFormat) {
    case "pdf":
      const pdfData = await pdfParse(fileContent);
      return pdfData.text;
    case "docx":
      const docxResult = await mammoth.extractRawText({ buffer: fileContent });
      return docxResult.value;
    case "txt":
      return fileContent.toString("utf-8");
    case "doc":
      // DOC format is not well supported, treat as text
      return fileContent.toString("utf-8");
    default:
      throw new Error(`Unsupported file format: ${fileFormat}`);
  }
}

/**
 * Extracts email from text using regex
 */
function extractEmail(text: string): string | null {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

/**
 * Extracts phone number from text using regex
 */
function extractPhone(text: string): string | null {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const match = text.match(phoneRegex);
  return match ? match[0].trim() : null;
}

/**
 * Extracts skills from text using simple keyword matching
 * Looks for common skill patterns and technical terms
 */
function extractSkills(text: string): string[] {
  const commonSkills = [
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "C++",
    "C#",
    "Go",
    "Rust",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Git",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Machine Learning",
    "Data Science",
    "Agile",
    "Scrum",
  ];

  const textLower = text.toLowerCase();
  const foundSkills: string[] = [];

  for (const skill of commonSkills) {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  return foundSkills;
}

/**
 * Detects work experience section
 */
function detectWorkExperience(text: string): boolean {
  const experienceKeywords = [
    "experience",
    "work history",
    "employment",
    "career",
    "professional experience",
  ];
  const textLower = text.toLowerCase();
  return experienceKeywords.some((keyword) => textLower.includes(keyword));
}

/**
 * Detects education section
 */
function detectEducation(text: string): boolean {
  const educationKeywords = ["education", "university", "college", "degree", "bachelor", "master"];
  const textLower = text.toLowerCase();
  return educationKeywords.some((keyword) => textLower.includes(keyword));
}

/**
 * Parses resume from text and returns structured data
 */
export async function parseResume(
  fileContent: Buffer,
  fileFormat: "pdf" | "doc" | "docx" | "txt"
): Promise<ParsedResume> {
  const text = await extractResumeText(fileContent, fileFormat);
  const textLower = text.toLowerCase();

  // Extract basic information
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const skills = extractSkills(text);
  const hasWorkExperience = detectWorkExperience(text);
  const hasEducation = detectEducation(text);

  // Calculate parsing confidence
  let confidence = 0.0;
  if (email) confidence += 0.3;
  if (phone) confidence += 0.3;
  if (hasWorkExperience) confidence += 0.2;
  if (hasEducation) confidence += 0.1;
  if (skills.length > 0) confidence += 0.1;
  confidence = Math.min(1.0, confidence);

  // Generate warnings
  const warnings: Array<{
    type: string;
    field: string;
    message: string;
    severity: string;
  }> = [];

  if (!email) {
    warnings.push({
      type: "missing_field",
      field: "email",
      message: "Email address not found in resume",
      severity: "medium",
    });
  }

  if (!phone) {
    warnings.push({
      type: "missing_field",
      field: "phone",
      message: "Phone number not found in resume",
      severity: "medium",
    });
  }

  if (!hasWorkExperience) {
    warnings.push({
      type: "missing_section",
      field: "work_experience",
      message: "Work experience section not clearly detected",
      severity: "high",
    });
  }

  if (!hasEducation) {
    warnings.push({
      type: "missing_section",
      field: "education",
      message: "Education section not clearly detected",
      severity: "low",
    });
  }

  return {
    personal_info: {
      email: email
        ? { value: email, confidence: 0.95 }
        : undefined,
      phone: phone
        ? { value: phone, confidence: 0.90 }
        : undefined,
    },
    work_experience: hasWorkExperience ? [{}] : [], // Simplified for now
    education: hasEducation ? [{}] : [], // Simplified for now
    skills,
    parsing_confidence: confidence,
    warnings,
  };
}

