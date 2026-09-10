import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none';

  const variants = {
    primary: 'gradient-btn text-white',
    secondary: 'bg-white text-ink-primary border border-gray-200 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/50 shadow-sm',
    ghost: 'text-ink-secondary hover:text-brand-700 hover:bg-brand-50',
    outline: 'border border-brand-600 text-brand-700 hover:bg-brand-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs h-9 px-3 gap-1.5',
    md: 'text-sm h-11 px-5 gap-2',
    lg: 'text-base h-13 px-7 gap-2.5 font-semibold',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
