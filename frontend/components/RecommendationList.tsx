"use client";

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

/**
 * Maps priority strings to sort order.
 * 
 * Defensive against future backend extensions: Unknown priorities are safely
 * handled by sorting them last (highest order number). The backend currently
 * defines: "high", "medium", "low". This frontend also supports "critical"
 * as a future extension, treating it as highest priority.
 */
function getPriorityOrder(priority: string): number {
  switch (priority.toLowerCase()) {
    case "critical":
      return 0; // Highest priority (future extension)
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4; // Unknown priorities sorted last
  }
}

/**
 * Returns Tailwind classes for priority dot color.
 * 
 * Defensive: Unknown priorities default to neutral gray styling.
 */
function getPriorityDotColor(priority: string): string {
  const priorityLower = priority.toLowerCase();
  if (priorityLower === "critical") {
    return "bg-red-500";
  } else if (priorityLower === "high") {
    return "bg-orange-500";
  } else if (priorityLower === "medium") {
    return "bg-amber-500";
  } else {
    // Default for "low" and any unknown priorities
    return "bg-slate-500";
  }
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  // Sort by priority: critical > high > medium > low > unknown
  // Unknown priorities are safely handled by sorting last
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    return getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
  });

  if (sortedRecommendations.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-4">
            <svg
              className="w-6 h-6 text-emerald-400"
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
          <p className="text-slate-300 font-light text-lg">
            No critical issues detected. Your resume performs well across all stages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedRecommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            {/* Priority dot */}
            <div className={`w-2 h-2 rounded-full ${getPriorityDotColor(rec.priority)} mt-2 flex-shrink-0`} />
            
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{rec.action}</h4>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">{rec.category}</span>
                </div>
                {rec.impact_probability_delta !== undefined && (
                  <span className="text-sm font-light text-emerald-400 whitespace-nowrap">
                    +{(rec.impact_probability_delta * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{rec.impact}</p>

              <p className="text-sm text-slate-400 leading-relaxed">{rec.reasoning}</p>

              {rec.impact_score_delta !== undefined && (
                <div className="pt-3 border-t border-slate-700/50">
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

