"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadCard from "../components/UploadCard";
import JobDescriptionInput from "../components/JobDescriptionInput";
import { analyzeResume, fileToBase64, getFileFormat } from "../lib/api";
import type { ResumeInput, JobDescriptionInput as JobDescriptionInputType } from "../lib/types";

export default function HomePage() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setResumeFile(file);
    setError(null);
  };

  const handleJobDescriptionChange = (text: string) => {
    setJobDescription(text);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resumeFile) {
      setError("Please upload a resume file");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }

    setIsAnalyzing(true);

    try {
      const base64Content = await fileToBase64(resumeFile);
      const fileFormat = getFileFormat(resumeFile.name);

      const resumeInput: ResumeInput = {
        file_content: base64Content,
        file_format: fileFormat,
        file_name: resumeFile.name,
        file_size_bytes: resumeFile.size,
      };

      const jobDescriptionInput: JobDescriptionInputType = {
        job_description_text: jobDescription.trim(),
      };

      const result = await analyzeResume(resumeInput, jobDescriptionInput);

      // Store result in sessionStorage for results page
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container-custom py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis</h2>
        <p className="text-gray-600 mb-8">
          Upload your resume and job description to get AI-powered insights on your hiring prospects.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <UploadCard onFileChange={handleFileChange} />

          <JobDescriptionInput
            value={jobDescription}
            onChange={handleJobDescriptionChange}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isAnalyzing || !resumeFile || !jobDescription.trim()}
            className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
          </button>
        </form>
      </div>
    </div>
  );
}

