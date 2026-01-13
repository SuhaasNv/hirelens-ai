"use client";

type StageName = "ATS" | "Recruiter" | "Interview" | "Overall";

interface AIEnhanced {
  interview_probe_points: string[];
  top_issues_to_fix: Array<{
    issue: string;
    why_it_matters: string;
    priority: "low" | "medium" | "high" | "critical";
  }>;
  improvement_outlook: string;
}

interface StageExplanationCardProps {
  stageName: StageName;
  summary: string;
  keyFactors: string[];
  aiEnhanced?: AIEnhanced;
}

/**
 * StageExplanationCard Component
 * 
 * RENDERING LOGIC:
 * - If `aiEnhanced` exists: Uses AI-enhanced summary and renders AI-specific sections
 * - If `aiEnhanced` does NOT exist: Falls back to deterministic rendering (current behavior)
 * 
 * AI-ENHANCED RENDERING:
 * - Summary: Uses `aiEnhanced` summary (more human-friendly language)
 * - Key Factors: Still shows deterministic key factors for audit transparency
 * - Interview Probe Points: New section showing what interviewers will probe
 * - Top Issues to Fix: New section with prioritized issues
 * - Improvement Outlook: New section with encouraging outlook
 * 
 * DETERMINISTIC FALLBACK:
 * - Summary: Uses deterministic summary
 * - Key Factors: Shows deterministic key factors
 * - No AI-specific sections rendered
 */
export default function StageExplanationCard({
  stageName,
  summary,
  keyFactors,
  aiEnhanced,
}: StageExplanationCardProps) {
  // Summary: Backend replaces deterministic summary with AI-enhanced summary when AI is enabled
  // If aiEnhanced exists, the summary field already contains the AI-enhanced version
  // If aiEnhanced does NOT exist, the summary field contains the deterministic version
  // No conditional logic needed - backend handles the replacement

  // Priority color mapping for top issues
  const priorityColors: Record<string, string> = {
    critical: "text-red-400",
    high: "text-orange-400",
    medium: "text-amber-400",
    low: "text-slate-400",
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 transition-all duration-200 card-hover">
      <h3 className="text-base sm:text-lg font-medium text-white mb-3">
        {stageName} Stage
      </h3>

      {/* Summary: AI-enhanced when available (backend replaces deterministic summary), deterministic fallback otherwise */}
      <p className="text-slate-300 mb-4 sm:mb-5 leading-relaxed text-xs sm:text-sm">
        {summary}
      </p>

      {/* Key Factors: Always show deterministic factors for audit transparency */}
      {keyFactors.length > 0 && (
        <div className="mb-4 sm:mb-5">
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Key Factors
          </h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {keyFactors.map((factor, index) => (
              <li
                key={`factor-${index}-${factor}`}
                className="text-xs sm:text-sm text-slate-400 flex items-start"
              >
                {/* Using composite key with index: Deterministic data may contain duplicate factor strings, and list order is stable */}
                <span className="text-slate-500 mr-2">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI-ENHANCED SECTIONS: Only render when aiEnhanced exists */}
      {aiEnhanced && (
        <div className="space-y-4 sm:space-y-5 border-t border-slate-700/50 pt-4 sm:pt-5">
          {/* Interview Probe Points: What interviewers will likely probe */}
          {aiEnhanced.interview_probe_points.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                What Interviewers Will Probe
              </h4>
              <ul className="space-y-2 sm:space-y-2.5">
                {aiEnhanced.interview_probe_points.map((point, index) => (
                  <li
                    key={`probe-${index}-${point.substring(0, 20)}`}
                    className="text-xs sm:text-sm text-slate-300 flex items-start"
                  >
                    {/* Using composite key with index: Deterministic data may contain duplicate probe points, and list order is stable */}
                    <span className="text-blue-400 mr-2 flex-shrink-0 mt-0.5">→</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Issues to Fix: Prioritized issues from AI analysis */}
          {aiEnhanced.top_issues_to_fix.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Top Issues to Fix
              </h4>
              <ul className="space-y-3 sm:space-y-3.5">
                {aiEnhanced.top_issues_to_fix.map((issue, index) => (
                  <li key={`issue-${index}-${issue.issue.substring(0, 30)}`} className="space-y-1">
                    {/* Using composite key with index: Deterministic data may contain duplicate issues, and list order is stable */}
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs font-medium uppercase tracking-wide ${priorityColors[issue.priority] || "text-slate-400"}`}
                      >
                        {issue.priority}
                      </span>
                      <span className="text-xs sm:text-sm text-white font-medium flex-1">
                        {issue.issue}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 ml-4 pl-2 border-l border-slate-700/50">
                      {issue.why_it_matters}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvement Outlook: Encouraging, professional outlook */}
          {aiEnhanced.improvement_outlook && (
            <div className="bg-slate-900/30 rounded-lg p-3 sm:p-4 border border-slate-700/30">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Improvement Outlook
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {aiEnhanced.improvement_outlook}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

