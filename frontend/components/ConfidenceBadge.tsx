"use client";

interface ConfidenceBadgeProps {
  value: number; // 0-1 probability
}

export default function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  let label: string;
  let colorClass: string;

  if (value >= 0.7) {
    label = "High confidence";
    colorClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  } else if (value >= 0.4) {
    label = "Medium confidence";
    colorClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  } else {
    label = "Low confidence";
    colorClass = "bg-red-500/20 text-red-400 border-red-500/30";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-light border ${colorClass}`}
    >
      {label}
    </span>
  );
}

