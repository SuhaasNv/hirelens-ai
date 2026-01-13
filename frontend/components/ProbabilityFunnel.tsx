"use client";

import Tooltip from "./Tooltip";
import ConfidenceBadge from "./ConfidenceBadge";

interface StageProbabilities {
  ats_pass: number;
  recruiter_pass: number;
  interview_pass: number;
  offer: number;
}

interface ProbabilityFunnelProps {
  stageProbabilities: StageProbabilities;
  showConfidenceBadges?: boolean;
  atsTooltip?: { label: string; description: string };
}

interface ProgressBarProps {
  label: string;
  value: number; // 0-1 probability
  showConfidenceBadge?: boolean;
  tooltip?: { label: string; description: string };
}

function ProgressBar({ label, value, showConfidenceBadge, tooltip }: ProgressBarProps) {
  const percentage = Math.round(value * 100);
  
  // Determine color based on percentage
  let colorClass: string;
  if (percentage >= 70) {
    colorClass = "bg-green-500";
  } else if (percentage >= 40) {
    colorClass = "bg-yellow-500";
  } else {
    colorClass = "bg-red-500";
  }

  const labelElement = tooltip ? (
    <Tooltip label={tooltip.label} description={tooltip.description}>
      <span className="text-sm font-medium text-gray-700 cursor-help underline decoration-dotted">
        {label}
      </span>
    </Tooltip>
  ) : (
    <span className="text-sm font-medium text-gray-700">{label}</span>
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        {labelElement}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
          {showConfidenceBadge && <ConfidenceBadge value={value} />}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function ProbabilityFunnel({
  stageProbabilities,
  showConfidenceBadges = false,
  atsTooltip,
}: ProbabilityFunnelProps) {
  return (
    <div className="space-y-4">
      <ProgressBar
        label="ATS Pass"
        value={stageProbabilities.ats_pass}
        showConfidenceBadge={showConfidenceBadges}
        tooltip={atsTooltip}
      />
      <ProgressBar
        label="Recruiter Pass"
        value={stageProbabilities.recruiter_pass}
        showConfidenceBadge={showConfidenceBadges}
      />
      <ProgressBar
        label="Interview Pass"
        value={stageProbabilities.interview_pass}
        showConfidenceBadge={showConfidenceBadges}
      />
      <ProgressBar
        label="Offer Probability"
        value={stageProbabilities.offer}
        showConfidenceBadge={showConfidenceBadges}
      />
    </div>
  );
}

