import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

export function Badge({ variant = 'default', pulse = false, children, className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    default: 'bg-slate-700/30 text-slate-300 border-slate-600/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {pulse && (
        <span className="flex w-2 h-2 mr-1.5 rounded-full relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'danger' ? 'bg-rose-400' :
            variant === 'success' ? 'bg-emerald-400' :
            variant === 'warning' ? 'bg-amber-400' : 'bg-current'
          }`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
             variant === 'danger' ? 'bg-rose-500' :
             variant === 'success' ? 'bg-emerald-500' :
             variant === 'warning' ? 'bg-amber-500' : 'bg-current'
          }`}></span>
        </span>
      )}
      {children}
    </span>
  );
}
