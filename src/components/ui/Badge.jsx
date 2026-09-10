import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-all';
  
  const variants = {
    default: 'bg-surface-container text-ink-primary border border-surface-variant',
    primary: 'bg-brand-100 text-brand-700 border border-brand-200',
    ai: 'bg-brand-50 text-brand-600 border border-brand-200 shadow-sm',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    locked: 'bg-gray-100 text-gray-500 border border-gray-200',
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
