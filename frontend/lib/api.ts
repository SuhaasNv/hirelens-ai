/**
 * API client for HireLens AI.
 * Handles all API communication with the backend.
 */

import { AnalyzeRequest, AnalyzeOptions, AnalysisResult, ErrorResponse, ResumeInput, JobDescriptionInput } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

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

  // Ensure URL has NO trailing slash (exact match required)
  // Normalize: remove trailing slash from base URL, then append path
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/analyze`;
  const method = "POST";

  // Enforce JSON-only request (MVP contract)
  // Backend expects: Content-Type: application/json
  // Body must be JSON string, NOT FormData
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify(requestBody);

  // Log actual request being sent
  console.log("[Frontend API] Making request:", {
    url,
    method,
    apiBaseUrl: API_BASE_URL,
    fullPath: "/api/v1/analyze",
    headers: Object.fromEntries(Object.entries(headers)),
    bodyType: typeof body,
    bodyLength: body.length,
    contentType: headers["Content-Type"],
    isJSON: headers["Content-Type"] === "application/json",
    bodyPreview: body.substring(0, 100) + "...",
  });

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  console.log("[Frontend API] Response received:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      error_code: "UNKNOWN_ERROR",
      message: `HTTP ${response.status}: ${response.statusText}`,
      timestamp: new Date().toISOString(),
    }));

    console.error("[Frontend API] Request failed:", errorData);
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

