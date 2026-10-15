import React from 'react';

export function Card({ children, className = '', hoverEffect = false, onClick }) {
  const hasCustomBg = className.includes('bg-') || className.includes('gradient-');
  const baseCardStyle = hasCustomBg
    ? 'rounded-2xl p-6 transition-all duration-200 border border-[#222229]'
    : 'bg-[#111114] border border-[#222229] rounded-2xl p-6 transition-all duration-200 text-[#F4F4F5]';

  return (
    <div
      onClick={onClick}
      className={`${baseCardStyle} ${
        hoverEffect
          ? 'hover:-translate-y-0.5 hover:border-[#49406F] hover:bg-[#16161B] hover:shadow-subtle cursor-pointer'
          : 'shadow-subtle'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
