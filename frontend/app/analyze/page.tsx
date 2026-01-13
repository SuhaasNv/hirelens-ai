"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UploadCard from "../../components/UploadCard";
import JobDescriptionInput from "../../components/JobDescriptionInput";
import { analyzeResume, fileToBase64, getFileFormat } from "../../lib/api";
import type { ResumeInput, JobDescriptionInput as JobDescriptionInputType } from "../../lib/types";

export default function AnalyzePage() {
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
      const [base64Content, fileFormat] = await Promise.all([
        fileToBase64(resumeFile),
        Promise.resolve(getFileFormat(resumeFile.name)),
      ]);

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 lg:py-32">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <h1 className="text-responsive-hero font-light tracking-tight text-white">
              Understand How
              <br />
              <span className="font-normal">You Get Hired</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
              ATS. Recruiters. Interviews.
              <br />
              Explained clearly.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="relative py-12 sm:py-16">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <UploadCard onFileChange={handleFileChange} onError={setError} />

              <JobDescriptionInput
                value={jobDescription}
                onChange={handleJobDescriptionChange}
              />

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 sm:px-6 py-3 sm:py-4 rounded-lg backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzing || !resumeFile || !jobDescription.trim()}
                className="btn-primary w-full bg-white text-slate-900 font-medium py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:bg-gray-100 hover:shadow-lg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-base sm:text-lg tracking-wide flex items-center justify-center gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <svg
                      className="size-5 animate-spin motion-reduce:animate-none"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  "Analyze My Resume"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

