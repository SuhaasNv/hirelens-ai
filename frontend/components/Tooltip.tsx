"use client";

import { useState } from "react";

interface TooltipProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

export default function Tooltip({ label, description, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label={description}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className="absolute z-10 px-3 py-2 text-sm text-white bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl whitespace-normal w-64 bottom-full left-1/2 transform -translate-x-1/2 mb-2 transition-opacity duration-200"
          role="tooltip"
        >
          <div className="font-medium mb-1 text-gray-100">
            {label}
          </div>
          <div className="text-xs text-slate-300">
            {description}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
}

