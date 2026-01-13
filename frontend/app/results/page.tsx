"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "../../lib/types";
import ProbabilityFunnel from "../../components/ProbabilityFunnel";
import StageExplanationCard from "../../components/StageExplanationCard";
import RecommendationList from "../../components/RecommendationList";

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
      <div className="container-custom py-12">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  const { scores, explanations } = analysisResult;

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h2>
          <p className="text-gray-600">
            Analysis completed at {new Date(analysisResult.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Hiring Funnel Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Hiring Funnel</h3>
            <p className="text-sm text-gray-600">
              Probability of passing each stage of the hiring process
            </p>
          </div>
          <ProbabilityFunnel stageProbabilities={scores.overall.stage_probabilities} />
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {(scores.overall.overall_hiring_probability * 100).toFixed(0)}%
              </div>
              <div className="text-sm font-medium text-gray-700">Overall Hiring Probability</div>
              {scores.overall.overall_hiring_probability_confidence_interval && (
                <div className="text-xs text-gray-500 mt-1">
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
            </div>
          </div>
        </section>

        {/* Stage Explanations Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Stage Explanations</h3>
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
        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h3>
          <RecommendationList recommendations={explanations.recommendations || []} />
        </section>
      </div>
    </div>
  );
}

