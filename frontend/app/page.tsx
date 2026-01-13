"use client";

import { useState, useEffect } from "react";
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

  // Confirm frontend origin on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🌐 Frontend running on", window.location.origin);
    }
  }, []);

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 lg:py-40">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white">
              UNDERSTAND HOW
              <br />
              <span className="font-normal">YOU GET HIRED</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 font-light max-w-2xl mx-auto">
              ATS. Recruiters. Interviews.
              <br />
              Explained clearly.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="relative py-16">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <UploadCard onFileChange={handleFileChange} />

              <JobDescriptionInput
                value={jobDescription}
                onChange={handleJobDescriptionChange}
              />

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzing || !resumeFile || !jobDescription.trim()}
                className="w-full bg-white text-slate-900 font-medium py-4 px-8 rounded-lg hover:bg-gray-100 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-lg tracking-wide"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze My Resume"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

