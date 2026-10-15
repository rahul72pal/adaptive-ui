// src/components/ui/Skeleton.jsx
import React from 'react';

/**
 * Skeleton placeholder component for dark theme.
 * Supports custom width, height and additional className for styling.
 */
export function Skeleton({ width = '100%', height = '1rem', className = '' }) {
  const style = { width, height };
  return (
    <div
      className={`bg-[#1C1C23] border border-[#222229]/60 rounded-xl animate-pulse ${className}`}
      style={style}
    />
  );
}

export default Skeleton;
