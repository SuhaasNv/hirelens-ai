"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (stored) {
      try {
        setAnalysisResult(JSON.parse(stored));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  if (!analysisResult) {
    return (
      <div className="container-custom py-24">
        <div className="text-center text-slate-400">Loading...</div>
      </div>
    );
  }

  const { scores, explanations } = analysisResult;

  return (
    <div className="min-h-screen py-16">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white">
              Analysis Results
            </h1>
            <p className="text-slate-400 text-sm">
              Analysis completed at {new Date(analysisResult.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Overall Hiring Probability - Hero Metric */}
          <section className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-6xl sm:text-7xl font-light text-white tabular-nums">
                {(scores.overall.overall_hiring_probability * 100).toFixed(0)}%
              </div>
              <ConfidenceBadge value={scores.overall.overall_hiring_probability} />
            </div>
            <Tooltip
              label="Overall Hiring Probability"
              description="Estimated probability of receiving an offer based on all stages."
            >
              <div className="text-sm font-light text-slate-400 cursor-help underline decoration-dotted decoration-slate-600 inline-block">
                Overall Hiring Probability
              </div>
            </Tooltip>
            {scores.overall.overall_hiring_probability_confidence_interval && (
              <div className="text-xs text-slate-500 mt-2">
                {(
                  scores.overall.overall_hiring_probability_confidence_interval.confidence_level *
                  100
                ).toFixed(0)}% confidence:{" "}
                {(
                  scores.overall.overall_hiring_probability_confidence_interval.lower * 100
                ).toFixed(0)}% -{" "}
                {(
                  scores.overall.overall_hiring_probability_confidence_interval.upper * 100
                ).toFixed(0)}%
              </div>
            )}
          </section>

          {/* Hiring Funnel Section */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-light text-white mb-2">Hiring Funnel</h2>
              <p className="text-sm text-slate-400">
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
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-light text-white mb-2">Stage Explanations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-light text-white mb-2">Recommendations</h2>
            </div>
            <RecommendationList recommendations={explanations.recommendations || []} />
          </section>
        </div>
      </div>
    </div>
  );
}

