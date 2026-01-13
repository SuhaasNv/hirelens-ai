"use client";

interface ConfidenceBadgeProps {
  value: number; // 0-1 probability
}

export default function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  let label: string;
  let colorClass: string;

  if (value >= 0.7) {
    label = "High confidence";
    colorClass = "bg-green-100 text-green-700 border-green-200";
  } else if (value >= 0.4) {
    label = "Medium confidence";
    colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
  } else {
    label = "Low confidence";
    colorClass = "bg-red-100 text-red-700 border-red-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}
    >
      {label}
    </span>
  );
}

