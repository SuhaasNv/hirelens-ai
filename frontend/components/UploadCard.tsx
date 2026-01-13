"use client";

import { useRef, useState, useCallback, useMemo } from "react";

interface UploadCardProps {
  onFileChange: (file: File | null) => void;
  onError?: (error: string) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MB_DIVISOR = 1024 * 1024;
// Use Set for O(1) lookup instead of O(n) array.includes()
const ALLOWED_FILE_TYPES = new Set(["pdf", "doc", "docx", "txt"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export default function UploadCard({ onFileChange, onError }: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Memoize validation function to avoid recreation on every render
  const validateFile = useCallback((file: File): string | null => {
    // Check file size first (fastest check)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / MB_DIVISOR).toFixed(2);
      return `File size exceeds 10MB limit. Your file is ${sizeMB}MB.`;
    }

    // Optimize extension extraction - find last dot index instead of split/pop
    const lastDotIndex = file.name.lastIndexOf(".");
    if (lastDotIndex === -1 || lastDotIndex === file.name.length - 1) {
      return `Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.`;
    }

    const extension = file.name.slice(lastDotIndex + 1).toLowerCase();
    if (!ALLOWED_FILE_TYPES.has(extension)) {
      return `Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.`;
    }

    // Check MIME type (if available) - Set lookup is O(1)
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return `Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.`;
    }

    return null;
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setFileName(null);
        onFileChange(null);
        if (onError) {
          onError(error);
        }
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setValidationError(null);
      setFileName(file.name);
      onFileChange(file);
    } else {
      setValidationError(null);
      setFileName(null);
      onFileChange(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setFileName(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-slate-800/50 border-2 border-dashed border-slate-600/50 rounded-xl p-6 sm:p-8 backdrop-blur-sm transition-all duration-200 card-hover">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!fileName ? (
        <div className="text-center">
          <svg
            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleClick}
              className="text-white hover:text-gray-200 font-medium text-sm sm:text-base transition-colors"
            >
              Click to upload
            </button>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, DOC, DOCX, or TXT (max 10MB)
            </p>
            {validationError && (
              <p className="text-xs text-red-400 mt-2 px-2">
                {validationError}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <svg
              className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">
                {fileName}
              </p>
              <p className="text-xs text-slate-400">
                Resume file selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors flex-shrink-0"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

