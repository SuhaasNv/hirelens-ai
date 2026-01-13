"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "../../lib/types";
import ProbabilityFunnel from "../../components/ProbabilityFunnel";
import StageExplanationCard from "../../components/StageExplanationCard";
import RecommendationList from "../../components/RecommendationList";
import ConfidenceBadge from "../../components/ConfidenceBadge";
import Tooltip from "../../components/Tooltip";

export default function ResultsPage() {
  const router = useRouter();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (stored) {
      try {
        setAnalysisResult(JSON.parse(stored));
        // Trigger fade-in animation after mount
        requestAnimationFrame(() => setIsMounted(true));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  // Memoize computed values to avoid recalculation on every render
  const { scores, explanations, formattedTimestamp, confidenceInterval } = useMemo(() => {
    if (!analysisResult) {
      return {
        scores: null,
        explanations: null,
        formattedTimestamp: "",
        confidenceInterval: null,
      };
    }

    const { scores: s, explanations: e } = analysisResult;
    const timestamp = new Date(analysisResult.timestamp);
    const ci = s.overall.overall_hiring_probability_confidence_interval;

    return {
      scores: s,
      explanations: e,
      formattedTimestamp: timestamp.toLocaleString(),
      confidenceInterval: ci
        ? {
            level: (ci.confidence_level * 100).toFixed(0),
            lower: (ci.lower * 100).toFixed(0),
            upper: (ci.upper * 100).toFixed(0),
          }
        : null,
    };
  }, [analysisResult]);

  if (!analysisResult || !scores || !explanations) {
    return (
      <div className="container-custom py-24">
        <div className="text-center text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 sm:py-16">
      <div className="container-custom">
        <div
          className={`max-w-6xl mx-auto space-y-12 sm:space-y-16 transition-all duration-500 ${
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white">
              Analysis Results
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Analysis completed at {formattedTimestamp}
            </p>
          </div>

          {/* Overall Hiring Probability - Hero Metric */}
          <section className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2 flex-wrap">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-light text-white tabular-nums">
                {(scores.overall.overall_hiring_probability * 100).toFixed(0)}%
              </div>
              <ConfidenceBadge value={scores.overall.overall_hiring_probability} />
            </div>
            <Tooltip
              label="Overall Hiring Probability"
              description="Estimated probability of receiving an offer based on all stages."
            >
              <div className="text-xs sm:text-sm font-light text-slate-400 cursor-help underline decoration-dotted decoration-slate-600 inline-block">
                Overall Hiring Probability
              </div>
            </Tooltip>
            {confidenceInterval && (
              <div className="text-xs text-slate-500 mt-2">
                {confidenceInterval.level}% confidence: {confidenceInterval.lower}% - {confidenceInterval.upper}%
              </div>
            )}
          </section>

          {/* Hiring Funnel Section */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-2">
                Hiring Funnel
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Probability of passing each stage of the hiring process
              </p>
            </div>
            <ProbabilityFunnel
              stageProbabilities={scores.overall.stage_probabilities}
              showConfidenceBadges={true}
              atsTooltip={{
                label: "ATS Pass Probability",
                description: "Probability that your resume passes automated screening systems.",
              }}
            />
          </section>

          {/* Stage Explanations Section */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-2">
                Stage Explanations
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <StageExplanationCard
                stageName="ATS"
                summary={explanations.stage_explanations.ats.summary}
                keyFactors={explanations.stage_explanations.ats.key_factors || []}
              />
              <StageExplanationCard
                stageName="Recruiter"
                summary={explanations.stage_explanations.recruiter.summary}
                keyFactors={explanations.stage_explanations.recruiter.key_factors || []}
              />
              <StageExplanationCard
                stageName="Interview"
                summary={explanations.stage_explanations.interview.summary}
                keyFactors={explanations.stage_explanations.interview.key_factors || []}
              />
              <StageExplanationCard
                stageName="Overall"
                summary={explanations.stage_explanations.overall.summary}
                keyFactors={explanations.stage_explanations.overall.key_factors || []}
              />
            </div>
          </section>

          {/* Recommendations Section */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-light text-white mb-2">
                Recommendations
              </h2>
            </div>
            <RecommendationList recommendations={explanations.recommendations || []} />
          </section>
        </div>
      </div>
    </div>
  );
}

