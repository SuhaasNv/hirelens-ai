/**
 * API client for HireLens AI.
 * Handles all API communication with the backend.
 */

import { AnalyzeRequest, AnalyzeOptions, AnalysisResult, ErrorResponse, ResumeInput, JobDescriptionInput } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

  const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
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

/**
 * Determines file format from file extension.
 */
export function getFileFormat(fileName: string): "pdf" | "doc" | "docx" | "txt" {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "pdf";
    case "doc":
      return "doc";
    case "docx":
      return "docx";
    case "txt":
      return "txt";
    default:
      return "txt"; // Default fallback
  }
}

