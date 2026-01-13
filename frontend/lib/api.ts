/**
 * API client for HireLens AI.
 * Handles all API communication with the backend.
 */

import { AnalyzeRequest, AnalyzeOptions, AnalysisResult, ErrorResponse, ResumeInput, JobDescriptionInput } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
// Normalize URL once at module load instead of on every call
const NORMALIZED_BASE_URL = API_BASE_URL.replace(/\/$/, "");
const ANALYZE_ENDPOINT = `${NORMALIZED_BASE_URL}/api/v1/analyze`;

/**
 * Analyzes a resume against a job description.
 */
export async function analyzeResume(
  resumeInput: ResumeInput,
  jobDescriptionInput: JobDescriptionInput,
  options?: AnalyzeOptions
): Promise<AnalysisResult> {
  const requestBody: AnalyzeRequest = {
    resume: resumeInput,
    job_description: jobDescriptionInput,
    options: options || {},
  };

  // Enforce JSON-only request (MVP contract)
  // Backend expects: Content-Type: application/json
  // Body must be JSON string, NOT FormData
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify(requestBody);

  const response = await fetch(ANALYZE_ENDPOINT, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      error_code: "UNKNOWN_ERROR",
      message: `HTTP ${response.status}: ${response.statusText}`,
      timestamp: new Date().toISOString(),
    }));

    throw new Error(errorData.message || `API request failed: ${response.statusText}`);
  }

  const data: AnalysisResult = await response.json();
  return data;
}

/**
 * Converts a File object to base64-encoded string.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// File format lookup map for O(1) access
const FILE_FORMAT_MAP: Record<string, "pdf" | "doc" | "docx" | "txt"> = {
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  txt: "txt",
};

/**
 * Determines file format from file extension.
 * Optimized: Uses Map lookup and optimized string extraction.
 */
export function getFileFormat(fileName: string): "pdf" | "doc" | "docx" | "txt" {
  // Optimize: find last dot index instead of split/pop
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
    return "txt"; // Default fallback
  }
  
  const extension = fileName.slice(lastDotIndex + 1).toLowerCase();
  return FILE_FORMAT_MAP[extension] ?? "txt";
}

