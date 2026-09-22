import React from 'react';

type CardVariant = 'panel' | 'card' | 'surface';
type CardSize    = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  hoverable?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  panel:  'glass-panel',
  card:   'glass-card',
  surface: 'glass-surface',
};

const sizeClasses: Record<CardSize, string> = {
  sm: 'rounded-xl p-4',
  md: 'rounded-2xl p-6',
  lg: 'rounded-3xl p-8',
};

export function Card({
  children,
  variant = 'card',
  size = 'md',
  className = '',
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${hoverable ? 'card-hover relative' : ''} ${className}`}
    >
      {hoverable && <span className="top-accent" />}
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`px-6 py-4 border-b border-[var(--border-subtle)] ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: CardProps) {
  return <h3 className={`font-display text-2xl text-white ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
