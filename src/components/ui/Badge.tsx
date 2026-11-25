import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'orange' | 'gray' | 'red' | 'blue';
  size?: 'sm' | 'xs';
}

const variantClasses = {
  green: 'bg-green-100 text-green-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-gray-100 text-gray-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-800',
};

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${
        size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      {children}
    </span>
  );
}
