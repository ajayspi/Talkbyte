import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'glow-btn',
  ghost:   'ghost-btn',
  danger:  'btn-danger',
  secondary: 'ghost-btn', // fallback; override in outer className if needed
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`relative ${variantClasses[variant]} ${sizeClasses[size]} text-sm font-bold uppercase tracking-[0.14em] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
