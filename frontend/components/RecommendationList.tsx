"use client";

import { useMemo } from "react";

interface Recommendation {
  priority: string;
  category: string;
  action: string;
  impact: string;
  reasoning: string;
  stage_affected: string;
  impact_score_delta?: number;
  impact_probability_delta?: number;
}

interface RecommendationListProps {
  recommendations: Recommendation[];
}

// Use Map for O(1) lookup instead of switch statement
const PRIORITY_ORDER_MAP = new Map<string, number>([
  ["critical", 0],
  ["high", 1],
  ["medium", 2],
  ["low", 3],
]);

const PRIORITY_COLOR_MAP = new Map<string, string>([
  ["critical", "bg-red-500"],
  ["high", "bg-orange-500"],
  ["medium", "bg-amber-500"],
  ["low", "bg-slate-500"],
]);

const DEFAULT_PRIORITY_ORDER = 4;
const DEFAULT_PRIORITY_COLOR = "bg-slate-500";

/**
 * Maps priority strings to sort order.
 * 
 * Defensive against future backend extensions: Unknown priorities are safely
 * handled by sorting them last (highest order number). The backend currently
 * defines: "high", "medium", "low". This frontend also supports "critical"
 * as a future extension, treating it as highest priority.
 */
function getPriorityOrder(priority: string): number {
  return PRIORITY_ORDER_MAP.get(priority.toLowerCase()) ?? DEFAULT_PRIORITY_ORDER;
}

/**
 * Returns Tailwind classes for priority dot color.
 * 
 * Defensive: Unknown priorities default to neutral gray styling.
 */
function getPriorityDotColor(priority: string): string {
  return PRIORITY_COLOR_MAP.get(priority.toLowerCase()) ?? DEFAULT_PRIORITY_COLOR;
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  // Memoize sorted recommendations to avoid re-sorting on every render
  const sortedRecommendations = useMemo(() => {
    if (recommendations.length === 0) return [];
    
    // Create array with pre-computed priority order for stable sort
    const withOrder = recommendations.map((rec) => ({
      rec,
      order: getPriorityOrder(rec.priority),
    }));
    
    // Sort once with pre-computed order
    withOrder.sort((a, b) => a.order - b.order);
    
    return withOrder.map((item) => item.rec);
  }, [recommendations]);

  if (sortedRecommendations.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 sm:p-8">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 mb-4">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-slate-300 font-light text-base sm:text-lg">
            No critical issues detected. Your resume performs well across all stages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {sortedRecommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 transition-all duration-200 card-hover"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Priority dot */}
            <div
              className={`w-2 h-2 rounded-full ${getPriorityDotColor(rec.priority)} mt-2 flex-shrink-0`}
            />

            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white mb-1 text-sm sm:text-base">
                    {rec.action}
                  </h4>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">
                    {rec.category}
                  </span>
                </div>
                {rec.impact_probability_delta !== undefined && (
                  <span className="text-xs sm:text-sm font-light text-emerald-400 whitespace-nowrap flex-shrink-0">
                    +{(rec.impact_probability_delta * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {rec.impact}
              </p>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {rec.reasoning}
              </p>

              {rec.impact_score_delta !== undefined && (
                <div className="pt-2 sm:pt-3 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    Expected score improvement: +{rec.impact_score_delta.toFixed(1)} points
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

