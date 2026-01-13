import { AnalyzeRequest, AnalyzeOptions, AnalysisResult, ErrorResponse, ResumeInput, JobDescriptionInput } from "./types";

/**
 * Base URL for the HireLens API.
 *
 * - Can be overridden via NEXT_PUBLIC_API_BASE_URL at build/runtime.
 * - Falls back to localhost:3001 for local development.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
// Normalize URL once at module load instead of on every call
const NORMALIZED_BASE_URL = API_BASE_URL.replace(/\/$/, "");
const ANALYZE_ENDPOINT = `${NORMALIZED_BASE_URL}/api/v1/analyze`;

/**
 * Calls the backend to analyze a resume against a job description.
 *
 * INPUTS:
 * - resumeInput: Canonical `ResumeInput` (base64 file content + metadata)
 * - jobDescriptionInput: Canonical `JobDescriptionInput`
 * - options: Optional analysis configuration (ATS type, recruiter persona, etc.)
 *
 * OUTPUT:
 * - Resolves with a fully-populated `AnalysisResult` object from the backend.
 *
 * NOTES:
 * - This function is intentionally thin: no business logic, only transport + error mapping.
 * - Throws a standard `Error` with a human-readable message if the request fails.
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
  // Enforce JSON-only request (MVP contract).
  // Backend expects: Content-Type: application/json.
  // Body must be JSON string, NOT FormData.
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

    // Surface a simple, user-facing error. The backend keeps richer error details.
    throw new Error(errorData.message || `API request failed: ${response.statusText}`);
  }

  const data: AnalysisResult = await response.json();
  return data;
}

/**
 * Converts a browser `File` object to a base64-encoded string.
 *
 * INPUT:
 * - file: File selected by the user (e.g. from an <input type="file">)
 *
 * OUTPUT:
 * - Promise<string>: Base64 payload (without the data:... prefix)
 *
 * NOTES:
 * - Uses FileReader under the hood; errors are propagated via Promise rejection.
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
} as const;

/**
 * Determines file format from file name.
 *
 * INPUT:
 * - fileName: e.g. "resume.pdf", "cv.DOCX"
 *
 * OUTPUT:
 * - One of: "pdf" | "doc" | "docx" | "txt"
 *
 * BEHAVIOR:
 * - Falls back to "txt" if extension is missing or unknown.
 * - Case-insensitive extension matching.
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

