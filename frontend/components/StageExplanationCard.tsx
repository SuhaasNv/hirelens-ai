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
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{stageName} Stage</h3>
      
      <p className="text-gray-700 mb-4 leading-relaxed">{summary}</p>
      
      {keyFactors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Factors</h4>
          <ul className="list-disc list-inside space-y-1">
            {keyFactors.map((factor, index) => (
              <li key={index} className="text-sm text-gray-600">
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

