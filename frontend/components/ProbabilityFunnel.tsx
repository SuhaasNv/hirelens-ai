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
  let bgColorClass: string;
  if (percentage >= 70) {
    colorClass = "bg-emerald-500";
    bgColorClass = "bg-emerald-500/20";
  } else if (percentage >= 40) {
    colorClass = "bg-amber-500";
    bgColorClass = "bg-amber-500/20";
  } else {
    colorClass = "bg-red-500";
    bgColorClass = "bg-red-500/20";
  }

  const labelElement = tooltip ? (
    <Tooltip label={tooltip.label} description={tooltip.description}>
      <span className="text-xs sm:text-sm font-medium text-slate-300 cursor-help underline decoration-dotted decoration-slate-500">
        {label}
      </span>
    </Tooltip>
  ) : (
    <span className="text-xs sm:text-sm font-medium text-slate-300">
      {label}
    </span>
  );

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex justify-between items-center gap-2">
        {labelElement}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl sm:text-2xl font-light text-white tabular-nums">
            {percentage}%
          </span>
          {showConfidenceBadge && <ConfidenceBadge value={value} />}
        </div>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-1.5 sm:h-2 overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 transition-all duration-200 card-hover">
        <ProgressBar
          label="ATS Pass"
          value={stageProbabilities.ats_pass}
          showConfidenceBadge={showConfidenceBadges}
          tooltip={atsTooltip}
        />
      </div>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 transition-all duration-200 card-hover">
        <ProgressBar
          label="Recruiter Pass"
          value={stageProbabilities.recruiter_pass}
          showConfidenceBadge={showConfidenceBadges}
        />
      </div>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 transition-all duration-200 card-hover">
        <ProgressBar
          label="Interview Pass"
          value={stageProbabilities.interview_pass}
          showConfidenceBadge={showConfidenceBadges}
        />
      </div>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 transition-all duration-200 card-hover">
        <ProgressBar
          label="Offer Probability"
          value={stageProbabilities.offer}
          showConfidenceBadge={showConfidenceBadges}
        />
      </div>
    </div>
  );
}

