import React from 'react';

type BadgeVariant = 'gold' | 'neutral' | 'success' | 'warning' | 'danger';
type BadgeSize    = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold:    'badge-gold',
  neutral: 'badge-neutral',
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const badgeClasses = `${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
  return <span className={badgeClasses}>{children}</span>;
}
