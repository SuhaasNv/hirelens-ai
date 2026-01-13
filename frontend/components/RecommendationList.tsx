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
 * Returns Tailwind classes for priority badge styling.
 * 
 * Defensive: Unknown priorities default to neutral gray styling.
 */
function getPriorityBadgeClass(priority: string): string {
  const priorityLower = priority.toLowerCase();
  if (priorityLower === "critical" || priorityLower === "high") {
    return "bg-red-100 text-red-700 border-red-200";
  } else if (priorityLower === "medium") {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  } else {
    // Default for "low" and any unknown priorities
    return "bg-gray-100 text-gray-700 border-gray-200";
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <p className="text-gray-600 text-center">No recommendations available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedRecommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border-l-4 border-blue-500 border border-gray-200 p-5 shadow-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded border ${getPriorityBadgeClass(
                  rec.priority
                )}`}
              >
                {rec.priority.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                {rec.category}
              </span>
            </div>
            {rec.impact_probability_delta !== undefined && (
              <span className="text-xs font-medium text-blue-600">
                +{(rec.impact_probability_delta * 100).toFixed(1)}% probability
              </span>
            )}
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">{rec.action}</h4>

          <p className="text-sm text-gray-700 mb-2">{rec.impact}</p>

          <p className="text-sm text-gray-600">{rec.reasoning}</p>

          {rec.impact_score_delta !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Expected score improvement: +{rec.impact_score_delta.toFixed(1)} points
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

