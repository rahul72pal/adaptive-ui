import React from 'react';

export function Card({ children, className = '', hoverEffect = false, onClick }) {
  const hasCustomBg = className.includes('bg-') || className.includes('gradient-');
  const baseCardStyle = hasCustomBg
    ? 'rounded-2xl p-6 backdrop-blur-md transition-all duration-200 border border-surface-variant'
    : 'glass-card rounded-2xl p-6 transition-all duration-200';

  return (
    <div
      onClick={onClick}
      className={`${baseCardStyle} ${
        hoverEffect ? 'hover:-translate-y-1 hover:shadow-elevated hover:border-brand-300 cursor-pointer' : 'shadow-subtle'
      } ${className}`}
    >
      {children}
    </div>
  );
}
