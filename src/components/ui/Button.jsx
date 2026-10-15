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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8B7CFF]/30 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:transform-none';

  const variants = {
    primary: 'bg-[#6558F5] hover:bg-[#7568FF] text-white border border-[#6558F5]/80 shadow-sm',
    secondary: 'bg-[#16161B] text-[#F4F4F5] border border-[#292932] hover:bg-[#1C1C23] hover:border-[#49406F] hover:text-[#8B7CFF] shadow-sm',
    ghost: 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C23]',
    outline: 'border border-[#49406F] text-[#8B7CFF] hover:bg-[#211C38] hover:border-[#8B7CFF]',
    danger: 'bg-rose-950/60 text-rose-300 border border-rose-900/80 hover:bg-rose-900/70 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs h-9 px-3 gap-1.5',
    md: 'text-sm h-11 px-5 gap-2',
    lg: 'text-base h-12 px-6 gap-2.5 font-semibold',
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

export default Button;
