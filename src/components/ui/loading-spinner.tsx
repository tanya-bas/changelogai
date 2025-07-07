
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  className, 
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={cn(
          "animate-spin border-2 border-blue-500 border-t-transparent rounded-full",
          sizeClasses[size],
          className
        )}
      />
      {text && (
        <p className="text-slate-600 mt-2">{text}</p>
      )}
    </div>
  );
};
