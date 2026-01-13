"use client";

interface StageProbabilities {
  ats_pass: number;
  recruiter_pass: number;
  interview_pass: number;
  offer: number;
}

interface ProbabilityFunnelProps {
  stageProbabilities: StageProbabilities;
}

interface ProgressBarProps {
  label: string;
  value: number; // 0-1 probability
}

function ProgressBar({ label, value }: ProgressBarProps) {
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

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
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

export default function ProbabilityFunnel({ stageProbabilities }: ProbabilityFunnelProps) {
  return (
    <div className="space-y-4">
      <ProgressBar label="ATS Pass" value={stageProbabilities.ats_pass} />
      <ProgressBar label="Recruiter Pass" value={stageProbabilities.recruiter_pass} />
      <ProgressBar label="Interview Pass" value={stageProbabilities.interview_pass} />
      <ProgressBar label="Offer Probability" value={stageProbabilities.offer} />
    </div>
  );
}

