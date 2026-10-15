import React from 'react';

export function ProgressBar({ progress = 0, height = 'h-2', className = '', showLabel = false }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-[#A1A1AA] mb-1.5">
          <span>Progress</span>
          <span className="text-[#8B7CFF] font-semibold">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-[#1C1C23] border border-[#222229] rounded-full overflow-hidden ${height}`}>
        <div
          className="h-full bg-gradient-to-r from-[#6558F5] to-[#8B7CFF] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
