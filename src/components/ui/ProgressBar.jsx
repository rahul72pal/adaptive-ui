import React from 'react';

export function ProgressBar({ progress = 0, height = 'h-2.5', className = '', showLabel = false }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-ink-secondary mb-1.5">
          <span>Progress</span>
          <span className="text-brand-700 font-semibold">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-surface-variant rounded-full overflow-hidden ${height}`}>
        <div
          className="h-full gradient-btn transition-all duration-500 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
