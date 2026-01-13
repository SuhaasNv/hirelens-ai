"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // Intersection Observer for section entrance animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("section-entrance");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const handleCTAClick = () => {
    router.push("/analyze");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Viewport */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto text-center space-y-8 sm:space-y-10">
            <h1 className="text-responsive-hero font-light tracking-tight text-white leading-tight animate-fade-in-up">
              Understand How
              <br />
              <span className="font-normal">You Get Hired</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              ATS systems. Recruiters. Interviews.
              <br />
              Explained clearly.
            </p>
            <div className="pt-4 animate-fade-in-up animation-delay-400">
              <button
                onClick={handleCTAClick}
                className="btn-primary bg-white text-slate-900 font-medium py-3 sm:py-4 px-8 sm:px-12 rounded-lg hover:bg-gray-100 hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-base sm:text-lg tracking-wide"
              >
                Analyze My Resume
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        ref={(el) => {
          sectionRefs.current[0] = el;
        }}
        className="relative py-16 sm:py-24 lg:py-32"
      >
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-responsive-heading font-light text-white text-center mb-12 sm:mb-16">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
              {/* Step 1 */}
              <div className="text-center space-y-4 card-hover">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white">
                  Upload Your Resume
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Upload your resume in PDF, DOC, or DOCX format along with the job description.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-4 card-hover">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white">
                  We Simulate the Hiring Process
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Our system simulates ATS screening, recruiter evaluation, and interview readiness
                  assessment.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-4 card-hover">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white">
                  Get Clear Insights
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Receive probabilities, stage-by-stage explanations, and actionable recommendations
                  to improve your resume.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes HireLens Different */}
      <section
        ref={(el) => {
          sectionRefs.current[1] = el;
        }}
        className="relative py-16 sm:py-24 lg:py-32 border-t border-slate-700/30"
      >
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-responsive-heading font-light text-white text-center mb-12 sm:mb-16">
              What Makes HireLens Different
            </h2>
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                    Explainable Scores
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Not black-box AI. Every score comes with clear explanations of why you passed or
                    failed each stage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                    Real Hiring Funnel Simulation
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    We model the actual hiring process: ATS → Recruiter → Interviewer. Not generic
                    resume scoring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                    Probabilities, Not Vague Feedback
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Get specific probabilities for each stage, with confidence intervals. Know your
                    chances, not just "good" or "bad."
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                    Built for Serious Candidates
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Designed for candidates who want to understand and improve, not just get a quick
                    score.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Clarity Section */}
      <section
        ref={(el) => {
          sectionRefs.current[2] = el;
        }}
        className="relative py-16 sm:py-24 lg:py-32 border-t border-slate-700/30"
      >
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-responsive-heading font-light text-white">
              Trust & Clarity
            </h2>
            <div className="space-y-4 sm:space-y-6 text-slate-300 leading-relaxed text-base sm:text-lg">
              <p>
                This tool does <span className="text-white font-medium">not</span> auto-apply for
                jobs. It does <span className="text-white font-medium">not</span> fake recruiter
                decisions or manipulate hiring systems.
              </p>
              <p>
                HireLens AI helps you understand how your resume performs at each stage of the
                hiring process. It provides honest probabilities, clear explanations, and actionable
                recommendations.
              </p>
              <p className="text-slate-400">
                Use it to improve your resume, prepare for interviews, and make informed decisions
                about your job search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        ref={(el) => {
          sectionRefs.current[3] = el;
        }}
        className="relative py-16 sm:py-24 lg:py-32 border-t border-slate-700/30"
      >
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-responsive-heading font-light text-white">
              Ready to Understand Your Hiring Prospects?
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 font-light">
              Get clear, explainable insights into how your resume performs.
            </p>
            <div className="pt-4">
              <button
                onClick={handleCTAClick}
                className="btn-primary bg-white text-slate-900 font-medium py-3 sm:py-4 px-8 sm:px-12 rounded-lg hover:bg-gray-100 hover:shadow-lg transition-all duration-200 text-base sm:text-lg tracking-wide"
              >
                Analyze My Resume
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
