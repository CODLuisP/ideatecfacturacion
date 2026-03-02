import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'info', className?: string }) => {
  const variants = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border border-amber-100",
    error: "bg-rose-50 text-rose-600 border border-rose-100",
    info: "bg-blue-50 text-blue-600 border border-blue-100",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center", variants[variant], className)}>
      {children}
    </span>
  );
};
