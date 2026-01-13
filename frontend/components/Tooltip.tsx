"use client";

import { useState, useCallback } from "react";

interface TooltipProps {
  /** Short title for the tooltip, shown in bold at the top. */
  label: string;
  /** Human-readable description explaining the concept/value. */
  description: string;
  /** The element that the tooltip is attached to (trigger). */
  children: React.ReactNode;
}

/**
 * Tooltip
 *
 * RESPONSIBILITY:
 * - Provides a small, accessible tooltip on hover/focus.
 *
 * ACCESSIBILITY:
 * - Uses `aria-label` on the trigger for screen readers.
 * - Uses `role="tooltip"` for the content box.
 *
 * NOTES:
 * - This component does not manage positioning beyond a simple "above trigger" layout.
 */
export default function Tooltip({ label, description, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Memoize event handlers to avoid function recreation on every render
  const handleShow = useCallback(() => setIsVisible(true), []);
  const handleHide = useCallback(() => setIsVisible(false), []);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onFocus={handleShow}
        onBlur={handleHide}
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

