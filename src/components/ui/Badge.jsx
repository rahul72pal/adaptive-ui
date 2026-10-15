import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-all select-none';
  
  const variants = {
    default: 'bg-[#16161B] text-[#A1A1AA] border border-[#222229]',
    primary: 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]',
    ai: 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]',
    outline: 'bg-transparent text-[#8B7CFF] border border-[#49406F]',
    success: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-400 border border-amber-800/60',
    danger: 'bg-rose-950/60 text-rose-400 border border-rose-800/60',
    locked: 'bg-[#16161B] text-[#52525B] border border-[#222229]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
