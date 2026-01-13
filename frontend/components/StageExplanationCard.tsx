"use client";

type StageName = "ATS" | "Recruiter" | "Interview" | "Overall";

interface StageExplanationCardProps {
  stageName: StageName;
  summary: string;
  keyFactors: string[];
}

export default function StageExplanationCard({
  stageName,
  summary,
  keyFactors,
}: StageExplanationCardProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 transition-all duration-200 card-hover">
      <h3 className="text-base sm:text-lg font-medium text-white mb-3">
        {stageName} Stage
      </h3>

      <p className="text-slate-300 mb-4 sm:mb-5 leading-relaxed text-xs sm:text-sm">
        {summary}
      </p>

      {keyFactors.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Key Factors
          </h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {keyFactors.map((factor, index) => (
              <li
                key={index}
                className="text-xs sm:text-sm text-slate-400 flex items-start"
              >
                <span className="text-slate-500 mr-2">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

